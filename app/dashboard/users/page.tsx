"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Edit, Eye, EyeOff, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUser, deleteUser, listUsers, updateUser } from "@/services/userService"
import { listRoles } from "@/services/roleService"
import type { Role } from "@/types/manager/role"
import type { User } from "@/types/manager/user"
import { cn } from "@/lib/utils"

type UserFormState = {
  id?: string
  name: string
  email: string
  phone: string
  password: string
  rolesIds: string[]
}

const emptyForm: UserFormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  rolesIds: [],
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<UserFormState>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
      const matchesRole = roleFilter === "all" || user.roles.some((role) => role.id === roleFilter)
      const matchesStatus = statusFilter === "all" || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [roleFilter, search, statusFilter, users])

  async function loadData() {
    setLoading(true)
    try {
      const [usersData, rolesData] = await Promise.all([listUsers(), listRoles()])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openCreateDialog() {
    setForm(emptyForm)
    setShowPassword(false)
    setOpen(true)
  }

  function openEditDialog(user: User) {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      password: "",
      rolesIds: user.roles.map((role) => role.id),
    })
    setShowPassword(false)
    setOpen(true)
  }

  function toggleRole(roleId: string) {
    setForm((current) => {
      const selected = current.rolesIds.includes(roleId)
      return {
        ...current,
        rolesIds: selected ? current.rolesIds.filter((id) => id !== roleId) : [...current.rolesIds, roleId],
      }
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (form.rolesIds.length === 0) {
      toast.error("Selecciona al menos un rol")
      return
    }

    if (!form.id && !form.password.trim()) {
      toast.error("La contrasena es requerida")
      return
    }

    setSaving(true)
    try {
      if (form.id) {
        await updateUser(form.id, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          rolesIds: form.rolesIds,
        })
        toast.success("Usuario actualizado")
      } else {
        await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          rolesIds: form.rolesIds,
        })
        toast.success("Usuario creado")
      }

      setOpen(false)
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar el usuario")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(user: User) {
    const confirmed = window.confirm(`Eliminar el usuario "${user.name}"?`)
    if (!confirmed) return

    try {
      await deleteUser(user.id)
      toast.success("Usuario eliminado")
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar el usuario")
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
          <h1 className="text-2xl font-bold text-foreground">Gestion de Usuarios</h1>
          <p className="text-muted-foreground">Administra usuarios y asigna roles de la empresa.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{form.id ? "Editar usuario" : "Crear usuario"}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="user-name">Nombre</Label>
                    <Input
                      id="user-name"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Nombre completo"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="user-phone">Telefono</Label>
                    <Input
                      id="user-phone"
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      placeholder="3000000000"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="user-email">Correo</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="correo@empresa.com"
                    disabled={Boolean(form.id)}
                    required
                  />
                </div>

                {!form.id && (
                  <div className="grid gap-2">
                    <Label htmlFor="user-password">Contrasena</Label>
                    <div className="relative">
                      <Input
                        id="user-password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                        placeholder="Contrasena temporal"
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Roles</Label>
                    <Badge variant="secondary">{form.rolesIds.length} seleccionados</Badge>
                  </div>
                  <div className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
                    {roles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Crea primero un rol para asignarlo a usuarios.</p>
                    ) : (
                      roles.map((role) => (
                        <label key={role.id} className="flex items-center gap-3 rounded-md bg-secondary/50 p-3 text-sm">
                          <Checkbox checked={form.rolesIds.includes(role.id)} onCheckedChange={() => toggleRole(role.id)} />
                          <span>{role.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || roles.length === 0}>
                  {saving ? "Guardando..." : "Guardar usuario"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o correo..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{filteredUsers.length} usuarios encontradoss</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Usuario</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Correo</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Telefono</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Roles</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Estado</th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 transition-colors hover:bg-secondary/50">
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-xs text-primary">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">{user.phone}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role.id} variant="outline" className="text-xs">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          user.status === "ACTIVE" ? "bg-accentActivd text-accentActivd-foreground" : "bg-destructive text-white"
                        )}
                      >
                        {user.status === "ACTIVE" ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="action" size="icon" className="h-8 w-8" onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-10 text-center text-sm text-muted-foreground">
                      No hay usuarios para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
