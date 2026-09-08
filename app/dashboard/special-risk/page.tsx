"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Download,
  Edit,
  Eye,
  FileText,
  FlameKindling,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

type ViewMode = "cards" | "list"
type SpecialRiskStatus = "ACTIVE" | "FINISHED"
type SpecialRiskActivity =
  | "MINERIA_SUBTERRANEA"
  | "ALTAS_TEMPERATURAS"
  | "RADIACIONES_IONIZANTES"
  | "BOMBEROS"
  | "AVIACION"
  | "TRABAJO_TUNELES"
  | "SUSTANCIAS_PELIGROSAS"
  | "OTRA"

type MockEmployee = {
  id: string
  name: string
  lastName: string
  job: string
}

type SpecialRiskEvidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
}

type SpecialRiskRecord = {
  id: string
  employeeId: string
  job: string
  activity: SpecialRiskActivity
  customActivity?: string
  startDate: string
  endDate: string
  specialContribution: boolean
  status: SpecialRiskStatus
  evidences: SpecialRiskEvidence[]
  observations: string
}

type SpecialRiskForm = {
  employeeId: string
  activity: SpecialRiskActivity
  customActivity: string
  startDate: string
  endDate: string
  specialContribution: "YES" | "NO"
  status: SpecialRiskStatus
  observations: string
}

type EvidenceForm = {
  fileName: string
  description: string
}

const employees: MockEmployee[] = [
  { id: "emp-1", name: "Carlos", lastName: "Ramirez", job: "Operario de mantenimiento" },
  { id: "emp-2", name: "Diana", lastName: "Mendoza", job: "Supervisora SST" },
  { id: "emp-3", name: "Mauricio", lastName: "Lopez", job: "Tecnico electricista" },
  { id: "emp-4", name: "Valentina", lastName: "Suarez", job: "Auxiliar operativo" },
]

const activityOptions: Array<{ value: SpecialRiskActivity; label: string }> = [
  { value: "MINERIA_SUBTERRANEA", label: "Mineria subterranea" },
  { value: "ALTAS_TEMPERATURAS", label: "Exposicion a altas temperaturas" },
  { value: "RADIACIONES_IONIZANTES", label: "Exposicion a radiaciones ionizantes" },
  { value: "BOMBEROS", label: "Bomberos" },
  { value: "AVIACION", label: "Aviacion" },
  { value: "TRABAJO_TUNELES", label: "Trabajo en tuneles" },
  { value: "SUSTANCIAS_PELIGROSAS", label: "Manipulacion de sustancias peligrosas" },
  { value: "OTRA", label: "Otra" },
]

const emptyForm: SpecialRiskForm = {
  employeeId: "",
  activity: "MINERIA_SUBTERRANEA",
  customActivity: "",
  startDate: "",
  endDate: "",
  specialContribution: "NO",
  status: "ACTIVE",
  observations: "",
}

const emptyEvidenceForm: EvidenceForm = {
  fileName: "",
  description: "",
}

const initialRecords: SpecialRiskRecord[] = [
  {
    id: "sr-1",
    employeeId: "emp-1",
    job: "Operario de mantenimiento",
    activity: "ALTAS_TEMPERATURAS",
    startDate: "2026-02-01",
    endDate: "2026-08-31",
    specialContribution: true,
    status: "ACTIVE",
    observations: "Exposicion programada por labores en area de calderas.",
    evidences: [
      {
        id: "ev-1",
        fileName: "matriz-exposicion-calderas.pdf",
        description: "Soporte de identificacion de exposicion a calor.",
        uploadedAt: "2026-02-03T09:15:00",
      },
    ],
  },
  {
    id: "sr-2",
    employeeId: "emp-3",
    job: "Tecnico electricista",
    activity: "RADIACIONES_IONIZANTES",
    startDate: "2026-03-12",
    endDate: "2026-04-15",
    specialContribution: false,
    status: "FINISHED",
    observations: "Actividad finalizada con seguimiento documental completo.",
    evidences: [
      {
        id: "ev-2",
        fileName: "certificado-control-radiacion.pdf",
        description: "Certificado de control de exposicion.",
        uploadedAt: "2026-04-16T11:20:00",
      },
    ],
  },
]

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function employeeName(employeeId?: string) {
  const employee = employees.find((item) => item.id === employeeId)
  if (!employee) return "Funcionario no asignado"
  return `${employee.name} ${employee.lastName}`
}

function employeeJob(employeeId?: string) {
  return employees.find((item) => item.id === employeeId)?.job ?? "Cargo no registrado"
}

