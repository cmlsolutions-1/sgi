"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Download, Edit, Loader2, Plus, Power, Search, SprayCan } from "lucide-react"
import { toast } from "sonner"

import { SanitaryDocumentPanel } from "@/components/sanitary/SanitaryDocumentPanel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildReportPdf, formatDisplayDate } from "@/lib/reporting"
import { listEmployees } from "@/services/employeeService"
import {
  changeSanitationStatus,
  createSanitationRecord,
  listHygieneSupplies,
  listSanitationRecords,
  updateSanitationRecord,
} from "@/services/sanitaryService"
import type { Employee } from "@/types/manager/employee"
import type {
  CreateSanitationRequest,
  HygieneSupply,
  RecordStatus,
  SanitationRecord,
  SanitationResponsibleType,
  SanitationType,
} from "@/types/manager/sanitary"

const sanitationTypes: Array<{ value: SanitationType; label: string }> = [
  { value: "CLEANING_AND_DISINFECTION", label: "Limpieza y desinfección" },
  { value: "RESERVE_TANK", label: "Tanque de reserva" },
  { value: "WASTE_EXPOSURE", label: "Exposición a residuos" },
]

const emptyForm: CreateSanitationRequest = {
  type: "CLEANING_AND_DISINFECTION",
  date: "",
  time: "",
  responsibleType: "EMPLOYEE",
  responsibleEmployeeId: "",
  hygieneSupplyIds: [],
}

function typeLabel(type: SanitationType) {
  return sanitationTypes.find((option) => option.value === type)?.label ?? type
}

function statusLabel(status: RecordStatus) {
  return status === "ACTIVE" ? "Activo" : "Inactivo"
}

function statusClassName(status: RecordStatus) {
  return status === "ACTIVE"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-destructive text-white border-transparent"
}

function employeeName(employee?: Pick<Employee, "name" | "lastName" | "email"> | null) {
  if (!employee) return "No asignado"
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "No asignado"
}

function requiresSupplies(type: SanitationType) {
  return type === "CLEANING_AND_DISINFECTION" || type === "RESERVE_TANK"
}

