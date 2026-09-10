"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Download,
  Edit,
  Eye,
  FileCheck2,
  FileText,
  MessageSquare,
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

type CommunicationType = "INTERNAL" | "EXTERNAL"
type CommunicationMedium = "WHATSAPP" | "EMAIL" | "MAILBOX" | "FORM" | "VERBAL" | "MEETING" | "OTHER"
type ResponsibleType = "EMPLOYEE" | "MANAGER"

type MockEmployee = {
  id: string
  name: string
  lastName: string
  job: string
}

type SignedEvidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
  mimeType?: string
  url?: string
}

type SstCommunication = {
  id: string
  mechanismName: string
  type: CommunicationType
  medium: CommunicationMedium
  customMedium?: string
  responsibleType: ResponsibleType
  responsibleEmployeeId?: string
  managerName?: string
  implementationDate: string
  observations: string
  informedCopasst: boolean
  initialEvidence?: SignedEvidence
  signedEvidence?: SignedEvidence
}

type CommunicationForm = {
  mechanismName: string
  type: CommunicationType
  medium: CommunicationMedium
  customMedium: string
  responsibleType: ResponsibleType
  responsibleEmployeeId: string
  managerName: string
  implementationDate: string
  observations: string
  informedCopasst: "YES" | "NO"
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

const employees: MockEmployee[] = [
  { id: "emp-1", name: "Diana", lastName: "Mendoza", job: "Responsable SG-SST" },
  { id: "emp-2", name: "Carlos", lastName: "Ramirez", job: "Coordinador operativo" },
  { id: "emp-3", name: "Valentina", lastName: "Suarez", job: "Auxiliar administrativa" },
]

const mediumOptions: Array<{ value: CommunicationMedium; label: string }> = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Correo" },
  { value: "MAILBOX", label: "Buzon" },
  { value: "FORM", label: "Formulario" },
  { value: "VERBAL", label: "Verbal" },
  { value: "MEETING", label: "Reunion" },
  { value: "OTHER", label: "Otro" },
]

const emptyForm: CommunicationForm = {
  mechanismName: "",
  type: "INTERNAL",
  medium: "EMAIL",
  customMedium: "",
  responsibleType: "EMPLOYEE",
  responsibleEmployeeId: "",
  managerName: "",
  implementationDate: new Date().toISOString().slice(0, 10),
  observations: "",
  informedCopasst: "NO",
}

const emptyEvidenceForm: EvidenceForm = {
  fileName: "",
  description: "",
}

