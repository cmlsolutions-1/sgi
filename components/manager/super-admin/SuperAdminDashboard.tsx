// components/manager/super-admin/SuperAdminDashboard.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Shield } from "lucide-react"
import { doLogout } from "@/lib/auth/logout"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { useSuperAdmin } from "@/hooks/manager/useSuperAdmin"
import { useCiiu } from "@/hooks/manager/useCiiu"
import { useUsers } from "@/hooks/useUsers"
import { useRoles } from "@/hooks/useRoles"

import { CiiuCard } from "@/components/manager/super-admin/dialogs/CiiuCard"
import { CompaniesCard } from "@/components/manager/super-admin/dialogs/CompaniesCard"
import { UsersCard } from "@/components/manager/super-admin/UsersCard"
import { ModulesCard } from "@/components/manager/super-admin/ModulesCard"
import { ManageModulesDialog } from "@/components/manager/super-admin/dialogs/ManageModulesDialog"
import { CreateRoleDialog } from "@/components/manager/super-admin/dialogs/CreateRoleDialog"
import { createRole } from "@/services/roleService"
import { toast } from "sonner"

export default function SuperAdminDashboard() {
  const router = useRouter()
  const ciiu = useCiiu()

  const {
    companies,
    selectedCompany,
    AVAILABLE_MODULES,
    stats,
    selectCompany,
    createCompany,
    toggleModule,
  } = useSuperAdmin()

  const {
    users,
    loading: usersLoading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  } = useUsers(false)

  const { roles, fetchRoles } = useRoles(false)

  const [modulesOpen, setModulesOpen] = useState(false)
  const [creatingRole, setCreatingRole] = useState(false)


  useEffect(() => {
    if (selectedCompany) {
      fetchUsers()
    }
  }, [selectedCompany, fetchUsers])

  // Cargar roles al montar
  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  async function handleLogout() {
    await doLogout()
  }

  const handleCreateRole = async (payload: {
    name: string
    description: string
    permissionIds: string[]
  }) => {
    setCreatingRole(true)
    try {
      await createRole(payload)
      await fetchRoles()
      toast.success("Rol creado exitosamente")
    } catch (err: any) {
      toast.error(err.message ?? "Error al crear rol")
      throw err
    } finally {
      setCreatingRole(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">Panel de Super Usuario Empresarial</h1>
          <p className="text-muted-foreground text-lg">Gestionar empresas, usuarios y módulos</p>
        </div>

        <Button
          onClick={handleLogout}
          className="bg-red-400 text-white hover:bg-red-500 active:bg-red-600 flex items-center gap-2"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>

      {/* Stats */}
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

      {/* CIIU */}
      <CiiuCard
        ciiu={ciiu.ciiu}
        setCiiu={ciiu.setCiiu}
        ciiuResults={ciiu.ciiuResults}
        ciiuError={ciiu.ciiuError}
        onConsultar={ciiu.consultar}
        onLimpiar={ciiu.limpiar}
      />

      {/* Main */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CompaniesCard
            companies={companies}
            selectedCompany={selectedCompany}
            onSelect={selectCompany}
            onCreateCompany={createCompany}
            onOpenModules={(company) => {
              selectCompany(company)
              setModulesOpen(true)
            }}
          />

          {/* Card de Roles */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Roles del Sistema
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Gestiona los roles y permisos disponibles
                </CardDescription>
              </div>

              <CreateRoleDialog
                disabled={creatingRole}
                loading={creatingRole}
                onCreate={handleCreateRole}
              />
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No hay roles creados. Crea el primer rol para poder asignar usuarios.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm"
                    >
                      {role.name}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <UsersCard
            companyName={selectedCompany?.name}
            hasCompanySelected={Boolean(selectedCompany)}
            users={users}
            loading={usersLoading}
            onCreateUser={createUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            onRefresh={fetchUsers}
          />
        </div>

        <ModulesCard modules={AVAILABLE_MODULES} companies={companies} />
      </div>

      <ManageModulesDialog
        open={modulesOpen}
        onOpenChange={setModulesOpen}
        company={selectedCompany}
        modules={AVAILABLE_MODULES}
        onToggle={toggleModule}
      />
    </div>
  )
}
