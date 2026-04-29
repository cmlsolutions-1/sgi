// components/manager/super-admin/dialogs/ManageModulesDialog.tsx
"use client"

import { useState, useEffect } from "react"
import type { Company } from "@/types/manager/super-admin"
import type { Module } from "@/types/manager/module"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, AlertTriangle, Package } from "lucide-react"
import { listModules, activateModule, deactivateModule } from "@/services/modulesService" // Verifica nombre del archivo
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
  onRefresh: () => Promise<void>
}

export function ManageModulesDialog({ open, onOpenChange, company, onRefresh }: Props) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(false)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && company) {
      fetchModules()
    }
  }, [open, company])

  const fetchModules = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listModules()
      console.log("🔍 Módulos cargados:", data) // Debug
      setModules(data)
    } catch (err: any) {
      console.error("❌ Error cargando módulos:", err)
      setError(err.message ?? "Error al cargar módulos")
      toast.error(err.message ?? "Error al cargar módulos")
    } finally {
      setLoading(false)
    }
  }

  const isModuleActive = (moduleId: string): boolean => {
    return company?.activeModules.includes(moduleId) || false
  }

  const handleToggle = async (moduleId: string, moduleName: string) => {
    if (!company) {
      toast.error("No hay empresa seleccionada")
      return
    }

    setActivatingId(moduleId)
    try {
      const currentlyActive = isModuleActive(moduleId)
      console.log(`Toggle ${moduleName}:`, currentlyActive ? "desactivar" : "activar")

      if (currentlyActive) {
        await deactivateModule(company.id, moduleId)
        toast.success(`Módulo "${moduleName}" desactivado`)
      } else {
        await activateModule(company.id, moduleId)
        toast.success(`Módulo "${moduleName}" activado`)
      }

      console.log("Toggle exitoso, refrescando...")
      // Esto llama a handleRefreshAll que carga módulos explícitamente
      await onRefresh()
    } catch (err: any) {
      console.error("❌ Error en toggle:", err)
      toast.error(err.message ?? "Error al actualizar módulo")
    } finally {
      setActivatingId(null)
    }
  }

  // Ajusta esta validación según los códigos reales de tu backend
  const isRequiredModule = (module: Module): boolean => {
    return module.code === "USER_MANAGEMENT" || module.code === "usuarios"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestionar Módulos
            {company && <span className="text-muted-foreground">- {company.name}</span>}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Habilita o deshabilita los módulos para esta empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-sm text-muted-foreground">Cargando módulos...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
              <p className="text-sm text-foreground font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchModules} className="mt-3">
                Reintentar
              </Button>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No hay módulos disponibles
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module) => {
                const isActive = isModuleActive(module.id)
                const isRequired = isRequiredModule(module)

                return (
                  <div
                    key={module.id}
                    className={cn(
                      "rounded-lg border border-border bg-white shadow-sm overflow-hidden",
                      isActive && "border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                            isActive
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Package className="h-5 w-5" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{module.name}</h4>
                            <span className="text-xs text-muted-foreground font-mono">
                              {module.code}
                            </span>
                            {isRequired && (
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                                Requerido
                              </Badge>
                            )}
                            {isActive && (
                              <Badge variant="default" className="text-xs bg-success/20 text-success">
                                Activo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <Switch
                        checked={isActive}
                        onCheckedChange={() => handleToggle(module.id, module.name)}
                        disabled={isRequired || activatingId === module.id}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>

                    {module.children.length > 0 && (
                      <div className="border-t border-border bg-muted/30">
                        {module.children.map((child) => {
                          const childActive = isModuleActive(child.id)
                          const childRequired = isRequiredModule({ ...module, code: child.code } as Module)

                          return (
                            <div
                              key={child.id}
                              className="flex items-center justify-between p-3 pl-6 border-b border-border last:border-0"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div
                                  className={cn(
                                    "h-8 w-8 rounded-md flex items-center justify-center",
                                    childActive
                                      ? "bg-primary/20 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  <Package className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{child.name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{child.code}</p>
                                </div>
                              </div>

                              <Switch
                                checked={childActive}
                                onCheckedChange={() => handleToggle(child.id, child.name)}
                                disabled={childRequired || activatingId === child.id}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}