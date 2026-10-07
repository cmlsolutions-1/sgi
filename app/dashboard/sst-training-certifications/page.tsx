"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  Award,
  Building2,
  CalendarDays,
  CalendarRange,
  Download,
  Edit,
  Eye,
  ExternalLink,
  FileText,
  GraduationCap,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getSgiResponsible } from "@/services/employeeService"
import {
  createSstTrainingCertification,
  deleteSstTrainingCertification,
  deleteSstTrainingCertificationDocument,
  downloadSstTrainingCertificationDocument,
  getSstTrainingCertificationSummary,
  listSstTrainingCertificationDocuments,
  listSstTrainingCertifications,
  listSstTrainingCompetenceTypes,
  updateSstTrainingCertification,
  uploadSstTrainingCertificationDocument,
} from "@/services/sstTrainingCertificationService"
import type {
  SstTrainingCertification,
  SstTrainingCertificationDocument,
  SstTrainingCertificationStatus,
  SstTrainingCertificationSummary,
  SstTrainingCompetenceOption,
  SstTrainingCompetenceType,
  UpsertSstTrainingCertificationDto,
} from "@/types/manager/sst-training-certification"

type ViewMode = "cards" | "list"
type CompetenceType = SstTrainingCompetenceType
type CertificationStatus = SstTrainingCertificationStatus

type ResponsibleSummary = {
  id: string
  name: string
  job: string
  email: string
}

type CertificationRecord = SstTrainingCertification & {
  responsible: ResponsibleSummary
  evidences: SstTrainingCertificationDocument[]
}

type CertificationForm = {
  competenceType: CompetenceType
  customCompetenceType: string
  approvalDate: string
  certifyingEntity: string
  certificateNumber: string
  expirationDate: string
}

type EvidenceForm = {
  file: File | null
  fileName: string
  description: string
  observation: string
}

type EvidencePreview = {
  document: SstTrainingCertificationDocument
  url: string
  mimeType: string
}

const emptyResponsible: ResponsibleSummary = {
  id: "",
  name: "Responsable no asignado",
  job: "Sin cargo registrado",
  email: "Sin correo registrado",
}

const defaultCompetenceOptions: Array<{ value: CompetenceType; label: string }> = [
  { value: "COURSE_50_HOURS", label: "Curso Virtual 50 Horas SST" },
  { value: "COURSE_20_HOURS", label: "Curso de Actualizacion 20 Horas SST" },
  { value: "SST_LICENSE", label: "Licencia SST" },
  { value: "SST_DIPLOMA", label: "Diplomado SST" },
  { value: "SST_SPECIALIZATION", label: "Especializacion SST" },
  { value: "OTHER", label: "Otro" },
]

const emptyForm: CertificationForm = {
  competenceType: "COURSE_50_HOURS",
  customCompetenceType: "",
  approvalDate: "",
  certifyingEntity: "",
  certificateNumber: "",
  expirationDate: "",
}

const emptyEvidenceForm: EvidenceForm = {
  file: null,
  fileName: "",
  description: "",
  observation: "",
}

const certificationFieldClassName =
  "h-10 border-slate-300 bg-white shadow-sm transition-colors hover:border-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"

