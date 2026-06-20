// components/manager/super-admin/dialogs/ManageModulesDialog.tsx
"use client"

import { useEffect, useState } from "react"
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
import { AlertTriangle, Loader2, Package } from "lucide-react"
import { getModulesByCompany, listModules, syncAdminCompanyPermissions, updateCompanyModules } from "@/services/modulesService"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
  onRefresh: (activeModuleIds?: string[]) => Promise<void>
}

function normalizeActiveModuleIds(activeModules: Module[], moduleCatalog: Module[]): string[] {
  const childrenByParentId = new Map(moduleCatalog.map((module) => [module.id, module.children.map((child) => child.id)]))

  return Array.from(new Set(activeModules.flatMap((module) => {
    if (module.children?.length) {
      return module.children.map((child) => child.id)
    }

    if (module.parentId) return [module.id]

    return childrenByParentId.get(module.id) ?? []
  })))
}

function normalizeKnownModuleIds(moduleIds: string[], moduleCatalog: Module[]): string[] {
  const childIds = new Set(moduleCatalog.flatMap((module) => module.children.map((child) => child.id)))
  const childrenByParentId = new Map(moduleCatalog.map((module) => [module.id, module.children.map((child) => child.id)]))

  return Array.from(new Set(moduleIds.flatMap((moduleId) => {
    if (childIds.has(moduleId)) return [moduleId]
    return childrenByParentId.get(moduleId) ?? []
  })))
}

export function ManageModulesDialog({ open, onOpenChange, company, onRefresh }: Props) {
  const [modules, setModules] = useState<Module[]>([])
  const [activeModuleIds, setActiveModuleIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !company) return

    fetchModules()
  }, [open, company?.id])

  const fetchModules = async () => {
    if (!company) return

    setLoading(true)
    setError(null)

    try {
      const [data, activeModulesData] = await Promise.all([listModules(), getModulesByCompany(company.id)])
      setModules(data)
      const validModuleIds = new Set(data.flatMap((module) => module.children.map((child) => child.id)))
      const activeIds = normalizeActiveModuleIds(activeModulesData, data).filter((moduleId) => validModuleIds.has(moduleId))
      const fallbackActiveIds = normalizeKnownModuleIds(company.activeModules, data).filter((moduleId) => validModuleIds.has(moduleId))

      setActiveModuleIds(activeIds.length > 0 ? activeIds : fallbackActiveIds)
    } catch (err: any) {
      const message = err.message ?? "Error al cargar modulos"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const isModuleActive = (moduleId: string): boolean => {
    return activeModuleIds.includes(moduleId)
  }

  const isChildActive = (childId: string): boolean => {
    return isModuleActive(childId)
  }

  const refreshActiveModules = async (): Promise<string[]> => {
    if (!company) return []

    const modulesData = await getModulesByCompany(company.id)
    return normalizeActiveModuleIds(modulesData, modules)
  }

  const getParentIdsForActiveChildren = (childIds: string[]): string[] => {
    const activeChildIds = new Set(childIds)

    return modules
      .filter((module) => module.children.some((child) => activeChildIds.has(child.id)))
      .map((module) => module.id)
  }

  const handleToggle = async (moduleId: string, moduleName: string) => {
    if (!company) {
      toast.error("No hay empresa seleccionada")
      return
    }

    const currentlyActive = isModuleActive(moduleId)
    const previousActiveIds = activeModuleIds
    const nextActiveIds = currentlyActive
      ? previousActiveIds.filter((id) => id !== moduleId)
      : Array.from(new Set([...previousActiveIds, moduleId]))
    const parentIdsToPersist = getParentIdsForActiveChildren(nextActiveIds)

    setActivatingId(moduleId)
    setActiveModuleIds(nextActiveIds)

    try {
      await updateCompanyModules(
        company.id,
        parentIdsToPersist,
        currentlyActive ? `Modulo "${moduleName}" desactivado desde panel` : "Actualizado desde panel",
      )

      if (parentIdsToPersist.length > 0) {
        await syncAdminCompanyPermissions(company.id).catch((error: any) => {
          toast.warning(error.message ?? "Los modulos se actualizaron, pero no se pudieron sincronizar los permisos")
        })
      }

      const refreshedActiveIds = await refreshActiveModules()
      const persistedActiveIds = refreshedActiveIds.includes(moduleId) === !currentlyActive ? refreshedActiveIds : nextActiveIds
      setActiveModuleIds(persistedActiveIds)
      toast.success(`Modulo "${moduleName}" ${currentlyActive ? "desactivado" : "activado"}`)
      await onRefresh(persistedActiveIds)
    } catch (err: any) {
      setActiveModuleIds(previousActiveIds)
      toast.error(err.message ?? "Error al actualizar modulo")
    } finally {
      setActivatingId(null)
    }
  }

  const isRequiredModule = (module: Pick<Module, "code">): boolean => {
    return module.code === "USER_MANAGEMENT" || module.code === "usuarios"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestionar Modulos
            {company && <span className="text-muted-foreground">- {company.name}</span>}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Habilita o deshabilita los modulos para esta empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-sm text-muted-foreground">Cargando modulos...</span>
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
              No hay modulos disponibles
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module) => {
                const activeChildren = module.children.filter((child) => isChildActive(child.id))
                const hasActiveChildren = activeChildren.length > 0
                const allChildrenActive = module.children.length > 0 && activeChildren.length === module.children.length

                return (
                  <div
                    key={module.id}
                    className={cn(
                      "rounded-lg border border-border bg-white shadow-sm overflow-hidden",
                      hasActiveChildren && "border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                            hasActiveChildren ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Package className="h-5 w-5" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{module.name}</h4>
                            <span className="text-xs text-muted-foreground font-mono">{module.code}</span>
                            <Badge variant="secondary" className="text-xs">
                              Modulo padre
                            </Badge>
                            {hasActiveChildren && (
                              <Badge variant="default" className="text-xs bg-success/20 text-success">
                                {allChildrenActive ? "Hijos activos" : `${activeChildren.length}/${module.children.length} activos`}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {module.children.length > 0 && (
                      <div className="border-t border-border bg-muted/30">
                        {module.children.map((child) => {
                          const childActive = isChildActive(child.id)
                          const childRequired = isRequiredModule(child)
                          const disableChildSwitch = activatingId === child.id || (childRequired && childActive)

                          return (
                            <div
                              key={child.id}
                              className="flex items-center justify-between p-3 pl-6 border-b border-border last:border-0"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div
                                  className={cn(
                                    "h-8 w-8 rounded-md flex items-center justify-center",
                                    childActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
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
                                disabled={disableChildSwitch}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