function activityLabel(record: Pick<SpecialRiskRecord, "activity" | "customActivity">) {
  if (record.activity === "OTRA") return record.customActivity?.trim() || "Otra actividad"
  return activityOptions.find((option) => option.value === record.activity)?.label ?? record.activity
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function formatDateTime(value?: string | null) {
  if (!value) return "No registrada"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function statusLabel(status: SpecialRiskStatus) {
  return status === "ACTIVE" ? "Activo" : "Finalizado"
}

function statusClassName(status: SpecialRiskStatus) {
  return status === "ACTIVE"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-secondary text-secondary-foreground border-transparent"
}

function RiskDialog({
  open,
  record,
  onClose,
  onSave,
}: {
  open: boolean
  record: SpecialRiskRecord | null
  onClose: () => void
  onSave: (form: SpecialRiskForm, recordId?: string) => void
}) {
  const [form, setForm] = useState<SpecialRiskForm>(emptyForm)
  const editing = Boolean(record)

  useEffect(() => {
    if (!open) return

    setForm(
      record
        ? {
            employeeId: record.employeeId,
            activity: record.activity,
            customActivity: record.customActivity ?? "",
            startDate: record.startDate,
            endDate: record.endDate,
            specialContribution: record.specialContribution ? "YES" : "NO",
            status: record.status,
            observations: record.observations,
          }
        : emptyForm,
    )
  }, [open, record])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.employeeId) return toast.error("Selecciona el funcionario")
    if (!form.startDate) return toast.error("Selecciona la fecha de inicio")
    if (!form.endDate) return toast.error("Selecciona la fecha de finalizacion")
    if (form.endDate < form.startDate) return toast.error("La fecha de finalizacion no puede ser anterior al inicio")
    if (form.activity === "OTRA" && !form.customActivity.trim()) {
      return toast.error("Ingresa la actividad especial")
    }

    onSave(form, record?.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Editar riesgo especial" : "Nuevo riesgo especial"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registra el funcionario, actividad de alto riesgo, fechas, cotizacion especial y evidencias asociadas.
          </p>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Funcionario y actividad</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Funcionario</span>
                  <select
                    value={form.employeeId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        employeeId: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona funcionario</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} {employee.lastName} - {employee.job}
                      </option>
                    ))}
                  </select>
                </label>

                <Label className="grid gap-2">
                  Cargo
                  <Input value={employeeJob(form.employeeId)} disabled className="bg-secondary" />
                </Label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Tipo de actividad</span>
                  <select
                    value={form.activity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        activity: event.target.value as SpecialRiskActivity,
                        customActivity: event.target.value === "OTRA" ? current.customActivity : "",
                      }))
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {activityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {form.activity === "OTRA" && (
                  <Label className="grid gap-2">
                    Actividad
                    <Input
                      value={form.customActivity}
                      onChange={(event) => setForm((current) => ({ ...current, customActivity: event.target.value }))}
                      placeholder="Escribe la actividad especial"
                    />
                  </Label>
                )}
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Vigencia y estado</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Label className="grid gap-2">
                  Fecha inicio
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha finalizacion
                  <Input
                    type="date"
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                  />
                </Label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Cotizacion especial</span>
                  <select
                    value={form.specialContribution}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, specialContribution: event.target.value as "YES" | "NO" }))
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="YES">Si</option>
                    <option value="NO">No</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Estado</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SpecialRiskStatus }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="FINISHED">Finalizado</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Observaciones</h3>
              <Textarea
                value={form.observations}
                onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
                rows={4}
                placeholder="Describe condiciones, controles o contexto del riesgo especial"
              />
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Guardar cambios" : "Crear registro"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  record,
  onClose,
  onSave,
}: {
  record: SpecialRiskRecord | null
  onClose: () => void
  onSave: (record: SpecialRiskRecord, form: EvidenceForm) => void
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.fileName.trim()) return toast.error("Selecciona o registra el archivo")

    onSave(record, form)
    setForm(emptyEvidenceForm)
    onClose()
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Cargar evidencia</DialogTitle>
          <p className="text-sm text-muted-foreground">Relaciona soportes documentales o fotograficos del riesgo especial.</p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <Label className="grid gap-2">
              Seleccionar archivo
              <Input
                type="file"
                onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.files?.[0]?.name ?? "" }))}
              />
            </Label>
            <Label className="grid gap-2">
              Nombre del archivo
              <Input
                value={form.fileName}
                onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.value }))}
                placeholder="soporte-riesgo-especial.pdf"
              />
            </Label>
          </div>
          <Label className="grid gap-2">
            Descripcion
            <Textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              placeholder="Describe el soporte cargado"
            />
          </Label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <Upload className="h-4 w-4" />
              Guardar evidencia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DetailDialog({
  record,
  onClose,
  onDownloadEvidence,
}: {
  record: SpecialRiskRecord | null
  onClose: () => void
  onDownloadEvidence: (evidence: SpecialRiskEvidence) => void
}) {
  if (!record) return null

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Detalle del riesgo especial</DialogTitle>
          <p className="text-sm text-muted-foreground">Consulta funcionario, actividad, vigencia, cotizacion y evidencias.</p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoBlock label="Funcionario" value={employeeName(record.employeeId)} />
            <InfoBlock label="Cargo" value={record.job} />
            <InfoBlock label="Estado" value={statusLabel(record.status)} />
            <InfoBlock label="Cotizacion especial" value={record.specialContribution ? "Si" : "No"} />
          </div>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Actividad</h3>
            <p className="text-sm text-muted-foreground">{activityLabel(record)}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <InfoBlock label="Fecha inicio" value={formatDate(record.startDate)} />
              <InfoBlock label="Fecha finalizacion" value={formatDate(record.endDate)} />
            </div>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Observaciones</h3>
            <p className="text-sm text-muted-foreground">{record.observations || "Sin observaciones registradas."}</p>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Evidencias</h3>
            {record.evidences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay evidencias cargadas.</p>
            ) : (
              <div className="space-y-3">
                {record.evidences.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="flex flex-col gap-3 rounded-md bg-secondary p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">{evidence.fileName}</p>
                      <p className="text-sm text-muted-foreground">{evidence.description || "Sin descripcion."}</p>
                      <p className="text-xs text-muted-foreground">Cargado: {formatDateTime(evidence.uploadedAt)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => onDownloadEvidence(evidence)}>
                      <Download className="h-4 w-4" />
                      Descargar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "blue" | "green" | "amber" }) {
  const toneClass =
    tone === "blue"
      ? "text-blue-700"
      : tone === "green"
        ? "text-emerald-700"
        : tone === "amber"
          ? "text-amber-700"
          : "text-foreground"

  return (
    <div className="rounded-md bg-secondary px-3 py-1.5">
      <span className={`text-sm font-bold ${toneClass}`}>{value}</span>
      <span className="ml-2 text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

export default function SpecialRiskPage() {
  const [records, setRecords] = useState<SpecialRiskRecord[]>(initialRecords)
  const [search, setSearch] = useState("")
  const [activityFilter, setActivityFilter] = useState<SpecialRiskActivity | "all">("all")
  const [statusFilter, setStatusFilter] = useState<SpecialRiskStatus | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SpecialRiskRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<SpecialRiskRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<SpecialRiskRecord | null>(null)

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        employeeName(record.employeeId).toLowerCase().includes(query) ||
        record.job.toLowerCase().includes(query) ||
        activityLabel(record).toLowerCase().includes(query)

      const matchesActivity = activityFilter === "all" || record.activity === activityFilter
      const matchesStatus = statusFilter === "all" || record.status === statusFilter

      return matchesSearch && matchesActivity && matchesStatus
    })
  }, [activityFilter, records, search, statusFilter])

  const stats = useMemo(() => {
    return {
      total: records.length,
      active: records.filter((record) => record.status === "ACTIVE").length,
      finished: records.filter((record) => record.status === "FINISHED").length,
      specialContribution: records.filter((record) => record.specialContribution).length,
    }
  }, [records])

  function handleSave(form: SpecialRiskForm, recordId?: string) {
    const employee = employees.find((item) => item.id === form.employeeId)
    const payload = {
      employeeId: form.employeeId,
      job: employee?.job ?? "Cargo no registrado",
      activity: form.activity,
      customActivity: form.activity === "OTRA" ? form.customActivity.trim() : undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      specialContribution: form.specialContribution === "YES",
      status: form.status,
      observations: form.observations.trim(),
    }

    if (recordId) {
      setRecords((current) =>
        current.map((record) =>
          record.id === recordId
            ? {
                ...record,
                ...payload,
              }
            : record,
        ),
      )
      toast.success("Riesgo especial actualizado")
      return
    }

    setRecords((current) => [
      {
        id: createId("special-risk"),
        ...payload,
        evidences: [],
      },
      ...current,
    ])
    toast.success("Riesgo especial creado")
  }

  function handleSaveEvidence(record: SpecialRiskRecord, form: EvidenceForm) {
    const evidence: SpecialRiskEvidence = {
      id: createId("evidence"),
      fileName: form.fileName.trim(),
      description: form.description.trim(),
      uploadedAt: new Date().toISOString(),
    }

    setRecords((current) =>
      current.map((item) =>
        item.id === record.id
          ? {
              ...item,
              evidences: [evidence, ...item.evidences],
            }
          : item,
      ),
    )

    setDetailRecord((current) =>
      current?.id === record.id
        ? {
            ...current,
            evidences: [evidence, ...current.evidences],
          }
        : current,
    )

    toast.success("Evidencia cargada")
  }

  function downloadEvidence(evidence: SpecialRiskEvidence) {
    const blob = new Blob(
      [`Evidencia riesgo especial\nArchivo: ${evidence.fileName}\nDescripcion: ${evidence.description}\nCargado: ${formatDateTime(evidence.uploadedAt)}\n`],
      { type: "text/plain;charset=utf-8" },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = evidence.fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Riesgo Especial</h1>
          <p className="text-muted-foreground">
            Gestiona funcionarios con actividades de riesgo especial, cotizacion y evidencias asociadas.
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
          Nuevo riesgo especial
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center overflow-x-auto px-3 py-1">
          <div className="flex w-fit min-w-max items-center gap-2">
            <Metric label="Registros" value={stats.total} />
            <Metric label="Activos" value={stats.active} tone="blue" />
            <Metric label="Finalizados" value={stats.finished} tone="green" />
            <Metric label="Con cotizacion especial" value={stats.specialContribution} tone="amber" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_260px_180px]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Funcionario, cargo o actividad"
              />
            </div>
          </Label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Actividad</span>
            <select
              value={activityFilter}
              onChange={(event) => setActivityFilter(event.target.value as SpecialRiskActivity | "all")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todas</option>
              {activityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Estado</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as SpecialRiskStatus | "all")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="ACTIVE">Activo</option>
              <option value="FINISHED">Finalizado</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lista de riesgos especiales</h2>
            <p className="text-sm text-muted-foreground">{filteredRecords.length} registros encontrados</p>
          </div>
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

        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay riesgos especiales que coincidan con los filtros actuales.
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="border-border bg-card">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{employeeName(record.employeeId)}</h3>
                        <Badge variant="outline" className={statusClassName(record.status)}>
                          {statusLabel(record.status)}
                        </Badge>
                        {record.specialContribution && (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                            Cotizacion especial
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{record.job}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDetailRecord(record)}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </div>

                  <p className="line-clamp-2 text-sm text-muted-foreground">{activityLabel(record)}</p>

                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Inicio: {formatDate(record.startDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Finaliza: {formatDate(record.endDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {record.evidences.length} evidencias
                    </p>
                    <p className="flex items-center gap-2">
                      <FlameKindling className="h-4 w-4" />
                      {record.specialContribution ? "Con cotizacion" : "Sin cotizacion"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Funcionario</th>
                  <th className="px-4 py-3 font-medium">Cargo</th>
                  <th className="px-4 py-3 font-medium">Actividad</th>
                  <th className="px-4 py-3 font-medium">Fecha inicio</th>
                  <th className="px-4 py-3 font-medium">Fecha finalizacion</th>
                  <th className="px-4 py-3 font-medium">Cotizacion especial</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Evidencias</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{employeeName(record.employeeId)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{record.job}</td>
                    <td className="px-4 py-3">
                      <p className="max-w-[260px] truncate text-muted-foreground">{activityLabel(record)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(record.startDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(record.endDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.specialContribution ? "Si" : "No"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusClassName(record.status)}>
                        {statusLabel(record.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{record.evidences.length}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => setDetailRecord(record)}>
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditingRecord(record)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setEvidenceRecord(record)}>
                            <Upload className="h-4 w-4" />
                            Cargar evidencia
                          </DropdownMenuItem>
                          {record.evidences.length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => downloadEvidence(record.evidences[0])}>
                                <Download className="h-4 w-4" />
                                Descargar ultima evidencia
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <RiskDialog
        open={dialogOpen}
        record={editingRecord}
        onClose={() => {
          setDialogOpen(false)
          setEditingRecord(null)
        }}
        onSave={handleSave}
      />
      <EvidenceDialog record={evidenceRecord} onClose={() => setEvidenceRecord(null)} onSave={handleSaveEvidence} />
      <DetailDialog record={detailRecord} onClose={() => setDetailRecord(null)} onDownloadEvidence={downloadEvidence} />
    </main>
  )
}
