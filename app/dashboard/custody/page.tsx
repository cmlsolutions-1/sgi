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
  Loader2,
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
import { FormDialogIcon, FormSectionTitle } from "@/components/ui/form-dialog-visuals"
import { Textarea } from "@/components/ui/textarea"
import {
  createCustodyRecord,
  deleteCustodyDocument,
  deleteCustodyRecord,
  downloadCustodyCommitment,
  downloadCustodyDocument,
  getCustodyRecord,
  getCustodySummary,
  listCustodyRecords,
  updateCustodyRecord,
  uploadCustodyDocument,
} from "@/services/custodyService"
import type { CustodyDocument, CustodyRecord, CustodySummary } from "@/types/manager/custody"

type EvidenceKind = "custody" | "confidentiality"

type CustodyForm = {
  custodianInstitution: string
  responsiblePerson: string
  custodyStartDate: string
  observations: string
}

type EvidenceForm = {
  description: string
}

type PreviewState = {
  title: string
  url: string
  mimeType: string
}

const emptyForm: CustodyForm = {
  custodianInstitution: "",
  responsiblePerson: "",
  custodyStartDate: new Date().toISOString().slice(0, 10),
  observations: "",
}

const emptyEvidenceForm: EvidenceForm = {
  description: "",
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

function evidenceFor(record: CustodyRecord, kind: EvidenceKind): CustodyDocument | null | undefined {
  return kind === "custody" ? record.custodyEvidence : record.confidentialityEvidence
}

function evidenceLabel(kind: EvidenceKind) {
  return kind === "custody" ? "soporte de custodia" : "compromiso de confidencialidad"
}

type MetricTone = "default" | "blue" | "green" | "amber"

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: MetricTone }) {
  const toneClasses =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-900"

  return (
    <div className={`flex min-h-14 items-center gap-3 rounded-lg border px-3.5 py-2 ${toneClasses}`}>
      <span className="text-xl font-bold leading-none">{value}</span>
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </div>
  )
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
  onSave: (form: CustodyForm, recordId?: string) => Promise<void>
}) {
  const [form, setForm] = useState<CustodyForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const editing = Boolean(record)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            custodianInstitution: record.custodianInstitution,
            responsiblePerson: record.responsiblePerson,
            custodyStartDate: record.custodyStartDate,
            observations: record.observations ?? "",
          }
        : emptyForm,
    )
  }, [open, record])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.custodianInstitution.trim()) return toast.error("Ingresa la institucion custodio")
    if (!form.responsiblePerson.trim()) return toast.error("Ingresa la persona responsable")
    if (!form.custodyStartDate) return toast.error("Selecciona la fecha de inicio de custodia")

    try {
      setSaving(true)
      await onSave(form, record?.id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-6 py-4 pr-12">
          <div className="flex items-start gap-3 text-left">
            <FormDialogIcon icon="custody" tone="blue" />
            <div>
              <DialogTitle>{editing ? "Editar custodia" : "Nueva custodia"}</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Registra quién custodia las historias clínicas ocupacionales y define el responsable del manejo documental.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/40 px-6 py-5">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="custody" title="Custodio y responsable" description="Identifica la IPS o profesional encargado y la persona responsable de la custodia." tone="blue" />
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  Institución custodio (IPS)
                  <Input
                    value={form.custodianInstitution}
                    onChange={(event) => setForm((current) => ({ ...current, custodianInstitution: event.target.value }))}
                    placeholder="IPS o médico que custodia"
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
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="details" title="Vigencia y alcance" description="Define desde cuándo inicia la custodia y registra información complementaria." tone="cyan" />
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <Label className="grid gap-2">
                  Fecha de inicio
                  <Input
                    type="date"
                    value={form.custodyStartDate}
                    onChange={(event) => setForm((current) => ({ ...current, custodyStartDate: event.target.value }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Observaciones
                  <Textarea
                    value={form.observations}
                    onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
                    placeholder="Describe el alcance, condiciones o información relevante de la custodia"
                    rows={4}
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-blue-200">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-950">Siguiente paso: cargar soportes</h3>
                  <p className="mt-1 text-xs leading-relaxed text-blue-800/80">
                    Después de guardar, abre el menú de acciones del registro para cargar el soporte de custodia y el compromiso de confidencialidad firmado.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear custodia"}
            </Button>
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
  onSave: (recordId: string, kind: EvidenceKind, form: EvidenceForm, file: File | null) => Promise<void>
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!record) return
    const evidence = evidenceFor(record, kind)
    setForm({
      description: evidence?.description ?? "",
    })
    setFile(null)
  }, [kind, record])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!file) return toast.error(`Selecciona el ${evidenceLabel(kind)}`)

    try {
      setSaving(true)
      await onSave(record.id, kind, form, file)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-6 py-4 pr-12">
          <div className="flex items-start gap-3 text-left">
            <FormDialogIcon icon="document" tone={kind === "custody" ? "blue" : "emerald"} />
            <div>
              <DialogTitle>{kind === "custody" ? "Cargar soporte de custodia" : "Cargar compromiso firmado"}</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjunta el {evidenceLabel(kind)} para {record?.custodianInstitution ?? "el registro de custodia"}.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/40 px-6 py-5">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="document" title="Documento de soporte" description="Formatos permitidos: PDF, imagen o archivo de texto." tone="blue" />
              <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-4">
                <Label className="grid gap-2">
                  Seleccionar archivo
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                </Label>
                <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                  <p className="text-xs font-medium text-slate-500">Archivo seleccionado</p>
                  <p className="mt-0.5 truncate font-medium text-slate-800">
                    {file?.name ?? (record ? evidenceFor(record, kind)?.originalName : "") ?? "Ningún archivo seleccionado"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="details" title="Descripción" description="Añade una referencia que facilite la identificación del soporte." tone="cyan" />
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                placeholder="Observación o descripción del soporte cargado"
              />
            </section>
          </div>
          <DialogFooter className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {saving ? "Subiendo..." : "Guardar soporte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PreviewDialog({ preview, onClose }: { preview: PreviewState | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(preview)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-white p-0">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-6 py-4 pr-12">
          <div className="flex items-center gap-3 text-left">
            <FormDialogIcon icon="document" tone="blue" />
            <div>
              <DialogTitle>{preview?.title ?? "Soporte"}</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">Vista previa del documento asociado al registro.</p>
            </div>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-50/40 p-4">
          {preview && canEmbed(preview.mimeType) ? (
            preview.mimeType.startsWith("image/") ? (
              <img src={preview.url} alt={preview.title} className="mx-auto max-h-[70dvh] max-w-full rounded-lg border border-slate-200 bg-white object-contain" />
            ) : (
              <iframe title={preview.title} src={preview.url} className="h-[70dvh] w-full rounded-lg border border-slate-200 bg-white" />
            )
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-center text-muted-foreground">
              <FileText className="mb-3 h-10 w-10" />
              <p className="font-medium">Vista previa no disponible</p>
              <p className="text-sm">Puedes abrir o descargar el soporte desde las acciones.</p>
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
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
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default function CustodyPage() {
  const [records, setRecords] = useState<CustodyRecord[]>([])
  const [summary, setSummary] = useState<CustodySummary>({ total: 0, withCustodyEvidence: 0, withConfidentiality: 0, complete: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CustodyRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<CustodyRecord | null>(null)
  const [evidenceKind, setEvidenceKind] = useState<EvidenceKind>("custody")
  const [detailRecord, setDetailRecord] = useState<CustodyRecord | null>(null)
  const [preview, setPreview] = useState<PreviewState | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const [list, totals] = await Promise.all([
        listCustodyRecords({ page: 1, limit: 100 }),
        getCustodySummary(),
      ])
      setRecords(list.items)
      setSummary(totals)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los registros de custodia")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
  }, [preview])

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return records

    return records.filter(
      (record) =>
        record.custodianInstitution.toLowerCase().includes(term) ||
        record.responsiblePerson.toLowerCase().includes(term) ||
        record.custodyEvidence?.originalName.toLowerCase().includes(term) ||
        record.confidentialityEvidence?.originalName.toLowerCase().includes(term),
    )
  }, [records, search])

  async function saveRecord(form: CustodyForm, recordId?: string) {
    const payload = {
      custodianInstitution: form.custodianInstitution.trim(),
      responsiblePerson: form.responsiblePerson.trim(),
      custodyStartDate: form.custodyStartDate,
      observations: form.observations.trim(),
    }

    try {
      if (recordId) {
        await updateCustodyRecord(recordId, payload)
        toast.success("Custodia actualizada")
      } else {
        await createCustodyRecord(payload)
        toast.success("Custodia creada")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la custodia")
      throw error
    }
  }

  async function saveEvidence(recordId: string, kind: EvidenceKind, form: EvidenceForm, file: File | null) {
    if (!file) return
    try {
      await uploadCustodyDocument(recordId, {
        file,
        type: kind === "custody" ? "CUSTODY_SUPPORT" : "CONFIDENTIALITY_COMMITMENT_SIGNED",
        description: form.description.trim() || undefined,
        isConfirmed: true,
      })
      await loadData()
      toast.success(kind === "custody" ? "Soporte de custodia cargado" : "Compromiso de confidencialidad cargado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el documento")
      throw error
    }
  }

  async function deleteRecord(record: CustodyRecord) {
    if (!window.confirm(`Eliminar la custodia de "${record.custodianInstitution}"?`)) return
    try {
      await deleteCustodyRecord(record.id)
      await loadData()
      toast.success("Custodia eliminada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la custodia")
    }
  }

  async function downloadCommitment(record: CustodyRecord) {
    try {
      const blob = await downloadCustodyCommitment(record.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `compromiso-confidencialidad-${record.responsiblePerson.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el compromiso")
    }
  }

  async function openDetail(record: CustodyRecord) {
    try {
      setDetailRecord(await getCustodyRecord(record.id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el detalle de custodia")
    }
  }

  async function viewEvidence(record: CustodyRecord, kind: EvidenceKind) {
    const evidence = evidenceFor(record, kind)
    if (!evidence) {
      toast.error(`Este registro no tiene ${evidenceLabel(kind)}`)
      return
    }

    try {
      const blob = await downloadCustodyDocument(evidence.downloadUrl)
      const url = URL.createObjectURL(blob)
      setPreview({
        title: evidence.originalName,
        url,
        mimeType: blob.type || evidence.mimeType || "application/octet-stream",
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo previsualizar el documento")
    }
  }

  function closePreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  async function downloadEvidence(record: CustodyRecord, kind: EvidenceKind) {
    const evidence = evidenceFor(record, kind)
    if (!evidence) {
      toast.error(`Este registro no tiene ${evidenceLabel(kind)}`)
      return
    }

    try {
      const blob = await downloadCustodyDocument(evidence.downloadUrl)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = evidence.originalName
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el documento")
    }
  }

  async function removeEvidence(record: CustodyRecord, kind: EvidenceKind) {
    const evidence = evidenceFor(record, kind)
    if (!evidence || !window.confirm(`¿Eliminar ${evidence.originalName}?`)) return

    try {
      await deleteCustodyDocument(record.id, evidence.id)
      await loadData()
      if (detailRecord?.id === record.id) setDetailRecord(await getCustodyRecord(record.id))
      toast.success(kind === "custody" ? "Soporte de custodia eliminado" : "Compromiso firmado eliminado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el documento")
    }
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

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric label="Registros" value={summary.total} />
        <Metric label="Con soporte" value={summary.withCustodyEvidence} tone="blue" />
        <Metric label="Compromiso firmado" value={summary.withConfidentiality} tone="blue" />
        <Metric label="Completos" value={summary.complete} tone="green" />
        <Metric label="Pendientes" value={summary.pending} tone="amber" />
      </section>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Buscar registros</h2>
              <p className="text-sm text-muted-foreground">
                Filtra por institución, responsable o nombre del soporte cargado.
              </p>
            </div>
            <div className="relative w-full lg:w-[420px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="border-slate-300 bg-white pl-9"
                placeholder="Buscar por IPS, responsable o soporte"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Registros de custodia</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona los responsables, soportes y compromisos de confidencialidad.
          </p>
        </div>
        <p className="text-sm font-medium text-slate-600">{filteredRecords.length} registros encontrados</p>
      </div>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1160px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Institución custodio</th>
              <th className="px-4 py-3 font-medium">Responsable</th>
              <th className="px-4 py-3 font-medium">Inicio custodia</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Soporte custodia</th>
              <th className="px-4 py-3 font-medium">Confidencialidad</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="align-middle transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{record.custodianInstitution}</p>
                  <p className="max-w-[340px] truncate text-muted-foreground">{record.observations || "Sin observaciones"}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{record.responsiblePerson}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(record.custodyStartDate)}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      record.custodyEvidence && record.confidentialityEvidence
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }
                  >
                    {record.custodyEvidence && record.confidentialityEvidence ? "Completo" : "Pendiente"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {record.custodyEvidence ? (
                    <span className="flex max-w-[220px] items-center gap-2 text-muted-foreground">
                      <FileCheck2 className="h-4 w-4 shrink-0 text-blue-600" />
                      <span className="truncate">{record.custodyEvidence.originalName}</span>
                    </span>
                  ) : (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                      Sin soporte
                    </Badge>
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
                      <DropdownMenuItem onSelect={() => void openDetail(record)}>
                        <Eye className="h-4 w-4" />
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void downloadCommitment(record)}>
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
                      <DropdownMenuItem onSelect={() => void viewEvidence(record, "custody")} disabled={!record.custodyEvidence}>
                        <FileText className="h-4 w-4" />
                        Ver soporte de custodia
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void downloadEvidence(record, "custody")} disabled={!record.custodyEvidence}>
                        <Download className="h-4 w-4" />
                        Descargar soporte de custodia
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void viewEvidence(record, "confidentiality")} disabled={!record.confidentialityEvidence}>
                        <FileText className="h-4 w-4" />
                        Ver compromiso firmado
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void downloadEvidence(record, "confidentiality")} disabled={!record.confidentialityEvidence}>
                        <Download className="h-4 w-4" />
                        Descargar compromiso firmado
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void removeEvidence(record, "custody")} disabled={!record.custodyEvidence} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Eliminar soporte de custodia
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void removeEvidence(record, "confidentiality")} disabled={!record.confidentialityEvidence} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Eliminar compromiso firmado
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
                      <DropdownMenuItem onSelect={() => void deleteRecord(record)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {!loading && filteredRecords.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No hay registros de custodia para mostrar.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-blue-600" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-blue-200">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-950">Criterio de cumplimiento</h3>
            <p className="mt-1 text-sm leading-relaxed text-blue-900/75">
              El registro queda completo cuando existe soporte que demuestre que la custodia está a cargo de una IPS o médico evaluador
              y cuando el responsable firma el compromiso de confidencialidad por el manejo de información sensible.
            </p>
          </div>
        </div>
      </section>

      <Dialog open={Boolean(detailRecord)} onOpenChange={(nextOpen) => !nextOpen && setDetailRecord(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl gap-0 overflow-hidden bg-white p-0 sm:max-w-4xl">
          <DialogHeader className="border-b border-slate-200 bg-slate-50/70 px-6 py-4 pr-12">
            <div className="flex items-start gap-3 text-left">
              <FormDialogIcon icon="custody" tone="blue" />
              <div>
                <DialogTitle>Detalle de custodia</DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">Consulta el responsable, la vigencia y el estado de sus soportes.</p>
              </div>
            </div>
          </DialogHeader>
          {detailRecord && (
            <div className="max-h-[calc(100dvh-11rem)] space-y-4 overflow-y-auto bg-slate-50/40 px-6 py-5">
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <FormSectionTitle icon="custody" title="Información de la custodia" description="Datos de la institución y persona responsable." tone="blue" />
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBlock label="Institución custodio" value={detailRecord.custodianInstitution} />
                  <InfoBlock label="Persona responsable" value={detailRecord.responsiblePerson} />
                  <InfoBlock label="Inicio custodia" value={formatDate(detailRecord.custodyStartDate)} />
                  <InfoBlock label="Estado" value={detailRecord.custodyEvidence && detailRecord.confidentialityEvidence ? "Completo" : "Pendiente"} />
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 md:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Observaciones</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{detailRecord.observations || "Sin observaciones"}</p>
                  </div>
                </div>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <FormSectionTitle icon="document" title="Evidencias documentales" description="Estado de los documentos requeridos para completar el registro." tone="cyan" />
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBlock
                    label="Soporte custodia"
                    value={
                      detailRecord.custodyEvidence
                        ? `${detailRecord.custodyEvidence.originalName} · ${formatDateTime(detailRecord.custodyEvidence.createdAt)}`
                        : "Sin soporte"
                    }
                  />
                  <InfoBlock
                    label="Compromiso confidencialidad"
                    value={
                      detailRecord.confidentialityEvidence
                        ? `${detailRecord.confidentialityEvidence.originalName} · ${formatDateTime(detailRecord.confidentialityEvidence.createdAt)}`
                        : "Pendiente de firma"
                    }
                  />
                </div>
              </section>
            </div>
          )}
          <DialogFooter className="border-t border-slate-200 bg-white px-6 py-4">
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
