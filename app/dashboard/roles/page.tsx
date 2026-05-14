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
      const group = getPermissionGroup(permission.name)
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
      setPermissions(permissionsData)
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
          <p className="text-muted-foreground">Crea roles y asigna permisos para los usuarios de la empresa.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo rol
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl bg-card">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{form.id ? "Editar rol" : "Crear rol"}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="role-name">Nombre</Label>
                  <Input
                    id="role-name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ej: Coordinador SST"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role-description">Descripcion</Label>
                  <Textarea
                    id="role-description"
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
                  <div className="max-h-[360px] overflow-y-auto rounded-lg border border-border">
                    {Object.entries(groupedPermissions).map(([group, items]) => (
                      <div key={group} className="border-b border-border last:border-0 p-4">
                        <h3 className="mb-3 text-sm font-semibold text-foreground">{group}</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {items.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-center gap-3 rounded-md bg-secondary/50 p-3 text-sm"
                            >
                              <Checkbox
                                checked={form.permissionIds.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <span>{permission.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar rol"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                        <Shield className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">{role.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {normalizeRolePermissionIds(role, permissions).length} permisos
                        </p>
                      </div>
                    </div>
                    <Badge variant={role.status === "ACTIVE" ? "default" : "secondary"}>{role.status}</Badge>
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
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedRole)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(selectedRole)}>
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
