"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  Activity,
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
  Target,
  Upload,
  UserRound,
} from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"

import { AnalyticsBarChart, AnalyticsChartCard, AnalyticsDonutChart } from "@/components/dashboard/analytics-charts"
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
import type { Employee } from "@/types/manager/employee"
import type { IncidentType } from "@/types/manager/incident"

type ViewMode = "cards" | "list"
type Periodicity = "ANNUAL" | "SEMESTER" | "QUARTER" | "BIMONTHLY" | "MONTHLY"

type EmployeeOption = {
  id: string
  name: string
  email?: string
}

type Evidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
  isConfirmed: boolean
}

type ImprovementAction = {
  description: string
  responsible: string
  dueDate: string
}

type Indicator = {
  id: string
  name: string
  value: number
  unit: string
  description: string
  chartData: Array<{ name: string; total: number }>
}

type AnalysisRecord = {
  id: string
  periodicity: Periodicity
  year: string
  period: string
  responsibleEmployeeId: string
  responsibleName: string
  analysisDate: string
  incidentType: IncidentType
  indicators: Indicator[]
  improvementAction?: ImprovementAction
  evidence?: Evidence
  createdAt: string
}

type AnalysisForm = {
  periodicity: Periodicity
  year: string
  period: string
  responsibleEmployeeId: string
  analysisDate: string
  incidentType: IncidentType
}

type ImprovementForm = {
  description: string
  responsible: string
  dueDate: string
}

type EvidenceForm = {
  fileName: string
  description: string
  isConfirmed: boolean
}

const currentYear = String(new Date().getFullYear())

const emptyAnalysisForm: AnalysisForm = {
  periodicity: "ANNUAL",
  year: currentYear,
  period: "YEAR",
  responsibleEmployeeId: "",
  analysisDate: new Date().toISOString().slice(0, 10),
  incidentType: "ACCIDENTE",
}

const emptyImprovementForm: ImprovementForm = {
  description: "",
  responsible: "",
  dueDate: "",
}

const emptyEvidenceForm: EvidenceForm = {
  fileName: "",
  description: "",
  isConfirmed: true,
}

const incidentTypeOptions: Array<{ value: IncidentType; label: string }> = [
  { value: "INCIDENTE", label: "Incidente" },
  { value: "ACCIDENTE", label: "Accidente" },
  { value: "ENFERMEDAD_LABORAL", label: "Enfermedad laboral" },
  { value: "INCAPACIDAD_MEDICA", label: "Incapacidad medica" },
  { value: "LICENCIA_MATERNIDAD", label: "Licencia de maternidad" },
  { value: "LICENCIA_PATERNIDAD", label: "Licencia de paternidad" },
  { value: "VACACIONES", label: "Vacaciones" },
  { value: "DIAS_NO_REMUNERADO", label: "Dias no remunerados" },
  { value: "DIA_REMUNERADO", label: "Dia remunerado" },
  { value: "REVISION_POR_LA_DIRECCION", label: "Revision por la direccion" },
  { value: "REQUERIMIENTO_DE_AUTORIDAD_ADMINISTRATIVA", label: "Requerimiento de autoridad administrativa" },
  { value: "RECOMENDACION_DE_LA_ARL", label: "Recomendacion de la ARL" },
]

const initialRecords: AnalysisRecord[] = [
  {
    id: "analysis-1",
    periodicity: "ANNUAL",
    year: "2026",
    period: "YEAR",
    responsibleEmployeeId: "mock-employee-1",
    responsibleName: "Responsable SG-SST",
    analysisDate: "2026-09-10",
    incidentType: "ACCIDENTE",
    indicators: generateIndicators("ANNUAL", "ACCIDENTE"),
    improvementAction: {
      description: "Reforzar inspecciones de condiciones inseguras y seguimiento a acciones correctivas.",
      responsible: "Responsable SG-SST",
      dueDate: "2026-10-15",
    },
    evidence: {
      id: "evidence-1",
      fileName: "analisis-accidentalidad-2026.pdf",
      description: "Informe estadístico firmado por responsable SG-SST.",
      uploadedAt: "2026-09-10T14:00:00.000Z",
      isConfirmed: true,
    },
    createdAt: "2026-09-10T14:00:00.000Z",
  },
]

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
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

