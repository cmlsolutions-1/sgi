"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Download,
  Edit,
  Eye,
  FileText,
  HeartPulse,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Target,
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
import { Textarea } from "@/components/ui/textarea"
import { listEmployees } from "@/services/employeeService"
import {
  createHealthyLifestyle,
  deleteHealthyLifestyle,
  downloadHealthyLifestyleEvidence,
  exportHealthyLifestyle,
  getHealthyLifestyle,
  listHealthyLifestyles,
  updateHealthyLifestyle,
  uploadHealthyLifestyleEvidence,
} from "@/services/healthyLifestyleService"
import type { Employee } from "@/types/manager/employee"
import type {
  HealthyLifestyleActivity,
  HealthyLifestyleActivityStatus as ActivityStatus,
  HealthyLifestyleActivityType as ActivityType,
  UpsertHealthyLifestyleDto,
} from "@/types/manager/healthy-lifestyle"

type ViewMode = "cards" | "list"

type EmployeeOption = {
  id: string
  name: string
  email?: string
}

type HealthyLifestyleRecord = HealthyLifestyleActivity & {
  responsibleName: string
}

type HealthyLifestyleForm = {
  name: string
  type: ActivityType
  startDate: string
  endDate: string
  responsibleEmployeeId: string
  objective: string
  scope: string
}

type EvidenceForm = {
  fileName: string
  description: string
  isConfirmed: boolean
}

type EvidencePreview = {
  title: string
  url: string
  mimeType: string
}

const emptyForm: HealthyLifestyleForm = {
  name: "",
  type: "CAMPAIGN",
  startDate: "",
  endDate: "",
  responsibleEmployeeId: "",
  objective: "",
  scope: "",
}

