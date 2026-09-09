"use client"

import { type FormEvent, useMemo, useState } from "react"
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
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

type ViewMode = "cards" | "list"
type ExecutionType = "MANUAL" | "AUTOMATIC"
type AccountabilityStatus = "PENDING_DOCUMENT" | "DOCUMENT_UPLOADED" | "SIGNED"

type AccountabilityResult = {
  annualPlanExecution: number
  trainingsCompleted: number
  trainingsPlanned: number
  accidentsReported: number
  copasstMeetings: number
  riskMatrixUpdated: boolean
  preventiveMeasuresImplementation: number
}

type AccountabilityDocument = {
  id: string
  fileName: string
  uploadedAt: string
  isConfirmed: boolean
}

type AccountabilityRecord = {
  id: string
  year: number
  renditionDate: string
  sgiResponsible: string
  legalRepresentative: string
  executionType: ExecutionType
  status: AccountabilityStatus
  observations: string
  result: AccountabilityResult
  document?: AccountabilityDocument
  createdAt: string
}

type AccountabilityForm = {
  year: string
  renditionDate: string
  legalRepresentative: string
  executionType: ExecutionType
  observations: string
}

type UploadForm = {
  fileName: string
  isConfirmed: boolean
}

const currentYear = new Date().getFullYear()

const legalRepresentatives = [
  "Carlos Rodriguez",
  "Andrea Gutierrez",
  "Marcela Herrera",
]

const sgiResponsible = "Responsable SG-SST"

const emptyForm: AccountabilityForm = {
  year: String(currentYear),
  renditionDate: new Date().toISOString().slice(0, 10),
  legalRepresentative: "",
  executionType: "AUTOMATIC",
  observations: "",
}

