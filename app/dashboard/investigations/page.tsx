"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  History,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
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
import { listAcpms } from "@/services/acpmService"
import { listManagedDocuments } from "@/services/documentManagementService"
import { listEmployees } from "@/services/employeeService"
import { listIncidents } from "@/services/incidentService"
import {
  changeInvestigationStatus,
  createInvestigation,
  getInvestigation,
  getInvestigationSummary,
  getInvestigationTraceability,
  listInvestigationEvidence,
  listInvestigations,
  deleteInvestigationEvidence,
  updateInvestigation,
  uploadInvestigationEvidence,
  verifyInvestigationEfficacy,
} from "@/services/investigationService"
import type { Acpm } from "@/types/manager/acpm"
import type { ManagedDocument } from "@/types/manager/document-management"
import type { Employee } from "@/types/manager/employee"
import type { Incident } from "@/types/manager/incident"
import type {
  Investigation,
  InvestigationAcpmSource,
  InvestigationEvidence,
  InvestigationEfficacyStatus,
  InvestigationReviewer,
  InvestigationReviewerType,
  InvestigationStatus,
  InvestigationSummary,
  InvestigationTraceability,
  UpsertInvestigationDto,
} from "@/types/manager/investigation"

type ReviewerForm = {
  id: string
  type: InvestigationReviewerType
  employeeId: string
  externalName: string
}

type InvestigationForm = {
  incidentId: string
  responsibleEmployeeId: string
  reviewers: ReviewerForm[]
  causeAnalysis: string
  correctiveActions: string
  preventiveActions: string
  improvementActions: string
  acpmSource: InvestigationAcpmSource
  acpmReference: string
  acpmId: string
  documentManagementId: string
  expectedClosureDate: string
}

type Filters = {
  search: string
  efficacyStatus: InvestigationEfficacyStatus | "all"
  status: InvestigationStatus | "all"
  responsibleEmployeeId: string
  startDate: string
  endDate: string
}

const emptyForm: InvestigationForm = {
  incidentId: "",
  responsibleEmployeeId: "",
  reviewers: [{ id: "reviewer-1", type: "EMPLOYEE", employeeId: "", externalName: "" }],
  causeAnalysis: "",
  correctiveActions: "",
  preventiveActions: "",
  improvementActions: "",
  acpmSource: "ACPM",
  acpmReference: "",
  acpmId: "",
  documentManagementId: "",
  expectedClosureDate: "",
}

const emptyFilters: Filters = {
  search: "",
  efficacyStatus: "all",
  status: "all",
  responsibleEmployeeId: "",
  startDate: "",
  endDate: "",
}

