"use client"

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
import jsPDF from "jspdf"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

type PesvResponsibleRecord = {
  id: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  employeePhone: string
  signatureDate: string
  roleDescription: string
  supportFileName: string
  supportDescription: string
  updatedAt: string
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

const COMMITTEE_STORAGE_KEY = "safecloud:pesv-committee"
const RESPONSIBLE_STORAGE_KEY = "safecloud:pesv-responsible"

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

const PESV_MOCK_EMPLOYEES: Employee[] = [
  {
    id: "pesv-mock-employee-1",
    name: "Diana",
    lastName: "Mendoza",
    phone: "3000000001",
    email: "diana.mendoza@safecloud.local",
    address: "No registrada",
    birthDate: "1990-01-15",
    companyId: "pesv-mock-company",
    workAreaId: "pesv-mock-area",
    jobId: "pesv-mock-job-1",
    status: true,
  },
  {
    id: "pesv-mock-employee-2",
    name: "Carlos",
    lastName: "Ramírez",
    phone: "3000000002",
    email: "carlos.ramirez@safecloud.local",
    address: "No registrada",
    birthDate: "1988-05-20",
    companyId: "pesv-mock-company",
    workAreaId: "pesv-mock-area",
    jobId: "pesv-mock-job-2",
    status: true,
  },
  {
    id: "pesv-mock-employee-3",
    name: "Valentina",
    lastName: "Suárez",
    phone: "3000000003",
    email: "valentina.suarez@safecloud.local",
    address: "No registrada",
    birthDate: "1992-11-08",
    companyId: "pesv-mock-company",
    workAreaId: "pesv-mock-area",
    jobId: "pesv-mock-job-3",
    status: true,
  },
  {
    id: "pesv-mock-employee-4",
    name: "Andrés",
    lastName: "Torres",
    phone: "3000000004",
    email: "andres.torres@safecloud.local",
    address: "No registrada",
    birthDate: "1985-09-12",
    companyId: "pesv-mock-company",
    workAreaId: "pesv-mock-area",
    jobId: "pesv-mock-job-4",
    status: true,
  },
]

function withPesvMockEmployees(employees: Employee[]) {
  if (employees.length >= 3) return employees
  const existingIds = new Set(employees.map((employee) => employee.id))
  return [...employees, ...PESV_MOCK_EMPLOYEES.filter((employee) => !existingIds.has(employee.id))]
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}`
}

function employeeFullName(employee: Employee) {
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "Funcionario sin nombre"
}

function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeStorage<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
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

function downloadCommitteePdf(record: PesvCommitteeRecord) {
  const doc = new jsPDF("p", "mm", "a4")
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2
  let y = 18

  doc.setFillColor(31, 92, 77)
  doc.roundedRect(margin, 12, contentWidth, 24, 3, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("COMITÉ DE SEGURIDAD VIAL", margin + 5, 23)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`PESV · Fecha de conformación: ${formatDate(record.formationDate)}`, margin + 5, 30)

  y = 48
  doc.setTextColor(30, 41, 59)
  const sections = [
    ["Objetivo general", record.objective],
    ["Visión", record.vision],
    ["Alcance", record.scope],
  ]

  sections.forEach(([title, content]) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text(title, margin, y)
    y += 6
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(content, contentWidth)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 6
  })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Integrantes con poder de decisión", margin, y)
  y += 7
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  record.members.forEach((member, index) => {
    doc.text(`${index + 1}. ${member.employeeName} - ${member.role}`, margin, y)
    y += 6
  })

  y += 6
  doc.setFont("helvetica", "bold")
  doc.text("Revisiones trimestrales documentadas", margin, y)
  y += 7
  doc.setFont("helvetica", "normal")
  record.reviews.slice(0, 4).forEach((review) => {
    if (y > 260) {
      doc.addPage()
      y = 18
    }
    doc.text(`${quarterLabels[review.quarter]} · ${formatDate(review.reviewDate)}`, margin, y)
    y += 5
    doc.text(doc.splitTextToSize(`Decisiones: ${review.decisions || "Sin decisiones registradas"}`, contentWidth), margin, y)
    y += 12
  })

  doc.save("comite-seguridad-vial-pesv.pdf")
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
  onSave: (form: CommitteeForm) => void
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    onSave({
      objective: form.objective.trim(),
      vision: form.vision.trim(),
      scope: form.scope.trim(),
      formationDate: form.formationDate,
      memberIds: form.memberIds,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{record ? "Actualizar Comité de Seguridad Vial" : "Crear Comité de Seguridad Vial"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Marco del PESV</h3>
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

            <section className="rounded-md border border-border p-4">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Integrantes con poder de decisión</h3>
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
      </DialogContent>
    </Dialog>
  )
}

function ReviewDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (form: ReviewForm) => void
}) {
  const [form, setForm] = useState<ReviewForm>(defaultReviewForm)

  useEffect(() => {
    if (open) setForm(defaultReviewForm)
  }, [open])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.reviewDate) return toast.error("Selecciona la fecha de revisión")
    if (!form.roadAccidentAnalysis.trim()) return toast.error("Registra el análisis de siniestralidad vial")
    if (!form.indicatorsAnalysis.trim()) return toast.error("Registra el análisis de indicadores")
    if (!form.decisions.trim()) return toast.error("Registra las decisiones tomadas")

    onSave({
      ...form,
      roadAccidentAnalysis: form.roadAccidentAnalysis.trim(),
      indicatorsAnalysis: form.indicatorsAnalysis.trim(),
      selfManagementReport: form.selfManagementReport.trim(),
      annualWorkPlanReview: form.annualWorkPlanReview.trim(),
      auditsReview: form.auditsReview.trim(),
      implementationReview: form.implementationReview.trim(),
      decisions: form.decisions.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Nueva revisión trimestral PESV</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Label className="grid gap-2">
                Trimestre
                <select
                  value={form.quarter}
                  onChange={(event) => setForm((current) => ({ ...current, quarter: event.target.value as QuarterlyReview["quarter"] }))}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="Q1">Primer trimestre</option>
                  <option value="Q2">Segundo trimestre</option>
                  <option value="Q3">Tercer trimestre</option>
                  <option value="Q4">Cuarto trimestre</option>
                </select>
              </Label>
              <Label className="grid gap-2">
                Fecha de revisión
                <Input type="date" value={form.reviewDate} onChange={(event) => setForm((current) => ({ ...current, reviewDate: event.target.value }))} />
              </Label>
            </div>
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
            <Label className="grid gap-2">
              Decisiones para la mejora de la seguridad vial
              <Textarea value={form.decisions} onChange={(event) => setForm((current) => ({ ...current, decisions: event.target.value }))} rows={3} />
            </Label>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar revisión</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ReviewEvidenceDialog({
  open,
  review,
  onOpenChange,
  onSave,
}: {
  open: boolean
  review: QuarterlyReview | null
  onOpenChange: (open: boolean) => void
  onSave: (reviewId: string, evidenceFileName: string) => void
}) {
  const [fileName, setFileName] = useState("")

  useEffect(() => {
    if (open) setFileName(review?.evidenceFileName ?? "")
  }, [open, review])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!review) return
    if (!fileName.trim()) return toast.error("Selecciona o registra el nombre de la evidencia")

    onSave(review.id, fileName.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card">
        <DialogHeader>
          <DialogTitle>Cargar evidencia de revisión</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
            {review ? `${quarterLabels[review.quarter]} · ${formatDate(review.reviewDate)}` : "Revisión trimestral"}
          </div>

          <Label className="grid gap-2">
            Evidencia o acta de revisión
            <Input
              type="file"
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? fileName)}
            />
          </Label>

          <Label className="grid gap-2">
            Nombre del archivo
            <Input
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder="acta-revision-trimestral-pesv.pdf"
            />
          </Label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar evidencia</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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

  useEffect(() => {
    let mounted = true
    async function loadData() {
      setLoading(true)
      try {
        const employeeList = await listEmployees()
        if (!mounted) return
        setEmployees(withPesvMockEmployees(employeeList))
        setPesvLeader(readStorage<PesvResponsibleRecord>(RESPONSIBLE_STORAGE_KEY))
        setCommittee(readStorage<PesvCommitteeRecord>(COMMITTEE_STORAGE_KEY))
      } catch {
        if (mounted) {
          setEmployees(PESV_MOCK_EMPLOYEES)
          setPesvLeader(readStorage<PesvResponsibleRecord>(RESPONSIBLE_STORAGE_KEY))
          setCommittee(readStorage<PesvCommitteeRecord>(COMMITTEE_STORAGE_KEY))
          toast.info("Usando funcionarios mock para el Comité PESV mientras se conecta el backend.")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      mounted = false
    }
  }, [])

  const decisionMembers = committee?.members.filter((member) => member.hasDecisionPower).length ?? 0
  const quarterlyReviews = committee?.reviews.length ?? 0

  function handleSaveCommittee(form: CommitteeForm) {
    const members = buildMembers(employees, form.memberIds, pesvLeader)
    const nextRecord: PesvCommitteeRecord = {
      id: committee?.id ?? createId("pesv-committee"),
      objective: form.objective,
      vision: form.vision,
      scope: form.scope,
      formationDate: form.formationDate,
      members,
      reviews: committee?.reviews ?? [],
      updatedAt: new Date().toISOString(),
    }

    writeStorage(COMMITTEE_STORAGE_KEY, nextRecord)
    setCommittee(nextRecord)
    toast.success(committee ? "Comité de Seguridad Vial actualizado" : "Comité de Seguridad Vial creado")
  }

  function handleSaveReview(form: ReviewForm) {
    if (!committee) {
      toast.error("Primero crea el Comité de Seguridad Vial")
      return
    }

    const review: QuarterlyReview = {
      id: createId("pesv-review"),
      ...form,
      evidenceFileName: "",
      createdAt: new Date().toISOString(),
    }
    const nextRecord = {
      ...committee,
      reviews: [review, ...committee.reviews],
      updatedAt: new Date().toISOString(),
    }

    writeStorage(COMMITTEE_STORAGE_KEY, nextRecord)
    setCommittee(nextRecord)
    toast.success("Revisión trimestral registrada")
  }

  function handleSaveReviewEvidence(reviewId: string, evidenceFileName: string) {
    if (!committee) return

    const nextRecord = {
      ...committee,
      reviews: committee.reviews.map((review) => (review.id === reviewId ? { ...review, evidenceFileName } : review)),
      updatedAt: new Date().toISOString(),
    }

    writeStorage(COMMITTEE_STORAGE_KEY, nextRecord)
    setCommittee(nextRecord)
    setSelectedReviewForEvidence(null)
    toast.success("Evidencia de revisión cargada")
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comité de Seguridad Vial</h1>
          <p className="text-muted-foreground">
            Conforma el CSV, define objetivo, visión y alcance del PESV, y documenta sus revisiones trimestrales.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="gap-2" onClick={() => setCommitteeDialogOpen(true)} disabled={loading}>
            <UsersRound className="h-4 w-4" />
            {committee ? "Gestionar comité" : "Crear comité"}
          </Button>
          <Button className="gap-2" variant="outline" onClick={() => setReviewDialogOpen(true)} disabled={!committee}>
            <Plus className="h-4 w-4" />
            Revisión trimestral
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Integrantes</p><p className="mt-2 text-2xl font-bold text-foreground">{committee?.members.length ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Con decisión</p><p className="mt-2 text-2xl font-bold text-foreground">{decisionMembers}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Revisiones</p><p className="mt-2 text-2xl font-bold text-foreground">{quarterlyReviews}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Líder PESV</p><p className="mt-2 truncate text-base font-semibold text-foreground">{pesvLeader?.employeeName ?? "No asignado"}</p></CardContent></Card>
          </section>

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
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => downloadCommitteePdf(committee)}>
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
                                  <DropdownMenuItem onSelect={() => toast.info("La visualización de evidencias quedará conectada cuando exista contrato backend.")}>Ver detalle</DropdownMenuItem>
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

      <CommitteeDialog
        open={committeeDialogOpen}
        employees={employees}
        record={committee}
        pesvLeader={pesvLeader}
        onOpenChange={setCommitteeDialogOpen}
        onSave={handleSaveCommittee}
      />
      <ReviewDialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen} onSave={handleSaveReview} />
      <ReviewEvidenceDialog
        open={Boolean(selectedReviewForEvidence)}
        review={selectedReviewForEvidence}
        onOpenChange={(open) => {
          if (!open) setSelectedReviewForEvidence(null)
        }}
        onSave={handleSaveReviewEvidence}
      />
    </main>
  )
}
