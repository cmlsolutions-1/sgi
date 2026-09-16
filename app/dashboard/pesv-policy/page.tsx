"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Download,
  Edit,
  Eye,
  FileCheck2,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
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

type PolicyEvidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
  mimeType?: string
  url?: string
}

type PesvPolicy = {
  id: string
  name: string
  version: string
  issueDate: string
  nextReviewDate: string
  legalRepresentative: string
  scope: string
  commitments: string
  riskFit: string
  objectiveFramework: string
  legalCompliance: string
  continuousImprovement: string
  socializationMeans: string
  accessibilityLocation: string
  status: "DRAFT" | "ACTIVE" | "UNDER_REVIEW"
  evidence?: PolicyEvidence
  createdAt: string
  updatedAt: string
}

type PolicyForm = Omit<PesvPolicy, "id" | "status" | "evidence" | "createdAt" | "updatedAt">

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

const STORAGE_KEY = "safecloud:pesv-policy"

const defaultPolicyForm: PolicyForm = {
  name: "Política de Seguridad Vial de la Organización",
  version: "1.0",
  issueDate: new Date().toISOString().slice(0, 10),
  nextReviewDate: `${new Date().getFullYear() + 3}-${new Date().toISOString().slice(5, 10)}`,
  legalRepresentative: "",
  scope:
    "Aplica a los desplazamientos laborales y trayectos en itinere de colaboradores, contratistas y demás actores relacionados con la operación de la organización.",
  commitments:
    "La alta dirección se compromete a suministrar los recursos humanos, técnicos, financieros y administrativos necesarios para planificar, implementar, hacer seguimiento y mejorar el PESV.",
  riskFit:
    "La política es adecuada al tamaño de la organización, sus actividades, sus procesos y la naturaleza de los riesgos en seguridad vial identificados.",
  objectiveFramework:
    "Esta política proporciona el marco de referencia para establecer objetivos, metas, indicadores y programas de gestión en seguridad vial.",
  legalCompliance:
    "La organización se compromete al cumplimiento de los requisitos legales aplicables en seguridad vial y demás obligaciones que suscriba.",
  continuousImprovement:
    "La organización se compromete con la mejora continua del PESV mediante seguimiento, evaluación de resultados y toma de decisiones basada en evidencias.",
  socializationMeans: "Inducción, reinducción, correo corporativo, cartelera y socializaciones internas.",
  accessibilityLocation: "Repositorio documental SafeCloud y medios internos de consulta.",
}

const initialPolicies: PesvPolicy[] = [
  {
    id: "pesv-policy-1",
    ...defaultPolicyForm,
    legalRepresentative: "Representante Legal",
    status: "ACTIVE",
    evidence: {
      id: "pesv-policy-evidence-1",
      fileName: "politica-seguridad-vial-firmada.pdf",
      description: "Documento firmado por representante legal y socializado a la organización.",
      uploadedAt: "2026-09-12T09:00:00",
      mimeType: "application/pdf",
    },
    createdAt: "2026-09-12T08:00:00",
    updatedAt: "2026-09-12T09:00:00",
  },
]

const statusLabels: Record<PesvPolicy["status"], string> = {
  DRAFT: "Borrador",
  ACTIVE: "Vigente",
  UNDER_REVIEW: "En revisión",
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

function readPolicies() {
  if (typeof window === "undefined") return initialPolicies

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PesvPolicy[]) : initialPolicies
  } catch {
    return initialPolicies
  }
}

function writePolicies(policies: PesvPolicy[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(policies))
}

