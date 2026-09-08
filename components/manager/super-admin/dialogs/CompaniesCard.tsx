// components/manager/super-admin/CompaniesCard.tsx
"use client"

import type { Company } from "@/types/manager/super-admin"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CheckCircle2, Edit, Loader2, Power, Settings, XCircle } from "lucide-react"
import { useState } from "react"

import { CreateCompanyDialog } from "@/components/manager/super-admin/dialogs/CreateCompanyDialog"

type Props = {
  companies: Company[]
  selectedCompany: Company | null
  onSelect: (company: Company) => void
  onCreateCompany: (payload: {
    name: string
    nit: string
    address: string
    phone: string
    email: string
    status: "active" | "inactive"
  }) => Promise<void>
  onUpdateCompany: (company: Company, payload: {
    name: string
    nit: string
    address: string
    phone: string
    email: string
  }) => Promise<void>
  onToggleCompanyStatus: (company: Company) => Promise<void>
  getActiveChildModuleCount: (company: Company) => number
  onOpenModules: (company: Company) => void
}

export function CompaniesCard({
  companies,
  selectedCompany,
  onSelect,
  onCreateCompany,
  onUpdateCompany,
  onToggleCompanyStatus,
  getActiveChildModuleCount,
  onOpenModules,
}: Props) {
  const [updatingCompanyId, setUpdatingCompanyId] = useState<string | null>(null)

  async function handleToggleCompanyStatus(company: Company) {
    setUpdatingCompanyId(company.id)
    try {
      await onToggleCompanyStatus(company)
    } finally {
      setUpdatingCompanyId(null)
    }
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-foreground">Empresas</CardTitle>
          <CardDescription className="text-muted-foreground">Selecciona una empresa para gestionar usuarios</CardDescription>
        </div>

        <CreateCompanyDialog onCreate={onCreateCompany} />
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {companies.map((company) => {
            const isSelected = selectedCompany?.id === company.id
            const activeChildModules = getActiveChildModuleCount(company)
            const isUpdatingStatus = updatingCompanyId === company.id
            return (
              <div
                key={company.id}
                onClick={() => onSelect(company)}
                className={`flex flex-col gap-4 rounded-lg border border-border bg-white p-4 shadow-sm transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between cursor-pointer ${
                  isSelected ? "ring-2 ring-primary/40" : ""
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{company.name}</h3>

                      <Badge
                        variant={company.status === "active" ? "accentActivd" : "destructive"}
                        className={
                          company.status === "active"
                            ? "bg-accentActivd text-accentActivd-foreground"
                            : "bg-destructive text-white"
                        }
                      >
                        {company.status === "active" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {company.status === "active" ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{company.email}</p>

                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{company.totalUsers} usuarios</span>
                      <span>•</span>
                      <span>{activeChildModules} módulos hijos activos</span>
                      <span>•</span>
                      <span>Creada: {new Date(company.registrationDate).toLocaleDateString("es-ES")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <CreateCompanyDialog
                    company={company}
                    onUpdate={onUpdateCompany}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="border-border text-foreground hover:bg-secondary"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    }
                  />

                  <Button
                    variant={company.status === "active" ? "destructive" : "default"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleCompanyStatus(company)
                    }}
                    disabled={isUpdatingStatus}
                    className={
                      company.status === "active"
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Power className="h-4 w-4 mr-2" />
                    )}
                    {company.status === "active" ? "Inactivar" : "Activar"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenModules(company)
                    }}
                    className="border-border text-foreground hover:bg-secondary"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Módulos
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
