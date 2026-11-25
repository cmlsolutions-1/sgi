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
  Handshake,
  MoreHorizontal,
  Plus,
  Search,
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

const statusLabels: Record<PesvLeadershipRecord["status"], string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En ejecución",
  COMPLETED: "Cumplido",
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

function LeadershipDialog({
  open,
  record,
  onClose,
  onSave,
}: {
  open: boolean
  record: PesvLeadershipRecord | null
  onClose: () => void
  onSave: (form: LeadershipForm, recordId?: string) => Promise<boolean>
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.year) return toast.error("Ingresa el año")
    if (!form.directorName.trim()) return toast.error("Ingresa el directivo responsable")
    if (!form.directorRole.trim()) return toast.error("Ingresa el cargo del directivo")
    if (!form.reviewDate) return toast.error("Selecciona la fecha de revisión")
    if (!form.strategicAlignment.trim()) return toast.error("Registra la alineación estratégica")
    if (!form.resourcesAssigned.trim()) return toast.error("Registra los recursos asignados")

    const saved = await onSave(
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
    if (saved) onClose()
  }

  return (
    <SafeCloudFormDrawerFrame open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/75 px-6 py-4 pr-12">
          <div className="flex min-w-0 items-start gap-3">
            <FormDialogIcon icon="accountability" tone="blue" />
            <div className="min-w-0">
              <DialogTitle>{editing ? "Actualizar liderazgo directivo" : "Nuevo liderazgo directivo PESV"}</DialogTitle>
              <p className="mt-1 text-sm text-slate-600">Primero registra el compromiso directivo. La evidencia firmada se carga después desde las acciones.</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto bg-slate-50/40 px-6 py-5">
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="accountability" title="Datos generales" />
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

            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="analytics" title="Gestión del compromiso" />
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

            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="prevention" title="Verificación de literales" />
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

            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="details" title="Observaciones" />
              <Label className="grid gap-2">
                Observaciones
                <Textarea value={form.observations} onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))} rows={3} />
              </Label>
            </section>

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
    </SafeCloudFormDrawerFrame>
  )
}

function EvidenceDialog({
  record,
  onClose,
  onSave,
}: {
  record: PesvLeadershipRecord | null
  onClose: () => void
  onSave: (recordId: string, form: EvidenceForm, file: File | null) => Promise<boolean>
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.fileName.trim() && !file) return toast.error("Selecciona o registra el nombre de la evidencia")

    const saved = await onSave(record.id, form, file)
    if (saved) onClose()
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
  const [records, setRecords] = useState<PesvLeadershipRecord[]>([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PesvLeadershipRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<PesvLeadershipRecord | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)

  const [loadError, setLoadError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  async function reload() {
    const result = await loadPesv<PesvLeadershipRecord>("leadership")
    setRecords(result)
    setLoadError("")
  }
  useEffect(() => { let active = true; loadPesv<PesvLeadershipRecord>("leadership").then(result => { if (active) setRecords(result) }).catch(error => { if (active) setLoadError(error.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])

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

  async function saveRecord(form: LeadershipForm, id?: string): Promise<boolean> {
    if (saving) return false
    setSaving(true)
    try {
      await savePesv("leadership", { ...form, ...pesvVersion(records.find(item => item.id === id)) }, id)
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
    try { await uploadPesvDocument("leadership", id, file, form.description); await reload().catch(error => { toast.error("Cambios guardados, pero no se pudo actualizar la vista: " + error.message) }); toast.success("Evidencia cargada"); return true }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo cargar"); return false }
    finally { setSaving(false) }
  }
  async function deleteRecord(record: PesvLeadershipRecord) {
    if (saving || !window.confirm("¿Eliminar este registro?")) return
    setSaving(true)
    try { await deletePesv("leadership", record.id); await reload().catch(error => { toast.error("Cambios guardados, pero no se pudo actualizar la vista: " + error.message) }); toast.success("Registro eliminado") }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo eliminar") }
    finally { setSaving(false) }
  }
  async function viewEvidence(record: PesvLeadershipRecord) {
    if (!record.evidence) return
    try { const blob = await pesvBlob(pesvDocumentUrl("leadership", record.id, record.evidence.id), record.evidence.mimeType); setPreview({ title: record.evidence.fileName, url: URL.createObjectURL(blob), mimeType: blob.type || record.evidence.mimeType || "application/octet-stream", generated: true }) }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento") }
  }
  function closePreview() { if (preview) URL.revokeObjectURL(preview.url); setPreview(null) }
  function downloadEvidence(record: PesvLeadershipRecord) {
    if (!record.evidence) return
    void downloadPesv(pesvDocumentUrl("leadership", record.id, record.evidence.id), record.evidence.fileName).catch(error => toast.error(error.message))
  }

  return (
    <main className="space-y-6">
      {loading && <p role="status">Cargando registros…</p>}
      {loadError && <div role="alert" className="border-l-2 border-red-500 p-3 text-sm text-red-700">{loadError}<Button variant="outline" onClick={() => { void reload().catch(error => setLoadError(error.message)) }}>Reintentar</Button></div>}
      <PesvModuleHeader title="Liderazgo Directivo" description="Evidencia el liderazgo, compromiso y corresponsabilidad de la alta dirección frente al PESV." icon={Handshake} actions={
        <Button
          className="w-full gap-2 sm:w-auto"
          onClick={() => {
            setEditingRecord(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo registro
        </Button>
      } />

      <KpiStrip items={[
        { title: "Registros", value: stats.total, description: "Compromisos documentados", icon: "total", tone: "blue" },
        { title: "Cumplidos", value: stats.completed, description: "Verificación completada", icon: "completed", tone: "green" },
        { title: "Pendientes evidencia", value: stats.pendingEvidence, description: "Soporte por cargar", icon: "evidence", tone: "amber" },
        { title: "Avance promedio", value: `${stats.average}%`, description: "Literales verificados", icon: "progress", tone: "cyan" },
      ]} />

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
                          <DropdownMenuItem onSelect={() => { void downloadPesv(`${pesvPath("leadership", record.id)}/export`, "pesv-leadership.pdf").catch(error => toast.error(error.message)) }}>
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
