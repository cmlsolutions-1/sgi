"use client"

import { type FormEvent, useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
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
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
type WorkPlanStatus = "PENDING_APPROVAL" | "APPROVED"

type MockEmployee = {
  id: string
  name: string
  lastName: string
  job: string
}

type WorkPlanEvidence = {
  fileName: string
  uploadedAt: string
  uploadedBy: string
}

type WorkPlanItem = {
  id: string
  consecutive: string
  year: number
  activity: string
  objective: string
  budget: number
  responsibleId: string
  evidence: string
  status: WorkPlanStatus
  approvedBy?: string
  approvedAt?: string
  signedEvidence?: WorkPlanEvidence
  createdAt: string
}

type WorkPlanForm = {
  year: string
  activity: string
  objective: string
  budget: string
  responsibleId: string
  evidence: string
}

const employees: MockEmployee[] = [
  { id: "emp-1", name: "Laura", lastName: "Martinez", job: "Coordinadora SST" },
  { id: "emp-2", name: "Andres", lastName: "Rojas", job: "Supervisor operativo" },
  { id: "emp-3", name: "Camila", lastName: "Gomez", job: "Analista de talento humano" },
  { id: "emp-4", name: "Julian", lastName: "Perez", job: "Jefe de mantenimiento" },
]

const currentYear = new Date().getFullYear()

const emptyForm: WorkPlanForm = {
  year: String(currentYear),
  activity: "",
  objective: "",
  budget: "",
  responsibleId: "",
  evidence: "",
}

const initialWorkPlanItems: WorkPlanItem[] = [
  {
    id: "wp-1",
    consecutive: "PT-2026-001",
    year: 2026,
    activity: "Actualizar matriz legal SG-SST",
    objective: "Mantener alineados los requisitos legales aplicables al sistema de gestion.",
    budget: 450000,
    responsibleId: "emp-1",
    evidence: "Matriz legal actualizada y acta de revision.",
    status: "APPROVED",
    approvedBy: "Ricardo Salazar",
    approvedAt: "2026-01-18T10:30:00",
    signedEvidence: {
      fileName: "plan-trabajo-aprobado-enero.pdf",
      uploadedAt: "2026-01-18T11:05:00",
      uploadedBy: "Laura Martinez",
    },
    createdAt: "2026-01-10T08:00:00",
  },
  {
    id: "wp-2",
    consecutive: "PT-2026-002",
    year: 2026,
    activity: "Inspeccion locativa trimestral",
    objective: "Identificar condiciones inseguras y establecer acciones de mejora.",
    budget: 850000,
    responsibleId: "emp-2",
    evidence: "Informe de inspeccion con registro fotografico.",
    status: "PENDING_APPROVAL",
    createdAt: "2026-07-12T09:10:00",
  },
  {
    id: "wp-3",
    consecutive: "PT-2026-003",
    year: 2026,
    activity: "Campana de orden y aseo",
    objective: "Fortalecer habitos preventivos en areas operativas.",
    budget: 620000,
    responsibleId: "emp-3",
    evidence: "Listado de asistencia, piezas divulgativas y registro fotografico.",
    status: "PENDING_APPROVAL",
    createdAt: "2026-07-20T14:35:00",
  },
]

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function nowIso() {
  return new Date().toISOString()
}

function employeeName(employeeId?: string) {
  const employee = employees.find((item) => item.id === employeeId)
  if (!employee) return "No asignado"
  return `${employee.name} ${employee.lastName}`
}

function employeeJob(employeeId?: string) {
  return employees.find((item) => item.id === employeeId)?.job ?? "Cargo no registrado"
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

function normalizeNumberInput(value: string) {
  return value.replace(/\D/g, "")
}

function formatBudgetInput(value: string) {
  const digits = normalizeNumberInput(value)
  if (!digits) return ""

  return new Intl.NumberFormat("es-CO").format(Number(digits))
}

function parseBudget(value: string) {
  const digits = normalizeNumberInput(value)
  return digits ? Number(digits) : 0
}

function statusLabel(status: WorkPlanStatus) {
  return status === "APPROVED" ? "Aprobado" : "Pendiente de aprobacion"
}

function statusClassName(status: WorkPlanStatus) {
  return status === "APPROVED"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-warning/10 text-warning border-warning/20"
}

function getPdfPageCount(doc: jsPDF) {
  return (
    (doc as unknown as { getNumberOfPages?: () => number }).getNumberOfPages?.() ??
    Math.max(1, ((doc.internal as unknown as { pages?: unknown[] }).pages?.length ?? 2) - 1)
  )
}

function WorkPlanDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (form: WorkPlanForm) => void
}) {
  const [form, setForm] = useState<WorkPlanForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const year = Number(form.year)
    const budget = parseBudget(form.budget)

    if (!form.activity.trim()) return toast.error("Ingresa la actividad")
    if (!form.objective.trim()) return toast.error("Ingresa el objetivo")
    if (!form.responsibleId) return toast.error("Selecciona el responsable")
    if (!form.evidence.trim()) return toast.error("Ingresa la evidencia esperada")
    if (!Number.isInteger(year) || year < currentYear) {
      return toast.error(`El año debe ser ${currentYear} o posterior`)
    }
    if (!form.budget || budget < 0) return toast.error("Ingresa un presupuesto valido")

    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 250))
    onSave(form)
    setForm(emptyForm)
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Nueva actividad del plan de trabajo</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Las actividades quedan pendientes hasta cargar el plan firmado por el jefe.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos de la actividad</h3>
              <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
                <Label className="grid gap-2">
                  Año
                  <Input
                    type="number"
                    min={currentYear}
                    value={form.year}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        year: normalizeNumberInput(event.target.value).slice(0, 4),
                      }))
                    }
                    onBlur={() => {
                      if (form.year && Number(form.year) < currentYear) {
                        setForm((current) => ({ ...current, year: String(currentYear) }))
                        toast.error(`El año debe ser ${currentYear} o posterior`)
                      }
                    }}
                  />
                </Label>
                <Label className="grid gap-2">
                  Actividad
                  <Input
                    value={form.activity}
                    onChange={(event) => setForm((current) => ({ ...current, activity: event.target.value }))}
                    placeholder="Ej. Inspeccion de seguridad"
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Label className="grid gap-2">
                  Objetivo
                  <Textarea
                    value={form.objective}
                    onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))}
                    rows={4}
                    placeholder="Describe el objetivo de la actividad."
                  />
                </Label>
                <Label className="grid gap-2">
                  Evidencia esperada
                  <Textarea
                    value={form.evidence}
                    onChange={(event) => setForm((current) => ({ ...current, evidence: event.target.value }))}
                    rows={4}
                    placeholder="Documento, registro fotografico, acta o soporte esperado."
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Responsable y presupuesto</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-foreground">Responsable</span>
                  <select
                    value={form.responsibleId}
                    onChange={(event) => setForm((current) => ({ ...current, responsibleId: event.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona responsable</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employeeName(employee.id)} - {employee.job}
                      </option>
                    ))}
                  </select>
                </label>
                <Label className="grid gap-2">
                  Presupuesto
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatBudgetInput(form.budget)}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, budget: normalizeNumberInput(event.target.value) }))
                      }
                      placeholder="$0"
                      className="pl-8"
                    />
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                  </div>
                </Label>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear actividad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ApprovalDialog({
  open,
  selectedItems,
  onClose,
  onApprove,
}: {
  open: boolean
  selectedItems: WorkPlanItem[]
  onClose: () => void
  onApprove: (bossName: string, evidenceFileName: string) => void
}) {
  const [bossName, setBossName] = useState("")
  const [fileName, setFileName] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedItems.length === 0) return toast.error("Selecciona al menos una actividad pendiente")
    if (!bossName.trim()) return toast.error("Ingresa el nombre del jefe")
    if (!fileName.trim()) return toast.error("Sube o registra el documento firmado")

    onApprove(bossName.trim(), fileName.trim())
    setBossName("")
    setFileName("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cargar plan firmado</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Al subir la evidencia firmada, las actividades seleccionadas quedan aprobadas.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md bg-secondary p-3 text-sm text-muted-foreground">
            {selectedItems.length} actividad(es) seleccionada(s) para aprobacion.
          </div>

          <Label className="grid gap-2">
            Nombre jefe
            <Input
              value={bossName}
              onChange={(event) => setBossName(event.target.value)}
              placeholder="Nombre de quien aprueba"
            />
          </Label>

          <div className="rounded-md border border-dashed border-border bg-secondary p-4">
            <Label className="grid gap-2">
              Evidencia firmada
              <Input
                type="file"
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
              />
            </Label>
            <Input
              className="mt-3"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder="Tambien puedes escribir el nombre del archivo mock"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <FileCheck2 className="h-4 w-4" />
              Aprobar seleccionados
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DetailDialog({
  item,
  onClose,
}: {
  item: WorkPlanItem | null
  onClose: () => void
}) {
  if (!item) return null

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalle {item.consecutive}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <InfoBlock label="Actividad" value={item.activity} />
            <InfoBlock label="Responsable" value={`${employeeName(item.responsibleId)} - ${employeeJob(item.responsibleId)}`} />
            <InfoBlock label="Presupuesto" value={formatCurrency(item.budget)} />
            <InfoBlock label="Estado" value={statusLabel(item.status)} />
          </div>
          <InfoBlock label="Objetivo" value={item.objective} />
          <InfoBlock label="Evidencia esperada" value={item.evidence} />
          <div className="grid gap-3 md:grid-cols-2">
            <InfoBlock label="Aprobado por" value={item.approvedBy ?? "Pendiente"} />
            <InfoBlock label="Fecha aprobacion" value={formatDateTime(item.approvedAt)} />
          </div>
          {item.signedEvidence && (
            <div className="rounded-md border border-border p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Documento firmado</h3>
              <p className="text-sm font-medium text-foreground">{item.signedEvidence.fileName}</p>
              <p className="text-xs text-muted-foreground">
                Cargado: {formatDateTime(item.signedEvidence.uploadedAt)} por {item.signedEvidence.uploadedBy}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
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

export default function WorkPlanPage() {
  const [items, setItems] = useState<WorkPlanItem[]>(initialWorkPlanItems)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [yearFilter, setYearFilter] = useState(String(currentYear))
  const [statusFilter, setStatusFilter] = useState<WorkPlanStatus | "all">("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<WorkPlanItem | null>(null)

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.consecutive.toLowerCase().includes(query) ||
        item.activity.toLowerCase().includes(query) ||
        item.objective.toLowerCase().includes(query) ||
        employeeName(item.responsibleId).toLowerCase().includes(query)
      const matchesYear = yearFilter === "all" || String(item.year) === yearFilter
      const matchesStatus = statusFilter === "all" || item.status === statusFilter

      return matchesSearch && matchesYear && matchesStatus
    })
  }, [items, search, statusFilter, yearFilter])

  const pendingItems = useMemo(() => items.filter((item) => item.status === "PENDING_APPROVAL"), [items])
  const selectedPendingItems = useMemo(
    () => pendingItems.filter((item) => selectedIds.includes(item.id)),
    [pendingItems, selectedIds],
  )
  const filteredPendingIds = filteredItems
    .filter((item) => item.status === "PENDING_APPROVAL")
    .map((item) => item.id)
  const allFilteredPendingSelected =
    filteredPendingIds.length > 0 && filteredPendingIds.every((id) => selectedIds.includes(id))

  const stats = useMemo(() => {
    const approved = items.filter((item) => item.status === "APPROVED")
    return {
      total: items.length,
      pending: items.length - approved.length,
      approved: approved.length,
      budget: items.reduce((total, item) => total + item.budget, 0),
    }
  }, [items])

  function toggleSelected(itemId: string) {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    )
  }

  function toggleAllFilteredPending() {
    setSelectedIds((current) => {
      if (allFilteredPendingSelected) {
        return current.filter((id) => !filteredPendingIds.includes(id))
      }

      return Array.from(new Set([...current, ...filteredPendingIds]))
    })
  }

  function createItem(form: WorkPlanForm) {
    const year = Number(form.year) || currentYear
    const nextNumber = items.length + 1
    const item: WorkPlanItem = {
      id: createId("work-plan"),
      consecutive: `PT-${year}-${String(nextNumber).padStart(3, "0")}`,
      year,
      activity: form.activity.trim(),
      objective: form.objective.trim(),
      budget: parseBudget(form.budget),
      responsibleId: form.responsibleId,
      evidence: form.evidence.trim(),
      status: "PENDING_APPROVAL",
      createdAt: nowIso(),
    }

    setItems((current) => [item, ...current])
    setSelectedIds((current) => [...current, item.id])
    toast.success("Actividad creada y pendiente de aprobacion")
  }

  function generatePdf(itemsToApprove: WorkPlanItem[]) {
    if (itemsToApprove.length === 0) {
      toast.error("Selecciona al menos una actividad pendiente")
      return
    }

    const year = yearFilter === "all" ? currentYear : Number(yearFilter)
    const doc = new jsPDF("p", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14
    const contentWidth = pageWidth - margin * 2
    const primaryColor: [number, number, number] = [31, 92, 77]
    const softColor: [number, number, number] = [235, 244, 241]
    let y = 16

    function ensureSpace(requiredHeight: number) {
      if (y + requiredHeight <= pageHeight - 22) return
      doc.addPage()
      y = 18
    }

    function sectionTitle(title: string) {
      ensureSpace(12)
      doc.setFillColor(...softColor)
      doc.setDrawColor(210, 226, 220)
      doc.roundedRect(margin, y, contentWidth, 9, 2, 2, "FD")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(...primaryColor)
      doc.text(title.toUpperCase(), margin + 3, y + 6)
      y += 14
    }

    function addParagraph(text: string) {
      const lines = doc.splitTextToSize(text, contentWidth)
      ensureSpace(lines.length * 5 + 2)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(30, 41, 59)
      doc.text(lines, margin, y)
      y += lines.length * 5 + 3
    }

    function addFooter() {
      const pageCount = getPdfPageCount(doc)
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        doc.setPage(pageNumber)
        doc.setDrawColor(220, 226, 224)
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text("Documento generado desde el Sistema de Gestion SG-SST", margin, pageHeight - 8)
        doc.text(`Pagina ${pageNumber} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" })
      }
    }

    doc.setFillColor(...primaryColor)
    doc.roundedRect(margin, y, contentWidth, 25, 3, 3, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(15)
    doc.text("PLAN ANUAL DE TRABAJO SG-SST", margin + 5, y + 9)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(`Vigencia: ${year}`, margin + 5, y + 16)
    doc.text(`Fecha de generacion: ${formatDate(new Date().toISOString())}`, pageWidth - margin - 5, y + 16, {
      align: "right",
    })
    y += 33

    sectionTitle("Alcance del documento")
    addParagraph(
      "Este documento consolida las actividades pendientes de aprobacion por parte del jefe. Una vez firmado, el archivo debe cargarse como evidencia para marcar las actividades seleccionadas como aprobadas.",
    )

    sectionTitle("Actividades seleccionadas")
    autoTable(doc, {
      startY: y,
      theme: "grid",
      margin: { left: margin, right: margin },
      head: [["No.", "Actividad", "Objetivo", "Responsable", "Presupuesto", "Evidencia"]],
      body: itemsToApprove.map((item, index) => [
        index + 1,
        item.activity,
        item.objective,
        employeeName(item.responsibleId),
        formatCurrency(item.budget),
        item.evidence,
      ]),
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: 2.2,
        lineColor: [220, 226, 224],
        lineWidth: 0.1,
        textColor: [30, 41, 59],
      },
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 32 },
        2: { cellWidth: 48 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: contentWidth - 145 },
      },
    })
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 12

    sectionTitle("Revision y aprobacion")
    addParagraph("Nombre jefe:")
    ensureSpace(34)
    doc.setDrawColor(120, 130, 140)
    doc.line(margin, y + 18, margin + 78, y + 18)
    doc.line(pageWidth - margin - 78, y + 18, pageWidth - margin, y + 18)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(30, 41, 59)
    doc.text("Nombre y firma del jefe", margin, y + 24)
    doc.text("Fecha de aprobacion", pageWidth - margin - 78, y + 24)

    addFooter()
    doc.save(`Plan_Trabajo_${year}_Pendiente_Aprobacion.pdf`)
    toast.success("Documento generado para firma del jefe")
  }

  function approveSelected(bossName: string, evidenceFileName: string) {
    const approvedAt = nowIso()
    const selectedSet = new Set(selectedPendingItems.map((item) => item.id))

    setItems((current) =>
      current.map((item) =>
        selectedSet.has(item.id)
          ? {
              ...item,
              status: "APPROVED",
              approvedBy: bossName,
              approvedAt,
              signedEvidence: {
                fileName: evidenceFileName,
                uploadedAt: approvedAt,
                uploadedBy: bossName,
              },
            }
          : item,
      ),
    )
    setSelectedIds((current) => current.filter((id) => !selectedSet.has(id)))
    toast.success("Actividades aprobadas con evidencia firmada")
  }

  function downloadEvidence(item: WorkPlanItem) {
    if (!item.signedEvidence) {
      toast.error("Esta actividad aun no tiene evidencia firmada")
      return
    }

    const blob = new Blob(
      [
        `Evidencia firmada mock\nActividad: ${item.activity}\nArchivo: ${item.signedEvidence.fileName}\nAprobado por: ${item.approvedBy}\nFecha: ${formatDateTime(item.approvedAt)}\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = item.signedEvidence.fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plan de Trabajo</h1>
          <p className="text-muted-foreground">
            Construye el plan anual, genera el PDF para firma y controla la aprobacion por actividad.
          </p>
        </div>
        <Button type="button" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva actividad
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center overflow-x-auto px-3 py-1">
          <div className="flex w-fit min-w-max items-center gap-2">
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-foreground">{stats.total}</span>
              <span className="ml-2 text-xs text-muted-foreground">Actividades</span>
            </div>
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-amber-700">{stats.pending}</span>
              <span className="ml-2 text-xs text-muted-foreground">Pendientes</span>
            </div>
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-emerald-700">{stats.approved}</span>
              <span className="ml-2 text-xs text-muted-foreground">Aprobadas</span>
            </div>
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-foreground">{formatCurrency(stats.budget)}</span>
              <span className="ml-2 text-xs text-muted-foreground">Presupuesto</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_150px_220px]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Actividad, objetivo, responsable o consecutivo"
              />
            </div>
          </Label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Año</span>
            <select
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Estado</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as WorkPlanStatus | "all")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="PENDING_APPROVAL">Pendiente de aprobacion</option>
              <option value="APPROVED">Aprobado</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Revision y aprobacion</h2>
            <p className="text-sm text-muted-foreground">
              Selecciona actividades pendientes, genera el PDF, firma el documento y sube la evidencia.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => generatePdf(selectedPendingItems)}
              disabled={selectedPendingItems.length === 0}
            >
              <Download className="h-4 w-4" />
              Generar documento
            </Button>
            <Button
              type="button"
              className="gap-2"
              onClick={() => setApprovalOpen(true)}
              disabled={selectedPendingItems.length === 0}
            >
              <Upload className="h-4 w-4" />
              Subir firmado
            </Button>
          </div>
        </div>
        <div className="mt-3 rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">
          {selectedPendingItems.length} actividad(es) pendiente(s) seleccionada(s). Las ya aprobadas no se incluyen en nuevos PDF.
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lista del plan de trabajo</h2>
            <p className="text-sm text-muted-foreground">{filteredItems.length} registros encontrados</p>
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

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay actividades que coincidan con los filtros actuales.
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredItems.map((item) => (
              <Card key={item.id} className="border-border bg-card">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.status === "PENDING_APPROVAL" && (
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={() => toggleSelected(item.id)}
                            aria-label={`Seleccionar ${item.consecutive}`}
                          />
                        )}
                        <h3 className="font-semibold text-foreground">{item.activity}</h3>
                        <Badge variant="outline" className={statusClassName(item.status)}>
                          {statusLabel(item.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.consecutive}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDetailItem(item)}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.objective}</p>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      {employeeName(item.responsibleId)}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {item.year}
                    </p>
                    <p className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {formatCurrency(item.budget)}
                    </p>
                    <p className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4" />
                      {item.signedEvidence?.fileName ?? "Sin firma cargada"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[1280px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="w-12 px-4 py-3 font-medium">
                    <Checkbox
                      checked={allFilteredPendingSelected}
                      onCheckedChange={toggleAllFilteredPending}
                      aria-label="Seleccionar pendientes visibles"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Actividad</th>
                  <th className="px-4 py-3 font-medium">Objetivo</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Presupuesto</th>
                  <th className="px-4 py-3 font-medium">Evidencia</th>
                  <th className="px-4 py-3 font-medium">Aprobacion</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => {
                  const isPending = item.status === "PENDING_APPROVAL"

                  return (
                    <tr key={item.id} className="align-middle">
                      <td className="px-4 py-3">
                        {isPending ? (
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={() => toggleSelected(item.id)}
                            aria-label={`Seleccionar ${item.consecutive}`}
                          />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[240px] truncate font-medium text-foreground">{item.activity}</p>
                        <p className="text-muted-foreground">{item.consecutive}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[300px] truncate text-muted-foreground">{item.objective}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[190px] truncate font-medium text-foreground">{employeeName(item.responsibleId)}</p>
                        <p className="max-w-[190px] truncate text-muted-foreground">{employeeJob(item.responsibleId)}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatCurrency(item.budget)}</td>
                      <td className="px-4 py-3">
                        <p className="max-w-[220px] truncate text-muted-foreground">{item.evidence}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[180px] truncate text-muted-foreground">{item.approvedBy ?? "Pendiente"}</p>
                        <p className="text-muted-foreground">{formatDate(item.approvedAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusClassName(item.status)}>
                          {statusLabel(item.status)}
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
                            <DropdownMenuItem onSelect={() => setDetailItem(item)}>
                              <Eye className="h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            {isPending && (
                              <>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setSelectedIds([item.id])
                                    generatePdf([item])
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                  Generar documento
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setSelectedIds([item.id])
                                    setApprovalOpen(true)
                                  }}
                                >
                                  <Upload className="h-4 w-4" />
                                  Subir firmado
                                </DropdownMenuItem>
                              </>
                            )}
                            {item.signedEvidence && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => downloadEvidence(item)}>
                                  <Download className="h-4 w-4" />
                                  Descargar evidencia
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <WorkPlanDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={createItem} />
      <ApprovalDialog
        open={approvalOpen}
        selectedItems={selectedPendingItems}
        onClose={() => setApprovalOpen(false)}
        onApprove={approveSelected}
      />
      <DetailDialog item={detailItem} onClose={() => setDetailItem(null)} />
    </main>
  )
}
