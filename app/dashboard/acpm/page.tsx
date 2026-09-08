"use client"

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Download,
  Edit,
  Eye,
  FileCheck2,
  FileText,
  History,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Power,
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
import {
  changeAcpmStatus,
  createAcpm,
  createAcpmFollowUp,
  listAcpmFollowUps,
  listAcpms,
  updateAcpm,
} from "@/services/acpmService"
import { listEmployees } from "@/services/employeeService"
import type { Acpm, AcpmFilters, AcpmFollowUp, AcpmOrigin, AcpmStatus, AcpmType } from "@/types/manager/acpm"
import type { Employee } from "@/types/manager/employee"

type ViewMode = "cards" | "list"

type AcpmForm = {
  year: string
  type: AcpmType
  origin: AcpmOrigin
  name: string
  description: string
  responsibleEmployeeId: string
  dueDate: string
  nonConformityDescription: string
  detectionDate: string
  relatedDocument: string
}

type FollowUpForm = {
  followUpDate: string
  observations: string
  completionPercentage: string
  evidence: string
}

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, index) => currentYear + index)

const acpmTypeOptions: Array<{ value: AcpmType; label: string }> = [
  { value: "CORRECTIVE", label: "Correctiva" },
  { value: "PREVENTIVE", label: "Preventiva" },
  { value: "IMPROVEMENT", label: "Mejora" },
]

const acpmOriginOptions: Array<{ value: AcpmOrigin; label: string }> = [
  { value: "INVESTIGATION", label: "Investigacion" },
  { value: "AUDIT", label: "Auditoria" },
  { value: "INSPECTION", label: "Inspeccion" },
  { value: "INDICATOR", label: "Indicador" },
  { value: "OTHER", label: "Otro" },
]

const emptyForm: AcpmForm = {
  year: String(currentYear),
  type: "CORRECTIVE",
  origin: "INVESTIGATION",
  name: "",
  description: "",
  responsibleEmployeeId: "",
  dueDate: "",
  nonConformityDescription: "",
  detectionDate: "",
  relatedDocument: "",
}

const emptyFollowUpForm: FollowUpForm = {
  followUpDate: new Date().toISOString().slice(0, 10),
  observations: "",
  completionPercentage: "",
  evidence: "",
}

