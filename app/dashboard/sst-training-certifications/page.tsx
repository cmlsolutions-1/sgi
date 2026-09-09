"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Download,
  Edit,
  Eye,
  FileText,
  GraduationCap,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
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
import { Textarea } from "@/components/ui/textarea"
import { getSgiResponsible } from "@/services/employeeService"

type ViewMode = "cards" | "list"
type CompetenceType =
  | "COURSE_50_HOURS"
  | "COURSE_20_HOURS"
  | "SST_LICENSE"
  | "SST_DIPLOMA"
  | "SST_SPECIALIZATION"
  | "OTHER"

type CertificationStatus = "VALID" | "EXPIRED"

type ResponsibleSummary = {
  id: string
  name: string
  job: string
  email: string
}

type CertificationEvidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
}

type CertificationRecord = {
  id: string
  responsible: ResponsibleSummary
  competenceType: CompetenceType
  customCompetenceType?: string
  approvalDate: string
  certifyingEntity: string
  certificateNumber?: string
  expirationDate: string
  evidences: CertificationEvidence[]
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
  fileName: string
  description: string
}

const fallbackResponsible: ResponsibleSummary = {
  id: "mock-responsible",
  name: "Responsable SG-SST",
  job: "Coordinador SG-SST",
  email: "responsable@empresa.com",
}

