// components/manager/super-admin/SuperAdminDashboard.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { doLogout } from "@/lib/auth/logout"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { useSuperAdmin } from "@/hooks/manager/useSuperAdmin"
import { useCiiu } from "@/hooks/manager/useCiiu"

import { CiiuCard } from "@/components/manager/super-admin/dialogs/CiiuCard"
import { CompaniesCard } from "@/components/manager/super-admin/dialogs/CompaniesCard"
import { UsersCard } from "@/components/manager/super-admin/UsersCard"
import { ModulesCard } from "@/components/manager/super-admin/ModulesCard"
import { ManageModulesDialog } from "@/components/manager/super-admin/dialogs/ManageModulesDialog"

export default function SuperAdminDashboard() {
  const router = useRouter()

  const ciiu = useCiiu()

  const {
    companies,
    selectedCompany,
    AVAILABLE_MODULES,
    stats,
    companyUsers,
    selectCompany,
    createCompany,
    createUser,
    toggleModule,
  } = useSuperAdmin()

  const [modulesOpen, setModulesOpen] = useState(false)

  async function handleLogout() {
    await doLogout()
    router.push("/login")
    router.refresh()
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

          <UsersCard
            companyName={selectedCompany?.name}
            hasCompanySelected={Boolean(selectedCompany)}
            users={companyUsers}
            onCreateUser={createUser}
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
