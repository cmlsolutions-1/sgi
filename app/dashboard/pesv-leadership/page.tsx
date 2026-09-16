"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Download,
  Edit,
  Eye,
  FileCheck2,
  FileText,
  Handshake,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import jsPDF from "jspdf"
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

type LeadershipEvidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
  mimeType?: string
  url?: string
}

type CommitmentKey =
  | "policyAndObjectives"
  | "safeBehaviors"
  | "resources"
  | "safeProcurement"
  | "thirdParties"
  | "annualPlan"
  | "verificationEntities"
  | "committeeParticipation"

type LeadershipCommitments = Record<CommitmentKey, boolean>

type PesvLeadershipRecord = {
  id: string
  year: number
  directorName: string
  directorRole: string
  reviewDate: string
  strategicAlignment: string
  resourcesAssigned: string
  contractorFollowUp: string
  annualPlanFollowUp: string
  verificationManagement: string
  committeeMeetingDate: string
  observations: string
  commitments: LeadershipCommitments
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  evidence?: LeadershipEvidence
  createdAt: string
  updatedAt: string
}

type LeadershipForm = Omit<PesvLeadershipRecord, "id" | "status" | "evidence" | "createdAt" | "updatedAt">

type EvidenceForm = {
  fileName: string
  description: string
}

type EvidencePreview = {
  title: string
  url: string
  mimeType: string
  generated: boolean
}

const STORAGE_KEY = "safecloud:pesv-leadership"

const commitmentLabels: Array<{ key: CommitmentKey; label: string }> = [
  {
    key: "policyAndObjectives",
    label: "Define política y objetivos compatibles con la dirección estratégica.",
  },
  {
    key: "safeBehaviors",
    label: "Promueve hábitos, comportamientos y conductas seguras en la vía.",
  },
  {
    key: "resources",
    label: "Suministra recursos financieros, técnicos y humanos para el PESV.",
  },
  {
    key: "safeProcurement",
    label: "Garantiza adquisición o contratación segura de vehículos, equipos, repuestos y servicios.",
  },
  {
    key: "thirdParties",
    label: "Hace seguimiento a contratistas, afiliados, asociados, terceros y comunidad.",
  },
  {
    key: "annualPlan",
    label: "Asegura el cumplimiento de acciones y estrategias del plan anual PESV.",
  },
  {
    key: "verificationEntities",
    label: "Atiende verificaciones, solicitudes de información, apertura, cierre y hallazgos.",
  },
  {
    key: "committeeParticipation",
    label: "Participa mínimo una vez al año en reunión del Comité de Seguridad Vial.",
  },
]

const emptyCommitments: LeadershipCommitments = {
  policyAndObjectives: true,
  safeBehaviors: true,
  resources: true,
  safeProcurement: false,
  thirdParties: true,
  annualPlan: true,
  verificationEntities: false,
  committeeParticipation: true,
}

const defaultForm: LeadershipForm = {
  year: new Date().getFullYear(),
  directorName: "",
  directorRole: "Representante legal / Alta dirección",
  reviewDate: new Date().toISOString().slice(0, 10),
  strategicAlignment:
    "La alta dirección revisa que la política y los objetivos del PESV estén alineados con la estrategia organizacional y orientados a prevenir siniestros viales.",
  resourcesAssigned:
    "Se asignan recursos financieros, técnicos y humanos para el diseño, implementación, seguimiento, verificación y mejora del PESV.",
  contractorFollowUp:
    "Se realiza seguimiento a contratistas, asociados, terceros y comunidad relacionada para verificar el cumplimiento de requisitos de seguridad vial.",
  annualPlanFollowUp:
    "Se revisa el avance de las acciones y estrategias definidas en el plan de trabajo anual del PESV.",
  verificationManagement:
    "La organización atiende solicitudes de información, reuniones de apertura y cierre, y gestiona hallazgos derivados de visitas de verificación.",
  committeeMeetingDate: "",
  observations: "",
  commitments: emptyCommitments,
}

const initialRecords: PesvLeadershipRecord[] = [
  {
    id: "pesv-leadership-1",
    ...defaultForm,
    directorName: "Gerencia General",
    committeeMeetingDate: "2026-09-10",
    observations: "Compromiso directivo documentado y pendiente de cargar acta firmada de respaldo.",
    status: "IN_PROGRESS",
    createdAt: "2026-09-10T08:00:00",
    updatedAt: "2026-09-10T08:00:00",
  },
]

