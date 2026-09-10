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
import { listEmployees } from "@/services/employeeService"
import type { Employee } from "@/types/manager/employee"

type ViewMode = "cards" | "list"
type ActivityType = "CAMPAIGN" | "TALK" | "DAY" | "ACTIVITY"
type ActivityStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED"

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

type HealthyLifestyleRecord = {
  id: string
  name: string
  type: ActivityType
  startDate: string
  endDate: string
  responsibleEmployeeId: string
  responsibleName: string
  objective: string
  scope: string
  status: ActivityStatus
  evidence?: Evidence
  createdAt: string
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

const initialRecords: HealthyLifestyleRecord[] = [
  {
    id: "healthy-1",
    name: "Campaña de prevención de alcoholismo y tabaquismo",
    type: "CAMPAIGN",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    responsibleEmployeeId: "mock-employee-1",
    responsibleName: "Responsable SG-SST",
    objective:
      "Promover hábitos saludables y prevenir el consumo de alcohol, tabaco y sustancias psicoactivas en el entorno laboral.",
    scope: "Todos los trabajadores directos, contratistas y personal operativo.",
    status: "IN_PROGRESS",
    evidence: {
      id: "evidence-1",
      fileName: "programa-estilos-vida-saludable-2026.pdf",
      description: "Programa anual y cronograma de campañas.",
      uploadedAt: "2026-09-02T09:00:00.000Z",
      isConfirmed: true,
    },
    createdAt: "2026-08-28T10:00:00.000Z",
  },
  {
    id: "healthy-2",
    name: "Jornada de pausas activas y ergonomía",
    type: "DAY",
    startDate: "2026-10-12",
    endDate: "2026-10-12",
    responsibleEmployeeId: "mock-employee-2",
    responsibleName: "Talento Humano",
    objective: "Fomentar pausas activas y prácticas ergonómicas durante la jornada laboral.",
    scope: "Áreas administrativas y comerciales.",
    status: "PLANNED",
    createdAt: "2026-09-05T14:20:00.000Z",
  },
]

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

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
  if (status === "COMPLETED") return "Ejecutada"
  if (status === "IN_PROGRESS") return "En ejecución"
  return "Planeada"
}

function statusClassName(status: ActivityStatus) {
  if (status === "COMPLETED") return "bg-accentActivd text-accentActivd-foreground border-transparent"
  if (status === "IN_PROGRESS") return "bg-blue-600 text-white border-transparent"
  return "bg-warning/10 text-warning border-warning/20"
}

function inferStatus(startDate: string, endDate: string): ActivityStatus {
  const today = new Date().toISOString().slice(0, 10)
  if (endDate < today) return "COMPLETED"
  if (startDate <= today && endDate >= today) return "IN_PROGRESS"
  return "PLANNED"
}

