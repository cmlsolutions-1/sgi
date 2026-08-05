// hooks/manager/useSuperAdmin.ts
"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import type { Company, CompanyStatus } from "@/types/manager/super-admin"
import { listCompanies, createCompany as createCompanyRequest } from "@/services/companyService"
import { getModulesByCompany } from "@/services/modulesService"
import { getCompanyAdmin } from "@/services/userService"

type CompanyApiItem = {
  id: string
  name: string
  nit?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  registrationDate?: string | null
  createdAt?: string | null
  status?: string | boolean | null
  activeModules?: Array<string | { id?: string | null; moduleId?: string | null }> | null
  totalUsers?: number | null
  usersCount?: number | null
  userCount?: number | null
}

function normalizeCompanyStatus(value: CompanyApiItem["status"], fallback: CompanyStatus = "active"): CompanyStatus {
  if (value === true || value === "ACTIVE" || value === "active") return "active"
  if (value === false || value === "INACTIVE" || value === "inactive") return "inactive"
  return fallback
}

function normalizeActiveModuleIds(value: CompanyApiItem["activeModules"]): string[] {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .map((module) => (typeof module === "string" ? module : module.id ?? module.moduleId ?? null))
        .filter((moduleId): moduleId is string => Boolean(moduleId)),
    ),
  )
}

function readUsersCount(company: CompanyApiItem, fallback = 0) {
  return company.totalUsers ?? company.usersCount ?? company.userCount ?? fallback
}

function mapCompany(company: CompanyApiItem, existing?: Company): Company {
  return {
    id: company.id,
    name: company.name,
    nit: company.nit ?? existing?.nit ?? "",
    address: company.address ?? existing?.address ?? "",
    phone: company.phone ?? existing?.phone ?? "",
    email: company.email ?? existing?.email ?? "",
    registrationDate: company.registrationDate ?? company.createdAt ?? existing?.registrationDate ?? "",
    status: normalizeCompanyStatus(company.status, existing?.status ?? "active"),
    activeModules: normalizeActiveModuleIds(company.activeModules) ?? existing?.activeModules ?? [],
    totalUsers: readUsersCount(company, existing?.totalUsers ?? 0),
  }
}

export function useSuperAdmin() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [companyError, setCompanyError] = useState<string | null>(null)

  const stats = useMemo(() => {
    return {
      totalCompanies: companies.length,
      activeCompanies: companies.filter((c) => c.status === "active").length,
      totalUsers: companies.reduce((acc, c) => acc + c.totalUsers, 0),
      avgModulesPerCompany: companies.length
        ? (
            companies.reduce((acc, c) => acc + c.activeModules.length, 0) /
            companies.length
          ).toFixed(1)
        : "0.0",
    }
  }, [companies])

  // Memoizar selectCompany
  const selectCompany = useCallback((company: Company) => {
    setSelectedCompany(company)
  }, [])

  // Memoizar updateCompanyInList
  const updateCompanyInList = useCallback((updatedCompany: Company) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === updatedCompany.id ? updatedCompany : c))
    )
  }, [])

  // Memoizar refreshCompanies
  const refreshCompanies = useCallback(async () => {
    setLoadingCompanies(true)
    setCompanyError(null)

    try {
      const data = (await listCompanies()) as CompanyApiItem[]

      // Usar functional update para no depender de companies
      setCompanies((prevCompanies) =>
        data.map((company) => mapCompany(company, prevCompanies.find((prev) => prev.id === company.id))),
      )

      const hydratedCompanies = await Promise.all(
        data.map(async (companyApi) => {
          const baseCompany = mapCompany(companyApi)
          const [modulesResult, adminResult] = await Promise.allSettled([
            getModulesByCompany(baseCompany.id),
            getCompanyAdmin(baseCompany.id),
          ])

          return {
            ...baseCompany,
            activeModules:
              modulesResult.status === "fulfilled"
                ? modulesResult.value.map((module) => module.id)
                : baseCompany.activeModules,
            totalUsers: adminResult.status === "fulfilled" ? 1 : baseCompany.totalUsers,
          }
        }),
      )

      setCompanies(hydratedCompanies)

      // Usar functional update para selectedCompany
      setSelectedCompany((prev) => {
        if (!prev) {
          // Seleccionar primera empresa si no hay selección
          return null // No seleccionar automáticamente aquí para evitar bucles
        }
        // Mantener selección si existe en la nueva lista
        return hydratedCompanies.find((company) => company.id === prev.id) ?? prev
      })
    } catch (e: any) {
      setCompanyError(e?.message ?? "Error cargando compañías")
    } finally {
      setLoadingCompanies(false)
    }
  }, [])

  // Cargar empresas al montar (solo una vez)
  useEffect(() => {
    refreshCompanies()
  }, [refreshCompanies])

  // Memoizar createCompany
  const createCompany = useCallback(
    async (payload: {
      name: string
      nit: string
      address: string
      phone: string
      email: string
      status: CompanyStatus
    }) => {
      if (!payload.name || !payload.nit || !payload.email) return

      setCompanyError(null)

      try {
        const created = await createCompanyRequest({
          name: payload.name,
          nit: payload.nit,
          address: payload.address,
          phone: payload.phone,
          email: payload.email,
        })

        const today = new Date().toISOString().split("T")[0]

        const company: Company = {
          id: created.id,
          name: created.name,
          nit: payload.nit,
          address: payload.address,
          phone: payload.phone,
          email: payload.email,
          registrationDate: today,
          status: payload.status,
          activeModules: [],
          totalUsers: 0,
        }

        setCompanies((prev) => [...prev, company])
        setSelectedCompany(company)
      } catch (e: any) {
        setCompanyError(e?.message ?? "Error creando compañía")
        throw e
      }
    },
    []
  )

  return {
    companies,
    selectedCompany,
    stats,
    loadingCompanies,
    companyError,
    refreshCompanies,
    selectCompany,
    createCompany,
    updateCompanyInList,
  }
}
