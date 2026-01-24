// components/manager/super-admin/UsersCard.tsx
"use client"

import type { User } from "@/types/manager/super-admin"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { CreateUserDialog } from "@/components/manager/super-admin/dialogs/CreateUserDialog"

type Props = {
  companyName?: string
  hasCompanySelected: boolean
  users: User[]
  onCreateUser: (payload: {
    name: string
    email: string
    password: string
    roleId: string
    status: "active" | "inactive"
  }) => void
}

export function UsersCard({ companyName, hasCompanySelected, users, onCreateUser }: Props) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Usuarios {companyName ? `- ${companyName}` : ""}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {hasCompanySelected ? "Gestiona los usuarios de esta empresa" : "Selecciona una empresa para ver y crear usuarios"}
          </CardDescription>
        </div>

        <CreateUserDialog disabled={!hasCompanySelected} companyName={companyName} onCreate={onCreateUser} />
      </CardHeader>

      <CardContent>
        {!hasCompanySelected ? (
          <div className="text-sm text-muted-foreground">Selecciona una empresa para ver y crear usuarios.</div>
        ) : users.length === 0 ? (
          <div className="text-sm text-muted-foreground">Esta empresa aún no tiene usuarios.</div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-white shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{u.name}</p>
                    <Badge
                      variant={u.status === "active" ? "default" : "secondary"}
                      className={
                        u.status === "active"
                          ? "bg-success/20 text-success border-success/30"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {u.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rol: {u.roleId} • Creado: {new Date(u.creationDate).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