function downloadProgramPdf(record: HealthyLifestyleRecord) {
  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const primaryColor: [number, number, number] = [31, 92, 77]

  doc.setFillColor(...primaryColor)
  doc.roundedRect(margin, 12, pageWidth - margin * 2, 24, 3, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("PROGRAMA DE ESTILOS DE VIDA SALUDABLE", margin + 5, 23)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`${activityTypeLabel(record.type)} · ${formatDate(record.startDate)} a ${formatDate(record.endDate)}`, margin + 5, 30)

  autoTable(doc, {
    startY: 44,
    theme: "grid",
    margin: { left: margin, right: margin },
    body: [
      ["Nombre actividad", record.name, "Tipo", activityTypeLabel(record.type)],
      ["Responsable", record.responsibleName, "Estado", statusLabel(record.status)],
      ["Fecha inicio", formatDate(record.startDate), "Fecha fin", formatDate(record.endDate)],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5, lineColor: [220, 226, 224], lineWidth: 0.1 },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 34 },
      2: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 28 },
    },
  })

  const contentY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 74) + 10
  doc.setTextColor(30, 41, 59)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Objetivo", margin, contentY)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(doc.splitTextToSize(record.objective, pageWidth - margin * 2), margin, contentY + 7)

  const scopeY = contentY + 28
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Alcance", margin, scopeY)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(doc.splitTextToSize(record.scope, pageWidth - margin * 2), margin, scopeY + 7)

  autoTable(doc, {
    startY: scopeY + 30,
    theme: "grid",
    margin: { left: margin, right: margin },
    head: [["Componente", "Descripción"]],
    body: [
      ["Promoción", "Actividades orientadas a hábitos saludables dentro y fuera del entorno laboral."],
      ["Prevención", "Campañas específicas para prevenir farmacodependencia, alcoholismo y tabaquismo."],
      ["Evidencia", record.evidence?.fileName ?? "Pendiente por cargar"],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5, lineColor: [220, 226, 224], lineWidth: 0.1 },
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: "bold" },
    },
  })

  const signatureY = 250
  doc.setDrawColor(120, 130, 140)
  doc.line(margin, signatureY, margin + 78, signatureY)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Responsable de la actividad", margin, signatureY + 6)

  doc.setDrawColor(220, 226, 224)
  doc.line(margin, 280, pageWidth - margin, 280)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text("Documento generado desde SafeCloud - Sistema de Gestión Integral", margin, 286)

  doc.save(`estilos-vida-saludable-${record.name.replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`)
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
    <div className="rounded-md bg-secondary px-3 py-1.5">
      <span className={`text-sm font-bold ${toneClass}`}>{value}</span>
      <span className="ml-2 text-xs text-muted-foreground">{label}</span>
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
  onSave: (form: HealthyLifestyleForm, responsibleName: string, recordId?: string) => void
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
    await new Promise((resolve) => setTimeout(resolve, 250))
    onSave(form, responsibleName, record?.id)
    setSaving(false)
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
                  <Input type="date" value={form.startDate} onChange={(event) => update("startDate", event.target.value)} />
                </Label>
                <Label className="grid gap-2">
                  Fecha fin
                  <Input type="date" value={form.endDate} onChange={(event) => update("endDate", event.target.value)} />
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
  onClose,
  onUpload,
}: {
  record: HealthyLifestyleRecord | null
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
                onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.files?.[0]?.name ?? "" }))}
              />
            </Label>
            <Input
              className="mt-3"
              value={form.fileName}
              onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.value }))}
              placeholder="También puedes escribir el nombre del archivo mock"
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
  onDownload,
}: {
  record: HealthyLifestyleRecord | null
  onClose: () => void
  onDownload: (record: HealthyLifestyleRecord) => void
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

export default function HealthyLifestylesPage() {
  const [records, setRecords] = useState<HealthyLifestyleRecord[]>(initialRecords)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<ActivityType | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<HealthyLifestyleRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<HealthyLifestyleRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<HealthyLifestyleRecord | null>(null)

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

  function handleSave(form: HealthyLifestyleForm, responsibleName: string, recordId?: string) {
    const payload = {
      name: form.name.trim(),
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      responsibleEmployeeId: form.responsibleEmployeeId,
      responsibleName,
      objective: form.objective.trim(),
      scope: form.scope.trim(),
      status: inferStatus(form.startDate, form.endDate),
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
      toast.success("Actividad saludable actualizada")
      return
    }

    setRecords((current) => [
      {
        id: createId("healthy"),
        ...payload,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    toast.success("Actividad saludable creada")
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

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center overflow-x-auto px-3 py-1">
          <div className="flex w-fit min-w-max items-center gap-2">
            <Metric label="Actividades" value={stats.total} />
            <Metric label="Planeadas" value={stats.planned} tone="amber" />
            <Metric label="En ejecución" value={stats.inProgress} tone="blue" />
            <Metric label="Ejecutadas" value={stats.completed} tone="green" />
            <Metric label="Con evidencia" value={stats.withEvidence} tone="green" />
          </div>
        </div>

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
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{activityTypeLabel(record.type)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDetailRecord(record)}>
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
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => downloadProgramPdf(record)}>
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
                    <td className="px-4 py-3 text-muted-foreground">{record.evidence?.fileName ?? "Sin evidencia"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusClassName(record.status)}>
                        {statusLabel(record.status)}
                      </Badge>
                    </td>
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
                          <DropdownMenuItem onSelect={() => openEdit(record)}>
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => downloadProgramPdf(record)}>
                            <Download className="h-4 w-4" />
                            Descargar programa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEvidenceRecord(record)}>
                            <Upload className="h-4 w-4" />
                            Subir evidencia
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
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
      <EvidenceDialog record={evidenceRecord} onClose={() => setEvidenceRecord(null)} onUpload={handleUpload} />
      <DetailDialog record={detailRecord} onClose={() => setDetailRecord(null)} onDownload={downloadProgramPdf} />
    </main>
  )
}
