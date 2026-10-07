"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Coins,
  Download,
  Edit,
  Eye,
  ExternalLink,
  FileText,
  FlameKindling,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { listEmployees } from "@/services/employeeService"
import {
  createSpecialRisk,
  deleteSpecialRiskDocument,
  downloadSpecialRiskDocumentFile,
  listSpecialRiskActivities,
  listSpecialRiskDocuments,
  listSpecialRisks,
  updateSpecialRisk,
  uploadSpecialRiskDocument,
} from "@/services/specialRiskService"
import type { Employee } from "@/types/manager/employee"
import type {
  SpecialRisk,
  SpecialRiskActivity,
  SpecialRiskDocument,
  SpecialRiskStatus,
  UpsertSpecialRiskDto,
} from "@/types/manager/special-risk"

type ViewMode = "cards" | "list"
type SpecialRiskRecord = SpecialRisk & { evidences: SpecialRiskDocument[] }
type ActivityOption = { value: SpecialRiskActivity; label: string }

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
  file: File | null
  fileName: string
  description: string
  observation: string
}

type EvidencePreview = {
  document: SpecialRiskDocument
  url: string
  mimeType: string
}

const defaultActivityOptions: ActivityOption[] = [
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
  file: null,
  fileName: "",
  description: "",
  observation: "",
}

function employeeName(record: Pick<SpecialRiskRecord, "employee">) {
  if (!record.employee) return "Funcionario no asignado"
  return `${record.employee.name} ${record.employee.lastName}`.trim()
}

function employeeJob(employees: Employee[], employeeId?: string) {
  return employees.find((item) => item.id === employeeId)?.job?.name ?? "Cargo no registrado"
}

