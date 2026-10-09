"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  CalendarDays,
  Download,
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
import { listManagedDocuments } from "@/services/documentManagementService"
import { listEmployees } from "@/services/employeeService"
import { listRisks } from "@/services/riskService"
import {
  createEnvironmentalMeasurement,
  createEnvironmentalProcedure,
  downloadEnvironmentalEvidence,
  exportEnvironmentalMeasurement,
  getEnvironmentalMeasurement,
  listEnvironmentalMeasurements,
  updateEnvironmentalMeasurement,
  updateEnvironmentalProcedure,
  uploadEnvironmentalEvidence,
} from "@/services/environmentalMeasurementsService"
import type { ManagedDocument } from "@/types/manager/document-management"
import type { Employee } from "@/types/manager/employee"
import type { Risk } from "@/types/manager/risk"
import type {
  EnvironmentalMeasurementDocument,
  EnvironmentalMeasurementResult,
  EnvironmentalMeasurementType,
  EnvironmentalProcedureType,
  EnvironmentalRecord as ApiEnvironmentalRecord,
} from "@/types/manager/environmentalMeasurements"

type ViewMode = "cards" | "list"
type RecordKind = "MEASUREMENT" | "PROCEDURE"
type MeasurementType = EnvironmentalMeasurementType
type MeasurementResult = EnvironmentalMeasurementResult
type ProcedureType = EnvironmentalProcedureType
type Evidence = EnvironmentalMeasurementDocument

type EmployeeOption = {
  id: string
  name: string
  email?: string
}

type Option = {
  id: string
  name: string
  description?: string
}

type MeasurementRecord = {
  id: string
  kind: "MEASUREMENT"
  name: string
  procedureDocumentId: string
  procedureDocumentName: string
  measurementType: MeasurementType
  riskId: string
  riskName: string
  measurementDate: string
  laboratory: string
  responsibleEmployeeId: string
  responsibleName: string
  result: MeasurementResult
  observations: string
  evidence?: Evidence
  createdAt: string
}

type ProcedureRecord = {
  id: string
  kind: "PROCEDURE"
  name: string
  procedureType: ProcedureType
  relatedProcedureId: string
  relatedProcedureName: string
  date: string
  evidence?: Evidence
  createdAt: string
}

type EnvironmentalRecord = MeasurementRecord | ProcedureRecord

type MeasurementForm = {
  name: string
  procedureDocumentId: string
  measurementType: MeasurementType
  riskId: string
  measurementDate: string
  laboratory: string
  responsibleEmployeeId: string
  result: MeasurementResult
  observations: string
}

type ProcedureForm = {
  name: string
  procedureType: ProcedureType
  relatedProcedureId: string
  date: string
}

type EvidenceForm = {
  file: File | null
  description: string
  isConfirmed: boolean
}

const emptyMeasurementForm: MeasurementForm = {
  name: "",
  procedureDocumentId: "",
  measurementType: "NOISE",
  riskId: "",
  measurementDate: new Date().toISOString().slice(0, 10),
  laboratory: "",
  responsibleEmployeeId: "",
  result: "IN_EVALUATION",
  observations: "",
}

const emptyProcedureForm: ProcedureForm = {
  name: "",
  procedureType: "PROCEDIMIENTO",
  relatedProcedureId: "",
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
  return employees.map((employee) => ({ id: employee.id, name: employeeFullName(employee), email: employee.email }))
}

function findEmployeeName(employees: EmployeeOption[], employeeId: string) {
  return employees.find((employee) => employee.id === employeeId)?.name ?? ""
}

function findOptionName(options: Option[], id: string) {
  return options.find((option) => option.id === id)?.name ?? ""
}

function riskLabel(risk: Risk) {
  return [risk.process, risk.activity, risk.task].filter(Boolean).join(" · ") || risk.hazardDescription?.name || "Riesgo sin nombre"
}

function riskIsRelevant(risk: Risk) {
  const value = `${risk.hazardType?.name ?? ""} ${risk.hazardType?.code ?? ""} ${risk.hazardDescription?.name ?? ""}`.toLowerCase()
  return ["quim", "fisic", "biolog", "ruido", "ilumin", "temperatura", "vibr"].some((term) => value.includes(term))
}

function documentLabel(document: ManagedDocument) {
  const code = document.code ? `${document.code} · ` : ""
  return `${code}${document.name}`
}

