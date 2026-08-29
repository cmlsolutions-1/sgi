"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Bug, CalendarDays, Edit, Loader2, Plus, Power, Search } from "lucide-react"
import { toast } from "sonner"

import { SanitaryDocumentPanel } from "@/components/sanitary/SanitaryDocumentPanel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  changePestControlStatus,
  createPestControl,
  listPestControls,
  updatePestControl,
} from "@/services/sanitaryService"
import type {
  CreatePestControlRequest,
  PestControlRecord,
  RecordStatus,
} from "@/types/manager/sanitary"

const emptyForm: CreatePestControlRequest = {
  date: "",
  serviceProviderCompanyName: "",
  nextVisitDate: "",
}

function statusLabel(status: RecordStatus) {
  return status === "ACTIVE" ? "Activo" : "Inactivo"
}

function statusClassName(status: RecordStatus) {
  return status === "ACTIVE"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-destructive text-white border-transparent"
}

function formatDate(date?: string) {
  if (!date) return "No registrada"
  return date.split("T")[0]
}

function PestControlDialog({
  open,
  record,
  onClose,
  onSave,
}: {
  open: boolean
  record: PestControlRecord | null
  onClose: () => void
  onSave: (payload: CreatePestControlRequest) => Promise<void>
}) {
  const [form, setForm] = useState<CreatePestControlRequest>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            date: formatDate(record.date),
            serviceProviderCompanyName: record.serviceProviderCompanyName ?? "",
            nextVisitDate: formatDate(record.nextVisitDate),
          }
        : emptyForm,
    )
  }, [open, record])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const providerName = form.serviceProviderCompanyName.trim()
    if (!form.date) return toast.error("Selecciona la fecha del control")
    if (!providerName) return toast.error("Ingresa la empresa prestadora del servicio")
    if (!form.nextVisitDate) return toast.error("Selecciona la fecha de próxima visita")
    if (form.nextVisitDate < form.date) return toast.error("La próxima visita no puede ser anterior a la fecha del control")

    setSaving(true)
    try {
      await onSave({
        date: form.date,
        serviceProviderCompanyName: providerName,
        nextVisitDate: form.nextVisitDate,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record ? "Editar control de plagas" : "Nuevo control de plagas"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Fecha del control</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Próxima visita</Label>
              <Input
                type="date"
                min={form.date || undefined}
                value={form.nextVisitDate}
                onChange={(event) => setForm((current) => ({ ...current, nextVisitDate: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Empresa prestadora del servicio</Label>
            <Input
              value={form.serviceProviderCompanyName}
              onChange={(event) => setForm((current) => ({ ...current, serviceProviderCompanyName: event.target.value }))}
              placeholder="Nombre de la empresa"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {record ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function PestControlPage() {
  const [records, setRecords] = useState<PestControlRecord[]>([])
  const [status, setStatus] = useState<RecordStatus | "all">("all")
  const [query, setQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PestControlRecord | null>(null)

  const activeCount = useMemo(() => records.filter((record) => record.status === "ACTIVE").length, [records])
  const scheduledCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return records.filter((record) => formatDate(record.nextVisitDate) >= today).length
  }, [records])

  async function loadData() {
    setLoading(true)
    try {
      const response = await listPestControls({
        limit: 100,
        status,
        search: query,
        startDate,
        endDate,
      })
      setRecords(response.items ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar control de plagas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  async function handleSave(payload: CreatePestControlRequest) {
    try {
      if (editingRecord) {
        await updatePestControl(editingRecord.id, payload)
        toast.success("Control de plagas actualizado")
      } else {
        await createPestControl(payload)
        toast.success("Control de plagas creado")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el control de plagas")
    }
  }

  async function handleChangeStatus(record: PestControlRecord) {
    const nextStatus: RecordStatus = record.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await changePestControlStatus(record.id, nextStatus)
      setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, status: nextStatus } : item)))
      toast.success(`Control ${nextStatus === "ACTIVE" ? "activado" : "inactivado"}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Control de plagas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra seguimientos, proveedores, próximas visitas y evidencias del control integrado de plagas.
          </p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            setEditingRecord(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo control
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Controles</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{records.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Bug className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Activos</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Próximas visitas</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{scheduledCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Seguimientos registrados</h2>
              <p className="text-sm text-muted-foreground">Filtra por estado, proveedor o rango de fechas.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[150px_150px_150px_220px_auto]">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as RecordStatus | "all")}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Todos</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar proveedor" />
              </div>
              <Button type="button" variant="outline" className="gap-2" onClick={loadData}>
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
              No hay controles de plagas registrados.
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <article key={record.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{record.serviceProviderCompanyName}</h3>
                        <Badge className={statusClassName(record.status)}>{statusLabel(record.status)}</Badge>
                      </div>
                      <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <p className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span>
                            <span className="font-medium">Control:</span> {formatDate(record.date)}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span>
                            <span className="font-medium">Próxima visita:</span> {formatDate(record.nextVisitDate)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          setEditingRecord(record)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant={record.status === "ACTIVE" ? "destructive" : "default"}
                        size="sm"
                        className="gap-2"
                        onClick={() => handleChangeStatus(record)}
                      >
                        <Power className="h-4 w-4" />
                        {record.status === "ACTIVE" ? "Inactivar" : "Activar"}
                      </Button>
                    </div>
                  </div>
                  <SanitaryDocumentPanel referenceType="PEST_CONTROL" resourceId={record.id} />
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PestControlDialog
        open={dialogOpen}
        record={editingRecord}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