function competenceLabel(
  record: Pick<CertificationRecord, "competenceType" | "customCompetenceType">,
  competenceOptions = defaultCompetenceOptions,
) {
  if (record.competenceType === "OTHER") return record.customCompetenceType?.trim() || "Otra competencia"
  return competenceOptions.find((option) => option.value === record.competenceType)?.label ?? record.competenceType
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

function getStatus(record: CertificationRecord): CertificationStatus {
  return record.status
}

function statusLabel(status: CertificationStatus) {
  return status === "VALID" ? "Vigente" : "Vencido"
}

function statusClassName(status: CertificationStatus) {
  return status === "VALID"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-destructive text-white border-transparent"
}

function canPreviewEvidence(mimeType: string) {
  return mimeType.startsWith("image/") || mimeType === "application/pdf"
}

function toCertificationRecord(
  certification: SstTrainingCertification,
  evidences: SstTrainingCertificationDocument[] = [],
): CertificationRecord {
  const employee = certification.responsibleEmployee
  return {
    ...certification,
    responsible: {
      id: employee.id,
      name: `${employee.name} ${employee.lastName}`.trim(),
      job: employee.job?.name ?? "Responsable SG-SST",
      email: employee.email,
    },
    evidences,
  }
}

function CertificationDialog({
  open,
  record,
  responsible,
  competenceOptions,
  onClose,
  onSave,
}: {
  open: boolean
  record: CertificationRecord | null
  responsible: ResponsibleSummary
  competenceOptions: Array<{ value: CompetenceType; label: string }>
  onClose: () => void
  onSave: (form: CertificationForm, recordId?: string) => Promise<void>
}) {
  const [form, setForm] = useState<CertificationForm>(emptyForm)
  const editing = Boolean(record)

  useEffect(() => {
    if (!open) return

    setForm(
      record
        ? {
            competenceType: record.competenceType,
            customCompetenceType: record.customCompetenceType ?? "",
            approvalDate: record.approvalDate,
            certifyingEntity: record.certifyingEntity,
            certificateNumber: record.certificateNumber ?? "",
            expirationDate: record.expirationDate,
          }
        : emptyForm,
    )
  }, [open, record])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.approvalDate) return toast.error("Selecciona la fecha de aprobacion")
    if (!form.certifyingEntity.trim()) return toast.error("Ingresa la entidad certificadora")
    if (!form.expirationDate) return toast.error("Selecciona la fecha de vencimiento")
    if (form.expirationDate < form.approvalDate) {
      return toast.error("La fecha de vencimiento no puede ser anterior a la aprobacion")
    }
    if (form.competenceType === "OTHER" && !form.customCompetenceType.trim()) {
      return toast.error("Escribe el tipo de competencia")
    }

    try {
      await onSave(form, record?.id)
      onClose()
    } catch {
      // El contenedor muestra el error del backend y conserva el formulario abierto.
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-5 py-4 pr-12 sm:px-6">
          <div className="flex items-start gap-3 text-left">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg">
                {editing ? "Editar formación o certificación" : "Nueva formación o certificación"}
              </DialogTitle>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Registra la competencia del responsable SG-SST y controla claramente su periodo de vigencia.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/40 px-4 py-5 sm:px-6">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <UserRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Responsable SG-SST</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    La certificación quedará asociada automáticamente al responsable asignado.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <InfoBlock label="Responsable" value={responsible.name} icon={UserRound} />
                <InfoBlock label="Cargo" value={responsible.job} icon={ShieldCheck} />
                <InfoBlock label="Correo" value={responsible.email} icon={Mail} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Datos de la competencia</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Completa la información que permite identificar y controlar la vigencia del certificado.
                  </p>
                </div>
              </div>

              <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="certification-competence">
                    Tipo de competencia <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.competenceType}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        competenceType: value as CompetenceType,
                        customCompetenceType: value === "OTHER" ? current.customCompetenceType : "",
                      }))
                    }
                  >
                    <SelectTrigger id="certification-competence" className={certificationFieldClassName}>
                      <SelectValue placeholder="Selecciona una competencia" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {competenceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.competenceType === "OTHER" && (
                  <Label className="grid gap-2">
                    <span>
                      Otro tipo de competencia <span className="text-destructive">*</span>
                    </span>
                    <Input
                      value={form.customCompetenceType}
                      onChange={(event) => setForm((current) => ({ ...current, customCompetenceType: event.target.value }))}
                      placeholder="Escribe la competencia"
                      className={certificationFieldClassName}
                    />
                  </Label>
                )}

                <Label className="grid gap-2">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    Fecha de aprobación <span className="text-destructive">*</span>
                  </span>
                  <Input
                    type="date"
                    value={form.approvalDate}
                    onChange={(event) => setForm((current) => ({ ...current, approvalDate: event.target.value }))}
                    className={certificationFieldClassName}
                  />
                </Label>

                <Label className="grid gap-2">
                  <span className="flex items-center gap-2">
                    <CalendarRange className="h-4 w-4 text-muted-foreground" />
                    Fecha de vencimiento <span className="text-destructive">*</span>
                  </span>
                  <Input
                    type="date"
                    min={form.approvalDate || undefined}
                    value={form.expirationDate}
                    onChange={(event) => setForm((current) => ({ ...current, expirationDate: event.target.value }))}
                    className={certificationFieldClassName}
                  />
                </Label>

                <Label className="grid gap-2">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Entidad certificadora <span className="text-destructive">*</span>
                  </span>
                  <Input
                    value={form.certifyingEntity}
                    onChange={(event) => setForm((current) => ({ ...current, certifyingEntity: event.target.value }))}
                    placeholder="Ej. ARL, universidad, entidad certificadora"
                    className={certificationFieldClassName}
                  />
                </Label>

                <Label className="grid gap-2">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Número del certificado <span className="font-normal text-muted-foreground">(opcional)</span>
                  </span>
                  <Input
                    value={form.certificateNumber}
                    onChange={(event) => setForm((current) => ({ ...current, certificateNumber: event.target.value }))}
                    placeholder="Ej. CERT-2026-001"
                    className={certificationFieldClassName}
                  />
                </Label>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              {editing ? "Guardar cambios" : "Crear registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  record,
  onClose,
  onSave,
}: {
  record: CertificationRecord | null
  onClose: () => void
  onSave: (record: CertificationRecord, form: EvidenceForm) => Promise<void>
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)

  useEffect(() => {
    if (record) setForm(emptyEvidenceForm)
  }, [record])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.file) return toast.error("Selecciona el archivo")

    try {
      await onSave(record, form)
      onClose()
    } catch {
      // El contenedor muestra el error del backend y conserva el formulario abierto.
    }
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Cargar evidencia</DialogTitle>
          <p className="text-sm text-muted-foreground">Relaciona el certificado, licencia o soporte documental de la competencia.</p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Seleccionar archivo
              <Input
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setForm((current) => ({ ...current, file, fileName: file?.name ?? "" }))
                }}
              />
            </Label>
            <Label className="grid gap-2">
              Nombre del archivo
              <Input
                value={form.fileName}
                onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.value }))}
                placeholder="certificado-sst.pdf"
              />
            </Label>
          </div>
          <Label className="grid gap-2">
            Descripcion
            <Textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              placeholder="Describe el soporte cargado"
            />
          </Label>
          <Label className="grid gap-2">
            Observacion
            <Textarea
              value={form.observation}
              onChange={(event) => setForm((current) => ({ ...current, observation: event.target.value }))}
              rows={3}
              placeholder="Agrega una observacion sobre la evidencia"
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