function isReviewExpired(policy: PesvPolicy) {
  const reviewDate = new Date(`${policy.nextReviewDate}T00:00:00`)
  if (Number.isNaN(reviewDate.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return reviewDate < today
}

function statusClassName(policy: PesvPolicy) {
  if (isReviewExpired(policy)) return "border-destructive bg-destructive/10 text-destructive"
  if (policy.status === "ACTIVE") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-amber-200 bg-amber-50 text-amber-700"
}

function canEmbed(mimeType?: string) {
  return Boolean(mimeType?.startsWith("image/") || mimeType === "application/pdf" || mimeType?.startsWith("text/"))
}

function buildEvidenceText(policy: PesvPolicy, evidence: PolicyEvidence) {
  return `Politica de Seguridad Vial PESV
Politica: ${policy.name}
Version: ${policy.version}
Fecha: ${formatDate(policy.issueDate)}
Representante legal: ${policy.legalRepresentative}
Proxima revision: ${formatDate(policy.nextReviewDate)}

Documento: ${evidence.fileName}
Descripcion: ${evidence.description || "Sin descripcion"}
Cargado: ${formatDateTime(evidence.uploadedAt)}
`
}

function downloadPolicyPdf(policy: PesvPolicy) {
  const doc = new jsPDF("p", "mm", "a4")
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2
  let y = 18

  function addWrapped(title: string, content: string) {
    if (y > 245) {
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
  doc.setFontSize(13)
  doc.text("POLÍTICA DE SEGURIDAD VIAL", margin + 5, 24)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`PESV · Versión ${policy.version} · Fecha ${formatDate(policy.issueDate)}`, margin + 5, 31)

  y = 50
  const metadata = [
    ["Representante legal", policy.legalRepresentative || "Pendiente de firma"],
    ["Alcance", policy.scope],
    ["Próxima revisión", formatDate(policy.nextReviewDate)],
    ["Accesibilidad", policy.accessibilityLocation],
  ]

  metadata.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    doc.text(`${label}:`, margin, y)
    doc.setFont("helvetica", "normal")
    doc.text(doc.splitTextToSize(value, contentWidth - 44), margin + 44, y)
    y += 10
  })

  addWrapped("Compromiso de la alta dirección", policy.commitments)
  addWrapped("Adecuación a la organización y sus riesgos", policy.riskFit)
  addWrapped("Marco para objetivos de seguridad vial", policy.objectiveFramework)
  addWrapped("Cumplimiento legal aplicable", policy.legalCompliance)
  addWrapped("Mejora continua del PESV", policy.continuousImprovement)
  addWrapped("Socialización y disponibilidad", policy.socializationMeans)

  y = Math.max(y + 16, 232)
  if (y > 250) {
    doc.addPage()
    y = 220
  }
  doc.setDrawColor(120, 130, 140)
  doc.line(margin, y, margin + 78, y)
  doc.line(pageWidth - margin - 78, y, pageWidth - margin, y)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)
  doc.text("Firma representante legal", margin, y + 6)
  doc.text("Fecha de aprobación", pageWidth - margin - 78, y + 6)

  doc.setDrawColor(220, 226, 224)
  doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text("Documento generado desde SafeCloud", margin, pageHeight - 8)

  doc.save(`politica-seguridad-vial-v${policy.version.replace(/\s+/g, "_")}.pdf`)
}

