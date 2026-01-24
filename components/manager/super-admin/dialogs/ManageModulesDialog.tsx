// components/manager/super-admin/dialogs/ManageModulesDialog.tsx
"use client"

import type { Module } from "@/lib/modules"
import type { Company } from "@/types/manager/super-admin"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
  modules: Module[]
  onToggle: (moduleId: string) => void
}

export function ManageModulesDialog({ open, onOpenChange, company, modules, onToggle }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Gestionar Módulos - {company?.name}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Habilita o deshabilita los módulos para esta empresa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {modules.map((module) => {
            const isActive = company?.activeModules.includes(module.id) || false
            const isUsuarios = module.id === "usuarios"

            return (
              <div
                key={module.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-white shadow-sm"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <module.icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{module.name}</h4>
                      {isUsuarios && (
                        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                          Requerido
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                  </div>
                </div>

                <Switch
                  checked={isActive}
                  onCheckedChange={() => onToggle(module.id)}
                  disabled={isUsuarios}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
