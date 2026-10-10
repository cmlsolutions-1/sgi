"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  Download,
  Edit,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  ScrollText,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  createLegalMatrixItem,
  deleteLegalMatrixItem,
  downloadLegalMatrixEvidence,
  listLegalMatrixItems,
  updateLegalMatrixItem,
  uploadLegalMatrixEvidence,
} from "@/services/legalMatrixService"
import type { LegalDocumentType, LegalMatrixItem, UpsertLegalMatrixDto } from "@/types/manager/legal-matrix"

type LegalMatrixForm = {
  documentType: LegalDocumentType
  customDocumentType: string
  normNumber: string
  emissionDate: string
  expirationDate: string
  issuedBy: string
}

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

const emptyForm: LegalMatrixForm = {
  documentType: "LEY",
  customDocumentType: "",
  normNumber: "",
  emissionDate: "",
  expirationDate: "",
  issuedBy: "",
}

const emptyEvidenceForm: EvidenceForm = {
  fileName: "",
  description: "",
}

const documentTypeOptions: Array<{ value: LegalDocumentType; label: string }> = [
  { value: "LEY", label: "Ley" },
  { value: "DECRETO", label: "Decreto" },
  { value: "RESOLUCION", label: "Resolucion" },
  { value: "CIRCULAR", label: "Circular" },
  { value: "NORMA_TECNICA", label: "Norma tecnica" },
  { value: "OTRO", label: "Otro" },
]

