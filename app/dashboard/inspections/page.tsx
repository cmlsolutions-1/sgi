"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
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
import { FormDialogIcon, FormSectionTitle } from "@/components/ui/form-dialog-visuals"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { IntelligenceCenter } from "@/components/intelligence/intelligence-center"
import { buildInspectionInsights } from "@/lib/intelligence-engine"
import { askSafeCloud } from "@/lib/safecloud-assistant"
import { listEmployees } from "@/services/employeeService"
import { listWorkAreaOptions } from "@/services/workAreaService"
import {
  createInspection,
  downloadInspectionEvidence,
  exportInspection,
  getInspection,
  listInspections,
  updateInspection,
  uploadInspectionEvidence,
} from "@/services/inspectionsService"
import type { Employee } from "@/types/manager/employee"
import type { WorkAreaOption } from "@/types/manager/work-area"
import type {
  InspectionAction as ApiInspectionAction,
  InspectionDocument,
  InspectionElementType,
  InspectionRecord as ApiInspectionRecord,
  InspectionResult as ApiInspectionResult,
} from "@/types/manager/inspections"

type ViewMode = "cards" | "list"
type ElementType = InspectionElementType
type InspectionAction = ApiInspectionAction
type InspectionResult = ApiInspectionResult
type Evidence = InspectionDocument

type EmployeeOption = {
  id: string
  name: string
  email?: string
}

type InspectionRecord = {
  id: string
  elementName: string
  elementType: ElementType
  action: InspectionAction
  description: string
  workAreaId: string
  workAreaName: string
  date: string
  responsibleEmployeeId: string
  responsibleName: string
  copasstParticipated: boolean
  result: InspectionResult
  observations: string
  evidence?: Evidence
  createdAt: string
}

type InspectionForm = {
  elementName: string
  elementType: ElementType
  action: InspectionAction
  description: string
  workAreaId: string
  date: string
  responsibleEmployeeId: string
  copasstParticipated: boolean
  result: InspectionResult
  observations: string
}

type EvidenceForm = {
  file: File | null
  description: string
  isConfirmed: boolean
}

