"use client"

import { useEffect, useRef, useState } from "react"
import type { Company } from "@/types/manager/super-admin"
import type { Module } from "@/types/manager/module"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Loader2, Package } from "lucide-react"
import { activateModule, deactivateModule, getModulesByCompany, listModules } from "@/services/modulesService"
import { activeParentModuleIds } from "@/lib/company-modules"
import { toast } from "sonner"

type Props = { open: boolean; onOpenChange: (open: boolean) => void; company: Company | null; onRefresh: (activeModuleIds?: string[]) => Promise<void> }

export function ManageModulesDialog({ open, onOpenChange, company, onRefresh }: Props) {
  const [modules, setModules] = useState<Module[]>([])
  const [activeIds, setActiveIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sequence = useRef(0)
  const companyId = useRef(company?.id)
  companyId.current = company?.id

  async function fetchModules() {
    if (!company) return
    const request = ++sequence.current
    setLoading(true); setError(null); setActiveIds([])
    try {
      const [catalog, assigned] = await Promise.all([listModules(), getModulesByCompany(company.id)])
      if (request !== sequence.current) return
      setModules(catalog.filter(module => module.parentId === null))
      setActiveIds(activeParentModuleIds(assigned, catalog))
    } catch (error) {
      if (request === sequence.current) setError((error as Error).message ?? "No se pudieron cargar los módulos")
    } finally { if (request === sequence.current) setLoading(false) }
  }
  useEffect(() => {
    if (open && company) void fetchModules()
    return () => { sequence.current++ }
  }, [open, company?.id])

  async function toggle(module: Module) {
    if (!company || savingId || loading || error) return
    const targetId = company.id
    const active = activeIds.includes(module.id)
    setSavingId(module.id)
    try {
      await (active ? deactivateModule(targetId, module.id) : activateModule(targetId, module.id))
      const assigned = await getModulesByCompany(targetId)
      if (companyId.current !== targetId) return
      const ids = activeParentModuleIds(assigned, modules)
      setActiveIds(ids)
      toast.success(`Módulo "${module.name}" ${ids.includes(module.id) ? "activo" : "inactivo"}`)
      await onRefresh(ids)
    } catch (error) {
      if (companyId.current === targetId) {
        setError("No se pudo confirmar el estado de los módulos. Vuelve a consultar antes de realizar otro cambio.")
        toast.error((error as Error).message ?? "No se pudo actualizar el módulo")
      }
    } finally { setSavingId(null) }
  }

  return <Dialog open={open} onOpenChange={value => { if (!savingId) onOpenChange(value) }}>
    <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Gestionar módulos {company && `- ${company.name}`}</DialogTitle>
        <DialogDescription>Módulos habilitados para la empresa. Los accesos a sus submódulos se asignan en Permisos ADMIN_COMPANY.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-4">
        {loading ? <div className="flex justify-center gap-2 py-8"><Loader2 className="h-5 w-5 animate-spin" />Cargando módulos...</div> : error ? <div role="alert" className="space-y-3 text-sm"><p className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />{error}</p><Button variant="outline" onClick={fetchModules}>Reintentar</Button></div> : !modules.length ? <p className="text-sm text-muted-foreground">No hay módulos disponibles.</p> : modules.map(module => {
          const active = activeIds.includes(module.id)
          return <section key={module.id} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0"><h3 className="font-medium">{module.name}</h3><Badge variant={active ? "default" : "secondary"}>{active ? "Activo" : "Inactivo"}</Badge></div>
              <div className="flex items-center gap-2">{savingId === module.id && <Loader2 className="h-4 w-4 animate-spin" />}<Switch aria-label={`Habilitar ${module.name}`} checked={active} disabled={!!savingId} onCheckedChange={() => toggle(module)} /></div>
            </div>
            {!!module.children?.length && <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-sm text-muted-foreground">{module.children.map(child => <li key={child.id}>{child.name}</li>)}</ul>}
          </section>
        })}
      </div>
      <DialogFooter><Button variant="outline" disabled={!!savingId} onClick={() => onOpenChange(false)}>Cerrar</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
