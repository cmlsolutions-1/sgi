"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Download,
  Droplets,
  Edit,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Loader2,
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
import { listEmployees } from "@/services/employeeService"
import {
  createHygieneDailyEvidence,
  createHygieneProgram,
  downloadHygieneEvidence,
  exportHygieneService,
  getHygieneService,
  listHygieneServices,
  updateHygieneDailyEvidence,
  updateHygieneProgram,
  uploadHygieneEvidence,
} from "@/services/hygieneServicesService"
import type { Employee } from "@/types/manager/employee"
import type {
  HygieneClassification,
  HygieneImplementationType,
  HygieneProgramProcedureType,
  HygieneServiceDocument,
  HygieneServiceRecord as ApiHygieneServiceRecord,
} from "@/types/manager/hygieneServices"

type ViewMode = "cards" | "list"
type RecordKind = "DAILY_EVIDENCE" | "PROGRAM"
type ImplementationType = HygieneImplementationType
type Classification = HygieneClassification
type ProgramProcedureType = HygieneProgramProcedureType
type Evidence = HygieneServiceDocument

type EmployeeOption = {
  id: string
  name: string
  email?: string
}

type DailyEvidenceRecord = {
  id: string
  kind: "DAILY_EVIDENCE"
  recordName: string
  implementationType: ImplementationType
  otherImplementation?: string
  classification: Classification
  date: string
  responsibleEmployeeId: string
  responsibleName: string
  observations: string
  evidence?: Evidence
  createdAt: string
}

type ProgramRecord = {
  id: string
  kind: "PROGRAM"
  name: string
  procedureType: ProgramProcedureType
  date: string
  evidence?: Evidence
  createdAt: string
}

type HygieneServiceRecord = DailyEvidenceRecord | ProgramRecord

type DailyEvidenceForm = {
  recordName: string
  implementationType: ImplementationType
  otherImplementation: string
  classification: Classification
  date: string
  responsibleEmployeeId: string
  observations: string
}

type ProgramForm = {
  name: string
  procedureType: ProgramProcedureType
  date: string
}

type EvidenceForm = {
  file: File | null
  description: string
  isConfirmed: boolean
}

const emptyDailyForm: DailyEvidenceForm = {
  recordName: "",
  implementationType: "FORMAT",
  otherImplementation: "",
  classification: "HYGIENE",
  date: new Date().toISOString().slice(0, 10),
  responsibleEmployeeId: "",
  observations: "",
}

const emptyProgramForm: ProgramForm = {
  name: "",
  procedureType: "HYGIENE",
  date: new Date().toISOString().slice(0, 10),
}

