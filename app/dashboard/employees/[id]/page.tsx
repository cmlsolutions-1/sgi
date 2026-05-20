"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import {
  Activity,
  Award,
  ArrowLeft,
  Brain,
  BriefcaseBusiness,
  Building,
  Calendar,
  ClipboardCheck,
  Download,
  Edit,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Stethoscope,
  Trash2,
  Upload,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  createEmployeeCertification,
  createEmployeeContract,
  createEmployeeEducation,
  createEmployeeEvaluation,
  createEmployeeMedicalEvaluation,
  deleteEmployeeCertification,
  deleteEmployeeContract,
  deleteEmployeeDocument,
  deleteEmployeeEducation,
  deleteEmployeeEvaluation,
  deleteEmployeeMedicalEvaluation,
  downloadEmployeeDocumentFile,
  getEmployeeById,
  listEmployeeCertifications,
  listEmployeeContracts,
  listEmployeeDocuments,
  listEmployeeEducation,
  listEmployeeEvaluations,
  listEmployeeMedicalEvaluations,
  listEmployees,
  listArlCatalog,
  listCompensationCatalog,
  listEpsCatalog,
  listPensionCatalog,
  updateEmployeeCertification,
  updateEmployeeContract,
  updateEmployeeEducation,
  updateEmployeeEvaluation,
  updateEmployeeMedicalEvaluation,
  updateEmployeeSocialSecurity,
  uploadEmployeeDocument,
} from "@/services/employeeService"
import { listEmployeeTrainings } from "@/services/trainingService"
import { cn } from "@/lib/utils"
import type {
  CreateEmployeeCertificationDto,
  CreateEmployeeContractDto,
  CreateEmployeeEducationDto,
  CreateEmployeeEvaluationDto,
  CreateEmployeeMedicalEvaluationDto,
  Employee,
  EmployeeCatalogOption,
  EmployeeCertification,
  EmployeeContract,
  EmployeeDocument,
  EmployeeDocumentContext,
  EmployeeEducation,
  EmployeeEvaluation,
  EmployeeMedicalEvaluation,
  UpdateEmployeeCertificationDto,
  UpdateEmployeeContractDto,
  UpdateEmployeeEducationDto,
  UpdateEmployeeEvaluationDto,
  UpdateEmployeeMedicalEvaluationDto,
  UpdateEmployeeSocialSecurityDto,
} from "@/types/manager/employee"
import type { EmployeeTraining, TrainingAttendanceStatus } from "@/types/manager/training"
import { Textarea } from "@/components/ui/textarea"

