"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
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
  Recycle,
  Search,
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
type RecordKind = "DAILY_EVIDENCE" | "PROGRAM"
type WasteType = "ORDINARY" | "RECYCLABLE" | "HAZARDOUS" | "LIQUID" | "GASEOUS"
type ProgramProcedureType = "ORDINARY_WASTE" | "RECYCLING" | "HAZARDOUS_WASTE" | "LIQUID_WASTE" | "GASEOUS_WASTE"

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

type DailyEvidenceRecord = {
  id: string
  kind: "DAILY_EVIDENCE"
  recordName: string
  wasteType: WasteType
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

type WasteManagementRecord = DailyEvidenceRecord | ProgramRecord

type DailyEvidenceForm = {
  recordName: string
  wasteType: WasteType
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
  fileName: string
  description: string
  isConfirmed: boolean
}

const emptyDailyForm: DailyEvidenceForm = {
  recordName: "",
  wasteType: "ORDINARY",
  date: new Date().toISOString().slice(0, 10),
  responsibleEmployeeId: "",
  observations: "",
}

const emptyProgramForm: ProgramForm = {
  name: "",
  procedureType: "ORDINARY_WASTE",
  date: new Date().toISOString().slice(0, 10),
}

const emptyEvidenceForm: EvidenceForm = {
  fileName: "",
  description: "",
  isConfirmed: true,
}

const initialRecords: WasteManagementRecord[] = [
  {
    id: "waste-1",
    kind: "DAILY_EVIDENCE",
    recordName: "Verificación diaria de disposición de residuos",
    wasteType: "ORDINARY",
    date: "2026-09-10",
    responsibleEmployeeId: "mock-employee-1",
    responsibleName: "Responsable SG-SST",
    observations: "Puntos de recolección disponibles y residuos ordinarios dispuestos correctamente.",
    evidence: {
      id: "evidence-1",
      fileName: "registro-disposicion-residuos.pdf",
      description: "Soporte fotográfico de los puntos de disposición.",
      uploadedAt: "2026-09-10T13:30:00.000Z",
      isConfirmed: true,
    },
    createdAt: "2026-09-10T13:30:00.000Z",
  },
  {
    id: "waste-2",
    kind: "PROGRAM",
    name: "Programa de separación y disposición de residuos",
    procedureType: "RECYCLING",
    date: "2026-09-01",
    createdAt: "2026-09-01T09:00:00.000Z",
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

function kindLabel(kind: RecordKind) {
  return kind === "DAILY_EVIDENCE" ? "Evidencia diaria" : "Programa"
}

function wasteTypeLabel(value: WasteType) {
  if (value === "RECYCLABLE") return "Reciclable"
  if (value === "HAZARDOUS") return "Peligroso"
  if (value === "LIQUID") return "Líquido"
  if (value === "GASEOUS") return "Gaseoso"
  return "Ordinario"
}

function procedureTypeLabel(value: ProgramProcedureType) {
  if (value === "RECYCLING") return "Reciclaje"
  if (value === "HAZARDOUS_WASTE") return "Residuos peligrosos"
  if (value === "LIQUID_WASTE") return "Residuos líquidos"
  if (value === "GASEOUS_WASTE") return "Residuos gaseosos"
  return "Residuos ordinarios"
}

function recordTitle(record: WasteManagementRecord) {
  return record.kind === "PROGRAM" ? record.name : record.recordName
}

function recordDate(record: WasteManagementRecord) {
  return record.date
}

function recordResponsible(record: WasteManagementRecord) {
  return record.kind === "PROGRAM" ? "Programa institucional" : record.responsibleName
}

function recordCategory(record: WasteManagementRecord) {
  return record.kind === "PROGRAM" ? procedureTypeLabel(record.procedureType) : wasteTypeLabel(record.wasteType)
}

function kindClassName(kind: RecordKind) {
  return kind === "PROGRAM"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-blue-600 text-white border-transparent"
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

function downloadRecordPdf(record: WasteManagementRecord) {
  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const primaryColor: [number, number, number] = [31, 92, 77]

  doc.setFillColor(...primaryColor)
  doc.roundedRect(margin, 12, pageWidth - margin * 2, 24, 3, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("MANEJO DE RESIDUOS", margin + 5, 23)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`${kindLabel(record.kind)} · Fecha: ${formatDate(recordDate(record))}`, margin + 5, 30)

  const body =
    record.kind === "PROGRAM"
      ? [
          ["Nombre", record.name, "Tipo procedimiento", procedureTypeLabel(record.procedureType)],
          ["Fecha", formatDate(record.date), "Evidencia", record.evidence?.fileName ?? "Pendiente"],
        ]
      : [
          ["Nombre registro", record.recordName, "Tipo residuo", wasteTypeLabel(record.wasteType)],
          ["Fecha", formatDate(record.date), "Responsable", record.responsibleName],
          ["Evidencia", record.evidence?.fileName ?? "Pendiente", "Creado", formatDate(record.createdAt)],
        ]

  autoTable(doc, {
    startY: 44,
    theme: "grid",
    margin: { left: margin, right: margin },
    body,
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5, lineColor: [220, 226, 224], lineWidth: 0.1 },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 38 },
      2: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 40 },
    },
  })

  const y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 76) + 12
  doc.setTextColor(30, 41, 59)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text(record.kind === "PROGRAM" ? "Descripción del programa" : "Observaciones", margin, y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  const paragraph =
    record.kind === "PROGRAM"
      ? "Programa orientado a la separación, recolección, disposición y trazabilidad de residuos generados por la operación."
      : record.observations || "Sin observaciones."
  doc.text(doc.splitTextToSize(paragraph, pageWidth - margin * 2), margin, y + 7)

  const signatureY = 250
  doc.setDrawColor(120, 130, 140)
  doc.line(margin, signatureY, margin + 78, signatureY)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Responsable", margin, signatureY + 6)

  doc.setDrawColor(220, 226, 224)
  doc.line(margin, 280, pageWidth - margin, 280)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text("Documento generado desde SafeCloud - Sistema de Gestión Integral", margin, 286)

  doc.save(`manejo-residuos-${recordTitle(record).replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`)
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
  onSave: (form: DailyEvidenceForm, responsibleName: string, recordId?: string) => void
}) {
  const [form, setForm] = useState<DailyEvidenceForm>(emptyDailyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(record ? {
      recordName: record.recordName,
      wasteType: record.wasteType,
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
    if (!form.date) return toast.error("Selecciona la fecha")
    if (!form.responsibleEmployeeId) return toast.error("Selecciona el responsable")

    const responsibleName = findEmployeeName(employees, form.responsibleEmployeeId) || record?.responsibleName || "Responsable seleccionado"

    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 250))
    onSave(form, responsibleName, record?.id)
    setSaving(false)
    setForm(emptyDailyForm)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{record ? "Editar evidencia de residuos" : "Nueva evidencia de residuos"}</DialogTitle>
          <p className="text-sm text-muted-foreground">Registra la verificación diaria o constante del manejo de residuos.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos del registro</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  Nombre del registro
                  <Input value={form.recordName} onChange={(event) => update("recordName", event.target.value)} placeholder="Verificación de residuos ordinarios" />
                </Label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Tipo de residuo</span>
                  <select value={form.wasteType} onChange={(event) => update("wasteType", event.target.value as WasteType)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="ORDINARY">Ordinario</option>
                    <option value="RECYCLABLE">Reciclable</option>
                    <option value="HAZARDOUS">Peligroso</option>
                    <option value="LIQUID">Líquido</option>
                    <option value="GASEOUS">Gaseoso</option>
                  </select>
                </label>
                <Label className="grid gap-2">
                  Fecha
                  <Input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
                </Label>
                <div className="md:col-span-2">
                  <EmployeePicker employees={employees} loading={employeesLoading} value={form.responsibleEmployeeId} onChange={(employeeId) => update("responsibleEmployeeId", employeeId)} />
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
  onSave: (form: ProgramForm, recordId?: string) => void
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
          <p className="text-sm text-muted-foreground">Relaciona el programa o procedimiento de manejo de residuos.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2 md:col-span-2">
              Nombre
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Programa de manejo integral de residuos" />
            </Label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Relacionar tipo de procedimiento</span>
              <select value={form.procedureType} onChange={(event) => setForm((current) => ({ ...current, procedureType: event.target.value as ProgramProcedureType }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="ORDINARY_WASTE">Residuos ordinarios</option>
                <option value="RECYCLING">Reciclaje</option>
                <option value="HAZARDOUS_WASTE">Residuos peligrosos</option>
                <option value="LIQUID_WASTE">Residuos líquidos</option>
                <option value="GASEOUS_WASTE">Residuos gaseosos</option>
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
  record: WasteManagementRecord | null
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
          <p className="text-sm text-muted-foreground">Adjunta soporte fotográfico, fílmico, formato diligenciado o documento del programa.</p>
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
            <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} placeholder="Ej: Fotografías de separación y disposición final." />
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
  record: WasteManagementRecord | null
  onClose: () => void
  onDownload: (record: WasteManagementRecord) => void
}) {
  if (!record) return null

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{recordTitle(record)}</DialogTitle>
          <p className="text-sm text-muted-foreground">Consulta el detalle del soporte de manejo de residuos.</p>
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

export default function WasteManagementPage() {
  const [records, setRecords] = useState<WasteManagementRecord[]>(initialRecords)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState<RecordKind | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [dailyDialogOpen, setDailyDialogOpen] = useState(false)
  const [programDialogOpen, setProgramDialogOpen] = useState(false)
  const [editingDaily, setEditingDaily] = useState<DailyEvidenceRecord | null>(null)
  const [editingProgram, setEditingProgram] = useState<ProgramRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<WasteManagementRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<WasteManagementRecord | null>(null)

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

  function handleSaveDaily(form: DailyEvidenceForm, responsibleName: string, recordId?: string) {
    const payload = {
      recordName: form.recordName.trim(),
      wasteType: form.wasteType,
      date: form.date,
      responsibleEmployeeId: form.responsibleEmployeeId,
      responsibleName,
      observations: form.observations.trim(),
    }

    if (recordId) {
      setRecords((current) => current.map((record) => record.id === recordId ? { ...record, ...payload } as WasteManagementRecord : record))
      toast.success("Evidencia diaria actualizada")
      return
    }

    setRecords((current) => [{ id: createId("waste"), kind: "DAILY_EVIDENCE", ...payload, createdAt: new Date().toISOString() }, ...current])
    toast.success("Evidencia diaria creada")
  }

  function handleSaveProgram(form: ProgramForm, recordId?: string) {
    const payload = {
      name: form.name.trim(),
      procedureType: form.procedureType,
      date: form.date,
    }

    if (recordId) {
      setRecords((current) => current.map((record) => record.id === recordId ? { ...record, ...payload } as WasteManagementRecord : record))
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

  function openEdit(record: WasteManagementRecord) {
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
          <h1 className="text-2xl font-bold text-foreground">Manejo de Residuos</h1>
          <p className="text-muted-foreground">Controla evidencias diarias, programas y soportes del manejo de residuos.</p>
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

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center overflow-x-auto px-3 py-1">
          <div className="flex w-fit min-w-max items-center gap-2">
            <Metric label="Registros" value={stats.total} />
            <Metric label="Evidencias" value={stats.daily} tone="blue" />
            <Metric label="Programas" value={stats.programs} tone="green" />
            <Metric label="Con soporte" value={stats.withEvidence} tone="amber" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_240px]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Registro, programa, responsable o tipo" />
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
            <h2 className="text-lg font-semibold text-foreground">Registros de manejo de residuos</h2>
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
                        <h3 className="font-semibold text-foreground">{recordTitle(record)}</h3>
                        <Badge variant="outline" className={kindClassName(record.kind)}>{kindLabel(record.kind)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{recordCategory(record)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDetailRecord(record)}>
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
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => downloadRecordPdf(record)}><Download className="h-4 w-4" />PDF</Button>
                    <Button type="button" size="sm" className="gap-2" onClick={() => setEvidenceRecord(record)}><Upload className="h-4 w-4" />Evidencia</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                    <td className="px-4 py-3 text-muted-foreground">{record.evidence?.fileName ?? "Sin evidencia"}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
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
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No hay registros de manejo de residuos para mostrar.</td>
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
      <DetailDialog record={detailRecord} onClose={() => setDetailRecord(null)} onDownload={downloadRecordPdf} />
    </main>
  )
}