function PolicyDialog({
  open,
  policy,
  onClose,
  onSave,
}: {
  open: boolean
  policy: PesvPolicy | null
  onClose: () => void
  onSave: (form: PolicyForm, policyId?: string) => void
}) {
  const [form, setForm] = useState<PolicyForm>(defaultPolicyForm)
  const editing = Boolean(policy)

  useEffect(() => {
    if (!open) return
    setForm(policy ? {
      name: policy.name,
      version: policy.version,
      issueDate: policy.issueDate,
      nextReviewDate: policy.nextReviewDate,
      legalRepresentative: policy.legalRepresentative,
      scope: policy.scope,
      commitments: policy.commitments,
      riskFit: policy.riskFit,
      objectiveFramework: policy.objectiveFramework,
      legalCompliance: policy.legalCompliance,
      continuousImprovement: policy.continuousImprovement,
      socializationMeans: policy.socializationMeans,
      accessibilityLocation: policy.accessibilityLocation,
    } : defaultPolicyForm)
  }, [open, policy])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim()) return toast.error("Ingresa el nombre de la política")
    if (!form.version.trim()) return toast.error("Ingresa la versión")
    if (!form.issueDate) return toast.error("Selecciona la fecha de emisión")
    if (!form.nextReviewDate) return toast.error("Selecciona la próxima revisión")
    if (!form.legalRepresentative.trim()) return toast.error("Ingresa el representante legal")
    if (!form.scope.trim()) return toast.error("Define el alcance de la política")
    if (!form.commitments.trim()) return toast.error("Registra los compromisos de la alta dirección")
    if (!form.legalCompliance.trim()) return toast.error("Incluye el compromiso de cumplimiento legal")
    if (!form.continuousImprovement.trim()) return toast.error("Incluye el compromiso de mejora continua")

    onSave(
      {
        ...form,
        name: form.name.trim(),
        version: form.version.trim(),
        legalRepresentative: form.legalRepresentative.trim(),
        scope: form.scope.trim(),
        commitments: form.commitments.trim(),
        riskFit: form.riskFit.trim(),
        objectiveFramework: form.objectiveFramework.trim(),
        legalCompliance: form.legalCompliance.trim(),
        continuousImprovement: form.continuousImprovement.trim(),
        socializationMeans: form.socializationMeans.trim(),
        accessibilityLocation: form.accessibilityLocation.trim(),
      },
      policy?.id,
    )
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Actualizar política de seguridad vial" : "Nueva política de seguridad vial"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Primero crea la política. Después descarga el PDF para firma y carga la evidencia firmada desde los 3 puntos.
          </p>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos del documento</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2 md:col-span-2">
                  Nombre de la política
                  <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </Label>
                <Label className="grid gap-2">
                  Versión
                  <Input value={form.version} onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))} />
                </Label>
                <Label className="grid gap-2">
                  Representante legal
                  <Input
                    value={form.legalRepresentative}
                    onChange={(event) => setForm((current) => ({ ...current, legalRepresentative: event.target.value }))}
                    placeholder="Nombre del representante legal"
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha de emisión
                  <Input type="date" value={form.issueDate} onChange={(event) => setForm((current) => ({ ...current, issueDate: event.target.value }))} />
                </Label>
                <Label className="grid gap-2">
                  Próxima revisión
                  <Input type="date" value={form.nextReviewDate} onChange={(event) => setForm((current) => ({ ...current, nextReviewDate: event.target.value }))} />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Contenido de la política</h3>
              <div className="grid gap-4">
                <Label className="grid gap-2">
                  Alcance
                  <Textarea value={form.scope} onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value }))} rows={3} />
                </Label>
                <Label className="grid gap-2">
                  Compromisos del nivel directivo
                  <Textarea value={form.commitments} onChange={(event) => setForm((current) => ({ ...current, commitments: event.target.value }))} rows={3} />
                </Label>
                <Label className="grid gap-2">
                  Adecuación a actividades, tamaño y riesgos
                  <Textarea value={form.riskFit} onChange={(event) => setForm((current) => ({ ...current, riskFit: event.target.value }))} rows={3} />
                </Label>
                <Label className="grid gap-2">
                  Marco de referencia para objetivos
                  <Textarea value={form.objectiveFramework} onChange={(event) => setForm((current) => ({ ...current, objectiveFramework: event.target.value }))} rows={3} />
                </Label>
                <Label className="grid gap-2">
                  Cumplimiento legal aplicable
                  <Textarea value={form.legalCompliance} onChange={(event) => setForm((current) => ({ ...current, legalCompliance: event.target.value }))} rows={3} />
                </Label>
                <Label className="grid gap-2">
                  Mejora continua del PESV
                  <Textarea value={form.continuousImprovement} onChange={(event) => setForm((current) => ({ ...current, continuousImprovement: event.target.value }))} rows={3} />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Socialización y accesibilidad</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  Medio de socialización
                  <Textarea value={form.socializationMeans} onChange={(event) => setForm((current) => ({ ...current, socializationMeans: event.target.value }))} rows={3} />
                </Label>
                <Label className="grid gap-2">
                  Lugar de consulta
                  <Textarea value={form.accessibilityLocation} onChange={(event) => setForm((current) => ({ ...current, accessibilityLocation: event.target.value }))} rows={3} />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Upload className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Documento firmado</h3>
                  <p className="text-sm text-muted-foreground">
                    El archivo firmado se carga después de crear la política, desde las acciones de la tabla.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Guardar cambios" : "Crear política"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  policy,
  onClose,
  onSave,
}: {
  policy: PesvPolicy | null
  onClose: () => void
  onSave: (policyId: string, form: EvidenceForm, file: File | null) => void
}) {
  const [form, setForm] = useState<EvidenceForm>({ fileName: "", description: "" })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!policy) return
    setForm({
      fileName: policy.evidence?.fileName ?? "",
      description: policy.evidence?.description ?? "",
    })
    setFile(null)
  }, [policy])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!policy) return
    if (!form.fileName.trim() && !file) return toast.error("Selecciona o registra el documento firmado")

    onSave(policy.id, form, file)
    onClose()
  }

  return (
    <Dialog open={Boolean(policy)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Cargar evidencia firmada</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Adjunta la política firmada por el representante legal para {policy?.name ?? "la política"}.
            </p>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Documento firmado
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
                placeholder="politica-seguridad-vial-firmada.pdf"
              />
            </Label>
            <Label className="grid gap-2 md:col-span-2">
              Descripción
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Observación del documento firmado o soporte de socialización"
                rows={3}
              />
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
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
          <DialogTitle>{preview?.title ?? "Documento firmado"}</DialogTitle>
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
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PesvPolicyPage() {
  const [policies, setPolicies] = useState<PesvPolicy[]>(initialPolicies)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<PesvPolicy | null>(null)
  const [evidencePolicy, setEvidencePolicy] = useState<PesvPolicy | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)

  useEffect(() => {
    setPolicies(readPolicies())
  }, [])

  const stats = useMemo(() => {
    return {
      total: policies.length,
      active: policies.filter((policy) => policy.status === "ACTIVE" && !isReviewExpired(policy)).length,
      pendingEvidence: policies.filter((policy) => !policy.evidence).length,
      expiredReview: policies.filter(isReviewExpired).length,
    }
  }, [policies])

  const filteredPolicies = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return policies
    return policies.filter((policy) =>
      `${policy.name} ${policy.version} ${policy.legalRepresentative} ${policy.scope}`.toLowerCase().includes(term),
    )
  }, [policies, search])

  function persist(nextPolicies: PesvPolicy[]) {
    setPolicies(nextPolicies)
    writePolicies(nextPolicies)
  }

  function savePolicy(form: PolicyForm, policyId?: string) {
    const now = new Date().toISOString()

    if (policyId) {
      persist(
        policies.map((policy) =>
          policy.id === policyId
            ? {
                ...policy,
                ...form,
                status: policy.evidence ? "ACTIVE" : "DRAFT",
                updatedAt: now,
              }
            : policy,
        ),
      )
      toast.success("Política de Seguridad Vial actualizada")
      return
    }

    persist([
      {
        id: createId("pesv-policy"),
        ...form,
        status: "DRAFT",
        createdAt: now,
        updatedAt: now,
      },
      ...policies,
    ])
    toast.success("Política creada. Ahora puedes descargarla para firma y cargar la evidencia.")
  }

  function saveEvidence(policyId: string, form: EvidenceForm, file: File | null) {
    const evidence: PolicyEvidence = {
      id: createId("pesv-policy-evidence"),
      fileName: form.fileName.trim() || file?.name || "politica-seguridad-vial-firmada.pdf",
      description: form.description.trim(),
      uploadedAt: new Date().toISOString(),
      mimeType: file?.type || "text/plain",
      url: file ? URL.createObjectURL(file) : undefined,
    }

    const nextPolicies = policies.map((policy) =>
      policy.id === policyId ? { ...policy, evidence, status: "ACTIVE" as const, updatedAt: evidence.uploadedAt } : policy,
    )

    persist(nextPolicies)
    setEvidencePolicy((current) => (current?.id === policyId ? { ...current, evidence, status: "ACTIVE" } : current))
    toast.success("Evidencia firmada cargada")
  }

  function deletePolicy(policy: PesvPolicy) {
    if (!window.confirm(`Eliminar la política ${policy.name}?`)) return
    persist(policies.filter((current) => current.id !== policy.id))
    toast.success("Política eliminada")
  }

  function viewEvidence(policy: PesvPolicy) {
    if (!policy.evidence) {
      toast.error("Esta política no tiene documento firmado cargado")
      return
    }

    if (policy.evidence.url) {
      setPreview({
        title: policy.evidence.fileName,
        url: policy.evidence.url,
        mimeType: policy.evidence.mimeType || "application/octet-stream",
        generated: false,
      })
      return
    }

    const blob = new Blob([buildEvidenceText(policy, policy.evidence)], { type: "text/plain;charset=utf-8" })
    setPreview({
      title: policy.evidence.fileName,
      url: URL.createObjectURL(blob),
      mimeType: "text/plain",
      generated: true,
    })
  }

  function closePreview() {
    if (preview?.generated) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  function downloadEvidence(policy: PesvPolicy) {
    if (!policy.evidence) {
      toast.error("Esta política no tiene documento firmado cargado")
      return
    }

    const url =
      policy.evidence.url ??
      URL.createObjectURL(new Blob([buildEvidenceText(policy, policy.evidence)], { type: "text/plain;charset=utf-8" }))

    const link = document.createElement("a")
    link.href = url
    link.download = policy.evidence.fileName
    link.click()

    if (!policy.evidence.url) URL.revokeObjectURL(url)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Política de Seguridad Vial</h1>
          <p className="text-muted-foreground">
            Documenta la política del PESV, su revisión trianual, socialización y evidencia firmada por la dirección.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditingPolicy(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nueva política
        </Button>
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Políticas</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Vigentes</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pendientes de firma</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">{stats.pendingEvidence}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Revisión vencida</p>
            <p className="mt-2 text-2xl font-bold text-destructive">{stats.expiredReview}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Listado de políticas</h2>
              <p className="text-sm text-muted-foreground">Crea la política, descarga el PDF y carga la evidencia firmada desde acciones.</p>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar política" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Política</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Próxima revisión</th>
                  <th className="px-4 py-3 font-medium">Representante</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Evidencia</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPolicies.map((policy) => (
                  <tr key={policy.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{policy.name}</p>
                      <p className="text-xs text-muted-foreground">Versión {policy.version}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(policy.issueDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {formatDate(policy.nextReviewDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{policy.legalRepresentative}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusClassName(policy)}>
                        {isReviewExpired(policy) ? "Revisión vencida" : statusLabels[policy.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {policy.evidence ? (
                        <span className="inline-flex items-center gap-2 text-sm text-emerald-700">
                          <FileCheck2 className="h-4 w-4" />
                          Firmada
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Pendiente</span>
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
                          <DropdownMenuItem onSelect={() => downloadPolicyPdf(policy)}>
                            <Download className="h-4 w-4" />
                            Descargar PDF para firma
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => viewEvidence(policy)} disabled={!policy.evidence}>
                            <Eye className="h-4 w-4" />
                            Ver evidencia
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => downloadEvidence(policy)} disabled={!policy.evidence}>
                            <Download className="h-4 w-4" />
                            Descargar evidencia
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEvidencePolicy(policy)}>
                            <Upload className="h-4 w-4" />
                            {policy.evidence ? "Actualizar evidencia" : "Cargar evidencia"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditingPolicy(policy)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onSelect={() => deletePolicy(policy)}>
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

      <PolicyDialog
        open={dialogOpen}
        policy={editingPolicy}
        onClose={() => {
          setDialogOpen(false)
          setEditingPolicy(null)
        }}
        onSave={savePolicy}
      />
      <EvidenceDialog policy={evidencePolicy} onClose={() => setEvidencePolicy(null)} onSave={saveEvidence} />
      <EvidencePreviewDialog preview={preview} onClose={closePreview} />
    </main>
  )
}
