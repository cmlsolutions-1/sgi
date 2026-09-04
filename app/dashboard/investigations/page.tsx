"use client"

import { type FormEvent, useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Eye,
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
  X,
  XCircle,
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

type ViewMode = "cards" | "list"
type ReviewerType = "EMPLOYEE" | "EXTERNAL"
type EfficacyStatus = "REPORTADO" | "PENDIENTE_VERIFICACION" | "EFICAZ"
type AcpmSource = "ACPM" | "DOCUMENT_MANAGEMENT" | "OTHER"
type TraceEventType = "CREATED" | "EVIDENCE_UPLOADED" | "VERIFIED_EFFECTIVE" | "VERIFIED_NOT_EFFECTIVE" | "UPDATED"

type MockEmployee = {
  id: string
  name: string
  lastName: string
  job: string
}

type MockIncident = {
  id: string
  consecutive: string
  title: string
  employeeName: string
  date: string
}

type Reviewer = {
  id: string
  type: ReviewerType
  employeeId?: string
  externalName?: string
}

type Evidence = {
  id: string
  fileName: string
  uploadedAt: string
  uploadedBy: string
  observation: string
}

type TraceEvent = {
  id: string
  type: TraceEventType
  title: string
  description: string
  createdAt: string
  actor: string
}

type Investigation = {
  id: string
  consecutive: string
  incidentId: string
  responsibleEmployeeId: string
  reviewers: Reviewer[]
  causeAnalysis: string
  correctiveActions?: string
  preventiveActions?: string
  improvementActions?: string
  acpmSource: AcpmSource
  acpmReference: string
  expectedClosureDate?: string
  efficacyStatus: EfficacyStatus
  reviewDate?: string
  closureDate?: string
  closedBy?: string
  evidences: Evidence[]
  traceability: TraceEvent[]
  createdAt: string
}

type InvestigationForm = {
  incidentId: string
  responsibleEmployeeId: string
  reviewers: Reviewer[]
  causeAnalysis: string
  correctiveActions: string
  preventiveActions: string
  improvementActions: string
  acpmSource: AcpmSource
  acpmReference: string
  expectedClosureDate: string
}

const employees: MockEmployee[] = [
  { id: "emp-1", name: "Laura", lastName: "Martinez", job: "Coordinadora SST" },
  { id: "emp-2", name: "Andres", lastName: "Rojas", job: "Supervisor operativo" },
  { id: "emp-3", name: "Camila", lastName: "Gomez", job: "Analista de talento humano" },
  { id: "emp-4", name: "Julian", lastName: "Perez", job: "Jefe de mantenimiento" },
]

const incidents: MockIncident[] = [
  {
    id: "inc-1",
    consecutive: "INC-1",
    title: "Caida al mismo nivel en zona de empaque",
    employeeName: "Daniela Ruiz",
    date: "2026-08-18",
  },
  {
    id: "inc-2",
    consecutive: "INC-2",
    title: "Golpe en mano durante ajuste de maquina",
    employeeName: "Carlos Medina",
    date: "2026-08-22",
  },
  {
    id: "inc-3",
    consecutive: "INC-3",
    title: "Exposicion a ruido en area de produccion",
    employeeName: "Natalia Torres",
    date: "2026-08-27",
  },
]

const emptyForm: InvestigationForm = {
  incidentId: "",
  responsibleEmployeeId: "",
  reviewers: [{ id: "reviewer-1", type: "EMPLOYEE", employeeId: "" }],
  causeAnalysis: "",
  correctiveActions: "",
  preventiveActions: "",
  improvementActions: "",
  acpmSource: "ACPM",
  acpmReference: "",
  expectedClosureDate: "",
}

const initialInvestigations: Investigation[] = [
  {
    id: "inv-1",
    consecutive: "INV-001",
    incidentId: "inc-1",
    responsibleEmployeeId: "emp-2",
    reviewers: [
      { id: "reviewer-1", type: "EMPLOYEE", employeeId: "emp-1" },
      { id: "reviewer-2", type: "EXTERNAL", externalName: "Asesor ARL" },
    ],
    causeAnalysis:
      "Se identifica falta de senalizacion temporal durante limpieza y ausencia de validacion visual antes de habilitar el paso.",
    correctiveActions: "Reubicar senalizacion y reforzar inspeccion diaria del area.",
    preventiveActions: "Actualizar charla de autocuidado para desplazamientos internos.",
    improvementActions: "Incluir punto de verificacion en lista de chequeo operacional.",
    acpmSource: "ACPM",
    acpmReference: "ACPM-2026-014",
    expectedClosureDate: "2026-09-12",
    efficacyStatus: "PENDIENTE_VERIFICACION",
    evidences: [
      {
        id: "evi-1",
        fileName: "registro-fotografico-senalizacion.pdf",
        uploadedAt: "2026-08-29T09:20:00",
        uploadedBy: "Andres Rojas",
        observation: "Se adjunta evidencia de senalizacion instalada.",
      },
    ],
    traceability: [
      {
        id: "tr-1",
        type: "CREATED",
        title: "Investigacion creada",
        description: "La investigacion quedo reportada y pendiente de evidencia.",
        createdAt: "2026-08-24T08:15:00",
        actor: "Laura Martinez",
      },
      {
        id: "tr-2",
        type: "EVIDENCE_UPLOADED",
        title: "Evidencia cargada",
        description: "El responsable cargo evidencia documental para revision.",
        createdAt: "2026-08-29T09:20:00",
        actor: "Andres Rojas",
      },
    ],
    createdAt: "2026-08-24T08:15:00",
  },
]

function employeeName(employeeId?: string) {
  const employee = employees.find((item) => item.id === employeeId)
  if (!employee) return "No asignado"
  return `${employee.name} ${employee.lastName}`
}

function incidentLabel(incidentId: string) {
  const incident = incidents.find((item) => item.id === incidentId)
  if (!incident) return "Novedad no encontrada"
  return `${incident.consecutive} - ${incident.title}`
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

function nowIso() {
  return new Date().toISOString()
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function efficacyLabel(status: EfficacyStatus) {
  if (status === "EFICAZ") return "Eficaz"
  if (status === "PENDIENTE_VERIFICACION") return "Pendiente de verificacion"
  return "Reportado"
}

function efficacyClassName(status: EfficacyStatus) {
  if (status === "EFICAZ") return "bg-accentActivd text-accentActivd-foreground border-transparent"
  if (status === "PENDIENTE_VERIFICACION") return "bg-warning/10 text-warning border-warning/20"
  return "bg-blue-600 text-white border-transparent"
}

function acpmSourceLabel(source: AcpmSource) {
  if (source === "DOCUMENT_MANAGEMENT") return "Documento de gestion documental"
  if (source === "OTHER") return "Otro"
  return "Consecutivo ACPM"
}

function reviewerLabel(reviewer: Reviewer) {
  if (reviewer.type === "EMPLOYEE") return employeeName(reviewer.employeeId)
  return reviewer.externalName?.trim() || "Persona externa"
}

function buildTrace(type: TraceEventType, title: string, description: string, actor: string): TraceEvent {
  return {
    id: createId("trace"),
    type,
    title,
    description,
    actor,
    createdAt: nowIso(),
  }
}

function InvestigationDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (form: InvestigationForm) => void
}) {
  const [form, setForm] = useState<InvestigationForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  function updateReviewer(reviewerId: string, changes: Partial<Reviewer>) {
    setForm((current) => ({
      ...current,
      reviewers: current.reviewers.map((reviewer) =>
        reviewer.id === reviewerId
          ? {
              ...reviewer,
              ...changes,
              employeeId: changes.type === "EXTERNAL" ? "" : changes.employeeId ?? reviewer.employeeId,
              externalName: changes.type === "EMPLOYEE" ? "" : changes.externalName ?? reviewer.externalName,
            }
          : reviewer,
      ),
    }))
  }

  function addReviewer() {
    setForm((current) => ({
      ...current,
      reviewers: [...current.reviewers, { id: createId("reviewer"), type: "EMPLOYEE", employeeId: "" }],
    }))
  }

  function removeReviewer(reviewerId: string) {
    setForm((current) => ({
      ...current,
      reviewers: current.reviewers.length === 1
        ? current.reviewers
        : current.reviewers.filter((reviewer) => reviewer.id !== reviewerId),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const hasValidReviewer = form.reviewers.some((reviewer) =>
      reviewer.type === "EMPLOYEE" ? Boolean(reviewer.employeeId) : Boolean(reviewer.externalName?.trim()),
    )

    if (!form.incidentId) return toast.error("Selecciona la novedad laboral asociada")
    if (!form.responsibleEmployeeId) return toast.error("Selecciona el empleado responsable")
    if (!hasValidReviewer) return toast.error("Agrega al menos una persona investigadora")
    if (!form.causeAnalysis.trim()) return toast.error("Diligencia el analisis de las causas")
    if (!form.acpmReference.trim()) return toast.error("Relaciona el consecutivo o documento ACPM")

    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    onSave(form)
    setForm(emptyForm)
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-7xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-7xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Nueva investigacion</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registra la novedad asociada, responsables, acciones y referencia ACPM.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos principales</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-foreground">Novedad laboral</span>
                  <select
                    value={form.incidentId}
                    onChange={(event) => setForm((current) => ({ ...current, incidentId: event.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona una novedad</option>
                    {incidents.map((incident) => (
                      <option key={incident.id} value={incident.id}>
                        {incident.consecutive} - {incident.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-foreground">Empleado responsable</span>
                  <select
                    value={form.responsibleEmployeeId}
                    onChange={(event) => setForm((current) => ({ ...current, responsibleEmployeeId: event.target.value }))}
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
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">Personas que revisan la investigacion</h3>
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addReviewer}>
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>

              <div className="space-y-3">
                {form.reviewers.map((reviewer, index) => (
                  <div key={reviewer.id} className="grid gap-3 rounded-md bg-secondary p-3 lg:grid-cols-[190px_minmax(0,1fr)_44px]">
                    <select
                      value={reviewer.type}
                      onChange={(event) => updateReviewer(reviewer.id, { type: event.target.value as ReviewerType })}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      aria-label={`Tipo de investigador ${index + 1}`}
                    >
                      <option value="EMPLOYEE">Funcionario</option>
                      <option value="EXTERNAL">Externo</option>
                    </select>

                    {reviewer.type === "EMPLOYEE" ? (
                      <select
                        value={reviewer.employeeId ?? ""}
                        onChange={(event) => updateReviewer(reviewer.id, { employeeId: event.target.value })}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                        aria-label={`Funcionario investigador ${index + 1}`}
                      >
                        <option value="">Selecciona funcionario</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employeeName(employee.id)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={reviewer.externalName ?? ""}
                        onChange={(event) => updateReviewer(reviewer.id, { externalName: event.target.value })}
                        placeholder="Nombre completo de la persona externa"
                      />
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReviewer(reviewer.id)}
                      aria-label="Quitar investigador"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <Label className="grid gap-2">
                Analisis de las causas
                <Textarea
                  value={form.causeAnalysis}
                  onChange={(event) => setForm((current) => ({ ...current, causeAnalysis: event.target.value }))}
                  rows={4}
                  placeholder="Describe hallazgos, causas inmediatas, basicas y controles faltantes."
                />
              </Label>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Plan de acciones</h3>
              <div className="grid gap-4 xl:grid-cols-3">
                <Label className="grid gap-2">
                  Acciones correctivas
                  <Textarea
                    value={form.correctiveActions}
                    onChange={(event) => setForm((current) => ({ ...current, correctiveActions: event.target.value }))}
                    rows={3}
                    placeholder="Opcional"
                  />
                </Label>
                <Label className="grid gap-2">
                  Acciones preventivas
                  <Textarea
                    value={form.preventiveActions}
                    onChange={(event) => setForm((current) => ({ ...current, preventiveActions: event.target.value }))}
                    rows={3}
                    placeholder="Opcional"
                  />
                </Label>
                <Label className="grid gap-2">
                  Acciones de mejora
                  <Textarea
                    value={form.improvementActions}
                    onChange={(event) => setForm((current) => ({ ...current, improvementActions: event.target.value }))}
                    rows={3}
                    placeholder="Opcional"
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Cierre y documento ACPM</h3>
              <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-foreground">Relacion ACPM</span>
                  <select
                    value={form.acpmSource}
                    onChange={(event) => setForm((current) => ({ ...current, acpmSource: event.target.value as AcpmSource }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="ACPM">Consecutivo ACPM</option>
                    <option value="DOCUMENT_MANAGEMENT">Documento creado</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </label>

                <Label className="grid gap-2">
                  Nro. consecutivo o referencia
                  <Input
                    value={form.acpmReference}
                    onChange={(event) => setForm((current) => ({ ...current, acpmReference: event.target.value }))}
                    placeholder="ACPM-2026-001, documento o descripcion"
                  />
                </Label>

                <Label className="grid gap-2">
                  Fecha estimada de cierre
                  <Input
                    type="date"
                    value={form.expectedClosureDate}
                    onChange={(event) => setForm((current) => ({ ...current, expectedClosureDate: event.target.value }))}
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
              Crear investigacion
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  investigation,
  onClose,
  onUpload,
}: {
  investigation: Investigation | null
  onClose: () => void
  onUpload: (investigationId: string, evidence: Pick<Evidence, "fileName" | "observation">) => void
}) {
  const [fileName, setFileName] = useState("")
  const [observation, setObservation] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!investigation) return
    if (!fileName.trim()) return toast.error("Selecciona o escribe el nombre de la evidencia")

    onUpload(investigation.id, {
      fileName: fileName.trim(),
      observation: observation.trim() || "Evidencia cargada para revision.",
    })
    setFileName("")
    setObservation("")
    onClose()
  }

  return (
    <Dialog open={Boolean(investigation)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subir evidencia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-dashed border-border bg-secondary p-4">
            <Label className="grid gap-2">
              Archivo o fotografia
              <Input
                type="file"
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
              />
            </Label>
            <Input
              className="mt-3"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder="Tambien puedes escribir el nombre del archivo mock"
            />
          </div>

          <Label className="grid gap-2">
            Observacion
            <Textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              rows={3}
              placeholder="Describe brevemente que evidencia se esta adjuntando."
            />
          </Label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <Upload className="h-4 w-4" />
              Guardar evidencia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function VerificationDialog({
  investigation,
  isEffective,
  onClose,
  onConfirm,
}: {
  investigation: Investigation | null
  isEffective: boolean
  onClose: () => void
  onConfirm: (investigation: Investigation, isEffective: boolean, observation: string) => void
}) {
  const [observation, setObservation] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!investigation) return

    onConfirm(investigation, isEffective, observation.trim())
    setObservation("")
    onClose()
  }

  return (
    <Dialog open={Boolean(investigation)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEffective ? "Marcar investigacion como eficaz" : "Marcar investigacion como no eficaz"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Puedes agregar una observacion de revision para que quede registrada en la trazabilidad.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Label className="grid gap-2">
            Observacion del revisor
            <Textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              rows={4}
              placeholder="Opcional"
            />
          </Label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant={isEffective ? "default" : "destructive"} className="gap-2">
              {isEffective ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DetailDialog({
  investigation,
  onClose,
}: {
  investigation: Investigation | null
  onClose: () => void
}) {
  if (!investigation) return null

  return (
    <Dialog open={Boolean(investigation)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Detalle de la investigacion {investigation.consecutive}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Consulta evidencias, estado de cierre y trazabilidad de auditoria.
          </p>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock label="Novedad laboral" value={incidentLabel(investigation.incidentId)} />
            <InfoBlock label="Responsable" value={employeeName(investigation.responsibleEmployeeId)} />
            <InfoBlock label="Estado de eficacia" value={efficacyLabel(investigation.efficacyStatus)} />
          </div>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Analisis de causas</h3>
            <p className="text-sm text-muted-foreground">{investigation.causeAnalysis}</p>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock label="Correctivas" value={investigation.correctiveActions || "No aplica"} />
            <InfoBlock label="Preventivas" value={investigation.preventiveActions || "No aplica"} />
            <InfoBlock label="Mejora" value={investigation.improvementActions || "No aplica"} />
          </div>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserRound className="h-4 w-4" />
              Revisores
            </h3>
            <div className="flex flex-wrap gap-2">
              {investigation.reviewers.map((reviewer) => (
                <Badge key={reviewer.id} variant="secondary">
                  {reviewerLabel(reviewer)}
                </Badge>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4" />
              Evidencias
            </h3>
            <div className="space-y-2">
              {investigation.evidences.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aun no hay evidencias cargadas.</p>
              ) : (
                investigation.evidences.map((evidence) => (
                  <div key={evidence.id} className="rounded-md bg-secondary p-3 text-sm">
                    <p className="font-medium text-foreground">{evidence.fileName}</p>
                    <p className="text-muted-foreground">{evidence.observation}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(evidence.uploadedAt)} - {evidence.uploadedBy}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <History className="h-4 w-4" />
              Trazabilidad para auditoria
            </h3>
            <div className="space-y-3">
              {investigation.traceability.map((event) => (
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

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>(initialInvestigations)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<EfficacyStatus | "all">("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailInvestigation, setDetailInvestigation] = useState<Investigation | null>(null)
  const [evidenceInvestigation, setEvidenceInvestigation] = useState<Investigation | null>(null)
  const [verificationAction, setVerificationAction] = useState<{
    investigation: Investigation
    isEffective: boolean
  } | null>(null)

  const filteredInvestigations = useMemo(() => {
    const query = search.trim().toLowerCase()

    return investigations.filter((investigation) => {
      const incident = incidentLabel(investigation.incidentId).toLowerCase()
      const responsible = employeeName(investigation.responsibleEmployeeId).toLowerCase()
      const matchesSearch =
        !query ||
        investigation.consecutive.toLowerCase().includes(query) ||
        investigation.acpmReference.toLowerCase().includes(query) ||
        incident.includes(query) ||
        responsible.includes(query)
      const matchesStatus = statusFilter === "all" || investigation.efficacyStatus === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [investigations, search, statusFilter])

  const stats = useMemo(() => {
    return {
      total: investigations.length,
      reported: investigations.filter((item) => item.efficacyStatus === "REPORTADO").length,
      pending: investigations.filter((item) => item.efficacyStatus === "PENDIENTE_VERIFICACION").length,
      closed: investigations.filter((item) => item.efficacyStatus === "EFICAZ").length,
    }
  }, [investigations])

  function handleCreate(form: InvestigationForm) {
    const createdAt = nowIso()
    const nextNumber = investigations.length + 1
    const investigation: Investigation = {
      id: createId("investigation"),
      consecutive: `INV-${String(nextNumber).padStart(3, "0")}`,
      incidentId: form.incidentId,
      responsibleEmployeeId: form.responsibleEmployeeId,
      reviewers: form.reviewers.filter((reviewer) =>
        reviewer.type === "EMPLOYEE" ? Boolean(reviewer.employeeId) : Boolean(reviewer.externalName?.trim()),
      ),
      causeAnalysis: form.causeAnalysis.trim(),
      correctiveActions: form.correctiveActions.trim() || undefined,
      preventiveActions: form.preventiveActions.trim() || undefined,
      improvementActions: form.improvementActions.trim() || undefined,
      acpmSource: form.acpmSource,
      acpmReference: form.acpmReference.trim(),
      expectedClosureDate: form.expectedClosureDate || undefined,
      efficacyStatus: "REPORTADO",
      evidences: [],
      traceability: [
        {
          id: createId("trace"),
          type: "CREATED",
          title: "Investigacion creada",
          description: "La investigacion quedo reportada y a la espera de evidencia del responsable.",
          createdAt,
          actor: "Sistema",
        },
      ],
      createdAt,
    }

    setInvestigations((current) => [investigation, ...current])
    toast.success("Investigacion creada en estado Reportado")
  }

  function handleUploadEvidence(investigationId: string, evidencePayload: Pick<Evidence, "fileName" | "observation">) {
    setInvestigations((current) =>
      current.map((investigation) => {
        if (investigation.id !== investigationId) return investigation

        const responsible = employeeName(investigation.responsibleEmployeeId)
        const evidence: Evidence = {
          id: createId("evidence"),
          fileName: evidencePayload.fileName,
          observation: evidencePayload.observation,
          uploadedAt: nowIso(),
          uploadedBy: responsible,
        }

        return {
          ...investigation,
          efficacyStatus: "PENDIENTE_VERIFICACION",
          evidences: [evidence, ...investigation.evidences],
          traceability: [
            buildTrace(
              "EVIDENCE_UPLOADED",
              "Evidencia cargada",
              "El responsable cargo evidencia y la investigacion queda pendiente de verificacion.",
              responsible,
            ),
            ...investigation.traceability,
          ],
        }
      }),
    )
    toast.success("Evidencia cargada. Estado actualizado a Pendiente de verificacion")
  }

  function handleVerify(investigation: Investigation, isEffective: boolean, observation: string) {
    const actor = investigation.reviewers.map(reviewerLabel).join(", ") || "Equipo investigador"
    const reviewedAt = nowIso()
    const effectiveDescription = observation
      ? `El equipo investigador califico la evidencia como eficaz. Observacion: ${observation}`
      : "El equipo investigador califico la evidencia como eficaz. La investigacion quedo cerrada automaticamente."
    const notEffectiveDescription = observation
      ? `La evidencia no fue eficaz. Observacion: ${observation}`
      : "La evidencia no fue eficaz. La investigacion vuelve a estado Reportado para cargar una nueva evidencia."

    setInvestigations((current) =>
      current.map((item) => {
        if (item.id !== investigation.id) return item

        if (isEffective) {
          return {
            ...item,
            efficacyStatus: "EFICAZ",
            reviewDate: reviewedAt,
            closureDate: reviewedAt,
            closedBy: actor,
            traceability: [
              buildTrace(
                "VERIFIED_EFFECTIVE",
                "Verificacion eficaz",
                effectiveDescription,
                actor,
              ),
              ...item.traceability,
            ],
          }
        }

        return {
          ...item,
          efficacyStatus: "REPORTADO",
          reviewDate: reviewedAt,
          closureDate: undefined,
          closedBy: undefined,
          traceability: [
            buildTrace(
              "VERIFIED_NOT_EFFECTIVE",
              "Verificacion no eficaz",
              notEffectiveDescription,
              actor,
            ),
            ...item.traceability,
          ],
        }
      }),
    )

    toast.success(isEffective ? "Investigacion cerrada como eficaz" : "Investigacion devuelta a Reportado")
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investigaciones</h1>
          <p className="text-muted-foreground">
            Gestiona la investigacion de novedades laborales, evidencias, verificacion de eficacia y trazabilidad.
          </p>
        </div>
        <Button type="button" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva investigacion
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center overflow-x-auto px-3 py-1">
          <div className="flex w-fit min-w-max items-center gap-2">
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-foreground">{stats.total}</span>
              <span className="ml-2 text-xs text-muted-foreground">Investigaciones</span>
            </div>
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-blue-700">{stats.reported}</span>
              <span className="ml-2 text-xs text-muted-foreground">Reportadas</span>
            </div>
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-amber-700">{stats.pending}</span>
              <span className="ml-2 text-xs text-muted-foreground">Por verificar</span>
            </div>
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-emerald-700">{stats.closed}</span>
              <span className="ml-2 text-xs text-muted-foreground">Cerradas</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_240px]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Consecutivo, novedad, responsable o ACPM"
              />
            </div>
          </Label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Estado</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as EfficacyStatus | "all")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="REPORTADO">Reportado</option>
              <option value="PENDIENTE_VERIFICACION">Pendiente de verificacion</option>
              <option value="EFICAZ">Eficaz</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lista de investigaciones</h2>
            <p className="text-sm text-muted-foreground">{filteredInvestigations.length} registros encontrados</p>
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

        {filteredInvestigations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay investigaciones que coincidan con los filtros actuales.
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredInvestigations.map((investigation) => (
              <Card key={investigation.id} className="border-border bg-card">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{investigation.consecutive}</h3>
                        <Badge variant="outline" className={efficacyClassName(investigation.efficacyStatus)}>
                          {efficacyLabel(investigation.efficacyStatus)}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {incidentLabel(investigation.incidentId)}
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDetailInvestigation(investigation)}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      Responsable: {employeeName(investigation.responsibleEmployeeId)}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Cierre: {formatDate(investigation.closureDate ?? investigation.expectedClosureDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {acpmSourceLabel(investigation.acpmSource)}: {investigation.acpmReference}
                    </p>
                    <p className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {investigation.evidences.length} evidencias
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    {investigation.efficacyStatus !== "EFICAZ" && (
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setEvidenceInvestigation(investigation)}>
                        <Upload className="h-4 w-4" />
                        Subir evidencia
                      </Button>
                    )}
                    {investigation.efficacyStatus === "PENDIENTE_VERIFICACION" && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          className="gap-2"
                          onClick={() => setVerificationAction({ investigation, isEffective: true })}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Eficaz
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          onClick={() => setVerificationAction({ investigation, isEffective: false })}
                        >
                          <XCircle className="h-4 w-4" />
                          No eficaz
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
                  <th className="px-4 py-3 font-medium">Investigacion</th>
                  <th className="px-4 py-3 font-medium">Novedad laboral</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">ACPM</th>
                  <th className="px-4 py-3 font-medium">Fecha estipulada</th>
                  <th className="px-4 py-3 font-medium">Fecha cierre</th>
                  <th className="px-4 py-3 font-medium">Evidencias</th>
                  <th className="px-4 py-3 font-medium">Verificacion de la eficacia</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvestigations.map((investigation) => (
                  <tr key={investigation.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{investigation.consecutive}</p>
                      <p className="text-muted-foreground">Creada: {formatDate(investigation.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[300px] truncate text-muted-foreground">{incidentLabel(investigation.incidentId)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{employeeName(investigation.responsibleEmployeeId)}</td>
                    <td className="px-4 py-3">
                      <p className="max-w-[220px] truncate font-medium text-foreground">{investigation.acpmReference}</p>
                      <p className="text-muted-foreground">{acpmSourceLabel(investigation.acpmSource)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(investigation.expectedClosureDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(investigation.closureDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{investigation.evidences.length}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={efficacyClassName(investigation.efficacyStatus)}>
                        {efficacyLabel(investigation.efficacyStatus)}
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
                          <DropdownMenuItem onSelect={() => setDetailInvestigation(investigation)}>
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          {investigation.efficacyStatus !== "EFICAZ" && (
                            <DropdownMenuItem onSelect={() => setEvidenceInvestigation(investigation)}>
                              <Upload className="h-4 w-4" />
                              Subir evidencia
                            </DropdownMenuItem>
                          )}
                          {investigation.efficacyStatus === "PENDIENTE_VERIFICACION" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => setVerificationAction({ investigation, isEffective: true })}>
                                <CheckCircle2 className="h-4 w-4" />
                                Marcar eficaz
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setVerificationAction({ investigation, isEffective: false })}
                              >
                                <XCircle className="h-4 w-4" />
                                Marcar no eficaz
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

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <ClipboardCheck className="h-5 w-5" />
          Flujo de verificacion
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <InfoBlock label="Reportado" value="Investigacion creada o devuelta por evidencia no eficaz." />
          <InfoBlock label="Pendiente de verificacion" value="El responsable cargo evidencia y el equipo investigador debe revisarla." />
          <InfoBlock label="Eficaz" value="La evidencia fue aprobada y el cierre se registra automaticamente." />
        </div>
      </section>

      <InvestigationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleCreate} />
      <EvidenceDialog
        investigation={evidenceInvestigation}
        onClose={() => setEvidenceInvestigation(null)}
        onUpload={handleUploadEvidence}
      />
      <VerificationDialog
        investigation={verificationAction?.investigation ?? null}
        isEffective={verificationAction?.isEffective ?? true}
        onClose={() => setVerificationAction(null)}
        onConfirm={handleVerify}
      />
      <DetailDialog investigation={detailInvestigation} onClose={() => setDetailInvestigation(null)} />
    </main>
  )
}
