"use client"

import { type FormEvent, useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileText,
  History,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  UserRound,
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

type ViewMode = "cards" | "list"
type AcpmType = "CORRECTIVA" | "PREVENTIVA" | "MEJORA"
type AcpmOrigin = "INVESTIGACION" | "AUDITORIA" | "INSPECCION" | "QUEJA" | "INDICADOR" | "OTRO"
type AcpmStatus = "ABIERTA" | "EN_EJECUCION" | "PENDIENTE_CIERRE" | "CERRADA"
type NonConformityStatus = "ABIERTA" | "CERRADA"
type HistoryType = "CREATED" | "DOCUMENT_GENERATED" | "FOLLOW_UP" | "EVIDENCE_UPLOADED" | "CLOSED"

type MockEmployee = {
  id: string
  name: string
  lastName: string
  job: string
}

type AcpmEvidence = {
  fileName: string
  uploadedAt: string
  uploadedBy: string
  isLate: boolean
}

type AcpmNonConformity = {
  acpmId: string
  description: string
  detectionDate: string
  source: AcpmOrigin
  status: NonConformityStatus
  closureDate?: string
  relatedDocument: string
  evidence?: AcpmEvidence
}

type AcpmFollowUp = {
  id: string
  acpmId: string
  followUpDate: string
  observations: string
  progressPercent: number
  evidence: string
}

type AcpmHistory = {
  id: string
  type: HistoryType
  title: string
  description: string
  actor: string
  createdAt: string
}

type Acpm = {
  id: string
  consecutive: string
  year: number
  creationDate: string
  type: AcpmType
  origin: AcpmOrigin
  name: string
  description: string
  responsibleId: string
  deadline: string
  status: AcpmStatus
  evidence?: AcpmEvidence
  nonConformity: AcpmNonConformity
  followUps: AcpmFollowUp[]
  history: AcpmHistory[]
}

type AcpmForm = {
  year: string
  type: AcpmType
  origin: AcpmOrigin
  name: string
  description: string
  responsibleId: string
  deadline: string
  nonConformityDescription: string
  detectionDate: string
  relatedDocument: string
}

type FollowUpForm = {
  followUpDate: string
  observations: string
  progressPercent: string
  evidence: string
}

const employees: MockEmployee[] = [
  { id: "emp-1", name: "Laura", lastName: "Martinez", job: "Coordinadora SST" },
  { id: "emp-2", name: "Andres", lastName: "Rojas", job: "Supervisor operativo" },
  { id: "emp-3", name: "Camila", lastName: "Gomez", job: "Analista de talento humano" },
  { id: "emp-4", name: "Julian", lastName: "Perez", job: "Jefe de mantenimiento" },
]

const currentYear = new Date().getFullYear()

const acpmTypeOptions: Array<{ value: AcpmType; label: string }> = [
  { value: "CORRECTIVA", label: "Correctiva" },
  { value: "PREVENTIVA", label: "Preventiva" },
  { value: "MEJORA", label: "Mejora" },
]

const acpmOriginOptions: Array<{ value: AcpmOrigin; label: string }> = [
  { value: "INVESTIGACION", label: "Investigacion" },
  { value: "AUDITORIA", label: "Auditoria" },
  { value: "INSPECCION", label: "Inspeccion" },
  { value: "QUEJA", label: "Queja" },
  { value: "INDICADOR", label: "Indicador" },
  { value: "OTRO", label: "Otro" },
]

const emptyForm: AcpmForm = {
  year: String(currentYear),
  type: "CORRECTIVA",
  origin: "INVESTIGACION",
  name: "",
  description: "",
  responsibleId: "",
  deadline: "",
  nonConformityDescription: "",
  detectionDate: "",
  relatedDocument: "",
}

const emptyFollowUpForm: FollowUpForm = {
  followUpDate: new Date().toISOString().slice(0, 10),
  observations: "",
  progressPercent: "",
  evidence: "",
}

const initialAcpms: Acpm[] = [
  {
    id: "acpm-1",
    consecutive: "ACPM-2026-001",
    year: 2026,
    creationDate: "2026-08-12T08:30:00",
    type: "CORRECTIVA",
    origin: "INSPECCION",
    name: "Control de senalizacion en pasillos",
    description: "Corregir ausencia de senalizacion preventiva en zonas de transito peatonal.",
    responsibleId: "emp-2",
    deadline: "2026-09-15",
    status: "EN_EJECUCION",
    nonConformity: {
      acpmId: "acpm-1",
      description: "Durante inspeccion se encontro senalizacion incompleta en pasillo de empaque.",
      detectionDate: "2026-08-10",
      source: "INSPECCION",
      status: "ABIERTA",
      relatedDocument: "INS-2026-018",
    },
    followUps: [
      {
        id: "follow-1",
        acpmId: "acpm-1",
        followUpDate: "2026-08-28",
        observations: "Se compro material y se programo instalacion.",
        progressPercent: 55,
        evidence: "orden-compra-senalizacion.pdf",
      },
    ],
    history: [
      {
        id: "history-1",
        type: "CREATED",
        title: "ACPM creado",
        description: "Se registro la accion correctiva y su no conformidad.",
        actor: "Sistema",
        createdAt: "2026-08-12T08:30:00",
      },
      {
        id: "history-2",
        type: "FOLLOW_UP",
        title: "Seguimiento registrado",
        description: "Avance del 55%. Se compro material y se programo instalacion.",
        actor: "Andres Rojas",
        createdAt: "2026-08-28T09:10:00",
      },
    ],
  },
  {
    id: "acpm-2",
    consecutive: "ACPM-2026-002",
    year: 2026,
    creationDate: "2026-08-20T10:00:00",
    type: "PREVENTIVA",
    origin: "INDICADOR",
    name: "Fortalecer reporte de actos inseguros",
    description: "Implementar seguimiento preventivo por baja participacion en reportes SST.",
    responsibleId: "emp-1",
    deadline: "2026-08-30",
    status: "CERRADA",
    evidence: {
      fileName: "cierre-acpm-reportes.pdf",
      uploadedAt: "2026-09-02T15:20:00",
      uploadedBy: "Laura Martinez",
      isLate: true,
    },
    nonConformity: {
      acpmId: "acpm-2",
      description: "Indicador mensual mostro baja participacion en reportes preventivos.",
      detectionDate: "2026-08-18",
      source: "INDICADOR",
      status: "CERRADA",
      closureDate: "2026-09-02T15:20:00",
      relatedDocument: "IND-SST-2026-08",
      evidence: {
        fileName: "cierre-acpm-reportes.pdf",
        uploadedAt: "2026-09-02T15:20:00",
        uploadedBy: "Laura Martinez",
        isLate: true,
      },
    },
    followUps: [
      {
        id: "follow-2",
        acpmId: "acpm-2",
        followUpDate: "2026-08-26",
        observations: "Se socializo campana con lideres de proceso.",
        progressPercent: 100,
        evidence: "acta-socializacion.pdf",
      },
    ],
    history: [
      {
        id: "history-3",
        type: "CREATED",
        title: "ACPM creado",
        description: "Se registro la accion preventiva desde indicador.",
        actor: "Sistema",
        createdAt: "2026-08-20T10:00:00",
      },
      {
        id: "history-4",
        type: "EVIDENCE_UPLOADED",
        title: "Evidencia cargada con retraso",
        description: "La evidencia fue cargada despues de la fecha limite.",
        actor: "Laura Martinez",
        createdAt: "2026-09-02T15:20:00",
      },
      {
        id: "history-5",
        type: "CLOSED",
        title: "No conformidad cerrada",
        description: "El documento de cierre fue cargado y la ACPM quedo cerrada.",
        actor: "Laura Martinez",
        createdAt: "2026-09-02T15:20:00",
      },
    ],
  },
]

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function nowIso() {
  return new Date().toISOString()
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

function employeeName(employeeId?: string) {
  const employee = employees.find((item) => item.id === employeeId)
  if (!employee) return "No asignado"
  return `${employee.name} ${employee.lastName}`
}

function employeeJob(employeeId?: string) {
  return employees.find((item) => item.id === employeeId)?.job ?? "Cargo no registrado"
}

function typeLabel(type: AcpmType) {
  return acpmTypeOptions.find((option) => option.value === type)?.label ?? type
}

function originLabel(origin: AcpmOrigin) {
  return acpmOriginOptions.find((option) => option.value === origin)?.label ?? origin
}

function statusLabel(status: AcpmStatus) {
  if (status === "ABIERTA") return "Abierta"
  if (status === "EN_EJECUCION") return "En ejecucion"
  if (status === "PENDIENTE_CIERRE") return "Pendiente cierre"
  return "Cerrada"
}

function statusClassName(status: AcpmStatus) {
  if (status === "CERRADA") return "bg-accentActivd text-accentActivd-foreground border-transparent"
  if (status === "PENDIENTE_CIERRE") return "bg-warning/10 text-warning border-warning/20"
  if (status === "EN_EJECUCION") return "bg-blue-600 text-white border-transparent"
  return "bg-secondary text-foreground border-border"
}

function normalizeNumberInput(value: string) {
  return value.replace(/\D/g, "")
}

function getPdfPageCount(doc: jsPDF) {
  return (
    (doc as unknown as { getNumberOfPages?: () => number }).getNumberOfPages?.() ??
    Math.max(1, ((doc.internal as unknown as { pages?: unknown[] }).pages?.length ?? 2) - 1)
  )
}

function isLateUpload(deadline: string, uploadedAt: string) {
  return new Date(`${formatDate(uploadedAt)}T00:00:00`) > new Date(`${deadline}T00:00:00`)
}

function buildHistory(type: HistoryType, title: string, description: string, actor: string): AcpmHistory {
  return {
    id: createId("history"),
    type,
    title,
    description,
    actor,
    createdAt: nowIso(),
  }
}

function AcpmDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (form: AcpmForm) => void
}) {
  const [form, setForm] = useState<AcpmForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const year = Number(form.year)

    if (!Number.isInteger(year) || year < currentYear) return toast.error(`El año debe ser ${currentYear} o posterior`)
    if (!form.name.trim()) return toast.error("Ingresa el nombre del ACPM")
    if (!form.description.trim()) return toast.error("Ingresa la descripcion")
    if (!form.responsibleId) return toast.error("Selecciona el responsable")
    if (!form.deadline) return toast.error("Selecciona la fecha limite")
    if (!form.nonConformityDescription.trim()) return toast.error("Describe la no conformidad")
    if (!form.detectionDate) return toast.error("Selecciona la fecha de deteccion")
    if (form.deadline < form.detectionDate) return toast.error("La fecha limite no puede ser anterior a la deteccion")

    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 250))
    onSave(form)
    setForm(emptyForm)
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Nuevo ACPM</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registra la accion y la no conformidad que le da origen. Las fechas quedan fijas despues de crear.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos generales</h3>
              <div className="grid gap-4 lg:grid-cols-[130px_170px_180px_minmax(0,1fr)]">
                <Label className="grid gap-2">
                  Año
                  <Input
                    type="number"
                    min={currentYear}
                    value={form.year}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, year: normalizeNumberInput(event.target.value).slice(0, 4) }))
                    }
                    onBlur={() => {
                      if (form.year && Number(form.year) < currentYear) {
                        setForm((current) => ({ ...current, year: String(currentYear) }))
                        toast.error(`El año debe ser ${currentYear} o posterior`)
                      }
                    }}
                  />
                </Label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Tipo</span>
                  <select
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AcpmType }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {acpmTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Origen</span>
                  <select
                    value={form.origin}
                    onChange={(event) => setForm((current) => ({ ...current, origin: event.target.value as AcpmOrigin }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {acpmOriginOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Label className="grid gap-2">
                  Nombre del ACPM
                  <Input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ej. Accion correctiva por hallazgo de inspeccion"
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Descripcion y responsable</h3>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Label className="grid gap-2">
                  Descripcion
                  <Textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={4}
                    placeholder="Describe la accion correctiva, preventiva o de mejora."
                  />
                </Label>
                <div className="grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-foreground">Responsable</span>
                    <select
                      value={form.responsibleId}
                      onChange={(event) => setForm((current) => ({ ...current, responsibleId: event.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Selecciona responsable</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employeeName(employee.id)} - {employee.job}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Label className="grid gap-2">
                    Fecha limite
                    <Input
                      type="date"
                      value={form.deadline}
                      onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
                    />
                  </Label>
                </div>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">No conformidad</h3>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_260px]">
                <Label className="grid gap-2">
                  Descripcion de la situacion
                  <Textarea
                    value={form.nonConformityDescription}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, nonConformityDescription: event.target.value }))
                    }
                    rows={4}
                    placeholder="Registra especificamente la situacion que dio origen al ACPM."
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha deteccion
                  <Input
                    type="date"
                    value={form.detectionDate}
                    onChange={(event) => setForm((current) => ({ ...current, detectionDate: event.target.value }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Documento relacionado
                  <Input
                    value={form.relatedDocument}
                    onChange={(event) => setForm((current) => ({ ...current, relatedDocument: event.target.value }))}
                    placeholder="Acta, informe, inspeccion, indicador u otro"
                  />
                </Label>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear ACPM
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FollowUpDialog({
  acpm,
  onClose,
  onSave,
}: {
  acpm: Acpm | null
  onClose: () => void
  onSave: (acpm: Acpm, form: FollowUpForm) => void
}) {
  const [form, setForm] = useState<FollowUpForm>(emptyFollowUpForm)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!acpm) return
    const progress = Number(form.progressPercent)

    if (!form.followUpDate) return toast.error("Selecciona la fecha de seguimiento")
    if (!form.observations.trim()) return toast.error("Ingresa las observaciones")
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      return toast.error("El porcentaje debe estar entre 0 y 100")
    }
    if (!form.evidence.trim()) return toast.error("Registra la evidencia del seguimiento")

    onSave(acpm, form)
    setForm(emptyFollowUpForm)
    onClose()
  }

  return (
    <Dialog open={Boolean(acpm)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar seguimiento</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Puedes registrar varios seguimientos hasta llegar al 100% de cumplimiento.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Fecha seguimiento
              <Input
                type="date"
                value={form.followUpDate}
                onChange={(event) => setForm((current) => ({ ...current, followUpDate: event.target.value }))}
              />
            </Label>
            <Label className="grid gap-2">
              % cumplimiento
              <Input
                type="number"
                min={0}
                max={100}
                value={form.progressPercent}
                onChange={(event) => setForm((current) => ({ ...current, progressPercent: event.target.value }))}
                placeholder="0"
              />
            </Label>
          </div>
          <Label className="grid gap-2">
            Observaciones
            <Textarea
              value={form.observations}
              onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
              rows={3}
            />
          </Label>
          <Label className="grid gap-2">
            Evidencia
            <Input
              value={form.evidence}
              onChange={(event) => setForm((current) => ({ ...current, evidence: event.target.value }))}
              placeholder="Nombre del soporte del seguimiento"
            />
          </Label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              Guardar seguimiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  acpm,
  onClose,
  onUpload,
}: {
  acpm: Acpm | null
  onClose: () => void
  onUpload: (acpm: Acpm, fileName: string) => void
}) {
  const [fileName, setFileName] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!acpm) return
    if (!fileName.trim()) return toast.error("Sube o registra el documento de cierre")

    onUpload(acpm, fileName.trim())
    setFileName("")
    onClose()
  }

  return (
    <Dialog open={Boolean(acpm)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subir evidencia de cierre</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Al cargar el documento, la no conformidad se cierra y se valida si fue cargado con retraso.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {acpm && (
            <div className="rounded-md bg-secondary p-3 text-sm text-muted-foreground">
              Fecha limite: {formatDate(acpm.deadline)}
            </div>
          )}
          <div className="rounded-md border border-dashed border-border bg-secondary p-4">
            <Label className="grid gap-2">
              Documento firmado o soporte de cierre
              <Input type="file" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
            </Label>
            <Input
              className="mt-3"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder="Tambien puedes escribir el nombre del archivo mock"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <Upload className="h-4 w-4" />
              Cerrar con evidencia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DetailDialog({
  acpm,
  onClose,
}: {
  acpm: Acpm | null
  onClose: () => void
}) {
  if (!acpm) return null

  return (
    <Dialog open={Boolean(acpm)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Detalle {acpm.consecutive}</DialogTitle>
          <p className="text-sm text-muted-foreground">Consulta no conformidad, seguimientos, evidencia e historial.</p>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoBlock label="Tipo" value={typeLabel(acpm.type)} />
            <InfoBlock label="Origen" value={originLabel(acpm.origin)} />
            <InfoBlock label="Responsable" value={employeeName(acpm.responsibleId)} />
            <InfoBlock label="Fecha limite" value={formatDate(acpm.deadline)} />
          </div>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Descripcion ACPM</h3>
            <p className="text-sm text-muted-foreground">{acpm.description}</p>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">No conformidad</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <InfoBlock label="Fecha deteccion" value={formatDate(acpm.nonConformity.detectionDate)} />
              <InfoBlock label="Fuente" value={originLabel(acpm.nonConformity.source)} />
              <InfoBlock label="Estado" value={acpm.nonConformity.status === "CERRADA" ? "Cerrada" : "Abierta"} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{acpm.nonConformity.description}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Documento relacionado: {acpm.nonConformity.relatedDocument || "No registrado"}
            </p>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Seguimientos</h3>
            <div className="space-y-3">
              {acpm.followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aun no hay seguimientos registrados.</p>
              ) : (
                acpm.followUps.map((followUp) => (
                  <div key={followUp.id} className="rounded-md bg-secondary p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{formatDate(followUp.followUpDate)}</p>
                      <Badge variant="outline">{followUp.progressPercent}%</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{followUp.observations}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Evidencia: {followUp.evidence}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Evidencia de cierre</h3>
            {acpm.evidence ? (
              <div className="rounded-md bg-secondary p-3 text-sm">
                <p className="font-medium text-foreground">{acpm.evidence.fileName}</p>
                <p className={acpm.evidence.isLate ? "text-destructive" : "text-muted-foreground"}>
                  {acpm.evidence.isLate ? "Cargado con retraso" : "Cargado a tiempo"} -{" "}
                  {formatDateTime(acpm.evidence.uploadedAt)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay evidencia de cierre cargada.</p>
            )}
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <History className="h-4 w-4" />
              Historial
            </h3>
            <div className="space-y-3">
              {acpm.history.map((event) => (
                <div key={event.id} className="border-l-2 border-primary/40 pl-4">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(event.createdAt)} - {event.actor}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
        <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
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

export default function AcpmPage() {
  const [acpms, setAcpms] = useState<Acpm[]>(initialAcpms)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<AcpmStatus | "all">("all")
  const [yearFilter, setYearFilter] = useState(String(currentYear))
  const [createOpen, setCreateOpen] = useState(false)
  const [followUpAcpm, setFollowUpAcpm] = useState<Acpm | null>(null)
  const [evidenceAcpm, setEvidenceAcpm] = useState<Acpm | null>(null)
  const [detailAcpm, setDetailAcpm] = useState<Acpm | null>(null)

  const filteredAcpms = useMemo(() => {
    const query = search.trim().toLowerCase()

    return acpms.filter((acpm) => {
      const matchesSearch =
        !query ||
        acpm.consecutive.toLowerCase().includes(query) ||
        acpm.name.toLowerCase().includes(query) ||
        acpm.description.toLowerCase().includes(query) ||
        employeeName(acpm.responsibleId).toLowerCase().includes(query)
      const matchesStatus = statusFilter === "all" || acpm.status === statusFilter
      const matchesYear = yearFilter === "all" || String(acpm.year) === yearFilter

      return matchesSearch && matchesStatus && matchesYear
    })
  }, [acpms, search, statusFilter, yearFilter])

  const stats = useMemo(() => {
    return {
      total: acpms.length,
      open: acpms.filter((acpm) => acpm.status !== "CERRADA").length,
      pendingClosure: acpms.filter((acpm) => acpm.status === "PENDIENTE_CIERRE").length,
      closed: acpms.filter((acpm) => acpm.status === "CERRADA").length,
      late: acpms.filter((acpm) => acpm.evidence?.isLate).length,
    }
  }, [acpms])

  function createAcpm(form: AcpmForm) {
    const year = Number(form.year) || currentYear
    const nextNumber = acpms.length + 1
    const createdAt = nowIso()
    const id = createId("acpm")
    const acpm: Acpm = {
      id,
      consecutive: `ACPM-${year}-${String(nextNumber).padStart(3, "0")}`,
      year,
      creationDate: createdAt,
      type: form.type,
      origin: form.origin,
      name: form.name.trim(),
      description: form.description.trim(),
      responsibleId: form.responsibleId,
      deadline: form.deadline,
      status: "ABIERTA",
      nonConformity: {
        acpmId: id,
        description: form.nonConformityDescription.trim(),
        detectionDate: form.detectionDate,
        source: form.origin,
        status: "ABIERTA",
        relatedDocument: form.relatedDocument.trim(),
      },
      followUps: [],
      history: [
        {
          id: createId("history"),
          type: "CREATED",
          title: "ACPM creado",
          description: "Se registro el documento ACPM y la no conformidad asociada.",
          actor: "Sistema",
          createdAt,
        },
      ],
    }

    setAcpms((current) => [acpm, ...current])
    toast.success("ACPM creado")
  }

  function addFollowUp(acpm: Acpm, form: FollowUpForm) {
    const progress = Number(form.progressPercent)
    const actor = employeeName(acpm.responsibleId)
    const followUp: AcpmFollowUp = {
      id: createId("follow"),
      acpmId: acpm.id,
      followUpDate: form.followUpDate,
      observations: form.observations.trim(),
      progressPercent: progress,
      evidence: form.evidence.trim(),
    }
    const nextStatus: AcpmStatus = progress >= 100 ? "PENDIENTE_CIERRE" : "EN_EJECUCION"

    setAcpms((current) =>
      current.map((item) =>
        item.id === acpm.id
          ? {
              ...item,
              status: item.status === "CERRADA" ? "CERRADA" : nextStatus,
              followUps: [followUp, ...item.followUps],
              history: [
                buildHistory(
                  "FOLLOW_UP",
                  "Seguimiento registrado",
                  `Avance del ${progress}%. ${form.observations.trim()}`,
                  actor,
                ),
                ...item.history,
              ],
            }
          : item,
      ),
    )
    toast.success(progress >= 100 ? "Seguimiento registrado. Queda pendiente de cierre" : "Seguimiento registrado")
  }

  function uploadEvidence(acpm: Acpm, fileName: string) {
    const uploadedAt = nowIso()
    const actor = employeeName(acpm.responsibleId)
    const late = isLateUpload(acpm.deadline, uploadedAt)
    const evidence: AcpmEvidence = {
      fileName,
      uploadedAt,
      uploadedBy: actor,
      isLate: late,
    }

    setAcpms((current) =>
      current.map((item) =>
        item.id === acpm.id
          ? {
              ...item,
              status: "CERRADA",
              evidence,
              nonConformity: {
                ...item.nonConformity,
                status: "CERRADA",
                closureDate: uploadedAt,
                evidence,
              },
              history: [
                buildHistory(
                  "EVIDENCE_UPLOADED",
                  late ? "Evidencia cargada con retraso" : "Evidencia cargada",
                  late
                    ? "El documento de cierre fue cargado despues de la fecha limite establecida."
                    : "El documento de cierre fue cargado dentro del plazo establecido.",
                  actor,
                ),
                buildHistory(
                  "CLOSED",
                  "No conformidad cerrada",
                  "La no conformidad se cerro automaticamente al subir la evidencia.",
                  actor,
                ),
                ...item.history,
              ],
            }
          : item,
      ),
    )
    toast.success(late ? "ACPM cerrado con retraso" : "ACPM cerrado con evidencia")
  }

  function generateDocument(acpm: Acpm) {
    const doc = new jsPDF("p", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14
    const contentWidth = pageWidth - margin * 2
    const primaryColor: [number, number, number] = [31, 92, 77]
    const softColor: [number, number, number] = [235, 244, 241]
    let y = 16

    function ensureSpace(requiredHeight: number) {
      if (y + requiredHeight <= pageHeight - 22) return
      doc.addPage()
      y = 18
    }

    function sectionTitle(title: string) {
      ensureSpace(12)
      doc.setFillColor(...softColor)
      doc.setDrawColor(210, 226, 220)
      doc.roundedRect(margin, y, contentWidth, 9, 2, 2, "FD")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(...primaryColor)
      doc.text(title.toUpperCase(), margin + 3, y + 6)
      y += 14
    }

    function paragraph(text: string) {
      const lines = doc.splitTextToSize(text, contentWidth)
      ensureSpace(lines.length * 5 + 2)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(30, 41, 59)
      doc.text(lines, margin, y)
      y += lines.length * 5 + 3
    }

    function addFooter() {
      const pageCount = getPdfPageCount(doc)
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        doc.setPage(pageNumber)
        doc.setDrawColor(220, 226, 224)
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text("Documento generado desde el Sistema de Gestion SG-SST", margin, pageHeight - 8)
        doc.text(`Pagina ${pageNumber} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" })
      }
    }

    doc.setFillColor(...primaryColor)
    doc.roundedRect(margin, y, contentWidth, 25, 3, 3, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(15)
    doc.text("DOCUMENTO ACPM", margin + 5, y + 9)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(acpm.consecutive, margin + 5, y + 16)
    doc.text(`Fecha de generacion: ${formatDate(new Date().toISOString())}`, pageWidth - margin - 5, y + 16, {
      align: "right",
    })
    y += 33

    sectionTitle("Datos generales")
    autoTable(doc, {
      startY: y,
      theme: "grid",
      margin: { left: margin, right: margin },
      body: [
        ["Consecutivo", acpm.consecutive],
        ["Ano", String(acpm.year)],
        ["Fecha creacion", formatDate(acpm.creationDate)],
        ["Tipo", typeLabel(acpm.type)],
        ["Origen", originLabel(acpm.origin)],
        ["Nombre", acpm.name],
        ["Responsable", `${employeeName(acpm.responsibleId)} - ${employeeJob(acpm.responsibleId)}`],
        ["Fecha limite", formatDate(acpm.deadline)],
        ["Estado", statusLabel(acpm.status)],
      ],
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2.5, lineColor: [220, 226, 224], lineWidth: 0.1 },
      columnStyles: { 0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 48 }, 1: { cellWidth: contentWidth - 48 } },
    })
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8

    sectionTitle("Descripcion")
    paragraph(acpm.description)

    sectionTitle("No conformidad")
    paragraph(acpm.nonConformity.description)
    autoTable(doc, {
      startY: y,
      theme: "grid",
      margin: { left: margin, right: margin },
      body: [
        ["Fecha deteccion", formatDate(acpm.nonConformity.detectionDate)],
        ["Fuente", originLabel(acpm.nonConformity.source)],
        ["Documento relacionado", acpm.nonConformity.relatedDocument || "No registrado"],
        ["Estado", acpm.nonConformity.status === "CERRADA" ? "Cerrada" : "Abierta"],
      ],
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2.5, lineColor: [220, 226, 224], lineWidth: 0.1 },
      columnStyles: { 0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 48 }, 1: { cellWidth: contentWidth - 48 } },
    })
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8

    sectionTitle("Seguimientos")
    autoTable(doc, {
      startY: y,
      theme: "grid",
      margin: { left: margin, right: margin },
      head: [["Fecha", "Avance", "Observaciones", "Evidencia"]],
      body: acpm.followUps.length
        ? acpm.followUps.map((followUp) => [
            formatDate(followUp.followUpDate),
            `${followUp.progressPercent}%`,
            followUp.observations,
            followUp.evidence,
          ])
        : [["Sin seguimiento", "0%", "No hay seguimientos registrados", ""]],
      styles: { font: "helvetica", fontSize: 8, cellPadding: 2.2, lineColor: [220, 226, 224], lineWidth: 0.1 },
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 22, halign: "center" },
        2: { cellWidth: 80 },
        3: { cellWidth: contentWidth - 128 },
      },
    })
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 12

    sectionTitle("Cierre y firma")
    paragraph("La no conformidad se cerrara una vez se cargue la evidencia documental correspondiente.")
    ensureSpace(30)
    doc.setDrawColor(120, 130, 140)
    doc.line(margin, y + 18, margin + 78, y + 18)
    doc.line(pageWidth - margin - 78, y + 18, pageWidth - margin, y + 18)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(30, 41, 59)
    doc.text("Responsable", margin, y + 24)
    doc.text("Aprobacion / cierre", pageWidth - margin - 78, y + 24)

    addFooter()
    doc.save(`${acpm.consecutive}_${acpm.name.replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`)

    setAcpms((current) =>
      current.map((item) =>
        item.id === acpm.id
          ? {
              ...item,
              history: [
                buildHistory("DOCUMENT_GENERATED", "Documento generado", "Se descargo el documento ACPM en PDF.", "Sistema"),
                ...item.history,
              ],
            }
          : item,
      ),
    )
  }

  function downloadEvidence(acpm: Acpm) {
    if (!acpm.evidence) {
      toast.error("Este ACPM aun no tiene evidencia cargada")
      return
    }

    const blob = new Blob(
      [
        `Evidencia ACPM mock\nConsecutivo: ${acpm.consecutive}\nArchivo: ${acpm.evidence.fileName}\nFecha carga: ${formatDateTime(
          acpm.evidence.uploadedAt,
        )}\nEstado: ${acpm.evidence.isLate ? "Cargado con retraso" : "Cargado a tiempo"}\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = acpm.evidence.fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ACPM</h1>
          <p className="text-muted-foreground">
            Administra acciones correctivas, preventivas y de mejora con seguimiento, cierre e historial.
          </p>
        </div>
        <Button type="button" className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo ACPM
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center overflow-x-auto px-3 py-1">
          <div className="flex w-fit min-w-max items-center gap-2">
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-foreground">{stats.total}</span>
              <span className="ml-2 text-xs text-muted-foreground">ACPM</span>
            </div>
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-blue-700">{stats.open}</span>
              <span className="ml-2 text-xs text-muted-foreground">Abiertos</span>
            </div>
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-amber-700">{stats.pendingClosure}</span>
              <span className="ml-2 text-xs text-muted-foreground">Pendiente cierre</span>
            </div>
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-emerald-700">{stats.closed}</span>
              <span className="ml-2 text-xs text-muted-foreground">Cerrados</span>
            </div>
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-destructive">{stats.late}</span>
              <span className="ml-2 text-xs text-muted-foreground">Con retraso</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_150px_220px]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Consecutivo, nombre, descripcion o responsable"
              />
            </div>
          </Label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Año</span>
            <select
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Estado</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as AcpmStatus | "all")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="ABIERTA">Abierta</option>
              <option value="EN_EJECUCION">En ejecucion</option>
              <option value="PENDIENTE_CIERRE">Pendiente cierre</option>
              <option value="CERRADA">Cerrada</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lista de ACPM</h2>
            <p className="text-sm text-muted-foreground">{filteredAcpms.length} registros encontrados</p>
          </div>
          <div className="inline-flex w-fit rounded-md border border-border bg-secondary p-1">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "cards" ? "default" : "ghost"}
              className="h-8 gap-2"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
              Tarjetas
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
              className="h-8 gap-2"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
              Lista
            </Button>
          </div>
        </div>

        {filteredAcpms.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay ACPM que coincidan con los filtros actuales.
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredAcpms.map((acpm) => (
              <Card key={acpm.id} className="border-border bg-card">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{acpm.name}</h3>
                        <Badge variant="outline" className={statusClassName(acpm.status)}>
                          {statusLabel(acpm.status)}
                        </Badge>
                        {acpm.evidence?.isLate && (
                          <Badge variant="outline" className="border-destructive bg-destructive/10 text-destructive">
                            Con retraso
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{acpm.consecutive}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDetailAcpm(acpm)}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{acpm.description}</p>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      {employeeName(acpm.responsibleId)}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Limite: {formatDate(acpm.deadline)}
                    </p>
                    <p className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {typeLabel(acpm.type)} / {originLabel(acpm.origin)}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {acpm.followUps[0]?.progressPercent ?? 0}% avance
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => generateDocument(acpm)}>
                      <Download className="h-4 w-4" />
                      Documento
                    </Button>
                    {acpm.status !== "CERRADA" && (
                      <>
                        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setFollowUpAcpm(acpm)}>
                          <Plus className="h-4 w-4" />
                          Seguimiento
                        </Button>
                        <Button type="button" size="sm" className="gap-2" onClick={() => setEvidenceAcpm(acpm)}>
                          <Upload className="h-4 w-4" />
                          Cerrar
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[1320px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">ACPM</th>
                  <th className="px-4 py-3 font-medium">Tipo / origen</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Fechas</th>
                  <th className="px-4 py-3 font-medium">Avance</th>
                  <th className="px-4 py-3 font-medium">Evidencia</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAcpms.map((acpm) => (
                  <tr key={acpm.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="max-w-[260px] truncate font-medium text-foreground">{acpm.name}</p>
                      <p className="text-muted-foreground">{acpm.consecutive}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>{typeLabel(acpm.type)}</p>
                      <p>{originLabel(acpm.origin)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[190px] truncate font-medium text-foreground">{employeeName(acpm.responsibleId)}</p>
                      <p className="max-w-[190px] truncate text-muted-foreground">{employeeJob(acpm.responsibleId)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>Creacion: {formatDate(acpm.creationDate)}</p>
                      <p>Limite: {formatDate(acpm.deadline)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{acpm.followUps[0]?.progressPercent ?? 0}%</td>
                    <td className="px-4 py-3">
                      {acpm.evidence ? (
                        <div>
                          <p className="max-w-[180px] truncate text-muted-foreground">{acpm.evidence.fileName}</p>
                          <p className={acpm.evidence.isLate ? "font-medium text-destructive" : "text-muted-foreground"}>
                            {acpm.evidence.isLate ? "Con retraso" : "A tiempo"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Pendiente</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusClassName(acpm.status)}>
                        {statusLabel(acpm.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => setDetailAcpm(acpm)}>
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => generateDocument(acpm)}>
                            <Download className="h-4 w-4" />
                            Generar documento
                          </DropdownMenuItem>
                          {acpm.status !== "CERRADA" && (
                            <>
                              <DropdownMenuItem onSelect={() => setFollowUpAcpm(acpm)}>
                                <Plus className="h-4 w-4" />
                                Agregar seguimiento
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setEvidenceAcpm(acpm)}>
                                <Upload className="h-4 w-4" />
                                Subir evidencia cierre
                              </DropdownMenuItem>
                            </>
                          )}
                          {acpm.evidence && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => downloadEvidence(acpm)}>
                                <Download className="h-4 w-4" />
                                Descargar evidencia
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AcpmDialog open={createOpen} onClose={() => setCreateOpen(false)} onSave={createAcpm} />
      <FollowUpDialog acpm={followUpAcpm} onClose={() => setFollowUpAcpm(null)} onSave={addFollowUp} />
      <EvidenceDialog acpm={evidenceAcpm} onClose={() => setEvidenceAcpm(null)} onUpload={uploadEvidence} />
      <DetailDialog acpm={detailAcpm} onClose={() => setDetailAcpm(null)} />
    </main>
  )
}