const initialAccountabilities: AccountabilityRecord[] = [
  {
    id: "accountability-1",
    year: 2026,
    renditionDate: "2026-12-20",
    sgiResponsible,
    legalRepresentative: "Carlos Rodriguez",
    executionType: "AUTOMATIC",
    status: "DOCUMENT_UPLOADED",
    observations: "Rendición consolidada con base en los módulos del SG-SST.",
    result: {
      annualPlanExecution: 82,
      trainingsCompleted: 24,
      trainingsPlanned: 30,
      accidentsReported: 3,
      copasstMeetings: 10,
      riskMatrixUpdated: true,
      preventiveMeasuresImplementation: 75,
    },
    document: {
      id: "document-1",
      fileName: "rendicion-cuentas-2026-firmada.pdf",
      uploadedAt: "2026-12-21T09:30:00.000Z",
      isConfirmed: true,
    },
    createdAt: "2026-12-20T14:00:00.000Z",
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

function executionTypeLabel(type: ExecutionType) {
  return type === "AUTOMATIC" ? "Automático" : "Manual"
}

function statusLabel(status: AccountabilityStatus) {
  if (status === "SIGNED") return "Firmada"
  if (status === "DOCUMENT_UPLOADED") return "Documento cargado"
  return "Pendiente documento"
}

function statusClassName(status: AccountabilityStatus) {
  if (status === "SIGNED") return "bg-accentActivd text-accentActivd-foreground border-transparent"
  if (status === "DOCUMENT_UPLOADED") return "bg-blue-600 text-white border-transparent"
  return "bg-warning/10 text-warning border-warning/20"
}

function generateAutomaticResult(year: number): AccountabilityResult {
  const variation = Math.abs(year - currentYear)
  const annualPlanExecution = Math.max(68, Math.min(96, 82 - variation * 2))
  const trainingsPlanned = 30
  const trainingsCompleted = Math.round((trainingsPlanned * annualPlanExecution) / 100)

  return {
    annualPlanExecution,
    trainingsCompleted,
    trainingsPlanned,
    accidentsReported: year === currentYear ? 3 : Math.max(0, 4 - variation),
    copasstMeetings: year === currentYear ? 10 : 8,
    riskMatrixUpdated: true,
    preventiveMeasuresImplementation: Math.max(60, Math.min(92, 75 + variation)),
  }
}

function emptyManualResult(): AccountabilityResult {
  return {
    annualPlanExecution: 0,
    trainingsCompleted: 0,
    trainingsPlanned: 0,
    accidentsReported: 0,
    copasstMeetings: 0,
    riskMatrixUpdated: false,
    preventiveMeasuresImplementation: 0,
  }
}

function resultItems(result: AccountabilityResult) {
  return [
    {
      label: "Plan anual",
      value: `${result.annualPlanExecution}% ejecutado`,
    },
    {
      label: "Capacitaciones",
      value: `${result.trainingsCompleted} de ${result.trainingsPlanned} realizadas`,
    },
    {
      label: "Accidentes",
      value: `${result.accidentsReported} reportados`,
    },
    {
      label: "COPASST",
      value: `${result.copasstMeetings} reuniones realizadas`,
    },
    {
      label: "Matriz de riesgos",
      value: result.riskMatrixUpdated ? "Actualizada" : "Pendiente",
    },
    {
      label: "Medidas de prevención",
      value: `${result.preventiveMeasuresImplementation}% implementadas`,
    },
  ]
}

function downloadAccountabilityPdf(record: AccountabilityRecord) {
  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const primaryColor: [number, number, number] = [31, 92, 77]

  doc.setFillColor(...primaryColor)
  doc.roundedRect(margin, 12, pageWidth - margin * 2, 24, 3, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("RENDICIÓN DE CUENTAS SG-SST", margin + 5, 23)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`Vigencia ${record.year} · Fecha: ${formatDate(record.renditionDate)}`, margin + 5, 30)

  autoTable(doc, {
    startY: 44,
    theme: "grid",
    margin: { left: margin, right: margin },
    body: [
      ["Año / Vigencia", String(record.year), "Tipo de ejecución", executionTypeLabel(record.executionType)],
      ["Responsable SG-SST", record.sgiResponsible, "Representante legal", record.legalRepresentative],
      ["Estado", statusLabel(record.status), "Documento soporte", record.document?.fileName ?? "Pendiente"],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5, lineColor: [220, 226, 224], lineWidth: 0.1 },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 38 },
      2: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 42 },
    },
  })

  autoTable(doc, {
    startY: ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 74) + 8,
    theme: "grid",
    margin: { left: margin, right: margin },
    head: [["Indicador", "Resultado"]],
    body: resultItems(record.result).map((item) => [item.label, item.value]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5, lineColor: [220, 226, 224], lineWidth: 0.1 },
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 62, fontStyle: "bold" },
    },
  })

  const observationY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120) + 12
  doc.setTextColor(30, 41, 59)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Observaciones", margin, observationY)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(doc.splitTextToSize(record.observations || "Sin observaciones.", pageWidth - margin * 2), margin, observationY + 7)

  const signatureY = 250
  doc.setDrawColor(120, 130, 140)
  doc.line(margin, signatureY, margin + 76, signatureY)
  doc.line(pageWidth - margin - 76, signatureY, pageWidth - margin, signatureY)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Responsable SG-SST", margin, signatureY + 6)
  doc.text("Representante legal", pageWidth - margin - 76, signatureY + 6)

  doc.setDrawColor(220, 226, 224)
  doc.line(margin, 280, pageWidth - margin, 280)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text("Documento generado desde SafeCloud - Sistema de Gestión Integral", margin, 286)

  doc.save(`rendicion-cuentas-sg-sst-${record.year}.pdf`)
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

function AccountabilityDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (form: AccountabilityForm) => void
}) {
  const [form, setForm] = useState<AccountabilityForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const year = Number(form.year)

    if (!Number.isInteger(year) || year < 2019) return toast.error("Ingresa una vigencia válida")
    if (!form.renditionDate) return toast.error("Selecciona la fecha de rendición")
    if (!form.legalRepresentative) return toast.error("Selecciona el representante legal")

    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    onSave(form)
    setSaving(false)
    setForm(emptyForm)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-3xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Nueva rendición de cuentas</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Selecciona la vigencia y el tipo de ejecución para consolidar el informe anual del SG-SST.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Información general</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  Año / Vigencia
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(event) => setForm((current) => ({ ...current, year: event.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha de rendición
                  <Input
                    type="date"
                    value={form.renditionDate}
                    onChange={(event) => setForm((current) => ({ ...current, renditionDate: event.target.value }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Responsable SG-SST
                  <Input value={sgiResponsible} disabled />
                </Label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Representante legal</span>
                  <select
                    value={form.legalRepresentative}
                    onChange={(event) => setForm((current) => ({ ...current, legalRepresentative: event.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona representante</option>
                    {legalRepresentatives.map((representative) => (
                      <option key={representative} value={representative}>
                        {representative}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Tipo de ejecución</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["AUTOMATIC", "MANUAL"] as ExecutionType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, executionType: type }))}
                    className={`rounded-md border p-4 text-left transition ${
                      form.executionType === type
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary text-foreground hover:border-primary/50"
                    }`}
                  >
                    <p className="text-sm font-semibold">{executionTypeLabel(type)}</p>
                    <p className={`mt-1 text-xs ${form.executionType === type ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {type === "AUTOMATIC"
                        ? "El sistema consolida indicadores de la vigencia seleccionada."
                        : "Solo crea el registro para cargar el documento firmado."}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <Label className="grid gap-2">
              Observaciones
              <Textarea
                value={form.observations}
                onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
                rows={3}
                placeholder="Agrega notas sobre la rendición, compromisos o información relevante."
              />
            </Label>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear rendición
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function UploadDialog({
  record,
  onClose,
  onUpload,
}: {
  record: AccountabilityRecord | null
  onClose: () => void
  onUpload: (recordId: string, form: UploadForm) => void
}) {
  const [form, setForm] = useState<UploadForm>({ fileName: "", isConfirmed: true })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.fileName.trim()) return toast.error("Selecciona el documento firmado")

    onUpload(record.id, form)
    setForm({ fileName: "", isConfirmed: true })
    onClose()
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Cargar documento firmado</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adjunta el documento de rendición de cuentas firmado para conservarlo como soporte.
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

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isConfirmed}
              onChange={(event) => setForm((current) => ({ ...current, isConfirmed: event.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            Documento confirmado
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <Upload className="h-4 w-4" />
              Subir documento
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
  record: AccountabilityRecord | null
  onClose: () => void
  onDownload: (record: AccountabilityRecord) => void
}) {
  if (!record) return null

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Detalle de rendición {record.year}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Consulta la información consolidada, documento soporte y resultado anual.
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoBlock label="Vigencia" value={String(record.year)} />
            <InfoBlock label="Fecha" value={formatDate(record.renditionDate)} />
            <InfoBlock label="Tipo" value={executionTypeLabel(record.executionType)} />
            <InfoBlock label="Estado" value={statusLabel(record.status)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock label="Responsable SG-SST" value={record.sgiResponsible} />
            <InfoBlock label="Representante legal" value={record.legalRepresentative} />
          </div>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <BarChart3 className="h-4 w-4" />
              Resultado automático
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {resultItems(record.result).map((item) => (
                <div key={item.label} className="rounded-md bg-secondary p-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Documento soporte</h3>
            {record.document ? (
              <div className="rounded-md bg-secondary p-3 text-sm">
                <p className="font-medium text-foreground">{record.document.fileName}</p>
                <p className="text-muted-foreground">
                  Cargado: {formatDateTime(record.document.uploadedAt)} · {record.document.isConfirmed ? "Confirmado" : "Sin confirmar"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay documento firmado cargado.</p>
            )}
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Observaciones</h3>
            <p className="text-sm text-muted-foreground">{record.observations || "Sin observaciones."}</p>
          </section>
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" className="gap-2" onClick={() => onDownload(record)}>
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AccountabilityPage() {
  const [records, setRecords] = useState<AccountabilityRecord[]>(initialAccountabilities)
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [createOpen, setCreateOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<AccountabilityRecord | null>(null)
  const [uploadRecord, setUploadRecord] = useState<AccountabilityRecord | null>(null)

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return records

    return records.filter(
      (record) =>
        String(record.year).includes(query) ||
        record.legalRepresentative.toLowerCase().includes(query) ||
        record.sgiResponsible.toLowerCase().includes(query) ||
        executionTypeLabel(record.executionType).toLowerCase().includes(query) ||
        statusLabel(record.status).toLowerCase().includes(query),
    )
  }, [records, search])

  const latestRecord = records[0]
  const stats = useMemo(() => {
    const automatic = records.filter((record) => record.executionType === "AUTOMATIC").length
    const withDocument = records.filter((record) => Boolean(record.document)).length
    const averageExecution = records.length
      ? Math.round(records.reduce((sum, record) => sum + record.result.annualPlanExecution, 0) / records.length)
      : 0

    return {
      total: records.length,
      automatic,
      withDocument,
      averageExecution,
    }
  }, [records])

  function handleCreate(form: AccountabilityForm) {
    const year = Number(form.year)
    const record: AccountabilityRecord = {
      id: createId("accountability"),
      year,
      renditionDate: form.renditionDate,
      sgiResponsible,
      legalRepresentative: form.legalRepresentative,
      executionType: form.executionType,
      status: "PENDING_DOCUMENT",
      observations: form.observations.trim(),
      result: form.executionType === "AUTOMATIC" ? generateAutomaticResult(year) : emptyManualResult(),
      createdAt: new Date().toISOString(),
    }

    setRecords((current) => [record, ...current])
    toast.success(
      form.executionType === "AUTOMATIC"
        ? "Rendición creada con indicadores automáticos"
        : "Rendición manual creada. Ya puedes cargar el documento firmado.",
    )
  }

  function handleUpload(recordId: string, form: UploadForm) {
    setRecords((current) =>
      current.map((record) =>
        record.id === recordId
          ? {
              ...record,
              status: form.isConfirmed ? "DOCUMENT_UPLOADED" : "PENDING_DOCUMENT",
              document: {
                id: createId("document"),
                fileName: form.fileName.trim(),
                uploadedAt: new Date().toISOString(),
                isConfirmed: form.isConfirmed,
              },
            }
          : record,
      ),
    )
    toast.success("Documento de rendición cargado")
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rendición de Cuentas</h1>
          <p className="text-muted-foreground">
            Consolida la rendición anual del SG-SST, genera el documento y conserva el soporte firmado.
          </p>
        </div>
        <Button type="button" className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva rendición
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center overflow-x-auto px-3 py-1">
          <div className="flex w-fit min-w-max items-center gap-2">
            <Metric label="Rendiciones" value={stats.total} />
            <Metric label="Automáticas" value={stats.automatic} tone="blue" />
            <Metric label="Con soporte" value={stats.withDocument} tone="green" />
            <Metric label="Plan ejecutado promedio" value={`${stats.averageExecution}%`} tone="amber" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_auto] md:items-end">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Vigencia, responsable, representante o estado"
              />
            </div>
          </Label>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => latestRecord && downloadAccountabilityPdf(latestRecord)}
            disabled={!latestRecord}
          >
            <Download className="h-4 w-4" />
            Descargar última rendición
          </Button>
        </div>
      </section>

      {latestRecord && (
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-card md:col-span-2">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Resultado automático {latestRecord.year}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {resultItems(latestRecord.result).map((item) => (
                  <div key={item.label} className="rounded-md bg-secondary p-3">
                    <p className="text-xs font-medium uppercase text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <h2 className="text-lg font-semibold text-foreground">Flujo</h2>
              <div className="flex items-start gap-3 rounded-md bg-secondary p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
                <p className="text-sm text-muted-foreground">Crea una rendición por vigencia anual.</p>
              </div>
              <div className="flex items-start gap-3 rounded-md bg-secondary p-3">
                <FileText className="mt-0.5 h-4 w-4 text-blue-700" />
                <p className="text-sm text-muted-foreground">Descarga el PDF para firma del responsable y representante legal.</p>
              </div>
              <div className="flex items-start gap-3 rounded-md bg-secondary p-3">
                <Upload className="mt-0.5 h-4 w-4 text-amber-700" />
                <p className="text-sm text-muted-foreground">Carga el documento firmado como soporte de auditoría.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Rendiciones registradas</h2>
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
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">Rendición {record.year}</h3>
                        <Badge variant="outline" className={statusClassName(record.status)}>
                          {statusLabel(record.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{executionTypeLabel(record.executionType)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDetailRecord(record)}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Fecha: {formatDate(record.renditionDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {record.document ? "Soporte cargado" : "Sin soporte"}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => downloadAccountabilityPdf(record)}>
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button type="button" size="sm" className="gap-2" onClick={() => setUploadRecord(record)}>
                      <Upload className="h-4 w-4" />
                      Cargar firmado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Vigencia</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Responsable SG-SST</th>
                  <th className="px-4 py-3 font-medium">Representante legal</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Plan anual</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{record.year}</p>
                      <p className="text-muted-foreground">Creada: {formatDate(record.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(record.renditionDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.sgiResponsible}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.legalRepresentative}</td>
                    <td className="px-4 py-3 text-muted-foreground">{executionTypeLabel(record.executionType)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.result.annualPlanExecution}%</td>
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
                          <DropdownMenuItem onSelect={() => downloadAccountabilityPdf(record)}>
                            <Download className="h-4 w-4" />
                            Descargar PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setUploadRecord(record)}>
                            <Upload className="h-4 w-4" />
                            Cargar documento firmado
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No hay rendiciones de cuentas para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AccountabilityDialog open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />
      <UploadDialog record={uploadRecord} onClose={() => setUploadRecord(null)} onUpload={handleUpload} />
      <DetailDialog record={detailRecord} onClose={() => setDetailRecord(null)} onDownload={downloadAccountabilityPdf} />
    </main>
  )
}