const competenceOptions: Array<{ value: CompetenceType; label: string }> = [
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
  fileName: "",
  description: "",
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function competenceLabel(record: Pick<CertificationRecord, "competenceType" | "customCompetenceType">) {
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
  const today = new Date(new Date().toISOString().slice(0, 10))
  const expirationDate = new Date(`${formatDate(record.expirationDate)}T00:00:00`)
  return expirationDate < today ? "EXPIRED" : "VALID"
}

function statusLabel(status: CertificationStatus) {
  return status === "VALID" ? "Vigente" : "Vencido"
}

function statusClassName(status: CertificationStatus) {
  return status === "VALID"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-destructive text-white border-transparent"
}

function buildInitialRecords(responsible: ResponsibleSummary): CertificationRecord[] {
  return [
    {
      id: "cert-1",
      responsible,
      competenceType: "COURSE_50_HOURS",
      approvalDate: "2026-01-15",
      certifyingEntity: "ARL Sura",
      certificateNumber: "SST-50H-2026-014",
      expirationDate: "2029-01-15",
      evidences: [
        {
          id: "ev-cert-1",
          fileName: "curso-50-horas-sst.pdf",
          description: "Certificado del curso virtual de 50 horas SST.",
          uploadedAt: "2026-01-16T09:30:00",
        },
      ],
    },
    {
      id: "cert-2",
      responsible,
      competenceType: "SST_LICENSE",
      approvalDate: "2024-08-20",
      certifyingEntity: "Secretaria de Salud",
      certificateNumber: "LIC-SST-78521",
      expirationDate: "2026-08-20",
      evidences: [],
    },
  ]
}

function CertificationDialog({
  open,
  record,
  responsible,
  onClose,
  onSave,
}: {
  open: boolean
  record: CertificationRecord | null
  responsible: ResponsibleSummary
  onClose: () => void
  onSave: (form: CertificationForm, recordId?: string) => void
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

  function submit(event: FormEvent<HTMLFormElement>) {
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

    onSave(form, record?.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Editar formación o certificación" : "Nueva formación o certificación"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registra la competencia del responsable SG-SST y sus datos de aprobación, vencimiento y soporte.
          </p>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Responsable SG-SST</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <InfoBlock label="Responsable" value={responsible.name} />
                <InfoBlock label="Cargo" value={responsible.job} />
                <InfoBlock label="Correo" value={responsible.email} />
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos de la competencia</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Tipo de competencia</span>
                  <select
                    value={form.competenceType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        competenceType: event.target.value as CompetenceType,
                        customCompetenceType: event.target.value === "OTHER" ? current.customCompetenceType : "",
                      }))
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {competenceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {form.competenceType === "OTHER" && (
                  <Label className="grid gap-2">
                    Otro tipo de competencia
                    <Input
                      value={form.customCompetenceType}
                      onChange={(event) => setForm((current) => ({ ...current, customCompetenceType: event.target.value }))}
                      placeholder="Escribe la competencia"
                    />
                  </Label>
                )}

                <Label className="grid gap-2">
                  Fecha de aprobacion
                  <Input
                    type="date"
                    value={form.approvalDate}
                    onChange={(event) => setForm((current) => ({ ...current, approvalDate: event.target.value }))}
                  />
                </Label>

                <Label className="grid gap-2">
                  Fecha de vencimiento
                  <Input
                    type="date"
                    min={form.approvalDate || undefined}
                    value={form.expirationDate}
                    onChange={(event) => setForm((current) => ({ ...current, expirationDate: event.target.value }))}
                  />
                </Label>

                <Label className="grid gap-2">
                  Entidad certificadora
                  <Input
                    value={form.certifyingEntity}
                    onChange={(event) => setForm((current) => ({ ...current, certifyingEntity: event.target.value }))}
                    placeholder="Ej. ARL, universidad, entidad certificadora"
                  />
                </Label>

                <Label className="grid gap-2">
                  Numero del certificado
                  <Input
                    value={form.certificateNumber}
                    onChange={(event) => setForm((current) => ({ ...current, certificateNumber: event.target.value }))}
                    placeholder="Opcional"
                  />
                </Label>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Guardar cambios" : "Crear registro"}</Button>
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
  onSave: (record: CertificationRecord, form: EvidenceForm) => void
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)

  useEffect(() => {
    if (record) setForm(emptyEvidenceForm)
  }, [record])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.fileName.trim()) return toast.error("Selecciona o registra el archivo")

    onSave(record, form)
    onClose()
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
                onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.files?.[0]?.name ?? "" }))}
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
  onClose,
  onDownloadEvidence,
}: {
  record: CertificationRecord | null
  onClose: () => void
  onDownloadEvidence: (record: CertificationRecord, evidence: CertificationEvidence) => void
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
            <InfoBlock label="Competencia" value={competenceLabel(record)} />
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
                      <p className="font-medium text-foreground">{evidence.fileName}</p>
                      <p className="text-sm text-muted-foreground">{evidence.description || "Sin descripcion."}</p>
                      <p className="text-xs text-muted-foreground">Cargado: {formatDateTime(evidence.uploadedAt)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => onDownloadEvidence(record, evidence)}>
                      <Download className="h-4 w-4" />
                      Descargar
                    </Button>
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "blue" | "green" | "red" }) {
  const toneClass =
    tone === "blue"
      ? "text-blue-700"
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

export default function SstTrainingCertificationsPage() {
  const [responsible, setResponsible] = useState<ResponsibleSummary>(fallbackResponsible)
  const [loadingResponsible, setLoadingResponsible] = useState(true)
  const [records, setRecords] = useState<CertificationRecord[]>(() => buildInitialRecords(fallbackResponsible))
  const [search, setSearch] = useState("")
  const [competenceFilter, setCompetenceFilter] = useState<CompetenceType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<CertificationStatus | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CertificationRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<CertificationRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<CertificationRecord | null>(null)

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
        setRecords((current) =>
          current.map((record) => ({
            ...record,
            responsible: nextResponsible,
          })),
        )
      } catch {
        if (!mounted) return
        setResponsible(fallbackResponsible)
      } finally {
        if (mounted) setLoadingResponsible(false)
      }
    }

    loadResponsible()
    return () => {
      mounted = false
    }
  }, [])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
      const status = getStatus(record)
      const matchesSearch =
        !query ||
        record.responsible.name.toLowerCase().includes(query) ||
        competenceLabel(record).toLowerCase().includes(query) ||
        record.certifyingEntity.toLowerCase().includes(query) ||
        (record.certificateNumber ?? "").toLowerCase().includes(query)
      const matchesCompetence = competenceFilter === "all" || record.competenceType === competenceFilter
      const matchesStatus = statusFilter === "all" || status === statusFilter

      return matchesSearch && matchesCompetence && matchesStatus
    })
  }, [competenceFilter, records, search, statusFilter])

  const stats = useMemo(() => {
    return {
      total: records.length,
      valid: records.filter((record) => getStatus(record) === "VALID").length,
      expired: records.filter((record) => getStatus(record) === "EXPIRED").length,
      withEvidence: records.filter((record) => record.evidences.length > 0).length,
    }
  }, [records])

  function saveRecord(form: CertificationForm, recordId?: string) {
    const payload = {
      responsible,
      competenceType: form.competenceType,
      customCompetenceType: form.competenceType === "OTHER" ? form.customCompetenceType.trim() : undefined,
      approvalDate: form.approvalDate,
      certifyingEntity: form.certifyingEntity.trim(),
      certificateNumber: form.certificateNumber.trim() || undefined,
      expirationDate: form.expirationDate,
    }

    if (recordId) {
      setRecords((current) =>
        current.map((record) =>
          record.id === recordId
            ? {
                ...record,
                ...payload,
              }
            : record,
        ),
      )
      toast.success("Certificacion actualizada")
      return
    }

    setRecords((current) => [
      {
        id: createId("certification"),
        ...payload,
        evidences: [],
      },
      ...current,
    ])
    toast.success("Certificacion creada")
  }

  function saveEvidence(record: CertificationRecord, form: EvidenceForm) {
    const evidence: CertificationEvidence = {
      id: createId("certification-evidence"),
      fileName: form.fileName.trim(),
      description: form.description.trim(),
      uploadedAt: new Date().toISOString(),
    }

    setRecords((current) =>
      current.map((item) =>
        item.id === record.id
          ? {
              ...item,
              evidences: [evidence, ...item.evidences],
            }
          : item,
      ),
    )
    setDetailRecord((current) =>
      current?.id === record.id
        ? {
            ...current,
            evidences: [evidence, ...current.evidences],
          }
        : current,
    )
    toast.success("Evidencia cargada")
  }

  function downloadEvidence(record: CertificationRecord, evidence: CertificationEvidence) {
    const blob = new Blob(
      [
        `Formacion y certificaciones SG-SST\nResponsable: ${record.responsible.name}\nCompetencia: ${competenceLabel(
          record,
        )}\nEvidencia: ${evidence.fileName}\nDescripcion: ${evidence.description || "Sin descripcion"}\nCargado: ${formatDateTime(
          evidence.uploadedAt,
        )}\n`,
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
          <h1 className="text-2xl font-bold text-foreground">Formación y Certificaciones</h1>
          <p className="text-muted-foreground">
            Controla competencias, vigencias y evidencias del responsable SG-SST.
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
          Nueva certificación
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="rounded-md bg-secondary p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                {loadingResponsible ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserRound className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{responsible.name}</p>
                <p className="text-xs text-muted-foreground">{responsible.job} · {responsible.email}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center overflow-x-auto px-1 py-1">
            <div className="flex w-fit min-w-max items-center gap-2">
              <Metric label="Registros" value={stats.total} />
              <Metric label="Vigentes" value={stats.valid} tone="green" />
              <Metric label="Vencidos" value={stats.expired} tone="red" />
              <Metric label="Con evidencia" value={stats.withEvidence} tone="blue" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_270px_170px]">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Responsable, competencia, entidad o certificado"
              />
            </div>
          </Label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Tipo de competencia</span>
            <select
              value={competenceFilter}
              onChange={(event) => setCompetenceFilter(event.target.value as CompetenceType | "all")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="VALID">Vigente</option>
              <option value="EXPIRED">Vencido</option>
            </select>
          </label>
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
                          <h3 className="font-semibold text-foreground">{competenceLabel(record)}</h3>
                          <Badge variant="outline" className={statusClassName(status)}>
                            {statusLabel(status)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{record.certifyingEntity}</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDetailRecord(record)}>
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
                        {record.evidences.length} evidencias
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
                  const lastEvidence = record.evidences[0]

                  return (
                    <tr key={record.id} className="align-middle">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{record.responsible.name}</p>
                        <p className="text-muted-foreground">{record.responsible.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[250px] truncate text-muted-foreground">{competenceLabel(record)}</p>
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
                      <td className="px-4 py-3 text-muted-foreground">{record.evidences.length}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onSelect={() => setDetailRecord(record)}>
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
                            {lastEvidence && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => downloadEvidence(record, lastEvidence)}>
                                  <Download className="h-4 w-4" />
                                  Descargar última evidencia
                                </DropdownMenuItem>
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

      <CertificationDialog
        open={dialogOpen}
        record={editingRecord}
        responsible={responsible}
        onClose={() => {
          setDialogOpen(false)
          setEditingRecord(null)
        }}
        onSave={saveRecord}
      />
      <EvidenceDialog record={evidenceRecord} onClose={() => setEvidenceRecord(null)} onSave={saveEvidence} />
      <DetailDialog record={detailRecord} onClose={() => setDetailRecord(null)} onDownloadEvidence={downloadEvidence} />
    </main>
  )
}