function normalizeNumberInput(value: string) {
  return value.replace(/\D/g, "")
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

function employeeName(employee?: Pick<Employee, "name" | "lastName" | "email"> | null) {
  if (!employee) return "No asignado"
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "No asignado"
}

function employeeJob(employee?: Pick<Employee, "job"> | null) {
  const job = employee?.job
  if (!job) return "Cargo no registrado"
  return typeof job === "string" ? job : job.name ?? "Cargo no registrado"
}

function typeLabel(type: AcpmType) {
  return acpmTypeOptions.find((option) => option.value === type)?.label ?? type
}

function originLabel(origin: AcpmOrigin) {
  return acpmOriginOptions.find((option) => option.value === origin)?.label ?? origin
}

function getVisualStatus(acpm: Acpm) {
  if (acpm.status === "INACTIVE") return "Inactivo"
  if (acpm.currentCompletionPercentage >= 100) return "Cerrada"
  if (acpm.currentCompletionPercentage > 0) return "En ejecucion"
  return "Abierta"
}

function getVisualStatusClassName(acpm: Acpm) {
  if (acpm.status === "INACTIVE") return "bg-destructive text-white border-transparent"
  if (acpm.currentCompletionPercentage >= 100) return "bg-accentActivd text-accentActivd-foreground border-transparent"
  if (acpm.currentCompletionPercentage > 0) return "bg-blue-600 text-white border-transparent"
  return "bg-warning/10 text-warning border-warning/20"
}

function getPdfPageCount(doc: jsPDF) {
  return (
    (doc as unknown as { getNumberOfPages?: () => number }).getNumberOfPages?.() ??
    Math.max(1, ((doc.internal as unknown as { pages?: unknown[] }).pages?.length ?? 2) - 1)
  )
}

function isLateUpload(acpm: Acpm, followUp?: AcpmFollowUp | null) {
  if (!followUp || followUp.completionPercentage < 100) return false
  return new Date(`${formatDate(followUp.followUpDate)}T00:00:00`) > new Date(`${formatDate(acpm.dueDate)}T00:00:00`)
}

function latestFollowUp(followUps: AcpmFollowUp[]) {
  return [...followUps].sort((a, b) => new Date(b.followUpDate).getTime() - new Date(a.followUpDate).getTime())[0]
}

function AcpmDialog({
  open,
  acpm,
  employees,
  onClose,
  onSave,
}: {
  open: boolean
  acpm: Acpm | null
  employees: Employee[]
  onClose: () => void
  onSave: (form: AcpmForm, acpmId?: string) => Promise<void>
}) {
  const [form, setForm] = useState<AcpmForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const editing = Boolean(acpm)

  useEffect(() => {
    if (!open) return
    setForm(
      acpm
        ? {
            year: String(acpm.year),
            type: acpm.type,
            origin: acpm.origin,
            name: acpm.name ?? "",
            description: acpm.description ?? "",
            responsibleEmployeeId: acpm.responsibleEmployeeId ?? "",
            dueDate: formatDate(acpm.dueDate),
            nonConformityDescription: acpm.nonConformityDescription ?? "",
            detectionDate: formatDate(acpm.detectionDate),
            relatedDocument: acpm.relatedDocument ?? "",
          }
        : emptyForm,
    )
  }, [acpm, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const year = Number(form.year)

    if (!editing && (!Number.isInteger(year) || year < currentYear)) {
      return toast.error(`El año debe ser ${currentYear} o posterior`)
    }
    if (!form.name.trim()) return toast.error("Ingresa el nombre del ACPM")
    if (!form.description.trim()) return toast.error("Ingresa la descripcion")
    if (!form.responsibleEmployeeId) return toast.error("Selecciona el responsable")
    if (!editing && !form.dueDate) return toast.error("Selecciona la fecha limite")
    if (!form.nonConformityDescription.trim()) return toast.error("Describe la no conformidad")
    if (!editing && !form.detectionDate) return toast.error("Selecciona la fecha de deteccion")
    if (!editing && form.dueDate < form.detectionDate) {
      return toast.error("La fecha limite no puede ser anterior a la deteccion")
    }

    setSaving(true)
    try {
      await onSave(form, acpm?.id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Editar ACPM" : "Nuevo ACPM"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {editing
              ? "Puedes actualizar los datos permitidos. Año, fecha limite y fecha de deteccion permanecen fijos."
              : "Registra la accion y la no conformidad que le da origen."}
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
                    disabled={editing}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, year: normalizeNumberInput(event.target.value).slice(0, 4) }))
                    }
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
                  />
                </Label>
                <div className="grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-foreground">Responsable</span>
                    <select
                      value={form.responsibleEmployeeId}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, responsibleEmployeeId: event.target.value }))
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Selecciona responsable</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employeeName(employee)} - {employeeJob(employee)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Label className="grid gap-2">
                    Fecha limite
                    <Input
                      type="date"
                      value={form.dueDate}
                      disabled={editing}
                      onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
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
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha deteccion
                  <Input
                    type="date"
                    value={form.detectionDate}
                    disabled={editing}
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
              {editing ? "Guardar cambios" : "Crear ACPM"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FollowUpDialog({
  acpm,
  lastFollowUp,
  onClose,
  onSave,
}: {
  acpm: Acpm | null
  lastFollowUp?: AcpmFollowUp
  onClose: () => void
  onSave: (acpm: Acpm, form: FollowUpForm) => Promise<void>
}) {
  const [form, setForm] = useState<FollowUpForm>(emptyFollowUpForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (acpm) setForm(emptyFollowUpForm)
  }, [acpm])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!acpm) return
    const progress = Number(form.completionPercentage)

    if (!form.followUpDate) return toast.error("Selecciona la fecha de seguimiento")
    if (!form.observations.trim()) return toast.error("Ingresa las observaciones")
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      return toast.error("El porcentaje debe estar entre 0 y 100")
    }
    if (lastFollowUp && progress < lastFollowUp.completionPercentage) {
      return toast.error("El porcentaje no puede disminuir frente al ultimo seguimiento")
    }
    if (form.followUpDate < formatDate(acpm.detectionDate)) {
      return toast.error("La fecha de seguimiento no puede ser anterior a la fecha de deteccion")
    }
    if (lastFollowUp && form.followUpDate < formatDate(lastFollowUp.followUpDate)) {
      return toast.error("La fecha no puede ser anterior al ultimo seguimiento")
    }

    setSaving(true)
    try {
      await onSave(acpm, form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(acpm)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar seguimiento</DialogTitle>
          <p className="text-sm text-muted-foreground">
            El avance se registra en el historial. Al llegar al 100% queda listo para cierre visual.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Fecha seguimiento
              <Input
                type="date"
                min={formatDate(lastFollowUp?.followUpDate ?? acpm?.detectionDate)}
                value={form.followUpDate}
                onChange={(event) => setForm((current) => ({ ...current, followUpDate: event.target.value }))}
              />
            </Label>
            <Label className="grid gap-2">
              % cumplimiento
              <Input
                type="number"
                min={lastFollowUp?.completionPercentage ?? 0}
                max={100}
                value={form.completionPercentage}
                onChange={(event) =>
                  setForm((current) => ({ ...current, completionPercentage: normalizeNumberInput(event.target.value) }))
                }
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
              placeholder="Nombre o descripcion del soporte"
            />
          </Label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar seguimiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CloseEvidenceDialog({
  acpm,
  onClose,
  onSave,
}: {
  acpm: Acpm | null
  onClose: () => void
  onSave: (acpm: Acpm, fileName: string) => Promise<void>
}) {
  const [fileName, setFileName] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (acpm) setFileName("")
  }, [acpm])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!acpm) return
    if (!fileName.trim()) return toast.error("Sube o registra el documento de cierre")

    setSaving(true)
    try {
      await onSave(acpm, fileName.trim())
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(acpm)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subir evidencia de cierre</DialogTitle>
          <p className="text-sm text-muted-foreground">
            El backend registra la evidencia como seguimiento al 100%. Si la fecha supera el limite se mostrara con retraso.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {acpm && <div className="rounded-md bg-secondary p-3 text-sm text-muted-foreground">Fecha limite: {formatDate(acpm.dueDate)}</div>}
          <div className="rounded-md border border-dashed border-border bg-secondary p-4">
            <Label className="grid gap-2">
              Documento o soporte
              <Input type="file" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
            </Label>
            <Input
              className="mt-3"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder="Tambien puedes escribir el nombre del archivo"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
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
  followUps,
  loading,
  onClose,
}: {
  acpm: Acpm | null
  followUps: AcpmFollowUp[]
  loading: boolean
  onClose: () => void
}) {
  if (!acpm) return null

  const last = latestFollowUp(followUps)
  const late = isLateUpload(acpm, last)

  return (
    <Dialog open={Boolean(acpm)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Detalle ACPM</DialogTitle>
          <p className="text-sm text-muted-foreground">Consulta no conformidad, seguimientos y evidencia registrada.</p>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoBlock label="Tipo" value={typeLabel(acpm.type)} />
            <InfoBlock label="Origen" value={originLabel(acpm.origin)} />
            <InfoBlock label="Responsable" value={employeeName(acpm.responsibleEmployee)} />
            <InfoBlock label="Fecha limite" value={formatDate(acpm.dueDate)} />
          </div>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Descripcion ACPM</h3>
            <p className="text-sm text-muted-foreground">{acpm.description}</p>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">No conformidad</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <InfoBlock label="Fecha deteccion" value={formatDate(acpm.detectionDate)} />
              <InfoBlock label="Fuente" value={originLabel(acpm.origin)} />
              <InfoBlock label="Estado" value={acpm.currentCompletionPercentage >= 100 ? "Cerrada" : "Abierta"} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{acpm.nonConformityDescription}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Documento relacionado: {acpm.relatedDocument || "No registrado"}
            </p>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Seguimientos</h3>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando seguimientos...
              </div>
            ) : followUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aun no hay seguimientos registrados.</p>
            ) : (
              <div className="space-y-3">
                {followUps.map((followUp) => (
                  <div key={followUp.id} className="rounded-md bg-secondary p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{formatDate(followUp.followUpDate)}</p>
                      <Badge variant="outline">{followUp.completionPercentage}%</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{followUp.observations}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Evidencia: {followUp.evidence || "No registrada"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Registrado: {formatDateTime(followUp.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Evidencia de cierre</h3>
            {last && last.completionPercentage >= 100 ? (
              <div className="rounded-md bg-secondary p-3 text-sm">
                <p className="font-medium text-foreground">{last.evidence || "Evidencia registrada"}</p>
                <p className={late ? "text-destructive" : "text-muted-foreground"}>
                  {late ? "Cargado con retraso" : "Cargado a tiempo"} - {formatDate(last.followUpDate)}
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
              <div className="border-l-2 border-primary/40 pl-4">
                <p className="text-sm font-medium text-foreground">ACPM creado</p>
                <p className="text-sm text-muted-foreground">Se registro el ACPM y la no conformidad asociada.</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(acpm.detectionDate)}</p>
              </div>
              {followUps.map((followUp) => (
                <div key={`history-${followUp.id}`} className="border-l-2 border-primary/40 pl-4">
                  <p className="text-sm font-medium text-foreground">
                    {followUp.completionPercentage >= 100 ? "Evidencia de cierre registrada" : "Seguimiento registrado"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Avance del {followUp.completionPercentage}%. {followUp.observations}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(followUp.createdAt)}</p>
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
  const [acpms, setAcpms] = useState<Acpm[]>([])
  const [total, setTotal] = useState(0)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [followUpsByAcpm, setFollowUpsByAcpm] = useState<Record<string, AcpmFollowUp[]>>({})
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [yearFilter, setYearFilter] = useState(String(currentYear))
  const [typeFilter, setTypeFilter] = useState<AcpmType | "all">("all")
  const [originFilter, setOriginFilter] = useState<AcpmOrigin | "all">("all")
  const [statusFilter, setStatusFilter] = useState<AcpmStatus | "all">("all")
  const [responsibleFilter, setResponsibleFilter] = useState("all")
  const [startDueDateFilter, setStartDueDateFilter] = useState("")
  const [endDueDateFilter, setEndDueDateFilter] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editingAcpm, setEditingAcpm] = useState<Acpm | null>(null)
  const [followUpAcpm, setFollowUpAcpm] = useState<Acpm | null>(null)
  const [evidenceAcpm, setEvidenceAcpm] = useState<Acpm | null>(null)
  const [detailAcpm, setDetailAcpm] = useState<Acpm | null>(null)

  async function loadAcpms() {
    if (startDueDateFilter && endDueDateFilter && endDueDateFilter < startDueDateFilter) {
      toast.error("La fecha final no puede ser anterior a la fecha inicial")
      return
    }

    setLoading(true)
    try {
      const filters: AcpmFilters = {
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        year: yearFilter === "all" ? undefined : Number(yearFilter),
        type: typeFilter === "all" ? undefined : typeFilter,
        origin: originFilter === "all" ? undefined : originFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        responsibleEmployeeId: responsibleFilter === "all" ? undefined : responsibleFilter,
        startDueDate: startDueDateFilter || undefined,
        endDueDate: endDueDateFilter || undefined,
      }
      const [acpmData, employeeData] = await Promise.all([listAcpms(filters), listEmployees()])
      setAcpms(acpmData.items ?? [])
      setTotal(acpmData.total ?? 0)
      setEmployees(employeeData)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar ACPM")
    } finally {
      setLoading(false)
    }
  }

  async function loadFollowUps(acpmId: string) {
    setDetailLoading(true)
    try {
      const followUps = await listAcpmFollowUps(acpmId)
      setFollowUpsByAcpm((current) => ({ ...current, [acpmId]: followUps }))
      return followUps
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los seguimientos")
      return []
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    loadAcpms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearFilter, typeFilter, originFilter, statusFilter, responsibleFilter, startDueDateFilter, endDueDateFilter])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loadAcpms()
  }

  async function openDetail(acpm: Acpm) {
    setDetailAcpm(acpm)
    await loadFollowUps(acpm.id)
  }

  async function openFollowUp(acpm: Acpm) {
    const followUps = followUpsByAcpm[acpm.id] ?? (await loadFollowUps(acpm.id))
    if (latestFollowUp(followUps)?.completionPercentage >= 100 || acpm.currentCompletionPercentage >= 100) {
      toast.error("Este ACPM ya llego al 100% y no permite nuevos seguimientos")
      return
    }
    setFollowUpAcpm(acpm)
  }

  async function handleSaveAcpm(form: AcpmForm, acpmId?: string) {
    try {
      if (acpmId) {
        await updateAcpm(acpmId, {
          type: form.type,
          origin: form.origin,
          name: form.name.trim(),
          description: form.description.trim(),
          responsibleEmployeeId: form.responsibleEmployeeId,
          nonConformityDescription: form.nonConformityDescription.trim(),
          relatedDocument: form.relatedDocument.trim() || null,
        })
        toast.success("ACPM actualizado")
      } else {
        await createAcpm({
          year: Number(form.year),
          type: form.type,
          origin: form.origin,
          name: form.name.trim(),
          description: form.description.trim(),
          responsibleEmployeeId: form.responsibleEmployeeId,
          dueDate: form.dueDate,
          nonConformityDescription: form.nonConformityDescription.trim(),
          detectionDate: form.detectionDate,
          relatedDocument: form.relatedDocument.trim() || null,
        })
        toast.success("ACPM creado")
      }
      setEditingAcpm(null)
      await loadAcpms()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el ACPM")
      throw error
    }
  }

  async function handleSaveFollowUp(acpm: Acpm, form: FollowUpForm) {
    try {
      await createAcpmFollowUp(acpm.id, {
        followUpDate: form.followUpDate,
        completionPercentage: Number(form.completionPercentage),
        observations: form.observations.trim(),
        evidence: form.evidence.trim() || null,
      })
      toast.success("Seguimiento registrado")
      await Promise.all([loadAcpms(), loadFollowUps(acpm.id)])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el seguimiento")
      throw error
    }
  }

  async function handleCloseWithEvidence(acpm: Acpm, fileName: string) {
    try {
      const today = new Date().toISOString().slice(0, 10)
      await createAcpmFollowUp(acpm.id, {
        followUpDate: today,
        completionPercentage: 100,
        observations: "Evidencia de cierre cargada.",
        evidence: fileName,
      })
      toast.success(isLateUpload(acpm, { followUpDate: today, completionPercentage: 100 } as AcpmFollowUp) ? "ACPM cerrado con retraso" : "ACPM cerrado")
      await Promise.all([loadAcpms(), loadFollowUps(acpm.id)])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cerrar el ACPM")
      throw error
    }
  }

  async function handleChangeStatus(acpm: Acpm) {
    const nextStatus: AcpmStatus = acpm.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await changeAcpmStatus(acpm.id, { status: nextStatus })
      toast.success(nextStatus === "ACTIVE" ? "ACPM activado" : "ACPM inactivado")
      await loadAcpms()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado")
    }
  }

  async function generateDocument(acpm: Acpm) {
    const followUps = followUpsByAcpm[acpm.id] ?? (await loadFollowUps(acpm.id))
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
    doc.text(acpm.name, margin + 5, y + 16)
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
        ["Ano", String(acpm.year)],
        ["Fecha deteccion", formatDate(acpm.detectionDate)],
        ["Tipo", typeLabel(acpm.type)],
        ["Origen", originLabel(acpm.origin)],
        ["Nombre", acpm.name],
        ["Responsable", employeeName(acpm.responsibleEmployee)],
        ["Fecha limite", formatDate(acpm.dueDate)],
        ["Avance", `${acpm.currentCompletionPercentage}%`],
        ["Estado", getVisualStatus(acpm)],
      ],
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2.5, lineColor: [220, 226, 224], lineWidth: 0.1 },
      columnStyles: { 0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 48 }, 1: { cellWidth: contentWidth - 48 } },
    })
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8

    sectionTitle("Descripcion")
    paragraph(acpm.description)

    sectionTitle("No conformidad")
    paragraph(acpm.nonConformityDescription)
    autoTable(doc, {
      startY: y,
      theme: "grid",
      margin: { left: margin, right: margin },
      body: [
        ["Fecha deteccion", formatDate(acpm.detectionDate)],
        ["Fuente", originLabel(acpm.origin)],
        ["Documento relacionado", acpm.relatedDocument || "No registrado"],
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
      body: followUps.length
        ? followUps.map((followUp) => [
            formatDate(followUp.followUpDate),
            `${followUp.completionPercentage}%`,
            followUp.observations,
            followUp.evidence || "",
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
    paragraph("La no conformidad se considera cerrada cuando el seguimiento alcanza el 100% con evidencia registrada.")
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
    doc.save(`ACPM_${acpm.year}_${acpm.name.replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`)
  }

  function downloadEvidence(acpm: Acpm, followUps: AcpmFollowUp[]) {
    const closeFollowUp = latestFollowUp(followUps.filter((followUp) => followUp.completionPercentage >= 100))
    if (!closeFollowUp?.evidence) {
      toast.error("Este ACPM aun no tiene evidencia de cierre")
      return
    }

    const blob = new Blob(
      [
        `Evidencia ACPM\nACPM: ${acpm.name}\nArchivo: ${closeFollowUp.evidence}\nFecha: ${formatDate(
          closeFollowUp.followUpDate,
        )}\nEstado: ${isLateUpload(acpm, closeFollowUp) ? "Cargado con retraso" : "Cargado a tiempo"}\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = closeFollowUp.evidence
    link.click()
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => {
    return {
      total,
      active: acpms.filter((acpm) => acpm.status === "ACTIVE").length,
      inProgress: acpms.filter((acpm) => acpm.status === "ACTIVE" && acpm.currentCompletionPercentage > 0 && acpm.currentCompletionPercentage < 100).length,
      closed: acpms.filter((acpm) => acpm.currentCompletionPercentage >= 100).length,
      inactive: acpms.filter((acpm) => acpm.status === "INACTIVE").length,
    }
  }, [acpms, total])

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ACPM</h1>
          <p className="text-muted-foreground">
            Administra acciones correctivas, preventivas y de mejora con seguimiento y evidencia.
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
            <Metric label="ACPM" value={stats.total} />
            <Metric label="Activos" value={stats.active} tone="blue" />
            <Metric label="En ejecucion" value={stats.inProgress} tone="amber" />
            <Metric label="Cerrados" value={stats.closed} tone="green" />
            <Metric label="Inactivos" value={stats.inactive} tone="red" />
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-4 grid gap-3 xl:grid-cols-[minmax(180px,1fr)_110px_150px_150px_140px_160px_145px_145px_auto]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Nombre, descripcion o responsable"
              />
            </div>
          </Label>
          <FilterSelect label="Año" value={yearFilter} onChange={setYearFilter}>
            <option value="all">Todos</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Tipo" value={typeFilter} onChange={(value) => setTypeFilter(value as AcpmType | "all")}>
            <option value="all">Todos</option>
            {acpmTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Origen" value={originFilter} onChange={(value) => setOriginFilter(value as AcpmOrigin | "all")}>
            <option value="all">Todos</option>
            {acpmOriginOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Estado" value={statusFilter} onChange={(value) => setStatusFilter(value as AcpmStatus | "all")}>
            <option value="all">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </FilterSelect>
          <FilterSelect label="Responsable" value={responsibleFilter} onChange={setResponsibleFilter}>
            <option value="all">Todos</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employeeName(employee)}
              </option>
            ))}
          </FilterSelect>
          <Label className="grid gap-2">
            Desde limite
            <Input
              type="date"
              value={startDueDateFilter}
              onChange={(event) => setStartDueDateFilter(event.target.value)}
            />
          </Label>
          <Label className="grid gap-2">
            Hasta limite
            <Input
              type="date"
              min={startDueDateFilter || undefined}
              value={endDueDateFilter}
              onChange={(event) => setEndDueDateFilter(event.target.value)}
            />
          </Label>
          <Button type="submit" variant="outline" className="mt-7 gap-2">
            <Search className="h-4 w-4" />
            Filtrar
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lista de ACPM</h2>
            <p className="text-sm text-muted-foreground">{acpms.length} registros encontrados</p>
          </div>
          <div className="inline-flex w-fit rounded-md border border-border bg-secondary p-1">
            <Button type="button" size="sm" variant={viewMode === "cards" ? "default" : "ghost"} className="h-8 gap-2" onClick={() => setViewMode("cards")}>
              <LayoutGrid className="h-4 w-4" />
              Tarjetas
            </Button>
            <Button type="button" size="sm" variant={viewMode === "list" ? "default" : "ghost"} className="h-8 gap-2" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
              Lista
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando ACPM...
            </CardContent>
          </Card>
        ) : acpms.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay ACPM que coincidan con los filtros actuales.
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {acpms.map((acpm) => {
              const followUps = followUpsByAcpm[acpm.id] ?? []
              const last = latestFollowUp(followUps)
              const late = isLateUpload(acpm, last)

              return (
                <Card key={acpm.id} className="border-border bg-card">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{acpm.name}</h3>
                          <Badge variant="outline" className={getVisualStatusClassName(acpm)}>
                            {getVisualStatus(acpm)}
                          </Badge>
                          {late && (
                            <Badge variant="outline" className="border-destructive bg-destructive/10 text-destructive">
                              Con retraso
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{typeLabel(acpm.type)} / {originLabel(acpm.origin)}</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openDetail(acpm)}>
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{acpm.description}</p>
                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <p className="flex items-center gap-2"><UserRound className="h-4 w-4" />{employeeName(acpm.responsibleEmployee)}</p>
                      <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Limite: {formatDate(acpm.dueDate)}</p>
                      <p className="flex items-center gap-2"><FileText className="h-4 w-4" />Avance: {acpm.currentCompletionPercentage}%</p>
                      <p className="flex items-center gap-2"><FileCheck2 className="h-4 w-4" />{last?.evidence || "Sin evidencia de cierre"}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {acpms.map((acpm) => (
                  <tr key={acpm.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="max-w-[280px] truncate font-medium text-foreground">{acpm.name}</p>
                      <p className="max-w-[280px] truncate text-muted-foreground">{acpm.description}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>{typeLabel(acpm.type)}</p>
                      <p>{originLabel(acpm.origin)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[190px] truncate font-medium text-foreground">{employeeName(acpm.responsibleEmployee)}</p>
                      <p className="max-w-[190px] truncate text-muted-foreground">{acpm.responsibleEmployee?.email ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>Deteccion: {formatDate(acpm.detectionDate)}</p>
                      <p>Limite: {formatDate(acpm.dueDate)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{acpm.currentCompletionPercentage}%</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={getVisualStatusClassName(acpm)}>
                        {getVisualStatus(acpm)}
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
                          <DropdownMenuItem onSelect={() => openDetail(acpm)}><Eye className="h-4 w-4" />Ver detalle</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => generateDocument(acpm)}><Download className="h-4 w-4" />Generar documento</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => { setEditingAcpm(acpm); setCreateOpen(true) }}><Edit className="h-4 w-4" />Editar</DropdownMenuItem>
                          {acpm.status === "ACTIVE" && acpm.currentCompletionPercentage < 100 && (
                            <>
                              <DropdownMenuItem onSelect={() => openFollowUp(acpm)}><Plus className="h-4 w-4" />Agregar seguimiento</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setEvidenceAcpm(acpm)}><Upload className="h-4 w-4" />Subir evidencia cierre</DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleChangeStatus(acpm)}><Power className="h-4 w-4" />{acpm.status === "ACTIVE" ? "Inactivar" : "Activar"}</DropdownMenuItem>
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

      <AcpmDialog
        open={createOpen}
        acpm={editingAcpm}
        employees={employees}
        onClose={() => {
          setCreateOpen(false)
          setEditingAcpm(null)
        }}
        onSave={handleSaveAcpm}
      />
      <FollowUpDialog
        acpm={followUpAcpm}
        lastFollowUp={followUpAcpm ? latestFollowUp(followUpsByAcpm[followUpAcpm.id] ?? []) : undefined}
        onClose={() => setFollowUpAcpm(null)}
        onSave={handleSaveFollowUp}
      />
      <CloseEvidenceDialog acpm={evidenceAcpm} onClose={() => setEvidenceAcpm(null)} onSave={handleCloseWithEvidence} />
      <DetailDialog
        acpm={detailAcpm}
        followUps={detailAcpm ? followUpsByAcpm[detailAcpm.id] ?? [] : []}
        loading={detailLoading}
        onClose={() => setDetailAcpm(null)}
      />
    </main>
  )
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "blue" | "amber" | "green" | "red" }) {
  const toneClass =
    tone === "blue"
      ? "text-blue-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "green"
          ? "text-emerald-700"
          : tone === "red"
            ? "text-destructive"
            : "text-foreground"

  return (
    <div className="rounded-md bg-secondary px-3 py-1.5">
      <span className={`text-sm font-bold ${toneClass}`}>{value}</span>
      <span className="ml-2 text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {children}
      </select>
    </label>
  )
}