const emptyEvidenceForm: EvidenceForm = {
  file: null,
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

function kindLabel(kind: RecordKind) {
  return kind === "DAILY_EVIDENCE" ? "Evidencia diaria" : "Programa"
}

function implementationLabel(value: ImplementationType) {
  if (value === "FORMAT") return "Formato"
  if (value === "PROCEDURE") return "Procedimiento"
  return "Otro"
}

function classificationLabel(value: Classification) {
  return value === "POTABLE_WATER" ? "Agua potable" : "Higiene"
}

function procedureTypeLabel(value: ProgramProcedureType) {
  if (value === "POTABLE_WATER") return "Agua potable"
  if (value === "WASTE_DISPOSAL") return "Disposición de residuos"
  if (value === "SANITARY_SERVICES") return "Servicios sanitarios"
  return "Higiene"
}

function recordTitle(record: HygieneServiceRecord) {
  return record.kind === "PROGRAM" ? record.name : record.recordName
}

function recordDate(record: HygieneServiceRecord) {
  return record.kind === "PROGRAM" ? record.date : record.date
}

function recordResponsible(record: HygieneServiceRecord) {
  return record.kind === "PROGRAM" ? "Programa institucional" : record.responsibleName
}

function recordCategory(record: HygieneServiceRecord) {
  if (record.kind === "PROGRAM") return procedureTypeLabel(record.procedureType)
  if (record.implementationType === "OTHER") {
    return `${implementationLabel(record.implementationType)}${record.otherImplementation ? `: ${record.otherImplementation}` : ""}`
  }
  return `${implementationLabel(record.implementationType)} · ${classificationLabel(record.classification)}`
}

function kindClassName(kind: RecordKind) {
  return kind === "PROGRAM"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-blue-600 text-white border-transparent"
}

function normalizeRecord(record: ApiHygieneServiceRecord): HygieneServiceRecord {
  if (record.kind === "PROGRAM") return { ...record, evidence: record.evidence ?? undefined }
  const employee = record.responsibleEmployee
  const responsibleName = record.responsibleName
    || `${employee?.name ?? ""} ${employee?.lastName ?? ""}`.trim()
    || employee?.email
    || "Responsable no disponible"
  return {
    ...record,
    responsibleName,
    otherImplementation: record.otherImplementation ?? undefined,
    observations: record.observations ?? "",
    evidence: record.evidence ?? undefined,
  }
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
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

function DailyEvidenceDialog({
  open,
  record,
  employees,
  employeesLoading,
  onClose,
  onSave,
}: {
  open: boolean
  record: DailyEvidenceRecord | null
  employees: EmployeeOption[]
  employeesLoading: boolean
  onClose: () => void
  onSave: (form: DailyEvidenceForm, responsibleName: string, recordId?: string) => Promise<boolean>
}) {
  const [form, setForm] = useState<DailyEvidenceForm>(emptyDailyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(record ? {
      recordName: record.recordName,
      implementationType: record.implementationType,
      otherImplementation: record.otherImplementation ?? "",
      classification: record.classification,
      date: record.date,
      responsibleEmployeeId: record.responsibleEmployeeId,
      observations: record.observations,
    } : emptyDailyForm)
  }, [open, record])

  function update<K extends keyof DailyEvidenceForm>(key: K, value: DailyEvidenceForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.recordName.trim()) return toast.error("Ingresa el nombre del registro")
    if (form.implementationType === "OTHER" && !form.otherImplementation.trim()) return toast.error("Describe el tipo de implementación")
    if (!form.date) return toast.error("Selecciona la fecha")
    if (!form.responsibleEmployeeId) return toast.error("Selecciona el responsable")

    const responsibleName = findEmployeeName(employees, form.responsibleEmployeeId) || record?.responsibleName || "Responsable seleccionado"

    setSaving(true)
    const saved = await onSave(form, responsibleName, record?.id)
    setSaving(false)
    if (!saved) return
    setForm(emptyDailyForm)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{record ? "Editar evidencia diaria" : "Nueva evidencia diaria"}</DialogTitle>
          <p className="text-sm text-muted-foreground">Registra la verificación diaria o constante de las condiciones higiénicas.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos del registro</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  Nombre del registro
                  <Input value={form.recordName} onChange={(event) => update("recordName", event.target.value)} placeholder="Inspección diaria de baños" />
                </Label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Tipo de implementación</span>
                  <select
                    value={form.implementationType}
                    onChange={(event) => update("implementationType", event.target.value as ImplementationType)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="FORMAT">Formato</option>
                    <option value="PROCEDURE">Procedimiento</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </label>
                {form.implementationType === "OTHER" && (
                  <Label className="grid gap-2 md:col-span-2">
                    Describir implementación
                    <Input value={form.otherImplementation} onChange={(event) => update("otherImplementation", event.target.value)} placeholder="Describe el tipo de soporte o mecanismo usado" />
                  </Label>
                )}
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Clasificación</span>
                  <select
                    value={form.classification}
                    onChange={(event) => update("classification", event.target.value as Classification)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="HYGIENE">Higiene</option>
                    <option value="POTABLE_WATER">Agua potable</option>
                  </select>
                </label>
                <Label className="grid gap-2">
                  Fecha
                  <Input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
                </Label>
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

            <Label className="grid gap-2 rounded-md border border-border p-4">
              Observaciones
              <Textarea value={form.observations} onChange={(event) => update("observations", event.target.value)} rows={4} placeholder="Describe hallazgos, cumplimiento o novedades del registro." />
            </Label>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {record ? "Guardar cambios" : "Crear evidencia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProgramDialog({
  open,
  record,
  onClose,
  onSave,
}: {
  open: boolean
  record: ProgramRecord | null
  onClose: () => void
  onSave: (form: ProgramForm, recordId?: string) => Promise<boolean>
}) {
  const [form, setForm] = useState<ProgramForm>(emptyProgramForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(record ? {
      name: record.name,
      procedureType: record.procedureType,
      date: record.date,
    } : emptyProgramForm)
  }, [open, record])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) return toast.error("Ingresa el nombre del programa")
    if (!form.date) return toast.error("Selecciona la fecha")

    setSaving(true)
    const saved = await onSave(form, record?.id)
    setSaving(false)
    if (!saved) return
    setForm(emptyProgramForm)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-3xl bg-card">
        <DialogHeader>
          <DialogTitle>{record ? "Editar programa" : "Nuevo programa"}</DialogTitle>
          <p className="text-sm text-muted-foreground">Relaciona el programa o procedimiento de higiene y saneamiento básico.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2 md:col-span-2">
              Nombre
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Programa de higiene y agua potable" />
            </Label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Relacionar tipo de procedimiento</span>
              <select
                value={form.procedureType}
                onChange={(event) => setForm((current) => ({ ...current, procedureType: event.target.value as ProgramProcedureType }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="HYGIENE">Higiene</option>
                <option value="POTABLE_WATER">Agua potable</option>
                <option value="WASTE_DISPOSAL">Disposición de residuos</option>
                <option value="SANITARY_SERVICES">Servicios sanitarios</option>
              </select>
            </label>
            <Label className="grid gap-2">
              Fecha
              <Input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {record ? "Guardar cambios" : "Crear programa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  record,
  onClose,
  onUpload,
}: {
  record: HygieneServiceRecord | null
  onClose: () => void
  onUpload: (recordId: string, form: EvidenceForm) => Promise<boolean>
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)
  const [uploading, setUploading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.file) return toast.error("Selecciona la evidencia")
    if (!form.description.trim()) return toast.error("Describe brevemente la evidencia")

    setUploading(true)
    const uploaded = await onUpload(record.id, form)
    setUploading(false)
    if (!uploaded) return
    setForm(emptyEvidenceForm)
    onClose()
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Subir evidencia</DialogTitle>
          <p className="text-sm text-muted-foreground">Adjunta soporte fotográfico, fílmico, formato diligenciado o documento del programa.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-dashed border-border bg-secondary p-4">
            <Label className="grid gap-2">
              Archivo
              <Input type="file" onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))} />
            </Label>
            {form.file && <p className="mt-3 truncate text-sm text-muted-foreground">{form.file.name}</p>}
          </div>

          <Label className="grid gap-2">
            Descripción de la evidencia
            <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} placeholder="Ej: Fotografías de punto de agua potable y servicios sanitarios." />
          </Label>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.isConfirmed} onChange={(event) => setForm((current) => ({ ...current, isConfirmed: event.target.checked }))} className="h-4 w-4 rounded border-border" />
            Evidencia confirmada
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="gap-2" disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Guardar evidencia</Button>
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
  onPreviewEvidence,
}: {
  record: HygieneServiceRecord | null
  onClose: () => void
  onDownload: (record: HygieneServiceRecord) => void
  onPreviewEvidence: (record: HygieneServiceRecord) => void
}) {
  if (!record) return null

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{recordTitle(record)}</DialogTitle>
          <p className="text-sm text-muted-foreground">Consulta el detalle del soporte de servicios de higiene.</p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoBlock label="Tipo registro" value={kindLabel(record.kind)} />
            <InfoBlock label="Fecha" value={formatDate(recordDate(record))} />
            <InfoBlock label="Clasificación" value={recordCategory(record)} />
            <InfoBlock label="Responsable" value={recordResponsible(record)} />
          </div>

          {record.kind === "DAILY_EVIDENCE" && (
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Observaciones</h3>
              <p className="text-sm text-muted-foreground">{record.observations || "Sin observaciones."}</p>
            </section>
          )}

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4" />
              Evidencia
            </h3>
            {record.evidence ? (
              <div className="rounded-md bg-secondary p-3 text-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{record.evidence.originalName}</p>
                    <p className="text-muted-foreground">{record.evidence.description || "Sin descripción"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(record.evidence.createdAt)} · {record.evidence.isConfirmed ? "Confirmada" : "Sin confirmar"}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => onPreviewEvidence(record)}><Eye className="h-4 w-4" />Previsualizar</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay evidencia cargada.</p>
            )}
          </section>
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
          <Button type="button" className="gap-2" onClick={() => onDownload(record)}><Download className="h-4 w-4" />Descargar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type EvidencePreview = { url: string; mimeType: string; name: string }