function SanitationDialog({
  open,
  record,
  employees,
  supplies,
  loadingEmployees,
  onClose,
  onSave,
}: {
  open: boolean
  record: SanitationRecord | null
  employees: Employee[]
  supplies: HygieneSupply[]
  loadingEmployees: boolean
  onClose: () => void
  onSave: (payload: CreateSanitationRequest) => Promise<void>
}) {
  const [form, setForm] = useState<CreateSanitationRequest>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            type: record.type,
            date: record.date ?? "",
            time: (record.time ?? "").slice(0, 5),
            responsibleType: record.responsibleType,
            responsibleEmployeeId: record.responsibleEmployeeId ?? "",
            thirdPartyName: record.thirdPartyName ?? "",
            hygieneSupplyIds: record.hygieneSupplyIds ?? record.hygieneSupplies?.map((supply) => supply.id) ?? [],
          }
        : emptyForm,
    )
  }, [open, record])

  function toggleSupply(supplyId: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      hygieneSupplyIds: checked
        ? Array.from(new Set([...(current.hygieneSupplyIds ?? []), supplyId]))
        : (current.hygieneSupplyIds ?? []).filter((id) => id !== supplyId),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.date) return toast.error("Selecciona la fecha")
    if (!form.time) return toast.error("Selecciona la hora")
    if (form.responsibleType === "EMPLOYEE" && !form.responsibleEmployeeId) return toast.error("Selecciona el funcionario responsable")
    if (form.responsibleType === "THIRD_PARTY" && !form.thirdPartyName?.trim()) return toast.error("Ingresa el nombre del tercero responsable")
    if (requiresSupplies(form.type) && (form.hygieneSupplyIds ?? []).length === 0) return toast.error("Selecciona al menos un insumo de higiene")

    const payload: CreateSanitationRequest = {
      type: form.type,
      date: form.date,
      time: form.time,
      responsibleType: form.responsibleType,
      hygieneSupplyIds: requiresSupplies(form.type) ? form.hygieneSupplyIds ?? [] : [],
    }

    if (form.responsibleType === "EMPLOYEE") payload.responsibleEmployeeId = form.responsibleEmployeeId
    else payload.thirdPartyName = form.thirdPartyName?.trim()

    setSaving(true)
    try {
      await onSave(payload)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-3xl overflow-y-auto p-0">
        <DialogHeader>
          <div className="border-b border-slate-200 px-5 py-4">
            <DialogTitle>{record ? "Editar saneamiento" : "Nueva actividad de saneamiento"}</DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Registra el tipo de actividad, responsable e insumos utilizados.
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 pb-5">
          <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Datos de la actividad</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid min-w-0 gap-2 md:col-span-1">
                <Label htmlFor="sanitation-type">Tipo</Label>
                <select
                  id="sanitation-type"
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as SanitationType }))}
                  className="h-10 w-full min-w-0 truncate rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition hover:border-slate-400 focus:border-primary focus:ring-3 focus:ring-primary/25"
                >
                  {sanitationTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="sanitation-date">Fecha</Label>
                <Input
                  id="sanitation-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                />
              </div>
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="sanitation-time">Hora</Label>
                <Input
                  id="sanitation-time"
                  type="time"
                  value={form.time}
                  onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Responsable</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="sanitation-responsible-type">Tipo de responsable</Label>
                <select
                  id="sanitation-responsible-type"
                  value={form.responsibleType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      responsibleType: event.target.value as SanitationResponsibleType,
                      responsibleEmployeeId: "",
                      thirdPartyName: "",
                    }))
                  }
                  className="h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition hover:border-slate-400 focus:border-primary focus:ring-3 focus:ring-primary/25"
                >
                  <option value="EMPLOYEE">Funcionario</option>
                  <option value="THIRD_PARTY">Tercero</option>
                </select>
              </div>
              {form.responsibleType === "EMPLOYEE" ? (
                <div className="grid min-w-0 gap-2">
                  <Label htmlFor="sanitation-responsible-employee">Funcionario responsable</Label>
                  <select
                    id="sanitation-responsible-employee"
                    value={form.responsibleEmployeeId ?? ""}
                    onChange={(event) => setForm((current) => ({ ...current, responsibleEmployeeId: event.target.value }))}
                    className="h-10 w-full min-w-0 truncate rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition hover:border-slate-400 focus:border-primary focus:ring-3 focus:ring-primary/25"
                  >
                    <option value="">Selecciona un funcionario</option>
                    {loadingEmployees ? (
                      <option value="" disabled>
                        Cargando funcionarios...
                      </option>
                    ) : employees.length === 0 ? (
                      <option value="" disabled>
                        No hay funcionarios disponibles
                      </option>
                    ) : (
                      employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employeeName(employee)}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <div className="grid min-w-0 gap-2">
                  <Label htmlFor="sanitation-third-party">Nombre del tercero</Label>
                  <Input
                    id="sanitation-third-party"
                    value={form.thirdPartyName ?? ""}
                    onChange={(event) => setForm((current) => ({ ...current, thirdPartyName: event.target.value }))}
                    placeholder="Empresa o persona responsable"
                  />
                </div>
              )}
            </div>
          </section>

          {requiresSupplies(form.type) && (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Insumos utilizados</h3>
                <p className="text-xs text-muted-foreground">Selecciona los insumos aplicados durante la actividad.</p>
              </div>
              <div className="grid max-h-56 gap-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-2">
                {supplies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay insumos activos disponibles.</p>
                ) : (
                  supplies.map((supply) => (
                    <label key={supply.id} className="flex min-w-0 items-center gap-2 rounded-md border bg-white p-2 text-sm">
                      <Checkbox checked={(form.hygieneSupplyIds ?? []).includes(supply.id)} onCheckedChange={(checked) => toggleSupply(supply.id, checked === true)} />
                      <span className="min-w-0 truncate">{supply.name}</span>
                    </label>
                  ))
                )}
              </div>
            </section>
          )}

          <DialogFooter className="border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
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

