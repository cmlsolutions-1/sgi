"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Download,
  Edit,
  Eye,
  FileText,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Target,
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

type ViewMode = "cards" | "list"
type ObjectiveType =
  | "ACCIDENTALITY"
  | "TRAINING"
  | "RISKS"
  | "PREVENTIVE_MEDICINE"
  | "INSPECTIONS"
  | "EMERGENCIES"
  | "COPASST"
  | "PPE"
  | "OTHER"
type ObjectiveStatus = "PENDING" | "IN_PROGRESS" | "FULFILLED"

type Policy = {
  id: string
  name: string
  description: string
  createdAt: string
}

type Evidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
}

type FollowUp = {
  id: string
  date: string
  progress: number
  observations: string
  evidence?: Evidence
}

type Diffusion = {
  id: string
  medium: string
  date: string
  evidence?: Evidence
}

type SstObjective = {
  id: string
  name: string
  year: number
  description: string
  type: ObjectiveType
  customType?: string
  goal: string
  indicator: number
  measurementUnit: string
  expectedValue: string
  policyId: string
  trackingResponsible: string
  startDate: string
  endDate: string
  observations: string
  followUps: FollowUp[]
  diffusions: Diffusion[]
}

type ObjectiveForm = {
  name: string
  year: string
  description: string
  type: ObjectiveType
  customType: string
  goal: string
  indicator: string
  measurementUnit: string
  expectedValue: string
  policyId: string
  trackingResponsible: string
  startDate: string
  endDate: string
  observations: string
}

type PolicyForm = {
  name: string
  description: string
}

type FollowUpForm = {
  date: string
  progress: string
  observations: string
  evidenceFileName: string
  evidenceDescription: string
}

type DiffusionForm = {
  medium: string
  date: string
  evidenceFileName: string
  evidenceDescription: string
}

const currentYear = new Date().getFullYear()

const objectiveTypeOptions: Array<{ value: ObjectiveType; label: string }> = [
  { value: "ACCIDENTALITY", label: "Accidentalidad" },
  { value: "TRAINING", label: "Capacitacion" },
  { value: "RISKS", label: "Riesgos" },
  { value: "PREVENTIVE_MEDICINE", label: "Medicina Preventiva" },
  { value: "INSPECTIONS", label: "Inspecciones" },
  { value: "EMERGENCIES", label: "Emergencias" },
  { value: "COPASST", label: "COPASST" },
  { value: "PPE", label: "EPP" },
  { value: "OTHER", label: "Otro" },
]

const emptyPolicyForm: PolicyForm = {
  name: "",
  description: "",
}

const emptyObjectiveForm: ObjectiveForm = {
  name: "",
  year: String(currentYear),
  description: "",
  type: "ACCIDENTALITY",
  customType: "",
  goal: "",
  indicator: "",
  measurementUnit: "%",
  expectedValue: "",
  policyId: "",
  trackingResponsible: "",
  startDate: "",
  endDate: "",
  observations: "",
}

const emptyFollowUpForm: FollowUpForm = {
  date: new Date().toISOString().slice(0, 10),
  progress: "",
  observations: "",
  evidenceFileName: "",
  evidenceDescription: "",
}

const emptyDiffusionForm: DiffusionForm = {
  medium: "",
  date: new Date().toISOString().slice(0, 10),
  evidenceFileName: "",
  evidenceDescription: "",
}

const initialPolicies: Policy[] = [
  {
    id: "policy-1",
    name: "Politica de Seguridad y Salud en el Trabajo",
    description: "Compromiso de prevencion de lesiones, enfermedades laborales y mejora continua del SG-SST.",
    createdAt: "2026-01-08T08:30:00",
  },
  {
    id: "policy-2",
    name: "Politica de prevencion de accidentalidad",
    description: "Lineamientos para reducir eventos laborales mediante controles, formacion y seguimiento.",
    createdAt: "2026-02-14T10:00:00",
  },
]

