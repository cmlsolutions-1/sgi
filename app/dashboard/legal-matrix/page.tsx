"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  Download,
  Edit,
  Eye,
  FileText,
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
import { Textarea } from "@/components/ui/textarea"

type LegalDocumentType = "LEY" | "DECRETO" | "RESOLUCION" | "CIRCULAR" | "NORMA_TECNICA" | "OTRO"

type LegalEvidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
  mimeType?: string
  url?: string
}

type LegalMatrixItem = {
  id: string
  documentType: LegalDocumentType
  customDocumentType?: string
  normNumber: string
  emissionDate: string
  expirationDate: string
  issuedBy: string
  evidence?: LegalEvidence
}

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

const initialItems: LegalMatrixItem[] = [
  {
    id: "legal-1",
    documentType: "LEY",
    normNumber: "1562",
    emissionDate: "2012-07-11",
    expirationDate: "2027-07-11",
    issuedBy: "Congreso de Colombia",
    evidence: {
      id: "ev-1",
      fileName: "ley-1562-2012.pdf",
      description: "Soporte legal cargado en el normograma.",
      uploadedAt: "2026-09-01T09:00:00",
      mimeType: "application/pdf",
    },
  },
  {
    id: "legal-2",
    documentType: "DECRETO",
    normNumber: "1072",
    emissionDate: "2015-05-26",
    expirationDate: "2028-05-26",
    issuedBy: "Presidente de la Republica de Colombia",
    evidence: {
      id: "ev-2",
      fileName: "decreto-1072-2015.pdf",
      description: "Decreto unico reglamentario del sector trabajo.",
      uploadedAt: "2026-09-01T09:15:00",
      mimeType: "application/pdf",
    },
  },
  {
    id: "legal-3",
    documentType: "DECRETO",
    normNumber: "1447",
    emissionDate: "2014-08-05",
    expirationDate: "2026-08-05",
    issuedBy: "Presidente de la Republica de Colombia",
  },
]

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function documentTypeLabel(item: Pick<LegalMatrixItem, "documentType" | "customDocumentType">) {
  if (item.documentType === "OTRO") return item.customDocumentType?.trim() || "Otro"
  return documentTypeOptions.find((option) => option.value === item.documentType)?.label ?? item.documentType
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

function getDatePart(value: string, part: "day" | "month" | "year") {
  if (!value) return "-"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return "-"

  if (part === "day") return String(date.getDate()).padStart(2, "0")
  if (part === "year") return String(date.getFullYear())

  return new Intl.DateTimeFormat("es-CO", { month: "long" }).format(date).toUpperCase()
}

function isExpired(expirationDate: string) {
  if (!expirationDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiration = new Date(`${expirationDate}T00:00:00`)
  return !Number.isNaN(expiration.getTime()) && expiration < today
}

function statusLabel(item: LegalMatrixItem) {
  return isExpired(item.expirationDate) ? "Vencido" : "Vigente"
}

function statusClassName(item: LegalMatrixItem) {
  return isExpired(item.expirationDate)
    ? "border-destructive bg-destructive/10 text-destructive"
    : "border-emerald-200 bg-emerald-50 text-emerald-700"
}

function canEmbed(mimeType?: string) {
  return Boolean(mimeType?.startsWith("image/") || mimeType === "application/pdf" || mimeType?.startsWith("text/"))
}

function buildEvidenceText(item: LegalMatrixItem, evidence: LegalEvidence) {
  return `Matriz legal - Normograma
Tipo de documento: ${documentTypeLabel(item)}
Numero de norma: ${item.normNumber}
Fecha de emision: ${formatDate(item.emissionDate)}
Fecha de vencimiento: ${formatDate(item.expirationDate)}
Emitido por: ${item.issuedBy}
Estado: ${statusLabel(item)}

Documento: ${evidence.fileName}
Descripcion: ${evidence.description || "Sin descripcion"}
Cargado: ${formatDateTime(evidence.uploadedAt)}
`
}

function LegalMatrixDialog({
  open,
  item,
  onClose,
  onSave,
}: {
  open: boolean
  item: LegalMatrixItem | null
  onClose: () => void
  onSave: (form: LegalMatrixForm, itemId?: string) => void
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.normNumber.trim()) return toast.error("Ingresa el numero de la norma")
    if (!form.emissionDate) return toast.error("Selecciona la fecha de emision")
    if (!form.expirationDate) return toast.error("Selecciona la fecha de vencimiento")
    if (!form.issuedBy.trim()) return toast.error("Ingresa quien emite la norma")
    if (form.documentType === "OTRO" && !form.customDocumentType.trim()) {
      return toast.error("Ingresa el tipo de documento")
    }

    onSave(form, item?.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Editar item del normograma" : "Nuevo item del normograma"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registra la norma legal aplicable y su fecha de vencimiento. El documento soporte se carga desde las acciones del item.
          </p>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos de la norma</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  Tipo de documento
                  <select
                    value={form.documentType}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, documentType: event.target.value as LegalDocumentType }))
                    }
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {documentTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Label>
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
              <div className="flex items-start gap-3">
                <Upload className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Documento legal de soporte</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez creado el item, usa los 3 puntos de la tabla y selecciona Cargar evidencia para adjuntar el documento legal.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Guardar cambios" : "Agregar item"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  item,
  onClose,
  onSave,
}: {
  item: LegalMatrixItem | null
  onClose: () => void
  onSave: (itemId: string, form: EvidenceForm, file: File | null) => void
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!item) return
    setForm({
      fileName: item.evidence?.fileName ?? "",
      description: item.evidence?.description ?? "",
    })
    setFile(null)
  }, [item])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!item) return
    if (!form.fileName.trim() && !file) return toast.error("Selecciona o registra el nombre del documento")

    onSave(item.id, form, file)
    onClose()
  }

  return (
    <Dialog open={Boolean(item)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
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
                onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.value }))}
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
  const [items, setItems] = useState<LegalMatrixItem[]>(initialItems)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LegalMatrixItem | null>(null)
  const [evidenceItem, setEvidenceItem] = useState<LegalMatrixItem | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)

  const stats = useMemo(() => {
    const expired = items.filter((item) => isExpired(item.expirationDate)).length
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
        item.evidence?.fileName.toLowerCase().includes(term)
      )
    })
  }, [items, search])

  function saveItem(form: LegalMatrixForm, itemId?: string) {
    if (itemId) {
      setItems((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                documentType: form.documentType,
                customDocumentType: form.customDocumentType.trim(),
                normNumber: form.normNumber.trim(),
                emissionDate: form.emissionDate,
                expirationDate: form.expirationDate,
                issuedBy: form.issuedBy.trim(),
              }
            : item,
        ),
      )
      toast.success("Item del normograma actualizado")
      return
    }

    setItems((current) => [
      {
        id: createId("legal"),
        documentType: form.documentType,
        customDocumentType: form.customDocumentType.trim(),
        normNumber: form.normNumber.trim(),
        emissionDate: form.emissionDate,
        expirationDate: form.expirationDate,
        issuedBy: form.issuedBy.trim(),
      },
      ...current,
    ])
    toast.success("Item agregado al normograma")
  }

  function saveEvidence(itemId: string, form: EvidenceForm, file: File | null) {
    const evidence: LegalEvidence = {
      id: createId("legal-evidence"),
      fileName: form.fileName.trim() || file?.name || "documento-legal.pdf",
      description: form.description.trim(),
      uploadedAt: new Date().toISOString(),
      mimeType: file?.type || "text/plain",
      url: file ? URL.createObjectURL(file) : undefined,
    }

    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, evidence } : item)))
    setEvidenceItem((current) => (current?.id === itemId ? { ...current, evidence } : current))
    toast.success("Evidencia cargada")
  }

  function deleteItem(item: LegalMatrixItem) {
    if (!window.confirm(`Eliminar la norma ${documentTypeLabel(item)} ${item.normNumber}?`)) return
    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
    toast.success("Item eliminado")
  }

  function viewEvidence(item: LegalMatrixItem) {
    if (!item.evidence) {
      toast.error("Este item no tiene documento legal cargado")
      return
    }

    if (item.evidence.url) {
      setPreview({
        title: item.evidence.fileName,
        url: item.evidence.url,
        mimeType: item.evidence.mimeType || "application/octet-stream",
        generated: false,
      })
      return
    }

    const blob = new Blob([buildEvidenceText(item, item.evidence)], { type: "text/plain;charset=utf-8" })
    setPreview({
      title: item.evidence.fileName,
      url: URL.createObjectURL(blob),
      mimeType: "text/plain",
      generated: true,
    })
  }

  function closePreview() {
    if (preview?.generated) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  function downloadEvidence(item: LegalMatrixItem) {
    if (!item.evidence) {
      toast.error("Este item no tiene documento legal cargado")
      return
    }

    const url =
      item.evidence.url ??
      URL.createObjectURL(new Blob([buildEvidenceText(item, item.evidence)], { type: "text/plain;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = item.evidence.fileName
    link.click()

    if (!item.evidence.url) URL.revokeObjectURL(url)
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
      item.evidence?.fileName ?? "Sin evidencia",
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
    <main className="space-y-6">
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

      <section className="overflow-x-auto px-3 py-1">
        <div className="flex min-w-max items-center justify-center gap-2">
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Vigentes</span>
            <span className="text-sm font-semibold text-green-700">{stats.active}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Vencidos</span>
            <span className="text-sm font-semibold text-destructive">{stats.expired}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Con documento</span>
            <span className="text-sm font-semibold text-primary">{stats.withEvidence}</span>
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
                      <DropdownMenuItem onSelect={() => viewEvidence(item)} disabled={!item.evidence}>
                        <Eye className="h-4 w-4" />
                        Ver documento
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => downloadEvidence(item)} disabled={!item.evidence}>
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
                      <DropdownMenuItem onSelect={() => deleteItem(item)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
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
        onClose={() => {
          setDialogOpen(false)
          setEditingItem(null)
        }}
        onSave={saveItem}
      />
      <EvidenceDialog item={evidenceItem} onClose={() => setEvidenceItem(null)} onSave={saveEvidence} />
      <EvidencePreviewDialog preview={preview} onClose={closePreview} />
    </main>
  )
}