function periodicityLabel(value: Periodicity) {
  if (value === "SEMESTER") return "Semestral"
  if (value === "QUARTER") return "Trimestral"
  if (value === "BIMONTHLY") return "Bimestral"
  if (value === "MONTHLY") return "Mensual"
  return "Anual"
}

function incidentTypeLabel(value: IncidentType) {
  return incidentTypeOptions.find((option) => option.value === value)?.label ?? value
}

function getPeriodOptions(periodicity: Periodicity) {
  if (periodicity === "SEMESTER") return ["Semestre 1", "Semestre 2"]
  if (periodicity === "QUARTER") return ["Trimestre 1", "Trimestre 2", "Trimestre 3", "Trimestre 4"]
  if (periodicity === "BIMONTHLY") return ["Bimestre 1", "Bimestre 2", "Bimestre 3", "Bimestre 4", "Bimestre 5", "Bimestre 6"]
  if (periodicity === "MONTHLY") return ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  return ["YEAR"]
}

function periodLabel(record: Pick<AnalysisRecord, "periodicity" | "year" | "period">) {
  return record.periodicity === "ANNUAL" ? record.year : `${record.year} · ${record.period}`
}

function generateIndicators(periodicity: Periodicity, incidentType: IncidentType): Indicator[] {
  const multiplier = periodicity === "ANNUAL" ? 6 : periodicity === "SEMESTER" ? 4 : periodicity === "QUARTER" ? 3 : periodicity === "BIMONTHLY" ? 2 : 1
  const isAbsenceType = ["INCAPACIDAD_MEDICA", "LICENCIA_MATERNIDAD", "LICENCIA_PATERNIDAD", "VACACIONES", "DIAS_NO_REMUNERADO", "DIA_REMUNERADO"].includes(incidentType)
  const isIllnessType = incidentType === "ENFERMEDAD_LABORAL"
  const base = incidentType === "ACCIDENTE" ? 4 : incidentType === "INCIDENTE" ? 3 : isIllnessType ? 2 : isAbsenceType ? 5 : 1
  const labels = periodicity === "ANNUAL" ? ["Ene", "Mar", "May", "Jul", "Sep", "Nov"] : ["Periodo 1", "Periodo 2", "Periodo 3", "Periodo 4"]

  function chart(seed: number) {
    return labels.map((label, index) => ({
      name: label,
      total: Math.max(0, Math.round(seed + index * (base / 2) + multiplier / 2)),
    }))
  }

  return [
    {
      id: "frequency",
      name: "Frecuencia de accidentalidad",
      value: base * multiplier,
      unit: "casos",
      description: "Cantidad de eventos reportados para el tipo de novedad seleccionado.",
      chartData: chart(base),
    },
    {
      id: "severity",
      name: "Severidad",
      value: isAbsenceType || incidentType === "ACCIDENTE" ? base * multiplier * 3 : base * multiplier,
      unit: "dias",
      description: "Calcula automaticamente los dias asociados a incapacidades o ausencia laboral.",
      chartData: chart(base * 2),
    },
    {
      id: "mortality",
      name: "Mortalidad",
      value: incidentType === "ACCIDENTE" && multiplier > 4 ? 1 : 0,
      unit: "casos",
      description: "Cuenta automaticamente los eventos marcados como mortales.",
      chartData: chart(incidentType === "ACCIDENTE" ? 0.2 : 0),
    },
    {
      id: "prevalence",
      name: "Prevalencia",
      value: isIllnessType ? base * multiplier : 0,
      unit: "casos",
      description: "Relaciona los casos existentes de enfermedad laboral dentro del periodo analizado.",
      chartData: chart(isIllnessType ? base : 0),
    },
    {
      id: "incidence",
      name: "Incidencia",
      value: Math.max(1, base * multiplier - 1),
      unit: "nuevos",
      description: "Calcula los eventos nuevos reportados durante el periodo.",
      chartData: chart(base + 1),
    },
    {
      id: "absenteeism",
      name: "Ausentismo",
      value: isAbsenceType ? base * multiplier * 2 : Math.max(0, base * multiplier - 2),
      unit: "dias",
      description: "Agrupa incapacidades comunes, laborales y novedades asociadas a ausentismo.",
      chartData: chart(isAbsenceType ? base * 2 : base),
    },
  ]
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
                  className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    value === employee.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
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
    <div className="rounded-md bg-secondary px-3 py-1.5">
      <span className={`text-sm font-bold ${toneClass}`}>{value}</span>
      <span className="ml-2 text-xs text-muted-foreground">{label}</span>
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

function downloadAnalysisPdf(record: AnalysisRecord) {
  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const primaryColor: [number, number, number] = [31, 92, 77]

  doc.setFillColor(...primaryColor)
  doc.roundedRect(margin, 12, pageWidth - margin * 2, 24, 3, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("ESTADISTICAS Y ANALISIS", margin + 5, 23)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`${periodicityLabel(record.periodicity)} · ${periodLabel(record)} · ${incidentTypeLabel(record.incidentType)}`, margin + 5, 30)

  autoTable(doc, {
    startY: 44,
    theme: "grid",
    margin: { left: margin, right: margin },
    body: [
      ["Fecha analisis", formatDate(record.analysisDate), "Responsable", record.responsibleName],
      ["Tipo novedad", incidentTypeLabel(record.incidentType), "Periodo", periodLabel(record)],
      ["Evidencia", record.evidence?.fileName ?? "Pendiente", "Accion mejora", record.improvementAction ? "Registrada" : "Pendiente"],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5, lineColor: [220, 226, 224], lineWidth: 0.1 },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 34 },
      2: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 32 },
    },
  })

  autoTable(doc, {
    startY: ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 74) + 10,
    theme: "striped",
    margin: { left: margin, right: margin },
    head: [["Indicador", "Valor", "Descripcion"]],
    body: record.indicators.map((indicator) => [indicator.name, `${indicator.value} ${indicator.unit}`, indicator.description]),
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2.5, lineColor: [220, 226, 224], lineWidth: 0.1 },
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: "bold" },
      1: { cellWidth: 28 },
    },
  })

  const finalY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 170) + 10
  doc.setTextColor(30, 41, 59)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Accion de mejora", margin, finalY)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(doc.splitTextToSize(record.improvementAction?.description ?? "Pendiente por registrar.", pageWidth - margin * 2), margin, finalY + 7)

  doc.setDrawColor(220, 226, 224)
  doc.line(margin, 280, pageWidth - margin, 280)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text("Documento generado desde SafeCloud - Sistema de Gestion Integral", margin, 286)
  doc.save(`estadisticas-analisis-${record.year}-${record.incidentType}.pdf`)
}