function DetailDialog({
  record,
  competenceOptions,
  onClose,
  onPreviewEvidence,
  onDownloadEvidence,
  onDeleteEvidence,
  previewLoadingId,
  deletingEvidenceId,
}: {
  record: CertificationRecord | null
  competenceOptions: Array<{ value: CompetenceType; label: string }>
  onClose: () => void
  onPreviewEvidence: (evidence: SstTrainingCertificationDocument) => void
  onDownloadEvidence: (evidence: SstTrainingCertificationDocument) => void
  onDeleteEvidence: (evidence: SstTrainingCertificationDocument) => void
  previewLoadingId: string | null
  deletingEvidenceId: string | null
}) {
  if (!record) return null

  const status = getStatus(record)

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Detalle de formación y certificación</DialogTitle>
          <p className="text-sm text-muted-foreground">Consulta competencia, vigencia, entidad certificadora y evidencias.</p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoBlock label="Responsable" value={record.responsible.name} />
            <InfoBlock label="Competencia" value={competenceLabel(record, competenceOptions)} />
            <InfoBlock label="Entidad" value={record.certifyingEntity} />
            <div className="rounded-md bg-secondary p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Estado</p>
              <Badge variant="outline" className={`mt-2 ${statusClassName(status)}`}>
                {statusLabel(status)}
              </Badge>
            </div>
          </div>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Datos del certificado</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <InfoBlock label="Fecha aprobación" value={formatDate(record.approvalDate)} />
              <InfoBlock label="Fecha vencimiento" value={formatDate(record.expirationDate)} />
              <InfoBlock label="Número certificado" value={record.certificateNumber || "No registrado"} />
            </div>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4" />
              Evidencias
            </h3>
            {record.evidences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay evidencias cargadas.</p>
            ) : (
              <div className="space-y-3">
                {record.evidences.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="flex flex-col gap-3 rounded-md bg-secondary p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">{evidence.originalName}</p>
                      <p className="text-sm text-muted-foreground">{evidence.description || "Sin descripcion."}</p>
                      {evidence.observation ? (
                        <p className="text-sm text-muted-foreground">Observacion: {evidence.observation}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">Cargado: {formatDateTime(evidence.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={previewLoadingId === evidence.id}
                        onClick={() => onPreviewEvidence(evidence)}
                      >
                        {previewLoadingId === evidence.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        Ver
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => onDownloadEvidence(evidence)}>
                        <Download className="h-4 w-4" />
                        Descargar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        disabled={deletingEvidenceId === evidence.id}
                        onClick={() => onDeleteEvidence(evidence)}
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

function InfoBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof UserRound
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
      {Icon && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-primary shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "blue" | "green" | "red" }) {
  const toneClasses =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "red"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-slate-50 text-slate-800"

  return (
    <div className={`flex min-h-14 items-center gap-3 rounded-lg border px-3.5 py-2 ${toneClasses}`}>
      <span className="text-xl font-bold leading-none">{value}</span>
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </div>
  )
}

export default function SstTrainingCertificationsPage() {
  const [responsible, setResponsible] = useState<ResponsibleSummary>(emptyResponsible)
  const [loadingResponsible, setLoadingResponsible] = useState(true)
  const [records, setRecords] = useState<CertificationRecord[]>([])
  const [summary, setSummary] = useState<SstTrainingCertificationSummary>({
    total: 0,
    valid: 0,
    expired: 0,
    withEvidence: 0,
  })
  const [competenceOptions, setCompetenceOptions] = useState(defaultCompetenceOptions)
  const [search, setSearch] = useState("")
  const [competenceFilter, setCompetenceFilter] = useState<CompetenceType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<CertificationStatus | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CertificationRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<CertificationRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<CertificationRecord | null>(null)
  const [evidencePreview, setEvidencePreview] = useState<EvidencePreview | null>(null)
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null)
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<string | null>(null)

  async function loadData() {
    try {
      const [certificationData, summaryData, competenceData] = await Promise.all([
        listSstTrainingCertifications({ limit: 100 }),
        getSstTrainingCertificationSummary(),
        listSstTrainingCompetenceTypes(),
      ])

      setSummary(summaryData)
      if (competenceData.length > 0) {
        setCompetenceOptions(
          competenceData.map((option: SstTrainingCompetenceOption) => ({
            value: option.code,
            label: option.name,
          })),
        )
      }
      setRecords((current) =>
        certificationData.items.map((certification) =>
          toCertificationRecord(
            certification,
            current.find((record) => record.id === certification.id)?.evidences ?? [],
          ),
        ),
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las formaciones y certificaciones")
    }
  }

  useEffect(() => {
    let mounted = true

    async function loadResponsible() {
      setLoadingResponsible(true)
      try {
        const data = await getSgiResponsible()
        const nextResponsible: ResponsibleSummary = {
          id: data.employee.id,
          name: `${data.employee.name} ${data.employee.lastName}`.trim(),
          job: "Responsable SG-SST",
          email: data.employee.email,
        }

        if (!mounted) return
        setResponsible(nextResponsible)
      } catch {
        if (!mounted) return
        setResponsible(emptyResponsible)
      } finally {
        if (mounted) setLoadingResponsible(false)
      }
    }

    loadResponsible()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    return () => {
      if (evidencePreview?.url) URL.revokeObjectURL(evidencePreview.url)
    }
  }, [evidencePreview])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
      const status = getStatus(record)
      const matchesSearch =
        !query ||
        record.responsible.name.toLowerCase().includes(query) ||
        competenceLabel(record, competenceOptions).toLowerCase().includes(query) ||
        record.certifyingEntity.toLowerCase().includes(query) ||
        (record.certificateNumber ?? "").toLowerCase().includes(query)
      const matchesCompetence = competenceFilter === "all" || record.competenceType === competenceFilter
      const matchesStatus = statusFilter === "all" || status === statusFilter

      return matchesSearch && matchesCompetence && matchesStatus
    })
  }, [competenceFilter, competenceOptions, records, search, statusFilter])

  async function saveRecord(form: CertificationForm, recordId?: string) {
    if (!responsible.id) {
      const message = "Debes asignar un responsable SG-SST antes de crear una certificacion"
      toast.error(message)
      throw new Error(message)
    }

    const payload: UpsertSstTrainingCertificationDto = {
      responsibleEmployeeId: responsible.id,
      competenceType: form.competenceType,
      customCompetenceType: form.competenceType === "OTHER" ? form.customCompetenceType.trim() : undefined,
      approvalDate: form.approvalDate,
      certifyingEntity: form.certifyingEntity.trim(),
      certificateNumber: form.certificateNumber.trim() || undefined,
      expirationDate: form.expirationDate,
    }

    try {
      if (recordId) {
        await updateSstTrainingCertification(recordId, payload)
        toast.success("Certificacion actualizada")
      } else {
        await createSstTrainingCertification(payload)
        toast.success("Certificacion creada")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la certificacion")
      throw error
    }
  }

  async function loadEvidence(record: CertificationRecord) {
    const evidences = await listSstTrainingCertificationDocuments(record.id)
    setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, evidences } : item)))
    setDetailRecord((current) => (current?.id === record.id ? { ...current, evidences } : current))
    return evidences
  }

  async function openDetail(record: CertificationRecord) {
    setDetailRecord(record)
    try {
      await loadEvidence(record)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las evidencias")
    }
  }

  async function saveEvidence(record: CertificationRecord, form: EvidenceForm) {
    if (!form.file) throw new Error("Selecciona el archivo")
    try {
      await uploadSstTrainingCertificationDocument(record.id, {
        file: form.file,
        isConfirmed: true,
        description: form.description,
        observation: form.observation,
      })
      await Promise.all([loadEvidence(record), loadData()])
      toast.success("Evidencia cargada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la evidencia")
      throw error
    }
  }

  async function downloadEvidence(evidence: SstTrainingCertificationDocument) {
    if (!evidence.downloadUrl) return toast.error("La evidencia no tiene un archivo disponible")
    try {
      const blob = await downloadSstTrainingCertificationDocument(evidence.downloadUrl)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = evidence.originalName || "evidencia-certificacion-sst"
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar la evidencia")
    }
  }

  async function previewEvidence(evidence: SstTrainingCertificationDocument) {
    if (!evidence.downloadUrl) return toast.error("La evidencia no tiene un archivo disponible")
    setPreviewLoadingId(evidence.id)
    try {
      const blob = await downloadSstTrainingCertificationDocument(evidence.downloadUrl)
      setEvidencePreview({
        document: evidence,
        url: URL.createObjectURL(blob),
        mimeType: blob.type || evidence.mimeType || "application/octet-stream",
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo previsualizar la evidencia")
    } finally {
      setPreviewLoadingId(null)
    }
  }

  async function removeEvidence(record: CertificationRecord, evidence: SstTrainingCertificationDocument) {
    if (!window.confirm(`¿Eliminar la evidencia ${evidence.originalName}?`)) return
    setDeletingEvidenceId(evidence.id)
    try {
      await deleteSstTrainingCertificationDocument(record.id, evidence.id)
      await Promise.all([loadEvidence(record), loadData()])
      toast.success("Evidencia eliminada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la evidencia")
    } finally {
      setDeletingEvidenceId(null)
    }
  }

  async function removeCertification(record: CertificationRecord) {
    if (!window.confirm(`¿Eliminar ${competenceLabel(record, competenceOptions)}?`)) return
    try {
      await deleteSstTrainingCertification(record.id)
      if (detailRecord?.id === record.id) setDetailRecord(null)
      await loadData()
      toast.success("Certificacion eliminada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la certificacion")
    }
  }

  async function downloadLatestEvidence(record: CertificationRecord) {
    try {
      const evidences = record.evidences.length > 0 ? record.evidences : await loadEvidence(record)
      if (!evidences[0]) return toast.error("La certificacion no tiene evidencias cargadas")
      await downloadEvidence(evidences[0])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la evidencia")
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formación y Certificaciones</h1>
          <p className="text-muted-foreground">
            Controla competencias, vigencias y evidencias del responsable SG-SST.
          </p>
        </div>
        <Button
          type="button"
          className="w-full gap-2 shadow-sm sm:w-auto"
          onClick={() => {
            setEditingRecord(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nueva certificación
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Registros" value={summary.total} />
        <Metric label="Vigentes" value={summary.valid} tone="green" />
        <Metric label="Vencidos" value={summary.expired} tone="red" />
        <Metric label="Con evidencia" value={summary.withEvidence} tone="blue" />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                {loadingResponsible ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserRound className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Responsable SG-SST</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{responsible.name}</p>
                <p className="mt-0.5 break-all text-xs text-muted-foreground">{responsible.job} · {responsible.email}</p>
              </div>
            </div>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-foreground">Buscar y filtrar</h2>
            <p className="text-xs text-muted-foreground">Encuentra rápidamente una certificación por sus datos principales.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_270px_170px]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${certificationFieldClassName} pl-9`}
                placeholder="Responsable, competencia, entidad o certificado"
              />
            </div>
          </Label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Tipo de competencia</span>
            <select
              value={competenceFilter}
              onChange={(event) => setCompetenceFilter(event.target.value as CompetenceType | "all")}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:border-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Todas</option>
              {competenceOptions.map((option) => (
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
              onChange={(event) => setStatusFilter(event.target.value as CertificationStatus | "all")}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:border-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Todos</option>
              <option value="VALID">Vigente</option>
              <option value="EXPIRED">Vencido</option>
            </select>
          </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lista de formación y certificaciones</h2>
            <p className="text-sm text-muted-foreground">{filteredRecords.length} registros encontrados</p>
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

        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay certificaciones que coincidan con los filtros actuales.
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredRecords.map((record) => {
              const status = getStatus(record)

              return (
                <Card key={record.id} className="border-border bg-card">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{competenceLabel(record, competenceOptions)}</h3>
                          <Badge variant="outline" className={statusClassName(status)}>
                            {statusLabel(status)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{record.certifyingEntity}</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void openDetail(record)}>
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                    </div>

                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <UserRound className="h-4 w-4" />
                        {record.responsible.name}
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Vence: {formatDate(record.expirationDate)}
                      </p>
                      <p className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Certificado: {record.certificateNumber || "No registrado"}
                      </p>
                      <p className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        {record.evidenceCount} evidencias
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Responsable SG-SST</th>
                  <th className="px-4 py-3 font-medium">Tipo de competencia</th>
                  <th className="px-4 py-3 font-medium">Aprobación</th>
                  <th className="px-4 py-3 font-medium">Entidad certificadora</th>
                  <th className="px-4 py-3 font-medium">Certificado</th>
                  <th className="px-4 py-3 font-medium">Vencimiento</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Evidencias</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((record) => {
                  const status = getStatus(record)
                  return (
                    <tr key={record.id} className="align-middle">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{record.responsible.name}</p>
                        <p className="text-muted-foreground">{record.responsible.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[250px] truncate text-muted-foreground">{competenceLabel(record, competenceOptions)}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(record.approvalDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{record.certifyingEntity}</td>
                      <td className="px-4 py-3 text-muted-foreground">{record.certificateNumber || "Opcional"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(record.expirationDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusClassName(status)}>
                          {statusLabel(status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{record.evidenceCount}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onSelect={() => void openDetail(record)}>
                              <Eye className="h-4 w-4" />
                              Ver detalle
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
                            <DropdownMenuItem onSelect={() => setEvidenceRecord(record)}>
                              <Upload className="h-4 w-4" />
                              Cargar evidencia
                            </DropdownMenuItem>
                            {record.evidenceCount > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => void downloadLatestEvidence(record)}>
                                  <Download className="h-4 w-4" />
                                  Descargar última evidencia
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => void removeCertification(record)}>
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
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

      <CertificationDialog
        open={dialogOpen}
        record={editingRecord}
        responsible={responsible}
        competenceOptions={competenceOptions}
        onClose={() => {
          setDialogOpen(false)
          setEditingRecord(null)
        }}
        onSave={saveRecord}
      />
      <EvidenceDialog record={evidenceRecord} onClose={() => setEvidenceRecord(null)} onSave={saveEvidence} />
      <DetailDialog
        record={detailRecord}
        competenceOptions={competenceOptions}
        onClose={() => setDetailRecord(null)}
        onPreviewEvidence={(evidence) => void previewEvidence(evidence)}
        onDownloadEvidence={(evidence) => void downloadEvidence(evidence)}
        onDeleteEvidence={(evidence) => {
          if (detailRecord) void removeEvidence(detailRecord, evidence)
        }}
        previewLoadingId={previewLoadingId}
        deletingEvidenceId={deletingEvidenceId}
      />
      <Dialog open={Boolean(evidencePreview)} onOpenChange={(open) => !open && setEvidencePreview(null)}>
        <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
            <DialogTitle>{evidencePreview?.document.originalName ?? "Vista previa de evidencia"}</DialogTitle>
            <p className="text-sm text-muted-foreground">Previsualizacion del soporte de formacion o certificacion SST.</p>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4">
            {evidencePreview?.mimeType.startsWith("image/") ? (
              <img
                src={evidencePreview.url}
                alt={evidencePreview.document.originalName}
                className="mx-auto max-h-[70dvh] max-w-full rounded-md object-contain"
              />
            ) : evidencePreview?.mimeType === "application/pdf" ? (
              <iframe
                src={evidencePreview.url}
                title={evidencePreview.document.originalName}
                className="h-[70dvh] min-h-[28rem] w-full rounded-md border border-border bg-white"
              />
            ) : evidencePreview ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Este tipo de archivo no admite vista previa. Puedes abrirlo o descargarlo.
                </p>
              </div>
            ) : null}
          </div>
          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            {evidencePreview && canPreviewEvidence(evidencePreview.mimeType) ? (
              <Button type="button" variant="outline" className="gap-2" onClick={() => window.open(evidencePreview.url, "_blank", "noopener,noreferrer")}>
                <ExternalLink className="h-4 w-4" />
                Abrir en pestaña
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => evidencePreview && void downloadEvidence(evidencePreview.document)}
            >
              <Download className="h-4 w-4" />
              Descargar
            </Button>
            <Button type="button" onClick={() => setEvidencePreview(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