function EvidencePreviewDialog({ preview, onClose }: { preview: EvidencePreview | null; onClose: () => void }) {
  if (!preview) return null
  const isImage = preview.mimeType.startsWith("image/")
  const isPdf = preview.mimeType === "application/pdf" || preview.name.toLowerCase().endsWith(".pdf")
  return (
    <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!flex h-[min(88dvh,860px)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12"><DialogTitle className="truncate">{preview.name}</DialogTitle></DialogHeader>
        <div className="min-h-0 flex-1 bg-slate-100 p-3">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt={preview.name} className="h-full w-full object-contain" />
          ) : isPdf ? (
            <iframe src={preview.url} title={preview.name} className="h-full w-full rounded-md border border-border bg-white" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground"><FileText className="h-10 w-10" />Este tipo de archivo no admite previsualización en el navegador.</div>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
          <Button type="button" className="gap-2" asChild><a href={preview.url} download={preview.name}><Download className="h-4 w-4" />Descargar</a></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function HygieneServicesPage() {
  const [records, setRecords] = useState<HygieneServiceRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState<RecordKind | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [dailyDialogOpen, setDailyDialogOpen] = useState(false)
  const [programDialogOpen, setProgramDialogOpen] = useState(false)
  const [editingDaily, setEditingDaily] = useState<DailyEvidenceRecord | null>(null)
  const [editingProgram, setEditingProgram] = useState<ProgramRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<HygieneServiceRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<HygieneServiceRecord | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)

  async function loadRecords() {
    setRecordsLoading(true)
    try {
      const result = await listHygieneServices({ limit: 100 })
      setRecords((result.items ?? []).map(normalizeRecord))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los servicios de higiene")
    } finally {
      setRecordsLoading(false)
    }
  }

  useEffect(() => {
    void loadRecords()
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadEmployeeOptions() {
      try {
        const employeeList = await listEmployees()
        if (mounted) setEmployees(toEmployeeOptions(employeeList))
      } catch (error) {
        if (mounted) toast.error(error instanceof Error ? error.message : "No se pudo cargar los funcionarios")
      } finally {
        if (mounted) setEmployeesLoading(false)
      }
    }

    loadEmployeeOptions()

    return () => {
      mounted = false
    }
  }, [])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
      const matchesKind = kindFilter === "all" || record.kind === kindFilter
      const title = recordTitle(record).toLowerCase()
      const category = recordCategory(record).toLowerCase()
      const responsible = recordResponsible(record).toLowerCase()
      const observations = record.kind === "DAILY_EVIDENCE" ? record.observations.toLowerCase() : ""

      return matchesKind && (!query || title.includes(query) || category.includes(query) || responsible.includes(query) || observations.includes(query))
    })
  }, [records, search, kindFilter])

  const stats = useMemo(() => ({
    total: records.length,
    daily: records.filter((record) => record.kind === "DAILY_EVIDENCE").length,
    programs: records.filter((record) => record.kind === "PROGRAM").length,
    withEvidence: records.filter((record) => Boolean(record.evidence)).length,
  }), [records])

  async function handleSaveDaily(form: DailyEvidenceForm, responsibleName: string, recordId?: string): Promise<boolean> {
    const payload = {
      recordName: form.recordName.trim(),
      implementationType: form.implementationType,
      otherImplementation: form.implementationType === "OTHER" ? form.otherImplementation.trim() : null,
      classification: form.classification,
      date: form.date,
      responsibleEmployeeId: form.responsibleEmployeeId,
      observations: form.observations.trim(),
    }

    try {
      const saved = recordId
        ? await updateHygieneDailyEvidence(recordId, payload)
        : await createHygieneDailyEvidence(payload)
      const normalized = normalizeRecord({ ...saved, responsibleName })
      setRecords((current) => recordId
        ? current.map((record) => record.id === recordId ? normalized : record)
        : [normalized, ...current])
      toast.success(recordId ? "Evidencia diaria actualizada" : "Evidencia diaria creada")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la evidencia diaria")
      return false
    }
  }

  async function handleSaveProgram(form: ProgramForm, recordId?: string): Promise<boolean> {
    const payload = {
      name: form.name.trim(),
      procedureType: form.procedureType,
      date: form.date,
    }

    try {
      const saved = recordId
        ? await updateHygieneProgram(recordId, payload)
        : await createHygieneProgram(payload)
      const normalized = normalizeRecord(saved)
      setRecords((current) => recordId
        ? current.map((record) => record.id === recordId ? normalized : record)
        : [normalized, ...current])
      toast.success(recordId ? "Programa actualizado" : "Programa creado")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el programa")
      return false
    }
  }

  async function handleUpload(recordId: string, form: EvidenceForm): Promise<boolean> {
    if (!form.file) return false
    try {
      const evidence = await uploadHygieneEvidence(recordId, {
        file: form.file,
        description: form.description,
        isConfirmed: form.isConfirmed,
      })
      setRecords((current) => current.map((record) => record.id === recordId ? { ...record, evidence } : record))
      setDetailRecord((current) => current?.id === recordId ? { ...current, evidence } : current)
      toast.success("Evidencia cargada")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la evidencia")
      return false
    }
  }

  async function openDetail(record: HygieneServiceRecord) {
    try {
      const detail = normalizeRecord(await getHygieneService(record.id))
      setRecords((current) => current.map((item) => item.id === detail.id ? detail : item))
      setDetailRecord(detail)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el detalle")
    }
  }

  async function downloadRecordPdf(record: HygieneServiceRecord) {
    try {
      const blob = await exportHygieneService(record.id)
      const safeName = recordTitle(record).replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, "-")
      saveBlob(blob, `${safeName || "servicio-higiene"}.pdf`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el registro")
    }
  }

  async function previewEvidence(record: HygieneServiceRecord) {
    if (!record.evidence) return
    try {
      const blob = await downloadHygieneEvidence(record.id, record.evidence.id)
      setPreview({
        url: URL.createObjectURL(blob),
        mimeType: blob.type || record.evidence.mimeType || "application/octet-stream",
        name: record.evidence.originalName,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir la evidencia")
    }
  }

  function closePreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  function openEdit(record: HygieneServiceRecord) {
    if (record.kind === "PROGRAM") {
      setEditingProgram(record)
      setProgramDialogOpen(true)
      return
    }

    setEditingDaily(record)
    setDailyDialogOpen(true)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Servicios de Higiene</h1>
          <p className="text-muted-foreground">Controla evidencias diarias, programas, suministro de agua potable y condiciones sanitarias.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => { setEditingProgram(null); setProgramDialogOpen(true) }}>
            <Plus className="h-4 w-4" />
            Crear programa
          </Button>
          <Button type="button" className="gap-2" onClick={() => { setEditingDaily(null); setDailyDialogOpen(true) }}>
            <Plus className="h-4 w-4" />
            Nueva evidencia
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Registros" value={stats.total} /><Metric label="Evidencias" value={stats.daily} tone="blue" /><Metric label="Programas" value={stats.programs} tone="green" /><Metric label="Con soporte" value={stats.withEvidence} tone="amber" /></section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_240px]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Registro, programa, responsable o clasificación" />
            </div>
          </Label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Tipo de registro</span>
            <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as RecordKind | "all")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="all">Todos</option>
              <option value="DAILY_EVIDENCE">Evidencia diaria</option>
              <option value="PROGRAM">Programa</option>
            </select>
          </label>
        </div>
      </section>

      

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Registros de servicios de higiene</h2>
            <p className="text-sm text-muted-foreground">{filteredRecords.length} registros encontrados</p>
          </div>
          <div className="inline-flex w-fit rounded-md border border-border bg-secondary p-1">
            <Button type="button" size="sm" variant={viewMode === "cards" ? "default" : "ghost"} className="h-8 gap-2" onClick={() => setViewMode("cards")}>
              <LayoutGrid className="h-4 w-4" />
              Tarjetas
            </Button>
            <Button type="button" size="sm" variant={viewMode === "list" ? "default" : "ghost"} className="h-8 gap-2" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
              Lista
            </Button>
          </div>
        </div>

        {viewMode === "cards" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {recordsLoading && (
              <div className="col-span-full flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando servicios de higiene...
              </div>
            )}
            {filteredRecords.map((record) => (
              <Card key={record.id} className="border-border bg-card">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{recordTitle(record)}</h3>
                        <Badge variant="outline" className={kindClassName(record.kind)}>{kindLabel(record.kind)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{recordCategory(record)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void openDetail(record)}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(recordDate(record))}</p>
                    <p className="flex items-center gap-2"><UserRound className="h-4 w-4" />{recordResponsible(record)}</p>
                    <p className="flex items-center gap-2"><FileText className="h-4 w-4" />{record.evidence ? "Con evidencia" : "Sin evidencia"}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openEdit(record)}><Edit className="h-4 w-4" />Editar</Button>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void downloadRecordPdf(record)}><Download className="h-4 w-4" />PDF</Button>
                    <Button type="button" size="sm" className="gap-2" onClick={() => setEvidenceRecord(record)}><Upload className="h-4 w-4" />Evidencia</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!recordsLoading && filteredRecords.length === 0 && (
              <div className="col-span-full rounded-md border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
                No hay registros de servicios de higiene para mostrar.
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Registro</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Clasificación</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Evidencia</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{recordTitle(record)}</p>
                      <p className="text-muted-foreground">Creado: {formatDate(record.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className={kindClassName(record.kind)}>{kindLabel(record.kind)}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{recordCategory(record)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(recordDate(record))}</td>
                    <td className="px-4 py-3 text-muted-foreground">{recordResponsible(record)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.evidence?.originalName ?? "Sin evidencia"}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => void openDetail(record)}><Eye className="h-4 w-4" />Ver detalle</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(record)}><Edit className="h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => void downloadRecordPdf(record)}><Download className="h-4 w-4" />Descargar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEvidenceRecord(record)}><Upload className="h-4 w-4" />Subir evidencia</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {recordsLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Cargando servicios de higiene...</span>
                    </td>
                  </tr>
                )}
                {!recordsLoading && filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No hay registros de servicios de higiene para mostrar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DailyEvidenceDialog
        open={dailyDialogOpen}
        record={editingDaily}
        employees={employees}
        employeesLoading={employeesLoading}
        onClose={() => { setDailyDialogOpen(false); setEditingDaily(null) }}
        onSave={handleSaveDaily}
      />
      <ProgramDialog open={programDialogOpen} record={editingProgram} onClose={() => { setProgramDialogOpen(false); setEditingProgram(null) }} onSave={handleSaveProgram} />
      <EvidenceDialog record={evidenceRecord} onClose={() => setEvidenceRecord(null)} onUpload={handleUpload} />
      <DetailDialog record={detailRecord} onClose={() => setDetailRecord(null)} onDownload={(record) => void downloadRecordPdf(record)} onPreviewEvidence={(record) => void previewEvidence(record)} />
      <EvidencePreviewDialog preview={preview} onClose={closePreview} />
    </main>
  )
}