function AnalysisDialog({
  open,
  record,
  employees,
  employeesLoading,
  onClose,
  onSave,
}: {
  open: boolean
  record: AnalysisRecord | null
  employees: EmployeeOption[]
  employeesLoading: boolean
  onClose: () => void
  onSave: (form: AnalysisForm, responsibleName: string, recordId?: string) => void
}) {
  const [form, setForm] = useState<AnalysisForm>(emptyAnalysisForm)
  const [saving, setSaving] = useState(false)
  const periodOptions = getPeriodOptions(form.periodicity)

  useEffect(() => {
    if (!open) return
    setForm(record ? {
      periodicity: record.periodicity,
      year: record.year,
      period: record.period,
      responsibleEmployeeId: record.responsibleEmployeeId,
      analysisDate: record.analysisDate,
      incidentType: record.incidentType,
    } : emptyAnalysisForm)
  }, [open, record])

  function update<K extends keyof AnalysisForm>(key: K, value: AnalysisForm[K]) {
    setForm((current) => {
      if (key === "periodicity") {
        const options = getPeriodOptions(value as Periodicity)
        return { ...current, periodicity: value as Periodicity, period: options[0] }
      }
      return { ...current, [key]: value }
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.year.trim()) return toast.error("Ingresa el año")
    if (!form.analysisDate) return toast.error("Selecciona la fecha de analisis")
    if (!form.responsibleEmployeeId) return toast.error("Selecciona el responsable")
    if (!form.incidentType) return toast.error("Selecciona el tipo de novedad laboral")

    const responsibleName = findEmployeeName(employees, form.responsibleEmployeeId) || record?.responsibleName || "Responsable seleccionado"

    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 250))
    onSave(form, responsibleName, record?.id)
    setSaving(false)
    setForm(emptyAnalysisForm)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{record ? "Editar analisis" : "Nuevo analisis"}</DialogTitle>
          <p className="text-sm text-muted-foreground">Configura el periodo, responsable y tipo de novedad laboral para generar los indicadores.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos del analisis</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Periodicidad</span>
                  <select value={form.periodicity} onChange={(event) => update("periodicity", event.target.value as Periodicity)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="ANNUAL">Anual</option>
                    <option value="SEMESTER">Semestral</option>
                    <option value="QUARTER">Trimestral</option>
                    <option value="BIMONTHLY">Bimestral</option>
                    <option value="MONTHLY">Mensual</option>
                  </select>
                </label>
                <Label className="grid gap-2">
                  Año
                  <Input value={form.year} onChange={(event) => update("year", event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2026" />
                </Label>
                {form.periodicity !== "ANNUAL" && (
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-foreground">Periodo</span>
                    <select value={form.period} onChange={(event) => update("period", event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {periodOptions.map((period) => <option key={period} value={period}>{period}</option>)}
                    </select>
                  </label>
                )}
                <Label className="grid gap-2">
                  Fecha de analisis
                  <Input type="date" value={form.analysisDate} onChange={(event) => update("analysisDate", event.target.value)} />
                </Label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-foreground">Tipo de novedad laboral</span>
                  <select value={form.incidentType} onChange={(event) => update("incidentType", event.target.value as IncidentType)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {incidentTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <div className="md:col-span-2">
                  <EmployeePicker employees={employees} loading={employeesLoading} value={form.responsibleEmployeeId} onChange={(employeeId) => update("responsibleEmployeeId", employeeId)} />
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {record ? "Guardar cambios" : "Generar analisis"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ImprovementDialog({
  record,
  onClose,
  onSave,
}: {
  record: AnalysisRecord | null
  onClose: () => void
  onSave: (recordId: string, form: ImprovementForm) => void
}) {
  const [form, setForm] = useState<ImprovementForm>(emptyImprovementForm)

  useEffect(() => {
    if (!record) return
    setForm(record.improvementAction ?? emptyImprovementForm)
  }, [record])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.description.trim()) return toast.error("Describe la accion de mejora")
    if (!form.responsible.trim()) return toast.error("Ingresa el responsable de la accion")
    if (!form.dueDate) return toast.error("Selecciona la fecha de cumplimiento")

    onSave(record.id, form)
    setForm(emptyImprovementForm)
    onClose()
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Accion de mejora</DialogTitle>
          <p className="text-sm text-muted-foreground">Registra el plan de accion asociado al resultado estadistico.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Label className="grid gap-2">
            Descripcion
            <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Describe la accion de mejora." />
          </Label>
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Responsable
              <Input value={form.responsible} onChange={(event) => setForm((current) => ({ ...current, responsible: event.target.value }))} placeholder="Responsable del seguimiento" />
            </Label>
            <Label className="grid gap-2">
              Fecha compromiso
              <Input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar accion</Button>
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
  record: AnalysisRecord | null
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
          <p className="text-sm text-muted-foreground">Adjunta informe, soporte firmado, graficas o documento del analisis.</p>
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
            <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} placeholder="Ej: Informe estadistico de ausentismo firmado." />
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
  record: AnalysisRecord | null
  onClose: () => void
  onDownload: (record: AnalysisRecord) => void
}) {
  if (!record) return null

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{incidentTypeLabel(record.incidentType)} · {periodLabel(record)}</DialogTitle>
          <p className="text-sm text-muted-foreground">Consulta indicadores, accion de mejora y evidencia del analisis.</p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoBlock label="Periodicidad" value={periodicityLabel(record.periodicity)} />
            <InfoBlock label="Periodo" value={periodLabel(record)} />
            <InfoBlock label="Fecha" value={formatDate(record.analysisDate)} />
            <InfoBlock label="Responsable" value={record.responsibleName} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {record.indicators.map((indicator) => (
              <AnalyticsChartCard key={indicator.id} title={indicator.name} description={`${indicator.value} ${indicator.unit} · ${indicator.description}`}>
                <AnalyticsBarChart data={indicator.chartData} color="var(--chart-2)" />
              </AnalyticsChartCard>
            ))}
          </div>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="h-4 w-4" />
              Accion de mejora
            </h3>
            {record.improvementAction ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{record.improvementAction.description}</p>
                <p>Responsable: {record.improvementAction.responsible} · Fecha: {formatDate(record.improvementAction.dueDate)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin accion de mejora registrada.</p>
            )}
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4" />
              Evidencia
            </h3>
            {record.evidence ? (
              <div className="rounded-md bg-secondary p-3 text-sm">
                <p className="font-medium text-foreground">{record.evidence.fileName}</p>
                <p className="text-muted-foreground">{record.evidence.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(record.evidence.uploadedAt)} · {record.evidence.isConfirmed ? "Confirmada" : "Sin confirmar"}
                </p>
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

export default function EmployeeAnalyticsPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>(initialRecords)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<IncidentType | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AnalysisRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<AnalysisRecord | null>(null)
  const [improvementRecord, setImprovementRecord] = useState<AnalysisRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<AnalysisRecord | null>(null)

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
      const matchesType = typeFilter === "all" || record.incidentType === typeFilter
      const matchesSearch =
        !query ||
        incidentTypeLabel(record.incidentType).toLowerCase().includes(query) ||
        record.responsibleName.toLowerCase().includes(query) ||
        periodLabel(record).toLowerCase().includes(query)

      return matchesType && matchesSearch
    })
  }, [records, search, typeFilter])

  const stats = useMemo(() => ({
    total: records.length,
    withEvidence: records.filter((record) => Boolean(record.evidence)).length,
    withAction: records.filter((record) => Boolean(record.improvementAction)).length,
    annual: records.filter((record) => record.periodicity === "ANNUAL").length,
  }), [records])

  const summaryChart = useMemo(() => {
    return records.map((record) => ({
      name: periodLabel(record),
      total: record.indicators.reduce((sum, indicator) => sum + indicator.value, 0),
    }))
  }, [records])

  const typeChart = useMemo(() => {
    return incidentTypeOptions
      .map((option) => ({
        name: option.label,
        total: records.filter((record) => record.incidentType === option.value).length,
      }))
      .filter((item) => item.total > 0)
  }, [records])

  function handleSave(form: AnalysisForm, responsibleName: string, recordId?: string) {
    const payload = {
      periodicity: form.periodicity,
      year: form.year.trim(),
      period: form.period,
      responsibleEmployeeId: form.responsibleEmployeeId,
      responsibleName,
      analysisDate: form.analysisDate,
      incidentType: form.incidentType,
      indicators: generateIndicators(form.periodicity, form.incidentType),
    }

    if (recordId) {
      setRecords((current) => current.map((record) => record.id === recordId ? { ...record, ...payload } : record))
      toast.success("Analisis actualizado")
      return
    }

    setRecords((current) => [{ id: createId("analysis"), ...payload, createdAt: new Date().toISOString() }, ...current])
    toast.success("Analisis generado")
  }

  function handleSaveImprovement(recordId: string, form: ImprovementForm) {
    setRecords((current) =>
      current.map((record) =>
        record.id === recordId
          ? {
              ...record,
              improvementAction: {
                description: form.description.trim(),
                responsible: form.responsible.trim(),
                dueDate: form.dueDate,
              },
            }
          : record,
      ),
    )
    toast.success("Accion de mejora registrada")
  }

  function handleUpload(recordId: string, form: EvidenceForm) {
    setRecords((current) =>
      current.map((record) =>
        record.id === recordId
          ? {
              ...record,
              evidence: {
                id: createId("evidence"),
                fileName: form.fileName.trim(),
                description: form.description.trim(),
                uploadedAt: new Date().toISOString(),
                isConfirmed: form.isConfirmed,
              },
            }
          : record,
      ),
    )
    toast.success("Evidencia cargada")
  }

  function openCreate() {
    setEditingRecord(null)
    setDialogOpen(true)
  }

  function openEdit(record: AnalysisRecord) {
    setEditingRecord(record)
    setDialogOpen(true)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estadísticas y Análisis</h1>
          <p className="text-muted-foreground">Genera indicadores estadísticos por periodo y tipo de novedad laboral.</p>
        </div>
        <Button type="button" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo analisis
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center overflow-x-auto px-3 py-1">
          <div className="flex w-fit min-w-max items-center gap-2">
            <Metric label="Analisis" value={stats.total} />
            <Metric label="Con evidencia" value={stats.withEvidence} tone="green" />
            <Metric label="Con mejora" value={stats.withAction} tone="blue" />
            <Metric label="Anuales" value={stats.annual} tone="amber" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_280px]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Novedad, responsable o periodo" />
            </div>
          </Label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Tipo de novedad</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as IncidentType | "all")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="all">Todos</option>
              {incidentTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AnalyticsChartCard title="Consolidado de indicadores" description="Suma de indicadores generados por analisis.">
          <AnalyticsBarChart data={summaryChart} color="var(--chart-2)" />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Analisis por tipo de novedad" description="Distribución de analisis creados por tipo.">
          <AnalyticsDonutChart data={typeChart} />
        </AnalyticsChartCard>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Analisis registrados</h2>
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
            {filteredRecords.map((record) => (
              <Card key={record.id} className="border-border bg-card">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{incidentTypeLabel(record.incidentType)}</h3>
                        <Badge variant="outline" className="border-transparent bg-blue-600 text-white">{periodicityLabel(record.periodicity)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{periodLabel(record)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDetailRecord(record)}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(record.analysisDate)}</p>
                    <p className="flex items-center gap-2"><UserRound className="h-4 w-4" />{record.responsibleName}</p>
                    <p className="flex items-center gap-2"><Target className="h-4 w-4" />{record.improvementAction ? "Con accion" : "Sin accion"}</p>
                    <p className="flex items-center gap-2"><FileText className="h-4 w-4" />{record.evidence ? "Con evidencia" : "Sin evidencia"}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {record.indicators.slice(0, 3).map((indicator) => (
                      <div key={indicator.id} className="rounded-md bg-secondary p-3">
                        <p className="text-xs text-muted-foreground">{indicator.name}</p>
                        <p className="mt-1 text-lg font-bold text-foreground">{indicator.value} <span className="text-xs font-medium">{indicator.unit}</span></p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openEdit(record)}><Edit className="h-4 w-4" />Editar</Button>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setImprovementRecord(record)}><Target className="h-4 w-4" />Mejora</Button>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => downloadAnalysisPdf(record)}><Download className="h-4 w-4" />PDF</Button>
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
                  <th className="px-4 py-3 font-medium">Analisis</th>
                  <th className="px-4 py-3 font-medium">Periodo</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Indicadores</th>
                  <th className="px-4 py-3 font-medium">Evidencia</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{incidentTypeLabel(record.incidentType)}</p>
                      <p className="text-muted-foreground">Creado: {formatDate(record.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{periodicityLabel(record.periodicity)} · {periodLabel(record)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(record.analysisDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.responsibleName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.indicators.length} indicadores</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.evidence?.fileName ?? "Sin evidencia"}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => setDetailRecord(record)}><Eye className="h-4 w-4" />Ver detalle</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(record)}><Edit className="h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setImprovementRecord(record)}><Target className="h-4 w-4" />Accion de mejora</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => downloadAnalysisPdf(record)}><Download className="h-4 w-4" />Descargar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEvidenceRecord(record)}><Upload className="h-4 w-4" />Subir evidencia</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No hay analisis estadisticos para mostrar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AnalysisDialog
        open={dialogOpen}
        record={editingRecord}
        employees={employees}
        employeesLoading={employeesLoading}
        onClose={() => { setDialogOpen(false); setEditingRecord(null) }}
        onSave={handleSave}
      />
      <ImprovementDialog record={improvementRecord} onClose={() => setImprovementRecord(null)} onSave={handleSaveImprovement} />
      <EvidenceDialog record={evidenceRecord} onClose={() => setEvidenceRecord(null)} onUpload={handleUpload} />
      <DetailDialog record={detailRecord} onClose={() => setDetailRecord(null)} onDownload={downloadAnalysisPdf} />
    </main>
  )
}
