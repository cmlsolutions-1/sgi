// components/manager/super-admin/CompaniesCard.tsx
"use client"

import type { Company } from "@/types/manager/super-admin"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CheckCircle2, Settings, XCircle } from "lucide-react"

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
  }) => void
  onOpenModules: (company: Company) => void
}

export function CompaniesCard({ companies, selectedCompany, onSelect, onCreateCompany, onOpenModules }: Props) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
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
            return (
              <div
                key={company.id}
                onClick={() => onSelect(company)}
                className={`flex items-center justify-between p-4 rounded-lg border border-border bg-white hover:bg-secondary/50 transition-colors shadow-sm cursor-pointer ${
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
                        variant={company.status === "active" ? "default" : "secondary"}
                        className={
                          company.status === "active"
                            ? "bg-success/20 text-success border-success/30"
                            : "bg-muted text-muted-foreground"
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
                      <span>{company.activeModules.length} módulos activos</span>
                      <span>•</span>
                      <span>Creada: {new Date(company.registrationDate).toLocaleDateString("es-ES")}</span>
                    </div>
                  </div>
                </div>

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
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