function documentTypeLabel(item: Pick<LegalMatrixItem, "documentType" | "customDocumentType">) {
  if (item.documentType === "OTRO") return item.customDocumentType?.trim() || "Otro"
  return documentTypeOptions.find((option) => option.value === item.documentType)?.label ?? item.documentType
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function getDatePart(value: string, part: "day" | "month" | "year") {
  if (!value) return "-"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return "-"

  if (part === "day") return String(date.getDate()).padStart(2, "0")
  if (part === "year") return String(date.getFullYear())

  return new Intl.DateTimeFormat("es-CO", { month: "long" }).format(date).toUpperCase()
}

function statusLabel(item: LegalMatrixItem) {
  return item.status === "EXPIRED" ? "Vencido" : "Vigente"
}

function statusClassName(item: LegalMatrixItem) {
  return item.status === "EXPIRED"
    ? "border-destructive bg-destructive/10 text-destructive"
    : "border-emerald-200 bg-emerald-50 text-emerald-700"
}

function canEmbed(mimeType?: string) {
  return Boolean(mimeType?.startsWith("image/") || mimeType === "application/pdf" || mimeType?.startsWith("text/"))
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function LegalMatrixDialog({
  open,
  item,
  saving,
  onClose,
  onSave,
}: {
  open: boolean
  item: LegalMatrixItem | null
  saving: boolean
  onClose: () => void
  onSave: (form: LegalMatrixForm, itemId?: string) => Promise<void>
}) {
  const [form, setForm] = useState<LegalMatrixForm>(emptyForm)
  const editing = Boolean(item)

  useEffect(() => {
    if (!open) return
    setForm(
      item
        ? {
            documentType: item.documentType,
            customDocumentType: item.customDocumentType ?? "",
            normNumber: item.normNumber,
            emissionDate: item.emissionDate,
            expirationDate: item.expirationDate,
            issuedBy: item.issuedBy,
          }
        : emptyForm,
    )
  }, [item, open])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.normNumber.trim()) return toast.error("Ingresa el numero de la norma")
    if (!form.emissionDate) return toast.error("Selecciona la fecha de emision")
    if (!form.expirationDate) return toast.error("Selecciona la fecha de vencimiento")
    if (!form.issuedBy.trim()) return toast.error("Ingresa quien emite la norma")
    if (form.documentType === "OTRO" && !form.customDocumentType.trim()) {
      return toast.error("Ingresa el tipo de documento")
    }

    await onSave(form, item?.id)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="module-dialog-polish record-dialog-polish !flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <div className="flex items-start gap-3 text-left"><FormDialogIcon icon="document" tone="blue" /><div><DialogTitle>{editing ? "Editar item del normograma" : "Nuevo item del normograma"}</DialogTitle><p className="mt-1 text-sm text-muted-foreground">Registra la norma aplicable, su vigencia y la entidad que la expide.</p></div></div>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <FormSectionTitle icon="details" title="Datos de la norma" description="Identifica el documento legal y sus fechas de aplicación." tone="blue" />
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label className="mb-2 block">Tipo de documento</Label><Select value={form.documentType} onValueChange={(value) => setForm((current) => ({ ...current, documentType: value as LegalDocumentType }))}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent>{documentTypeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                {form.documentType === "OTRO" && (
                  <Label className="grid gap-2">
                    Otro tipo
                    <Input
                      value={form.customDocumentType}
                      onChange={(event) => setForm((current) => ({ ...current, customDocumentType: event.target.value }))}
                      placeholder="Ej. Acuerdo, auto, concepto"
                    />
                  </Label>
                )}
                <Label className="grid gap-2">
                  Numero de la norma
                  <Input
                    value={form.normNumber}
                    onChange={(event) => setForm((current) => ({ ...current, normNumber: event.target.value }))}
                    placeholder="Ej. 1072"
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha de emision
                  <Input
                    type="date"
                    value={form.emissionDate}
                    onChange={(event) => setForm((current) => ({ ...current, emissionDate: event.target.value }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha de vencimiento
                  <Input
                    type="date"
                    value={form.expirationDate}
                    onChange={(event) => setForm((current) => ({ ...current, expirationDate: event.target.value }))}
                  />
                </Label>
                <Label className="grid gap-2 md:col-span-2">
                  Emitido por
                  <Input
                    value={form.issuedBy}
                    onChange={(event) => setForm((current) => ({ ...current, issuedBy: event.target.value }))}
                    placeholder="Entidad que emite la norma"
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-primary/20 bg-primary/5 p-4">
              <FormSectionTitle icon="document" title="Documento legal de soporte" description="El soporte se adjunta después de crear el registro." tone="cyan" />
              <div className="flex items-start gap-3">
                <Upload className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Una vez creado el item, usa los 3 puntos de la tabla y selecciona Cargar evidencia para adjuntar el documento legal.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Guardar cambios" : "Agregar item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  item,
  uploading,
  onClose,
  onSave,
}: {
  item: LegalMatrixItem | null
  uploading: boolean
  onClose: () => void
  onSave: (itemId: string, form: EvidenceForm, file: File) => Promise<void>
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!item) return
    setForm({
      fileName: item.evidence?.originalName ?? "",
      description: item.evidence?.description ?? "",
    })
    setFile(null)
  }, [item])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!item) return
    if (!file) return toast.error("Selecciona el documento legal")

    await onSave(item.id, form, file)
  }

  return (
    <Dialog open={Boolean(item)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="module-dialog-polish max-w-2xl bg-card">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Cargar evidencia</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Adjunta el documento legal de soporte para {item ? `${documentTypeLabel(item)} ${item.normNumber}` : "el item"}.
            </p>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Documento legal
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
                readOnly
                placeholder="documento-legal.pdf"
              />
            </Label>
            <Label className="grid gap-2 md:col-span-2">
              Descripcion
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Observacion o descripcion del soporte legal"
                rows={3}
              />
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar evidencia
            </Button>
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
      <DialogContent className="module-dialog-polish flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{preview?.title ?? "Documento legal"}</DialogTitle>
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

export default function LegalMatrixPage() {
  const [items, setItems] = useState<LegalMatrixItem[]>([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LegalMatrixItem | null>(null)
  const [evidenceItem, setEvidenceItem] = useState<LegalMatrixItem | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busyItemId, setBusyItemId] = useState<string | null>(null)

  async function loadItems(showError = true) {
    try {
      const response = await listLegalMatrixItems({ limit: 100 })
      setItems(response.items)
    } catch (error) {
      if (showError) toast.error(error instanceof Error ? error.message : "No se pudo cargar la matriz legal")
    }
  }

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const response = await listLegalMatrixItems({ limit: 100 })
        if (active) setItems(response.items)
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "No se pudo cargar la matriz legal")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    const expired = items.filter((item) => item.status === "EXPIRED").length
    return {
      total: items.length,
      active: items.length - expired,
      expired,
      withEvidence: items.filter((item) => item.evidence).length,
    }
  }, [items])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items

    return items.filter((item) => {
      return (
        documentTypeLabel(item).toLowerCase().includes(term) ||
        item.normNumber.toLowerCase().includes(term) ||
        item.issuedBy.toLowerCase().includes(term) ||
        item.evidence?.originalName.toLowerCase().includes(term)
      )
    })
  }, [items, search])

  async function saveItem(form: LegalMatrixForm, itemId?: string) {
    const payload: UpsertLegalMatrixDto = {
      documentType: form.documentType,
      customDocumentType: form.documentType === "OTRO" ? form.customDocumentType.trim() : null,
      normNumber: form.normNumber.trim(),
      emissionDate: form.emissionDate,
      expirationDate: form.expirationDate,
      issuedBy: form.issuedBy.trim(),
    }
    setSaving(true)
    try {
      if (itemId) {
        await updateLegalMatrixItem(itemId, payload)
        toast.success("Item del normograma actualizado")
      } else {
        await createLegalMatrixItem(payload)
        toast.success("Item agregado al normograma")
      }
      await loadItems(false)
      setDialogOpen(false)
      setEditingItem(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el item del normograma")
    } finally {
      setSaving(false)
    }
  }

  async function saveEvidence(itemId: string, form: EvidenceForm, file: File) {
    setUploading(true)
    try {
      await uploadLegalMatrixEvidence(itemId, { file, description: form.description.trim(), isConfirmed: true })
      await loadItems(false)
      setEvidenceItem(null)
      toast.success("Evidencia cargada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la evidencia")
    } finally {
      setUploading(false)
    }
  }

  async function deleteItem(item: LegalMatrixItem) {
    if (!window.confirm(`Eliminar la norma ${documentTypeLabel(item)} ${item.normNumber}?`)) return
    setBusyItemId(item.id)
    try {
      await deleteLegalMatrixItem(item.id)
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
      toast.success("Item eliminado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el item")
    } finally {
      setBusyItemId(null)
    }
  }

  async function viewEvidence(item: LegalMatrixItem) {
    if (!item.evidence) {
      toast.error("Este item no tiene documento legal cargado")
      return
    }

    setBusyItemId(item.id)
    try {
      const blob = await downloadLegalMatrixEvidence(item.evidence.downloadUrl)
      setPreview({
        title: item.evidence.originalName,
        url: URL.createObjectURL(blob),
        mimeType: item.evidence.mimeType || blob.type || "application/octet-stream",
        generated: true,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento legal")
    } finally {
      setBusyItemId(null)
    }
  }

  function closePreview() {
    if (preview?.generated) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  async function downloadEvidence(item: LegalMatrixItem) {
    if (!item.evidence) {
      toast.error("Este item no tiene documento legal cargado")
      return
    }

    setBusyItemId(item.id)
    try {
      const blob = await downloadLegalMatrixEvidence(item.evidence.downloadUrl)
      downloadBlob(blob, item.evidence.originalName)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el documento legal")
    } finally {
      setBusyItemId(null)
    }
  }

  function exportNormograma() {
    const headers = ["No.", "Tipo de documento", "Numero norma", "Fecha emision", "Fecha vencimiento", "Emitido por", "Estado", "Evidencia"]
    const rows = items.map((item, index) => [
      String(index + 1),
      documentTypeLabel(item),
      item.normNumber,
      formatDate(item.emissionDate),
      formatDate(item.expirationDate),
      item.issuedBy,
      statusLabel(item),
      item.evidence?.originalName ?? "Sin evidencia",
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n")
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `normograma-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="module-polish space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Matriz Legal</h1>
          <p className="text-muted-foreground">Normograma legal aplicable al SG-SST con documentos soporte y vencimientos.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="gap-2" onClick={exportNormograma}>
            <Download className="h-4 w-4" />
            Descargar CSV
          </Button>
          <Button
            type="button"
            className="gap-2"
            onClick={() => {
              setEditingItem(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Nuevo item
          </Button>
        </div>
      </div>

      <section className="overflow-x-auto py-1">
        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <div className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2">
            <span className="text-xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs font-medium text-slate-600">Total</span>
          </div>
          <div className="flex min-h-14 items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2">
            <span className="text-xl font-bold text-emerald-700">{stats.active}</span>
            <span className="text-xs font-medium text-slate-600">Vigentes</span>
          </div>
          <div className="flex min-h-14 items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2">
            <span className="text-xl font-bold text-rose-700">{stats.expired}</span>
            <span className="text-xs font-medium text-slate-600">Vencidos</span>
          </div>
          <div className="flex min-h-14 items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2">
            <span className="text-xl font-bold text-blue-700">{stats.withEvidence}</span>
            <span className="text-xs font-medium text-slate-600">Con documento</span>
          </div>
        </div>
      </section>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <ScrollText className="h-5 w-5" />
                Normograma
              </h2>
              <p className="text-sm text-muted-foreground">
                Se crean los registros item por item, con fecha de vencimiento y documento legal de soporte.
              </p>
            </div>
            <div className="relative w-full lg:w-[360px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Buscar por norma, tipo, entidad o archivo"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="overflow-x-auto rounded-md border border-primary/20 bg-card">
        <table className="w-full min-w-[1180px] text-sm">
          <thead>
            <tr className="border-b border-primary/30 bg-primary text-center text-xs font-semibold uppercase text-primary-foreground">
              <th className="px-3 py-4" colSpan={9}>
                NORMOGRAMA
              </th>
            </tr>
            <tr className="border-b border-primary/20 bg-primary/10 text-center text-xs font-semibold uppercase text-primary">
              <th className="w-14 px-3 py-3" rowSpan={2}>No.</th>
              <th className="px-3 py-3" rowSpan={2}>Tipo de documento</th>
              <th className="px-3 py-3" rowSpan={2}>Numero de la norma</th>
              <th className="px-3 py-2" colSpan={3}>Fecha de emision</th>
              <th className="px-3 py-3" rowSpan={2}>Emitido por</th>
              <th className="px-3 py-3" rowSpan={2}>Fecha vencimiento</th>
              <th className="px-3 py-3" rowSpan={2}>Acciones</th>
            </tr>
            <tr className="border-b border-primary/20 bg-primary/10 text-center text-xs font-semibold uppercase text-primary">
              <th className="w-20 px-3 py-2">Dia</th>
              <th className="w-28 px-3 py-2">Mes</th>
              <th className="w-20 px-3 py-2">Año</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filteredItems.map((item, index) => (
              <tr key={item.id} className="align-middle hover:bg-primary/5">
                <td className="px-3 py-4 text-center text-muted-foreground">{index + 1}</td>
                <td className="px-3 py-4 font-medium uppercase text-foreground">{documentTypeLabel(item)}</td>
                <td className="px-3 py-4 text-center text-foreground">{item.normNumber}</td>
                <td className="px-3 py-4 text-center text-muted-foreground">{getDatePart(item.emissionDate, "day")}</td>
                <td className="px-3 py-4 text-center text-muted-foreground">{getDatePart(item.emissionDate, "month")}</td>
                <td className="px-3 py-4 text-center text-muted-foreground">{getDatePart(item.emissionDate, "year")}</td>
                <td className="px-3 py-4 text-center text-muted-foreground">{item.issuedBy}</td>
                <td className="px-3 py-4">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-muted-foreground">{formatDate(item.expirationDate)}</span>
                    <Badge variant="outline" className={statusClassName(item)}>
                      {statusLabel(item)}
                    </Badge>
                  </div>
                </td>
                <td className="px-3 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onSelect={() => void viewEvidence(item)} disabled={!item.evidence || busyItemId === item.id}>
                        <Eye className="h-4 w-4" />
                        Ver documento
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void downloadEvidence(item)} disabled={!item.evidence || busyItemId === item.id}>
                        <Download className="h-4 w-4" />
                        Descargar documento
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setEvidenceItem(item)}>
                        <Upload className="h-4 w-4" />
                        Cargar evidencia
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditingItem(item)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => void deleteItem(item)} className="text-destructive" disabled={busyItemId === item.id}>
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando matriz legal...</span>
                </td>
              </tr>
            )}
            {!loading && filteredItems.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No hay normas para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <Upload className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Documentos legales</h3>
            <p className="text-sm text-muted-foreground">
              Cada item del normograma puede tener un archivo PDF, imagen o texto como soporte desde la opcion Cargar evidencia.
              El estado Vigente o Vencido se calcula automaticamente con la fecha de vencimiento.
            </p>
          </div>
        </div>
      </section>

      <LegalMatrixDialog
        open={dialogOpen}
        item={editingItem}
        saving={saving}
        onClose={() => {
          setDialogOpen(false)
          setEditingItem(null)
        }}
        onSave={saveItem}
      />
      <EvidenceDialog item={evidenceItem} uploading={uploading} onClose={() => setEvidenceItem(null)} onSave={saveEvidence} />
      <EvidencePreviewDialog preview={preview} onClose={closePreview} />
    </main>
  )
}