function activityLabel(
  record: Pick<SpecialRiskRecord, "activity" | "customActivity">,
  activityOptions: ActivityOption[],
) {
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

function canPreviewEvidence(mimeType: string) {
  return mimeType.startsWith("image/") || mimeType === "application/pdf"
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
  employees,
  activityOptions,
  onClose,
  onSave,
}: {
  open: boolean
  record: SpecialRiskRecord | null
  employees: Employee[]
  activityOptions: ActivityOption[]
  onClose: () => void
  onSave: (form: SpecialRiskForm, recordId?: string) => Promise<void>
}) {
  const [form, setForm] = useState<SpecialRiskForm>(emptyForm)
  const editing = Boolean(record)
  const selectedEmployee = employees.find((employee) => employee.id === form.employeeId)

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
            observations: record.observations ?? "",
          }
        : emptyForm,
    )
  }, [open, record])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.employeeId) return toast.error("Selecciona el funcionario")
    if (!form.startDate) return toast.error("Selecciona la fecha de inicio")
    if (!form.endDate) return toast.error("Selecciona la fecha de finalizacion")
    if (form.endDate < form.startDate) return toast.error("La fecha de finalizacion no puede ser anterior al inicio")
    if (form.activity === "OTRA" && !form.customActivity.trim()) {
      return toast.error("Ingresa la actividad especial")
    }

    try {
      await onSave(form, record?.id)
      onClose()
    } catch {
      // El contenedor presenta el mensaje del backend y mantiene abierto el formulario.
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Editar riesgo especial" : "Nuevo riesgo especial"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registra el funcionario, actividad de alto riesgo, fechas, cotizacion especial y evidencias asociadas.
          </p>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Funcionario y actividad</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Selecciona a la persona y la actividad que origina el riesgo especial.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="special-risk-employee">Funcionario</Label>
                  <Select
                    value={form.employeeId}
                    onValueChange={(employeeId) => setForm((current) => ({ ...current, employeeId }))}
                  >
                    <SelectTrigger id="special-risk-employee" className="h-11 w-full bg-white">
                      <SelectValue placeholder="Selecciona un funcionario" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 bg-white">
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} {employee.lastName} - {employee.job?.name ?? "Cargo no registrado"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">El cargo se completa según el funcionario elegido.</p>
                </div>

                <div className="space-y-2">
                  <Label>Cargo asociado</Label>
                  <div className="flex min-h-11 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2 shadow-sm">
                    <BriefcaseBusiness className="h-4 w-4 shrink-0 text-primary" />
                    <span className={selectedEmployee ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
                      {employeeJob(employees, form.employeeId)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special-risk-activity">Tipo de actividad</Label>
                  <Select
                    value={form.activity}
                    onValueChange={(activity) =>
                      setForm((current) => ({
                        ...current,
                        activity: activity as SpecialRiskActivity,
                        customActivity: activity === "OTRA" ? current.customActivity : "",
                      }))
                    }
                  >
                    <SelectTrigger id="special-risk-activity" className="h-11 w-full bg-white">
                      <SelectValue placeholder="Selecciona una actividad" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {activityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Elige la actividad de alto riesgo aplicable.</p>
                </div>

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

            <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Vigencia y estado</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Define el periodo, la cotización y el estado del registro.</p>
                </div>
              </div>
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
                <div className="space-y-2">
                  <Label htmlFor="special-risk-contribution" className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    Cotizacion especial
                  </Label>
                  <Select
                    value={form.specialContribution}
                    onValueChange={(specialContribution) =>
                      setForm((current) => ({ ...current, specialContribution: specialContribution as "YES" | "NO" }))
                    }
                  >
                    <SelectTrigger id="special-risk-contribution" className="h-10 w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="YES">Si</SelectItem>
                      <SelectItem value="NO">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="special-risk-status" className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    Estado
                  </Label>
                  <Select
                    value={form.status}
                    onValueChange={(status) =>
                      setForm((current) => ({ ...current, status: status as SpecialRiskStatus }))
                    }
                  >
                    <SelectTrigger id="special-risk-status" className="h-10 w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="FINISHED">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Observaciones</h3>
              <Textarea
                value={form.observations}
                onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
                rows={4}
                placeholder="Describe condiciones, controles o contexto del riesgo especial"
              />
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-white px-6 py-4">
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
  onSave: (record: SpecialRiskRecord, form: EvidenceForm) => Promise<void>
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.file) return toast.error("Selecciona el archivo")

    try {
      await onSave(record, form)
      setForm(emptyEvidenceForm)
      onClose()
    } catch {
      // El contenedor presenta el mensaje del backend y mantiene abierto el formulario.
    }
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
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setForm((current) => ({ ...current, file, fileName: file?.name ?? "" }))
                }}
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
          <Label className="grid gap-2">
            Observacion
            <Textarea
              value={form.observation}
              onChange={(event) => setForm((current) => ({ ...current, observation: event.target.value }))}
              rows={3}
              placeholder="Agrega una observacion sobre la evidencia"
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
  activityOptions,
  onClose,
  onPreviewEvidence,
  onDownloadEvidence,
  onDeleteEvidence,
  previewLoadingId,
  deletingEvidenceId,
}: {
  record: SpecialRiskRecord | null
  activityOptions: ActivityOption[]
  onClose: () => void
  onPreviewEvidence: (evidence: SpecialRiskDocument) => void
  onDownloadEvidence: (evidence: SpecialRiskDocument) => void
  onDeleteEvidence: (evidence: SpecialRiskDocument) => void
  previewLoadingId: string | null
  deletingEvidenceId: string | null
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
            <InfoBlock label="Funcionario" value={employeeName(record)} />
            <InfoBlock label="Cargo" value={record.job?.name ?? "Cargo no registrado"} />
            <InfoBlock label="Estado" value={statusLabel(record.status)} />
            <InfoBlock label="Cotizacion especial" value={record.specialContribution ? "Si" : "No"} />
          </div>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Actividad</h3>
            <p className="text-sm text-muted-foreground">{activityLabel(record, activityOptions)}</p>
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
                      <p className="font-medium text-foreground">{evidence.originalName}</p>
                      <p className="text-sm text-muted-foreground">{evidence.description || "Sin descripcion."}</p>
                      {evidence.observation ? (
                        <p className="text-sm text-muted-foreground">Observacion: {evidence.observation}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">Cargado: {formatDateTime(evidence.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={previewLoadingId === evidence.id}
                        onClick={() => onPreviewEvidence(evidence)}
                      >
                        {previewLoadingId === evidence.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        Ver
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => onDownloadEvidence(evidence)}>
                        <Download className="h-4 w-4" />
                        Descargar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        disabled={deletingEvidenceId === evidence.id}
                        onClick={() => onDeleteEvidence(evidence)}
                      >
                        {deletingEvidenceId === evidence.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Eliminar
                      </Button>
                    </div>
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
    <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${toneClass}`}>{value}</span>
    </div>
  )
}

export default function SpecialRiskPage() {
  const [records, setRecords] = useState<SpecialRiskRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [activityOptions, setActivityOptions] = useState<ActivityOption[]>(defaultActivityOptions)
  const [search, setSearch] = useState("")
  const [activityFilter, setActivityFilter] = useState<SpecialRiskActivity | "all">("all")
  const [statusFilter, setStatusFilter] = useState<SpecialRiskStatus | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SpecialRiskRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<SpecialRiskRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<SpecialRiskRecord | null>(null)
  const [evidencePreview, setEvidencePreview] = useState<EvidencePreview | null>(null)
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null)
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<string | null>(null)

  async function loadData() {
    try {
      const [riskData, employeeData, activityData] = await Promise.all([
        listSpecialRisks({ limit: 100 }),
        listEmployees(),
        listSpecialRiskActivities(),
      ])

      setEmployees(employeeData)
      if (activityData.length > 0) {
        setActivityOptions(activityData.map((item) => ({ value: item.code, label: item.name })))
      }
      setRecords((current) =>
        riskData.items.map((record) => ({
          ...record,
          evidences: current.find((item) => item.id === record.id)?.evidences ?? [],
        })),
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los riesgos especiales")
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    return () => {
      if (evidencePreview?.url) URL.revokeObjectURL(evidencePreview.url)
    }
  }, [evidencePreview])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        employeeName(record).toLowerCase().includes(query) ||
        (record.job?.name ?? "").toLowerCase().includes(query) ||
        activityLabel(record, activityOptions).toLowerCase().includes(query)

      const matchesActivity = activityFilter === "all" || record.activity === activityFilter
      const matchesStatus = statusFilter === "all" || record.status === statusFilter

      return matchesSearch && matchesActivity && matchesStatus
    })
  }, [activityFilter, activityOptions, records, search, statusFilter])

  const stats = useMemo(() => {
    return {
      total: records.length,
      active: records.filter((record) => record.status === "ACTIVE").length,
      finished: records.filter((record) => record.status === "FINISHED").length,
      specialContribution: records.filter((record) => record.specialContribution).length,
    }
  }, [records])

  async function handleSave(form: SpecialRiskForm, recordId?: string) {
    const payload: UpsertSpecialRiskDto = {
      employeeId: form.employeeId,
      activity: form.activity,
      ...(form.activity === "OTRA" ? { customActivity: form.customActivity.trim() } : {}),
      startDate: form.startDate,
      endDate: form.endDate,
      specialContribution: form.specialContribution === "YES",
      status: form.status,
      observations: form.observations.trim(),
    }

    try {
      if (recordId) {
        await updateSpecialRisk(recordId, payload)
        toast.success("Riesgo especial actualizado")
      } else {
        await createSpecialRisk(payload)
        toast.success("Riesgo especial creado")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el riesgo especial")
      throw error
    }
  }

  async function loadEvidence(record: SpecialRiskRecord) {
    const evidences = await listSpecialRiskDocuments(record.id)
    setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, evidences } : item)))
    setDetailRecord((current) => (current?.id === record.id ? { ...current, evidences } : current))
    return evidences
  }

  async function openDetail(record: SpecialRiskRecord) {
    setDetailRecord(record)
    try {
      await loadEvidence(record)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las evidencias")
    }
  }

  async function handleSaveEvidence(record: SpecialRiskRecord, form: EvidenceForm) {
    if (!form.file) throw new Error("Selecciona el archivo")
    try {
      await uploadSpecialRiskDocument(record.id, {
        file: form.file,
        isConfirmed: true,
        observation: form.observation,
        description: form.description,
      })
      await Promise.all([loadEvidence(record), loadData()])
      toast.success("Evidencia cargada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la evidencia")
      throw error
    }
  }

  async function downloadEvidence(evidence: SpecialRiskDocument) {
    if (!evidence.downloadUrl) return
    try {
      const blob = await downloadSpecialRiskDocumentFile(evidence.downloadUrl)
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement("a")
      link.href = url
      link.download = evidence.originalName || "evidencia-riesgo-especial"
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar la evidencia")
    }
  }

  async function previewEvidence(evidence: SpecialRiskDocument) {
    if (!evidence.downloadUrl) return toast.error("La evidencia no tiene un archivo disponible")

    setPreviewLoadingId(evidence.id)
    try {
      const blob = await downloadSpecialRiskDocumentFile(evidence.downloadUrl)
      const mimeType = blob.type || evidence.mimeType || "application/octet-stream"
      const url = URL.createObjectURL(blob)
      setEvidencePreview({ document: evidence, url, mimeType })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo previsualizar la evidencia")
    } finally {
      setPreviewLoadingId(null)
    }
  }

  async function handleDeleteEvidence(record: SpecialRiskRecord, evidence: SpecialRiskDocument) {
    if (!window.confirm(`¿Eliminar la evidencia ${evidence.originalName}?`)) return

    setDeletingEvidenceId(evidence.id)
    try {
      await deleteSpecialRiskDocument(record.id, evidence.id)
      await Promise.all([loadEvidence(record), loadData()])
      toast.success("Evidencia eliminada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la evidencia")
    } finally {
      setDeletingEvidenceId(null)
    }
  }

  async function downloadLatestEvidence(record: SpecialRiskRecord) {
    try {
      const evidences = record.evidences.length > 0 ? record.evidences : await loadEvidence(record)
      if (evidences[0]) await downloadEvidence(evidences[0])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la evidencia")
    }
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

      <div className="overflow-x-auto px-3 py-1">
        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 [&>div]:min-h-14 [&>div]:flex-row-reverse [&>div]:justify-end [&>div]:rounded-lg [&>div]:border [&>div]:border-slate-200 [&>div]:bg-slate-50 [&>div]:px-3.5 [&>div]:py-2 [&>div>span:last-child]:text-xl [&>div>span:last-child]:font-bold [&>div>span:last-child]:leading-none">
          <Metric label="Registros" value={stats.total} />
          <Metric label="Activos" value={stats.active} tone="green" />
          <Metric label="Finalizados" value={stats.finished} tone="blue" />
          <Metric label="Con cotizacion especial" value={stats.specialContribution} tone="amber" />
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_260px_180px]">
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
                        <h3 className="font-semibold text-foreground">{employeeName(record)}</h3>
                        <Badge variant="outline" className={statusClassName(record.status)}>
                          {statusLabel(record.status)}
                        </Badge>
                        {record.specialContribution && (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                            Cotizacion especial
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{record.job?.name ?? "Cargo no registrado"}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void openDetail(record)}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </div>

                  <p className="line-clamp-2 text-sm text-muted-foreground">{activityLabel(record, activityOptions)}</p>

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
                      {record.evidenceCount} evidencias
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
                      <p className="font-medium text-foreground">{employeeName(record)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{record.job?.name ?? "Cargo no registrado"}</td>
                    <td className="px-4 py-3">
                      <p className="max-w-[260px] truncate text-muted-foreground">{activityLabel(record, activityOptions)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(record.startDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(record.endDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.specialContribution ? "Si" : "No"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusClassName(record.status)}>
                        {statusLabel(record.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{record.evidenceCount}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => void openDetail(record)}>
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
                          {record.evidenceCount > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => void downloadLatestEvidence(record)}>
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
        employees={employees}
        activityOptions={activityOptions}
        onClose={() => {
          setDialogOpen(false)
          setEditingRecord(null)
        }}
        onSave={handleSave}
      />
      <EvidenceDialog record={evidenceRecord} onClose={() => setEvidenceRecord(null)} onSave={handleSaveEvidence} />
      <DetailDialog
        record={detailRecord}
        activityOptions={activityOptions}
        onClose={() => setDetailRecord(null)}
        onPreviewEvidence={(evidence) => void previewEvidence(evidence)}
        onDownloadEvidence={(evidence) => void downloadEvidence(evidence)}
        onDeleteEvidence={(evidence) => {
          if (detailRecord) void handleDeleteEvidence(detailRecord, evidence)
        }}
        previewLoadingId={previewLoadingId}
        deletingEvidenceId={deletingEvidenceId}
      />
      <Dialog open={Boolean(evidencePreview)} onOpenChange={(open) => !open && setEvidencePreview(null)}>
        <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
            <DialogTitle>{evidencePreview?.document.originalName ?? "Vista previa de evidencia"}</DialogTitle>
            <p className="text-sm text-muted-foreground">Previsualizacion del documento asociado al riesgo especial.</p>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4">
            {evidencePreview?.mimeType.startsWith("image/") ? (
              <img
                src={evidencePreview.url}
                alt={evidencePreview.document.originalName}
                className="mx-auto max-h-[70dvh] max-w-full rounded-md object-contain"
              />
            ) : evidencePreview?.mimeType === "application/pdf" ? (
              <iframe
                src={evidencePreview.url}
                title={evidencePreview.document.originalName}
                className="h-[70dvh] min-h-[28rem] w-full rounded-md border border-border bg-white"
              />
            ) : evidencePreview ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Este tipo de archivo no admite vista previa. Puedes abrirlo o descargarlo.
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            {evidencePreview && canPreviewEvidence(evidencePreview.mimeType) ? (
              <Button type="button" variant="outline" className="gap-2" onClick={() => window.open(evidencePreview.url, "_blank", "noopener,noreferrer")}>
                <ExternalLink className="h-4 w-4" />
                Abrir en pestaña
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => evidencePreview && void downloadEvidence(evidencePreview.document)}
            >
              <Download className="h-4 w-4" />
              Descargar
            </Button>
            <Button type="button" onClick={() => setEvidencePreview(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
