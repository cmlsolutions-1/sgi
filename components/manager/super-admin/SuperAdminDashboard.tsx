// components/manager/super-admin/SuperAdminDashboard.tsx
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { doLogout } from "@/lib/auth/logout"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { useSuperAdmin } from "@/hooks/manager/useSuperAdmin"
import { useCiiu } from "@/hooks/manager/useCiiu"
import { useUsers } from "@/hooks/useUsers"

import { CiiuCard } from "@/components/manager/super-admin/dialogs/CiiuCard"
import { CompaniesCard } from "@/components/manager/super-admin/dialogs/CompaniesCard"
import { UsersCard } from "@/components/manager/super-admin/UsersCard"
import { ManageModulesDialog } from "@/components/manager/super-admin/dialogs/ManageModulesDialog"
import { getModulesByCompany } from "@/services/modulesService"
import type { Company } from "@/types/manager/super-admin"

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
  const lastLoadedCompanyId = useRef<string | null>(null)

  // Seleccionar primera empresa cuando carguen
  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      selectCompany(companies[0])
    }
  }, [companies, selectedCompany, selectCompany])

  // Función explícita para cargar módulos de una empresa
  const loadCompanyModules = useCallback(
    async (companyId: string) => {
      if (!companyId) return

      console.log("🔄 Cargando módulos para empresa:", companyId)

      try {
        const activeModulesData = await getModulesByCompany(companyId)
        const activeModuleIds = activeModulesData.map((m) => m.id)

        console.log("Módulos obtenidos:", activeModuleIds)

        // Actualizar selectedCompany
        if (selectedCompany?.id === companyId) {
          const updatedCompany: Company = {
            ...selectedCompany,
            activeModules: activeModuleIds,
          }
          selectCompany(updatedCompany)
        }

        // Actualizar en la lista
        const companyInList = companies.find((c) => c.id === companyId)
        if (companyInList) {
          updateCompanyInList({
            ...companyInList,
            activeModules: activeModuleIds,
          })
        }
      } catch (err) {
        console.error("Error cargando módulos:", err)
      }
    },
    [selectedCompany, companies, selectCompany, updateCompanyInList]
  )

  // Cargar módulos y usuarios cuando cambia la empresa
  useEffect(() => {
    const loadCompanyDetails = async () => {
      if (!selectedCompany) return

      // Evitar cargar si ya cargamos esta empresa
      if (lastLoadedCompanyId.current === selectedCompany.id) {
        return
      }

      lastLoadedCompanyId.current = selectedCompany.id
      console.log("Cargando detalles para empresa:", selectedCompany.id)

      await loadCompanyModules(selectedCompany.id)
      await fetchUsers()
    }

    loadCompanyDetails()
  }, [selectedCompany?.id, loadCompanyModules, fetchUsers])

  async function handleLogout() {
    await doLogout()
  }

  // Refrescar todo y forzar recarga de módulos
  const handleRefreshAll = async () => {
    if (!selectedCompany) return

    // Resetear ref para permitir recarga
    lastLoadedCompanyId.current = null

    // Refrescar lista de empresas
    await refreshCompanies()

    // Cargar módulos explícitamente
    await loadCompanyModules(selectedCompany.id)

    // Refrescar usuarios
    await fetchUsers()
  }

  const hasActiveModules = selectedCompany
    ? selectedCompany.activeModules.length > 0
    : false

  const handleCreateCompany = async (payload: {
    name: string
    nit: string
    address: string
    phone: string
    email: string
    status: "active" | "inactive"
  }) => {
    lastLoadedCompanyId.current = null
    await createCompany(payload)
  }

  return (
    <div className="min-h-screen bg-background p-6">
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