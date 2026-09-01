"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Edit, LayoutGrid, List, Loader2, MoreHorizontal, PackageCheck, Plus, Power, Search, Upload } from "lucide-react"
import { toast } from "sonner"

import { SanitaryDocumentPanel } from "@/components/sanitary/SanitaryDocumentPanel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  changeHygieneSupplyStatus,
  createHygieneSupply,
  listHygieneSupplies,
  updateHygieneSupply,
} from "@/services/sanitaryService"
import type { CreateHygieneSupplyRequest, HygieneSupply, RecordStatus } from "@/types/manager/sanitary"

type ViewMode = "cards" | "list"

const emptyForm: CreateHygieneSupplyRequest = {
  name: "",
  technicalSheet: "",
  usageInstructions: "",
  contraindications: "",
}

function statusLabel(status: RecordStatus) {
  return status === "ACTIVE" ? "Activo" : "Inactivo"
}

function statusClassName(status: RecordStatus) {
  return status === "ACTIVE"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-destructive text-white border-transparent"
}

function SupplyDialog({
  open,
  supply,
  onClose,
  onSave,
}: {
  open: boolean
  supply: HygieneSupply | null
  onClose: () => void
  onSave: (payload: CreateHygieneSupplyRequest) => Promise<void>
}) {
  const [form, setForm] = useState<CreateHygieneSupplyRequest>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      supply
        ? {
            name: supply.name ?? "",
            technicalSheet: supply.technicalSheet ?? "",
            usageInstructions: supply.usageInstructions ?? "",
            contraindications: supply.contraindications ?? "",
          }
        : emptyForm,
    )
  }, [open, supply])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim()) return toast.error("Ingresa el nombre del insumo")
    if (!form.technicalSheet.trim()) return toast.error("Ingresa la ficha técnica")
    if (!form.usageInstructions.trim()) return toast.error("Ingresa las instrucciones de uso")
    if (!form.contraindications.trim()) return toast.error("Ingresa las contraindicaciones")

    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        technicalSheet: form.technicalSheet.trim(),
        usageInstructions: form.usageInstructions.trim(),
        contraindications: form.contraindications.trim(),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supply ? "Editar insumo de higiene" : "Nuevo insumo de higiene"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label>Ficha técnica</Label>
            <Textarea
              value={form.technicalSheet}
              onChange={(event) => setForm((current) => ({ ...current, technicalSheet: event.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Instrucciones de uso</Label>
            <Textarea
              value={form.usageInstructions}
              onChange={(event) => setForm((current) => ({ ...current, usageInstructions: event.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Contraindicaciones</Label>
            <Textarea
              value={form.contraindications}
              onChange={(event) => setForm((current) => ({ ...current, contraindications: event.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {supply ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function HygieneSuppliesPage() {
  const [supplies, setSupplies] = useState<HygieneSupply[]>([])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<RecordStatus | "all">("all")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSupply, setEditingSupply] = useState<HygieneSupply | null>(null)
  const [documentsSupply, setDocumentsSupply] = useState<HygieneSupply | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const activeCount = useMemo(() => supplies.filter((supply) => supply.status === "ACTIVE").length, [supplies])

  async function loadData() {
    setLoading(true)
    try {
      const data = await listHygieneSupplies({ limit: 100, search: query, status })
      setSupplies(data.items ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar los insumos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  async function handleSave(payload: CreateHygieneSupplyRequest) {
    try {
      if (editingSupply) {
        await updateHygieneSupply(editingSupply.id, payload)
        toast.success("Insumo actualizado")
      } else {
        await createHygieneSupply(payload)
        toast.success("Insumo creado")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el insumo")
    }
  }

  async function handleChangeStatus(supply: HygieneSupply) {
    const nextStatus: RecordStatus = supply.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await changeHygieneSupplyStatus(supply.id, nextStatus)
      setSupplies((current) => current.map((item) => (item.id === supply.id ? { ...item, status: nextStatus } : item)))
      toast.success(`Insumo ${nextStatus === "ACTIVE" ? "activado" : "inactivado"}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Insumos de higiene</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona los elementos, fichas técnicas, usos y soportes asociados a higiene.
          </p>
        </div>
        <Button type="button" className="gap-2" onClick={() => { setEditingSupply(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4" />
          Nuevo insumo
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total insumos</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{supplies.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <PackageCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Activos</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{activeCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Inventario de insumos</h2>
              <div className="inline-flex w-fit rounded-md border border-border bg-secondary p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  className="h-8 gap-2"
                  onClick={() => setViewMode("cards")}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Tarjetas
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  className="h-8 gap-2"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                  Lista
                </Button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_auto] lg:ml-auto lg:w-[620px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar insumo" value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as RecordStatus | "all")}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Todos</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
              <Button type="button" variant="outline" onClick={loadData}>
                Buscar
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : supplies.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
              No hay insumos registrados.
            </div>
          ) : viewMode === "cards" ? (
            <div className="space-y-3">
              {supplies.map((supply) => (
                <article key={supply.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{supply.name}</h3>
                        <Badge className={statusClassName(supply.status)}>{statusLabel(supply.status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{supply.technicalSheet}</p>
                      <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <p><span className="font-medium">Uso:</span> {supply.usageInstructions}</p>
                        <p><span className="font-medium">Contraindicaciones:</span> {supply.contraindications}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => { setEditingSupply(supply); setDialogOpen(true) }}>
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button type="button" variant={supply.status === "ACTIVE" ? "destructive" : "default"} size="sm" className="gap-2" onClick={() => handleChangeStatus(supply)}>
                        <Power className="h-4 w-4" />
                        {supply.status === "ACTIVE" ? "Inactivar" : "Activar"}
                      </Button>
                    </div>
                  </div>
                  <SanitaryDocumentPanel referenceType="HYGIENE_SUPPLY" resourceId={supply.id} />
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border bg-card">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Insumo</th>
                    <th className="px-4 py-3 font-medium">Ficha técnica</th>
                    <th className="px-4 py-3 font-medium">Uso</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {supplies.map((supply) => (
                    <tr key={supply.id} className="align-middle">
                      <td className="px-4 py-3 font-medium">{supply.name}</td>
                      <td className="px-4 py-3">
                        <p className="max-w-[300px] truncate text-muted-foreground">{supply.technicalSheet}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[300px] truncate text-muted-foreground">{supply.usageInstructions}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusClassName(supply.status)}>{statusLabel(supply.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditingSupply(supply)
                                setDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setDocumentsSupply(supply)}>
                              <Upload className="h-4 w-4" />
                              Cargar / ver archivos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant={supply.status === "ACTIVE" ? "destructive" : "default"}
                              onSelect={() => handleChangeStatus(supply)}
                            >
                              <Power className="h-4 w-4" />
                              {supply.status === "ACTIVE" ? "Inactivar" : "Activar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(documentsSupply)} onOpenChange={(open) => !open && setDocumentsSupply(null)}>
        <DialogContent className="max-h-[88vh] w-[calc(100vw-2rem)] max-w-4xl overflow-hidden bg-card p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Documentos del insumo de higiene</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-4">
            {documentsSupply && <SanitaryDocumentPanel referenceType="HYGIENE_SUPPLY" resourceId={documentsSupply.id} />}
          </div>
        </DialogContent>
      </Dialog>

      <SupplyDialog open={dialogOpen} supply={editingSupply} onClose={() => setDialogOpen(false)} onSave={handleSave} />
    </div>
  )
}
