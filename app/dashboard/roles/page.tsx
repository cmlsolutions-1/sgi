//app/dashboard/roles/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Edit, Loader2, Plus, Shield, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SafeCloudFormDrawerFrame } from "@/components/ui/safecloud-form-drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createRole, deleteRole, getRoleById, listRoles, updateRole } from "@/services/roleService"
import { listPermissions } from "@/services/permissionService"
import type { Permission } from "@/types/manager/permission"
import type { Role } from "@/types/manager/role"
import { cn } from "@/lib/utils"

type RoleFormState = {
  id?: string
  name: string
  description: string
  permissionIds: string[]
}

const emptyForm: RoleFormState = {
  name: "",
  description: "",
  permissionIds: [],
}

function getPermissionGroup(permissionName: string) {
  const [, ...rest] = permissionName.split(" ")
  return rest.join(" ") || "Otros"
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function capitalizeFirst(value: string) {
  const normalized = value.trim()
  if (!normalized) return "Otros"
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function isSuperAdminPermission(permission: Permission) {
  const name = normalizeText(permission.name)

  return (
    name.includes("administrador de la plataforma") ||
    name.includes("empresas") ||
    name.includes("modulos para empresa")
  )
}

function normalizeRolePermissionIds(role: Role, permissions: Permission[]): string[] {
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
        .filter((permissionId): permissionId is string => Boolean(permissionId))
    )
  )
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [form, setForm] = useState<RoleFormState>(emptyForm)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0]
  const selectedRolePermissionIds = selectedRole ? normalizeRolePermissionIds(selectedRole, permissions) : []

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      const group = capitalizeFirst(getPermissionGroup(permission.name))
      groups[group] = groups[group] ?? []
      groups[group].push(permission)
      return groups
    }, {})
  }, [permissions])

  async function loadData() {
    setLoading(true)
    try {
      const [rolesData, permissionsData] = await Promise.all([listRoles(), listPermissions()])
      setRoles(rolesData)
      setPermissions(permissionsData.filter((permission) => !isSuperAdminPermission(permission)))
      setSelectedRoleId((current) => current ?? rolesData[0]?.id ?? null)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo cargar roles y permisos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openCreateDialog() {
    setForm(emptyForm)
    setOpen(true)
  }

  async function openEditDialog(role: Role) {
    setOpen(true)
    setForm({
      id: role.id,
      name: role.name,
      description: role.description ?? "",
      permissionIds: normalizeRolePermissionIds(role, permissions),
    })

    try {
      const roleDetail = await getRoleById(role.id)
      setForm({
        id: roleDetail.id,
        name: roleDetail.name,
        description: roleDetail.description ?? "",
        permissionIds: normalizeRolePermissionIds(roleDetail, permissions),
      })
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo cargar el detalle del rol")
    }
  }

  function togglePermission(permissionId: string) {
    setForm((current) => {
      const selected = current.permissionIds.includes(permissionId)
      return {
        ...current,
        permissionIds: selected
          ? current.permissionIds.filter((id) => id !== permissionId)
          : [...current.permissionIds, permissionId],
      }
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error("El nombre del rol es requerido")
      return
    }

    if (form.permissionIds.length === 0) {
      toast.error("Selecciona al menos un permiso")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        permissionIds: form.permissionIds,
      }

      if (form.id) {
        await updateRole(form.id, payload)
        toast.success("Rol actualizado")
      } else {
        const created = await createRole(payload)
        setSelectedRoleId(created.id)
        toast.success("Rol creado")
      }

      setOpen(false)
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar el rol")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(role: Role) {
    const confirmed = window.confirm(`Eliminar el rol "${role.name}"?`)
    if (!confirmed) return

    try {
      await deleteRole(role.id)
      toast.success("Rol eliminado")
      setSelectedRoleId(null)
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar el rol")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion de Roles</h1>
          <p className="text-muted-foreground">Crea roles, visualiza y asigna permisos para los usuarios de la empresa.</p>
        </div>

        <SafeCloudFormDrawerFrame
          open={open}
          onOpenChange={setOpen}
          trigger={<Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo rol
            </Button>}
        >
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-6 py-4 pr-12">
                <DialogTitle className="text-lg">{form.id ? "Editar rol" : "Crear rol"}</DialogTitle>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="role-name" className="text-sm">Nombre</Label>
                  <Input
                    id="role-name"
                    className="h-10 text-sm"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ej: Coordinador SST"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role-description" className="text-sm">Descripcion</Label>
                  <Textarea
                    id="role-description"
                    className="min-h-20 resize-y text-sm"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Describe el alcance del rol"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Permisos</Label>
                    <Badge variant="secondary">{form.permissionIds.length} seleccionados</Badge>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    {Object.entries(groupedPermissions).map(([group, items]) => (
                      <div key={group} className="border-b border-border p-3 last:border-0">
                        <h3 className="mb-2 text-sm font-semibold text-foreground">{group}</h3>
                        <div className="grid gap-2">
                          {items.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex min-w-0 items-center gap-2.5 rounded-md bg-secondary/50 px-3 py-2.5 text-sm leading-snug"
                            >
                              <Checkbox
                                checked={form.permissionIds.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <span className="min-w-0 break-words">{permission.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar rol"}
                </Button>
              </DialogFooter>
            </form>
        </SafeCloudFormDrawerFrame>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Roles disponibles</h2>
          {roles.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="p-6 text-sm text-muted-foreground">Aun no hay roles creados.</CardContent>
            </Card>
          ) : (
            roles.map((role) => (
              <Card
                key={role.id}
                className={cn(
                  "cursor-pointer border-border bg-card transition-colors hover:border-primary/50",
                  selectedRole?.id === role.id && "border-primary"
                )}
                onClick={() => setSelectedRoleId(role.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
                        <Shield className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-medium">{role.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {normalizeRolePermissionIds(role, permissions).length} permisos
                        </p>
                      </div>
                    </div>
                    <Badge className="shrink-0" variant={role.status === "ACTIVE" ? "accentActivd" : "destructive"}>
                      {role.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="border-border bg-card">
            <CardHeader>
              {selectedRole ? (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{selectedRole.name}</CardTitle>
                    <CardDescription>{selectedRole.description || "Sin descripcion registrada"}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="action" size="sm" onClick={() => openEditDialog(selectedRole)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedRole)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ) : (
                <CardTitle>Selecciona un rol</CardTitle>
              )}
            </CardHeader>
            <CardContent>
              {selectedRole ? (
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([group, items]) => {
                    const selectedCount = items.filter((permission) =>
                      selectedRolePermissionIds.includes(permission.id)
                    ).length
                    if (selectedCount === 0) return null

                    return (
                      <div key={group} className="rounded-lg border border-border p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="font-medium">{group}</h3>
                          <Badge variant="secondary">
                            {selectedCount}/{items.length}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items
                            .filter((permission) => selectedRolePermissionIds.includes(permission.id))
                            .map((permission) => (
                              <Badge key={permission.id} variant="outline">
                                {permission.name}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Crea un rol para asignar permisos.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