const emptyInspectionForm: InspectionForm = {
  elementName: "",
  elementType: "INSTALLATION",
  action: "INSPECTION",
  description: "",
  workAreaId: "",
  date: new Date().toISOString().slice(0, 10),
  responsibleEmployeeId: "",
  copasstParticipated: false,
  result: "COMPLIES",
  observations: "",
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

function elementTypeLabel(value: ElementType) {
  const labels: Record<ElementType, string> = {
    INSTALLATION: "Instalación",
    MACHINERY: "Maquinaria",
    EQUIPMENT: "Equipo",
    EMERGENCY: "Emergencias",
    OTHER: "Otro",
  }
  return labels[value]
}

function actionLabel(value: InspectionAction) {
  return value === "MAINTENANCE" ? "Mantenimiento" : "Inspección"
}

function resultLabel(value: InspectionResult) {
  if (value === "DOES_NOT_COMPLY") return "No cumple"
  if (value === "PARTIAL") return "Parcial"
  return "Cumple"
}

function resultClassName(value: InspectionResult) {
  if (value === "COMPLIES") return "bg-accentActivd text-accentActivd-foreground border-transparent"
  if (value === "DOES_NOT_COMPLY") return "bg-destructive text-destructive-foreground border-transparent"
  return "bg-amber-100 text-amber-800 border-amber-200"
}

function findEmployeeName(employees: EmployeeOption[], employeeId: string) {
  return employees.find((employee) => employee.id === employeeId)?.name ?? ""
}

function findAreaName(areas: WorkAreaOption[], areaId: string) {
  return areas.find((area) => area.id === areaId)?.name ?? ""
}

function normalizeInspection(record: ApiInspectionRecord): InspectionRecord {
  const employee = record.responsibleEmployee
  const responsibleName = record.responsibleName
    || `${employee?.name ?? ""} ${employee?.lastName ?? ""}`.trim()
    || employee?.email
    || "Responsable no disponible"
  return {
    ...record,
    workAreaName: record.workAreaName || record.workArea?.name || "Área no disponible",
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

function WorkAreaPicker({
  areas,
  value,
  loading,
  onChange,
}: {
  areas: WorkAreaOption[]
  value: string
  loading: boolean
  onChange: (areaId: string) => void
}) {
  const [query, setQuery] = useState("")
  const filteredAreas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return areas
    return areas.filter((area) => area.name.toLowerCase().includes(normalizedQuery))
  }, [areas, query])

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-foreground">Área</span>
      <div className="rounded-md border border-input bg-background">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 pl-9" placeholder="Buscar área..." />
          </div>
        </div>
        <div className="max-h-44 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando áreas...
            </div>
          ) : filteredAreas.length > 0 ? (
            <div className="grid gap-1">
              {filteredAreas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => onChange(area.id)}
                  className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${value === area.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}
                >
                  <span className="block truncate font-medium">{area.name}</span>
                </button>
              ))}
            </div>
          ) : areas.length > 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">No se encontraron áreas con esa búsqueda.</p>
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">No hay áreas disponibles para seleccionar.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function InspectionDialog({
  open,
  record,
  employees,
  areas,
  loading,
  onClose,
  onSave,
}: {
  open: boolean
  record: InspectionRecord | null
  employees: EmployeeOption[]
  areas: WorkAreaOption[]
  loading: boolean
  onClose: () => void
  onSave: (form: InspectionForm, recordId?: string) => Promise<boolean>
}) {
  const [form, setForm] = useState<InspectionForm>(emptyInspectionForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            elementName: record.elementName,
            elementType: record.elementType,
            action: record.action,
            description: record.description,
            workAreaId: record.workAreaId,
            date: record.date,
            responsibleEmployeeId: record.responsibleEmployeeId,
            copasstParticipated: record.copasstParticipated,
            result: record.result,
            observations: record.observations,
          }
        : emptyInspectionForm,
    )
  }, [open, record])

  const update = <K extends keyof InspectionForm>(key: K, value: InspectionForm[K]) => setForm((current) => ({ ...current, [key]: value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.elementName.trim() || !form.description.trim() || !form.workAreaId || !form.date || !form.responsibleEmployeeId) {
      toast.error("Diligencia el elemento, descripción, área, fecha y responsable.")
      return
    }
    setSaving(true)
    const saved = await onSave(form, record?.id)
    setSaving(false)
    if (saved) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="module-dialog-polish record-dialog-polish !flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-6 py-4 pr-12">
          <div className="flex items-start gap-3 text-left"><FormDialogIcon icon="tracking" tone="blue" /><div><DialogTitle>{record ? "Editar inspección" : "Nueva inspección"}</DialogTitle><p className="mt-1 text-sm text-muted-foreground">Registra el elemento, resultado, área y responsable de la inspección.</p></div></div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/40 px-6 py-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><FormSectionTitle icon="details" title="Información de la inspección" description="Identifica el elemento, la acción realizada y su resultado." tone="blue" /><div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="element-name">Nombre del elemento</Label>
              <Input id="element-name" value={form.elementName} onChange={(event) => update("elementName", event.target.value)} placeholder="Ej. Extintor, escalera, máquina" />
            </div>
            <div><Label className="mb-2 block">Tipo de elemento</Label><Select value={form.elementType} onValueChange={(value) => update("elementType", value as ElementType)}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INSTALLATION">Instalación</SelectItem><SelectItem value="MACHINERY">Maquinaria</SelectItem><SelectItem value="EQUIPMENT">Equipo</SelectItem><SelectItem value="EMERGENCY">Emergencias</SelectItem><SelectItem value="OTHER">Otro</SelectItem></SelectContent></Select></div>
            <div><Label className="mb-2 block">Acción</Label><Select value={form.action} onValueChange={(value) => update("action", value as InspectionAction)}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INSPECTION">Inspección</SelectItem><SelectItem value="MAINTENANCE">Mantenimiento</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2">
              <Label htmlFor="inspection-date">Fecha</Label>
              <Input id="inspection-date" type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
            </div>
            <div><Label className="mb-2 block">Resultado</Label><Select value={form.result} onValueChange={(value) => update("result", value as InspectionResult)}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="COMPLIES">Cumple</SelectItem><SelectItem value="DOES_NOT_COMPLY">No cumple</SelectItem><SelectItem value="PARTIAL">Parcial</SelectItem></SelectContent></Select></div>
            <label className="flex min-h-10 items-center gap-2 rounded-md border border-input px-3 text-sm text-foreground md:mt-6">
              <input type="checkbox" checked={form.copasstParticipated} onChange={(event) => update("copasstParticipated", event.target.checked)} />
              Participó el COPASST
            </label>
            <WorkAreaPicker areas={areas} loading={loading} value={form.workAreaId} onChange={(areaId) => update("workAreaId", areaId)} />
            <EmployeePicker employees={employees} loading={loading} value={form.responsibleEmployeeId} onChange={(employeeId) => update("responsibleEmployeeId", employeeId)} />
          </div></section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><FormSectionTitle icon="document" title="Descripción y hallazgos" description="Detalla el alcance, las observaciones y recomendaciones." tone="cyan" /><div className="grid gap-4 md:grid-cols-2"><Label className="grid gap-2">Descripción<Textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Describe qué se inspecciona o mantiene" rows={4} /></Label><Label className="grid gap-2">Observaciones<Textarea value={form.observations} onChange={(event) => update("observations", event.target.value)} placeholder="Hallazgos, acciones o recomendaciones" rows={4} /></Label></div></section>
          </div>
          <DialogFooter className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{record ? "Guardar cambios" : "Crear inspección"}</Button>
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
  record: InspectionRecord | null
  onClose: () => void
  onUpload: (record: InspectionRecord, evidence: EvidenceForm) => Promise<boolean>
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
      <DialogContent className="module-dialog-polish sm:max-w-xl">
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
  record: InspectionRecord | null
  onClose: () => void
  onDownload: (record: InspectionRecord) => void
  onPreviewEvidence: (record: InspectionRecord) => void
}) {
  if (!record) return null

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="module-dialog-polish max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{record.elementName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-blue-600 text-white border-transparent">{actionLabel(record.action)}</Badge>
            <Badge variant="outline" className={resultClassName(record.result)}>{resultLabel(record.result)}</Badge>
            <Badge variant="outline">Fecha: {formatDate(record.date)}</Badge>
          </div>
          <div className="grid gap-3 rounded-md border border-border p-4 text-sm md:grid-cols-2">
            <p><span className="font-medium">Tipo de elemento:</span> {elementTypeLabel(record.elementType)}</p>
            <p><span className="font-medium">Área:</span> {record.workAreaName}</p>
            <p><span className="font-medium">Responsable:</span> {record.responsibleName}</p>
            <p><span className="font-medium">Participó COPASST:</span> {record.copasstParticipated ? "Sí" : "No"}</p>
            <p><span className="font-medium">Creado:</span> {formatDateTime(record.createdAt)}</p>
            <p className="md:col-span-2"><span className="font-medium">Descripción:</span> {record.description}</p>
            <p className="md:col-span-2"><span className="font-medium">Observaciones:</span> {record.observations || "Sin observaciones"}</p>
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
      <DialogContent className="module-dialog-polish !flex h-[min(88dvh,860px)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
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

export default function InspectionsPage() {
  const [records, setRecords] = useState<InspectionRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [areas, setAreas] = useState<WorkAreaOption[]>([])
  const [loadingCatalogs, setLoadingCatalogs] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<"ALL" | InspectionAction>("ALL")
  const [resultFilter, setResultFilter] = useState<"ALL" | InspectionResult>("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<InspectionRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<InspectionRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<InspectionRecord | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)

  async function loadRecords() {
    setRecordsLoading(true)
    try {
      const result = await listInspections({ limit: 100 })
      setRecords((result.items ?? []).map(normalizeInspection))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las inspecciones")
    } finally {
      setRecordsLoading(false)
    }
  }

  useEffect(() => {
    void loadRecords()
  }, [])

  useEffect(() => {
    let mounted = true
    setLoadingCatalogs(true)

    Promise.allSettled([listEmployees(), listWorkAreaOptions()])
      .then(([employeeResult, areaResult]) => {
        if (!mounted) return

        if (employeeResult.status === "fulfilled") {
          setEmployees(toEmployeeOptions(employeeResult.value))
        } else {
          toast.error("No se pudo cargar la lista de funcionarios.")
        }

        if (areaResult.status === "fulfilled") {
          setAreas(areaResult.value)
        } else {
          toast.error("No se pudieron cargar las áreas de trabajo.")
        }
      })
      .finally(() => {
        if (mounted) setLoadingCatalogs(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return records.filter((record) => {
      const matchesAction = actionFilter === "ALL" || record.action === actionFilter
      const matchesResult = resultFilter === "ALL" || record.result === resultFilter
      const participationLabel = record.copasstParticipated ? "Con COPASST" : "Sin COPASST"
      const searchable = `${record.elementName} ${record.description} ${record.workAreaName} ${record.responsibleName} ${record.observations} ${participationLabel}`
      const matchesSearch = !normalizedSearch || searchable.toLowerCase().includes(normalizedSearch)
      return matchesAction && matchesResult && matchesSearch
    })
  }, [actionFilter, records, resultFilter, search])

  const inspectionsCount = records.filter((record) => record.action === "INSPECTION").length
  const maintenanceCount = records.filter((record) => record.action === "MAINTENANCE").length
  const withEvidenceCount = records.filter((record) => record.evidence).length
  const pendingCount = records.filter((record) => record.result !== "COMPLIES").length
  const intelligenceInsights = useMemo(() => buildInspectionInsights(records), [records])

  async function handleSave(form: InspectionForm, recordId?: string): Promise<boolean> {
    const responsibleName = findEmployeeName(employees, form.responsibleEmployeeId)
    const workAreaName = findAreaName(areas, form.workAreaId)
    try {
      const saved = recordId ? await updateInspection(recordId, form) : await createInspection(form)
      const normalized = normalizeInspection({ ...saved, responsibleName, workAreaName })
      setRecords((current) => recordId ? current.map((record) => record.id === recordId ? normalized : record) : [normalized, ...current])
      setDialogOpen(false)
      setEditingRecord(null)
      toast.success(recordId ? "Inspección actualizada." : "Inspección creada.")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la inspección")
      return false
    }
  }

  async function handleUpload(record: InspectionRecord, form: EvidenceForm): Promise<boolean> {
    if (!form.file) return false
    try {
      const evidence = await uploadInspectionEvidence(record.id, { file: form.file, description: form.description, isConfirmed: form.isConfirmed })
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

  async function openDetail(record: InspectionRecord) {
    try {
      setDetailRecord(normalizeInspection(await getInspection(record.id)))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el detalle")
    }
  }

  async function downloadInspectionPdf(record: InspectionRecord) {
    try {
      const blob = await exportInspection(record.id)
      saveBlob(blob, `${record.elementName.toLowerCase().replace(/\s+/g, "-")}.pdf`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo exportar la inspección")
    }
  }

  async function previewEvidence(record: InspectionRecord) {
    if (!record.evidence) return
    try {
      const blob = await downloadInspectionEvidence(record.id, record.evidence.id)
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return { url: URL.createObjectURL(blob), mimeType: blob.type || record.evidence?.mimeType || "application/octet-stream", name: record.evidence?.originalName || "evidencia" }
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo previsualizar la evidencia")
    }
  }

  function openEdit(record: InspectionRecord) {
    setEditingRecord(record)
    setDialogOpen(true)
  }

  function focusRecords() {
    window.setTimeout(() => {
      document.getElementById("inspection-records")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 0)
  }

  function handleIntelligenceAction(actionId: string) {
    if (actionId === "upload-evidence") {
      const record =
        records.find((item) => !item.evidence && item.elementName.toLowerCase().includes("extintor")) ??
        records.find((item) => !item.evidence)
      if (record) setEvidenceRecord(record)
      return
    }

    if (actionId === "schedule-follow-up") {
      setEditingRecord(null)
      setDialogOpen(true)
      return
    }

    if (actionId === "review-non-compliant") {
      setResultFilter("DOES_NOT_COMPLY")
      focusRecords()
      return
    }

    if (actionId === "review-partial") {
      setResultFilter("PARTIAL")
      focusRecords()
      return
    }

    if (actionId === "review-copasst") {
      setActionFilter("ALL")
      setResultFilter("ALL")
      setSearch("Sin COPASST")
      focusRecords()
    }
  }

  return (
    <main className="module-polish flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inspecciones</h1>
          <p className="text-sm text-muted-foreground">Registra inspecciones y mantenimientos de instalaciones, maquinaria, equipos y elementos de emergencia.</p>
        </div>
        <Button type="button" className="gap-2" onClick={() => { setEditingRecord(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4" />Nueva inspección
        </Button>
      </div>

      <IntelligenceCenter
        insights={intelligenceInsights}
        contextLabel="Inspecciones"
        title="Analisis inteligente de inspecciones"
        onAction={(action) => handleIntelligenceAction(action.id)}
        onAsk={(question) => askSafeCloud(question, { insights: intelligenceInsights })}
        assistantSuggestions={[
          "¿Hay evidencias pendientes?",
          "¿Cuántos empleados tengo?",
          "¿Qué puedo preguntarte?",
        ]}
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2"><span className="text-xl font-bold text-slate-900">{inspectionsCount}</span><span className="text-xs font-medium text-slate-600">Inspecciones</span></div>
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2"><span className="text-xl font-bold text-blue-700">{maintenanceCount}</span><span className="text-xs font-medium text-slate-600">Mantenimientos</span></div>
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2"><span className="text-xl font-bold text-emerald-700">{withEvidenceCount}</span><span className="text-xs font-medium text-slate-600">Con evidencia</span></div>
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2"><span className="text-xl font-bold text-amber-700">{pendingCount}</span><span className="text-xs font-medium text-slate-600">Pendientes</span></div>
      </section>

      <section className="rounded-md border border-border bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
          <div className="grid gap-2">
            <Label htmlFor="inspection-search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="inspection-search" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar por elemento, área, responsable u observación" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inspection-action-filter">Acción</Label>
            <select id="inspection-action-filter" value={actionFilter} onChange={(event) => setActionFilter(event.target.value as "ALL" | InspectionAction)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="ALL">Todas</option>
              <option value="INSPECTION">Inspección</option>
              <option value="MAINTENANCE">Mantenimiento</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inspection-result-filter">Resultado</Label>
            <select id="inspection-result-filter" value={resultFilter} onChange={(event) => setResultFilter(event.target.value as "ALL" | InspectionResult)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="ALL">Todos</option>
              <option value="COMPLIES">Cumple</option>
              <option value="DOES_NOT_COMPLY">No cumple</option>
              <option value="PARTIAL">Parcial</option>
            </select>
          </div>
          <div className="flex rounded-md border border-border bg-secondary p-1">
            <Button type="button" size="sm" variant={viewMode === "cards" ? "default" : "ghost"} className="gap-2" onClick={() => setViewMode("cards")}><LayoutGrid className="h-4 w-4" />Tarjetas</Button>
            <Button type="button" size="sm" variant={viewMode === "list" ? "default" : "ghost"} className="gap-2" onClick={() => setViewMode("list")}><List className="h-4 w-4" />Lista</Button>
          </div>
        </div>
      </section>

      <section id="inspection-records" className="scroll-mt-20">
        {viewMode === "cards" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="grid gap-4 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{record.elementName}</h3>
                        <Badge variant="outline" className="bg-blue-600 text-white border-transparent">{actionLabel(record.action)}</Badge>
                        <Badge variant="outline" className={resultClassName(record.result)}>{resultLabel(record.result)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{elementTypeLabel(record.elementType)} · {record.workAreaName}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void openDetail(record)}><Eye className="h-4 w-4" />Ver</Button>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(record.date)}</p>
                    <p className="flex items-center gap-2"><UserRound className="h-4 w-4" />{record.responsibleName}</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />COPASST: {record.copasstParticipated ? "Sí" : "No"}</p>
                    <p className="flex items-center gap-2"><FileText className="h-4 w-4" />{record.evidence ? "Con evidencia" : "Sin evidencia"}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openEdit(record)}><Edit className="h-4 w-4" />Editar</Button>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void downloadInspectionPdf(record)}><Download className="h-4 w-4" />PDF</Button>
                    <Button type="button" size="sm" className="gap-2" onClick={() => setEvidenceRecord(record)}><Upload className="h-4 w-4" />Evidencia</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {recordsLoading && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Cargando inspecciones...</CardContent></Card>}
            {!recordsLoading && filteredRecords.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No hay inspecciones para mostrar.</CardContent></Card>}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Elemento</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                  <th className="px-4 py-3 font-medium">Área</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Resultado</th>
                  <th className="px-4 py-3 font-medium">Evidencia</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recordsLoading && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Cargando inspecciones...</td></tr>}
                {!recordsLoading && filteredRecords.map((record) => (
                  <tr key={record.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{record.elementName}</p>
                      <p className="text-muted-foreground">{formatDate(record.date)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{elementTypeLabel(record.elementType)}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="bg-blue-600 text-white border-transparent">{actionLabel(record.action)}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{record.workAreaName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.responsibleName}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={resultClassName(record.result)}>{resultLabel(record.result)}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{record.evidence?.originalName ?? "Sin evidencia"}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => void openDetail(record)}><Eye className="h-4 w-4" />Ver detalle</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(record)}><Edit className="h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => void downloadInspectionPdf(record)}><Download className="h-4 w-4" />Descargar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEvidenceRecord(record)}><Upload className="h-4 w-4" />Subir evidencia</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {!recordsLoading && filteredRecords.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No hay inspecciones para mostrar.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <InspectionDialog
        open={dialogOpen}
        record={editingRecord}
        employees={employees}
        areas={areas}
        loading={loadingCatalogs}
        onClose={() => { setDialogOpen(false); setEditingRecord(null) }}
        onSave={handleSave}
      />
      <EvidenceDialog record={evidenceRecord} onClose={() => setEvidenceRecord(null)} onUpload={handleUpload} />
      <DetailDialog record={detailRecord} onClose={() => setDetailRecord(null)} onDownload={(record) => void downloadInspectionPdf(record)} onPreviewEvidence={(record) => void previewEvidence(record)} />
      <EvidencePreviewDialog preview={preview} onClose={() => { if (preview?.url) URL.revokeObjectURL(preview.url); setPreview(null) }} />
    </main>
  )
}