function measurementTypeLabel(value: MeasurementType) {
  const labels: Record<MeasurementType, string> = {
    NOISE: "Ruido",
    LIGHTING: "Iluminación",
    VIBRATION: "Vibraciones",
    CHEMICAL: "Químicos",
    BIOLOGICAL: "Biológicos",
    TEMPERATURE: "Temperatura",
    OTHER: "Otro",
  }
  return labels[value]
}

function resultLabel(value: MeasurementResult) {
  if (value === "COMPLIES") return "Cumple"
  if (value === "DOES_NOT_COMPLY") return "No cumple"
  return "En evaluación"
}

function resultClassName(value: MeasurementResult) {
  if (value === "COMPLIES") return "bg-accentActivd text-accentActivd-foreground border-transparent"
  if (value === "DOES_NOT_COMPLY") return "bg-destructive text-destructive-foreground border-transparent"
  return "bg-amber-100 text-amber-800 border-amber-200"
}

function procedureTypeLabel(value: ProcedureType) {
  if (value === "FORMATO") return "Formato"
  if (value === "OTRO") return "Otro"
  return "Procedimiento"
}

function kindLabel(kind: RecordKind) {
  return kind === "PROCEDURE" ? "Procedimiento" : "Medición ambiental"
}

function kindClassName(kind: RecordKind) {
  return kind === "PROCEDURE" ? "bg-accentActivd text-accentActivd-foreground border-transparent" : "bg-blue-600 text-white border-transparent"
}

function recordTitle(record: EnvironmentalRecord) {
  return record.name
}

function recordDate(record: EnvironmentalRecord) {
  return record.kind === "PROCEDURE" ? record.date : record.measurementDate
}

function recordCategory(record: EnvironmentalRecord) {
  return record.kind === "PROCEDURE" ? procedureTypeLabel(record.procedureType) : measurementTypeLabel(record.measurementType)
}

function recordResponsible(record: EnvironmentalRecord) {
  return record.kind === "PROCEDURE" ? "Procedimiento institucional" : record.responsibleName
}

