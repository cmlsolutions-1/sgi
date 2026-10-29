"use client"

import { loadPesv, savePesv, listPesv, pesvPath, pesvRequest, downloadPesv, pesvVersion } from "@/services/pesvService"
import { PesvApiDocuments } from "@/components/pesv/api-documents"
import { Modal } from "@/components/pesv/planning-module"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Download,
  FileCheck2,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  UsersRound,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { listEmployees } from "@/services/employeeService"
import type { Employee } from "@/types/manager/employee"
import { PesvModuleHeader } from "@/components/pesv/module-experience"
import { KpiStrip } from "@/components/dashboard/kpi-strip"
import { PesvSelect } from "@/components/pesv/pesv-select"

type PesvResponsibleRecord = {
  employeeId: string
  employeeName: string
}

type CommitteeMember = {
  employeeId: string
  employeeName: string
  role: string
  hasDecisionPower: boolean
  isPesvLeader: boolean
}

type QuarterlyReview = {
  id: string
  quarter: "Q1" | "Q2" | "Q3" | "Q4"
  reviewDate: string
  roadAccidentAnalysis: string
  indicatorsAnalysis: string
  selfManagementReport: string
  annualWorkPlanReview: string
  auditsReview: string
  implementationReview: string
  decisions: string
  evidenceFileName: string
  createdAt: string
}

type PesvCommitteeRecord = {
  id: string
  objective: string
  vision: string
  scope: string
  formationDate: string
  members: CommitteeMember[]
  reviews: QuarterlyReview[]
  updatedAt: string
}

type CommitteeForm = {
  objective: string
  vision: string
  scope: string
  formationDate: string
  memberIds: string[]
}

type ReviewForm = {
  quarter: QuarterlyReview["quarter"]
  reviewDate: string
  roadAccidentAnalysis: string
  indicatorsAnalysis: string
  selfManagementReport: string
  annualWorkPlanReview: string
  auditsReview: string
  implementationReview: string
  decisions: string
}


const defaultCommitteeForm: CommitteeForm = {
  objective: "Definir, implementar y hacer seguimiento a las acciones del Plan Estratégico de Seguridad Vial.",
  vision: "Consolidar una cultura de seguridad vial que reduzca la siniestralidad y fortalezca la movilidad segura.",
  scope: "Aplica a trabajadores, contratistas, procesos, vehículos, desplazamientos laborales y actividades relacionadas con la seguridad vial de la organización.",
  formationDate: new Date().toISOString().slice(0, 10),
  memberIds: [],
}

const defaultReviewForm: ReviewForm = {
  quarter: "Q1",
  reviewDate: new Date().toISOString().slice(0, 10),
  roadAccidentAnalysis: "",
  indicatorsAnalysis: "",
  selfManagementReport: "",
  annualWorkPlanReview: "",
  auditsReview: "",
  implementationReview: "",
  decisions: "",
}

