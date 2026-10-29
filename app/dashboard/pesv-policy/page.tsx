"use client"

import { loadPesv, pesvVersion, savePesv, deletePesv, uploadPesvDocument, pesvBlob, pesvDocumentUrl, downloadPesv, pesvPath, pesvRequest } from "@/services/pesvService"

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
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormDialogIcon, FormSectionTitle } from "@/components/ui/form-dialog-visuals"
import { SafeCloudFormDrawerFrame } from "@/components/ui/safecloud-form-drawer"
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
import { PesvModuleHeader } from "@/components/pesv/module-experience"
import { KpiStrip } from "@/components/dashboard/kpi-strip"

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

const statusLabels: Record<PesvPolicy["status"], string> = {
  DRAFT: "Borrador",
  ACTIVE: "Vigente",
  UNDER_REVIEW: "En revisión",
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

function PolicyDialog({
  open,
  policy,
  onClose,
  onSave,
}: {
  open: boolean
  policy: PesvPolicy | null
  onClose: () => void
  onSave: (form: PolicyForm, policyId?: string) => Promise<boolean>
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

  async function submit(event: FormEvent<HTMLFormElement>) {
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

    const saved = await onSave(
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
    if (saved) onClose()
  }

  return (
    <SafeCloudFormDrawerFrame open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/75 px-6 py-4 pr-12">
          <div className="flex min-w-0 items-start gap-3">
            <FormDialogIcon icon="document" tone="blue" />
            <div className="min-w-0">
              <DialogTitle>{editing ? "Actualizar política de seguridad vial" : "Nueva política de seguridad vial"}</DialogTitle>
              <p className="mt-1 text-sm text-slate-600">Primero crea la política. Después descarga el PDF para firma y carga la evidencia firmada desde los 3 puntos.</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto bg-slate-50/40 px-6 py-5">
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="document" title="Datos del documento" />
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

            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="prevention" title="Contenido de la política" />
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

            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="meeting" title="Socialización y accesibilidad" />
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
    </SafeCloudFormDrawerFrame>
  )
}

function EvidenceDialog({
  policy,
  onClose,
  onSave,
}: {
  policy: PesvPolicy | null
  onClose: () => void
  onSave: (policyId: string, form: EvidenceForm, file: File | null) => Promise<boolean>
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!policy) return
    if (!form.fileName.trim() && !file) return toast.error("Selecciona o registra el documento firmado")

    const saved = await onSave(policy.id, form, file)
    if (saved) onClose()
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
  const [policies, setPolicies] = useState<PesvPolicy[]>([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<PesvPolicy | null>(null)
  const [evidencePolicy, setEvidencePolicy] = useState<PesvPolicy | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)

  const [loadError, setLoadError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  async function reload() {
    const result = await loadPesv<PesvPolicy>("policies")
    setPolicies(result)
    setLoadError("")
  }
  useEffect(() => { let active = true; loadPesv<PesvPolicy>("policies").then(result => { if (active) setPolicies(result) }).catch(error => { if (active) setLoadError(error.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])

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

  async function savePolicy(form: PolicyForm, id?: string): Promise<boolean> {
    if (saving) return false
    setSaving(true)
    try {
      await savePesv("policies", { ...form, ...pesvVersion(policies.find(item => item.id === id)) }, id)
      await reload().catch(error => { toast.error("Cambios guardados, pero no se pudo actualizar la vista: " + error.message) })
      toast.success(id ? "Registro actualizado" : "Registro creado")
      return true
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar"); return false }
    finally { setSaving(false) }
  }
  async function saveEvidence(id: string, form: EvidenceForm, file: File | null): Promise<boolean> {
    if (!file) { toast.error("Selecciona el archivo que deseas cargar"); return false }
    if (saving) return false
    setSaving(true)
    try { await uploadPesvDocument("policies", id, file, form.description); await reload().catch(error => { toast.error("Cambios guardados, pero no se pudo actualizar la vista: " + error.message) }); toast.success("Evidencia cargada"); return true }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo cargar"); return false }
    finally { setSaving(false) }
  }
  async function deletePolicy(policy: PesvPolicy) {
    if (saving || !window.confirm("¿Eliminar este registro?")) return
    setSaving(true)
    try { await deletePesv("policies", policy.id); await reload().catch(error => { toast.error("Cambios guardados, pero no se pudo actualizar la vista: " + error.message) }); toast.success("Registro eliminado") }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo eliminar") }
    finally { setSaving(false) }
  }
  async function viewEvidence(policy: PesvPolicy) {
    if (!policy.evidence) return
    try { const blob = await pesvBlob(pesvDocumentUrl("policies", policy.id, policy.evidence.id), policy.evidence.mimeType); setPreview({ title: policy.evidence.fileName, url: URL.createObjectURL(blob), mimeType: blob.type || policy.evidence.mimeType || "application/octet-stream", generated: true }) }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento") }
  }
  function closePreview() { if (preview) URL.revokeObjectURL(preview.url); setPreview(null) }
  function downloadEvidence(policy: PesvPolicy) {
    if (!policy.evidence) return
    void downloadPesv(pesvDocumentUrl("policies", policy.id, policy.evidence.id), policy.evidence.fileName).catch(error => toast.error(error.message))
  }

  return (
    <main className="space-y-6">
      {loading && <p role="status">Cargando registros…</p>}
      {loadError && <div role="alert" className="border-l-2 border-red-500 p-3 text-sm text-red-700">{loadError}<Button variant="outline" onClick={() => { void reload().catch(error => setLoadError(error.message)) }}>Reintentar</Button></div>}
      <PesvModuleHeader title="Política de Seguridad Vial" description="Documenta la política del PESV, su revisión trianual, socialización y evidencia firmada por la dirección." icon={FileText} actions={
        <Button
          className="w-full gap-2 sm:w-auto"
          onClick={() => {
            setEditingPolicy(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nueva política
        </Button>
      } />

      <KpiStrip items={[
        { title: "Políticas", value: stats.total, description: "Versiones registradas", icon: "document", tone: "blue" },
        { title: "Vigentes", value: stats.active, description: "Aplicación actual", icon: "active", tone: "green" },
        { title: "Pendientes de firma", value: stats.pendingEvidence, description: "Sin soporte firmado", icon: "pending", tone: "amber" },
        { title: "Revisión vencida", value: stats.expiredReview, description: "Requieren actualización", icon: "overdue", tone: "red" },
      ]} />

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
                          <DropdownMenuItem onSelect={() => { void downloadPesv(`${pesvPath("policies", policy.id)}/export`, "pesv-policies.pdf").catch(error => toast.error(error.message)) }}>
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
