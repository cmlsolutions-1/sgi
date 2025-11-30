"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserFormDialog, EditUserButton } from "@/components/dashboard/user-form-dialog"
import { mockUsers, roles, departments, type User, type Role } from "@/lib/mock-data"
import { Search, Trash2, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

const roleColors: Record<Role, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  auditor: "bg-accent/10 text-accent border-accent/20",
  supervisor: "bg-warning/10 text-warning border-warning/20",
  empleado: "bg-muted text-muted-foreground border-border",
}

const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  auditor: "Auditor",
  supervisor: "Supervisor",
  empleado: "Empleado",
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesDept = departmentFilter === "all" || user.department === departmentFilter
    return matchesSearch && matchesRole && matchesDept
  })

  const handleSaveUser = (userData: Partial<User>) => {
    const existingIndex = users.findIndex((u) => u.id === userData.id)
    if (existingIndex >= 0) {
      const updated = [...users]
      updated[existingIndex] = { ...updated[existingIndex], ...userData } as User
      setUsers(updated)
    } else {
      setUsers([...users, userData as User])
    }
  }

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>
        <UserFormDialog onSave={handleSaveUser} />
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary border-0"
              />
            </div>
            <div className="flex gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px] bg-secondary border-0">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px] bg-secondary border-0">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{filteredUsers.length} usuarios encontrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Correo</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Rol</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Departamento</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Estado</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Creado</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className={cn("text-xs", roleColors[user.role])}>
                        {roleLabels[user.role]}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{user.department}</td>
                    <td className="py-3 px-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          user.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {user.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{user.createdAt}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-1">
                        <EditUserButton user={user} onSave={handleSaveUser} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
