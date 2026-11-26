// components/manager/super-admin/SuperAdminDashboard.tsx
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Loader2, LogOut, Save, ShieldCheck } from "lucide-react"
import { doLogout } from "@/lib/auth/logout"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

import { useSuperAdmin } from "@/hooks/manager/useSuperAdmin"
import { useCiiu } from "@/hooks/manager/useCiiu"
import { useUsers } from "@/hooks/useUsers"

import { CiiuCard } from "@/components/manager/super-admin/dialogs/CiiuCard"
import { CompaniesCard } from "@/components/manager/super-admin/dialogs/CompaniesCard"
import { UsersCard } from "@/components/manager/super-admin/UsersCard"
import { SubscriptionManager } from "@/components/subscriptions/subscription-manager"
import { ManageModulesDialog } from "@/components/manager/super-admin/dialogs/ManageModulesDialog"
import { getModulesByCompany, listModules } from "@/services/modulesService"
import { listPermissions } from "@/services/permissionService"
import { listRolesByCompany, RolePermissionScopeError, updateRoleBySystemAdmin } from "@/services/roleService"
import { activeParentModuleIds } from "@/lib/company-modules"
import { groupCompanyPermissions, selectedInactiveParentPermissions } from "@/lib/manager/permission-groups"
import type { Company } from "@/types/manager/super-admin"
import type { Module } from "@/types/manager/module"
import type { Permission } from "@/types/manager/permission"
import type { Role } from "@/types/manager/role"