const emptyEvidenceForm: EvidenceForm = {
  fileName: "",
  description: "",
  isConfirmed: true,
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

function bogotaDateKey(value?: string | null) {
  if (!value) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}`
}

function completedWithDelay(record: HealthyLifestyleActivity) {
  const evidenceDate = bogotaDateKey(record.evidence?.createdAt)
  return Boolean(evidenceDate && record.endDate && evidenceDate > record.endDate.slice(0, 10))
}

function employeeFullName(employee: Employee) {
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "Funcionario sin nombre"
}

function toEmployeeOptions(employees: Employee[]): EmployeeOption[] {
  return employees.map((employee) => ({
    id: employee.id,
    name: employeeFullName(employee),
    email: employee.email,
  }))
}

function findEmployeeName(employees: EmployeeOption[], employeeId: string) {
  return employees.find((employee) => employee.id === employeeId)?.name ?? ""
}

function EmployeePicker({
  employees,
  value,
  loading,
  onChange,
}: {
  employees: EmployeeOption[]
  value: string
  loading: boolean
  onChange: (employeeId: string) => void
}) {
  const [query, setQuery] = useState("")
  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return employees

    return employees.filter((employee) => {
      const name = employee.name.toLowerCase()
      const email = employee.email?.toLowerCase() ?? ""
      return name.includes(normalizedQuery) || email.includes(normalizedQuery)
    })
  }, [employees, query])

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-foreground">Responsable</span>
      <div className="rounded-md border border-input bg-background">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 pl-9"
              placeholder="Buscar funcionario..."
            />
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando funcionarios...
            </div>
          ) : filteredEmployees.length > 0 ? (
            <div className="grid gap-1">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => onChange(employee.id)}
                  className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    value === employee.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="block font-medium">{employee.name}</span>
                  {employee.email && (
                    <span className={`block truncate text-xs ${value === employee.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {employee.email}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : employees.length > 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">No se encontraron funcionarios con esa búsqueda.</p>
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">No hay funcionarios disponibles para seleccionar.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function activityTypeLabel(type: ActivityType) {
  if (type === "CAMPAIGN") return "Campaña"
  if (type === "TALK") return "Charla"
  if (type === "DAY") return "Jornada"
  return "Actividad"
}

function statusLabel(status: ActivityStatus) {
  if (status === "COMPLETED") return "Cumplida"
  if (status === "IN_PROGRESS") return "En ejecución"
  return "Planeada"
}

function statusClassName(status: ActivityStatus) {
  if (status === "COMPLETED") return "bg-accentActivd text-accentActivd-foreground border-transparent"
  if (status === "IN_PROGRESS") return "bg-blue-600 text-white border-transparent"
  return "bg-warning/10 text-warning border-warning/20"
}

function normalizeRecord(record: HealthyLifestyleActivity, employees: EmployeeOption[] = []): HealthyLifestyleRecord {
  const backendName = record.responsibleEmployee
    ? `${record.responsibleEmployee.name} ${record.responsibleEmployee.lastName}`.trim()
    : ""
  return {
    ...record,
    status: record.evidence || record.evidenceId ? "COMPLETED" : record.status,
    responsibleName: backendName || findEmployeeName(employees, record.responsibleEmployeeId) || "Responsable no disponible",
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function canPreview(mimeType?: string) {
  return Boolean(mimeType?.startsWith("image/") || mimeType === "application/pdf" || mimeType?.startsWith("text/"))
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function Metric({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "blue" | "green" | "amber" }) {
  const toneClass =
    tone === "blue"
      ? "text-blue-700"
      : tone === "green"
        ? "text-emerald-700"
        : tone === "amber"
          ? "text-amber-700"
          : "text-foreground"

  return (
    <div className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2">
      <span className={`text-xl font-bold leading-none ${toneClass}`}>{value}</span>
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </div>
  )
}

function ActivityDialog({
  open,
  record,
  employees,
  employeesLoading,
  onClose,
  onSave,
}: {
  open: boolean
  record: HealthyLifestyleRecord | null
  employees: EmployeeOption[]
  employeesLoading: boolean
  onClose: () => void
  onSave: (form: HealthyLifestyleForm, responsibleName: string, recordId?: string) => Promise<boolean>
}) {
  const [form, setForm] = useState<HealthyLifestyleForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const editing = Boolean(record)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            name: record.name,
            type: record.type,
            startDate: record.startDate,
            endDate: record.endDate,
            responsibleEmployeeId: record.responsibleEmployeeId,
            objective: record.objective,
            scope: record.scope,
          }
        : emptyForm,
    )
  }, [open, record])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) onClose()
  }

  function update<K extends keyof HealthyLifestyleForm>(key: K, value: HealthyLifestyleForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim()) return toast.error("Ingresa el nombre de la actividad")
    if (!form.startDate) return toast.error("Selecciona la fecha de inicio")
    if (!form.endDate) return toast.error("Selecciona la fecha fin")
    if (form.endDate < form.startDate) return toast.error("La fecha fin no puede ser anterior a la fecha de inicio")
    if (!form.responsibleEmployeeId) return toast.error("Selecciona el responsable")
    if (!form.objective.trim()) return toast.error("Ingresa el objetivo")
    if (!form.scope.trim()) return toast.error("Ingresa el alcance")

    const responsibleName = findEmployeeName(employees, form.responsibleEmployeeId) || record?.responsibleName || "Responsable seleccionado"

    setSaving(true)
    const saved = await onSave(form, responsibleName, record?.id)
    setSaving(false)
    if (!saved) return
    setForm(emptyForm)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Editar actividad saludable" : "Nueva actividad saludable"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registra el programa, campaña o jornada orientada a estilos de vida y entornos de trabajo saludables.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos de la actividad</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  Nombre actividad
                  <Input
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
                    placeholder="Campaña de prevención de tabaquismo"
                  />
                </Label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Tipo</span>
                  <select
                    value={form.type}
                    onChange={(event) => update("type", event.target.value as ActivityType)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="CAMPAIGN">Campaña</option>
                    <option value="TALK">Charla</option>
                    <option value="DAY">Jornada</option>
                    <option value="ACTIVITY">Actividad</option>
                  </select>
                </label>
                <Label className="grid gap-2">
                  Fecha inicio
                  <Input type="date" value={form.startDate} onChange={(event) => update("startDate", event.target.value)} disabled={editing} />
                </Label>
                <Label className="grid gap-2">
                  Fecha fin
                  <Input type="date" value={form.endDate} onChange={(event) => update("endDate", event.target.value)} disabled={editing} />
                </Label>
                {editing && (
                  <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 md:col-span-2">
                    Las fechas quedan fijas después de crear la actividad para conservar la trazabilidad del cumplimiento.
                  </p>
                )}
                <div className="md:col-span-2">
                  <EmployeePicker
                    employees={employees}
                    loading={employeesLoading}
                    value={form.responsibleEmployeeId}
                    onChange={(employeeId) => update("responsibleEmployeeId", employeeId)}
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <Label className="grid gap-2 rounded-md border border-border p-4">
                Objetivo
                <Textarea
                  value={form.objective}
                  onChange={(event) => update("objective", event.target.value)}
                  rows={5}
                  placeholder="Describe el propósito de la actividad."
                />
              </Label>
              <Label className="grid gap-2 rounded-md border border-border p-4">
                Alcance
                <Textarea
                  value={form.scope}
                  onChange={(event) => update("scope", event.target.value)}
                  rows={5}
                  placeholder="Define población objetivo, áreas y cobertura."
                />
              </Label>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Guardar cambios" : "Crear actividad"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  record,
  uploading,
  onClose,
  onUpload,
}: {
  record: HealthyLifestyleRecord | null
  uploading: boolean
  onClose: () => void
  onUpload: (recordId: string, form: EvidenceForm, file: File) => Promise<boolean>
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!record) return
    setForm({
      fileName: record.evidence?.originalName ?? "",
      description: record.evidence?.description ?? "",
      isConfirmed: record.evidence?.isConfirmed ?? true,
    })
    setFile(null)
  }, [record])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!file) return toast.error("Selecciona la evidencia")
    if (!form.description.trim()) return toast.error("Describe brevemente la evidencia")

    const uploaded = await onUpload(record.id, form, file)
    if (!uploaded) return
    setForm(emptyEvidenceForm)
    setFile(null)
    onClose()
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Subir evidencia</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adjunta el programa, registros, fotografías o soportes que evidencien la ejecución.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-dashed border-border bg-secondary p-4">
            <Label className="grid gap-2">
              Archivo
              <Input
                type="file"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null
                  setFile(selected)
                  setForm((current) => ({ ...current, fileName: selected?.name ?? "" }))
                }}
              />
            </Label>
            <Input
              className="mt-3"
              value={form.fileName}
              readOnly
              placeholder="Selecciona un archivo"
            />
          </div>

          <Label className="grid gap-2">
            Descripción de la evidencia
            <Textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              placeholder="Ej: Registro fotográfico y asistencia de la campaña."
            />
          </Label>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isConfirmed}
              onChange={(event) => setForm((current) => ({ ...current, isConfirmed: event.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            Evidencia confirmada
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
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
  onDownload,
  onViewEvidence,
  onDownloadEvidence,
}: {
  record: HealthyLifestyleRecord | null
  onClose: () => void
  onDownload: (record: HealthyLifestyleRecord) => void
  onViewEvidence: (record: HealthyLifestyleRecord) => void
  onDownloadEvidence: (record: HealthyLifestyleRecord) => void
}) {
  if (!record) return null

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{record.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Consulta el programa, alcance, responsable y evidencia asociada.
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoBlock label="Tipo" value={activityTypeLabel(record.type)} />
            <InfoBlock label="Estado" value={statusLabel(record.status)} />
            <InfoBlock label="Inicio" value={formatDate(record.startDate)} />
            <InfoBlock label="Fin" value={formatDate(record.endDate)} />
          </div>
          {completedWithDelay(record) && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              Con retraso: la evidencia fue cargada después de la fecha fin establecida.
            </p>
          )}

          <InfoBlock label="Responsable" value={record.responsibleName} />

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="h-4 w-4" />
              Objetivo
            </h3>
            <p className="text-sm text-muted-foreground">{record.objective}</p>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Alcance</h3>
            <p className="text-sm text-muted-foreground">{record.scope}</p>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4" />
              Evidencia
            </h3>
            {record.evidence ? (
              <div className="flex flex-col gap-3 rounded-md bg-secondary p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{record.evidence.originalName}</p>
                  <p className="text-muted-foreground">{record.evidence.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(record.evidence.createdAt)} · {record.evidence.isConfirmed ? "Confirmada" : "Sin confirmar"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => onViewEvidence(record)}>
                    <Eye className="h-4 w-4" /> Ver
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => onDownloadEvidence(record)}>
                    <Download className="h-4 w-4" /> Descargar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay evidencia cargada.</p>
            )}
          </section>
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" className="gap-2" onClick={() => onDownload(record)}>
            <Download className="h-4 w-4" />
            Descargar programa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EvidencePreviewDialog({ preview, onClose }: { preview: EvidencePreview | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{preview?.title ?? "Evidencia"}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {preview && canPreview(preview.mimeType) ? (
            preview.mimeType.startsWith("image/") ? (
              <img src={preview.url} alt={preview.title} className="mx-auto max-h-[70dvh] max-w-full rounded-md object-contain" />
            ) : (
              <iframe title={preview.title} src={preview.url} className="h-[70dvh] w-full rounded-md border border-border" />
            )
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed border-border text-center text-muted-foreground">
              <FileText className="mb-3 h-10 w-10" />
              <p className="font-medium">Vista previa no disponible</p>
              <p className="text-sm">Puedes descargar el archivo desde el detalle.</p>
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          <Button type="button" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function HealthyLifestylesPage() {
  const [records, setRecords] = useState<HealthyLifestyleRecord[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [busyRecordId, setBusyRecordId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<ActivityType | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<HealthyLifestyleRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<HealthyLifestyleRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<HealthyLifestyleRecord | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)

  async function loadRecords(employeeOptions: EmployeeOption[] = employees, showError = true) {
    try {
      const response = await listHealthyLifestyles({ limit: 100 })
      setRecords(response.items.map((record) => normalizeRecord(record, employeeOptions)))
    } catch (error) {
      if (showError) toast.error(error instanceof Error ? error.message : "No se pudieron cargar las actividades saludables")
    }
  }

  useEffect(() => {
    let mounted = true

    async function loadPage() {
      setRecordsLoading(true)
      try {
        const [employeeList, activities] = await Promise.all([listEmployees(), listHealthyLifestyles({ limit: 100 })])
        if (!mounted) return
        const employeeOptions = toEmployeeOptions(employeeList)
        setEmployees(employeeOptions)
        setRecords(activities.items.map((record) => normalizeRecord(record, employeeOptions)))
      } catch (error) {
        if (mounted) toast.error(error instanceof Error ? error.message : "No se pudo cargar el módulo de estilos de vida saludable")
      } finally {
        if (mounted) {
          setEmployeesLoading(false)
          setRecordsLoading(false)
        }
      }
    }

    void loadPage()

    return () => {
      mounted = false
    }
  }, [])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        record.name.toLowerCase().includes(query) ||
        record.responsibleName.toLowerCase().includes(query) ||
        record.objective.toLowerCase().includes(query) ||
        record.scope.toLowerCase().includes(query)
      const matchesType = typeFilter === "all" || record.type === typeFilter

      return matchesSearch && matchesType
    })
  }, [records, search, typeFilter])

  const stats = useMemo(() => {
    return {
      total: records.length,
      planned: records.filter((record) => record.status === "PLANNED").length,
      inProgress: records.filter((record) => record.status === "IN_PROGRESS").length,
      completed: records.filter((record) => record.status === "COMPLETED").length,
      withEvidence: records.filter((record) => Boolean(record.evidence)).length,
    }
  }, [records])

  async function handleSave(form: HealthyLifestyleForm, _responsibleName: string, recordId?: string) {
    const existingRecord = recordId ? records.find((record) => record.id === recordId) : undefined
    const payload: UpsertHealthyLifestyleDto = {
      name: form.name.trim(),
      type: form.type,
      startDate: existingRecord?.startDate ?? form.startDate,
      endDate: existingRecord?.endDate ?? form.endDate,
      responsibleEmployeeId: form.responsibleEmployeeId,
      objective: form.objective.trim(),
      scope: form.scope.trim(),
    }

    try {
      if (recordId) {
        await updateHealthyLifestyle(recordId, payload)
        toast.success("Actividad saludable actualizada")
      } else {
        await createHealthyLifestyle(payload)
        toast.success("Actividad saludable creada")
      }
      await loadRecords(employees, false)
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la actividad saludable")
      return false
    }
  }

  async function handleUpload(recordId: string, form: EvidenceForm, file: File) {
    setUploading(true)
    try {
      const evidence = await uploadHealthyLifestyleEvidence(recordId, {
        file,
        description: form.description.trim(),
        isConfirmed: form.isConfirmed,
      })
      const currentRecord = records.find((record) => record.id === recordId)
      setRecords((current) => current.map((record) => record.id === recordId ? { ...record, evidence, evidenceId: evidence.id, status: "COMPLETED" } : record))
      setDetailRecord((current) => current?.id === recordId ? { ...current, evidence, evidenceId: evidence.id, status: "COMPLETED" } : current)
      await loadRecords(employees, false)
      const uploadedLate = Boolean(currentRecord && completedWithDelay({ ...currentRecord, evidence, evidenceId: evidence.id, status: "COMPLETED" }))
      toast.success(uploadedLate ? "Evidencia cargada. La actividad quedó cumplida con retraso." : "Evidencia cargada. La actividad quedó cumplida.")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la evidencia")
      return false
    } finally {
      setUploading(false)
    }
  }

  async function openDetail(record: HealthyLifestyleRecord) {
    setBusyRecordId(record.id)
    try {
      setDetailRecord(normalizeRecord(await getHealthyLifestyle(record.id), employees))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el detalle")
    } finally {
      setBusyRecordId(null)
    }
  }

  async function downloadProgramPdf(record: HealthyLifestyleRecord) {
    setBusyRecordId(record.id)
    try {
      const blob = await exportHealthyLifestyle(record.id)
      downloadBlob(blob, `estilos-vida-saludable-${record.name.replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el programa")
    } finally {
      setBusyRecordId(null)
    }
  }

  async function handleDelete(record: HealthyLifestyleRecord) {
    if (!window.confirm(`¿Eliminar la actividad "${record.name}"?`)) return
    setBusyRecordId(record.id)
    try {
      await deleteHealthyLifestyle(record.id)
      setRecords((current) => current.filter((item) => item.id !== record.id))
      toast.success("Actividad saludable eliminada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la actividad")
    } finally {
      setBusyRecordId(null)
    }
  }

  async function viewEvidence(record: HealthyLifestyleRecord) {
    if (!record.evidence) return toast.error("La actividad no tiene evidencia")
    setBusyRecordId(record.id)
    try {
      const blob = await downloadHealthyLifestyleEvidence(record.evidence.downloadUrl)
      setPreview({
        title: record.evidence.originalName,
        url: URL.createObjectURL(blob),
        mimeType: record.evidence.mimeType || blob.type || "application/octet-stream",
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir la evidencia")
    } finally {
      setBusyRecordId(null)
    }
  }

  async function downloadEvidence(record: HealthyLifestyleRecord) {
    if (!record.evidence) return toast.error("La actividad no tiene evidencia")
    setBusyRecordId(record.id)
    try {
      const blob = await downloadHealthyLifestyleEvidence(record.evidence.downloadUrl)
      downloadBlob(blob, record.evidence.originalName)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar la evidencia")
    } finally {
      setBusyRecordId(null)
    }
  }

  function closePreview() {
    if (preview) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  function openEdit(record: HealthyLifestyleRecord) {
    setEditingRecord(record)
    setDialogOpen(true)
  }

  function openCreate() {
    setEditingRecord(null)
    setDialogOpen(true)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estilos de Vida Saludable</h1>
          <p className="text-muted-foreground">
            Programa actividades para promover hábitos saludables y prevenir farmacodependencia, alcoholismo y tabaquismo.
          </p>
        </div>
        <Button type="button" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva actividad
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5"><Metric label="Actividades" value={stats.total} /><Metric label="Planeadas" value={stats.planned} tone="amber" /><Metric label="En ejecución" value={stats.inProgress} tone="blue" /><Metric label="Cumplidas" value={stats.completed} tone="green" /><Metric label="Con evidencia" value={stats.withEvidence} tone="green" /></section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_240px]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Actividad, responsable, objetivo o alcance"
              />
            </div>
          </Label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Tipo</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as ActivityType | "all")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="CAMPAIGN">Campaña</option>
              <option value="TALK">Charla</option>
              <option value="DAY">Jornada</option>
              <option value="ACTIVITY">Actividad</option>
            </select>
          </label>
        </div>
      </section>

      
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Actividades registradas</h2>
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

        {viewMode === "cards" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="border-border bg-card">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{record.name}</h3>
                        <Badge variant="outline" className={statusClassName(record.status)}>
                          {statusLabel(record.status)}
                        </Badge>
                        {completedWithDelay(record) && <span className="text-xs font-semibold text-red-600">Con retraso</span>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{activityTypeLabel(record.type)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void openDetail(record)} disabled={busyRecordId === record.id}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(record.startDate)} a {formatDate(record.endDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      {record.responsibleName}
                    </p>
                    <p className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {record.evidence ? "Con evidencia" : "Sin evidencia"}
                    </p>
                  </div>

                  <p className="line-clamp-2 text-sm text-muted-foreground">{record.objective}</p>

                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openEdit(record)}>
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void downloadProgramPdf(record)} disabled={busyRecordId === record.id}>
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button type="button" size="sm" className="gap-2" onClick={() => setEvidenceRecord(record)}>
                      <Upload className="h-4 w-4" />
                      Evidencia
                    </Button>
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
                  <th className="px-4 py-3 font-medium">Actividad</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Fechas</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Objetivo</th>
                  <th className="px-4 py-3 font-medium">Evidencia</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{record.name}</p>
                      <p className="text-muted-foreground">Creada: {formatDate(record.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{activityTypeLabel(record.type)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(record.startDate)} a {formatDate(record.endDate)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{record.responsibleName}</td>
                    <td className="px-4 py-3">
                      <p className="max-w-[260px] truncate text-muted-foreground">{record.objective}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{record.evidence?.originalName ?? "Sin evidencia"}</td>
                    <td className="px-4 py-3">
                      <div className="grid justify-items-start gap-1">
                        <Badge variant="outline" className={statusClassName(record.status)}>
                          {statusLabel(record.status)}
                        </Badge>
                        {completedWithDelay(record) && <span className="text-xs font-semibold text-red-600">Con retraso</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => void openDetail(record)} disabled={busyRecordId === record.id}>
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(record)}>
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => void downloadProgramPdf(record)} disabled={busyRecordId === record.id}>
                            <Download className="h-4 w-4" />
                            Descargar programa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEvidenceRecord(record)}>
                            <Upload className="h-4 w-4" />
                            Subir evidencia
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => void handleDelete(record)} className="text-destructive" disabled={busyRecordId === record.id}>
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {recordsLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando actividades...</span>
                    </td>
                  </tr>
                )}
                {!recordsLoading && filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No hay actividades de estilos de vida saludable para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ActivityDialog
        open={dialogOpen}
        record={editingRecord}
        employees={employees}
        employeesLoading={employeesLoading}
        onClose={() => {
          setDialogOpen(false)
          setEditingRecord(null)
        }}
        onSave={handleSave}
      />
      <EvidenceDialog record={evidenceRecord} uploading={uploading} onClose={() => setEvidenceRecord(null)} onUpload={handleUpload} />
      <DetailDialog
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        onDownload={(record) => void downloadProgramPdf(record)}
        onViewEvidence={(record) => void viewEvidence(record)}
        onDownloadEvidence={(record) => void downloadEvidence(record)}
      />
      <EvidencePreviewDialog preview={preview} onClose={closePreview} />
    </main>
  )
}