const initialCommunications: SstCommunication[] = [
  {
    id: "comm-1",
    mechanismName: "Comunicacion interna de novedades SST",
    type: "INTERNAL",
    medium: "WHATSAPP",
    responsibleType: "EMPLOYEE",
    responsibleEmployeeId: "emp-1",
    implementationDate: "2026-09-01",
    observations: "Canal usado para reportes rapidos y divulgacion de alertas SST.",
    informedCopasst: true,
    initialEvidence: {
      id: "initial-evidence-1",
      fileName: "soporte-canal-whatsapp-sst.pdf",
      description: "Evidencia de implementación del canal de WhatsApp SST.",
      uploadedAt: "2026-09-01T08:30:00",
      mimeType: "application/pdf",
    },
    signedEvidence: {
      id: "evidence-1",
      fileName: "acta-comunicaciones-sst-firmada.pdf",
      description: "Acta firmada por gerencia.",
      uploadedAt: "2026-09-02T10:00:00",
      mimeType: "application/pdf",
    },
  },
  {
    id: "comm-2",
    mechanismName: "Buzon de sugerencias SST",
    type: "INTERNAL",
    medium: "MAILBOX",
    responsibleType: "MANAGER",
    managerName: "Gerencia General",
    implementationDate: "2026-08-15",
    observations: "Recepcion mensual de inquietudes, quejas o reportes de condiciones inseguras.",
    informedCopasst: false,
    initialEvidence: {
      id: "initial-evidence-2",
      fileName: "registro-buzon-sugerencias-sst.pdf",
      description: "Registro fotografico del buzon y acta de apertura.",
      uploadedAt: "2026-08-15T14:20:00",
      mimeType: "application/pdf",
    },
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

function typeLabel(type: CommunicationType) {
  return type === "INTERNAL" ? "Interno" : "Externo"
}

function mediumLabel(record: Pick<SstCommunication, "medium" | "customMedium">) {
  if (record.medium === "OTHER") return record.customMedium?.trim() || "Otro"
  return mediumOptions.find((option) => option.value === record.medium)?.label ?? record.medium
}

function employeeName(employeeId?: string) {
  const employee = employees.find((item) => item.id === employeeId)
  if (!employee) return "Empleado no asignado"
  return `${employee.name} ${employee.lastName}`
}

function responsibleLabel(record: SstCommunication) {
  if (record.responsibleType === "MANAGER") return record.managerName?.trim() || "Gerente"
  return employeeName(record.responsibleEmployeeId)
}

function canEmbed(mimeType?: string) {
  return Boolean(mimeType?.startsWith("image/") || mimeType === "application/pdf" || mimeType?.startsWith("text/"))
}

function getImageFormat(mimeType?: string) {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "JPEG"
  if (mimeType === "image/webp") return "WEBP"
  return "PNG"
}

function loadPdfImage(evidence?: SignedEvidence | null) {
  if (!evidence?.url || !evidence.mimeType?.startsWith("image/")) return Promise.resolve(null)

  return new Promise<{ image: HTMLImageElement; format: string } | null>((resolve) => {
    const image = new Image()
    image.onload = () => resolve({ image, format: getImageFormat(evidence.mimeType) })
    image.onerror = () => resolve(null)
    image.src = evidence.url as string
  })
}

function buildEvidenceText(record: SstCommunication, evidence: SignedEvidence) {
  return `Comunicaciones SST - Evidencia
Mecanismo: ${record.mechanismName}
Tipo: ${typeLabel(record.type)}
Medio: ${mediumLabel(record)}
Responsable: ${responsibleLabel(record)}
Fecha implementacion: ${formatDate(record.implementationDate)}
Informo a miembros del COPASST: ${record.informedCopasst ? "Si" : "No"}

Archivo: ${evidence.fileName}
Descripcion: ${evidence.description || "Sin descripcion"}
Cargado: ${formatDateTime(evidence.uploadedAt)}
`
}

function CommunicationDialog({
  open,
  record,
  onClose,
  onSave,
}: {
  open: boolean
  record: SstCommunication | null
  onClose: () => void
  onSave: (form: CommunicationForm, recordId?: string) => void
}) {
  const [form, setForm] = useState<CommunicationForm>(emptyForm)
  const editing = Boolean(record)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            mechanismName: record.mechanismName,
            type: record.type,
            medium: record.medium,
            customMedium: record.customMedium ?? "",
            responsibleType: record.responsibleType,
            responsibleEmployeeId: record.responsibleEmployeeId ?? "",
            managerName: record.managerName ?? "",
            implementationDate: record.implementationDate,
            observations: record.observations,
            informedCopasst: record.informedCopasst ? "YES" : "NO",
          }
        : emptyForm,
    )
  }, [open, record])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.mechanismName.trim()) return toast.error("Ingresa el nombre del mecanismo")
    if (!form.implementationDate) return toast.error("Selecciona la fecha de implementacion")
    if (form.medium === "OTHER" && !form.customMedium.trim()) return toast.error("Ingresa el medio")
    if (form.responsibleType === "EMPLOYEE" && !form.responsibleEmployeeId) return toast.error("Selecciona el empleado responsable")
    if (form.responsibleType === "MANAGER" && !form.managerName.trim()) return toast.error("Ingresa el responsable gerente")

    onSave(form, record?.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Editar comunicacion SST" : "Nueva comunicacion SST"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registra el mecanismo de comunicación. La evidencia inicial se carga luego desde los 3 puntos del registro.
          </p>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos del mecanismo</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2 md:col-span-2">
                  Nombre del mecanismo
                  <Input
                    value={form.mechanismName}
                    onChange={(event) => setForm((current) => ({ ...current, mechanismName: event.target.value }))}
                    placeholder="Ej. Canal interno de reportes SST"
                  />
                </Label>
                <Label className="grid gap-2">
                  Tipo
                  <select
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as CommunicationType }))}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="INTERNAL">Interno</option>
                    <option value="EXTERNAL">Externo</option>
                  </select>
                </Label>
                <Label className="grid gap-2">
                  Medio
                  <select
                    value={form.medium}
                    onChange={(event) => setForm((current) => ({ ...current, medium: event.target.value as CommunicationMedium }))}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {mediumOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Label>
                {form.medium === "OTHER" && (
                  <Label className="grid gap-2 md:col-span-2">
                    Otro medio
                    <Input
                      value={form.customMedium}
                      onChange={(event) => setForm((current) => ({ ...current, customMedium: event.target.value }))}
                      placeholder="Describe el medio de comunicacion"
                    />
                  </Label>
                )}
                <Label className="grid gap-2">
                  Tipo de responsable
                  <select
                    value={form.responsibleType}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, responsibleType: event.target.value as ResponsibleType }))
                    }
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="EMPLOYEE">Empleado</option>
                    <option value="MANAGER">Gerente</option>
                  </select>
                </Label>
                {form.responsibleType === "EMPLOYEE" ? (
                  <Label className="grid gap-2">
                    Empleado responsable
                    <select
                      value={form.responsibleEmployeeId}
                      onChange={(event) => setForm((current) => ({ ...current, responsibleEmployeeId: event.target.value }))}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Selecciona un empleado</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} {employee.lastName} - {employee.job}
                        </option>
                      ))}
                    </select>
                  </Label>
                ) : (
                  <Label className="grid gap-2">
                    Gerente responsable
                    <Input
                      value={form.managerName}
                      onChange={(event) => setForm((current) => ({ ...current, managerName: event.target.value }))}
                      placeholder="Nombre del gerente"
                    />
                  </Label>
                )}
                <Label className="grid gap-2">
                  Fecha de implementacion
                  <Input
                    type="date"
                    value={form.implementationDate}
                    onChange={(event) => setForm((current) => ({ ...current, implementationDate: event.target.value }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Informo a miembros del COPASST
                  <select
                    value={form.informedCopasst}
                    onChange={(event) => setForm((current) => ({ ...current, informedCopasst: event.target.value as "YES" | "NO" }))}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="YES">Si</option>
                    <option value="NO">No</option>
                  </select>
                </Label>
                <Label className="grid gap-2 md:col-span-2">
                  Observaciones
                  <Textarea
                    value={form.observations}
                    onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
                    placeholder="Observaciones del mecanismo de comunicacion"
                    rows={4}
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <FileCheck2 className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Flujo documental</h3>
                  <p className="text-sm text-muted-foreground">
                    Después de guardar, carga la evidencia inicial desde los 3 puntos. Con esa evidencia se habilita el PDF para firma y luego podrás subir el documento firmado.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Guardar cambios" : "Crear comunicacion"}</Button>
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
  record: SstCommunication | null
  kind: "initial" | "signed"
  onClose: () => void
  onSave: (recordId: string, form: EvidenceForm, file: File | null, kind: "initial" | "signed") => void
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!record) return
    const evidence = kind === "initial" ? record.initialEvidence : record.signedEvidence
    setForm({
      fileName: evidence?.fileName ?? "",
      description: evidence?.description ?? "",
    })
    setFile(null)
  }, [kind, record])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!file && !form.fileName.trim()) {
      return toast.error(kind === "initial" ? "Selecciona o registra la evidencia inicial" : "Selecciona o registra el documento firmado")
    }

    onSave(record.id, form, file, kind)
    onClose()
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{kind === "initial" ? "Cargar evidencia inicial" : "Cargar documento firmado"}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {kind === "initial"
                ? `Adjunta la evidencia inicial para ${record?.mechanismName ?? "la comunicacion SST"}.`
                : `Adjunta el PDF firmado por gerencia para ${record?.mechanismName ?? "la comunicacion SST"}.`}
            </p>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              {kind === "initial" ? "Evidencia inicial" : "Archivo firmado"}
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
                placeholder={kind === "initial" ? "evidencia-comunicacion-sst.pdf" : "comunicaciones-sst-firmado.pdf"}
              />
            </Label>
            <Label className="grid gap-2 md:col-span-2">
              Descripcion
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                placeholder={kind === "initial" ? "Observacion sobre la evidencia inicial" : "Observacion sobre el documento firmado"}
              />
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{kind === "initial" ? "Guardar evidencia inicial" : "Guardar documento firmado"}</Button>
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
          <DialogTitle>{preview?.title ?? "Evidencia firmada"}</DialogTitle>
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
              <p className="text-sm">Puedes abrir o descargar el archivo desde las acciones.</p>
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