const quarterLabels: Record<QuarterlyReview["quarter"], string> = {
  Q1: "Primer trimestre",
  Q2: "Segundo trimestre",
  Q3: "Tercer trimestre",
  Q4: "Cuarto trimestre",
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function employeeFullName(employee: Employee) {
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "Funcionario sin nombre"
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

function buildMembers(employees: Employee[], memberIds: string[], pesvLeader: PesvResponsibleRecord | null): CommitteeMember[] {
  const ids = new Set(memberIds)
  if (pesvLeader?.employeeId) ids.add(pesvLeader.employeeId)

  return Array.from(ids)
    .map((employeeId) => {
      const employee = employees.find((item) => item.id === employeeId)
      const isPesvLeader = pesvLeader?.employeeId === employeeId

      if (!employee && !isPesvLeader) return null

      return {
        employeeId,
        employeeName: employee ? employeeFullName(employee) : pesvLeader?.employeeName ?? "Líder PESV",
        role: isPesvLeader ? "Líder del diseño e implementación del PESV" : "Miembro del Comité de Seguridad Vial",
        hasDecisionPower: true,
        isPesvLeader,
      }
    })
    .filter(Boolean) as CommitteeMember[]
}

function CommitteeDialog({
  open,
  employees,
  record,
  pesvLeader,
  onOpenChange,
  onSave,
}: {
  open: boolean
  employees: Employee[]
  record: PesvCommitteeRecord | null
  pesvLeader: PesvResponsibleRecord | null
  onOpenChange: (open: boolean) => void
  onSave: (form: CommitteeForm) => Promise<boolean>
}) {
  const [form, setForm] = useState<CommitteeForm>(defaultCommitteeForm)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            objective: record.objective,
            vision: record.vision,
            scope: record.scope,
            formationDate: record.formationDate,
            memberIds: record.members.map((member) => member.employeeId),
          }
        : {
            ...defaultCommitteeForm,
            memberIds: pesvLeader?.employeeId ? [pesvLeader.employeeId] : [],
          },
    )
  }, [open, record, pesvLeader?.employeeId])

  const filteredEmployees = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return employees
    return employees.filter((employee) => `${employeeFullName(employee)} ${employee.email ?? ""}`.toLowerCase().includes(term))
  }, [employees, query])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const members = buildMembers(employees, form.memberIds, pesvLeader)

    if (!form.objective.trim()) return toast.error("Define el objetivo general del PESV")
    if (!form.vision.trim()) return toast.error("Define la visión del PESV")
    if (!form.scope.trim()) return toast.error("Define el alcance del PESV")
    if (!form.formationDate) return toast.error("Selecciona la fecha de conformación")
    if (members.length < 3) return toast.error("El Comité de Seguridad Vial debe tener al menos 3 integrantes")
    if (pesvLeader && !members.some((member) => member.employeeId === pesvLeader.employeeId)) {
      return toast.error("El líder PESV debe hacer parte del Comité de Seguridad Vial")
    }

    const saved = await onSave({
      objective: form.objective.trim(),
      vision: form.vision.trim(),
      scope: form.scope.trim(),
      formationDate: form.formationDate,
      memberIds: form.memberIds,
    })
    if (saved) onOpenChange(false)
  }

  return (
    <SafeCloudFormDrawerFrame open={open} onOpenChange={onOpenChange}>
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/75 px-6 py-4 pr-12">
          <div className="flex min-w-0 items-start gap-3">
            <FormDialogIcon icon="committee" tone="blue" />
            <div className="min-w-0">
              <DialogTitle>{record ? "Actualizar Comité de Seguridad Vial" : "Crear Comité de Seguridad Vial"}</DialogTitle>
              <p className="mt-1 text-sm text-slate-600">Define el marco del comité y selecciona sus integrantes.</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto bg-slate-50/40 px-6 py-5">
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="document" title="Marco del PESV" description="Establece el objetivo, la visión, el alcance y la fecha de conformación." />
              <div className="grid gap-4">
                <Label className="grid gap-2">
                  Objetivo general
                  <Textarea value={form.objective} rows={3} onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))} />
                </Label>
                <Label className="grid gap-2">
                  Visión
                  <Textarea value={form.vision} rows={3} onChange={(event) => setForm((current) => ({ ...current, vision: event.target.value }))} />
                </Label>
                <Label className="grid gap-2">
                  Alcance
                  <Textarea value={form.scope} rows={3} onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value }))} />
                </Label>
                <Label className="grid max-w-xs gap-2">
                  Fecha de conformación
                  <Input type="date" value={form.formationDate} onChange={(event) => setForm((current) => ({ ...current, formationDate: event.target.value }))} />
                </Label>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <FormSectionTitle icon="employee" title="Integrantes con poder de decisión" />
                  <p className="text-sm text-muted-foreground">Selecciona mínimo 3 personas. El líder PESV se incluye automáticamente si está asignado.</p>
                </div>
                <Badge variant="outline">{buildMembers(employees, form.memberIds, pesvLeader).length} integrantes</Badge>
              </div>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar funcionario" />
              </div>
              <div className="grid max-h-72 gap-2 overflow-y-auto">
                {filteredEmployees.map((employee) => {
                  const isLeader = pesvLeader?.employeeId === employee.id
                  const checked = form.memberIds.includes(employee.id) || isLeader
                  return (
                    <label key={employee.id} className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isLeader}
                        onChange={() => setForm((current) => ({ ...current, memberIds: toggleId(current.memberIds, employee.id) }))}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block font-medium text-foreground">{employeeFullName(employee)}</span>
                        <span className="block text-xs text-muted-foreground">{employee.email || "Sin correo"}{isLeader ? " · Líder PESV" : ""}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{record ? "Guardar cambios" : "Crear comité"}</Button>
          </DialogFooter>
        </form>
    </SafeCloudFormDrawerFrame>
  )
}

function ReviewDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (form: ReviewForm) => Promise<boolean>
}) {
  const [form, setForm] = useState<ReviewForm>(defaultReviewForm)

  useEffect(() => {
    if (open) setForm(defaultReviewForm)
  }, [open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.reviewDate) return toast.error("Selecciona la fecha de revisión")
    if (!form.roadAccidentAnalysis.trim()) return toast.error("Registra el análisis de siniestralidad vial")
    if (!form.indicatorsAnalysis.trim()) return toast.error("Registra el análisis de indicadores")
    if (!form.decisions.trim()) return toast.error("Registra las decisiones tomadas")

    const saved = await onSave({
      ...form,
      roadAccidentAnalysis: form.roadAccidentAnalysis.trim(),
      indicatorsAnalysis: form.indicatorsAnalysis.trim(),
      selfManagementReport: form.selfManagementReport.trim(),
      annualWorkPlanReview: form.annualWorkPlanReview.trim(),
      auditsReview: form.auditsReview.trim(),
      implementationReview: form.implementationReview.trim(),
      decisions: form.decisions.trim(),
    })
    if (saved) onOpenChange(false)
  }

  return (
    <SafeCloudFormDrawerFrame open={open} onOpenChange={onOpenChange}>
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/75 px-6 py-4 pr-12">
          <div className="flex min-w-0 items-start gap-3">
            <FormDialogIcon icon="meeting" tone="blue" />
            <div className="min-w-0">
              <DialogTitle>Nueva revisión trimestral PESV</DialogTitle>
              <p className="mt-1 text-sm text-slate-600">Documenta el análisis, las revisiones y las decisiones del periodo.</p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto bg-slate-50/40 px-6 py-5">
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="meeting" title="Periodo de revisión" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Label className="grid gap-2">
                Trimestre
                <PesvSelect
                  ariaLabel="Trimestre"
                  value={form.quarter}
                  onValueChange={(value) => setForm((current) => ({ ...current, quarter: value as QuarterlyReview["quarter"] }))}
                  options={[
                    { value: "Q1", label: "Primer trimestre" },
                    { value: "Q2", label: "Segundo trimestre" },
                    { value: "Q3", label: "Tercer trimestre" },
                    { value: "Q4", label: "Cuarto trimestre" },
                  ]}
                />
              </Label>
              <Label className="grid gap-2">
                Fecha de revisión
                <Input type="date" value={form.reviewDate} onChange={(event) => setForm((current) => ({ ...current, reviewDate: event.target.value }))} />
              </Label>
            </div>
            </section>
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <FormSectionTitle icon="analytics" title="Análisis y seguimiento" />
            <Label className="grid gap-2">
              Seguimiento, análisis y evaluación de siniestralidad vial
              <Textarea value={form.roadAccidentAnalysis} onChange={(event) => setForm((current) => ({ ...current, roadAccidentAnalysis: event.target.value }))} rows={3} />
            </Label>
            <Label className="grid gap-2">
              Indicadores y reporte de autogestión del PESV
              <Textarea value={form.indicatorsAnalysis} onChange={(event) => setForm((current) => ({ ...current, indicatorsAnalysis: event.target.value }))} rows={3} />
            </Label>
            <Label className="grid gap-2">
              Reporte de autogestión
              <Textarea value={form.selfManagementReport} onChange={(event) => setForm((current) => ({ ...current, selfManagementReport: event.target.value }))} rows={3} />
            </Label>
            <Label className="grid gap-2">
              Revisión del plan anual de trabajo
              <Textarea value={form.annualWorkPlanReview} onChange={(event) => setForm((current) => ({ ...current, annualWorkPlanReview: event.target.value }))} rows={3} />
            </Label>
            <Label className="grid gap-2">
              Revisión de auditorías
              <Textarea value={form.auditsReview} onChange={(event) => setForm((current) => ({ ...current, auditsReview: event.target.value }))} rows={3} />
            </Label>
            <Label className="grid gap-2">
              Revisión de implementación del PESV
              <Textarea value={form.implementationReview} onChange={(event) => setForm((current) => ({ ...current, implementationReview: event.target.value }))} rows={3} />
            </Label>
            </section>
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <FormSectionTitle icon="prevention" title="Decisiones y mejora" />
            <Label className="grid gap-2">
              Decisiones para la mejora de la seguridad vial
              <Textarea value={form.decisions} onChange={(event) => setForm((current) => ({ ...current, decisions: event.target.value }))} rows={3} />
            </Label>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar revisión</Button>
          </DialogFooter>
        </form>
    </SafeCloudFormDrawerFrame>
  )
}

