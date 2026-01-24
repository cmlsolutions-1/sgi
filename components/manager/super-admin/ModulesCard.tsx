// components/manager/super-admin/ModulesCard.tsx
"use client"

import type { Company } from "@/types/manager/super-admin"
import type { Module } from "@/lib/modules"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  modules: Module[]
  companies: Company[]
}

export function ModulesCard({ modules, companies }: Props) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Módulos Disponibles</CardTitle>
        <CardDescription className="text-muted-foreground">Módulos que se pueden habilitar para las empresas</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {modules.map((module) => {
            const companiesUsingModule = companies.filter((c) => c.activeModules.includes(module.id)).length

            return (
              <div key={module.id} className="p-4 rounded-lg border border-border bg-white shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <module.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">{module.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{module.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {companiesUsingModule} empresa{companiesUsingModule !== 1 ? "s" : ""} usando
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
