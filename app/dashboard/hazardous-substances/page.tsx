"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Download,
  Edit,
  Eye,
  FileText,
  FlaskConical,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
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
import { listManagedDocuments } from "@/services/documentManagementService"
import { listEmployees } from "@/services/employeeService"
import { listPreventiveMeasures } from "@/services/preventiveMeasureService"
import { listRisks } from "@/services/riskService"
import type { ManagedDocument } from "@/types/manager/document-management"
import type { Employee } from "@/types/manager/employee"
import type { PreventiveMeasure } from "@/types/manager/preventiveMeasure"
import type { Risk } from "@/types/manager/risk"

type ViewMode = "cards" | "list"
type RecordKind = "SUBSTANCE" | "PROGRAM"
type SubstanceType = "CARCINOGENIC" | "ACUTE_TOXICITY" | "BOTH"
type ClassificationType = "IARC_GROUP" | "GHS_CATEGORY"
type ProgramProcedureType = "STORAGE" | "HANDLING" | "EMERGENCY" | "DISPOSAL" | "PPE"

type Evidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
  isConfirmed: boolean
}

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

type SubstanceRecord = {
  id: string
  kind: "SUBSTANCE"
  substanceName: string
  type: SubstanceType
  classification: ClassificationType
  storageArea: string
  technicalSheet: string
  recommendation: string
  responsibleEmployeeId: string
  responsibleName: string
  riskId: string
  riskName: string
  preventiveMeasureId: string
  preventiveMeasureName: string
  procedureDocumentId: string
  procedureDocumentName: string
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

type HazardousSubstanceRecord = SubstanceRecord | ProgramRecord

type SubstanceForm = {
  substanceName: string
  type: SubstanceType
  classification: ClassificationType
  storageArea: string
  technicalSheet: string
  recommendation: string
  responsibleEmployeeId: string
  riskId: string
  preventiveMeasureId: string
  procedureDocumentId: string
  observations: string
}

type ProgramForm = {
  name: string
  procedureType: ProgramProcedureType
  date: string
}

type EvidenceForm = {
  fileName: string
  description: string
  isConfirmed: boolean
}

const emptySubstanceForm: SubstanceForm = {
  substanceName: "",
  type: "CARCINOGENIC",
  classification: "IARC_GROUP",
  storageArea: "",
  technicalSheet: "",
  recommendation: "",
  responsibleEmployeeId: "",
  riskId: "",
  preventiveMeasureId: "",
  procedureDocumentId: "",
  observations: "",
}

const emptyProgramForm: ProgramForm = {
  name: "",
  procedureType: "HANDLING",
  date: new Date().toISOString().slice(0, 10),
}

const emptyEvidenceForm: EvidenceForm = {
  fileName: "",
  description: "",
  isConfirmed: true,
}

const initialRecords: HazardousSubstanceRecord[] = [
  {
    id: "hazardous-1",
    kind: "SUBSTANCE",
    substanceName: "Hipoclorito de sodio",
    type: "ACUTE_TOXICITY",
    classification: "GHS_CATEGORY",
    storageArea: "Bodega de insumos químicos",
    technicalSheet: "Ficha técnica hipoclorito.pdf",
    recommendation: "Usar guantes, gafas de seguridad y ventilación adecuada durante la manipulación.",
    responsibleEmployeeId: "mock-employee-1",
    responsibleName: "Responsable SG-SST",
    riskId: "mock-risk-1",
    riskName: "Exposición a sustancias químicas",
    preventiveMeasureId: "mock-measure-1",
    preventiveMeasureName: "Uso obligatorio de EPP",
    procedureDocumentId: "mock-document-1",
    procedureDocumentName: "Procedimiento de manejo de sustancias peligrosas",
    observations: "Mantener alejado de ácidos y materiales incompatibles.",
    evidence: {
      id: "evidence-1",
      fileName: "soporte-almacenamiento-hipoclorito.pdf",
      description: "Registro fotográfico del almacenamiento y rotulación.",
      uploadedAt: "2026-09-10T14:00:00.000Z",
      isConfirmed: true,
    },
    createdAt: "2026-09-10T14:00:00.000Z",
  },
  {
    id: "hazardous-program-1",
    kind: "PROGRAM",
    name: "Programa de manejo seguro de sustancias peligrosas",
    procedureType: "HANDLING",
    date: "2026-09-01",
    createdAt: "2026-09-01T09:00:00.000Z",
  },
]

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}`
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

function findOptionName(options: Option[], id: string) {
  return options.find((option) => option.id === id)?.name ?? ""
}

function findEmployeeName(employees: EmployeeOption[], employeeId: string) {
  return employees.find((employee) => employee.id === employeeId)?.name ?? ""
}

function riskLabel(risk: Risk) {
  return [risk.process, risk.activity, risk.task].filter(Boolean).join(" · ") || risk.hazardDescription?.name || "Riesgo sin nombre"
}

function riskIsChemical(risk: Risk) {
  const value = `${risk.hazardType?.name ?? ""} ${risk.hazardType?.code ?? ""} ${risk.hazardDescription?.name ?? ""}`.toLowerCase()
  return value.includes("quim")
}

function measureLabel(measure: PreventiveMeasure) {
  return measure.title || measure.description || "Medida sin título"
}

function documentLabel(document: ManagedDocument) {
  const code = document.code ? `${document.code} · ` : ""
  return `${code}${document.name}`
}

function typeLabel(value: SubstanceType) {
  if (value === "ACUTE_TOXICITY") return "Toxicidad aguda"
  if (value === "BOTH") return "Ambas"
  return "Carcinógena"
}

function classificationLabel(value: ClassificationType) {
  return value === "GHS_CATEGORY" ? "Categoría SGA" : "Grupo IARC"
}

function procedureTypeLabel(value: ProgramProcedureType) {
  if (value === "STORAGE") return "Almacenamiento"
  if (value === "EMERGENCY") return "Atención de emergencias"
  if (value === "DISPOSAL") return "Disposición final"
  if (value === "PPE") return "Elementos de protección personal"
  return "Manipulación"
}

function kindLabel(kind: RecordKind) {
  return kind === "PROGRAM" ? "Programa" : "Sustancia peligrosa"
}

function recordTitle(record: HazardousSubstanceRecord) {
  return record.kind === "PROGRAM" ? record.name : record.substanceName
}

function recordDate(record: HazardousSubstanceRecord) {
  return record.kind === "PROGRAM" ? record.date : record.createdAt
}

function recordCategory(record: HazardousSubstanceRecord) {
  return record.kind === "PROGRAM" ? procedureTypeLabel(record.procedureType) : `${typeLabel(record.type)} · ${classificationLabel(record.classification)}`
}

function recordResponsible(record: HazardousSubstanceRecord) {
  return record.kind === "PROGRAM" ? "Programa institucional" : record.responsibleName
}

function kindClassName(kind: RecordKind) {
  return kind === "PROGRAM" ? "bg-accentActivd text-accentActivd-foreground border-transparent" : "bg-blue-600 text-white border-transparent"
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
                  {employee.email && (
                    <span className={`block truncate text-xs ${value === employee.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{employee.email}</span>
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
              Cargando...
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
                  {option.description && (
                    <span className={`block truncate text-xs ${value === option.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{option.description}</span>
                  )}
                </button>
              ))}
            </div>
          ) : options.length > 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">No hay coincidencias para esa búsqueda.</p>
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">{emptyMessage}</p>
          )}
        </div>
      </div>
    </div>
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

function Metric({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "blue" | "green" | "amber" }) {
  const toneClass = tone === "blue" ? "text-blue-700" : tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-foreground"
  return (
    <div className="rounded-md bg-secondary px-3 py-1.5">
      <span className={`text-sm font-bold ${toneClass}`}>{value}</span>
      <span className="ml-2 text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function downloadRecordPdf(record: HazardousSubstanceRecord) {
  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const primaryColor: [number, number, number] = [31, 92, 77]

  doc.setFillColor(...primaryColor)
  doc.roundedRect(margin, 12, pageWidth - margin * 2, 24, 3, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("SUSTANCIAS PELIGROSAS", margin + 5, 23)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`${kindLabel(record.kind)} · ${recordCategory(record)}`, margin + 5, 30)

  const body =
    record.kind === "PROGRAM"
      ? [
          ["Nombre", record.name, "Tipo procedimiento", procedureTypeLabel(record.procedureType)],
          ["Fecha", formatDate(record.date), "Evidencia", record.evidence?.fileName ?? "Pendiente"],
        ]
      : [
          ["Sustancia", record.substanceName, "Tipo", typeLabel(record.type)],
          ["Clasificacion", classificationLabel(record.classification), "Almacenamiento", record.storageArea],
          ["Responsable", record.responsibleName, "Riesgo asociado", record.riskName],
          ["Medida preventiva", record.preventiveMeasureName, "Procedimiento", record.procedureDocumentName],
          ["Ficha técnica", record.technicalSheet, "Evidencia", record.evidence?.fileName ?? "Pendiente"],
        ]

  autoTable(doc, {
    startY: 44,
    theme: "grid",
    margin: { left: margin, right: margin },
    body,
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2.5, lineColor: [220, 226, 224], lineWidth: 0.1 },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 34 },
      2: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 34 },
    },
  })

  const y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 84) + 12
  doc.setTextColor(30, 41, 59)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text(record.kind === "PROGRAM" ? "Descripción del programa" : "Recomendaciones y observaciones", margin, y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  const paragraph =
    record.kind === "PROGRAM"
      ? "Programa orientado a identificación, almacenamiento, manipulación y control de sustancias peligrosas."
      : `${record.recommendation || "Sin recomendaciones."}\n${record.observations || "Sin observaciones."}`
  doc.text(doc.splitTextToSize(paragraph, pageWidth - margin * 2), margin, y + 7)

  doc.setDrawColor(220, 226, 224)
  doc.line(margin, 280, pageWidth - margin, 280)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text("Documento generado desde SafeCloud - Sistema de Gestión Integral", margin, 286)
  doc.save(`sustancias-peligrosas-${recordTitle(record).replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`)
}

function SubstanceDialog({
  open,
  record,
  employees,
  risks,
  measures,
  documents,
  loadingCatalogs,
  employeesLoading,
  onClose,
  onSave,
}: {
  open: boolean
  record: SubstanceRecord | null
  employees: EmployeeOption[]
  risks: Option[]
  measures: Option[]
  documents: Option[]
  loadingCatalogs: boolean
  employeesLoading: boolean
  onClose: () => void
  onSave: (form: SubstanceForm, resolved: Pick<SubstanceRecord, "responsibleName" | "riskName" | "preventiveMeasureName" | "procedureDocumentName">, recordId?: string) => void
}) {
  const [form, setForm] = useState<SubstanceForm>(emptySubstanceForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(record ? {
      substanceName: record.substanceName,
      type: record.type,
      classification: record.classification,
      storageArea: record.storageArea,
      technicalSheet: record.technicalSheet,
      recommendation: record.recommendation,
      responsibleEmployeeId: record.responsibleEmployeeId,
      riskId: record.riskId,
      preventiveMeasureId: record.preventiveMeasureId,
      procedureDocumentId: record.procedureDocumentId,
      observations: record.observations,
    } : emptySubstanceForm)
  }, [open, record])

  function update<K extends keyof SubstanceForm>(key: K, value: SubstanceForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.substanceName.trim()) return toast.error("Ingresa el nombre de la sustancia")
    if (!form.storageArea.trim()) return toast.error("Ingresa el área de almacenamiento")
    if (!form.technicalSheet.trim()) return toast.error("Ingresa la ficha técnica del producto")
    if (!form.recommendation.trim()) return toast.error("Ingresa la recomendación del producto")
    if (!form.responsibleEmployeeId) return toast.error("Selecciona el responsable")
    if (!form.riskId) return toast.error("Selecciona el riesgo asociado")
    if (!form.preventiveMeasureId) return toast.error("Selecciona la medida de prevención")
    if (!form.procedureDocumentId) return toast.error("Selecciona el procedimiento de gestión documental")

    const resolved = {
      responsibleName: findEmployeeName(employees, form.responsibleEmployeeId) || record?.responsibleName || "Responsable seleccionado",
      riskName: findOptionName(risks, form.riskId) || record?.riskName || "Riesgo seleccionado",
      preventiveMeasureName: findOptionName(measures, form.preventiveMeasureId) || record?.preventiveMeasureName || "Medida seleccionada",
      procedureDocumentName: findOptionName(documents, form.procedureDocumentId) || record?.procedureDocumentName || "Procedimiento seleccionado",
    }

    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 250))
    onSave(form, resolved, record?.id)
    setSaving(false)
    setForm(emptySubstanceForm)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{record ? "Editar sustancia peligrosa" : "Nueva sustancia peligrosa"}</DialogTitle>
          <p className="text-sm text-muted-foreground">Registra clasificación, controles asociados, responsable y evidencias.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Información de la sustancia</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  Nombre de la sustancia
                  <Input value={form.substanceName} onChange={(event) => update("substanceName", event.target.value)} placeholder="Nombre del producto o sustancia" />
                </Label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Tipo</span>
                  <select value={form.type} onChange={(event) => update("type", event.target.value as SubstanceType)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="CARCINOGENIC">Carcinógena</option>
                    <option value="ACUTE_TOXICITY">Toxicidad aguda</option>
                    <option value="BOTH">Ambas</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Clasificación</span>
                  <select value={form.classification} onChange={(event) => update("classification", event.target.value as ClassificationType)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="IARC_GROUP">Grupo IARC</option>
                    <option value="GHS_CATEGORY">Categoría SGA</option>
                  </select>
                </label>
                <Label className="grid gap-2">
                  Área de almacenamiento
                  <Input value={form.storageArea} onChange={(event) => update("storageArea", event.target.value)} placeholder="Bodega, almacén, laboratorio..." />
                </Label>
                <Label className="grid gap-2">
                  Ficha técnica del producto
                  <Input value={form.technicalSheet} onChange={(event) => update("technicalSheet", event.target.value)} placeholder="Nombre o referencia de la ficha técnica" />
                </Label>
                <Label className="grid gap-2">
                  Recomendación del producto
                  <Input value={form.recommendation} onChange={(event) => update("recommendation", event.target.value)} placeholder="Recomendación de uso o control" />
                </Label>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <EmployeePicker employees={employees} loading={employeesLoading} value={form.responsibleEmployeeId} onChange={(employeeId) => update("responsibleEmployeeId", employeeId)} />
              <SearchableOptionPicker label="Riesgo asociado" value={form.riskId} options={risks} loading={loadingCatalogs} placeholder="Buscar riesgo químico..." emptyMessage="No hay riesgos disponibles." onChange={(id) => update("riskId", id)} />
              <SearchableOptionPicker label="Medida de prevención" value={form.preventiveMeasureId} options={measures} loading={loadingCatalogs} placeholder="Buscar medida preventiva..." emptyMessage="No hay medidas de prevención disponibles." onChange={(id) => update("preventiveMeasureId", id)} />
              <SearchableOptionPicker label="Procedimiento de gestión documental" value={form.procedureDocumentId} options={documents} loading={loadingCatalogs} placeholder="Buscar procedimiento..." emptyMessage="No hay procedimientos disponibles." onChange={(id) => update("procedureDocumentId", id)} />
            </section>

            <Label className="grid gap-2 rounded-md border border-border p-4">
              Observaciones
              <Textarea value={form.observations} onChange={(event) => update("observations", event.target.value)} rows={4} placeholder="Describe condiciones de almacenamiento, manipulación o seguimiento." />
            </Label>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {record ? "Guardar cambios" : "Crear sustancia"}
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
  onSave: (form: ProgramForm, recordId?: string) => void
}) {
  const [form, setForm] = useState<ProgramForm>(emptyProgramForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(record ? { name: record.name, procedureType: record.procedureType, date: record.date } : emptyProgramForm)
  }, [open, record])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) return toast.error("Ingresa el nombre del programa")
    if (!form.date) return toast.error("Selecciona la fecha")

    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 250))
    onSave(form, record?.id)
    setSaving(false)
    setForm(emptyProgramForm)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-3xl bg-card">
        <DialogHeader>
          <DialogTitle>{record ? "Editar programa" : "Nuevo programa"}</DialogTitle>
          <p className="text-sm text-muted-foreground">Relaciona el programa o procedimiento para sustancias peligrosas.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2 md:col-span-2">
              Nombre
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Programa de control de sustancias peligrosas" />
            </Label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Relacionar tipo de procedimiento</span>
              <select value={form.procedureType} onChange={(event) => setForm((current) => ({ ...current, procedureType: event.target.value as ProgramProcedureType }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="STORAGE">Almacenamiento</option>
                <option value="HANDLING">Manipulación</option>
                <option value="EMERGENCY">Atención de emergencias</option>
                <option value="DISPOSAL">Disposición final</option>
                <option value="PPE">Elementos de protección personal</option>
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
  record: HazardousSubstanceRecord | null
  onClose: () => void
  onUpload: (recordId: string, form: EvidenceForm) => void
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.fileName.trim()) return toast.error("Selecciona la evidencia")
    if (!form.description.trim()) return toast.error("Describe brevemente la evidencia")
    onUpload(record.id, form)
    setForm(emptyEvidenceForm)
    onClose()
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Subir evidencia</DialogTitle>
          <p className="text-sm text-muted-foreground">Adjunta ficha técnica, soporte fotográfico, inspección o documento del programa.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-dashed border-border bg-secondary p-4">
            <Label className="grid gap-2">
              Archivo
              <Input type="file" onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.files?.[0]?.name ?? "" }))} />
            </Label>
            <Input className="mt-3" value={form.fileName} onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.value }))} placeholder="También puedes escribir el nombre del archivo mock" />
          </div>
          <Label className="grid gap-2">
            Descripción de la evidencia
            <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} placeholder="Ej: Ficha técnica y registro fotográfico de almacenamiento." />
          </Label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.isConfirmed} onChange={(event) => setForm((current) => ({ ...current, isConfirmed: event.target.checked }))} className="h-4 w-4 rounded border-border" />
            Evidencia confirmada
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="gap-2"><Upload className="h-4 w-4" />Guardar evidencia</Button>
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
}: {
  record: HazardousSubstanceRecord | null
  onClose: () => void
  onDownload: (record: HazardousSubstanceRecord) => void
}) {
  if (!record) return null

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{recordTitle(record)}</DialogTitle>
          <p className="text-sm text-muted-foreground">Consulta el detalle del registro de sustancias peligrosas.</p>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoBlock label="Tipo registro" value={kindLabel(record.kind)} />
            <InfoBlock label="Clasificación" value={recordCategory(record)} />
            <InfoBlock label="Fecha" value={formatDate(recordDate(record))} />
            <InfoBlock label="Responsable" value={recordResponsible(record)} />
          </div>
          {record.kind === "SUBSTANCE" && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <InfoBlock label="Área almacenamiento" value={record.storageArea} />
                <InfoBlock label="Riesgo asociado" value={record.riskName} />
                <InfoBlock label="Medida preventiva" value={record.preventiveMeasureName} />
              </div>
              <InfoBlock label="Procedimiento" value={record.procedureDocumentName} />
              <section className="rounded-md border border-border p-4">
                <h3 className="mb-2 text-sm font-semibold text-foreground">Recomendaciones y observaciones</h3>
                <p className="text-sm text-muted-foreground">{record.recommendation}</p>
                <p className="mt-2 text-sm text-muted-foreground">{record.observations || "Sin observaciones."}</p>
              </section>
            </>
          )}
          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><FileText className="h-4 w-4" />Evidencia</h3>
            {record.evidence ? (
              <div className="rounded-md bg-secondary p-3 text-sm">
                <p className="font-medium text-foreground">{record.evidence.fileName}</p>
                <p className="text-muted-foreground">{record.evidence.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(record.evidence.uploadedAt)} · {record.evidence.isConfirmed ? "Confirmada" : "Sin confirmar"}</p>
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

export default function HazardousSubstancesPage() {
  const [records, setRecords] = useState<HazardousSubstanceRecord[]>(initialRecords)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [risks, setRisks] = useState<Option[]>([])
  const [measures, setMeasures] = useState<Option[]>([])
  const [documents, setDocuments] = useState<Option[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [catalogsLoading, setCatalogsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState<RecordKind | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [substanceDialogOpen, setSubstanceDialogOpen] = useState(false)
  const [programDialogOpen, setProgramDialogOpen] = useState(false)
  const [editingSubstance, setEditingSubstance] = useState<SubstanceRecord | null>(null)
  const [editingProgram, setEditingProgram] = useState<ProgramRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<HazardousSubstanceRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<HazardousSubstanceRecord | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadEmployees() {
      try {
        const employeeList = await listEmployees()
        if (mounted) setEmployees(toEmployeeOptions(employeeList))
      } catch (error) {
        if (mounted) toast.error(error instanceof Error ? error.message : "No se pudo cargar los funcionarios")
      } finally {
        if (mounted) setEmployeesLoading(false)
      }
    }
    loadEmployees()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadCatalogs() {
      try {
        const [riskResult, measureResult, documentResult] = await Promise.allSettled([
          listRisks(),
          listPreventiveMeasures({ limit: 100 }),
          listManagedDocuments(),
        ])
        if (!mounted) return
        if (riskResult.status === "fulfilled") {
          const riskItems = riskResult.value.items ?? []
          const chemicalRisks = riskItems.filter(riskIsChemical)
          const source = chemicalRisks.length > 0 ? chemicalRisks : riskItems
          setRisks(source.map((risk) => ({ id: risk.id, name: riskLabel(risk), description: risk.hazardType?.name ?? risk.hazardDescription?.name })))
        }
        if (measureResult.status === "fulfilled") {
          setMeasures((measureResult.value.items ?? []).map((measure) => ({ id: measure.id, name: measureLabel(measure), description: measure.risk?.process })))
        }
        if (documentResult.status === "fulfilled") {
          const procedureDocuments = documentResult.value.filter((document) => document.type === "PROCEDURE")
          setDocuments((procedureDocuments.length > 0 ? procedureDocuments : documentResult.value).map((document) => ({ id: document.id, name: documentLabel(document), description: document.workArea?.name })))
        }
      } catch (error) {
        if (mounted) toast.error(error instanceof Error ? error.message : "No se pudo cargar la información relacionada")
      } finally {
        if (mounted) setCatalogsLoading(false)
      }
    }
    loadCatalogs()
    return () => {
      mounted = false
    }
  }, [])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    return records.filter((record) => {
      const matchesKind = kindFilter === "all" || record.kind === kindFilter
      const values = [recordTitle(record), recordCategory(record), recordResponsible(record), record.kind === "SUBSTANCE" ? `${record.storageArea} ${record.riskName} ${record.preventiveMeasureName}` : ""].join(" ").toLowerCase()
      return matchesKind && (!query || values.includes(query))
    })
  }, [records, search, kindFilter])

  const stats = useMemo(() => ({
    total: records.length,
    substances: records.filter((record) => record.kind === "SUBSTANCE").length,
    programs: records.filter((record) => record.kind === "PROGRAM").length,
    withEvidence: records.filter((record) => Boolean(record.evidence)).length,
  }), [records])

  function handleSaveSubstance(
    form: SubstanceForm,
    resolved: Pick<SubstanceRecord, "responsibleName" | "riskName" | "preventiveMeasureName" | "procedureDocumentName">,
    recordId?: string,
  ) {
    const payload = {
      substanceName: form.substanceName.trim(),
      type: form.type,
      classification: form.classification,
      storageArea: form.storageArea.trim(),
      technicalSheet: form.technicalSheet.trim(),
      recommendation: form.recommendation.trim(),
      responsibleEmployeeId: form.responsibleEmployeeId,
      riskId: form.riskId,
      preventiveMeasureId: form.preventiveMeasureId,
      procedureDocumentId: form.procedureDocumentId,
      observations: form.observations.trim(),
      ...resolved,
    }
    if (recordId) {
      setRecords((current) => current.map((record) => record.id === recordId ? { ...record, ...payload } as HazardousSubstanceRecord : record))
      toast.success("Sustancia peligrosa actualizada")
      return
    }
    setRecords((current) => [{ id: createId("hazardous"), kind: "SUBSTANCE", ...payload, createdAt: new Date().toISOString() }, ...current])
    toast.success("Sustancia peligrosa creada")
  }

  function handleSaveProgram(form: ProgramForm, recordId?: string) {
    const payload = { name: form.name.trim(), procedureType: form.procedureType, date: form.date }
    if (recordId) {
      setRecords((current) => current.map((record) => record.id === recordId ? { ...record, ...payload } as HazardousSubstanceRecord : record))
      toast.success("Programa actualizado")
      return
    }
    setRecords((current) => [{ id: createId("program"), kind: "PROGRAM", ...payload, createdAt: new Date().toISOString() }, ...current])
    toast.success("Programa creado")
  }

  function handleUpload(recordId: string, form: EvidenceForm) {
    setRecords((current) =>
      current.map((record) =>
        record.id === recordId
          ? { ...record, evidence: { id: createId("evidence"), fileName: form.fileName.trim(), description: form.description.trim(), uploadedAt: new Date().toISOString(), isConfirmed: form.isConfirmed } }
          : record,
      ),
    )
    toast.success("Evidencia cargada")
  }

  function openEdit(record: HazardousSubstanceRecord) {
    if (record.kind === "PROGRAM") {
      setEditingProgram(record)
      setProgramDialogOpen(true)
      return
    }
    setEditingSubstance(record)
    setSubstanceDialogOpen(true)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sustancias Peligrosas</h1>
          <p className="text-muted-foreground">Gestiona sustancias, programas, riesgos químicos, medidas preventivas y evidencias.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => { setEditingProgram(null); setProgramDialogOpen(true) }}>
            <Plus className="h-4 w-4" />
            Crear programa
          </Button>
          <Button type="button" className="gap-2" onClick={() => { setEditingSubstance(null); setSubstanceDialogOpen(true) }}>
            <Plus className="h-4 w-4" />
            Nueva sustancia
          </Button>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center overflow-x-auto px-3 py-1">
          <div className="flex w-fit min-w-max items-center gap-2">
            <Metric label="Registros" value={stats.total} />
            <Metric label="Sustancias" value={stats.substances} tone="blue" />
            <Metric label="Programas" value={stats.programs} tone="green" />
            <Metric label="Con evidencia" value={stats.withEvidence} tone="amber" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_240px]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Sustancia, programa, responsable o riesgo" />
            </div>
          </Label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Tipo de registro</span>
            <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as RecordKind | "all")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="all">Todos</option>
              <option value="SUBSTANCE">Sustancia peligrosa</option>
              <option value="PROGRAM">Programa</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Registros de sustancias peligrosas</h2>
            <p className="text-sm text-muted-foreground">{filteredRecords.length} registros encontrados</p>
          </div>
          <div className="inline-flex w-fit rounded-md border border-border bg-secondary p-1">
            <Button type="button" size="sm" variant={viewMode === "cards" ? "default" : "ghost"} className="h-8 gap-2" onClick={() => setViewMode("cards")}><LayoutGrid className="h-4 w-4" />Tarjetas</Button>
            <Button type="button" size="sm" variant={viewMode === "list" ? "default" : "ghost"} className="h-8 gap-2" onClick={() => setViewMode("list")}><List className="h-4 w-4" />Lista</Button>
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
                        <h3 className="font-semibold text-foreground">{recordTitle(record)}</h3>
                        <Badge variant="outline" className={kindClassName(record.kind)}>{kindLabel(record.kind)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{recordCategory(record)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDetailRecord(record)}><Eye className="h-4 w-4" />Ver</Button>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(recordDate(record))}</p>
                    <p className="flex items-center gap-2"><UserRound className="h-4 w-4" />{recordResponsible(record)}</p>
                    <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />{record.kind === "SUBSTANCE" ? record.preventiveMeasureName : "Programa"}</p>
                    <p className="flex items-center gap-2"><FileText className="h-4 w-4" />{record.evidence ? "Con evidencia" : "Sin evidencia"}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openEdit(record)}><Edit className="h-4 w-4" />Editar</Button>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => downloadRecordPdf(record)}><Download className="h-4 w-4" />PDF</Button>
                    <Button type="button" size="sm" className="gap-2" onClick={() => setEvidenceRecord(record)}><Upload className="h-4 w-4" />Evidencia</Button>
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
                  <th className="px-4 py-3 font-medium">Registro</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Clasificación</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Riesgo / procedimiento</th>
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
                    <td className="px-4 py-3 text-muted-foreground">{recordResponsible(record)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.kind === "SUBSTANCE" ? record.riskName : procedureTypeLabel(record.procedureType)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.evidence?.fileName ?? "Sin evidencia"}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => setDetailRecord(record)}><Eye className="h-4 w-4" />Ver detalle</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(record)}><Edit className="h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => downloadRecordPdf(record)}><Download className="h-4 w-4" />Descargar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEvidenceRecord(record)}><Upload className="h-4 w-4" />Subir evidencia</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No hay registros de sustancias peligrosas para mostrar.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SubstanceDialog
        open={substanceDialogOpen}
        record={editingSubstance}
        employees={employees}
        risks={risks}
        measures={measures}
        documents={documents}
        loadingCatalogs={catalogsLoading}
        employeesLoading={employeesLoading}
        onClose={() => { setSubstanceDialogOpen(false); setEditingSubstance(null) }}
        onSave={handleSaveSubstance}
      />
      <ProgramDialog open={programDialogOpen} record={editingProgram} onClose={() => { setProgramDialogOpen(false); setEditingProgram(null) }} onSave={handleSaveProgram} />
      <EvidenceDialog record={evidenceRecord} onClose={() => setEvidenceRecord(null)} onUpload={handleUpload} />
      <DetailDialog record={detailRecord} onClose={() => setDetailRecord(null)} onDownload={downloadRecordPdf} />
    </main>
  )
}
