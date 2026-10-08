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
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear custodia"}</Button>
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
                }}
              />
            </Label>
            <Label className="grid gap-2">
              Archivo seleccionado
              <Input
                value={file?.name ?? (record ? evidenceFor(record, kind)?.originalName : "") ?? ""}
                readOnly
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
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "Subiendo..." : "Guardar soporte"}</Button>
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

      <section className="overflow-x-auto px-3 py-1">
        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 [&>div]:min-h-14 [&>div]:flex-row-reverse [&>div]:justify-end [&>div]:rounded-lg [&>div]:border [&>div]:border-slate-200 [&>div]:bg-slate-50 [&>div]:px-3.5 [&>div]:py-2 [&>div>span:last-child]:text-xl [&>div>span:last-child]:font-bold [&>div>span:last-child]:leading-none">
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-semibold">{summary.total}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Soporte custodia</span>
            <span className="text-sm font-semibold text-primary">{summary.withCustodyEvidence}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Compromiso firmado</span>
            <span className="text-sm font-semibold text-green-700">{summary.withConfidentiality}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Completos</span>
            <span className="text-sm font-semibold">{summary.complete}</span>
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
                      {record.custodyEvidence.originalName}
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
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No hay registros de custodia para mostrar.
                </td>
              </tr>
            )}
            {loading && <tr><td colSpan={6} className="px-4 py-10"><div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></td></tr>}
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
