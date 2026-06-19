// components/manager/super-admin/SuperAdminDashboard.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { ManageModulesDialog } from "@/components/manager/super-admin/dialogs/ManageModulesDialog"
import { getModulesByCompany } from "@/services/modulesService"
import { listPermissions } from "@/services/permissionService"
import { createRole, listRolesByCompany, updateRoleBySystemAdmin } from "@/services/roleService"
import type { Company } from "@/types/manager/super-admin"
import type { Module } from "@/types/manager/module"
import type { Permission } from "@/types/manager/permission"
import type { Role } from "@/types/manager/role"

function collectModuleIds(modules: Module[]): string[] {
  return modules.flatMap((module) => [
    module.id,
    ...(module.children?.map((child) => child.id) ?? []),
  ])
}
function getPermissionGroup(permissionName: string) {
  const [, ...rest] = permissionName.split(" ")
  return rest.join(" ").trim() || "General"
}

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
    refreshCompanies,
    updateCompanyInList,
  } = useSuperAdmin()

  const {
    users,
    loading: usersLoading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  } = useUsers(selectedCompany?.id, false)

  const [modulesOpen, setModulesOpen] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [adminCompanyRole, setAdminCompanyRole] = useState<Role | null>(null)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [savingPermissions, setSavingPermissions] = useState(false)

  // ✅ Seleccionar primera empresa automáticamente
  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      selectCompany(companies[0])
    }
  }, [companies, selectedCompany, selectCompany])

  // ✅ Función PURA: solo obtiene módulos, NO actualiza estado
  // Esto evita dependencias circulares
  const fetchCompanyModules = useCallback(async (companyId: string): Promise<string[]> => {
    try {
      const modulesData = await getModulesByCompany(companyId)
      return collectModuleIds(modulesData)
    } catch (err) {
      console.error("Error cargando módulos:", err)
      return []
    }
  }, [])

  // ✅ Cargar detalles cuando cambia el ID de la empresa
  useEffect(() => {
    const loadCompanyDetails = async () => {
      if (!selectedCompany) return

      console.log("🔄 Cargando detalles para empresa:", selectedCompany.id)

      // Obtener módulos (fetch puro)
      const activeModuleIds = await fetchCompanyModules(selectedCompany.id)

      console.log("✅ Módulos obtenidos:", activeModuleIds)

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

    loadCompanyDetails()
  }, [selectedCompany?.id, fetchCompanyModules, selectCompany, updateCompanyInList, fetchUsers])

  async function handleLogout() {
    await doLogout()
  }

  const handleRefreshAll = async (activeModuleIdsFromSave?: string[]) => {
    if (!selectedCompany) return

    const activeModuleIds = activeModuleIdsFromSave ?? await fetchCompanyModules(selectedCompany.id)
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
  }

  const hasActiveModules = selectedCompany
    ? selectedCompany.activeModules.length > 0
    : false

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      const group = getPermissionGroup(permission.name)
      groups[group] = groups[group] ?? []
      groups[group].push(permission)
      return groups
    }, {})
  }, [permissions])

  const permissionGroups = useMemo(() => Object.keys(groupedPermissions).sort(), [groupedPermissions])

  const loadAdminCompanyPermissions = useCallback(async () => {
    if (!selectedCompany) {
      setAdminCompanyRole(null)
      setSelectedPermissionIds([])
      return
    }

    setLoadingPermissions(true)
    try {
      const [permissionsData, rolesData] = await Promise.all([
        listPermissions(),
        listRolesByCompany(selectedCompany.id),
      ])
      const role = rolesData.find((item) => item.name === "ADMIN_COMPANY") ?? null

      setPermissions(permissionsData)
      setAdminCompanyRole(role)
      setSelectedPermissionIds(normalizeRolePermissionIds(role, permissionsData))
    } catch (error: any) {
      toast.error(error.message ?? "No se pudieron cargar los permisos")
    } finally {
      setLoadingPermissions(false)
    }
  }, [selectedCompany])

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

  function togglePermissionGroup(group: string) {
    const groupIds = (groupedPermissions[group] ?? []).map((permission) => permission.id)
    const allSelected = groupIds.every((id) => selectedPermissionIds.includes(id))

    setSelectedPermissionIds((current) =>
      allSelected
        ? current.filter((id) => !groupIds.includes(id))
        : Array.from(new Set([...current, ...groupIds])),
    )
  }

  async function handleSaveAdminCompanyPermissions() {
    if (!selectedCompany) {
      toast.error("Selecciona una empresa")
      return
    }

    if (selectedPermissionIds.length === 0) {
      toast.error("Selecciona al menos un permiso")
      return
    }

    setSavingPermissions(true)
    try {
      const payload = {
        name: "ADMIN_COMPANY",
        description: "Administrador de empresa",
        permissionIds: selectedPermissionIds,
      }

      if (adminCompanyRole) {
        await updateRoleBySystemAdmin(adminCompanyRole.id, selectedCompany.id, payload)
      } else {
        const created = await createRole(payload)
        setAdminCompanyRole(created)
      }

      toast.success("Permisos de ADMIN_COMPANY actualizados")
      await loadAdminCompanyPermissions()
    } catch (error: any) {
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

      <CiiuCard
        ciiu={ciiu.ciiu}
        setCiiu={ciiu.setCiiu}
        ciiuResults={ciiu.ciiuResults}
        ciiuError={ciiu.ciiuError}
        onConsultar={ciiu.consultar}
        onLimpiar={ciiu.limpiar}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CompaniesCard
            companies={companies}
            selectedCompany={selectedCompany}
            onSelect={selectCompany}
            onCreateCompany={handleCreateCompany}
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
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            onRefresh={fetchUsers}
            onOpenModules={() => setModulesOpen(true)}
          />
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <ShieldCheck className="h-5 w-5" />
                Permisos ADMIN_COMPANY
              </CardTitle>
              <CardDescription>
                Activa los permisos del rol administrador de la empresa seleccionada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedCompany ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Selecciona una empresa para gestionar sus permisos.
                </div>
              ) : loadingPermissions ? (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Cargando permisos...
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      {selectedCompany.name}
                    </div>
                    <Badge variant="secondary">{selectedPermissionIds.length} permisos</Badge>
                  </div>

                  <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                    {permissionGroups.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No hay permisos disponibles.
                      </div>
                    ) : (
                      permissionGroups.map((group) => {
                        const items = groupedPermissions[group] ?? []
                        const selectedCount = items.filter((permission) => selectedPermissionIds.includes(permission.id)).length

                        return (
                          <div key={group} className="rounded-lg border border-border bg-white p-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => togglePermissionGroup(group)}
                                className="text-left text-sm font-semibold text-foreground hover:text-primary"
                              >
                                {group}
                              </button>
                              <Badge variant="outline" className="text-xs">
                                {selectedCount}/{items.length}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {items.map((permission) => (
                                <label key={permission.id} className="flex items-center gap-3 rounded-md bg-secondary/40 p-2 text-sm">
                                  <Checkbox
                                    checked={selectedPermissionIds.includes(permission.id)}
                                    onCheckedChange={() => togglePermission(permission.id)}
                                  />
                                  <span>{permission.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <Button
                    type="button"
                    className="w-full gap-2"
                    onClick={handleSaveAdminCompanyPermissions}
                    disabled={savingPermissions || permissions.length === 0}
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