export default function PesvCommitteePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [pesvLeader, setPesvLeader] = useState<PesvResponsibleRecord | null>(null)
  const [committee, setCommittee] = useState<PesvCommitteeRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [committeeDialogOpen, setCommitteeDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedReviewForEvidence, setSelectedReviewForEvidence] = useState<QuarterlyReview | null>(null)
  const [documentsOpen, setDocumentsOpen] = useState(false)

  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState("")
  async function readCommittee() {
    const records = await loadPesv<PesvCommitteeRecord & { documents?: import("@/services/pesvService").PesvDocument[] }>("committee")
    const current = records[0] ?? null
    if (current) {
      current.members ??= []
      current.reviews = await listPesv<QuarterlyReview>(`${pesvPath("committee", current.id)}/reviews`)
      current.reviews = current.reviews.map(review => ({ ...review, evidenceFileName: current.documents?.find(document => document.targetId === review.id)?.fileName ?? "" }))
    }
    return current
  }
  async function reload() { setCommittee(await readCommittee()) }
  useEffect(() => {
    let active = true
    Promise.allSettled([listEmployees(), loadPesv<PesvResponsibleRecord & { id: string }>("responsible"), readCommittee()]).then(([employeeResult, leadersResult, committeeResult]) => {
      if (!active) return
      if (employeeResult.status === "fulfilled") setEmployees(employeeResult.value.filter(employee => employee.status !== false))
      else toast.error("No se pudo cargar el catálogo de funcionarios: " + employeeResult.reason.message)
      if (committeeResult.status === "fulfilled") {
        setCommittee(committeeResult.value)
        const member = committeeResult.value?.members.find(member => member.isPesvLeader)
        setPesvLeader(leadersResult.status === "fulfilled" ? leadersResult.value[0] ?? member ?? null : member ?? null)
      } else setLoadError(committeeResult.reason.message)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const decisionMembers = committee?.members.filter(member => member.hasDecisionPower).length ?? 0
  const quarterlyReviews = committee?.reviews.length ?? 0
  async function handleSaveCommittee(form: CommitteeForm): Promise<boolean> {
    if (saving) return false
    setSaving(true)
    try { await savePesv("committee", { ...form, ...pesvVersion(committee) }, committee?.id); await reload().catch(error => { toast.error("Cambios guardados, pero no se pudo actualizar la vista: " + error.message) }); toast.success("Comité guardado"); return true }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar el comité"); return false }
    finally { setSaving(false) }
  }
  async function handleSaveReview(form: ReviewForm): Promise<boolean> {
    if (!committee || saving) return false
    setSaving(true)
    try { await pesvRequest(`${pesvPath("committee", committee.id)}/reviews`, "POST", form); await reload().catch(error => { toast.error("Cambios guardados, pero no se pudo actualizar la vista: " + error.message) }); toast.success("Revisión trimestral registrada"); return true }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo registrar la revisión"); return false }
    finally { setSaving(false) }
  }

  return (
    <main className="space-y-6">
      {loadError && <p role="alert" className="text-sm text-red-600">{loadError}</p>}
      <PesvModuleHeader title="Comité de Seguridad Vial" description="Conforma el CSV, define objetivo, visión y alcance del PESV, y documenta sus revisiones trimestrales." icon={UsersRound} actions={<>
          <Button className="gap-2" onClick={() => setCommitteeDialogOpen(true)} disabled={loading}>
            <UsersRound className="h-4 w-4" />
            {committee ? "Gestionar comité" : "Crear comité"}
          </Button>
          <Button className="gap-2" variant="outline" onClick={() => setReviewDialogOpen(true)} disabled={!committee}>
            <Plus className="h-4 w-4" />
            Revisión trimestral
          </Button>
          <Button variant="outline" disabled={!committee} onClick={() => setDocumentsOpen(true)}><Upload className="mr-2 h-4 w-4" />Documentos del comité</Button>
        </>} />

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <KpiStrip items={[
            { title: "Integrantes", value: committee?.members.length ?? 0, description: "Miembros del comité", icon: "users", tone: "blue" },
            { title: "Con decisión", value: decisionMembers, description: "Participación habilitada", icon: "active", tone: "green" },
            { title: "Revisiones", value: quarterlyReviews, description: "Cortes documentados", icon: "meeting", tone: "cyan" },
            { title: "Líder PESV", value: pesvLeader?.employeeName ?? "No asignado", description: "Responsable designado", icon: "job", tone: pesvLeader ? "slate" : "amber" },
          ]} />

          {!committee ? (
            <Card className="border-dashed border-border bg-card">
              <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-8 text-center">
                <ShieldCheck className="h-10 w-10 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Aún no hay Comité de Seguridad Vial</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Crea el comité con mínimo 3 integrantes con poder de decisión.</p>
                </div>
                <Button className="gap-2" onClick={() => setCommitteeDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Crear comité
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="text-base">Marco del PESV definido por el comité</CardTitle>
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => { void downloadPesv(`${pesvPath("committee", committee.id)}/export`, "comite-seguridad-vial.pdf").catch(error => toast.error(error.message)) }}>
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Objetivo general</p>
                    <p className="mt-1 text-sm text-muted-foreground">{committee.objective}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Visión</p>
                    <p className="mt-1 text-sm text-muted-foreground">{committee.vision}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Alcance</p>
                    <p className="mt-1 text-sm text-muted-foreground">{committee.scope}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    Fecha de conformación: {formatDate(committee.formationDate)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base">Integrantes del CSV</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {committee.members.map((member) => (
                    <div key={member.employeeId} className="rounded-md border border-border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{member.employeeName}</p>
                        {member.isPesvLeader && <Badge className="bg-primary text-primary-foreground">Líder PESV</Badge>}
                        <Badge variant="outline">Con poder de decisión</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {committee && (
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-base">Revisiones trimestrales documentadas</CardTitle>
                <Button className="gap-2" size="sm" onClick={() => setReviewDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nueva revisión
                </Button>
              </CardHeader>
              <CardContent>
                {committee.reviews.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No hay revisiones trimestrales registradas.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full min-w-[920px] text-sm">
                      <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Trimestre</th>
                          <th className="px-4 py-3 font-medium">Fecha</th>
                          <th className="px-4 py-3 font-medium">Siniestralidad / indicadores</th>
                          <th className="px-4 py-3 font-medium">Decisiones</th>
                          <th className="px-4 py-3 text-right font-medium">Evidencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {committee.reviews.map((review) => (
                          <tr key={review.id}>
                            <td className="px-4 py-3 font-medium text-foreground">{quarterLabels[review.quarter]}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(review.reviewDate)}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              <p className="max-w-[260px] truncate">{review.roadAccidentAnalysis}</p>
                              <p className="max-w-[260px] truncate">{review.indicatorsAnalysis}</p>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground"><p className="max-w-[280px] truncate">{review.decisions}</p></td>
                            <td className="px-4 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuItem disabled>
                                    <FileCheck2 className="h-4 w-4" />
                                    {review.evidenceFileName || "Sin evidencia"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={() => setSelectedReviewForEvidence(review)}>
                                    <Upload className="h-4 w-4" />
                                    {review.evidenceFileName ? "Actualizar evidencia" : "Cargar evidencia"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => setSelectedReviewForEvidence(review)}>Ver detalle</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Modal open={documentsOpen} onOpenChange={setDocumentsOpen} title="Documentos del Comité de Seguridad Vial">{committee && <PesvApiDocuments resource="committee" id={committee.id} onChanged={() => { void reload().catch(error => toast.error(error.message)) }} />}</Modal>
      <CommitteeDialog
        open={committeeDialogOpen}
        employees={employees}
        record={committee}
        pesvLeader={pesvLeader}
        onOpenChange={setCommitteeDialogOpen}
        onSave={handleSaveCommittee}
      />
      <ReviewDialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen} onSave={handleSaveReview} />
      <Modal open={!!selectedReviewForEvidence} onOpenChange={open => !open && setSelectedReviewForEvidence(null)} title="Documentos de revisión trimestral">{committee && selectedReviewForEvidence && <PesvApiDocuments resource="committee" id={committee.id} targetId={selectedReviewForEvidence.id} onChanged={() => { void reload().catch(error => toast.error(error.message)) }} />}</Modal>
    </main>
  )
}
