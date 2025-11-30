"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Shield, Users, FileText, Upload, Eye, Pencil, Trash2, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface Permission {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

interface RoleConfig {
  id: string
  name: string
  description: string
  color: string
  userCount: number
  permissions: Record<string, boolean>
}

const permissions: Permission[] = [
  {
    id: "view_dashboard",
    name: "Ver Dashboard",
    description: "Acceso al panel principal",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    id: "manage_users",
    name: "Gestionar Usuarios",
    description: "Crear, editar y eliminar usuarios",
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "manage_documents",
    name: "Gestionar Documentos",
    description: "Administrar documentación",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "upload_files",
    name: "Cargar Archivos",
    description: "Subir nuevos archivos al sistema",
    icon: <Upload className="h-4 w-4" />,
  },
  {
    id: "edit_employees",
    name: "Editar Funcionarios",
    description: "Modificar hojas de vida",
    icon: <Pencil className="h-4 w-4" />,
  },
  {
    id: "delete_records",
    name: "Eliminar Registros",
    description: "Eliminar información del sistema",
    icon: <Trash2 className="h-4 w-4" />,
  },
  {
    id: "system_settings",
    name: "Configuración",
    description: "Acceso a configuración del sistema",
    icon: <Settings className="h-4 w-4" />,
  },
]

const initialRoles: RoleConfig[] = [
  {
    id: "admin",
    name: "Administrador",
    description: "Acceso completo al sistema",
    color: "bg-primary",
    userCount: 1,
    permissions: {
      view_dashboard: true,
      manage_users: true,
      manage_documents: true,
      upload_files: true,
      edit_employees: true,
      delete_records: true,
      system_settings: true,
    },
  },
  {
    id: "auditor",
    name: "Auditor",
    description: "Gestión de auditorías y documentos",
    color: "bg-accent",
    userCount: 2,
    permissions: {
      view_dashboard: true,
      manage_users: false,
      manage_documents: true,
      upload_files: true,
      edit_employees: false,
      delete_records: false,
      system_settings: false,
    },
  },
  {
    id: "supervisor",
    name: "Supervisor",
    description: "Supervisión de área y personal",
    color: "bg-warning",
    userCount: 2,
    permissions: {
      view_dashboard: true,
      manage_users: false,
      manage_documents: true,
      upload_files: true,
      edit_employees: true,
      delete_records: false,
      system_settings: false,
    },
  },
  {
    id: "empleado",
    name: "Empleado",
    description: "Acceso básico de consulta",
    color: "bg-muted-foreground",
    userCount: 3,
    permissions: {
      view_dashboard: true,
      manage_users: false,
      manage_documents: false,
      upload_files: false,
      edit_employees: false,
      delete_records: false,
      system_settings: false,
    },
  },
]

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleConfig[]>(initialRoles)
  const [selectedRole, setSelectedRole] = useState<RoleConfig>(roles[0])

  const handlePermissionChange = (permissionId: string, enabled: boolean) => {
    const updated = roles.map((role) => {
      if (role.id === selectedRole.id) {
        return {
          ...role,
          permissions: { ...role.permissions, [permissionId]: enabled },
        }
      }
      return role
    })
    setRoles(updated)
    setSelectedRole(updated.find((r) => r.id === selectedRole.id)!)
  }

  const countPermissions = (role: RoleConfig) => {
    return Object.values(role.permissions).filter(Boolean).length
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Roles</h1>
        <p className="text-muted-foreground">Configura los permisos para cada rol del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Roles Disponibles</h2>
          {roles.map((role) => (
            <Card
              key={role.id}
              className={cn(
                "bg-card border-border cursor-pointer transition-all hover:border-primary/50",
                selectedRole.id === role.id && "border-primary",
              )}
              onClick={() => setSelectedRole(role)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", role.color)}>
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{role.name}</h3>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <Badge variant="secondary" className="text-xs">
                    {role.userCount} usuarios
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {countPermissions(role)}/{permissions.length} permisos
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permissions Panel */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", selectedRole.color)}>
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>{selectedRole.name}</CardTitle>
                  <CardDescription>{selectedRole.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Permisos</h3>
              <div className="space-y-3">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {permission.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{permission.name}</p>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={selectedRole.permissions[permission.id]}
                      onCheckedChange={(checked) => handlePermissionChange(permission.id, checked)}
                      disabled={selectedRole.id === "admin"}
                    />
                  </div>
                ))}
              </div>
              {selectedRole.id === "admin" && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  El rol de Administrador tiene todos los permisos y no puede ser modificado.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