const initialObjectives: SstObjective[] = [
  {
    id: "objective-1",
    name: "Reducir la accidentalidad laboral",
    year: 2026,
    description: "Disminuir la ocurrencia de accidentes mediante intervencion de riesgos prioritarios.",
    type: "ACCIDENTALITY",
    goal: "Reducir en 15% los accidentes frente al periodo anterior.",
    indicator: 80,
    measurementUnit: "%",
    expectedValue: "85%",
    policyId: "policy-2",
    trackingResponsible: "Coordinador SG-SST",
    startDate: "2026-01-15",
    endDate: "2026-12-20",
    observations: "Seguimiento mensual por accidentalidad e investigacion de eventos.",
    followUps: [
      {
        id: "follow-1",
        date: "2026-03-30",
        progress: 35,
        observations: "Se socializaron controles de seguridad en areas operativas.",
        evidence: {
          id: "evidence-1",
          fileName: "seguimiento-accidentalidad-marzo.pdf",
          description: "Acta y registro fotografico del seguimiento.",
          uploadedAt: "2026-03-30T11:20:00",
        },
      },
      {
        id: "follow-2",
        date: "2026-06-30",
        progress: 80,
        observations: "Avance por cierre de acciones de inspeccion y capacitacion.",
      },
    ],
    diffusions: [
      {
        id: "diffusion-1",
        medium: "Comité COPASST",
        date: "2026-02-01",
        evidence: {
          id: "diffusion-evidence-1",
          fileName: "difusion-politica-copasst.pdf",
          description: "Acta de socializacion de la politica relacionada.",
          uploadedAt: "2026-02-01T09:00:00",
        },
      },
    ],
  },
  {
    id: "objective-2",
    name: "Cumplir el plan de capacitacion SST",
    year: 2026,
    description: "Asegurar que los trabajadores reciban formacion en peligros y controles.",
    type: "TRAINING",
    goal: "Capacitar minimo al 90% del personal activo.",
    indicator: 20,
    measurementUnit: "%",
    expectedValue: "90%",
    policyId: "policy-1",
    trackingResponsible: "Talento humano",
    startDate: "2026-02-01",
    endDate: "2026-11-30",
    observations: "Pendiente programacion de grupos operativos.",
    followUps: [],
    diffusions: [],
  },
]

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function normalizeNumber(value: string) {
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

function typeLabel(objective: Pick<SstObjective, "type" | "customType">) {
  if (objective.type === "OTHER") return objective.customType?.trim() || "Otro"
  return objectiveTypeOptions.find((option) => option.value === objective.type)?.label ?? objective.type
}

function getStatus(objective: SstObjective): ObjectiveStatus {
  if (objective.indicator >= 100) return "FULFILLED"
  if (objective.followUps.length > 0 || objective.indicator > 0) return "IN_PROGRESS"
  return "PENDING"
}

function statusLabel(status: ObjectiveStatus) {
  if (status === "FULFILLED") return "Cumplido"
  if (status === "IN_PROGRESS") return "En ejecucion"
  return "Pendiente"
}

function statusClassName(status: ObjectiveStatus) {
  if (status === "FULFILLED") return "bg-accentActivd text-accentActivd-foreground border-transparent"
  if (status === "IN_PROGRESS") return "bg-blue-600 text-white border-transparent"
  return "bg-warning/10 text-warning border-warning/20"
}

function policyName(policies: Policy[], policyId: string) {
  return policies.find((policy) => policy.id === policyId)?.name ?? "Politica no relacionada"
}

function latestFollowUp(objective: SstObjective) {
  return [...objective.followUps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
}

function buildEvidence(prefix: string, fileName: string, description: string): Evidence | undefined {
  if (!fileName.trim()) return undefined

  return {
    id: createId(prefix),
    fileName: fileName.trim(),
    description: description.trim(),
    uploadedAt: new Date().toISOString(),
  }
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "blue" | "green" | "amber" }) {
  const toneClass =
    tone === "blue"
      ? "text-blue-700"
      : tone === "green"
        ? "text-emerald-700"
        : tone === "amber"
          ? "text-amber-700"
          : "text-foreground"

  return (
    <div className="rounded-md bg-secondary px-3 py-1.5">
      <span className={`text-sm font-bold ${toneClass}`}>{value}</span>
      <span className="ml-2 text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function PolicyDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (form: PolicyForm) => void
}) {
  const [form, setForm] = useState<PolicyForm>(emptyPolicyForm)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) return toast.error("Ingresa el nombre de la politica SST")
    if (!form.description.trim()) return toast.error("Ingresa la descripcion de la politica")

    onSave(form)
    setForm(emptyPolicyForm)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Crear política SST</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Crea primero la politica para poder relacionarla en los objetivos SST.
          </p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Label className="grid gap-2">
            Nombre de la política
            <Input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ej. Politica de Seguridad y Salud en el Trabajo"
            />
          </Label>
          <Label className="grid gap-2">
            Descripción
            <Textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={4}
            />
          </Label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Crear política</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ObjectiveDialog({
  open,
  objective,
  policies,
  onClose,
  onSave,
}: {
  open: boolean
  objective: SstObjective | null
  policies: Policy[]
  onClose: () => void
  onSave: (form: ObjectiveForm, objectiveId?: string) => void
}) {
  const [form, setForm] = useState<ObjectiveForm>(emptyObjectiveForm)
  const editing = Boolean(objective)

  useEffect(() => {
    if (!open) return

    setForm(
      objective
        ? {
            name: objective.name,
            year: String(objective.year),
            description: objective.description,
            type: objective.type,
            customType: objective.customType ?? "",
            goal: objective.goal,
            indicator: String(objective.indicator),
            measurementUnit: objective.measurementUnit,
            expectedValue: objective.expectedValue,
            policyId: objective.policyId,
            trackingResponsible: objective.trackingResponsible,
            startDate: objective.startDate,
            endDate: objective.endDate,
            observations: objective.observations,
          }
        : { ...emptyObjectiveForm, policyId: policies[0]?.id ?? "" },
    )
  }, [objective, open, policies])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const indicator = Number(form.indicator)
    const year = Number(form.year)

    if (policies.length === 0) return toast.error("Primero crea una politica SST")
    if (!form.name.trim()) return toast.error("Ingresa el nombre del objetivo")
    if (!Number.isInteger(year) || year < currentYear) return toast.error(`El año debe ser ${currentYear} o posterior`)
    if (!form.description.trim()) return toast.error("Ingresa la descripcion")
    if (form.type === "OTHER" && !form.customType.trim()) return toast.error("Escribe el tipo de objetivo")
    if (!form.goal.trim()) return toast.error("Ingresa la meta")
    if (!Number.isInteger(indicator) || indicator < 0 || indicator > 100) {
      return toast.error("El indicador debe estar entre 0 y 100")
    }
    if (!form.measurementUnit.trim()) return toast.error("Ingresa la unidad de medida")
    if (!form.expectedValue.trim()) return toast.error("Ingresa el valor esperado")
    if (!form.policyId) return toast.error("Relaciona una politica SST")
    if (!form.trackingResponsible.trim()) return toast.error("Ingresa el responsable del seguimiento")
    if (!form.startDate) return toast.error("Selecciona la fecha de inicio")
    if (!form.endDate) return toast.error("Selecciona la fecha fin")
    if (form.endDate < form.startDate) return toast.error("La fecha fin no puede ser anterior al inicio")

    onSave(form, objective?.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Editar objetivo SST" : "Nuevo objetivo SST"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Relaciona una politica SST, define la meta y registra el responsable del seguimiento.
          </p>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Información general</h3>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_140px_240px]">
                <Label className="grid gap-2">
                  Nombre del objetivo
                  <Input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ej. Reducir la accidentalidad laboral"
                  />
                </Label>
                <Label className="grid gap-2">
                  Año o vigencia
                  <Input
                    type="number"
                    min={currentYear}
                    value={form.year}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, year: normalizeNumber(event.target.value).slice(0, 4) }))
                    }
                  />
                </Label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Tipo</span>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value as ObjectiveType,
                        customType: event.target.value === "OTHER" ? current.customType : "",
                      }))
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {objectiveTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {form.type === "OTHER" && (
                <Label className="mt-4 grid gap-2">
                  Otro tipo
                  <Input
                    value={form.customType}
                    onChange={(event) => setForm((current) => ({ ...current, customType: event.target.value }))}
                    placeholder="Escribe el tipo de objetivo"
                  />
                </Label>
              )}
              <Label className="mt-4 grid gap-2">
                Descripción
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                />
              </Label>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Meta e indicador</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_140px_180px_180px]">
                <Label className="grid gap-2">
                  Meta
                  <Input
                    value={form.goal}
                    onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
                    placeholder="Ej. Alcanzar cumplimiento minimo del 90%"
                  />
                </Label>
                <Label className="grid gap-2">
                  Indicador (%)
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.indicator}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, indicator: normalizeNumber(event.target.value).slice(0, 3) }))
                    }
                    placeholder="0"
                  />
                </Label>
                <Label className="grid gap-2">
                  Unidad de medida
                  <Input
                    value={form.measurementUnit}
                    onChange={(event) => setForm((current) => ({ ...current, measurementUnit: event.target.value }))}
                    placeholder="%"
                  />
                </Label>
                <Label className="grid gap-2">
                  Valor esperado
                  <Input
                    value={form.expectedValue}
                    onChange={(event) => setForm((current) => ({ ...current, expectedValue: event.target.value }))}
                    placeholder="90%"
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Política y seguimiento</h3>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_170px_170px]">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Política SST relacionada</span>
                  <select
                    value={form.policyId}
                    onChange={(event) => setForm((current) => ({ ...current, policyId: event.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona politica</option>
                    {policies.map((policy) => (
                      <option key={policy.id} value={policy.id}>
                        {policy.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Label className="grid gap-2">
                  Responsable del seguimiento
                  <Input
                    value={form.trackingResponsible}
                    onChange={(event) => setForm((current) => ({ ...current, trackingResponsible: event.target.value }))}
                    placeholder="Nombre o cargo responsable"
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha inicio
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha fin
                  <Input
                    type="date"
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                  />
                </Label>
              </div>
              <Label className="mt-4 grid gap-2">
                Observaciones
                <Textarea
                  value={form.observations}
                  onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
                  rows={3}
                />
              </Label>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Guardar cambios" : "Crear objetivo"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FollowUpDialog({
  objective,
  lastProgress,
  onClose,
  onSave,
}: {
  objective: SstObjective | null
  lastProgress: number
  onClose: () => void
  onSave: (objective: SstObjective, form: FollowUpForm) => void
}) {
  const [form, setForm] = useState<FollowUpForm>(emptyFollowUpForm)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!objective) return
    const progress = Number(form.progress)

    if (!form.date) return toast.error("Selecciona la fecha del seguimiento")
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) return toast.error("El avance debe estar entre 0 y 100")
    if (progress < lastProgress) return toast.error("El avance no puede disminuir frente al seguimiento anterior")
    if (!form.observations.trim()) return toast.error("Ingresa las observaciones")

    onSave(objective, form)
    setForm(emptyFollowUpForm)
    onClose()
  }

  return (
    <Dialog open={Boolean(objective)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Registrar seguimiento</DialogTitle>
          <p className="text-sm text-muted-foreground">Agrega avance, observaciones y evidencia hasta cumplir el objetivo.</p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Fecha
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
            </Label>
            <Label className="grid gap-2">
              Avance (%)
              <Input
                type="number"
                min={lastProgress}
                max={100}
                value={form.progress}
                onChange={(event) => setForm((current) => ({ ...current, progress: normalizeNumber(event.target.value).slice(0, 3) }))}
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
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Evidencia
              <Input
                type="file"
                onChange={(event) =>
                  setForm((current) => ({ ...current, evidenceFileName: event.target.files?.[0]?.name ?? "" }))
                }
              />
            </Label>
            <Label className="grid gap-2">
              Nombre evidencia
              <Input
                value={form.evidenceFileName}
                onChange={(event) => setForm((current) => ({ ...current, evidenceFileName: event.target.value }))}
                placeholder="Opcional"
              />
            </Label>
          </div>
          <Label className="grid gap-2">
            Descripción evidencia
            <Input
              value={form.evidenceDescription}
              onChange={(event) => setForm((current) => ({ ...current, evidenceDescription: event.target.value }))}
              placeholder="Opcional"
            />
          </Label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar seguimiento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DiffusionDialog({
  objective,
  onClose,
  onSave,
}: {
  objective: SstObjective | null
  onClose: () => void
  onSave: (objective: SstObjective, form: DiffusionForm) => void
}) {
  const [form, setForm] = useState<DiffusionForm>(emptyDiffusionForm)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!objective) return
    if (!form.medium.trim()) return toast.error("Ingresa el medio de difusión")
    if (!form.date) return toast.error("Selecciona la fecha de difusión")

    onSave(objective, form)
    setForm(emptyDiffusionForm)
    onClose()
  }

  return (
    <Dialog open={Boolean(objective)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Registrar difusión</DialogTitle>
          <p className="text-sm text-muted-foreground">Registra cómo se difundió la política u objetivo SST.</p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Medio de difusión
              <Input
                value={form.medium}
                onChange={(event) => setForm((current) => ({ ...current, medium: event.target.value }))}
                placeholder="Correo, cartelera, induccion, reunion"
              />
            </Label>
            <Label className="grid gap-2">
              Fecha
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
            </Label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Evidencia
              <Input
                type="file"
                onChange={(event) =>
                  setForm((current) => ({ ...current, evidenceFileName: event.target.files?.[0]?.name ?? "" }))
                }
              />
            </Label>
            <Label className="grid gap-2">
              Nombre evidencia
              <Input
                value={form.evidenceFileName}
                onChange={(event) => setForm((current) => ({ ...current, evidenceFileName: event.target.value }))}
                placeholder="Opcional"
              />
            </Label>
          </div>
          <Label className="grid gap-2">
            Descripción evidencia
            <Input
              value={form.evidenceDescription}
              onChange={(event) => setForm((current) => ({ ...current, evidenceDescription: event.target.value }))}
              placeholder="Opcional"
            />
          </Label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar difusión</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DetailDialog({
  objective,
  policies,
  onClose,
  onDownloadEvidence,
}: {
  objective: SstObjective | null
  policies: Policy[]
  onClose: () => void
  onDownloadEvidence: (evidence: Evidence, context: string) => void
}) {
  if (!objective) return null
  const status = getStatus(objective)

  return (
    <Dialog open={Boolean(objective)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Detalle del objetivo SST</DialogTitle>
          <p className="text-sm text-muted-foreground">Consulta politica relacionada, seguimiento, difusión y evidencias.</p>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoBlock label="Objetivo" value={objective.name} />
            <InfoBlock label="Vigencia" value={String(objective.year)} />
            <InfoBlock label="Tipo" value={typeLabel(objective)} />
            <div className="rounded-md bg-secondary p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Estado</p>
              <Badge variant="outline" className={`mt-2 ${statusClassName(status)}`}>
                {statusLabel(status)}
              </Badge>
            </div>
          </div>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Descripción</h3>
            <p className="text-sm text-muted-foreground">{objective.description}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Política SST relacionada: <span className="font-medium text-foreground">{policyName(policies, objective.policyId)}</span>
            </p>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Meta e indicador</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <InfoBlock label="Meta" value={objective.goal} />
              <InfoBlock label="Indicador" value={`${objective.indicator}%`} />
              <InfoBlock label="Unidad" value={objective.measurementUnit} />
              <InfoBlock label="Valor esperado" value={objective.expectedValue} />
            </div>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Seguimiento</h3>
            {objective.followUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aun no hay seguimientos registrados.</p>
            ) : (
              <div className="space-y-3">
                {objective.followUps.map((followUp) => (
                  <div key={followUp.id} className="rounded-md bg-secondary p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{formatDate(followUp.date)}</p>
                      <Badge variant="outline">{followUp.progress}%</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{followUp.observations}</p>
                    {followUp.evidence && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-2"
                        onClick={() => onDownloadEvidence(followUp.evidence as Evidence, `seguimiento-${objective.name}`)}
                      >
                        <Download className="h-4 w-4" />
                        Descargar evidencia
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Difusión</h3>
            {objective.diffusions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aun no hay difusiones registradas.</p>
            ) : (
              <div className="space-y-3">
                {objective.diffusions.map((diffusion) => (
                  <div key={diffusion.id} className="rounded-md bg-secondary p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{diffusion.medium}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(diffusion.date)}</p>
                    </div>
                    {diffusion.evidence && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-2"
                        onClick={() => onDownloadEvidence(diffusion.evidence as Evidence, `difusion-${objective.name}`)}
                      >
                        <Download className="h-4 w-4" />
                        Descargar evidencia
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
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

export default function SstObjectivesPage() {
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies)
  const [objectives, setObjectives] = useState<SstObjective[]>(initialObjectives)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<ObjectiveType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<ObjectiveStatus | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [policyOpen, setPolicyOpen] = useState(false)
  const [objectiveOpen, setObjectiveOpen] = useState(false)
  const [editingObjective, setEditingObjective] = useState<SstObjective | null>(null)
  const [followUpObjective, setFollowUpObjective] = useState<SstObjective | null>(null)
  const [diffusionObjective, setDiffusionObjective] = useState<SstObjective | null>(null)
  const [detailObjective, setDetailObjective] = useState<SstObjective | null>(null)

  const filteredObjectives = useMemo(() => {
    const query = search.trim().toLowerCase()

    return objectives.filter((objective) => {
      const status = getStatus(objective)
      const matchesSearch =
        !query ||
        objective.name.toLowerCase().includes(query) ||
        objective.description.toLowerCase().includes(query) ||
        typeLabel(objective).toLowerCase().includes(query) ||
        policyName(policies, objective.policyId).toLowerCase().includes(query) ||
        objective.trackingResponsible.toLowerCase().includes(query)
      const matchesType = typeFilter === "all" || objective.type === typeFilter
      const matchesStatus = statusFilter === "all" || status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [objectives, policies, search, statusFilter, typeFilter])

  const stats = useMemo(() => {
    return {
      policies: policies.length,
      total: objectives.length,
      pending: objectives.filter((objective) => getStatus(objective) === "PENDING").length,
      inProgress: objectives.filter((objective) => getStatus(objective) === "IN_PROGRESS").length,
      fulfilled: objectives.filter((objective) => getStatus(objective) === "FULFILLED").length,
    }
  }, [objectives, policies.length])

  function savePolicy(form: PolicyForm) {
    const policy: Policy = {
      id: createId("policy"),
      name: form.name.trim(),
      description: form.description.trim(),
      createdAt: new Date().toISOString(),
    }

    setPolicies((current) => [policy, ...current])
    toast.success("Politica SST creada")
  }

  function saveObjective(form: ObjectiveForm, objectiveId?: string) {
    const payload = {
      name: form.name.trim(),
      year: Number(form.year),
      description: form.description.trim(),
      type: form.type,
      customType: form.type === "OTHER" ? form.customType.trim() : undefined,
      goal: form.goal.trim(),
      indicator: Number(form.indicator),
      measurementUnit: form.measurementUnit.trim(),
      expectedValue: form.expectedValue.trim(),
      policyId: form.policyId,
      trackingResponsible: form.trackingResponsible.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      observations: form.observations.trim(),
    }

    if (objectiveId) {
      setObjectives((current) =>
        current.map((objective) =>
          objective.id === objectiveId
            ? {
                ...objective,
                ...payload,
              }
            : objective,
        ),
      )
      toast.success("Objetivo SST actualizado")
      return
    }

    setObjectives((current) => [
      {
        id: createId("objective"),
        ...payload,
        followUps: [],
        diffusions: [],
      },
      ...current,
    ])
    toast.success("Objetivo SST creado")
  }

  function saveFollowUp(objective: SstObjective, form: FollowUpForm) {
    const followUp: FollowUp = {
      id: createId("follow-up"),
      date: form.date,
      progress: Number(form.progress),
      observations: form.observations.trim(),
      evidence: buildEvidence("follow-up-evidence", form.evidenceFileName, form.evidenceDescription),
    }

    setObjectives((current) =>
      current.map((item) =>
        item.id === objective.id
          ? {
              ...item,
              indicator: followUp.progress,
              followUps: [followUp, ...item.followUps],
            }
          : item,
      ),
    )
    setDetailObjective((current) =>
      current?.id === objective.id
        ? {
            ...current,
            indicator: followUp.progress,
            followUps: [followUp, ...current.followUps],
          }
        : current,
    )
    toast.success(followUp.progress >= 100 ? "Objetivo cumplido" : "Seguimiento registrado")
  }

  function saveDiffusion(objective: SstObjective, form: DiffusionForm) {
    const diffusion: Diffusion = {
      id: createId("diffusion"),
      medium: form.medium.trim(),
      date: form.date,
      evidence: buildEvidence("diffusion-evidence", form.evidenceFileName, form.evidenceDescription),
    }

    setObjectives((current) =>
      current.map((item) =>
        item.id === objective.id
          ? {
              ...item,
              diffusions: [diffusion, ...item.diffusions],
            }
          : item,
      ),
    )
    setDetailObjective((current) =>
      current?.id === objective.id
        ? {
            ...current,
            diffusions: [diffusion, ...current.diffusions],
          }
        : current,
    )
    toast.success("Difusion registrada")
  }

  function downloadEvidence(evidence: Evidence, context: string) {
    const blob = new Blob(
      [
        `Evidencia Objetivos SST\nContexto: ${context}\nArchivo: ${evidence.fileName}\nDescripcion: ${
          evidence.description || "Sin descripcion"
        }\nCargado: ${formatDateTime(evidence.uploadedAt)}\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = evidence.fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Objetivos SST</h1>
          <p className="text-muted-foreground">
            Crea politicas, relaciona objetivos y registra seguimientos hasta su cumplimiento.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => setPolicyOpen(true)}>
            <Plus className="h-4 w-4" />
            Crear política
          </Button>
          <Button
            type="button"
            className="gap-2"
            onClick={() => {
              if (policies.length === 0) {
                toast.error("Primero crea una politica SST")
                return
              }
              setEditingObjective(null)
              setObjectiveOpen(true)
            }}
          >
            <Target className="h-4 w-4" />
            Nuevo objetivo
          </Button>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center overflow-x-auto px-3 py-1">
          <div className="flex w-fit min-w-max items-center gap-2">
            <Metric label="Políticas" value={stats.policies} />
            <Metric label="Objetivos" value={stats.total} />
            <Metric label="Pendientes" value={stats.pending} tone="amber" />
            <Metric label="En ejecución" value={stats.inProgress} tone="blue" />
            <Metric label="Cumplidos" value={stats.fulfilled} tone="green" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_190px]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Objetivo, política, responsable o tipo"
              />
            </div>
          </Label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Tipo</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as ObjectiveType | "all")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              {objectiveTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Estado</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ObjectiveStatus | "all")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="IN_PROGRESS">En ejecución</option>
              <option value="FULFILLED">Cumplido</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lista de objetivos SST</h2>
            <p className="text-sm text-muted-foreground">{filteredObjectives.length} registros encontrados</p>
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

        {filteredObjectives.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay objetivos SST que coincidan con los filtros actuales.
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredObjectives.map((objective) => {
              const status = getStatus(objective)

              return (
                <Card key={objective.id} className="border-border bg-card">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{objective.name}</h3>
                          <Badge variant="outline" className={statusClassName(status)}>
                            {statusLabel(status)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{typeLabel(objective)} · {objective.year}</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDetailObjective(objective)}>
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{objective.description}</p>
                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <p className="flex items-center gap-2"><Target className="h-4 w-4" />Indicador: {objective.indicator}%</p>
                      <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Fin: {formatDate(objective.endDate)}</p>
                      <p className="flex items-center gap-2"><FileText className="h-4 w-4" />{objective.followUps.length} seguimientos</p>
                      <p className="flex items-center gap-2"><Upload className="h-4 w-4" />{objective.diffusions.length} difusiones</p>
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
                  <th className="px-4 py-3 font-medium">Objetivo</th>
                  <th className="px-4 py-3 font-medium">Vigencia</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Indicador</th>
                  <th className="px-4 py-3 font-medium">Valor esperado</th>
                  <th className="px-4 py-3 font-medium">Política</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Fechas</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredObjectives.map((objective) => {
                  const status = getStatus(objective)
                  const last = latestFollowUp(objective)

                  return (
                    <tr key={objective.id} className="align-middle">
                      <td className="px-4 py-3">
                        <p className="max-w-[260px] truncate font-medium text-foreground">{objective.name}</p>
                        <p className="max-w-[260px] truncate text-muted-foreground">{objective.goal}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{objective.year}</td>
                      <td className="px-4 py-3 text-muted-foreground">{typeLabel(objective)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{objective.indicator}%</p>
                        <p className="text-muted-foreground">Ultimo: {last ? formatDate(last.date) : "Sin seguimiento"}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{objective.expectedValue}</td>
                      <td className="px-4 py-3">
                        <p className="max-w-[210px] truncate text-muted-foreground">{policyName(policies, objective.policyId)}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{objective.trackingResponsible}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <p>Inicio: {formatDate(objective.startDate)}</p>
                        <p>Fin: {formatDate(objective.endDate)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusClassName(status)}>
                          {statusLabel(status)}
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
                            <DropdownMenuItem onSelect={() => setDetailObjective(objective)}>
                              <Eye className="h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditingObjective(objective)
                                setObjectiveOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setFollowUpObjective(objective)}>
                              <Plus className="h-4 w-4" />
                              Registrar seguimiento
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setDiffusionObjective(objective)}>
                              <Upload className="h-4 w-4" />
                              Registrar difusión
                            </DropdownMenuItem>
                            {(last?.evidence || objective.diffusions.find((diffusion) => diffusion.evidence)?.evidence) && (
                              <>
                                <DropdownMenuSeparator />
                                {last?.evidence && (
                                  <DropdownMenuItem onSelect={() => downloadEvidence(last.evidence as Evidence, `seguimiento-${objective.name}`)}>
                                    <Download className="h-4 w-4" />
                                    Descargar evidencia seguimiento
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PolicyDialog open={policyOpen} onClose={() => setPolicyOpen(false)} onSave={savePolicy} />
      <ObjectiveDialog
        open={objectiveOpen}
        objective={editingObjective}
        policies={policies}
        onClose={() => {
          setObjectiveOpen(false)
          setEditingObjective(null)
        }}
        onSave={saveObjective}
      />
      <FollowUpDialog
        objective={followUpObjective}
        lastProgress={followUpObjective?.indicator ?? 0}
        onClose={() => setFollowUpObjective(null)}
        onSave={saveFollowUp}
      />
      <DiffusionDialog
        objective={diffusionObjective}
        onClose={() => setDiffusionObjective(null)}
        onSave={saveDiffusion}
      />
      <DetailDialog
        objective={detailObjective}
        policies={policies}
        onClose={() => setDetailObjective(null)}
        onDownloadEvidence={downloadEvidence}
      />
    </main>
  )
}
