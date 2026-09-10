"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  Archive,
  CheckCircle2,
  Download,
  Edit,
  Eye,
  FileCheck2,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
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

type EvidenceKind = "custody" | "confidentiality"

type Evidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
  mimeType?: string
  url?: string
}

type CustodyRecord = {
  id: string
  custodianInstitution: string
  responsiblePerson: string
  custodyStartDate: string
  observations: string
  custodyEvidence?: Evidence
  confidentialityEvidence?: Evidence
}

type CustodyForm = {
  custodianInstitution: string
  responsiblePerson: string
  custodyStartDate: string
  observations: string
}

type EvidenceForm = {
  fileName: string
  description: string
}

type PreviewState = {
  title: string
  url: string
  mimeType: string
  generated: boolean
}

const emptyForm: CustodyForm = {
  custodianInstitution: "",
  responsiblePerson: "",
  custodyStartDate: new Date().toISOString().slice(0, 10),
  observations: "",
}

const emptyEvidenceForm: EvidenceForm = {
  fileName: "",
  description: "",
}

const initialRecords: CustodyRecord[] = [
  {
    id: "custody-1",
    custodianInstitution: "IPS Salud Ocupacional Integral",
    responsiblePerson: "Dra. Maria Perez",
    custodyStartDate: "2026-01-12",
    observations: "La IPS conserva la custodia de las historias clinicas ocupacionales derivadas de evaluaciones medicas.",
    custodyEvidence: {
      id: "custody-evidence-1",
      fileName: "contrato-custodia-historias-clinicas.pdf",
      description: "Contrato y certificacion de custodia con IPS.",
      uploadedAt: "2026-01-13T09:30:00",
      mimeType: "application/pdf",
    },
    confidentialityEvidence: {
      id: "conf-evidence-1",
      fileName: "compromiso-confidencialidad-firmado.pdf",
      description: "Compromiso de confidencialidad firmado por responsable.",
      uploadedAt: "2026-01-14T10:00:00",
      mimeType: "application/pdf",
    },
  },
  {
    id: "custody-2",
    custodianInstitution: "Medico especialista externo SST",
    responsiblePerson: "Dr. Andres Molina",
    custodyStartDate: "2026-04-01",
    observations: "Custodia temporal de conceptos y soportes medicos ocupacionales.",
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

function canEmbed(mimeType?: string) {
  return Boolean(mimeType?.startsWith("image/") || mimeType === "application/pdf" || mimeType?.startsWith("text/"))
}

function evidenceFor(record: CustodyRecord, kind: EvidenceKind) {
  return kind === "custody" ? record.custodyEvidence : record.confidentialityEvidence
}

function evidenceLabel(kind: EvidenceKind) {
  return kind === "custody" ? "soporte de custodia" : "compromiso de confidencialidad"
}

function buildEvidenceText(record: CustodyRecord, evidence: Evidence, kind: EvidenceKind) {
  return `Custodia de historias clinicas ocupacionales
Tipo soporte: ${evidenceLabel(kind)}
Institucion custodio: ${record.custodianInstitution}
Persona responsable: ${record.responsiblePerson}
Fecha inicio custodia: ${formatDate(record.custodyStartDate)}

Archivo: ${evidence.fileName}
Descripcion: ${evidence.description || "Sin descripcion"}
Cargado: ${formatDateTime(evidence.uploadedAt)}
`
}

function CustodyDialog({
  open,
  record,
  onClose,
  onSave,
}: {
  open: boolean
  record: CustodyRecord | null
  onClose: () => void
  onSave: (form: CustodyForm, recordId?: string) => void
}) {
  const [form, setForm] = useState<CustodyForm>(emptyForm)
  const editing = Boolean(record)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            custodianInstitution: record.custodianInstitution,
            responsiblePerson: record.responsiblePerson,
            custodyStartDate: record.custodyStartDate,
            observations: record.observations,
          }
        : emptyForm,
    )
  }, [open, record])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.custodianInstitution.trim()) return toast.error("Ingresa la institucion custodio")
    if (!form.responsiblePerson.trim()) return toast.error("Ingresa la persona responsable")
    if (!form.custodyStartDate) return toast.error("Selecciona la fecha de inicio de custodia")

    onSave(form, record?.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Editar custodia" : "Nueva custodia"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registra quien tiene la custodia de historias clinicas ocupacionales. Los soportes se cargan desde las acciones.
          </p>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos de custodia</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  Institucion custodio (IPS)
                  <Input
                    value={form.custodianInstitution}
                    onChange={(event) => setForm((current) => ({ ...current, custodianInstitution: event.target.value }))}
                    placeholder="IPS o medico que custodia"
                  />
                </Label>
                <Label className="grid gap-2">
                  Persona responsable
                  <Input
                    value={form.responsiblePerson}
                    onChange={(event) => setForm((current) => ({ ...current, responsiblePerson: event.target.value }))}
                    placeholder="Nombre del responsable"
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha de inicio de custodia
                  <Input
                    type="date"
                    value={form.custodyStartDate}
                    onChange={(event) => setForm((current) => ({ ...current, custodyStartDate: event.target.value }))}
                  />
                </Label>
                <Label className="grid gap-2 md:col-span-2">
                  Observaciones
                  <Textarea
                    value={form.observations}
                    onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
                    placeholder="Describe el alcance o soporte de custodia"
                    rows={4}
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <FileCheck2 className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Soportes requeridos</h3>
                  <p className="text-sm text-muted-foreground">
                    Luego de guardar, carga desde los 3 puntos el soporte de custodia y el compromiso de confidencialidad firmado.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Guardar cambios" : "Crear custodia"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  record,
  kind,
  onClose,
  onSave,
}: {
  record: CustodyRecord | null
  kind: EvidenceKind
  onClose: () => void
  onSave: (recordId: string, kind: EvidenceKind, form: EvidenceForm, file: File | null) => void
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!record) return
    const evidence = evidenceFor(record, kind)
    setForm({
      fileName: evidence?.fileName ?? "",
      description: evidence?.description ?? "",
    })
    setFile(null)
  }, [kind, record])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!file && !form.fileName.trim()) return toast.error(`Selecciona o registra el ${evidenceLabel(kind)}`)

    onSave(record.id, kind, form, file)
    onClose()
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{kind === "custody" ? "Cargar soporte de custodia" : "Cargar compromiso firmado"}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Adjunta el {evidenceLabel(kind)} para {record?.custodianInstitution ?? "el registro de custodia"}.
            </p>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Archivo
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null
                  setFile(selected)
                  setForm((current) => ({ ...current, fileName: selected?.name ?? current.fileName }))
                }}
              />
            </Label>
            <Label className="grid gap-2">
              Nombre del archivo
              <Input
                value={form.fileName}
                onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.value }))}
                placeholder={kind === "custody" ? "soporte-custodia.pdf" : "compromiso-confidencialidad-firmado.pdf"}
              />
            </Label>
            <Label className="grid gap-2 md:col-span-2">
              Descripcion
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                placeholder="Observacion del soporte cargado"
              />
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar soporte</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PreviewDialog({ preview, onClose }: { preview: PreviewState | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(preview)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{preview?.title ?? "Soporte"}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {preview && canEmbed(preview.mimeType) ? (
            preview.mimeType.startsWith("image/") ? (
              <img src={preview.url} alt={preview.title} className="mx-auto max-h-[70dvh] max-w-full rounded-md object-contain" />
            ) : (
              <iframe title={preview.title} src={preview.url} className="h-[70dvh] w-full rounded-md border border-border" />
            )
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-md border border-dashed border-border text-center text-muted-foreground">
              <FileText className="mb-3 h-10 w-10" />
              <p className="font-medium">Vista previa no disponible</p>
              <p className="text-sm">Puedes abrir o descargar el soporte desde las acciones.</p>
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          {preview && (
            <Button type="button" variant="outline" onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")}>
              Abrir en otra pestaña
            </Button>
          )}
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

export default function CustodyPage() {
  const [records, setRecords] = useState<CustodyRecord[]>(initialRecords)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CustodyRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<CustodyRecord | null>(null)
  const [evidenceKind, setEvidenceKind] = useState<EvidenceKind>("custody")
  const [detailRecord, setDetailRecord] = useState<CustodyRecord | null>(null)
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const stats = useMemo(
    () => ({
      total: records.length,
      withCustodyEvidence: records.filter((record) => record.custodyEvidence).length,
      withConfidentiality: records.filter((record) => record.confidentialityEvidence).length,
      complete: records.filter((record) => record.custodyEvidence && record.confidentialityEvidence).length,
    }),
    [records],
  )

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return records

    return records.filter(
      (record) =>
        record.custodianInstitution.toLowerCase().includes(term) ||
        record.responsiblePerson.toLowerCase().includes(term) ||
        record.custodyEvidence?.fileName.toLowerCase().includes(term) ||
        record.confidentialityEvidence?.fileName.toLowerCase().includes(term),
    )
  }, [records, search])

  function saveRecord(form: CustodyForm, recordId?: string) {
    const payload = {
      custodianInstitution: form.custodianInstitution.trim(),
      responsiblePerson: form.responsiblePerson.trim(),
      custodyStartDate: form.custodyStartDate,
      observations: form.observations.trim(),
    }

    if (recordId) {
      setRecords((current) => current.map((record) => (record.id === recordId ? { ...record, ...payload } : record)))
      toast.success("Custodia actualizada")
      return
    }

    setRecords((current) => [{ id: createId("custody"), ...payload }, ...current])
    toast.success("Custodia creada")
  }

  function saveEvidence(recordId: string, kind: EvidenceKind, form: EvidenceForm, file: File | null) {
    const evidence: Evidence = {
      id: createId(kind === "custody" ? "custody-evidence" : "confidentiality-evidence"),
      fileName:
        form.fileName.trim() ||
        file?.name ||
        (kind === "custody" ? "soporte-custodia.pdf" : "compromiso-confidencialidad-firmado.pdf"),
      description: form.description.trim(),
      uploadedAt: new Date().toISOString(),
      mimeType: file?.type || "text/plain",
      url: file ? URL.createObjectURL(file) : undefined,
    }

    setRecords((current) =>
      current.map((record) =>
        record.id === recordId
          ? kind === "custody"
            ? { ...record, custodyEvidence: evidence }
            : { ...record, confidentialityEvidence: evidence }
          : record,
      ),
    )
    toast.success(kind === "custody" ? "Soporte de custodia cargado" : "Compromiso de confidencialidad cargado")
  }

  function deleteRecord(record: CustodyRecord) {
    if (!window.confirm(`Eliminar la custodia de "${record.custodianInstitution}"?`)) return
    setRecords((current) => current.filter((item) => item.id !== record.id))
    toast.success("Custodia eliminada")
  }

  function downloadCommitment(record: CustodyRecord) {
    const doc = new jsPDF("p", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const primaryColor: [number, number, number] = [31, 92, 77]

    doc.setFillColor(...primaryColor)
    doc.roundedRect(margin, 12, pageWidth - margin * 2, 24, 3, 3, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.text("COMPROMISO DE CONFIDENCIALIDAD", margin + 5, 23)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text("Custodia de historias clínicas ocupacionales", margin + 5, 30)

    autoTable(doc, {
      startY: 46,
      theme: "grid",
      margin: { left: margin, right: margin },
      body: [
        ["Institución custodio", record.custodianInstitution],
        ["Persona responsable", record.responsiblePerson],
        ["Inicio de custodia", formatDate(record.custodyStartDate)],
        ["Observaciones", record.observations || "Sin observaciones"],
      ],
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3, lineColor: [220, 226, 224], lineWidth: 0.1 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 55 },
        1: { cellWidth: pageWidth - margin * 2 - 55 },
      },
    })

    let y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 86) + 12
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.text("Declaración del responsable", margin, y)
    y += 8
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    const text = [
      "Declaro que conozco el carácter reservado y sensible de la información contenida en las historias clínicas ocupacionales.",
      "Me comprometo a mantener estricta confidencialidad, a custodiar la información únicamente para los fines permitidos y a impedir accesos, divulgaciones o usos no autorizados.",
      "Este compromiso aplica durante la custodia y después de finalizada cualquier relación contractual o funcional relacionada con la empresa.",
    ]
    doc.text(text, margin, y, { maxWidth: pageWidth - margin * 2, lineHeightFactor: 1.45 })
    y += 42

    const signatureY = Math.min(y + 30, pageHeight - 38)
    doc.setDrawColor(120, 130, 140)
    doc.line(margin, signatureY, margin + 82, signatureY)
    doc.line(pageWidth - margin - 82, signatureY, pageWidth - margin, signatureY)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text("Firma persona responsable", margin, signatureY + 6)
    doc.text("Representante de la empresa", pageWidth - margin - 82, signatureY + 6)

    doc.setDrawColor(220, 226, 224)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text("Documento generado desde SafeCloud SG-SST", margin, pageHeight - 7)
    doc.text("Página 1 de 1", pageWidth - margin, pageHeight - 7, { align: "right" })

    doc.save(`compromiso-confidencialidad-${record.responsiblePerson.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`)
  }

  function viewEvidence(record: CustodyRecord, kind: EvidenceKind) {
    const evidence = evidenceFor(record, kind)
    if (!evidence) {
      toast.error(`Este registro no tiene ${evidenceLabel(kind)}`)
      return
    }

    if (evidence.url) {
      setPreview({
        title: evidence.fileName,
        url: evidence.url,
        mimeType: evidence.mimeType || "application/octet-stream",
        generated: false,
      })
      return
    }

    const blob = new Blob([buildEvidenceText(record, evidence, kind)], { type: "text/plain;charset=utf-8" })
    setPreview({
      title: evidence.fileName,
      url: URL.createObjectURL(blob),
      mimeType: "text/plain",
      generated: true,
    })
  }

  function closePreview() {
    if (preview?.generated) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  function downloadEvidence(record: CustodyRecord, kind: EvidenceKind) {
    const evidence = evidenceFor(record, kind)
    if (!evidence) {
      toast.error(`Este registro no tiene ${evidenceLabel(kind)}`)
      return
    }

    const url =
      evidence.url ?? URL.createObjectURL(new Blob([buildEvidenceText(record, evidence, kind)], { type: "text/plain;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = evidence.fileName
    link.click()
    if (!evidence.url) URL.revokeObjectURL(url)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Custodia</h1>
          <p className="text-muted-foreground">
            Custodia de historias clínicas ocupacionales a cargo de IPS o médico evaluador, con soportes y compromiso firmado.
          </p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            setEditingRecord(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nueva custodia
        </Button>
      </div>

      <section className="overflow-x-auto px-3 py-1">
        <div className="flex min-w-max items-center justify-center gap-2">
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Soporte custodia</span>
            <span className="text-sm font-semibold text-primary">{stats.withCustodyEvidence}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Compromiso firmado</span>
            <span className="text-sm font-semibold text-green-700">{stats.withConfidentiality}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Completos</span>
            <span className="text-sm font-semibold">{stats.complete}</span>
          </div>
        </div>
      </section>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Archive className="h-5 w-5" />
                Lista de custodias
              </h2>
              <p className="text-sm text-muted-foreground">
                Descarga el compromiso, solicita la firma del responsable y carga los soportes desde las acciones.
              </p>
            </div>
            <div className="relative w-full lg:w-[360px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Buscar por IPS, responsable o soporte"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[1160px] text-sm">
          <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Institución custodio</th>
              <th className="px-4 py-3 font-medium">Responsable</th>
              <th className="px-4 py-3 font-medium">Inicio custodia</th>
              <th className="px-4 py-3 font-medium">Soporte custodia</th>
              <th className="px-4 py-3 font-medium">Confidencialidad</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="align-middle hover:bg-secondary/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{record.custodianInstitution}</p>
                  <p className="max-w-[340px] truncate text-muted-foreground">{record.observations || "Sin observaciones"}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{record.responsiblePerson}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(record.custodyStartDate)}</td>
                <td className="px-4 py-3">
                  {record.custodyEvidence ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      {record.custodyEvidence.fileName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sin soporte</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      record.confidentialityEvidence
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }
                  >
                    {record.confidentialityEvidence ? "Firmado" : "Pendiente"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72">
                      <DropdownMenuItem onSelect={() => setDetailRecord(record)}>
                        <Eye className="h-4 w-4" />
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => downloadCommitment(record)}>
                        <Download className="h-4 w-4" />
                        Descargar compromiso para firma
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEvidenceKind("custody")
                          setEvidenceRecord(record)
                        }}
                      >
                        <Upload className="h-4 w-4" />
                        Cargar soporte de custodia
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEvidenceKind("confidentiality")
                          setEvidenceRecord(record)
                        }}
                      >
                        <Upload className="h-4 w-4" />
                        Cargar compromiso firmado
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => viewEvidence(record, "custody")} disabled={!record.custodyEvidence}>
                        <FileText className="h-4 w-4" />
                        Ver soporte de custodia
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => viewEvidence(record, "confidentiality")} disabled={!record.confidentialityEvidence}>
                        <FileText className="h-4 w-4" />
                        Ver compromiso firmado
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => downloadEvidence(record, "confidentiality")} disabled={!record.confidentialityEvidence}>
                        <Download className="h-4 w-4" />
                        Descargar compromiso firmado
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditingRecord(record)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => deleteRecord(record)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No hay registros de custodia para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Criterio de cumplimiento</h3>
            <p className="text-sm text-muted-foreground">
              El registro queda completo cuando existe soporte que demuestre que la custodia está a cargo de una IPS o médico evaluador
              y cuando el responsable firma el compromiso de confidencialidad por el manejo de información sensible.
            </p>
          </div>
        </div>
      </section>

      <Dialog open={Boolean(detailRecord)} onOpenChange={(nextOpen) => !nextOpen && setDetailRecord(null)}>
        <DialogContent className="max-w-4xl bg-card">
          <DialogHeader>
            <DialogTitle>Detalle de custodia</DialogTitle>
          </DialogHeader>
          {detailRecord && (
            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock label="Institución custodio" value={detailRecord.custodianInstitution} />
              <InfoBlock label="Persona responsable" value={detailRecord.responsiblePerson} />
              <InfoBlock label="Inicio custodia" value={formatDate(detailRecord.custodyStartDate)} />
              <InfoBlock label="Estado" value={detailRecord.custodyEvidence && detailRecord.confidentialityEvidence ? "Completo" : "Pendiente"} />
              <div className="rounded-md bg-secondary p-3 md:col-span-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">Observaciones</p>
                <p className="mt-1 text-sm text-foreground">{detailRecord.observations || "Sin observaciones"}</p>
              </div>
              <InfoBlock
                label="Soporte custodia"
                value={
                  detailRecord.custodyEvidence
                    ? `${detailRecord.custodyEvidence.fileName} · ${formatDateTime(detailRecord.custodyEvidence.uploadedAt)}`
                    : "Sin soporte"
                }
              />
              <InfoBlock
                label="Compromiso confidencialidad"
                value={
                  detailRecord.confidentialityEvidence
                    ? `${detailRecord.confidentialityEvidence.fileName} · ${formatDateTime(detailRecord.confidentialityEvidence.uploadedAt)}`
                    : "Pendiente de firma"
                }
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setDetailRecord(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustodyDialog
        open={dialogOpen}
        record={editingRecord}
        onClose={() => {
          setDialogOpen(false)
          setEditingRecord(null)
        }}
        onSave={saveRecord}
      />
      <EvidenceDialog
        record={evidenceRecord}
        kind={evidenceKind}
        onClose={() => setEvidenceRecord(null)}
        onSave={saveEvidence}
      />
      <PreviewDialog preview={preview} onClose={closePreview} />
    </main>
  )
}
