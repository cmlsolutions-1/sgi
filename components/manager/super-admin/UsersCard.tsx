// components/manager/super-admin/UsersCard.tsx
"use client"

import { useState } from "react"
// Importar CreateCompanyAdminDto en lugar de CreateUserDto
import type { User, CreateCompanyAdminDto, UpdateUserDto } from "@/types/manager/user"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateUserDialog } from "@/components/manager/super-admin/dialogs/CreateUserDialog"
import { Loader2, Trash2, Edit2, RefreshCw, AlertTriangle, Settings } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Props = {
  companyName?: string
  // Eliminar companyId
  hasCompanySelected: boolean
  hasActiveModules: boolean
  users: User[]
  loading: boolean
  //  Usar CreateCompanyAdminDto
  onCreateUser: (payload: CreateCompanyAdminDto) => Promise<User | null>
  onUpdateUser: (id: string, payload: UpdateUserDto) => Promise<boolean>
  onDeleteUser: (id: string) => Promise<boolean>
  onRefresh: () => Promise<void>
  onOpenModules: () => void
}

export function UsersCard({
  companyName,
  hasCompanySelected,
  hasActiveModules,
  users,
  loading,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onRefresh,
  onOpenModules,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await onDeleteUser(id)
    setDeletingId(null)
  }

  const getStatusBadge = (status: User["status"]) => {
    const isActive = status === "ACTIVE"
    return (
      <Badge
        variant={isActive ? "default" : "secondary"}
        className={
          isActive
            ? "bg-success/20 text-success border-success/30"
            : "bg-muted text-muted-foreground"
        }
      >
        {isActive ? "Activo" : "Inactivo"}
      </Badge>
    )
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground flex items-center gap-2">
            Usuarios {companyName ? `- ${companyName}` : ""}
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {hasCompanySelected
              ? "Gestiona los usuarios de esta empresa"
              : "Selecciona una empresa para ver y crear usuarios"}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={!hasCompanySelected || loading}
            className="border-border"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <CreateUserDialog
            disabled={!hasCompanySelected || loading || !hasActiveModules}
            companyName={companyName}
            loading={loading}
            onCreate={onCreateUser}
          />
        </div>
      </CardHeader>

      <CardContent>
        {!hasCompanySelected ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Selecciona una empresa para ver y crear usuarios.
          </div>
        ) : !hasActiveModules ? (
          <div className="py-8 text-center">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-foreground font-medium mb-2">
              No hay módulos activos en esta empresa
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Debes activar al menos un módulo antes de poder crear usuarios.
            </p>
            <Button
              onClick={onOpenModules}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Settings className="h-4 w-4 mr-2" />
              Activar Módulos
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Esta empresa aún no tiene usuarios.
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-white shadow-sm"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{u.name}</p>
                    {getStatusBadge(u.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Teléfono: {u.phone} • Roles: {u.roles.map((r) => r.name).join(", ")}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {}}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={deletingId === u.id}
                      >
                        {deletingId === u.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
                          <strong>{u.name}</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(u.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}