const statusLabels: Record<PesvLeadershipRecord["status"], string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En ejecución",
  COMPLETED: "Cumplido",
}

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

function readRecords() {
  if (typeof window === "undefined") return initialRecords

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PesvLeadershipRecord[]) : initialRecords
  } catch {
    return initialRecords
  }
}

function writeRecords(records: PesvLeadershipRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function completionPercentage(record: Pick<PesvLeadershipRecord, "commitments">) {
  const completed = commitmentLabels.filter((item) => record.commitments[item.key]).length
  return Math.round((completed / commitmentLabels.length) * 100)
}

function resolveStatus(record: Pick<PesvLeadershipRecord, "commitments" | "evidence">): PesvLeadershipRecord["status"] {
  if (completionPercentage(record) === 100 && record.evidence) return "COMPLETED"
  if (completionPercentage(record) > 0) return "IN_PROGRESS"
  return "PENDING"
}

function statusClassName(status: PesvLeadershipRecord["status"]) {
  if (status === "COMPLETED") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "IN_PROGRESS") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function canEmbed(mimeType?: string) {
  return Boolean(mimeType?.startsWith("image/") || mimeType === "application/pdf" || mimeType?.startsWith("text/"))
}

function buildEvidenceText(record: PesvLeadershipRecord, evidence: LeadershipEvidence) {
  return `Liderazgo, compromiso y corresponsabilidad PESV
Año: ${record.year}
Directivo: ${record.directorName}
Cargo: ${record.directorRole}
Fecha de revisión: ${formatDate(record.reviewDate)}
Cumplimiento: ${completionPercentage(record)}%
Estado: ${statusLabels[record.status]}

Documento: ${evidence.fileName}
Descripcion: ${evidence.description || "Sin descripcion"}
Cargado: ${formatDateTime(evidence.uploadedAt)}
`
}

function downloadLeadershipPdf(record: PesvLeadershipRecord) {
  const doc = new jsPDF("p", "mm", "a4")
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2
  let y = 18

  function addSection(title: string, content: string) {
    if (y > 248) {
      doc.addPage()
      y = 18
    }
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.text(title, margin, y)
    y += 6
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(content || "No registrado", contentWidth)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 7
  }

  doc.setFillColor(31, 92, 77)
  doc.roundedRect(margin, 12, contentWidth, 26, 3, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("LIDERAZGO Y COMPROMISO DIRECTIVO PESV", margin + 5, 24)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`Año ${record.year} · Revisión ${formatDate(record.reviewDate)} · Cumplimiento ${completionPercentage(record)}%`, margin + 5, 31)

  y = 50
  addSection("Directivo responsable", `${record.directorName} - ${record.directorRole}`)
  addSection("Alineación estratégica", record.strategicAlignment)
  addSection("Recursos asignados", record.resourcesAssigned)
  addSection("Seguimiento a terceros", record.contractorFollowUp)
  addSection("Seguimiento al plan anual PESV", record.annualPlanFollowUp)
  addSection("Gestión ante entidades verificadoras", record.verificationManagement)

  if (y > 230) {
    doc.addPage()
    y = 18
  }
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Verificación de compromisos", margin, y)
  y += 7
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  commitmentLabels.forEach((item) => {
    const mark = record.commitments[item.key] ? "Cumple" : "Pendiente"
    const lines = doc.splitTextToSize(`${mark}: ${item.label}`, contentWidth)
    doc.text(lines, margin, y)
    y += lines.length * 4.5 + 3
  })

  y = Math.max(y + 16, 242)
  if (y > 260) {
    doc.addPage()
    y = 230
  }
  doc.setDrawColor(120, 130, 140)
  doc.line(margin, y, margin + 78, y)
  doc.line(pageWidth - margin - 78, y, pageWidth - margin, y)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Firma alta dirección", margin, y + 6)
  doc.text("Firma responsable PESV", pageWidth - margin - 78, y + 6)

  doc.save(`liderazgo-directivo-pesv-${record.year}.pdf`)
}

function LeadershipDialog({
  open,
  record,
  onClose,
  onSave,
}: {
  open: boolean
  record: PesvLeadershipRecord | null
  onClose: () => void
  onSave: (form: LeadershipForm, recordId?: string) => void
}) {
  const [form, setForm] = useState<LeadershipForm>(defaultForm)
  const editing = Boolean(record)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            year: record.year,
            directorName: record.directorName,
            directorRole: record.directorRole,
            reviewDate: record.reviewDate,
            strategicAlignment: record.strategicAlignment,
            resourcesAssigned: record.resourcesAssigned,
            contractorFollowUp: record.contractorFollowUp,
            annualPlanFollowUp: record.annualPlanFollowUp,
            verificationManagement: record.verificationManagement,
            committeeMeetingDate: record.committeeMeetingDate,
            observations: record.observations,
            commitments: record.commitments,
          }
        : defaultForm,
    )
  }, [open, record])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.year) return toast.error("Ingresa el año")
    if (!form.directorName.trim()) return toast.error("Ingresa el directivo responsable")
    if (!form.directorRole.trim()) return toast.error("Ingresa el cargo del directivo")
    if (!form.reviewDate) return toast.error("Selecciona la fecha de revisión")
    if (!form.strategicAlignment.trim()) return toast.error("Registra la alineación estratégica")
    if (!form.resourcesAssigned.trim()) return toast.error("Registra los recursos asignados")

    onSave(
      {
        ...form,
        directorName: form.directorName.trim(),
        directorRole: form.directorRole.trim(),
        strategicAlignment: form.strategicAlignment.trim(),
        resourcesAssigned: form.resourcesAssigned.trim(),
        contractorFollowUp: form.contractorFollowUp.trim(),
        annualPlanFollowUp: form.annualPlanFollowUp.trim(),
        verificationManagement: form.verificationManagement.trim(),
        observations: form.observations.trim(),
      },
      record?.id,
    )
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Actualizar liderazgo directivo" : "Nuevo liderazgo directivo PESV"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Primero registra el compromiso directivo. La evidencia firmada se carga después desde las acciones.
          </p>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos generales</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  Año
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(event) => setForm((current) => ({ ...current, year: Number(event.target.value) }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha de revisión
                  <Input
                    type="date"
                    value={form.reviewDate}
                    onChange={(event) => setForm((current) => ({ ...current, reviewDate: event.target.value }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Directivo responsable
                  <Input
                    value={form.directorName}
                    onChange={(event) => setForm((current) => ({ ...current, directorName: event.target.value }))}
                    placeholder="Nombre del representante o directivo"
                  />
                </Label>
                <Label className="grid gap-2">
                  Cargo
                  <Input
                    value={form.directorRole}
                    onChange={(event) => setForm((current) => ({ ...current, directorRole: event.target.value }))}
                    placeholder="Gerente, representante legal, dirección administrativa"
                  />
                </Label>
                <Label className="grid gap-2 md:col-span-2">
                  Fecha de participación en Comité de Seguridad Vial
                  <Input
                    type="date"
                    value={form.committeeMeetingDate}
                    onChange={(event) => setForm((current) => ({ ...current, committeeMeetingDate: event.target.value }))}
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Gestión del compromiso</h3>
              <div className="grid gap-4">
                <Label className="grid gap-2">
                  Alineación estratégica de política y objetivos
                  <Textarea value={form.strategicAlignment} onChange={(event) => setForm((current) => ({ ...current, strategicAlignment: event.target.value }))} rows={3} />
                </Label>
                <Label className="grid gap-2">
                  Recursos financieros, técnicos y humanos
                  <Textarea value={form.resourcesAssigned} onChange={(event) => setForm((current) => ({ ...current, resourcesAssigned: event.target.value }))} rows={3} />
                </Label>
                <Label className="grid gap-2">
                  Seguimiento a contratistas, terceros y comunidad
                  <Textarea value={form.contractorFollowUp} onChange={(event) => setForm((current) => ({ ...current, contractorFollowUp: event.target.value }))} rows={3} />
                </Label>
                <Label className="grid gap-2">
                  Seguimiento al plan anual PESV
                  <Textarea value={form.annualPlanFollowUp} onChange={(event) => setForm((current) => ({ ...current, annualPlanFollowUp: event.target.value }))} rows={3} />
                </Label>
                <Label className="grid gap-2">
                  Atención a entidades verificadoras y gestión de hallazgos
                  <Textarea value={form.verificationManagement} onChange={(event) => setForm((current) => ({ ...current, verificationManagement: event.target.value }))} rows={3} />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Verificación de literales</h3>
              <div className="grid gap-3">
                {commitmentLabels.map((item) => (
                  <label key={item.key} className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.commitments[item.key]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          commitments: { ...current.commitments, [item.key]: event.target.checked },
                        }))
                      }
                      className="mt-1 h-4 w-4"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <Label className="grid gap-2">
              Observaciones
              <Textarea value={form.observations} onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))} rows={3} />
            </Label>

            <section className="rounded-md border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Upload className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Evidencia documental</h3>
                  <p className="text-sm text-muted-foreground">
                    El acta, compromiso firmado o soporte de participación se carga después de crear el registro desde los 3 puntos.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{editing ? "Guardar cambios" : "Crear registro"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  record,
  onClose,
  onSave,
}: {
  record: PesvLeadershipRecord | null
  onClose: () => void
  onSave: (recordId: string, form: EvidenceForm, file: File | null) => void
}) {
  const [form, setForm] = useState<EvidenceForm>({ fileName: "", description: "" })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!record) return
    setForm({
      fileName: record.evidence?.fileName ?? "",
      description: record.evidence?.description ?? "",
    })
    setFile(null)
  }, [record])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.fileName.trim() && !file) return toast.error("Selecciona o registra el nombre de la evidencia")

    onSave(record.id, form, file)
    onClose()
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Cargar evidencia de liderazgo</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Adjunta el acta, compromiso firmado o soporte de participación de la alta dirección.
            </p>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Evidencia
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
                placeholder="acta-liderazgo-pesv.pdf"
              />
            </Label>
            <Label className="grid gap-2 md:col-span-2">
              Descripción
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                placeholder="Descripción del soporte cargado"
              />
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar evidencia</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidencePreviewDialog({
  preview,
  onClose,
}: {
  preview: EvidencePreview | null
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(preview)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{preview?.title ?? "Evidencia"}</DialogTitle>
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
              <p className="text-sm">Puedes abrir o descargar el documento desde las acciones.</p>
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          {preview && (
            <Button type="button" variant="outline" onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")}>
              Abrir en otra pestaña
            </Button>
          )}
          <Button type="button" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PesvLeadershipPage() {
  const [records, setRecords] = useState<PesvLeadershipRecord[]>(initialRecords)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PesvLeadershipRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<PesvLeadershipRecord | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)

  useEffect(() => {
    setRecords(readRecords())
  }, [])

  const stats = useMemo(() => {
    return {
      total: records.length,
      completed: records.filter((record) => record.status === "COMPLETED").length,
      pendingEvidence: records.filter((record) => !record.evidence).length,
      average: records.length
        ? Math.round(records.reduce((sum, record) => sum + completionPercentage(record), 0) / records.length)
        : 0,
    }
  }, [records])

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return records
    return records.filter((record) =>
      `${record.year} ${record.directorName} ${record.directorRole} ${record.observations}`.toLowerCase().includes(term),
    )
  }, [records, search])

  function persist(nextRecords: PesvLeadershipRecord[]) {
    setRecords(nextRecords)
    writeRecords(nextRecords)
  }

  function saveRecord(form: LeadershipForm, recordId?: string) {
    const now = new Date().toISOString()

    if (recordId) {
      persist(
        records.map((record) => {
          if (record.id !== recordId) return record
          const nextRecord = { ...record, ...form, updatedAt: now }
          return { ...nextRecord, status: resolveStatus(nextRecord) }
        }),
      )
      toast.success("Registro de liderazgo actualizado")
      return
    }

    const newRecord: PesvLeadershipRecord = {
      id: createId("pesv-leadership"),
      ...form,
      status: resolveStatus({ commitments: form.commitments }),
      createdAt: now,
      updatedAt: now,
    }

    persist([newRecord, ...records])
    toast.success("Registro creado. Ahora puedes descargarlo para firma y cargar la evidencia.")
  }

  function saveEvidence(recordId: string, form: EvidenceForm, file: File | null) {
    const evidence: LeadershipEvidence = {
      id: createId("pesv-leadership-evidence"),
      fileName: form.fileName.trim() || file?.name || "acta-liderazgo-pesv.pdf",
      description: form.description.trim(),
      uploadedAt: new Date().toISOString(),
      mimeType: file?.type || "text/plain",
      url: file ? URL.createObjectURL(file) : undefined,
    }

    const nextRecords = records.map((record) => {
      if (record.id !== recordId) return record
      const nextRecord = { ...record, evidence, updatedAt: evidence.uploadedAt }
      return { ...nextRecord, status: resolveStatus(nextRecord) }
    })

    persist(nextRecords)
    toast.success("Evidencia cargada")
  }

  function deleteRecord(record: PesvLeadershipRecord) {
    if (!window.confirm(`Eliminar el registro de liderazgo ${record.year}?`)) return
    persist(records.filter((current) => current.id !== record.id))
    toast.success("Registro eliminado")
  }

  function viewEvidence(record: PesvLeadershipRecord) {
    if (!record.evidence) {
      toast.error("Este registro no tiene evidencia cargada")
      return
    }

    if (record.evidence.url) {
      setPreview({
        title: record.evidence.fileName,
        url: record.evidence.url,
        mimeType: record.evidence.mimeType || "application/octet-stream",
        generated: false,
      })
      return
    }

    const blob = new Blob([buildEvidenceText(record, record.evidence)], { type: "text/plain;charset=utf-8" })
    setPreview({
      title: record.evidence.fileName,
      url: URL.createObjectURL(blob),
      mimeType: "text/plain",
      generated: true,
    })
  }

  function closePreview() {
    if (preview?.generated) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  function downloadEvidence(record: PesvLeadershipRecord) {
    if (!record.evidence) {
      toast.error("Este registro no tiene evidencia cargada")
      return
    }

    const url =
      record.evidence.url ??
      URL.createObjectURL(new Blob([buildEvidenceText(record, record.evidence)], { type: "text/plain;charset=utf-8" }))

    const link = document.createElement("a")
    link.href = url
    link.download = record.evidence.fileName
    link.click()

    if (!record.evidence.url) URL.revokeObjectURL(url)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liderazgo Directivo PESV</h1>
          <p className="text-muted-foreground">
            Evidencia el liderazgo, compromiso y corresponsabilidad de la alta dirección frente al PESV.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditingRecord(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo registro
        </Button>
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Registros</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cumplidos</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pendientes evidencia</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">{stats.pendingEvidence}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avance promedio</p>
            <p className="mt-2 text-2xl font-bold text-primary">{stats.average}%</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Registros de compromiso directivo</h2>
              <p className="text-sm text-muted-foreground">Crea el registro, descarga el documento para firma y luego carga su evidencia.</p>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar registro" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Año</th>
                  <th className="px-4 py-3 font-medium">Directivo</th>
                  <th className="px-4 py-3 font-medium">Revisión</th>
                  <th className="px-4 py-3 font-medium">Comité</th>
                  <th className="px-4 py-3 font-medium">Avance</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Evidencia</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 font-medium text-foreground">{record.year}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{record.directorName}</p>
                      <p className="text-xs text-muted-foreground">{record.directorRole}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(record.reviewDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {formatDate(record.committeeMeetingDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full bg-primary" style={{ width: `${completionPercentage(record)}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{completionPercentage(record)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusClassName(record.status)}>
                        {statusLabels[record.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {record.evidence ? (
                        <span className="inline-flex items-center gap-2 text-emerald-700">
                          <FileCheck2 className="h-4 w-4" />
                          Cargada
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pendiente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60">
                          <DropdownMenuItem onSelect={() => downloadLeadershipPdf(record)}>
                            <Download className="h-4 w-4" />
                            Descargar documento
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => viewEvidence(record)} disabled={!record.evidence}>
                            <Eye className="h-4 w-4" />
                            Ver evidencia
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => downloadEvidence(record)} disabled={!record.evidence}>
                            <Download className="h-4 w-4" />
                            Descargar evidencia
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEvidenceRecord(record)}>
                            <Upload className="h-4 w-4" />
                            {record.evidence ? "Actualizar evidencia" : "Cargar evidencia"}
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
                          <DropdownMenuItem className="text-destructive" onSelect={() => deleteRecord(record)}>
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <LeadershipDialog
        open={dialogOpen}
        record={editingRecord}
        onClose={() => {
          setDialogOpen(false)
          setEditingRecord(null)
        }}
        onSave={saveRecord}
      />
      <EvidenceDialog record={evidenceRecord} onClose={() => setEvidenceRecord(null)} onSave={saveEvidence} />
      <EvidencePreviewDialog preview={preview} onClose={closePreview} />
    </main>
  )
}