function normalizeRecord(record: ApiEnvironmentalRecord): EnvironmentalRecord {
  if (record.kind === "PROCEDURE") return { ...record, evidence: record.evidence ?? undefined }
  const employee = record.responsibleEmployee
  const responsibleName = record.responsibleName
    || `${employee?.name ?? ""} ${employee?.lastName ?? ""}`.trim()
    || employee?.email
    || "Responsable no disponible"
  return {
    ...record,
    responsibleName,
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
    return employees.filter((employee) => employee.name.toLowerCase().includes(normalizedQuery) || (employee.email?.toLowerCase() ?? "").includes(normalizedQuery))
  }, [employees, query])

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-foreground">Responsable</span>
      <div className="rounded-md border border-input bg-background">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 pl-9" placeholder="Buscar funcionario..." />
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
                  className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${value === employee.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}
                >
                  <span className="block font-medium">{employee.name}</span>
                  {employee.email && <span className={`block truncate text-xs ${value === employee.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{employee.email}</span>}
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

function SearchableOptionPicker({
  label,
  value,
  options,
  loading,
  placeholder,
  emptyMessage,
  onChange,
}: {
  label: string
  value: string
  options: Option[]
  loading: boolean
  placeholder: string
  emptyMessage: string
  onChange: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return options
    return options.filter((option) => `${option.name} ${option.description ?? ""}`.toLowerCase().includes(normalizedQuery))
  }, [options, query])

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="rounded-md border border-input bg-background">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 pl-9" placeholder={placeholder} />
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando opciones...
            </div>
          ) : filteredOptions.length > 0 ? (
            <div className="grid gap-1">
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange(option.id)}
                  className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${value === option.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}
                >
                  <span className="block font-medium">{option.name}</span>
                  {option.description && <span className={`block truncate text-xs ${value === option.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{option.description}</span>}
                </button>
              ))}
            </div>
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">{emptyMessage}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function MeasurementDialog({
  open,
  record,
  employees,
  risks,
  documents,
  employeesLoading,
  catalogsLoading,
  onClose,
  onSave,
}: {
  open: boolean
  record: MeasurementRecord | null
  employees: EmployeeOption[]
  risks: Option[]
  documents: Option[]
  employeesLoading: boolean
  catalogsLoading: boolean
  onClose: () => void
  onSave: (form: MeasurementForm, recordId?: string) => Promise<boolean>
}) {
  const [form, setForm] = useState<MeasurementForm>(emptyMeasurementForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            name: record.name,
            procedureDocumentId: record.procedureDocumentId,
            measurementType: record.measurementType,
            riskId: record.riskId,
            measurementDate: record.measurementDate,
            laboratory: record.laboratory,
            responsibleEmployeeId: record.responsibleEmployeeId,
            result: record.result,
            observations: record.observations,
          }
        : emptyMeasurementForm,
    )
  }, [open, record])

  const update = <K extends keyof MeasurementForm>(key: K, value: MeasurementForm[K]) => setForm((current) => ({ ...current, [key]: value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim() || !form.procedureDocumentId || !form.riskId || !form.measurementDate || !form.laboratory.trim() || !form.responsibleEmployeeId) {
      toast.error("Diligencia todos los campos obligatorios de la medición ambiental.")
      return
    }
    setSaving(true)
    const saved = await onSave(form, record?.id)
    setSaving(false)
    if (saved) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{record ? "Editar medición ambiental" : "Nueva medición ambiental"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="measurement-name">Nombre de la medición</Label>
              <Input id="measurement-name" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Ej. Medición de ruido en planta" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="measurement-type">Tipo de medición</Label>
              <select id="measurement-type" value={form.measurementType} onChange={(event) => update("measurementType", event.target.value as MeasurementType)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="NOISE">Ruido</option>
                <option value="LIGHTING">Iluminación</option>
                <option value="VIBRATION">Vibraciones</option>
                <option value="CHEMICAL">Químicos</option>
                <option value="BIOLOGICAL">Biológicos</option>
                <option value="TEMPERATURE">Temperatura</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="measurement-date">Fecha de medición</Label>
              <Input id="measurement-date" type="date" value={form.measurementDate} onChange={(event) => update("measurementDate", event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="measurement-lab">Empresa o laboratorio</Label>
              <Input id="measurement-lab" value={form.laboratory} onChange={(event) => update("laboratory", event.target.value)} placeholder="Nombre del laboratorio" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="measurement-result">Resultado</Label>
              <select id="measurement-result" value={form.result} onChange={(event) => update("result", event.target.value as MeasurementResult)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="COMPLIES">Cumple</option>
                <option value="DOES_NOT_COMPLY">No cumple</option>
                <option value="IN_EVALUATION">En evaluación</option>
              </select>
            </div>
            <EmployeePicker employees={employees} loading={employeesLoading} value={form.responsibleEmployeeId} onChange={(employeeId) => update("responsibleEmployeeId", employeeId)} />
            <SearchableOptionPicker label="Procedimiento" value={form.procedureDocumentId} options={documents} loading={catalogsLoading} placeholder="Buscar procedimiento..." emptyMessage="No hay procedimientos disponibles." onChange={(id) => update("procedureDocumentId", id)} />
            <SearchableOptionPicker label="Riesgo asociado" value={form.riskId} options={risks} loading={catalogsLoading} placeholder="Buscar riesgo químico, físico o biológico..." emptyMessage="No hay riesgos disponibles." onChange={(id) => update("riskId", id)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="measurement-observations">Observaciones</Label>
            <Textarea id="measurement-observations" value={form.observations} onChange={(event) => update("observations", event.target.value)} placeholder="Hallazgos, recomendaciones o seguimiento requerido" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{record ? "Guardar cambios" : "Crear medición"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProcedureDialog({
  open,
  record,
  documents,
  catalogsLoading,
  onClose,
  onSave,
}: {
  open: boolean
  record: ProcedureRecord | null
  documents: Option[]
  catalogsLoading: boolean
  onClose: () => void
  onSave: (form: ProcedureForm, recordId?: string) => Promise<boolean>
}) {
  const [form, setForm] = useState<ProcedureForm>(emptyProcedureForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            name: record.name,
            procedureType: record.procedureType,
            relatedProcedureId: record.relatedProcedureId,
            date: record.date,
          }
        : emptyProcedureForm,
    )
  }, [open, record])

  const update = <K extends keyof ProcedureForm>(key: K, value: ProcedureForm[K]) => setForm((current) => ({ ...current, [key]: value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim() || !form.relatedProcedureId || !form.date) {
      toast.error("Diligencia el nombre, procedimiento relacionado y fecha.")
      return
    }
    setSaving(true)
    const saved = await onSave(form, record?.id)
    setSaving(false)
    if (saved) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{record ? "Editar procedimiento" : "Nuevo procedimiento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="procedure-name">Nombre</Label>
              <Input id="procedure-name" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Nombre del procedimiento" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="procedure-type">Tipo de procedimiento</Label>
              <select id="procedure-type" value={form.procedureType} onChange={(event) => update("procedureType", event.target.value as ProcedureType)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="FORMATO">Formato</option>
                <option value="PROCEDIMIENTO">Procedimiento</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="procedure-date">Fecha</Label>
              <Input id="procedure-date" type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
            </div>
          </div>
          <SearchableOptionPicker label="Relacionar procedimiento de gestión documental" value={form.relatedProcedureId} options={documents} loading={catalogsLoading} placeholder="Buscar documento..." emptyMessage="No hay documentos disponibles." onChange={(id) => update("relatedProcedureId", id)} />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{record ? "Guardar cambios" : "Crear procedimiento"}</Button>
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
  record: EnvironmentalRecord | null
  onClose: () => void
  onUpload: (record: EnvironmentalRecord, evidence: EvidenceForm) => Promise<boolean>
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (record) setForm(emptyEvidenceForm)
  }, [record])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.file) {
      toast.error("Selecciona el archivo de evidencia.")
      return
    }
    setUploading(true)
    const uploaded = await onUpload(record, form)
    setUploading(false)
    if (uploaded) onClose()
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Subir evidencia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="evidence-file">Archivo</Label>
            <Input id="evidence-file" type="file" onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))} />
            {form.file && <p className="truncate text-sm text-muted-foreground">{form.file.name}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="evidence-description">Descripción</Label>
            <Textarea id="evidence-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe la evidencia cargada" />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.isConfirmed} onChange={(event) => setForm((current) => ({ ...current, isConfirmed: event.target.checked }))} />
            Evidencia confirmada
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="gap-2" disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Subir</Button>
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
  record: EnvironmentalRecord | null
  onClose: () => void
  onDownload: (record: EnvironmentalRecord) => void
  onPreviewEvidence: (record: EnvironmentalRecord) => void
}) {
  if (!record) return null

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{recordTitle(record)}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={kindClassName(record.kind)}>{kindLabel(record.kind)}</Badge>
            {record.kind === "MEASUREMENT" && <Badge variant="outline" className={resultClassName(record.result)}>{resultLabel(record.result)}</Badge>}
            <Badge variant="outline">Fecha: {formatDate(recordDate(record))}</Badge>
          </div>
          <div className="grid gap-3 rounded-md border border-border p-4 text-sm md:grid-cols-2">
            {record.kind === "MEASUREMENT" ? (
              <>
                <p><span className="font-medium">Procedimiento:</span> {record.procedureDocumentName || "No relacionado"}</p>
                <p><span className="font-medium">Tipo de medición:</span> {measurementTypeLabel(record.measurementType)}</p>
                <p><span className="font-medium">Riesgo asociado:</span> {record.riskName || "No relacionado"}</p>
                <p><span className="font-medium">Laboratorio:</span> {record.laboratory}</p>
                <p><span className="font-medium">Responsable:</span> {record.responsibleName}</p>
                <p><span className="font-medium">Creado:</span> {formatDateTime(record.createdAt)}</p>
                <p className="md:col-span-2"><span className="font-medium">Observaciones:</span> {record.observations || "Sin observaciones"}</p>
              </>
            ) : (
              <>
                <p><span className="font-medium">Tipo:</span> {procedureTypeLabel(record.procedureType)}</p>
                <p><span className="font-medium">Procedimiento relacionado:</span> {record.relatedProcedureName || "No relacionado"}</p>
                <p><span className="font-medium">Fecha:</span> {formatDate(record.date)}</p>
                <p><span className="font-medium">Creado:</span> {formatDateTime(record.createdAt)}</p>
              </>
            )}
          </div>
          <div className="rounded-md border border-border p-4">
            <h3 className="font-semibold text-foreground">Evidencia</h3>
            {record.evidence ? (
              <div className="mt-2 flex flex-col gap-3 rounded-md bg-secondary p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium text-foreground">{record.evidence.originalName}</p>
                  <p className="text-muted-foreground">{record.evidence.description || "Sin descripción"}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(record.evidence.createdAt)}</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => onPreviewEvidence(record)}><Eye className="h-4 w-4" />Previsualizar</Button>
              </div>
            ) : <p className="mt-2 text-sm text-muted-foreground">Sin evidencia cargada.</p>}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
          <Button type="button" className="gap-2" onClick={() => onDownload(record)}><Download className="h-4 w-4" />Descargar PDF</Button>
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

export default function EnvironmentalMeasurementsPage() {
  const [records, setRecords] = useState<EnvironmentalRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [risks, setRisks] = useState<Option[]>([])
  const [documents, setDocuments] = useState<Option[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [catalogsLoading, setCatalogsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState<"ALL" | RecordKind>("ALL")
  const [resultFilter, setResultFilter] = useState<"ALL" | MeasurementResult>("ALL")
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false)
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false)
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementRecord | null>(null)
  const [editingProcedure, setEditingProcedure] = useState<ProcedureRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<EnvironmentalRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<EnvironmentalRecord | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)

  async function loadRecords() {
    setRecordsLoading(true)
    try {
      const result = await listEnvironmentalMeasurements({ limit: 100 })
      setRecords((result.items ?? []).map(normalizeRecord))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las mediciones ambientales")
    } finally {
      setRecordsLoading(false)
    }
  }

  useEffect(() => {
    void loadRecords()
  }, [])

  useEffect(() => {
    let mounted = true
    setEmployeesLoading(true)
    setCatalogsLoading(true)

    Promise.allSettled([listEmployees(), listRisks(), listManagedDocuments()])
      .then(([employeeResult, riskResult, documentResult]) => {
        if (!mounted) return

        if (employeeResult.status === "fulfilled") {
          setEmployees(toEmployeeOptions(employeeResult.value))
        } else {
          toast.error("No se pudo cargar la lista de funcionarios.")
        }

        if (riskResult.status === "fulfilled") {
          const relevantRisks = riskResult.value.items.filter(riskIsRelevant)
          const source = relevantRisks.length > 0 ? relevantRisks : riskResult.value.items
          setRisks(source.map((risk) => ({ id: risk.id, name: riskLabel(risk), description: risk.hazardType?.name ?? risk.hazardDescription?.name })))
        } else {
          toast.error("No se pudieron cargar los riesgos laborales.")
        }

        if (documentResult.status === "fulfilled") {
          const procedureDocuments = documentResult.value.filter((document) => document.type === "PROCEDURE")
          const source = procedureDocuments.length > 0 ? procedureDocuments : documentResult.value
          setDocuments(source.map((document) => ({ id: document.id, name: documentLabel(document), description: document.workArea?.name })))
        } else {
          toast.error("No se pudieron cargar los procedimientos de gestión documental.")
        }
      })
      .finally(() => {
        if (!mounted) return
        setEmployeesLoading(false)
        setCatalogsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return records.filter((record) => {
      const matchesKind = kindFilter === "ALL" || record.kind === kindFilter
      const matchesResult = resultFilter === "ALL" || (record.kind === "MEASUREMENT" && record.result === resultFilter)
      const searchable = record.kind === "MEASUREMENT"
        ? `${record.name} ${record.laboratory} ${record.responsibleName} ${record.riskName} ${record.observations}`
        : `${record.name} ${record.relatedProcedureName} ${procedureTypeLabel(record.procedureType)}`
      const matchesSearch = !normalizedSearch || searchable.toLowerCase().includes(normalizedSearch)
      return matchesKind && matchesResult && matchesSearch
    })
  }, [kindFilter, records, resultFilter, search])

  const measurementsCount = records.filter((record) => record.kind === "MEASUREMENT").length
  const proceduresCount = records.filter((record) => record.kind === "PROCEDURE").length
  const withEvidenceCount = records.filter((record) => record.evidence).length
  const notComplyCount = records.filter((record) => record.kind === "MEASUREMENT" && record.result === "DOES_NOT_COMPLY").length

  async function handleSaveMeasurement(form: MeasurementForm, recordId?: string): Promise<boolean> {
    const responsibleName = findEmployeeName(employees, form.responsibleEmployeeId)
    const riskName = findOptionName(risks, form.riskId)
    const procedureDocumentName = findOptionName(documents, form.procedureDocumentId)
    try {
      const saved = recordId
        ? await updateEnvironmentalMeasurement(recordId, form)
        : await createEnvironmentalMeasurement(form)
      const normalized = normalizeRecord({ ...saved, responsibleName, riskName, procedureDocumentName })
      setRecords((current) => recordId ? current.map((record) => record.id === recordId ? normalized : record) : [normalized, ...current])
      setMeasurementDialogOpen(false)
      setEditingMeasurement(null)
      toast.success(recordId ? "Medición ambiental actualizada." : "Medición ambiental creada.")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la medición ambiental")
      return false
    }
  }

  async function handleSaveProcedure(form: ProcedureForm, recordId?: string): Promise<boolean> {
    const relatedProcedureName = findOptionName(documents, form.relatedProcedureId)
    try {
      const saved = recordId
        ? await updateEnvironmentalProcedure(recordId, form)
        : await createEnvironmentalProcedure(form)
      const normalized = normalizeRecord({ ...saved, relatedProcedureName })
      setRecords((current) => recordId ? current.map((record) => record.id === recordId ? normalized : record) : [normalized, ...current])
      setProcedureDialogOpen(false)
      setEditingProcedure(null)
      toast.success(recordId ? "Procedimiento actualizado." : "Procedimiento creado.")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el procedimiento")
      return false
    }
  }

  async function handleUpload(record: EnvironmentalRecord, form: EvidenceForm): Promise<boolean> {
    if (!form.file) return false
    try {
      const evidence = await uploadEnvironmentalEvidence(record.id, { file: form.file, description: form.description, isConfirmed: form.isConfirmed })
      setRecords((current) => current.map((item) => item.id === record.id ? { ...item, evidence } : item))
      setDetailRecord((current) => current?.id === record.id ? { ...current, evidence } : current)
      setEvidenceRecord(null)
      toast.success("Evidencia cargada correctamente.")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la evidencia")
      return false
    }
  }

  async function openDetail(record: EnvironmentalRecord) {
    try {
      setDetailRecord(normalizeRecord(await getEnvironmentalMeasurement(record.id)))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el detalle")
    }
  }

  async function downloadRecordPdf(record: EnvironmentalRecord) {
    try {
      const blob = await exportEnvironmentalMeasurement(record.id)
      saveBlob(blob, `${recordTitle(record).toLowerCase().replace(/\s+/g, "-")}.pdf`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo exportar el registro")
    }
  }

  async function previewEvidence(record: EnvironmentalRecord) {
    if (!record.evidence) return
    try {
      const blob = await downloadEnvironmentalEvidence(record.id, record.evidence.id)
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return { url: URL.createObjectURL(blob), mimeType: blob.type || record.evidence?.mimeType || "application/octet-stream", name: record.evidence?.originalName || "evidencia" }
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo previsualizar la evidencia")
    }
  }

  function openEdit(record: EnvironmentalRecord) {
    if (record.kind === "MEASUREMENT") {
      setEditingMeasurement(record)
      setMeasurementDialogOpen(true)
      return
    }
    setEditingProcedure(record)
    setProcedureDialogOpen(true)
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mediciones Ambientales</h1>
          <p className="text-sm text-muted-foreground">Registra mediciones, procedimientos, responsables, riesgos asociados y evidencias de soporte.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="gap-2" onClick={() => { setEditingMeasurement(null); setMeasurementDialogOpen(true) }}>
            <Plus className="h-4 w-4" />Nueva medición
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={() => { setEditingProcedure(null); setProcedureDialogOpen(true) }}>
            <Plus className="h-4 w-4" />Nuevo procedimiento
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Mediciones</p><p className="mt-2 text-2xl font-bold text-foreground">{measurementsCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Procedimientos</p><p className="mt-2 text-2xl font-bold text-foreground">{proceduresCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Con evidencia</p><p className="mt-2 text-2xl font-bold text-foreground">{withEvidenceCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">No cumplen</p><p className="mt-2 text-2xl font-bold text-foreground">{notComplyCount}</p></CardContent></Card>
      </section>

      <section className="rounded-md border border-border bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_190px_auto] lg:items-end">
          <div className="grid gap-2">
            <Label htmlFor="environmental-search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="environmental-search" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar por nombre, responsable, laboratorio o riesgo" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="environmental-kind">Tipo</Label>
            <select id="environmental-kind" value={kindFilter} onChange={(event) => setKindFilter(event.target.value as "ALL" | RecordKind)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="ALL">Todos</option>
              <option value="MEASUREMENT">Mediciones</option>
              <option value="PROCEDURE">Procedimientos</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="environmental-result">Resultado</Label>
            <select id="environmental-result" value={resultFilter} onChange={(event) => setResultFilter(event.target.value as "ALL" | MeasurementResult)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="ALL">Todos</option>
              <option value="COMPLIES">Cumple</option>
              <option value="DOES_NOT_COMPLY">No cumple</option>
              <option value="IN_EVALUATION">En evaluación</option>
            </select>
          </div>
          <div className="flex rounded-md border border-border bg-secondary p-1">
            <Button type="button" size="sm" variant={viewMode === "cards" ? "default" : "ghost"} className="gap-2" onClick={() => setViewMode("cards")}><LayoutGrid className="h-4 w-4" />Tarjetas</Button>
            <Button type="button" size="sm" variant={viewMode === "list" ? "default" : "ghost"} className="gap-2" onClick={() => setViewMode("list")}><List className="h-4 w-4" />Lista</Button>
          </div>
        </div>
      </section>

      <section>
        {viewMode === "cards" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="grid gap-4 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{recordTitle(record)}</h3>
                        <Badge variant="outline" className={kindClassName(record.kind)}>{kindLabel(record.kind)}</Badge>
                        {record.kind === "MEASUREMENT" && <Badge variant="outline" className={resultClassName(record.result)}>{resultLabel(record.result)}</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{recordCategory(record)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void openDetail(record)}><Eye className="h-4 w-4" />Ver</Button>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(recordDate(record))}</p>
                    <p className="flex items-center gap-2"><UserRound className="h-4 w-4" />{recordResponsible(record)}</p>
                    <p className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />{record.kind === "MEASUREMENT" ? record.riskName : record.relatedProcedureName}</p>
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
            {recordsLoading && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Cargando registros...</CardContent></Card>}
            {!recordsLoading && filteredRecords.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No hay registros para mostrar.</CardContent></Card>}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Registro</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Resultado</th>
                  <th className="px-4 py-3 font-medium">Evidencia</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recordsLoading && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Cargando registros...</td></tr>}
                {!recordsLoading && filteredRecords.map((record) => (
                  <tr key={record.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{recordTitle(record)}</p>
                      <p className="text-muted-foreground">Creado: {formatDate(record.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className={kindClassName(record.kind)}>{kindLabel(record.kind)}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(recordDate(record))}</td>
                    <td className="px-4 py-3 text-muted-foreground">{recordResponsible(record)}</td>
                    <td className="px-4 py-3">{record.kind === "MEASUREMENT" ? <Badge variant="outline" className={resultClassName(record.result)}>{resultLabel(record.result)}</Badge> : <span className="text-muted-foreground">No aplica</span>}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.evidence?.originalName ?? "Sin evidencia"}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
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
                {!recordsLoading && filteredRecords.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No hay registros para mostrar.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <MeasurementDialog
        open={measurementDialogOpen}
        record={editingMeasurement}
        employees={employees}
        risks={risks}
        documents={documents}
        employeesLoading={employeesLoading}
        catalogsLoading={catalogsLoading}
        onClose={() => { setMeasurementDialogOpen(false); setEditingMeasurement(null) }}
        onSave={handleSaveMeasurement}
      />
      <ProcedureDialog
        open={procedureDialogOpen}
        record={editingProcedure}
        documents={documents}
        catalogsLoading={catalogsLoading}
        onClose={() => { setProcedureDialogOpen(false); setEditingProcedure(null) }}
        onSave={handleSaveProcedure}
      />
      <EvidenceDialog record={evidenceRecord} onClose={() => setEvidenceRecord(null)} onUpload={handleUpload} />
      <DetailDialog record={detailRecord} onClose={() => setDetailRecord(null)} onDownload={(record) => void downloadRecordPdf(record)} onPreviewEvidence={(record) => void previewEvidence(record)} />
      <EvidencePreviewDialog preview={preview} onClose={() => { if (preview?.url) URL.revokeObjectURL(preview.url); setPreview(null) }} />
    </main>
  )
}