function normalizeRolePermissionIds(role: Role | null, permissions: Permission[]): string[] {
  if (!role) return []

  const permissionById = new Map(permissions.map((permission) => [permission.id, permission]))
  const permissionByName = new Map(permissions.map((permission) => [permission.name.toLowerCase(), permission]))

  return Array.from(
    new Set(
      (role.permissions ?? [])
        .map((permission) => {
          if (typeof permission === "string") {
            if (permissionById.has(permission)) return permission
            return permissionByName.get(permission.toLowerCase())?.id ?? null
          }

          if (permission.id && permissionById.has(permission.id)) return permission.id
          if (permission.name) return permissionByName.get(permission.name.toLowerCase())?.id ?? null

          return null
        })
        .filter((permissionId): permissionId is string => Boolean(permissionId)),
    ),
  )
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const ciiu = useCiiu()

  const {
    companies,
    selectedCompany,
    stats,
    selectCompany,
    createCompany,
    updateCompany,
    toggleCompanyStatus,
    refreshCompanies,
    updateCompanyInList,
  } = useSuperAdmin()

  const {
    users,
    loading: usersLoading,
    fetchUsers,
    createUser,
    updateAdmin,
    changeAdminPassword,
  } = useUsers(selectedCompany?.id, false)

  const [modulesOpen, setModulesOpen] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [adminCompanyRole, setAdminCompanyRole] = useState<Role | null>(null)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [moduleCatalog, setModuleCatalog] = useState<Module[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [permissionsError, setPermissionsError] = useState<string | null>(null)
  const [rejectedPermissionIds, setRejectedPermissionIds] = useState<string[]>([])
  const permissionsRequest = useRef(0)
  const selectedCompanyId = useRef(selectedCompany?.id)
  selectedCompanyId.current = selectedCompany?.id

  // ✅ Seleccionar primera empresa automáticamente
  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      selectCompany(companies[0])
    }
  }, [companies, selectedCompany, selectCompany])

  const loadModuleCatalog = useCallback(async () => {
    setLoadingCatalog(true); setCatalogError(null)
    try { setModuleCatalog(await listModules()) }
    catch (error) { setCatalogError((error as Error).message ?? "No se pudo cargar el catálogo de módulos") }
    finally { setLoadingCatalog(false) }
  }, [])

  useEffect(() => { void loadModuleCatalog() }, [loadModuleCatalog])

  // ✅ Función PURA: solo obtiene módulos, NO actualiza estado
  // Esto evita dependencias circulares
  const fetchCompanyModules = useCallback(async (companyId: string): Promise<string[]> => {
    try {
      const [moduleCatalog, modulesData] = await Promise.all([listModules(), getModulesByCompany(companyId)])
      return activeParentModuleIds(modulesData, moduleCatalog)
    } catch (err) {
      console.error("Error cargando módulos:", err)
      throw err
    }
  }, [])

  // ✅ Cargar detalles cuando cambia el ID de la empresa
  useEffect(() => {
    let cancelled = false
    const loadCompanyDetails = async () => {
      if (!selectedCompany) return

      // Obtener módulos (fetch puro)
      const activeModuleIds = await fetchCompanyModules(selectedCompany.id)
      if (cancelled) return

      // Actualizar selectedCompany
      const updatedCompany: Company = {
        ...selectedCompany,
        activeModules: activeModuleIds,
      }
      selectCompany(updatedCompany)

      // Actualizar en la lista
      updateCompanyInList(updatedCompany)

      // Cargar usuarios
      await fetchUsers()
    }

    loadCompanyDetails().catch(error => { if (!cancelled) toast.error(error.message ?? "No se pudieron cargar los módulos") })
    return () => { cancelled = true }
  }, [selectedCompany?.id, fetchCompanyModules, selectCompany, updateCompanyInList, fetchUsers])

  async function handleLogout() {
    await doLogout()
  }

  const handleRefreshAll = async (activeModuleIdsFromSave?: string[]) => {
    if (!selectedCompany) return

    const activeModuleIds = activeModuleIdsFromSave ?? await fetchCompanyModules(selectedCompany.id)
    if (selectedCompanyId.current !== selectedCompany.id) return
    const updatedCompany: Company = {
      ...selectedCompany,
      activeModules: activeModuleIds,
    }
    selectCompany(updatedCompany)
    updateCompanyInList(updatedCompany)

    if (!activeModuleIdsFromSave) {
      await refreshCompanies()
    }

    await fetchUsers()
    await loadAdminCompanyPermissions()
  }

  const hasActiveModules = selectedCompany
    ? selectedCompany.activeModules.length > 0
    : false

  const permissionHierarchy = useMemo(() => groupCompanyPermissions(permissions, moduleCatalog), [permissions, moduleCatalog])
  const blockedPermissionIds = useMemo(() => new Set([
    ...selectedInactiveParentPermissions(permissions, moduleCatalog, selectedCompany?.activeModules ?? [], selectedPermissionIds).map(permission => permission.id),
    ...rejectedPermissionIds.filter(id => selectedPermissionIds.includes(id)),
  ]), [permissions, moduleCatalog, selectedCompany?.activeModules, selectedPermissionIds, rejectedPermissionIds])

  const loadAdminCompanyPermissions = useCallback(async () => {
    const request = ++permissionsRequest.current
    if (!selectedCompany) {
      setAdminCompanyRole(null)
      setSelectedPermissionIds([])
      return
    }

    setLoadingPermissions(true)
    setPermissionsError(null)
    setRejectedPermissionIds([])
    setAdminCompanyRole(null)
    setSelectedPermissionIds([])
    setPermissions([])
    try {
      const [permissionsData, rolesData] = await Promise.all([
        listPermissions(),
        listRolesByCompany(selectedCompany.id),
      ])
      const role = rolesData.find((item) => item.name === "ADMIN_COMPANY") ?? null
      if (request !== permissionsRequest.current || selectedCompanyId.current !== selectedCompany.id) return
      setPermissions(permissionsData)
      setAdminCompanyRole(role)
      setSelectedPermissionIds(normalizeRolePermissionIds(role, permissionsData))
    } catch (error: any) {
      if (request !== permissionsRequest.current) return
      setPermissionsError(error.message ?? "No se pudieron cargar los permisos")
      toast.error(error.message ?? "No se pudieron cargar los permisos")
    } finally {
      if (request === permissionsRequest.current) setLoadingPermissions(false)
    }
  }, [selectedCompany?.id])

  useEffect(() => {
    loadAdminCompanyPermissions()
  }, [loadAdminCompanyPermissions])

  function togglePermission(permissionId: string) {
    setSelectedPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId],
    )
  }

  function togglePermissionGroup(items: Permission[], enabled = true) {
    const groupIds = items.map((permission) => permission.id)
    const allSelected = groupIds.every((id) => selectedPermissionIds.includes(id))

    setSelectedPermissionIds((current) =>
      allSelected || !enabled
        ? current.filter((id) => !groupIds.includes(id))
        : Array.from(new Set([...current, ...groupIds])),
    )
  }

  async function handleSaveAdminCompanyPermissions() {
    if (!selectedCompany) {
      toast.error("Selecciona una empresa")
      return
    }

    if (!adminCompanyRole || loadingPermissions || savingPermissions || permissionsError || catalogError || loadingCatalog) {
      toast.error("No se puede guardar sin cargar el rol ADMIN_COMPANY de esta empresa")
      return
    }

    if (blockedPermissionIds.size) {
      toast.error("Revisa los permisos señalados: habilita su módulo padre o retíralos de la selección antes de guardar.")
      return
    }

    setSavingPermissions(true)
    try {
      const assigned = await getModulesByCompany(selectedCompany.id)
      if (selectedCompanyId.current !== selectedCompany.id) return
      const activeModules = activeParentModuleIds(assigned, moduleCatalog)
      const updatedCompany = { ...selectedCompany, activeModules }
      selectCompany(updatedCompany)
      updateCompanyInList(updatedCompany)
      if (selectedInactiveParentPermissions(permissions, moduleCatalog, activeModules, selectedPermissionIds).length) {
        toast.error("Los módulos activos de la empresa cambiaron. Revisa los permisos señalados antes de guardar.")
        return
      }
      const payload = {
        name: "ADMIN_COMPANY",
        description: adminCompanyRole.description ?? "Administrador de empresa",
        permissionIds: selectedPermissionIds,
      }

      await updateRoleBySystemAdmin(adminCompanyRole.id, selectedCompany.id, payload)
      if (selectedCompanyId.current !== selectedCompany.id) return
      toast.success("Permisos de ADMIN_COMPANY actualizados")
      await loadAdminCompanyPermissions()
    } catch (error: any) {
      if (selectedCompanyId.current !== selectedCompany.id) return
      if (error instanceof RolePermissionScopeError && error.rejectedPermissionIds.length) {
        setRejectedPermissionIds(error.rejectedPermissionIds)
        toast.error(`El servidor rechazó ${error.rejectedPermissionIds.length} permisos. Revisa el detalle señalado en el panel.`)
        return
      }
      toast.error(error.message ?? "No se pudieron guardar los permisos")
    } finally {
      setSavingPermissions(false)
    }
  }


  const handleCreateCompany = async (payload: {
    name: string
    nit: string
    address: string
    phone: string
    email: string
    status: "active" | "inactive"
  }) => {
    await createCompany(payload)
  }

  const handleUpdateCompany = async (company: Company, payload: {
    name: string
    nit: string
    address: string
    phone: string
    email: string
  }) => {
    try {
      await updateCompany(company, payload)
      toast.success("Empresa actualizada correctamente")
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar la empresa")
      throw error
    }
  }

  const handleToggleCompanyStatus = async (company: Company) => {
    try {
      await toggleCompanyStatus(company)
      toast.success(company.status === "active" ? "Empresa inactivada correctamente" : "Empresa activada correctamente")
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar el estado de la empresa")
    }
  }

  return (
    <div className="min-h-dvh bg-background p-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">
            Panel de Super Usuario Empresarial
          </h1>
          <p className="text-muted-foreground text-lg">
            Gestionar empresas, usuarios y módulos
          </p>
        </div>

        <Button
          onClick={handleLogout}
          className="bg-red-400 text-white hover:bg-red-500 active:bg-red-600 flex items-center gap-2"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">Total Empresas</CardDescription>
            <CardTitle className="text-3xl text-foreground">{stats.totalCompanies}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">Empresas Activas</CardDescription>
            <CardTitle className="text-3xl text-foreground">{stats.activeCompanies}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">Total Usuarios</CardDescription>
            <CardTitle className="text-3xl text-foreground">{stats.totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">Módulos Promedio</CardDescription>
            <CardTitle className="text-3xl text-foreground">{stats.avgModulesPerCompany}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <SubscriptionManager company={selectedCompany} />

      <CiiuCard
        ciiu={ciiu.ciiu}
        setCiiu={ciiu.setCiiu}
        ciiuResults={ciiu.ciiuResults}
        ciiuError={ciiu.ciiuError}
        onConsultar={ciiu.consultar}
        onLimpiar={ciiu.limpiar}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2 space-y-6">
          <CompaniesCard
            companies={companies}
            selectedCompany={selectedCompany}
            onSelect={selectCompany}
            onCreateCompany={handleCreateCompany}
            onUpdateCompany={handleUpdateCompany}
            onToggleCompanyStatus={handleToggleCompanyStatus}
            getActiveParentModuleCount={(company) => new Set(company.activeModules.filter(id => moduleCatalog.some(module => module.id === id && module.parentId === null))).size}
            onOpenModules={(company) => {
              selectCompany(company)
              setModulesOpen(true)
            }}
          />

          <UsersCard
            companyName={selectedCompany?.name}
            hasCompanySelected={Boolean(selectedCompany)}
            hasActiveModules={hasActiveModules}
            users={users}
            loading={usersLoading}
            onCreateUser={createUser}
            onUpdateAdmin={updateAdmin}
            onChangeAdminPassword={changeAdminPassword}
            onRefresh={fetchUsers}
            onOpenModules={() => setModulesOpen(true)}
          />
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="min-w-0 bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <ShieldCheck className="h-5 w-5" />
                Permisos ADMIN_COMPANY
              </CardTitle>
              <CardDescription>
                Accesos del rol administrador, organizados por módulo padre y submódulo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedCompany ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Selecciona una empresa para gestionar sus permisos.
                </div>
              ) : loadingPermissions || loadingCatalog ? (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Cargando permisos...
                </div>
              ) : catalogError ? (
                <div role="alert" className="space-y-3 text-sm text-destructive"><p>{catalogError}</p><Button variant="outline" onClick={loadModuleCatalog}>Reintentar</Button></div>
              ) : permissionsError ? (
                <div role="alert" className="space-y-3 text-sm text-destructive"><p>{permissionsError}</p><Button variant="outline" onClick={loadAdminCompanyPermissions}>Reintentar</Button></div>
              ) : !adminCompanyRole ? (
                <p role="alert" className="text-sm text-muted-foreground">Esta empresa no tiene un rol ADMIN_COMPANY disponible. No se creará un rol en otra empresa.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      {selectedCompany.name}
                    </div>
                    <Badge variant="secondary">{selectedPermissionIds.length} {selectedPermissionIds.length === 1 ? "permiso" : "permisos"}</Badge>
                  </div>

                  {blockedPermissionIds.size > 0 && <section role="alert" className="space-y-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                    <h4 className="font-semibold">Permisos que requieren revisión ({blockedPermissionIds.size})</h4>
                    <p>La selección contiene permisos de padres inactivos o rechazados por el servidor. No se ha guardado ningún cambio.</p>
                    <ul className="max-h-36 list-disc space-y-1 overflow-y-auto pl-4">{[...blockedPermissionIds].map(id => <li key={id}>{permissions.find(permission => permission.id === id)?.name ?? `Permiso ${id}`}</li>)}</ul>
                    <Button variant="outline" className="h-auto w-full whitespace-normal border-red-300 text-red-900 hover:bg-red-100" disabled={savingPermissions} onClick={() => setSelectedPermissionIds(current => current.filter(id => !blockedPermissionIds.has(id)))}>Retirar estos permisos de la selección</Button>
                    <p className="text-xs">Luego revisa la selección y pulsa Guardar permisos. Si necesitas esos accesos, verifica primero la activación de su padre y vuelve a consultar los permisos.</p>
                    {!!rejectedPermissionIds.length && <Button variant="ghost" size="sm" disabled={savingPermissions} onClick={loadAdminCompanyPermissions}>Volver a consultar permisos</Button>}
                  </section>}

                  <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                    {permissions.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No hay permisos disponibles.
                      </div>
                    ) : (
                      <>
                        {permissionHierarchy.groups.map(({ parent, children }) => {
                          const active = selectedCompany.activeModules.includes(parent.id)
                          const items = children.flatMap(child => child.permissions)
                          const selectedCount = items.filter(permission => selectedPermissionIds.includes(permission.id)).length
                          return <details key={parent.id} open={active || selectedCount > 0} className="border-b border-border pb-3">
                            <summary className="cursor-pointer py-2 text-sm font-semibold text-foreground"><span>{parent.name}</span><span className={`ml-2 text-xs font-normal ${active ? "text-green-700" : "text-muted-foreground"}`}>{active ? "Padre activo" : "Padre inactivo"} · {selectedCount}/{items.length}</span></summary>
                            {children.filter(child => child.permissions.length).map(({ child, permissions: childPermissions }) => {
                              const count = childPermissions.filter(permission => selectedPermissionIds.includes(permission.id)).length
                              return <fieldset key={child.id} className="mt-2 min-w-0 border-l-2 border-sky-200 pl-3">
                                <legend className="max-w-full py-1 text-sm font-medium">{child.name}</legend>
                                <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Checkbox aria-label={`Todos los permisos de ${parent.name}: ${child.name}`} checked={count === childPermissions.length ? true : count ? "indeterminate" : false} disabled={savingPermissions || (!active && count === 0)} onCheckedChange={() => togglePermissionGroup(childPermissions, active)} />Todos los permisos <span>({count}/{childPermissions.length})</span></label>
                                <div className="space-y-1">{childPermissions.map(permission => <label key={permission.id} className="flex items-start gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-secondary/40"><Checkbox className="mt-0.5 shrink-0" checked={selectedPermissionIds.includes(permission.id)} disabled={savingPermissions || (!active && !selectedPermissionIds.includes(permission.id))} onCheckedChange={() => togglePermission(permission.id)} /><span className="min-w-0 break-words">{permission.name}</span></label>)}</div>
                              </fieldset>
                            })}
                          </details>
                        })}
                        {!!permissionHierarchy.unknown.length && <section className="border-t pt-3"><h4 className="text-sm font-semibold">Sin submódulo identificado</h4><p className="mt-1 text-xs text-muted-foreground">El catálogo no permite identificar su módulo. No se habilitan nuevas asignaciones desde este grupo.</p>{permissionHierarchy.unknown.map(permission => <label key={permission.id} className="flex items-start gap-2 py-2 text-sm"><Checkbox checked={selectedPermissionIds.includes(permission.id)} disabled={savingPermissions || !selectedPermissionIds.includes(permission.id)} onCheckedChange={() => togglePermission(permission.id)} /><span className="min-w-0 break-words">{permission.name}</span></label>)}</section>}
                      </>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="w-full gap-2"
                    onClick={handleSaveAdminCompanyPermissions}
                    disabled={savingPermissions || loadingPermissions || !moduleCatalog.length}
                  >
                    {savingPermissions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar permisos
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ManageModulesDialog
        open={modulesOpen}
        onOpenChange={setModulesOpen}
        company={selectedCompany}
        onRefresh={handleRefreshAll}
      />
    </div>
  )
}