type SocialSecurityItem = {
  key: "eps" | "arl" | "pension" | "compensation"
  label: string
  description: string
  entityId?: string | null
  entityName?: string | null
  startDate?: string | null
  endDate?: string | null
  status?: boolean | null
  catalog: EmployeeCatalogOption[]
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number") return "No registrado"

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

function getAttendanceStatusLabel(value?: string | null) {
  if (value === "ASSIGNED") return "Asignado"
  if (value === "ATTENDED") return "Asistio"
  if (value === "ABSENT") return "Ausente"
  return value ?? "No registrado"
}

function formatFileSize(value?: number | null) {
  if (!value) return "0 KB"
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function getDocumentContextKey(context: EmployeeDocumentContext) {
  if (context.kind === "education") return `education:${context.educationId}`
  if (context.kind === "certification") return `certification:${context.certificationId}`
  if (context.kind === "contract") return `contract:${context.contractId}`
  if (context.kind === "evaluation") return `evaluation:${context.evaluationId}`
  if (context.kind === "medicalEvaluation") return `medicalEvaluation:${context.medicalEvaluationId}`
  return "employee"
}

function getSocialSecurityDocumentType(key: SocialSecurityItem["key"]) {
  if (key === "eps") return "EPS"
  if (key === "arl") return "ARL"
  if (key === "pension") return "PENSION"
  return "COMPENSATION"
}

function getInitials(employee: Employee) {
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getEntityName(entity: Employee["eps"]) {
  if (!entity) return null
  return typeof entity.name === "string" ? entity.name : null
}

function buildSocialSecurityPayload(
  key: SocialSecurityItem["key"],
  form: { entityId: string; startDate: string; endDate: string; status: boolean },
): UpdateEmployeeSocialSecurityDto {
  if (key === "eps") {
    return {
      epsId: form.entityId,
      startDateEps: form.startDate,
      endDateEps: form.endDate,
      statusEps: form.status,
    }
  }

  if (key === "arl") {
    return {
      arlId: form.entityId,
      startDateArl: form.startDate,
      endDateArl: form.endDate,
      statusArl: form.status,
    }
  }

  if (key === "pension") {
    return {
      pensionId: form.entityId,
      startDatePension: form.startDate,
      endDatePension: form.endDate,
      statusPension: form.status,
    }
  }

  return {
    compensationId: form.entityId,
    startDateCompensation: form.startDate,
    endDateCompensation: form.endDate,
    statusCompensation: form.status,
  }
}

function SocialSecurityDialog({
  item,
  onSave,
}: {
  item: SocialSecurityItem
  onSave: (item: SocialSecurityItem, payload: UpdateEmployeeSocialSecurityDto) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    entityId: item.entityId ?? "",
    startDate: formatDate(item.startDate) === "No registrada" ? "" : formatDate(item.startDate),
    endDate: formatDate(item.endDate) === "No registrada" ? "" : formatDate(item.endDate),
    status: item.status ?? true,
  })

  useEffect(() => {
    if (!open) return

    setForm({
      entityId: item.entityId ?? "",
      startDate: formatDate(item.startDate) === "No registrada" ? "" : formatDate(item.startDate),
      endDate: formatDate(item.endDate) === "No registrada" ? "" : formatDate(item.endDate),
      status: item.status ?? true,
    })
  }, [item, open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.entityId) {
      toast.error(`Selecciona una entidad para ${item.label}`)
      return
    }

    if (!form.startDate) {
      toast.error("Selecciona la fecha de inicio")
      return
    }

    setSaving(true)
    try {
      await onSave(item, buildSocialSecurityPayload(item.key, form))
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={item.entityId ? "outline" : "default"} size="sm" className="gap-2">
          {item.entityId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {item.entityId ? "Editar" : "Agregar"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{item.entityId ? `Editar ${item.label}` : `Agregar ${item.label}`}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Entidad</Label>
              <Select value={form.entityId} onValueChange={(value) => setForm((current) => ({ ...current, entityId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una entidad" />
                </SelectTrigger>
                <SelectContent>
                  {item.catalog.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${item.key}-start`}>Fecha inicio</Label>
                <Input
                  id={`${item.key}-start`}
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${item.key}-end`}>Fecha fin</Label>
                <Input
                  id={`${item.key}-end`}
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Estado del aporte</Label>
              <Select
                value={String(form.status)}
                onValueChange={(value) => setForm((current) => ({ ...current, status: value === "true" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar aporte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DocumentManager({
  employeeId,
  context,
  defaultType,
  filterType = false,
}: {
  employeeId: string
  context: EmployeeDocumentContext
  defaultType: string
  filterType?: boolean
}) {
  const contextKey = getDocumentContextKey(context)
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState(defaultType)
  const [isConfirmed, setIsConfirmed] = useState(true)

  async function loadDocuments() {
    setLoading(true)
    try {
      const data = await listEmployeeDocuments(employeeId, context)
      setDocuments(filterType ? data.filter((item) => item.type === defaultType) : data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar los documentos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, contextKey, defaultType, filterType])

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault()

    if (!file) {
      toast.error("Selecciona un archivo para subir")
      return
    }

    if (!type.trim()) {
      toast.error("Ingresa el tipo de documento")
      return
    }

    setUploading(true)
    try {
      await uploadEmployeeDocument(employeeId, context, {
        file,
        type: type.trim(),
        isConfirmed,
      })
      setFile(null)
      await loadDocuments()
      toast.success("Documento subido correctamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el documento")
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteEmployeeDocument(employeeId, context, documentId)
      setDocuments((current) => current.filter((item) => item.id !== documentId))
      toast.success("Documento eliminado correctamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el documento")
    }
  }

  async function handleView(document: EmployeeDocument) {
    if (!document.downloadUrl) return

    try {
      const blob = await downloadEmployeeDocumentFile(document.downloadUrl)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento")
    }
  }

  return (
    <div className="mt-4 rounded-md border border-dashed border-border bg-secondary/20 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            Documentos
          </h4>
          <p className="text-xs text-muted-foreground">
            Primero guarda el registro; luego sube el soporte desde aqui.
          </p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <form onSubmit={handleUpload} className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto_auto] lg:items-end">
        <div className="grid gap-2">
          <Label>Archivo</Label>
          <Input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            disabled={uploading}
          />
        </div>
        <div className="grid gap-2">
          <Label>Tipo</Label>
          <Input value={type} onChange={(event) => setType(event.target.value)} disabled={uploading || filterType} />
        </div>
        <label className="flex h-10 items-center gap-2 text-sm">
          <Checkbox
            checked={isConfirmed}
            onCheckedChange={(checked) => setIsConfirmed(checked === true)}
            disabled={uploading}
          />
          Confirmado
        </label>
        <Button type="submit" size="sm" className="gap-2" disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Subir
        </Button>
      </form>

      <div className="mt-4 space-y-2">
        {documents.length === 0 && !loading ? (
          <p className="rounded-md bg-background/70 px-3 py-2 text-xs text-muted-foreground">Sin documentos cargados.</p>
        ) : (
          documents.map((document) => (
            <div
              key={document.id}
              className="flex flex-col gap-3 rounded-md bg-background/80 px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{document.originalName || document.type}</p>
                <p className="text-xs text-muted-foreground">
                  {document.type} · {formatFileSize(document.size)} · {document.isConfirmed ? "Confirmado" : "Pendiente"}
                </p>
              </div>
              <div className="flex gap-2">
                {document.downloadUrl && (
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => handleView(document)}>
                    <Download className="h-4 w-4" />
                    Ver
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(document.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

type EducationFormState = CreateEmployeeEducationDto

const educationLevelOptions = [
  { value: "BACHILLER", label: "Bachiller" },
  { value: "TECNICO", label: "Tecnico" },
  { value: "TECNOLOGO", label: "Tecnologo" },
  { value: "PROFESIONAL", label: "Profesional" },
  { value: "ESPECIALIZACION", label: "Especializacion" },
  { value: "MAESTRIA", label: "Maestria" },
  { value: "DOCTORADO", label: "Doctorado" },
]

const emptyEducationForm: EducationFormState = {
  level: "",
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  isCompleted: true,
}

function EducationDialog({
  education,
  onSave,
}: {
  education?: EmployeeEducation
  onSave: (payload: CreateEmployeeEducationDto | UpdateEmployeeEducationDto, educationId?: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EducationFormState>(emptyEducationForm)

  useEffect(() => {
    if (!open) return

    setForm(
      education
        ? {
            level: education.level ?? "",
            institution: education.institution ?? "",
            degree: education.degree ?? "",
            fieldOfStudy: education.fieldOfStudy ?? "",
            startDate: formatDate(education.startDate) === "No registrada" ? "" : formatDate(education.startDate),
            endDate: formatDate(education.endDate) === "No registrada" ? "" : formatDate(education.endDate),
            isCompleted: education.isCompleted ?? true,
          }
        : emptyEducationForm,
    )
  }, [education, open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.level || !form.institution || !form.degree || !form.startDate) {
      toast.error("Completa nivel, institucion, titulo y fecha de inicio")
      return
    }

    setSaving(true)
    try {
      await onSave(form, education?.id)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={education ? "outline" : "default"} size="sm" className="gap-2">
          {education ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {education ? "Editar" : "Agregar educacion"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{education ? "Editar educacion" : "Agregar educacion"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Nivel</Label>
                <Select value={form.level} onValueChange={(value) => setForm((current) => ({ ...current, level: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="education-institution">Institucion</Label>
                <Input
                  id="education-institution"
                  value={form.institution}
                  onChange={(event) => setForm((current) => ({ ...current, institution: event.target.value }))}
                  placeholder="Nombre de la institucion"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="education-degree">Titulo</Label>
                <Input
                  id="education-degree"
                  value={form.degree}
                  onChange={(event) => setForm((current) => ({ ...current, degree: event.target.value }))}
                  placeholder="Ej: Ingeniero Industrial"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="education-field">Area de estudio</Label>
                <Input
                  id="education-field"
                  value={form.fieldOfStudy}
                  onChange={(event) => setForm((current) => ({ ...current, fieldOfStudy: event.target.value }))}
                  placeholder="Ej: Seguridad y salud"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="education-start">Fecha inicio</Label>
                <Input
                  id="education-start"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="education-end">Fecha fin</Label>
                <Input
                  id="education-end"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select
                  value={String(form.isCompleted)}
                  onValueChange={(value) => setForm((current) => ({ ...current, isCompleted: value === "true" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Finalizado</SelectItem>
                    <SelectItem value="false">En curso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar educacion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type CertificationFormState = CreateEmployeeCertificationDto

const emptyCertificationForm: CertificationFormState = {
  name: "",
  issuer: "",
  issuedAt: "",
  expiresAt: "",
}

function CertificationDialog({
  certification,
  onSave,
}: {
  certification?: EmployeeCertification
  onSave: (
    payload: CreateEmployeeCertificationDto | UpdateEmployeeCertificationDto,
    certificationId?: string,
  ) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CertificationFormState>(emptyCertificationForm)

  useEffect(() => {
    if (!open) return

    setForm(
      certification
        ? {
            name: certification.name ?? "",
            issuer: certification.issuer ?? "",
            issuedAt: formatDate(certification.issuedAt) === "No registrada" ? "" : formatDate(certification.issuedAt),
            expiresAt: formatDate(certification.expiresAt) === "No registrada" ? "" : formatDate(certification.expiresAt),
          }
        : emptyCertificationForm,
    )
  }, [certification, open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.name || !form.issuer || !form.issuedAt) {
      toast.error("Completa nombre, entidad emisora y fecha de expedicion")
      return
    }

    setSaving(true)
    try {
      await onSave(form, certification?.id)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={certification ? "outline" : "default"} size="sm" className="gap-2">
          {certification ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {certification ? "Editar" : "Agregar certificacion"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{certification ? "Editar certificacion" : "Agregar certificacion"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="certification-name">Nombre</Label>
                <Input
                  id="certification-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ej: Trabajo seguro en alturas"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="certification-issuer">Entidad emisora</Label>
                <Input
                  id="certification-issuer"
                  value={form.issuer}
                  onChange={(event) => setForm((current) => ({ ...current, issuer: event.target.value }))}
                  placeholder="Ej: SENA"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="certification-issued">Fecha expedicion</Label>
                <Input
                  id="certification-issued"
                  type="date"
                  value={form.issuedAt}
                  onChange={(event) => setForm((current) => ({ ...current, issuedAt: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="certification-expires">Fecha vencimiento</Label>
                <Input
                  id="certification-expires"
                  type="date"
                  value={form.expiresAt}
                  onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
                />
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar certificacion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type ContractFormState = Omit<CreateEmployeeContractDto, "salary"> & {
  endDate: string
  salary: string
}

const emptyContractForm: ContractFormState = {
  type: "INDEFINIDO",
  status: "ACTIVE",
  startDate: "",
  endDate: "",
  signedAt: "",
  salary: "",
}

function ContractDialog({
  contract,
  onSave,
}: {
  contract?: EmployeeContract
  onSave: (payload: CreateEmployeeContractDto | UpdateEmployeeContractDto, contractId?: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ContractFormState>(emptyContractForm)

  useEffect(() => {
    if (!open) return

    setForm(
      contract
        ? {
            type: contract.type ?? "INDEFINIDO",
            status: contract.status ?? "ACTIVE",
            startDate: formatDate(contract.startDate) === "No registrada" ? "" : formatDate(contract.startDate),
            endDate: formatDate(contract.endDate) === "No registrada" ? "" : formatDate(contract.endDate),
            signedAt: formatDate(contract.signedAt) === "No registrada" ? "" : formatDate(contract.signedAt),
            salary: String(contract.salary ?? ""),
          }
        : emptyContractForm,
    )
  }, [contract, open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const salary = Number(form.salary)
    const requiresEndDate = form.type !== "INDEFINIDO"

    if (!form.type || !form.status || !form.startDate || !form.signedAt || Number.isNaN(salary)) {
      toast.error("Completa tipo, estado, fechas requeridas y salario")
      return
    }

    if (requiresEndDate && !form.endDate) {
      toast.error("La fecha fin es requerida para contratos que no son indefinidos")
      return
    }

    const payload: CreateEmployeeContractDto = {
      type: form.type,
      status: form.status,
      startDate: form.startDate,
      signedAt: form.signedAt,
      salary,
      ...(form.endDate ? { endDate: form.endDate } : {}),
    }

    setSaving(true)
    try {
      await onSave(payload, contract?.id)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={contract ? "outline" : "default"} size="sm" className="gap-2">
          {contract ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {contract ? "Editar" : "Agregar contrato"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{contract ? "Editar contrato" : "Agregar contrato"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tipo de contrato</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDEFINIDO">Indefinido</SelectItem>
                    <SelectItem value="FIJO">Fijo</SelectItem>
                    <SelectItem value="OBRA_LABOR">Obra o labor</SelectItem>
                    <SelectItem value="PRESTACION_SERVICIOS">Prestacion de servicios</SelectItem>
                    <SelectItem value="APRENDIZAJE">Aprendizaje</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    <SelectItem value="FINISHED">Finalizado</SelectItem>
                    <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="contract-start">Fecha inicio</Label>
                <Input
                  id="contract-start"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contract-end">Fecha fin</Label>
                <Input
                  id="contract-end"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                  required={form.type !== "INDEFINIDO"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contract-signed">Fecha firma</Label>
                <Input
                  id="contract-signed"
                  type="date"
                  value={form.signedAt}
                  onChange={(event) => setForm((current) => ({ ...current, signedAt: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contract-salary">Salario</Label>
              <Input
                id="contract-salary"
                type="number"
                min="0"
                step="1"
                value={form.salary}
                onChange={(event) => setForm((current) => ({ ...current, salary: event.target.value }))}
                placeholder="0"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar contrato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type EvaluationFormState = CreateEmployeeEvaluationDto
type EvaluatorOption = Pick<Employee, "id" | "name" | "lastName" | "email">

const evaluationTypeOptions = [
  { value: "PERFORMANCE", label: "Desempeno" },
  { value: "SKILLS", label: "Habilidades" },
]

function normalizeEvaluationType(value?: string | null) {
  return evaluationTypeOptions.some((option) => option.value === value) ? value! : "PERFORMANCE"
}

function getEvaluationTypeLabel(value?: string | null) {
  return evaluationTypeOptions.find((option) => option.value === value)?.label ?? value ?? "No registrado"
}

const emptyEvaluationForm: EvaluationFormState = {
  evaluatorId: "",
  startDate: "",
  endDate: "",
  score: "",
  comment: "",
  type: "PERFORMANCE",
}

function EvaluationDialog({
  evaluation,
  evaluators,
  onSave,
}: {
  evaluation?: EmployeeEvaluation
  evaluators: EvaluatorOption[]
  onSave: (payload: CreateEmployeeEvaluationDto | UpdateEmployeeEvaluationDto, evaluationId?: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EvaluationFormState>(emptyEvaluationForm)

  useEffect(() => {
    if (!open) return

    setForm(
      evaluation
        ? {
            evaluatorId: evaluation.evaluatorId ?? "",
            startDate: formatDate(evaluation.startDate) === "No registrada" ? "" : formatDate(evaluation.startDate),
            endDate: formatDate(evaluation.endDate) === "No registrada" ? "" : formatDate(evaluation.endDate),
            score: evaluation.score ?? "",
            comment: evaluation.comment ?? "",
            type: normalizeEvaluationType(evaluation.type),
          }
        : emptyEvaluationForm,
    )
  }, [evaluation, open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.evaluatorId || !form.startDate || !form.endDate || !form.score || !form.type) {
      toast.error("Completa evaluador, fechas, puntaje y tipo")
      return
    }

    setSaving(true)
    try {
      await onSave(form, evaluation?.id)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={evaluation ? "outline" : "default"} size="sm" className="gap-2">
          {evaluation ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {evaluation ? "Editar" : "Agregar evaluacion"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{evaluation ? "Editar evaluacion" : "Agregar evaluacion"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Evaluador</Label>
                <Select
                  value={form.evaluatorId}
                  onValueChange={(value) => setForm((current) => ({ ...current, evaluatorId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un evaluador" />
                  </SelectTrigger>
                  <SelectContent>
                    {evaluators.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {`${item.name ?? ""} ${item.lastName ?? ""}`.trim() || item.email || item.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {evaluationTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="evaluation-start">Fecha inicio</Label>
                <Input
                  id="evaluation-start"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="evaluation-end">Fecha fin</Label>
                <Input
                  id="evaluation-end"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="evaluation-score">Puntaje</Label>
                <Input
                  id="evaluation-score"
                  value={form.score}
                  onChange={(event) => setForm((current) => ({ ...current, score: event.target.value }))}
                  placeholder="Ej: 95"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="evaluation-comment">Comentario</Label>
              <Textarea
                id="evaluation-comment"
                value={form.comment}
                onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
                placeholder="Observaciones de la evaluacion"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar evaluacion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type MedicalEvaluationFormState = Omit<CreateEmployeeMedicalEvaluationDto, "nextEvaluationDate"> & {
  nextEvaluationDate: string
}

const emptyMedicalEvaluationForm: MedicalEvaluationFormState = {
  type: "INCOME",
  date: "",
  result: "APT",
  observations: "",
  nextEvaluationDate: "",
  medicalProfessional: "",
  institution: "",
}

function MedicalEvaluationDialog({
  medicalEvaluation,
  onSave,
}: {
  medicalEvaluation?: EmployeeMedicalEvaluation
  onSave: (
    payload: CreateEmployeeMedicalEvaluationDto | UpdateEmployeeMedicalEvaluationDto,
    medicalEvaluationId?: string,
  ) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<MedicalEvaluationFormState>(emptyMedicalEvaluationForm)

  useEffect(() => {
    if (!open) return

    setForm(
      medicalEvaluation
        ? {
            type: medicalEvaluation.type ?? "INCOME",
            date: formatDate(medicalEvaluation.date) === "No registrada" ? "" : formatDate(medicalEvaluation.date),
            result: medicalEvaluation.result ?? "APT",
            observations: medicalEvaluation.observations ?? "",
            nextEvaluationDate:
              formatDate(medicalEvaluation.nextEvaluationDate) === "No registrada"
                ? ""
                : formatDate(medicalEvaluation.nextEvaluationDate),
            medicalProfessional: medicalEvaluation.medicalProfessional ?? "",
            institution: medicalEvaluation.institution ?? "",
          }
        : emptyMedicalEvaluationForm,
    )
  }, [medicalEvaluation, open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.type || !form.date || !form.result || !form.medicalProfessional || !form.institution) {
      toast.error("Completa tipo, fecha, resultado, profesional e institucion")
      return
    }

    const payload: CreateEmployeeMedicalEvaluationDto = {
      type: form.type,
      date: form.date,
      result: form.result,
      observations: form.observations,
      medicalProfessional: form.medicalProfessional,
      institution: form.institution,
      ...(form.nextEvaluationDate ? { nextEvaluationDate: form.nextEvaluationDate } : {}),
    }

    setSaving(true)
    try {
      await onSave(payload, medicalEvaluation?.id)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={medicalEvaluation ? "outline" : "default"} size="sm" className="gap-2">
          {medicalEvaluation ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {medicalEvaluation ? "Editar" : "Agregar evaluacion medica"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{medicalEvaluation ? "Editar evaluacion medica" : "Agregar evaluacion medica"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Ingreso</SelectItem>
                    <SelectItem value="PERIODIC">Periodica</SelectItem>
                    <SelectItem value="RETIREMENT">Retiro</SelectItem>
                    <SelectItem value="POST_INCAPACITY">Post incapacidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Resultado</Label>
                <Select value={form.result} onValueChange={(value) => setForm((current) => ({ ...current, result: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APT">Apto</SelectItem>
                    <SelectItem value="APT_WITH_RESTRICTIONS">Apto con restricciones</SelectItem>
                    <SelectItem value="NOT_APT">No apto</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="medical-evaluation-date">Fecha evaluacion</Label>
                <Input
                  id="medical-evaluation-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="medical-next-date">Proxima evaluacion</Label>
                <Input
                  id="medical-next-date"
                  type="date"
                  value={form.nextEvaluationDate}
                  onChange={(event) => setForm((current) => ({ ...current, nextEvaluationDate: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="medical-professional">Profesional medico</Label>
                <Input
                  id="medical-professional"
                  value={form.medicalProfessional}
                  onChange={(event) => setForm((current) => ({ ...current, medicalProfessional: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="medical-institution">Institucion</Label>
                <Input
                  id="medical-institution"
                  value={form.institution}
                  onChange={(event) => setForm((current) => ({ ...current, institution: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="medical-observations">Observaciones</Label>
              <Textarea
                id="medical-observations"
                value={form.observations}
                onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
                placeholder="Observaciones y restricciones medicas"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar evaluacion medica"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [education, setEducation] = useState<EmployeeEducation[]>([])
  const [certifications, setCertifications] = useState<EmployeeCertification[]>([])
  const [contracts, setContracts] = useState<EmployeeContract[]>([])
  const [evaluations, setEvaluations] = useState<EmployeeEvaluation[]>([])
  const [medicalEvaluations, setMedicalEvaluations] = useState<EmployeeMedicalEvaluation[]>([])
  const [employeeTrainings, setEmployeeTrainings] = useState<EmployeeTraining[]>([])
  const [trainingStatusFilter, setTrainingStatusFilter] = useState<TrainingAttendanceStatus | "all">("all")
  const [evaluatorOptions, setEvaluatorOptions] = useState<EvaluatorOption[]>([])
  const [catalogs, setCatalogs] = useState({
    eps: [] as EmployeeCatalogOption[],
    arl: [] as EmployeeCatalogOption[],
    pension: [] as EmployeeCatalogOption[],
    compensation: [] as EmployeeCatalogOption[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadEmployee() {
      setLoading(true)
      try {
        const [
          data,
          educationData,
          certificationsData,
          contractsData,
          evaluationsData,
          medicalEvaluationsData,
          employeeTrainingsData,
          employeesData,
          eps,
          arl,
          pension,
          compensation,
        ] = await Promise.all([
          getEmployeeById(id),
          listEmployeeEducation(id),
          listEmployeeCertifications(id),
          listEmployeeContracts(id),
          listEmployeeEvaluations(id),
          listEmployeeMedicalEvaluations(id),
          listEmployeeTrainings(id),
          listEmployees(),
          listEpsCatalog(),
          listArlCatalog(),
          listPensionCatalog(),
          listCompensationCatalog(),
        ])
        if (mounted) setEmployee(data)
        if (mounted) setEducation(educationData)
        if (mounted) setCertifications(certificationsData)
        if (mounted) setContracts(contractsData)
        if (mounted) setEvaluations(evaluationsData)
        if (mounted) setMedicalEvaluations(medicalEvaluationsData)
        if (mounted) setEmployeeTrainings(employeeTrainingsData)
        if (mounted) setEvaluatorOptions(employeesData.filter((item) => item.id !== id))
        if (mounted) setCatalogs({ eps, arl, pension, compensation })
      } catch (error: any) {
        toast.error(error.message ?? "No se pudo cargar el funcionario")
        if (mounted) setEmployee(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadEmployee()

    return () => {
      mounted = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/employees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Funcionario no encontrado</h1>
            <p className="text-muted-foreground">No fue posible cargar la hoja de vida solicitada.</p>
          </div>
        </div>
      </div>
    )
  }

  const socialSecurityItems: SocialSecurityItem[] = [
    {
      key: "eps",
      label: "EPS",
      description: "Entidad Promotora de Salud",
      entityId: employee.epsId,
      entityName: getEntityName(employee.eps),
      startDate: employee.startDateEps,
      endDate: employee.endDateEps,
      status: employee.statusEps,
      catalog: catalogs.eps,
    },
    {
      key: "arl",
      label: "ARL",
      description: "Administradora de Riesgos Laborales",
      entityId: employee.arlId,
      entityName: getEntityName(employee.arl),
      startDate: employee.startDateArl,
      endDate: employee.endDateArl,
      status: employee.statusArl,
      catalog: catalogs.arl,
    },
    {
      key: "pension",
      label: "Pension",
      description: "Fondo de Pensiones",
      entityId: employee.pensionId,
      entityName: getEntityName(employee.pension),
      startDate: employee.startDatePension,
      endDate: employee.endDatePension,
      status: employee.statusPension,
      catalog: catalogs.pension,
    },
    {
      key: "compensation",
      label: "Caja de compensacion",
      description: "Caja de compensacion familiar",
      entityId: employee.compensationId,
      entityName: getEntityName(employee.compensation),
      startDate: employee.startDateCompensation,
      endDate: employee.endDateCompensation,
      status: employee.statusCompensation,
      catalog: catalogs.compensation,
    },
  ]

  const filteredEmployeeTrainings =
    trainingStatusFilter === "all"
      ? employeeTrainings
      : employeeTrainings.filter((item) => item.status === trainingStatusFilter)

  async function handleSaveSocialSecurity(item: SocialSecurityItem, payload: UpdateEmployeeSocialSecurityDto) {
    if (!employee) return

    try {
      const updatedEmployee = await updateEmployeeSocialSecurity(employee.id, payload)
      setEmployee(updatedEmployee)
      toast.success(`${item.label} actualizado`)
    } catch (error: any) {
      toast.error(error.message ?? `No se pudo guardar ${item.label}`)
      throw error
    }
  }

  async function handleSaveEducation(
    payload: CreateEmployeeEducationDto | UpdateEmployeeEducationDto,
    educationId?: string,
  ) {
    if (!employee) return

    try {
      if (educationId) {
        await updateEmployeeEducation(employee.id, educationId, payload)
        toast.success("Educacion actualizada")
      } else {
        await createEmployeeEducation(employee.id, payload as CreateEmployeeEducationDto)
        toast.success("Educacion agregada")
      }

      const updatedEducation = await listEmployeeEducation(employee.id)
      setEducation(updatedEducation)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar la educacion")
      throw error
    }
  }

  async function handleDeleteEducation(educationId: string) {
    if (!employee) return
    if (!window.confirm("Eliminar este registro de educacion?")) return

    try {
      await deleteEmployeeEducation(employee.id, educationId)
      const updatedEducation = await listEmployeeEducation(employee.id)
      setEducation(updatedEducation)
      toast.success("Educacion eliminada")
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar la educacion")
    }
  }

  async function handleSaveCertification(
    payload: CreateEmployeeCertificationDto | UpdateEmployeeCertificationDto,
    certificationId?: string,
  ) {
    if (!employee) return

    try {
      if (certificationId) {
        await updateEmployeeCertification(employee.id, certificationId, payload)
        toast.success("Certificacion actualizada")
      } else {
        await createEmployeeCertification(employee.id, payload as CreateEmployeeCertificationDto)
        toast.success("Certificacion agregada")
      }

      const updatedCertifications = await listEmployeeCertifications(employee.id)
      setCertifications(updatedCertifications)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar la certificacion")
      throw error
    }
  }

  async function handleDeleteCertification(certificationId: string) {
    if (!employee) return
    if (!window.confirm("Eliminar esta certificacion?")) return

    try {
      await deleteEmployeeCertification(employee.id, certificationId)
      const updatedCertifications = await listEmployeeCertifications(employee.id)
      setCertifications(updatedCertifications)
      toast.success("Certificacion eliminada")
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar la certificacion")
    }
  }

  async function handleSaveContract(
    payload: CreateEmployeeContractDto | UpdateEmployeeContractDto,
    contractId?: string,
  ) {
    if (!employee) return

    try {
      if (contractId) {
        await updateEmployeeContract(employee.id, contractId, payload)
        toast.success("Contrato actualizado")
      } else {
        await createEmployeeContract(employee.id, payload as CreateEmployeeContractDto)
        toast.success("Contrato agregado")
      }

      const updatedContracts = await listEmployeeContracts(employee.id)
      setContracts(updatedContracts)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar el contrato")
      throw error
    }
  }

  async function handleDeleteContract(contractId: string) {
    if (!employee) return
    if (!window.confirm("Eliminar este contrato?")) return

    try {
      await deleteEmployeeContract(employee.id, contractId)
      const updatedContracts = await listEmployeeContracts(employee.id)
      setContracts(updatedContracts)
      toast.success("Contrato eliminado")
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar el contrato")
    }
  }

  async function handleSaveEvaluation(
    payload: CreateEmployeeEvaluationDto | UpdateEmployeeEvaluationDto,
    evaluationId?: string,
  ) {
    if (!employee) return

    try {
      if (evaluationId) {
        await updateEmployeeEvaluation(employee.id, evaluationId, payload)
        toast.success("Evaluacion actualizada")
      } else {
        await createEmployeeEvaluation(employee.id, payload as CreateEmployeeEvaluationDto)
        toast.success("Evaluacion agregada")
      }

      const updatedEvaluations = await listEmployeeEvaluations(employee.id)
      setEvaluations(updatedEvaluations)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar la evaluacion")
      throw error
    }
  }

  async function handleDeleteEvaluation(evaluationId: string) {
    if (!employee) return
    if (!window.confirm("Eliminar esta evaluacion?")) return

    try {
      await deleteEmployeeEvaluation(employee.id, evaluationId)
      const updatedEvaluations = await listEmployeeEvaluations(employee.id)
      setEvaluations(updatedEvaluations)
      toast.success("Evaluacion eliminada")
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar la evaluacion")
    }
  }

  async function handleSaveMedicalEvaluation(
    payload: CreateEmployeeMedicalEvaluationDto | UpdateEmployeeMedicalEvaluationDto,
    medicalEvaluationId?: string,
  ) {
    if (!employee) return

    try {
      if (medicalEvaluationId) {
        await updateEmployeeMedicalEvaluation(employee.id, medicalEvaluationId, payload)
        toast.success("Evaluacion medica actualizada")
      } else {
        await createEmployeeMedicalEvaluation(employee.id, payload as CreateEmployeeMedicalEvaluationDto)
        toast.success("Evaluacion medica agregada")
      }

      const updatedMedicalEvaluations = await listEmployeeMedicalEvaluations(employee.id)
      setMedicalEvaluations(updatedMedicalEvaluations)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar la evaluacion medica")
      throw error
    }
  }

  async function handleDeleteMedicalEvaluation(medicalEvaluationId: string) {
    if (!employee) return
    if (!window.confirm("Eliminar esta evaluacion medica?")) return

    try {
      await deleteEmployeeMedicalEvaluation(employee.id, medicalEvaluationId)
      const updatedMedicalEvaluations = await listEmployeeMedicalEvaluations(employee.id)
      setMedicalEvaluations(updatedMedicalEvaluations)
      toast.success("Evaluacion medica eliminada")
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar la evaluacion medica")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hoja de Vida</h1>
          <p className="text-muted-foreground">Informacion completa del funcionario</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">{getInitials(employee)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {employee.name} {employee.lastName}
                  </h2>
                  <p className="text-muted-foreground">{employee.job?.name ?? "Sin puesto asignado"}</p>
                  <Badge
                    variant="secondary"
                    className={cn("mt-2", employee.status ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground")}
                  >
                    {employee.status ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:flex">
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{socialSecurityItems.filter((item) => item.entityId).length}</p>
                    <p className="text-xs text-muted-foreground">Seguridad social</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold text-accent">{employee.workAreaId ? 1 : 0}</p>
                    <p className="text-xs text-muted-foreground">Area vinculada</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{employee.email || "No registrado"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone || "No registrado"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{employee.workArea?.name ?? "Sin area"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{employee.job?.name ?? "Sin puesto"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="info">Informacion Personal</TabsTrigger>
          <TabsTrigger value="socialSecurity">Seguridad Social</TabsTrigger>
          <TabsTrigger value="education">Educacion</TabsTrigger>
          <TabsTrigger value="certifications">Certificaciones</TabsTrigger>
          <TabsTrigger value="contracts">Contrato</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluaciones</TabsTrigger>
          <TabsTrigger value="medicalEvaluations">Evaluaciones medicas</TabsTrigger>
          <TabsTrigger value="trainings">Capacitaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <User className="h-5 w-5" />
                Datos Personales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Nombres</p>
                  <p className="text-sm">{employee.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Apellidos</p>
                  <p className="text-sm">{employee.lastName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Fecha de nacimiento</p>
                  <p className="text-sm">{formatDate(employee.birthDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Correo</p>
                  <p className="text-sm">{employee.email || "No registrado"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Telefono</p>
                  <p className="text-sm">{employee.phone || "No registrado"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <p className="text-sm">{employee.status ? "Activo" : "Inactivo"}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs text-muted-foreground">Direccion</p>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.address || "No registrada"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="socialSecurity">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Activity className="h-5 w-5" />
                Aportes Seguridad Social
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {socialSecurityItems.map((item) => {
                  const completed = Boolean(item.entityId)

                  return (
                    <div
                      key={item.key}
                      className={cn(
                        "rounded-lg border p-4",
                        completed ? "border-accent bg-accent/5" : "border-border bg-secondary/30",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{item.label}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Badge variant="secondary" className={completed ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}>
                          {completed ? "Registrado" : "Pendiente"}
                        </Badge>
                      </div>

                      <p className="mt-3 text-sm font-medium">{item.entityName ?? item.entityId ?? "Sin entidad registrada"}</p>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Inicio: {formatDate(item.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Fin: {formatDate(item.endDate)}</span>
                        </div>
                      </div>

                      {completed && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Estado del aporte: {item.status === false ? "Inactivo" : "Activo"}
                        </p>
                      )}

                      <div className="mt-4">
                        <SocialSecurityDialog item={item} onSave={handleSaveSocialSecurity} />
                      </div>
                      {completed && (
                        <DocumentManager
                          employeeId={employee.id}
                          context={{ kind: "employee" }}
                          defaultType={getSocialSecurityDocumentType(item.key)}
                          filterType
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <GraduationCap className="h-5 w-5" />
                  Educacion
                </CardTitle>
                <EducationDialog onSave={handleSaveEducation} />
              </div>
            </CardHeader>
            <CardContent>
              {education.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <GraduationCap className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Sin registros de educacion</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Agrega estudios, certificaciones academicas o formacion profesional del funcionario.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {education.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{item.degree}</h3>
                            <Badge variant={item.isCompleted ? "default" : "secondary"}>
                              {item.isCompleted ? "Finalizado" : "En curso"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.level} - {item.institution}
                          </p>
                          {item.fieldOfStudy && (
                            <p className="mt-1 text-sm text-muted-foreground">Area: {item.fieldOfStudy}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <EducationDialog education={item} onSave={handleSaveEducation} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteEducation(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Inicio: {formatDate(item.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Fin: {formatDate(item.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Creado: {formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                      <DocumentManager
                        employeeId={employee.id}
                        context={{ kind: "education", educationId: item.id }}
                        defaultType="EDUCATION"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Award className="h-5 w-5" />
                  Certificaciones
                </CardTitle>
                <CertificationDialog onSave={handleSaveCertification} />
              </div>
            </CardHeader>
            <CardContent>
              {certifications.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <Award className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Sin certificaciones registradas</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Agrega certificados laborales, tecnicos o profesionales del funcionario.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {certifications.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{item.name}</h3>
                            {item.expiresAt ? (
                              <Badge variant="secondary">Vence: {formatDate(item.expiresAt)}</Badge>
                            ) : (
                              <Badge variant="outline">Sin vencimiento</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">Emitido por: {item.issuer}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <CertificationDialog certification={item} onSave={handleSaveCertification} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteCertification(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Expedicion: {formatDate(item.issuedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Vencimiento: {formatDate(item.expiresAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Creado: {formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                      <DocumentManager
                        employeeId={employee.id}
                        context={{ kind: "certification", certificationId: item.id }}
                        defaultType="CERTIFICATION"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <BriefcaseBusiness className="h-5 w-5" />
                  Contrato
                </CardTitle>
                <ContractDialog onSave={handleSaveContract} />
              </div>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <BriefcaseBusiness className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Sin contratos registrados</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Agrega la informacion contractual del funcionario.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contracts.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{item.type}</h3>
                            <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>
                              {item.status === "ACTIVE" ? "Activo" : item.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">Salario: {formatCurrency(item.salary)}</p>
                          <p className="mt-1 text-sm text-muted-foreground">Firmado: {formatDate(item.signedAt)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ContractDialog contract={item} onSave={handleSaveContract} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteContract(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Inicio: {formatDate(item.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Fin: {formatDate(item.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Creado: {formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                      <DocumentManager
                        employeeId={employee.id}
                        context={{ kind: "contract", contractId: item.id }}
                        defaultType="CONTRACT"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <ClipboardCheck className="h-5 w-5" />
                  Evaluaciones
                </CardTitle>
                <EvaluationDialog evaluators={evaluatorOptions} onSave={handleSaveEvaluation} />
              </div>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <ClipboardCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Sin evaluaciones registradas</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Agrega evaluaciones de desempeno, seguimiento o competencias del funcionario.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluations.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{getEvaluationTypeLabel(item.type)}</h3>
                            <Badge variant="secondary">Puntaje: {item.score}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Evaluador:{" "}
                            {item.evaluator
                              ? `${item.evaluator.name ?? ""} ${item.evaluator.lastName ?? ""}`.trim()
                              : item.evaluatorId}
                          </p>
                          {item.comment && <p className="mt-1 text-sm text-muted-foreground">{item.comment}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <EvaluationDialog
                            evaluation={item}
                            evaluators={
                              item.evaluatorId && !evaluatorOptions.some((option) => option.id === item.evaluatorId) && item.evaluator
                                ? [
                                    {
                                      id: item.evaluatorId,
                                      name: item.evaluator.name,
                                      lastName: item.evaluator.lastName,
                                      email: "",
                                    },
                                    ...evaluatorOptions,
                                  ]
                                : evaluatorOptions
                            }
                            onSave={handleSaveEvaluation}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteEvaluation(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Inicio: {formatDate(item.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Fin: {formatDate(item.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Creado: {formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                      <DocumentManager
                        employeeId={employee.id}
                        context={{ kind: "evaluation", evaluationId: item.id }}
                        defaultType="EVALUATION"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medicalEvaluations">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Stethoscope className="h-5 w-5" />
                  Evaluaciones medicas
                </CardTitle>
                <MedicalEvaluationDialog onSave={handleSaveMedicalEvaluation} />
              </div>
            </CardHeader>
            <CardContent>
              {medicalEvaluations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <Stethoscope className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Sin evaluaciones medicas registradas</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Agrega examenes de ingreso, periodicos, retiro o seguimiento medico ocupacional.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicalEvaluations.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{item.type}</h3>
                            <Badge variant={item.result === "APT" ? "default" : "secondary"}>{item.result}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">Institucion: {item.institution}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Profesional: {item.medicalProfessional}
                          </p>
                          {item.observations && <p className="mt-1 text-sm text-muted-foreground">{item.observations}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <MedicalEvaluationDialog medicalEvaluation={item} onSave={handleSaveMedicalEvaluation} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteMedicalEvaluation(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Fecha: {formatDate(item.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Proxima: {formatDate(item.nextEvaluationDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Creado: {formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                      <DocumentManager
                        employeeId={employee.id}
                        context={{ kind: "medicalEvaluation", medicalEvaluationId: item.id }}
                        defaultType="MEDICAL_EVALUATION"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trainings">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Brain className="h-5 w-5" />
                  Capacitaciones asignadas
                </CardTitle>
                <Select
                  value={trainingStatusFilter}
                  onValueChange={(value) => setTrainingStatusFilter(value as TrainingAttendanceStatus | "all")}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="ASSIGNED">Asignadas</SelectItem>
                    <SelectItem value="ATTENDED">Asistidas</SelectItem>
                    <SelectItem value="ABSENT">Ausentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEmployeeTrainings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <Brain className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Sin capacitaciones registradas</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Aqui se mostraran las capacitaciones asignadas, asistidas o ausentes del funcionario.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEmployeeTrainings.map((item) => (
                    <div key={item.attendanceId} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{item.training.topic?.name ?? item.training.topicId}</h3>
                            <Badge variant={item.status === "ATTENDED" ? "default" : "secondary"}>
                              {getAttendanceStatusLabel(item.status)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Duracion: {item.training.durationHours} horas
                          </p>
                        </div>
                        <Link href={`/dashboard/trainingPlan/${item.training.id}`}>
                          <Button variant="outline" size="sm">
                            Ver capacitacion
                          </Button>
                        </Link>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Fecha: {formatDate(item.training.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Estado capacitacion: {item.training.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Asistencia: {getAttendanceStatusLabel(item.status)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