const emptySummary: InvestigationSummary = {
  total: 0,
  reported: 0,
  pendingVerification: 0,
  closedEffective: 0,
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

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

function fullEmployeeName(employee?: { name?: string; lastName?: string } | null) {
  if (!employee) return "No asignado"
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || "No asignado"
}

function employeeLabel(employee: Employee) {
  const job = employee.job?.name ? ` - ${employee.job.name}` : ""
  return `${fullEmployeeName(employee)}${job}`
}

function incidentTypeLabel(type?: string | null) {
  const labels: Record<string, string> = {
    INCIDENTE: "Incidente",
    ACCIDENTE: "Accidente",
    ENFERMEDAD_LABORAL: "Enfermedad laboral",
    INCAPACIDAD_MEDICA: "Incapacidad médica",
    LICENCIA_MATERNIDAD: "Licencia de maternidad",
    LICENCIA_PATERNIDAD: "Licencia de paternidad",
    VACACIONES: "Vacaciones",
    DIAS_NO_REMUNERADO: "Días no remunerados",
    DIA_REMUNERADO: "Día remunerado",
    REVISION_POR_LA_DIRECCION: "Revisión por la dirección",
    REQUERIMIENTO_DE_AUTORIDAD_ADMINISTRATIVA: "Requerimiento de autoridad administrativa",
    RECOMENDACION_DE_LA_ARL: "Recomendación de la ARL",
  }

  return type ? labels[type] ?? type : "Novedad"
}

function incidentLabel(incident?: Investigation["incident"] | null) {
  const source = incident
  if (!source) return "Novedad no encontrada"

  const consecutive = source.consecutive || "Sin consecutivo"
  const type = incidentTypeLabel(source.type)
  const employee = fullEmployeeName(source.employee)
  return `${consecutive} - ${type}${employee !== "No asignado" ? ` - ${employee}` : ""}`
}

function incidentOptionLabel(incident: Incident) {
  return `${incident.consecutive || "Sin consecutivo"} - ${incidentTypeLabel(incident.type)} - ${fullEmployeeName(incident.employee)}`
}

function efficacyLabel(status: InvestigationEfficacyStatus) {
  if (status === "EFICAZ") return "Eficaz"
  if (status === "PENDIENTE_VERIFICACION") return "Pendiente de verificación"
  return "Reportado"
}

function efficacyClassName(status: InvestigationEfficacyStatus) {
  if (status === "EFICAZ") return "border-transparent bg-emerald-600 text-white"
  if (status === "PENDIENTE_VERIFICACION") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-transparent bg-blue-600 text-white"
}

function statusLabel(status: InvestigationStatus) {
  return status === "ACTIVE" ? "Activo" : "Inactivo"
}

function statusClassName(status: InvestigationStatus) {
  return status === "ACTIVE"
    ? "border-transparent bg-accentActivd text-accentActivd-foreground"
    : "border-slate-200 bg-slate-100 text-slate-700"
}

function acpmSourceLabel(source: InvestigationAcpmSource) {
  if (source === "DOCUMENT_MANAGEMENT") return "Gestión documental"
  if (source === "OTHER") return "Otro origen"
  return "ACPM"
}

function reviewerLabel(reviewer: InvestigationReviewer) {
  if (reviewer.type === "EMPLOYEE") return fullEmployeeName(reviewer.employee)
  return reviewer.externalName?.trim() || "Persona externa"
}

function mapInvestigationToForm(investigation: Investigation): InvestigationForm {
  return {
    incidentId: investigation.incidentId,
    responsibleEmployeeId: investigation.responsibleEmployeeId,
    reviewers:
      investigation.reviewers?.length > 0
        ? investigation.reviewers.map((reviewer, index) => ({
            id: reviewer.id ?? `reviewer-${index + 1}`,
            type: reviewer.type,
            employeeId: reviewer.employeeId ?? "",
            externalName: reviewer.externalName ?? "",
          }))
        : emptyForm.reviewers,
    causeAnalysis: investigation.causeAnalysis ?? "",
    correctiveActions: investigation.correctiveActions ?? "",
    preventiveActions: investigation.preventiveActions ?? "",
    improvementActions: investigation.improvementActions ?? "",
    acpmSource: investigation.acpmSource,
    acpmReference: investigation.acpmReference ?? "",
    acpmId: investigation.acpmId ?? "",
    documentManagementId: investigation.documentManagementId ?? "",
    expectedClosureDate: investigation.expectedClosureDate ?? "",
  }
}

function buildPayload(form: InvestigationForm): UpsertInvestigationDto {
  const payload: UpsertInvestigationDto = {
    incidentId: form.incidentId,
    responsibleEmployeeId: form.responsibleEmployeeId,
    reviewers: form.reviewers
      .filter((reviewer) => (reviewer.type === "EMPLOYEE" ? reviewer.employeeId : reviewer.externalName.trim()))
      .map((reviewer) => ({
        type: reviewer.type,
        ...(reviewer.type === "EMPLOYEE"
          ? { employeeId: reviewer.employeeId }
          : { externalName: reviewer.externalName.trim() }),
      })),
    causeAnalysis: form.causeAnalysis.trim(),
    acpmSource: form.acpmSource,
  }

  if (form.correctiveActions.trim()) payload.correctiveActions = form.correctiveActions.trim()
  if (form.preventiveActions.trim()) payload.preventiveActions = form.preventiveActions.trim()
  if (form.improvementActions.trim()) payload.improvementActions = form.improvementActions.trim()
  if (form.acpmReference.trim()) payload.acpmReference = form.acpmReference.trim()
  if (form.acpmSource === "ACPM" && form.acpmId) payload.acpmId = form.acpmId
  if (form.acpmSource === "DOCUMENT_MANAGEMENT" && form.documentManagementId) {
    payload.documentManagementId = form.documentManagementId
  }
  if (form.expectedClosureDate) payload.expectedClosureDate = form.expectedClosureDate

  return payload
}

function updateInvestigationInList(items: Investigation[], updated: Investigation) {
  return items.map((item) => (item.id === updated.id ? updated : item))
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary p-3">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{value}</p>
    </div>
  )
}

