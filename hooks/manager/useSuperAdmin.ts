// hooks/manager/useSuperAdmin.ts
"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import type { Company, CompanyStatus } from "@/types/manager/super-admin"
import { listCompanies, createCompany as createCompanyRequest } from "@/services/companyService"

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
      const data = await listCompanies()

      // Usar functional update para no depender de companies
      setCompanies((prevCompanies) => {
        const mapped: Company[] = data.map((c) => {
          const existing = prevCompanies.find((prev) => prev.id === c.id)
          return {
            id: c.id,
            name: c.name,
            nit: existing?.nit ?? "",
            address: existing?.address ?? "",
            phone: existing?.phone ?? "",
            email: existing?.email ?? "",
            registrationDate: existing?.registrationDate ?? "",
            status: existing?.status ?? "active",
            activeModules: existing?.activeModules ?? [],
            totalUsers: existing?.totalUsers ?? 0,
          }
        })
        return mapped
      })

      // Usar functional update para selectedCompany
      setSelectedCompany((prev) => {
        if (!prev) {
          // Seleccionar primera empresa si no hay selección
          return null // No seleccionar automáticamente aquí para evitar bucles
        }
        // Mantener selección si existe en la nueva lista
        return prev // Mantener referencia si el ID coincide
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