export default function SstCommunicationsPage() {
  const [records, setRecords] = useState<SstCommunication[]>(initialCommunications)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SstCommunication | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<SstCommunication | null>(null)
  const [evidenceKind, setEvidenceKind] = useState<"initial" | "signed">("initial")
  const [detailRecord, setDetailRecord] = useState<SstCommunication | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)

  const stats = useMemo(() => {
    return {
      total: records.length,
      internal: records.filter((record) => record.type === "INTERNAL").length,
      external: records.filter((record) => record.type === "EXTERNAL").length,
      withInitialEvidence: records.filter((record) => record.initialEvidence).length,
      signed: records.filter((record) => record.signedEvidence).length,
    }
  }, [records])

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return records

    return records.filter(
      (record) =>
        record.mechanismName.toLowerCase().includes(term) ||
        mediumLabel(record).toLowerCase().includes(term) ||
        responsibleLabel(record).toLowerCase().includes(term) ||
        record.initialEvidence?.fileName.toLowerCase().includes(term) ||
        record.signedEvidence?.fileName.toLowerCase().includes(term),
    )
  }, [records, search])

  function saveRecord(form: CommunicationForm, recordId?: string) {
    const payload = {
      mechanismName: form.mechanismName.trim(),
      type: form.type,
      medium: form.medium,
      customMedium: form.customMedium.trim(),
      responsibleType: form.responsibleType,
      responsibleEmployeeId: form.responsibleType === "EMPLOYEE" ? form.responsibleEmployeeId : undefined,
      managerName: form.responsibleType === "MANAGER" ? form.managerName.trim() : undefined,
      implementationDate: form.implementationDate,
      observations: form.observations.trim(),
      informedCopasst: form.informedCopasst === "YES",
    }

    if (recordId) {
      setRecords((current) => current.map((record) => (record.id === recordId ? { ...record, ...payload } : record)))
      toast.success("Comunicacion SST actualizada")
      return
    }

    setRecords((current) => [{ id: createId("communication"), ...payload }, ...current])
    toast.success("Comunicacion SST creada")
  }

  function saveEvidence(recordId: string, form: EvidenceForm, file: File | null, kind: "initial" | "signed") {
    const evidence: SignedEvidence = {
      id: createId(kind === "initial" ? "communication-initial-evidence" : "communication-signed-evidence"),
      fileName:
        form.fileName.trim() ||
        file?.name ||
        (kind === "initial" ? "evidencia-comunicacion-sst.pdf" : "comunicacion-sst-firmada.pdf"),
      description: form.description.trim(),
      uploadedAt: new Date().toISOString(),
      mimeType: file?.type || "text/plain",
      url: file ? URL.createObjectURL(file) : undefined,
    }

    setRecords((current) =>
      current.map((record) =>
        record.id === recordId
          ? kind === "initial"
            ? { ...record, initialEvidence: evidence }
            : { ...record, signedEvidence: evidence }
          : record,
      ),
    )
    setEvidenceRecord((current) =>
      current?.id === recordId
        ? kind === "initial"
          ? { ...current, initialEvidence: evidence }
          : { ...current, signedEvidence: evidence }
        : current,
    )
    toast.success(kind === "initial" ? "Evidencia inicial cargada" : "Documento firmado cargado")
  }

  function deleteRecord(record: SstCommunication) {
    if (!window.confirm(`Eliminar la comunicacion "${record.mechanismName}"?`)) return
    setRecords((current) => current.filter((item) => item.id !== record.id))
    toast.success("Comunicacion eliminada")
  }

  async function downloadPdf(record: SstCommunication) {
    if (!record.initialEvidence) {
      toast.error("Primero carga la evidencia inicial para poder generar el PDF de firma")
      return
    }

    const doc = new jsPDF("p", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const primaryColor: [number, number, number] = [31, 92, 77]

    doc.setFillColor(...primaryColor)
    doc.roundedRect(margin, 12, pageWidth - margin * 2, 22, 3, 3, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.text("ACTA DE COMUNICACIONES SST", margin + 5, 22)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text(`Documento para firma de gerencia · Generado: ${formatDate(new Date().toISOString())}`, margin + 5, 29)

    autoTable(doc, {
      startY: 42,
      theme: "grid",
      margin: { left: margin, right: margin },
      body: [
        ["Nombre del mecanismo", record.mechanismName],
        ["Tipo", typeLabel(record.type)],
        ["Medio", mediumLabel(record)],
        ["Responsable", responsibleLabel(record)],
        ["Fecha de implementación", formatDate(record.implementationDate)],
        ["Informó a miembros del COPASST", record.informedCopasst ? "Sí" : "No"],
        ["Evidencia inicial", record.initialEvidence.fileName],
        ["Descripción evidencia", record.initialEvidence.description || "Sin descripción"],
        ["Observaciones", record.observations || "Sin observaciones"],
      ],
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3, lineColor: [220, 226, 224], lineWidth: 0.1 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 55 },
        1: { cellWidth: pageWidth - margin * 2 - 55 },
      },
    })

    let finalY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 110) + 14
    const evidenceImage = await loadPdfImage(record.initialEvidence)

    if (evidenceImage) {
      if (finalY + 92 > pageHeight - 18) {
        doc.addPage()
        finalY = 18
      }

      doc.setFont("helvetica", "bold")
      doc.setTextColor(30, 41, 59)
      doc.setFontSize(10)
      doc.text("Evidencia inicial cargada", margin, finalY)

      const maxImageWidth = pageWidth - margin * 2
      const maxImageHeight = 78
      const imageRatio = evidenceImage.image.width / Math.max(1, evidenceImage.image.height)
      let imageWidth = maxImageWidth
      let imageHeight = imageWidth / imageRatio

      if (imageHeight > maxImageHeight) {
        imageHeight = maxImageHeight
        imageWidth = imageHeight * imageRatio
      }

      const imageX = margin + (maxImageWidth - imageWidth) / 2
      doc.addImage(evidenceImage.image, evidenceImage.format, imageX, finalY + 6, imageWidth, imageHeight)
      finalY += imageHeight + 20
    }

    if (finalY + 52 > pageHeight - 18) {
      doc.addPage()
      finalY = 18
    }

    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(10)
    doc.text("Aprobación de gerencia", margin, finalY)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text("Con mi firma dejo constancia de la revisión y aprobación del mecanismo de comunicación SST.", margin, finalY + 8)

    const signatureY = Math.min(finalY + 40, pageHeight - 36)
    doc.setDrawColor(120, 130, 140)
    doc.line(margin, signatureY, margin + 80, signatureY)
    doc.line(pageWidth - margin - 80, signatureY, pageWidth - margin, signatureY)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text("Firma del gerente", margin, signatureY + 6)
    doc.text("Responsable SG-SST", pageWidth - margin - 80, signatureY + 6)

    const pageCount = Math.max(1, ((doc.internal as unknown as { pages?: unknown[] }).pages?.length ?? 2) - 1)
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      doc.setPage(pageNumber)
      doc.setDrawColor(220, 226, 224)
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.text("Documento generado desde SafeCloud SG-SST", margin, pageHeight - 7)
      doc.text(`Página ${pageNumber} de ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: "right" })
    }

    doc.save(`comunicacion-sst-${record.mechanismName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`)
  }

  function viewEvidence(record: SstCommunication, kind: "initial" | "signed") {
    const evidence = kind === "initial" ? record.initialEvidence : record.signedEvidence
    if (!evidence) {
      toast.error(kind === "initial" ? "Esta comunicacion no tiene evidencia inicial" : "Esta comunicacion no tiene evidencia firmada")
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

    const blob = new Blob([buildEvidenceText(record, evidence)], { type: "text/plain;charset=utf-8" })
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

  function downloadEvidence(record: SstCommunication, kind: "initial" | "signed") {
    const evidence = kind === "initial" ? record.initialEvidence : record.signedEvidence
    if (!evidence) {
      toast.error(kind === "initial" ? "Esta comunicacion no tiene evidencia inicial" : "Esta comunicacion no tiene evidencia firmada")
      return
    }

    const url =
      evidence.url ??
      URL.createObjectURL(new Blob([buildEvidenceText(record, evidence)], { type: "text/plain;charset=utf-8" }))
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
          <h1 className="text-2xl font-bold text-foreground">Comunicaciones SST</h1>
          <p className="text-muted-foreground">
            Mecanismos internos y externos de comunicación del SG-SST, con evidencia inicial y documento firmado por gerencia.
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
          Nueva comunicación
        </Button>
      </div>

      <section className="overflow-x-auto px-3 py-1">
        <div className="flex min-w-max items-center justify-center gap-2">
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Internas</span>
            <span className="text-sm font-semibold text-primary">{stats.internal}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Externas</span>
            <span className="text-sm font-semibold">{stats.external}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Con evidencia</span>
            <span className="text-sm font-semibold text-primary">{stats.withInitialEvidence}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Firmadas</span>
            <span className="text-sm font-semibold text-green-700">{stats.signed}</span>
          </div>
        </div>
      </section>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <MessageSquare className="h-5 w-5" />
                Lista de comunicaciones
              </h2>
              <p className="text-sm text-muted-foreground">
                Primero carga la evidencia inicial, luego descarga el PDF para firma de gerencia y finalmente sube el documento firmado.
              </p>
            </div>
            <div className="relative w-full lg:w-[360px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Buscar por mecanismo, medio o responsable"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[1280px] text-sm">
          <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Mecanismo</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Medio</th>
              <th className="px-4 py-3 font-medium">Responsable</th>
              <th className="px-4 py-3 font-medium">Implementación</th>
              <th className="px-4 py-3 font-medium">COPASST</th>
              <th className="px-4 py-3 font-medium">Evidencia inicial</th>
              <th className="px-4 py-3 font-medium">Documento firmado</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="align-middle hover:bg-secondary/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{record.mechanismName}</p>
                  <p className="max-w-[280px] truncate text-muted-foreground">{record.observations || "Sin observaciones"}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                    {typeLabel(record.type)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{mediumLabel(record)}</td>
                <td className="px-4 py-3 text-muted-foreground">{responsibleLabel(record)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(record.implementationDate)}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      record.informedCopasst
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }
                  >
                    {record.informedCopasst ? "Informado" : "Pendiente"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {record.initialEvidence ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      {record.initialEvidence.fileName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sin evidencia inicial</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {record.signedEvidence ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-700" />
                      {record.signedEvidence.fileName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sin evidencia</span>
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
                      <DropdownMenuItem onSelect={() => setDetailRecord(record)}>
                        <Eye className="h-4 w-4" />
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEvidenceKind("initial")
                          setEvidenceRecord(record)
                        }}
                      >
                        <Upload className="h-4 w-4" />
                        Cargar evidencia inicial
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => downloadPdf(record)} disabled={!record.initialEvidence}>
                        <Download className="h-4 w-4" />
                        Descargar PDF para firma
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEvidenceKind("signed")
                          setEvidenceRecord(record)
                        }}
                        disabled={!record.initialEvidence}
                      >
                        <Upload className="h-4 w-4" />
                        Cargar evidencia firmada
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => viewEvidence(record, "initial")} disabled={!record.initialEvidence}>
                        <FileText className="h-4 w-4" />
                        Ver evidencia inicial
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => viewEvidence(record, "signed")} disabled={!record.signedEvidence}>
                        <FileText className="h-4 w-4" />
                        Ver documento firmado
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => downloadEvidence(record, "signed")} disabled={!record.signedEvidence}>
                        <Download className="h-4 w-4" />
                        Descargar firmado
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
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No hay comunicaciones SST para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <Dialog open={Boolean(detailRecord)} onOpenChange={(nextOpen) => !nextOpen && setDetailRecord(null)}>
        <DialogContent className="max-w-4xl bg-card">
          <DialogHeader>
            <DialogTitle>Detalle de la comunicación SST</DialogTitle>
          </DialogHeader>
          {detailRecord && (
            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock label="Mecanismo" value={detailRecord.mechanismName} />
              <InfoBlock label="Tipo" value={typeLabel(detailRecord.type)} />
              <InfoBlock label="Medio" value={mediumLabel(detailRecord)} />
              <InfoBlock label="Responsable" value={responsibleLabel(detailRecord)} />
              <InfoBlock label="Fecha implementación" value={formatDate(detailRecord.implementationDate)} />
              <InfoBlock label="COPASST" value={detailRecord.informedCopasst ? "Informado" : "Pendiente"} />
              <div className="rounded-md bg-secondary p-3 md:col-span-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">Evidencia inicial</p>
                <p className="mt-1 text-sm text-foreground">
                  {detailRecord.initialEvidence
                    ? `${detailRecord.initialEvidence.fileName} · ${formatDateTime(detailRecord.initialEvidence.uploadedAt)}`
                    : "Sin evidencia inicial"}
                </p>
              </div>
              <div className="rounded-md bg-secondary p-3 md:col-span-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">Observaciones</p>
                <p className="mt-1 text-sm text-foreground">{detailRecord.observations || "Sin observaciones"}</p>
              </div>
              <div className="rounded-md bg-secondary p-3 md:col-span-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">Evidencia firmada</p>
                <p className="mt-1 text-sm text-foreground">
                  {detailRecord.signedEvidence
                    ? `${detailRecord.signedEvidence.fileName} · ${formatDateTime(detailRecord.signedEvidence.uploadedAt)}`
                    : "Sin evidencia firmada"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setDetailRecord(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CommunicationDialog
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
      <EvidencePreviewDialog preview={preview} onClose={closePreview} />
    </main>
  )
}
