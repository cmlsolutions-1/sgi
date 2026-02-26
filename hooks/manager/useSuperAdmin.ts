"use client"

import { useEffect, useMemo, useState } from "react"
import type { Company, CompanyStatus, User, UserStatus } from "@/types/manager/super-admin"
import type { Module } from "@/lib/modules"
import { getModulesFromSidebar } from "@/lib/modules"

// puedes dejar users seed si aún no integras usuarios
import { INITIAL_USERS } from "@/data/manager/super-admin.seed"

import { listCompanies, createCompany as createCompanyRequest} from "@/services/companyService"

export function useSuperAdmin() {
  // ahora empezamos vacío y cargamos del backend
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>(INITIAL_USERS)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  // opcional: estados de UI
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [companyError, setCompanyError] = useState<string | null>(null)

  const AVAILABLE_MODULES: Module[] = useMemo(() => getModulesFromSidebar(), [])

  const stats = useMemo(() => {
    return {
      totalCompanies: companies.length,
      activeCompanies: companies.filter((c) => c.status === "active").length,
      totalUsers: companies.reduce((acc, c) => acc + c.totalUsers, 0),
      avgModulesPerCompany: companies.length
        ? (companies.reduce((acc, c) => acc + c.activeModules.length, 0) / companies.length).toFixed(1)
        : "0.0",
    }
  }, [companies])

  const companyUsers = useMemo(() => {
    return selectedCompany ? users.filter((u) => u.companyId === selectedCompany.id) : []
  }, [users, selectedCompany])

  const selectCompany = (company: Company) => setSelectedCompany(company)

  async function refreshCompanies() {
    setLoadingCompanies(true)
    setCompanyError(null)

    try {
      const data = await listCompanies()

      // tu backend solo devuelve {id,name}
      // entonces mapeamos a tu tipo Company con defaults
      const mapped: Company[] = data.map((c) => ({
        id: c.id,
        name: c.name,
        nit: "",              // no viene del backend en este endpoint
        address: "",
        phone: "",
        email: "",
        registrationDate: "", // idem
        status: "active",     // default (ajusta si tu negocio dice otra cosa)
        activeModules: ["usuarios"], // default
        totalUsers: 0,        // default
      }))

      setCompanies(mapped)

      // mantener selección si existía
      setSelectedCompany((prev) => {
        if (!prev) return mapped[0] ?? null
        return mapped.find((x) => x.id === prev.id) ?? (mapped[0] ?? null)
      })
    } catch (e: any) {
      setCompanyError(e?.message ?? "Error cargando compañías")
    } finally {
      setLoadingCompanies(false)
    }
  }

  useEffect(() => {
    refreshCompanies()
  }, [])

  // ahora crea en backend
  const createCompany = async (payload: {
    name: string
    nit: string
    address: string
    phone: string
    email: string
    status: CompanyStatus
  }) => {
    if (!payload.name || !payload.nit || !payload.email) return

    setCompanyError(null)

    const created = await createCompanyRequest({
  name: payload.name,
  nit: payload.nit,
  address: payload.address,
  phone: payload.phone,
  email: payload.email,
})

    const today = new Date().toISOString().split("T")[0]

    // como el backend responde {id,name}, completamos el resto con payload/defaults
    const company: Company = {
      id: created.id,
      name: created.name,
      nit: payload.nit,
      address: payload.address,
      phone: payload.phone,
      email: payload.email,
      registrationDate: today,
      status: payload.status,
      activeModules: ["usuarios"],
      totalUsers: 0,
    }

    setCompanies((prev) => [...prev, company])
    setSelectedCompany(company)
  }

  const createUser = (payload: {
    name: string
    email: string
    password: string
    roleId: string
    status: UserStatus
  }) => {
    if (!selectedCompany) return
    if (!payload.name || !payload.email || !payload.password) return

    const today = new Date().toISOString().split("T")[0]

    const user: User = {
      id: Date.now().toString(),
      companyId: selectedCompany.id,
      name: payload.name,
      email: payload.email,
      roleId: payload.roleId,
      status: payload.status,
      creationDate: today,
    }

    setUsers((prev) => [...prev, user])

    setCompanies((prev) =>
      prev.map((c) => (c.id === selectedCompany.id ? { ...c, totalUsers: c.totalUsers + 1 } : c))
    )
  }

  const toggleModule = (moduleId: string) => {
    if (!selectedCompany) return

    const updatedCompanies = companies.map((company) => {
      if (company.id === selectedCompany.id) {
        const activeModules = company.activeModules.includes(moduleId)
          ? company.activeModules.filter((id) => id !== moduleId)
          : [...company.activeModules, moduleId]

        return { ...company, activeModules }
      }
      return company
    })

    setCompanies(updatedCompanies)
    setSelectedCompany(updatedCompanies.find((c) => c.id === selectedCompany.id) || null)
  }

  return {
    companies,
    users,
    selectedCompany,
    AVAILABLE_MODULES,
    stats,
    companyUsers,
    loadingCompanies,
    companyError,
    refreshCompanies,
    selectCompany,
    createCompany,
    createUser,
    toggleModule,
  }
}