export default function SanitationPage() {
  const [records, setRecords] = useState<SanitationRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [supplies, setSupplies] = useState<HygieneSupply[]>([])
  const [status, setStatus] = useState<RecordStatus | "all">("all")
  const [type, setType] = useState<SanitationType | "all">("all")
  const [loading, setLoading] = useState(true)
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SanitationRecord | null>(null)
  const activeCount = useMemo(() => records.filter((record) => record.status === "ACTIVE").length, [records])

  async function loadData() {
    setLoading(true)
    setLoadingEmployees(true)
    try {
      const [recordResult, employeeResult, supplyResult] = await Promise.allSettled([
        listSanitationRecords({ limit: 100, status, type }),
        listEmployees(),
        listHygieneSupplies({ limit: 100, status: "ACTIVE" }),
      ])

      if (recordResult.status === "fulfilled") {
        setRecords(recordResult.value.items ?? [])
      } else {
        toast.error(recordResult.reason instanceof Error ? recordResult.reason.message : "No se pudo cargar saneamiento")
      }

      if (employeeResult.status === "fulfilled") {
        setEmployees(employeeResult.value)
      } else {
        setEmployees([])
        toast.error(employeeResult.reason instanceof Error ? employeeResult.reason.message : "No se pudo cargar funcionarios")
      }

      if (supplyResult.status === "fulfilled") {
        setSupplies(supplyResult.value.items ?? [])
      } else {
        setSupplies([])
        toast.error(supplyResult.reason instanceof Error ? supplyResult.reason.message : "No se pudo cargar insumos")
      }
    } finally {
      setLoading(false)
      setLoadingEmployees(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type])

  async function handleSave(payload: CreateSanitationRequest) {
    try {
      if (editingRecord) {
        await updateSanitationRecord(editingRecord.id, payload)
        toast.success("Actividad actualizada")
      } else {
        await createSanitationRecord(payload)
        toast.success("Actividad creada")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la actividad")
    }
  }

  async function handleChangeStatus(record: SanitationRecord) {
    const nextStatus: RecordStatus = record.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await changeSanitationStatus(record.id, nextStatus)
      setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, status: nextStatus } : item)))
      toast.success(`Actividad ${nextStatus === "ACTIVE" ? "activada" : "inactivada"}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado")
    }
  }

  function handleDownloadOrder(record: SanitationRecord) {
    const responsible =
      record.responsibleType === "EMPLOYEE"
        ? employeeName(record.responsibleEmployee)
        : record.thirdPartyName || "No registrado"
    const supplies = record.hygieneSupplies?.map((supply) => supply.name).join(", ") || "No aplica"

    buildReportPdf({
      title: "Orden diaria de saneamiento",
      subtitle: `${typeLabel(record.type)} · ${formatDisplayDate(record.date)}`,
      filename: `orden-saneamiento-${record.date || "sin-fecha"}-${record.id.slice(0, 8)}.pdf`,
      summary: [
        ["Tipo de actividad", typeLabel(record.type)],
        ["Fecha", formatDisplayDate(record.date)],
        ["Hora", record.time?.slice(0, 5) || "No registrada"],
        ["Responsable", responsible],
        ["Estado", statusLabel(record.status)],
      ],
      rows: [
        { campo: "Insumos utilizados", detalle: supplies },
        { campo: "Confirmación", detalle: "Orden generada desde el módulo de saneamiento para revisión, impresión y soporte operativo." },
      ],
      columns: [
        { header: "Campo", value: (row) => row.campo },
        { header: "Detalle", value: (row) => row.detalle },
      ],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Saneamiento</h1>
          <p className="mt-1 text-sm text-muted-foreground">Administra actividades, responsables, insumos y evidencias del programa de saneamiento.</p>
        </div>
        <Button type="button" className="gap-2" onClick={() => { setEditingRecord(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4" />
          Nueva actividad
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-medium text-muted-foreground">Actividades</p><p className="mt-1 text-2xl font-bold">{records.length}</p></div><SprayCan className="h-6 w-6 text-primary" /></CardContent></Card>
        <Card className="rounded-lg"><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Activas</p><p className="mt-1 text-2xl font-bold">{activeCount}</p></CardContent></Card>
      </div>

      <Card className="rounded-lg">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Plan de saneamiento</h2>
            <div className="grid gap-2 sm:grid-cols-[180px_150px_auto]">
              <select value={type} onChange={(event) => setType(event.target.value as SanitationType | "all")} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">Todos los tipos</option>
                {sanitationTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={status} onChange={(event) => setStatus(event.target.value as RecordStatus | "all")} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">Todos</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
              <Button type="button" variant="outline" className="gap-2" onClick={loadData}><Search className="h-4 w-4" />Buscar</Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : records.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-muted-foreground">No hay actividades registradas.</div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <article key={record.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{typeLabel(record.type)}</h3>
                        <Badge className={statusClassName(record.status)}>{statusLabel(record.status)}</Badge>
                      </div>
                      <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <p><span className="font-medium">Fecha:</span> {record.date} {record.time?.slice(0, 5)}</p>
                        <p><span className="font-medium">Responsable:</span> {record.responsibleType === "EMPLOYEE" ? employeeName(record.responsibleEmployee) : record.thirdPartyName}</p>
                        <p className="md:col-span-2"><span className="font-medium">Insumos:</span> {record.hygieneSupplies?.map((supply) => supply.name).join(", ") || "No aplica"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => handleDownloadOrder(record)}><Download className="h-4 w-4" />Descargar orden</Button>
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => { setEditingRecord(record); setDialogOpen(true) }}><Edit className="h-4 w-4" />Editar</Button>
                      <Button type="button" variant={record.status === "ACTIVE" ? "destructive" : "default"} size="sm" className="gap-2" onClick={() => handleChangeStatus(record)}><Power className="h-4 w-4" />{record.status === "ACTIVE" ? "Inactivar" : "Activar"}</Button>
                    </div>
                  </div>
                  <SanitaryDocumentPanel referenceType="SANITATION" resourceId={record.id} />
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SanitationDialog
        open={dialogOpen}
        record={editingRecord}
        employees={employees}
        supplies={supplies}
        loadingEmployees={loadingEmployees}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
