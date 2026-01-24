// hooks/manager/useSuperAdmin.ts

"use client"

import { useMemo, useState } from "react"
import type { Company, CompanyStatus, User, UserStatus } from "@/types/manager/super-admin"
import type { Module } from "@/lib/modules"
import { getModulesFromSidebar } from "@/lib/modules"

import { INITIAL_COMPANIES, INITIAL_USERS } from "@/data/manager/super-admin.seed"
import type { NivelRiesgoItem } from "@/types/manager/super-admin"


export function useSuperAdmin() {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES)
  const [users, setUsers] = useState<User[]>(INITIAL_USERS)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const AVAILABLE_MODULES: Module[] = useMemo(() => getModulesFromSidebar(), [])

  const stats = useMemo(() => {
    return {
      totalCompanies: companies.length,
      activeCompanies: companies.filter((c) => c.status === "active").length,
      totalUsers: companies.reduce((acc, c) => acc + c.totalUsers, 0),
      avgModulesPerCompany: (
        companies.reduce((acc, c) => acc + c.activeModules.length, 0) / companies.length
      ).toFixed(1),
    }
  }, [companies])

  const companyUsers = useMemo(() => {
    return selectedCompany ? users.filter((u) => u.companyId === selectedCompany.id) : []
  }, [users, selectedCompany])

  const selectCompany = (company: Company) => setSelectedCompany(company)

  const createCompany = (payload: {
    name: string
    nit: string
    address: string
    phone: string
    email: string
    status: CompanyStatus
  }) => {
    if (!payload.name || !payload.nit || !payload.email) return

    const today = new Date().toISOString().split("T")[0]
    const companyId = Date.now().toString()

    const company: Company = {
      id: companyId,
      name: payload.name,
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
    selectCompany,
    createCompany,
    createUser,
    toggleModule,
  }
}