function InvestigationDialog({
  open,
  editing,
  employees,
  incidents,
  acpms,
  documents,
  onClose,
  onSave,
}: {
  open: boolean
  editing: Investigation | null
  employees: Employee[]
  incidents: Incident[]
  acpms: Acpm[]
  documents: ManagedDocument[]
  onClose: () => void
  onSave: (form: InvestigationForm) => Promise<void>
}) {
  const [form, setForm] = useState<InvestigationForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(editing ? mapInvestigationToForm(editing) : emptyForm)
  }, [editing, open])

  function updateReviewer(reviewerId: string, changes: Partial<ReviewerForm>) {
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
      reviewers: [...current.reviewers, { id: createId("reviewer"), type: "EMPLOYEE", employeeId: "", externalName: "" }],
    }))
  }

  function removeReviewer(reviewerId: string) {
    setForm((current) => ({
      ...current,
      reviewers:
        current.reviewers.length === 1
          ? current.reviewers
          : current.reviewers.filter((reviewer) => reviewer.id !== reviewerId),
    }))
  }

  function handleAcpmChange(acpmId: string) {
    const acpm = acpms.find((item) => item.id === acpmId)
    setForm((current) => ({
      ...current,
      acpmId,
      acpmReference: acpm ? `ACPM-${acpm.year} - ${acpm.name}` : "",
    }))
  }

  function handleDocumentChange(documentId: string) {
    const document = documents.find((item) => item.id === documentId)
    setForm((current) => ({
      ...current,
      documentManagementId: documentId,
      acpmReference: document ? `${document.code} - ${document.name}` : "",
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const hasValidReviewer = form.reviewers.some((reviewer) =>
      reviewer.type === "EMPLOYEE" ? Boolean(reviewer.employeeId) : Boolean(reviewer.externalName.trim()),
    )

    if (!form.incidentId) return toast.error("Selecciona la novedad laboral asociada")
    if (!form.responsibleEmployeeId) return toast.error("Selecciona el funcionario responsable")
    if (!hasValidReviewer) return toast.error("Agrega al menos una persona investigadora")
    if (!form.causeAnalysis.trim()) return toast.error("Diligencia el análisis de causas")
    if (form.acpmSource === "ACPM" && !form.acpmId) {
      return toast.error("Selecciona la ACPM relacionada")
    }
    if (form.acpmSource === "DOCUMENT_MANAGEMENT" && !form.documentManagementId) {
      return toast.error("Selecciona el documento de gestión documental")
    }
    if (form.acpmSource === "OTHER" && !form.acpmReference.trim()) {
      return toast.error("Describe la referencia relacionada")
    }

    try {
      setSaving(true)
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-7xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-7xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Editar investigación" : "Nueva investigación"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Relaciona la novedad laboral, equipo investigador, análisis de causa y acciones ACPM.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Datos principales</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Selecciona la novedad laboral asociada y el funcionario responsable de la investigación.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1.5 rounded-xl border border-slate-300 bg-slate-50/70 p-3 shadow-xs">
                  <span className="text-xs font-semibold text-muted-foreground">Novedad laboral</span>
                  <select
                    value={form.incidentId}
                    onChange={(event) => setForm((current) => ({ ...current, incidentId: event.target.value }))}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Selecciona una novedad</option>
                    {incidents.map((incident) => (
                      <option key={incident.id} value={incident.id}>
                        {incidentOptionLabel(incident)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 rounded-xl border border-slate-300 bg-slate-50/70 p-3 shadow-xs">
                  <span className="text-xs font-semibold text-muted-foreground">Funcionario responsable</span>
                  <select
                    value={form.responsibleEmployeeId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, responsibleEmployeeId: event.target.value }))
                    }
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Selecciona responsable</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employeeLabel(employee)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Equipo investigador</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Agrega funcionarios o personas externas que participan en la investigación.
                    </p>
                  </div>
                </div>
                <Button type="button" size="sm" className="gap-2 self-start sm:self-auto" onClick={addReviewer}>
                  <Plus className="h-4 w-4" />
                  Agregar investigador
                </Button>
              </div>

              <div className="space-y-3">
                {form.reviewers.map((reviewer, index) => (
                  <div
                    key={reviewer.id}
                    className="grid gap-3 rounded-xl border border-slate-300 bg-slate-50/70 p-3 shadow-xs lg:grid-cols-[190px_minmax(0,1fr)_44px] lg:items-end"
                  >
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">Tipo</span>
                      <select
                        value={reviewer.type}
                        onChange={(event) =>
                          updateReviewer(reviewer.id, { type: event.target.value as InvestigationReviewerType })
                        }
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        aria-label={`Tipo de investigador ${index + 1}`}
                      >
                        <option value="EMPLOYEE">Funcionario</option>
                        <option value="EXTERNAL">Externo</option>
                      </select>
                    </label>

                    {reviewer.type === "EMPLOYEE" ? (
                      <label className="grid gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Investigador</span>
                        <select
                          value={reviewer.employeeId}
                          onChange={(event) => updateReviewer(reviewer.id, { employeeId: event.target.value })}
                          className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                          aria-label={`Funcionario investigador ${index + 1}`}
                        >
                          <option value="">Selecciona funcionario</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employeeLabel(employee)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label className="grid gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Persona externa</span>
                        <Input
                          value={reviewer.externalName}
                          onChange={(event) => updateReviewer(reviewer.id, { externalName: event.target.value })}
                          placeholder="Nombre completo de la persona externa"
                        />
                      </label>
                    )}

                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-10 w-10"
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
                Análisis de causas
                <Textarea
                  value={form.causeAnalysis}
                  onChange={(event) => setForm((current) => ({ ...current, causeAnalysis: event.target.value }))}
                  rows={4}
                  placeholder="Describe causas inmediatas, causas básicas, controles faltantes y hallazgos relevantes."
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
                    onChange={(event) =>
                      setForm((current) => ({ ...current, correctiveActions: event.target.value }))
                    }
                    rows={3}
                    placeholder="Opcional"
                  />
                </Label>
                <Label className="grid gap-2">
                  Acciones preventivas
                  <Textarea
                    value={form.preventiveActions}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, preventiveActions: event.target.value }))
                    }
                    rows={3}
                    placeholder="Opcional"
                  />
                </Label>
                <Label className="grid gap-2">
                  Acciones de mejora
                  <Textarea
                    value={form.improvementActions}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, improvementActions: event.target.value }))
                    }
                    rows={3}
                    placeholder="Opcional"
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Relación y cierre</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vincula la investigación con ACPM, gestión documental u otra referencia y define la fecha estimada de cierre.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
                <label className="grid gap-1.5 rounded-xl border border-slate-300 bg-slate-50/70 p-3 shadow-xs">
                  <span className="text-xs font-semibold text-muted-foreground">Origen ACPM</span>
                  <select
                    value={form.acpmSource}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        acpmSource: event.target.value as InvestigationAcpmSource,
                        acpmId: "",
                        documentManagementId: "",
                        acpmReference: "",
                      }))
                    }
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="ACPM">ACPM</option>
                    <option value="DOCUMENT_MANAGEMENT">Gestión documental</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </label>

                {form.acpmSource === "ACPM" ? (
                  <label className="grid gap-1.5 rounded-xl border border-slate-300 bg-slate-50/70 p-3 shadow-xs">
                    <span className="text-xs font-semibold text-muted-foreground">ACPM relacionada</span>
                    <select
                      value={form.acpmId}
                      onChange={(event) => handleAcpmChange(event.target.value)}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Selecciona ACPM relacionada</option>
                      {acpms.map((acpm) => (
                        <option key={acpm.id} value={acpm.id}>
                          {acpm.year} - {acpm.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : form.acpmSource === "DOCUMENT_MANAGEMENT" ? (
                  <label className="grid gap-1.5 rounded-xl border border-slate-300 bg-slate-50/70 p-3 shadow-xs">
                    <span className="text-xs font-semibold text-muted-foreground">Documento relacionado</span>
                    <select
                      value={form.documentManagementId}
                      onChange={(event) => handleDocumentChange(event.target.value)}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Selecciona documento</option>
                      {documents.map((document) => (
                        <option key={document.id} value={document.id}>
                          {document.code} - {document.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <Label className="grid gap-1.5 rounded-xl border border-slate-300 bg-slate-50/70 p-3 text-xs font-semibold text-muted-foreground shadow-xs">
                    Referencia
                    <Input
                      value={form.acpmReference}
                      onChange={(event) => setForm((current) => ({ ...current, acpmReference: event.target.value }))}
                      placeholder="Describe la referencia relacionada"
                    />
                  </Label>
                )}

                <Label className="grid gap-1.5 rounded-xl border border-slate-300 bg-slate-50/70 p-3 text-xs font-semibold text-muted-foreground shadow-xs">
                  Fecha estimada de cierre
                  <Input
                    type="date"
                    value={form.expectedClosureDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, expectedClosureDate: event.target.value }))
                    }
                  />
                </Label>
              </div>

            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              {editing ? "Guardar cambios" : "Crear investigación"}
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
  onConfirm: (investigation: Investigation, isEffective: boolean, observation: string) => Promise<void>
}) {
  const [observation, setObservation] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (investigation) setObservation("")
  }, [investigation])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!investigation) return
    if (!observation.trim()) return toast.error("Agrega una observación de la verificación")

    try {
      setSaving(true)
      await onConfirm(investigation, isEffective, observation)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(investigation)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEffective ? "Marcar como eficaz" : "Marcar como no eficaz"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registra la observación con la que se verificó la eficacia de las acciones.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Label className="grid gap-2">
            Observación
            <Textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              rows={4}
              placeholder="Describe el resultado de la verificación."
            />
          </Label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirmar
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
  onUpload: (investigation: Investigation, file: File, isConfirmed: boolean, observation: string) => Promise<void>
}) {
  const [file, setFile] = useState<File | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(true)
  const [observation, setObservation] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (investigation) {
      setFile(null)
      setIsConfirmed(true)
      setObservation("")
    }
  }, [investigation])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!investigation) return
    if (!file) return toast.error("Selecciona el archivo de evidencia")

    try {
      setSaving(true)
      await onUpload(investigation, file, isConfirmed, observation)
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir la evidencia")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(investigation)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subir evidencia</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adjunta el soporte documental de la investigación y deja una observación para la trazabilidad.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-border p-4">
            <Label className="grid gap-2">
              Archivo
              <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </Label>
            {file && (
              <p className="mt-2 truncate text-xs text-muted-foreground">
                Archivo seleccionado: {file.name}
              </p>
            )}
          </div>

          <Label className="grid gap-2">
            Observación
            <Textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              rows={3}
              placeholder="Describe brevemente el soporte que se está cargando."
            />
          </Label>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(event) => setIsConfirmed(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Confirmado
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Subir evidencia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DetailDialog({
  investigation,
  traceability,
  loading,
  deletingEvidenceId,
  onClose,
  onUploadEvidence,
  onDeleteEvidence,
}: {
  investigation: Investigation | null
  traceability: InvestigationTraceability[]
  loading: boolean
  deletingEvidenceId: string | null
  onClose: () => void
  onUploadEvidence: (investigation: Investigation) => void
  onDeleteEvidence: (investigation: Investigation, evidence: InvestigationEvidence) => Promise<void>
}) {
  const evidences = investigation?.evidences ?? []
  const traces = investigation?.traceability?.length ? investigation.traceability : traceability

  return (
    <Dialog open={Boolean(investigation)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Detalle de investigación</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {investigation?.consecutive} · {investigation ? efficacyLabel(investigation.efficacyStatus) : ""}
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-md border border-border p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando detalle...
            </div>
          ) : investigation ? (
            <>
              <section className="grid gap-3 md:grid-cols-3">
                <InfoBlock label="Novedad laboral" value={incidentLabel(investigation.incident)} />
                <InfoBlock label="Responsable" value={fullEmployeeName(investigation.responsibleEmployee)} />
                <InfoBlock label="Cierre esperado" value={formatDate(investigation.expectedClosureDate)} />
              </section>

              <section className="rounded-md border border-border p-4">
                <h3 className="mb-2 text-sm font-semibold text-foreground">Análisis de causas</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{investigation.causeAnalysis}</p>
              </section>

              <section className="grid gap-4 lg:grid-cols-3">
                <InfoBlock label="Correctivas" value={investigation.correctiveActions || "Sin registrar"} />
                <InfoBlock label="Preventivas" value={investigation.preventiveActions || "Sin registrar"} />
                <InfoBlock label="Mejora" value={investigation.improvementActions || "Sin registrar"} />
              </section>

              <section className="rounded-md border border-border p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <UserRound className="h-4 w-4" />
                  Equipo investigador
                </h3>
                <div className="flex flex-wrap gap-2">
                  {investigation.reviewers?.length ? (
                    investigation.reviewers.map((reviewer, index) => (
                      <Badge key={reviewer.id ?? index} variant="outline" className="bg-secondary">
                        {reviewerLabel(reviewer)}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin investigadores registrados.</p>
                  )}
                </div>
              </section>

              <section className="rounded-md border border-border p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="h-4 w-4" />
                    Evidencias
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2"
                    onClick={() => onUploadEvidence(investigation)}
                  >
                    <Upload className="h-4 w-4" />
                    Subir evidencia
                  </Button>
                </div>
                {evidences.length ? (
                  <div className="space-y-2">
                    {evidences.map((evidence) => (
                      <div
                        key={evidence.id}
                        className="flex flex-col gap-2 rounded-md border border-border bg-secondary p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{evidence.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(evidence.createdAt)}
                            {evidence.observation ? ` · ${evidence.observation}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {evidence.downloadUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => window.open(evidence.downloadUrl, "_blank", "noopener,noreferrer")}
                            >
                              <Download className="h-4 w-4" />
                              Descargar
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            disabled={deletingEvidenceId === evidence.id}
                            onClick={() => void onDeleteEvidence(investigation, evidence)}
                          >
                            {deletingEvidenceId === evidence.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                    Sin evidencias reportadas por el backend para esta investigación.
                  </p>
                )}
              </section>

              <section className="rounded-md border border-border p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <History className="h-4 w-4" />
                  Trazabilidad
                </h3>
                {traces.length ? (
                  <div className="space-y-3">
                    {traces.map((trace) => (
                      <div key={trace.id} className="rounded-md bg-secondary p-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-semibold text-foreground">{trace.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(trace.createdAt)}</p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{trace.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Actor: {trace.actorName || "Sistema"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin trazabilidad registrada.</p>
                )}
              </section>
            </>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [summary, setSummary] = useState<InvestigationSummary>(emptySummary)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [acpms, setAcpms] = useState<Acpm[]>([])
  const [documents, setDocuments] = useState<ManagedDocument[]>([])
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInvestigation, setEditingInvestigation] = useState<Investigation | null>(null)
  const [detailInvestigation, setDetailInvestigation] = useState<Investigation | null>(null)
  const [detailTraceability, setDetailTraceability] = useState<InvestigationTraceability[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [evidenceInvestigation, setEvidenceInvestigation] = useState<Investigation | null>(null)
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<string | null>(null)
  const [verificationAction, setVerificationAction] = useState<{
    investigation: Investigation
    isEffective: boolean
  } | null>(null)

  const backendFilters = useMemo(
    () => ({
      limit: 100,
      search: filters.search,
      responsibleEmployeeId: filters.responsibleEmployeeId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      efficacyStatus: filters.efficacyStatus === "all" ? undefined : filters.efficacyStatus,
      status: filters.status === "all" ? undefined : filters.status,
    }),
    [filters],
  )

  async function loadData(options: { silent?: boolean } = {}) {
    try {
      if (options.silent) setRefreshing(true)
      else setLoading(true)

      const [investigationList, summaryData, employeeList, incidentList, acpmList, documentList] = await Promise.all([
        listInvestigations(backendFilters),
        getInvestigationSummary({
          responsibleEmployeeId: filters.responsibleEmployeeId,
          startDate: filters.startDate,
          endDate: filters.endDate,
        }).catch(() => emptySummary),
        listEmployees(),
        listIncidents(),
        listAcpms({ limit: 100 }).then((response) => response.items).catch(() => []),
        listManagedDocuments().catch(() => []),
      ])

      setInvestigations(investigationList.items ?? [])
      setSummary(summaryData)
      setEmployees(employeeList)
      setIncidents(incidentList)
      setAcpms(acpmList)
      setDocuments(documentList)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar investigaciones")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendFilters])

  async function handleRefresh() {
    await loadData({ silent: true })
    toast.success("Investigaciones actualizadas")
  }

  async function handleSave(form: InvestigationForm) {
    const payload = buildPayload(form)

    if (editingInvestigation) {
      const updated = await updateInvestigation(editingInvestigation.id, payload)
      setInvestigations((current) => updateInvestigationInList(current, updated))
      setEditingInvestigation(null)
      toast.success("Investigación actualizada correctamente")
      return
    }

    const created = await createInvestigation(payload)
    setInvestigations((current) => [created, ...current])
    setSummary((current) => ({ ...current, total: current.total + 1, reported: current.reported + 1 }))
    toast.success("Investigación creada correctamente")
  }

  async function handleToggleStatus(investigation: Investigation) {
    const nextStatus: InvestigationStatus = investigation.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"

    try {
      const updated = await changeInvestigationStatus(investigation.id, { status: nextStatus })
      setInvestigations((current) => updateInvestigationInList(current, updated))
      if (detailInvestigation?.id === updated.id) setDetailInvestigation(updated)
      toast.success(nextStatus === "ACTIVE" ? "Investigación activada" : "Investigación inactivada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado")
    }
  }

  async function handleVerify(investigation: Investigation, isEffective: boolean, observation: string) {
    const updated = await verifyInvestigationEfficacy(investigation.id, {
      isEffective,
      observation: observation.trim(),
    })
    setInvestigations((current) => updateInvestigationInList(current, updated))
    setSummary((current) => ({
      ...current,
      reported: Math.max(0, current.reported + (isEffective ? 0 : 1)),
      pendingVerification: Math.max(0, current.pendingVerification - 1),
      closedEffective: current.closedEffective + (isEffective ? 1 : 0),
    }))
    toast.success(isEffective ? "Investigación marcada como eficaz" : "Investigación marcada como no eficaz")
  }

  async function refreshInvestigationDetail(investigationId: string) {
    const [detail, traceability, evidences] = await Promise.all([
      getInvestigation(investigationId),
      getInvestigationTraceability(investigationId).catch(() => []),
      listInvestigationEvidence(investigationId).catch(() => []),
    ])

    const detailWithEvidence = {
      ...detail,
      evidences,
      evidencesCount: evidences.length,
      traceability: detail.traceability?.length ? detail.traceability : traceability,
    }

    setDetailInvestigation(detailWithEvidence)
    setDetailTraceability(traceability)
    setInvestigations((current) => updateInvestigationInList(current, detailWithEvidence))
  }

  async function handleUploadEvidence(
    investigation: Investigation,
    file: File,
    isConfirmed: boolean,
    observation: string,
  ) {
    await uploadInvestigationEvidence(investigation.id, {
      file,
      isConfirmed,
      observation,
    })
    await refreshInvestigationDetail(investigation.id)
    toast.success("Evidencia cargada correctamente")
  }

  async function handleDeleteEvidence(investigation: Investigation, evidence: InvestigationEvidence) {
    try {
      setDeletingEvidenceId(evidence.id)
      await deleteInvestigationEvidence(investigation.id, evidence.id)
      await refreshInvestigationDetail(investigation.id)
      toast.success("Evidencia eliminada correctamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la evidencia")
    } finally {
      setDeletingEvidenceId(null)
    }
  }

  async function handleOpenDetail(investigation: Investigation) {
    try {
      setDetailLoading(true)
      setDetailInvestigation(investigation)
      await refreshInvestigationDetail(investigation.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el detalle")
    } finally {
      setDetailLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingInvestigation(null)
    setDialogOpen(true)
  }

  function openEditDialog(investigation: Investigation) {
    setEditingInvestigation(investigation)
    setDialogOpen(true)
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== "" && value !== "all")
  const computedSummary = summary.total
    ? summary
    : {
        total: investigations.length,
        reported: investigations.filter((item) => item.efficacyStatus === "REPORTADO").length,
        pendingVerification: investigations.filter((item) => item.efficacyStatus === "PENDIENTE_VERIFICACION").length,
        closedEffective: investigations.filter((item) => item.efficacyStatus === "EFICAZ").length,
      }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investigaciones</h1>
          <p className="text-muted-foreground">
            Gestiona investigaciones de novedades laborales, acciones ACPM, verificación de eficacia y trazabilidad.
          </p>
        </div>
        <Button type="button" className="gap-2" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Nueva investigación
        </Button>
      </div>

      <div className="overflow-x-auto px-3 py-1">
        <div className="flex min-w-max items-center justify-center gap-2">
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Investigaciones</span>
            <span className="text-sm font-semibold">{computedSummary.total}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Reportadas</span>
            <span className="text-sm font-semibold text-blue-700">{computedSummary.reported}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Por verificar</span>
            <span className="text-sm font-semibold text-amber-700">{computedSummary.pendingVerification}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Cerradas eficaces</span>
            <span className="text-sm font-semibold text-emerald-700">{computedSummary.closedEffective}</span>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_200px_180px_220px_160px_160px_auto]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                className="pl-9"
                placeholder="Consecutivo, novedad, responsable o referencia"
              />
            </div>
          </Label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Eficacia</span>
            <select
              value={filters.efficacyStatus}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  efficacyStatus: event.target.value as InvestigationEfficacyStatus | "all",
                }))
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todas</option>
              <option value="REPORTADO">Reportado</option>
              <option value="PENDIENTE_VERIFICACION">Pendiente</option>
              <option value="EFICAZ">Eficaz</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Estado</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value as InvestigationStatus | "all" }))
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Responsable</span>
            <select
              value={filters.responsibleEmployeeId}
              onChange={(event) =>
                setFilters((current) => ({ ...current, responsibleEmployeeId: event.target.value }))
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {fullEmployeeName(employee)}
                </option>
              ))}
            </select>
          </label>
          <Label className="grid gap-2">
            Desde
            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
            />
          </Label>
          <Label className="grid gap-2">
            Hasta
            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
            />
          </Label>
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" className="gap-2" onClick={handleRefresh} disabled={refreshing}>
              <RotateCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" onClick={() => setFilters(emptyFilters)}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Lista de investigaciones</h2>
          <p className="text-sm text-muted-foreground">{investigations.length} registros encontrados</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando investigaciones...
            </CardContent>
          </Card>
        ) : investigations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay investigaciones registradas con los filtros actuales.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[1280px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Investigación</th>
                  <th className="px-4 py-3 font-medium">Novedad laboral</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Relación</th>
                  <th className="px-4 py-3 font-medium">Cierre esperado</th>
                  <th className="px-4 py-3 font-medium">Fecha cierre</th>
                  <th className="px-4 py-3 font-medium">Evidencias</th>
                  <th className="px-4 py-3 font-medium">Eficacia</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {investigations.map((investigation) => (
                  <tr key={investigation.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{investigation.consecutive}</p>
                      <p className="text-xs text-muted-foreground">Creada: {formatDate(investigation.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[330px] truncate text-muted-foreground">
                        {incidentLabel(investigation.incident)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fullEmployeeName(investigation.responsibleEmployee)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[260px] truncate font-medium text-foreground">
                        {investigation.acpmReference || investigation.acpm?.name || investigation.documentManagement?.name || "Sin referencia"}
                      </p>
                      <p className="text-xs text-muted-foreground">{acpmSourceLabel(investigation.acpmSource)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(investigation.expectedClosureDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(investigation.closureDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{investigation.evidencesCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={efficacyClassName(investigation.efficacyStatus)}>
                        {efficacyLabel(investigation.efficacyStatus)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusClassName(investigation.status)}>
                        {statusLabel(investigation.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                          <DropdownMenuItem onSelect={() => void handleOpenDetail(investigation)}>
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEditDialog(investigation)}>
                            <Pencil className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setEvidenceInvestigation(investigation)}>
                            <Upload className="h-4 w-4" />
                            Subir evidencia
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => void handleToggleStatus(investigation)}>
                            {investigation.status === "ACTIVE" ? (
                              <ToggleLeft className="h-4 w-4" />
                            ) : (
                              <ToggleRight className="h-4 w-4" />
                            )}
                            {investigation.status === "ACTIVE" ? "Inactivar" : "Activar"}
                          </DropdownMenuItem>
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

      <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Flujo de verificación</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Visualiza el recorrido de una investigación desde su reporte hasta el cierre por eficacia.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-blue-700">Paso 1</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Reportado</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              La investigación está creada y requiere avanzar con acciones, soportes o análisis de causa.
            </p>
          </div>

          <div className="relative rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <History className="h-4 w-4" />
              </div>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-amber-700">Paso 2</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Pendiente de verificación</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              El equipo revisa la eficacia de las acciones registradas antes de confirmar el resultado.
            </p>
          </div>

          <div className="relative rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-emerald-700">Paso 3</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Eficaz</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              La verificación fue aprobada y la investigación queda cerrada con trazabilidad del resultado.
            </p>
          </div>
        </div>
      </section>

      <InvestigationDialog
        open={dialogOpen}
        editing={editingInvestigation}
        employees={employees}
        incidents={incidents}
        acpms={acpms}
        documents={documents}
        onClose={() => {
          setDialogOpen(false)
          setEditingInvestigation(null)
        }}
        onSave={handleSave}
      />
      <VerificationDialog
        investigation={verificationAction?.investigation ?? null}
        isEffective={verificationAction?.isEffective ?? true}
        onClose={() => setVerificationAction(null)}
        onConfirm={handleVerify}
      />
      <EvidenceDialog
        investigation={evidenceInvestigation}
        onClose={() => setEvidenceInvestigation(null)}
        onUpload={handleUploadEvidence}
      />
      <DetailDialog
        investigation={detailInvestigation}
        traceability={detailTraceability}
        loading={detailLoading}
        deletingEvidenceId={deletingEvidenceId}
        onUploadEvidence={setEvidenceInvestigation}
        onDeleteEvidence={handleDeleteEvidence}
        onClose={() => {
          setDetailInvestigation(null)
          setDetailTraceability([])
        }}
      />
    </main>
  )
}
