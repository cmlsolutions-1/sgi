"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  Calendar,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  IdCardIcon,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
  TriangleAlert,
  Upload,
  UserCheck,
} from "lucide-react"
import { toast } from "sonner"

import { EmployeeFormDialog } from "@/components/dashboard/employee-form-dialog"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  activateIncident,
  createIncident,
  deleteIncident,
  deleteIncidentDocument,
  downloadIncidentDocumentFile,
  exportIncidents,
  listIncidentDocuments,
  listIncidents,
  updateIncident,
  uploadIncidentDocument,
} from "@/services/incidentService"
import {
  activateEmployee,
  createEmployee,
  deleteEmployee,
  exportEmployees,
  listEmployees,
  updateEmployee,
} from "@/services/employeeService"
import { cn } from "@/lib/utils"
import type {
  CreateIncidentDto,
  Incident,
  IncidentCaseStatus,
  IncidentDocument,
  IncidentFilters,
  IncidentHazardOrigin,
  IncidentIncapacityOrigin,
  IncidentStatus,
  IncidentType,
  UpdateIncidentDto,
} from "@/types/manager/incident"
import type {
  CreateEmployeeDto,
  Employee,
  EmployeeArlRiskLevel,
  EmployeeContractType,
  EmployeeExportFilters,
  EmployeeGender,
  UpdateEmployeeDto,
} from "@/types/manager/employee"

type EmployeeViewMode = "cards" | "list"
type LaborNewsViewMode = "cards" | "list"

type IncidentDocumentPreviewState = {
  document: IncidentDocument
  url: string
  mimeType: string
}

function formatEmployeeDocument(employee: Employee) {
  const documentType = employee.documentType?.trim()
  const documentNumber = employee.documentNumber?.trim()

  if (documentType && documentNumber) return `${documentType} ${documentNumber}`
  return documentNumber || documentType || "No registrado"
}

const employeeGenderOptions: Array<{ value: EmployeeGender; label: string }> = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMENINO", label: "Femenino" },
]

const employeeArlRiskLevelOptions: Array<{ value: EmployeeArlRiskLevel; label: string }> = [
  { value: "RIESGO_I", label: "Riesgo I" },
  { value: "RIESGO_II", label: "Riesgo II" },
  { value: "RIESGO_III", label: "Riesgo III" },
  { value: "RIESGO_IV", label: "Riesgo IV" },
  { value: "RIESGO_V", label: "Riesgo V" },
]

const employeeContractTypeOptions: Array<{ value: EmployeeContractType; label: string }> = [
  { value: "INDEFINIDO", label: "Indefinido" },
  { value: "FIJO", label: "Fijo" },
  { value: "SERVICIOS", label: "Servicios" },
]

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function formatFormDate(value?: string | null) {
  if (!value) return ""
  return value.slice(0, 10)
}

function calculateInclusiveDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate || startDate > endDate) return 0

  const start = new Date(`${startDate}T00:00:00Z`).getTime()
  const end = new Date(`${endDate}T00:00:00Z`).getTime()
  const dayMs = 24 * 60 * 60 * 1000

  return Math.floor((end - start) / dayMs) + 1
}

function formatFileSize(value?: number | null) {
  if (!value) return "0 KB"
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function getIncidentStatusLabel(status?: string | null) {
  if (status === "ACTIVE") return "Activo"
  if (status === "INACTIVE") return "Inactivo"
  return status ?? "No registrado"
}

function getIncidentTypeLabel(type?: string | null) {
  if (type === "INCIDENTE") return "Incidente"
  if (type === "ACCIDENTE") return "Accidente"
  if (type === "ENFERMEDAD_LABORAL") return "Enfermedad laboral"
  if (type === "INCAPACIDAD_MEDICA") return "Incapacidad medica"
  if (type === "LICENCIA_MATERNIDAD") return "Licencia de maternidad"
  if (type === "LICENCIA_PATERNIDAD") return "Licencia de paternidad"
  if (type === "VACACIONES") return "Vacaciones"
  if (type === "DIAS_NO_REMUNERADO") return "Dias no remunerados"
  if (type === "DIA_REMUNERADO") return "Dia remunerado"
  if (type === "REVISION_POR_LA_DIRECCION") return "Revision por la direccion"
  if (type === "REQUERIMIENTO_DE_AUTORIDAD_ADMINISTRATIVA") return "Requerimiento de autoridad administrativa"
  if (type === "RECOMENDACION_DE_LA_ARL") return "Recomendacion de la ARL"
  return "Tipo no registrado"
}

const incidentTypesWithIncapacityDetails: IncidentType[] = [
  "INCAPACIDAD_MEDICA",
  "LICENCIA_MATERNIDAD",
  "LICENCIA_PATERNIDAD",
  "VACACIONES",
  "DIAS_NO_REMUNERADO",
  "DIA_REMUNERADO",
]

type IncidentIncapacityDetailLabels = {
  title: string
  startLabel: string
  endLabel: string
  daysLabel: string
  dateError: string
  requiredError: string
}

const defaultIncidentIncapacityDetailLabels: IncidentIncapacityDetailLabels = {
  title: "Incapacidad medica",
  startLabel: "Inicio incapacidad",
  endLabel: "Fin incapacidad",
  daysLabel: "Dias incapacidad",
  dateError: "La fecha inicial de incapacidad no puede ser posterior a la fecha final",
  requiredError: "Registra origen, fecha inicial y fecha final de la incapacidad",
}

const incidentIncapacityDetailLabels: Partial<Record<IncidentType, IncidentIncapacityDetailLabels>> = {
  INCAPACIDAD_MEDICA: defaultIncidentIncapacityDetailLabels,
  LICENCIA_MATERNIDAD: {
    title: "Licencia de maternidad",
    startLabel: "Inicio maternidad",
    endLabel: "Fin maternidad",
    daysLabel: "Dias maternidad",
    dateError: "La fecha inicial de maternidad no puede ser posterior a la fecha final",
    requiredError: "Registra origen, fecha inicial y fecha final de la licencia de maternidad",
  },
  LICENCIA_PATERNIDAD: {
    title: "Licencia de paternidad",
    startLabel: "Inicio paternidad",
    endLabel: "Fin paternidad",
    daysLabel: "Dias paternidad",
    dateError: "La fecha inicial de paternidad no puede ser posterior a la fecha final",
    requiredError: "Registra origen, fecha inicial y fecha final de la licencia de paternidad",
  },
  VACACIONES: {
    title: "Vacaciones",
    startLabel: "Inicio vacaciones",
    endLabel: "Fin vacaciones",
    daysLabel: "Dias vacaciones",
    dateError: "La fecha inicial de vacaciones no puede ser posterior a la fecha final",
    requiredError: "Registra origen, fecha inicial y fecha final de las vacaciones",
  },
  DIAS_NO_REMUNERADO: {
    title: "Dias no remunerados",
    startLabel: "Inicio dias no remunerados",
    endLabel: "Fin dias no remunerados",
    daysLabel: "Dias no remunerados",
    dateError: "La fecha inicial de dias no remunerados no puede ser posterior a la fecha final",
    requiredError: "Registra origen, fecha inicial y fecha final de los dias no remunerados",
  },
  DIA_REMUNERADO: {
    title: "Dia remunerado",
    startLabel: "Inicio dia remunerado",
    endLabel: "Fin dia remunerado",
    daysLabel: "Dias remunerados",
    dateError: "La fecha inicial del dia remunerado no puede ser posterior a la fecha final",
    requiredError: "Registra origen, fecha inicial y fecha final del dia remunerado",
  },
}

function hasIncapacityDetails(type?: IncidentType | string | null) {
  return incidentTypesWithIncapacityDetails.includes(type as IncidentType)
}

function getIncidentIncapacityDetailLabels(type?: IncidentType | string | null) {
  return incidentIncapacityDetailLabels[(type as IncidentType) ?? "INCAPACIDAD_MEDICA"] ?? defaultIncidentIncapacityDetailLabels
}

function formatIncidentConsecutive(consecutive?: string | null) {
  if (!consecutive) return "Sin consecutivo"

  const match = consecutive.match(/(\d+)$/)
  if (match) return `Novedad laboral No. ${match[1]}`

  return `Consecutivo ${consecutive}`
}

function getHazardOriginLabel(value?: string | null) {
  if (value === "FISICO") return "Fisico"
  if (value === "QUIMICO") return "Quimico"
  if (value === "BIOLOGICO") return "Biologico"
  if (value === "SEGURIDAD") return "Seguridad"
  if (value === "PUBLICO") return "Publico"
  if (value === "PSICOSOCIAL") return "Psicosocial"
  return "Origen no registrado"
}

function getIncapacityOriginLabel(value?: string | null) {
  if (value === "COMUN") return "Comun"
  if (value === "LABORAL") return "Laboral"
  return "No registrado"
}

function getCaseStatusLabel(value?: string | null) {
  if (value === "ABIERTO") return "Abierto"
  if (value === "EN_INVESTIGACION") return "En investigacion"
  if (value === "CERRADO") return "Cerrado"
  return "No registrado"
}

function hasIncidentDataChanges(current: Incident | undefined, payload: UpdateIncidentDto) {
  if (!current) return true

  const compareIncapacityFields = hasIncapacityDetails(current.type) || hasIncapacityDetails(payload.type)

  return (
    current.employeeId !== payload.employeeId ||
    formatDate(current.date) !== payload.date ||
    (current.workAreaId ?? "") !== payload.workAreaId ||
    (current.jobId ?? "") !== payload.jobId ||
    (current.place ?? "") !== payload.place ||
    (current.description ?? "") !== payload.description ||
    (current.hazardOrigin ?? "FISICO") !== payload.hazardOrigin ||
    (current.type ?? "INCIDENTE") !== payload.type ||
    (current.consequences ?? "") !== payload.consequences ||
    (current.correctiveActions ?? "") !== payload.correctiveActions ||
    (compareIncapacityFields &&
      ((current.incapacityDays ?? 0) !== payload.incapacityDays ||
        (current.incapacityOrigin ?? "COMUN") !== (payload.incapacityOrigin ?? "COMUN") ||
        formatFormDate(current.incapacityStartDate) !== (payload.incapacityStartDate ?? "") ||
        formatFormDate(current.incapacityEndDate) !== (payload.incapacityEndDate ?? ""))) ||
    Boolean(current.isFatal) !== payload.isFatal ||
    (current.caseStatus ?? "ABIERTO") !== payload.caseStatus
  )
}

function sanitizeIncidentPayload(payload: IncidentFormState): CreateIncidentDto {
  const { status: _status, ...incidentPayload } = payload

  if (!hasIncapacityDetails(incidentPayload.type)) {
    return {
      ...incidentPayload,
      incapacityDays: 0,
      incapacityOrigin: undefined,
      incapacityStartDate: undefined,
      incapacityEndDate: undefined,
    }
  }

  return {
    ...incidentPayload,
    incapacityDays: calculateInclusiveDays(incidentPayload.incapacityStartDate, incidentPayload.incapacityEndDate),
    incapacityOrigin: incidentPayload.incapacityOrigin ?? "COMUN",
  }
}

type IncidentFormState = CreateIncidentDto & {
  status: IncidentStatus
}

const emptyIncidentForm: IncidentFormState = {
  employeeId: "",
  date: "",
  workAreaId: "",
  jobId: "",
  place: "",
  description: "",
  hazardOrigin: "FISICO",
  type: "INCIDENTE",
  consequences: "",
  correctiveActions: "",
  incapacityDays: 0,
  incapacityOrigin: undefined,
  incapacityStartDate: undefined,
  incapacityEndDate: undefined,
  isFatal: false,
  caseStatus: "ABIERTO",
  status: "ACTIVE",
}

const incidentHazardOriginOptions: Array<{ value: IncidentHazardOrigin; label: string }> = [
  { value: "FISICO", label: "Fisico" },
  { value: "QUIMICO", label: "Quimico" },
  { value: "BIOLOGICO", label: "Biologico" },
  { value: "SEGURIDAD", label: "Seguridad" },
  { value: "PUBLICO", label: "Publico" },
  { value: "PSICOSOCIAL", label: "Psicosocial" },
]

const incidentTypeOptions: Array<{ value: IncidentType; label: string }> = [
  { value: "INCIDENTE", label: "Incidente" },
  { value: "ACCIDENTE", label: "Accidente" },
  { value: "ENFERMEDAD_LABORAL", label: "Enfermedad laboral" },
  { value: "INCAPACIDAD_MEDICA", label: "Incapacidad medica" },
  { value: "LICENCIA_MATERNIDAD", label: "Licencia de maternidad" },
  { value: "LICENCIA_PATERNIDAD", label: "Licencia de paternidad" },
  { value: "VACACIONES", label: "Vacaciones" },
  { value: "DIAS_NO_REMUNERADO", label: "Dias no remunerados" },
  { value: "DIA_REMUNERADO", label: "Dia remunerado" },
  { value: "REVISION_POR_LA_DIRECCION", label: "Revision por la direccion" },
  { value: "REQUERIMIENTO_DE_AUTORIDAD_ADMINISTRATIVA", label: "Requerimiento de autoridad administrativa" },
  { value: "RECOMENDACION_DE_LA_ARL", label: "Recomendacion de la ARL" },
]

const incidentIncapacityOriginOptions: Array<{ value: IncidentIncapacityOrigin; label: string }> = [
  { value: "COMUN", label: "Comun" },
  { value: "LABORAL", label: "Laboral" },
]

const incidentCaseStatusOptions: Array<{ value: IncidentCaseStatus; label: string }> = [
  { value: "ABIERTO", label: "Abierto" },
  { value: "EN_INVESTIGACION", label: "En investigacion" },
  { value: "CERRADO", label: "Cerrado" },
]

const incidentFieldControlClassName =
  "w-full border-slate-300 bg-white shadow-sm hover:border-slate-400 focus-visible:border-primary focus-visible:ring-primary/25"

function IncidentDialog({
  incident,
  employees,
  onSave,
  trigger,
}: {
  incident?: Incident
  employees: Employee[]
  onSave: (payload: IncidentFormState, incidentId?: string) => Promise<void>
  trigger?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<IncidentFormState>(emptyIncidentForm)
  const hasPeriodDetails = hasIncapacityDetails(form.type)
  const periodLabels = getIncidentIncapacityDetailLabels(form.type)

  const workAreaOptions = useMemo(() => {
    const unique = new Map<string, string>()

    employees.forEach((employee) => {
      if (employee.workAreaId) unique.set(employee.workAreaId, employee.workArea?.name ?? "Area sin nombre")
    })

    return Array.from(unique, ([id, name]) => ({ id, name }))
  }, [employees])

  const jobOptions = useMemo(() => {
    const unique = new Map<string, string>()

    employees.forEach((employee) => {
      if (employee.jobId) unique.set(employee.jobId, employee.job?.name ?? "Puesto sin nombre")
    })

    return Array.from(unique, ([id, name]) => ({ id, name }))
  }, [employees])

  function handleEmployeeChange(employeeId: string) {
    const selectedEmployee = employees.find((employee) => employee.id === employeeId)

    setForm((current) => ({
      ...current,
      employeeId,
      workAreaId: selectedEmployee?.workAreaId ?? current.workAreaId,
      jobId: selectedEmployee?.jobId ?? current.jobId,
    }))
  }

  function handleIncidentTypeChange(value: IncidentType) {
    const shouldKeepPeriodDetails = hasIncapacityDetails(value)

    setForm((current) => ({
      ...current,
      type: value,
      incapacityDays: shouldKeepPeriodDetails ? current.incapacityDays : 0,
      incapacityOrigin: shouldKeepPeriodDetails ? (current.incapacityOrigin ?? "COMUN") : undefined,
      incapacityStartDate: shouldKeepPeriodDetails ? current.incapacityStartDate : undefined,
      incapacityEndDate: shouldKeepPeriodDetails ? current.incapacityEndDate : undefined,
    }))
  }

  function handleIncapacityStartDateChange(value: string) {
    setForm((current) => ({
      ...current,
      incapacityStartDate: value,
      incapacityDays: calculateInclusiveDays(value, current.incapacityEndDate),
    }))
  }

  function handleIncapacityEndDateChange(value: string) {
    setForm((current) => ({
      ...current,
      incapacityEndDate: value,
      incapacityDays: calculateInclusiveDays(current.incapacityStartDate, value),
    }))
  }

  useEffect(() => {
    if (!open) return

    setForm(
      incident
        ? {
            employeeId: incident.employeeId ?? "",
            date: formatDate(incident.date) === "No registrada" ? "" : formatDate(incident.date),
            workAreaId: incident.workAreaId ?? "",
            jobId: incident.jobId ?? "",
            place: incident.place ?? "",
            description: incident.description ?? "",
            hazardOrigin: incident.hazardOrigin ?? "FISICO",
            type: incident.type ?? "INCIDENTE",
            consequences: incident.consequences ?? "",
            correctiveActions: incident.correctiveActions ?? "",
            incapacityDays: incident.incapacityDays ?? 0,
            incapacityOrigin: incident.incapacityOrigin ?? (hasIncapacityDetails(incident.type) ? "COMUN" : undefined),
            incapacityStartDate: formatFormDate(incident.incapacityStartDate) || undefined,
            incapacityEndDate: formatFormDate(incident.incapacityEndDate) || undefined,
            isFatal: Boolean(incident.isFatal),
            caseStatus: incident.caseStatus ?? "ABIERTO",
            status: incident.status ?? "ACTIVE",
          }
        : emptyIncidentForm,
    )
  }, [incident, open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.employeeId || !form.date || !form.workAreaId || !form.jobId || !form.place || !form.description || !form.type) {
      toast.error("Completa funcionario, fecha, area, puesto, lugar, descripcion y tipo de novedad")
      return
    }

    if (
      hasPeriodDetails &&
      form.incapacityStartDate &&
      form.incapacityEndDate &&
      form.incapacityStartDate > form.incapacityEndDate
    ) {
      toast.error(periodLabels.dateError)
      return
    }

    if (hasPeriodDetails && (!form.incapacityOrigin || !form.incapacityStartDate || !form.incapacityEndDate)) {
      toast.error(periodLabels.requiredError)
      return
    }

    setSaving(true)
    try {
      await onSave(form, incident?.id)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={incident ? "action" : "default"} size="sm" className="gap-2">
            {incident ? <Edit className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
            {incident ? "Editar" : "Nueva novedad"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden bg-card p-0">
        <form className="flex max-h-[90vh] flex-col" onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>{incident ? "Editar novedad laboral" : "Nueva novedad laboral"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 overflow-y-auto px-6 py-4">
            <section className="grid gap-4">
              <h3 className="text-sm font-semibold text-foreground">Datos principales</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Funcionario</Label>
                <Select value={form.employeeId} onValueChange={handleEmployeeChange}>
                  <SelectTrigger className={incidentFieldControlClassName}>
                    <SelectValue placeholder="Selecciona un funcionario" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {`${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || employee.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="incident-date">Fecha</Label>
                <Input
                  id="incident-date"
                  className={incidentFieldControlClassName}
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Area de trabajo</Label>
                <Select value={form.workAreaId} onValueChange={(value) => setForm((current) => ({ ...current, workAreaId: value }))}>
                  <SelectTrigger className={incidentFieldControlClassName}>
                    <SelectValue placeholder="Selecciona un area" />
                  </SelectTrigger>
                  <SelectContent>
                    {workAreaOptions.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Puesto de trabajo</Label>
                <Select value={form.jobId} onValueChange={(value) => setForm((current) => ({ ...current, jobId: value }))}>
                  <SelectTrigger className={incidentFieldControlClassName}>
                    <SelectValue placeholder="Selecciona un puesto" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobOptions.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            </section>

            <section className="grid gap-4">
              <h3 className="text-sm font-semibold text-foreground">Clasificacion del caso</h3>
            <div className="grid gap-2">
              <Label htmlFor="incident-place">Lugar</Label>
              <Input
                id="incident-place"
                className={incidentFieldControlClassName}
                value={form.place}
                onChange={(event) => setForm((current) => ({ ...current, place: event.target.value }))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Tipo de novedad</Label>
              <Select
                value={form.type}
                onValueChange={(value) => handleIncidentTypeChange(value as IncidentType)}
              >
                <SelectTrigger className={incidentFieldControlClassName}>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Origen del peligro</Label>
                <Select
                  value={form.hazardOrigin}
                  onValueChange={(value) => setForm((current) => ({ ...current, hazardOrigin: value as IncidentHazardOrigin }))}
                >
                  <SelectTrigger className={incidentFieldControlClassName}>
                    <SelectValue placeholder="Selecciona el origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentHazardOriginOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Estado del caso</Label>
                <Select
                  value={form.caseStatus}
                  onValueChange={(value) => setForm((current) => ({ ...current, caseStatus: value as IncidentCaseStatus }))}
                >
                  <SelectTrigger className={incidentFieldControlClassName}>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentCaseStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            </section>

            <section className="grid gap-4">
              <h3 className="text-sm font-semibold text-foreground">Detalle y seguimiento</h3>
            <div className="grid gap-2">
              <Label htmlFor="incident-description">Descripcion</Label>
              <Textarea
                id="incident-description"
                className={incidentFieldControlClassName}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="incident-consequences">Consecuencias</Label>
                <Textarea
                  id="incident-consequences"
                  className={incidentFieldControlClassName}
                  value={form.consequences}
                  onChange={(event) => setForm((current) => ({ ...current, consequences: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="incident-actions">Acciones correctivas</Label>
                <Textarea
                  id="incident-actions"
                  className={incidentFieldControlClassName}
                  value={form.correctiveActions}
                  onChange={(event) => setForm((current) => ({ ...current, correctiveActions: event.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-md border border-slate-300 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label htmlFor="incident-is-fatal">El caso fue fatal?</Label>
                <p className="text-sm text-muted-foreground">Selecciona si la novedad termino en fallecimiento.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{form.isFatal ? "Si" : "No"}</span>
                <Switch
                  id="incident-is-fatal"
                  checked={form.isFatal}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, isFatal: checked }))}
                />
              </div>
            </div>
            </section>

            {hasPeriodDetails && (
              <section className="grid gap-4">
                <h3 className="text-sm font-semibold text-foreground">{periodLabels.title}</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="grid gap-2">
                    <Label>Origen incapacidad</Label>
                    <Select
                      value={form.incapacityOrigin ?? "COMUN"}
                      onValueChange={(value) =>
                        setForm((current) => ({ ...current, incapacityOrigin: value as IncidentIncapacityOrigin }))
                      }
                    >
                      <SelectTrigger className={incidentFieldControlClassName}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {incidentIncapacityOriginOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="incident-incapacity-start">{periodLabels.startLabel}</Label>
                    <Input
                      id="incident-incapacity-start"
                      className={incidentFieldControlClassName}
                      type="date"
                      value={form.incapacityStartDate ?? ""}
                      max={form.incapacityEndDate || undefined}
                      onChange={(event) => handleIncapacityStartDateChange(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="incident-incapacity-end">{periodLabels.endLabel}</Label>
                    <Input
                      id="incident-incapacity-end"
                      className={incidentFieldControlClassName}
                      type="date"
                      value={form.incapacityEndDate ?? ""}
                      min={form.incapacityStartDate || undefined}
                      onChange={(event) => handleIncapacityEndDateChange(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="incident-incapacity-days">{periodLabels.daysLabel}</Label>
                    <Input
                      id="incident-incapacity-days"
                      className={incidentFieldControlClassName}
                      type="number"
                      min="0"
                      value={form.incapacityDays}
                      readOnly
                    />
                  </div>
                </div>
              </section>
            )}

            {incident && (
              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm((current) => ({ ...current, status: value as IncidentStatus }))}
                >
                  <SelectTrigger className={incidentFieldControlClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function IncidentDocuments({ incidentId, compact = false }: { incidentId: string; compact?: boolean }) {
  const [documents, setDocuments] = useState<IncidentDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(true)
  const [preview, setPreview] = useState<IncidentDocumentPreviewState | null>(null)
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null)

  async function loadDocuments() {
    setLoading(true)
    try {
      const data = await listIncidentDocuments(incidentId)
      setDocuments(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los documentos de la novedad laboral")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId])

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url)
    }
  }, [preview?.url])

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault()

    if (!file) {
      toast.error("Selecciona un archivo para subir")
      return
    }

    setUploading(true)
    try {
      await uploadIncidentDocument(incidentId, {
        file,
        type: "OTHER",
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

  async function handleView(document: IncidentDocument) {
    if (!document.downloadUrl) return

    setPreviewLoadingId(document.id)
    try {
      const blob = await downloadIncidentDocumentFile(document.downloadUrl)
      const url = URL.createObjectURL(blob)
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return {
          document,
          url,
          mimeType: blob.type || document.mimeType || "",
        }
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento")
    } finally {
      setPreviewLoadingId(null)
    }
  }

  function closePreview() {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url)
      return null
    })
  }

  function canEmbedPreview(mimeType: string) {
    return mimeType.startsWith("application/pdf") || mimeType.startsWith("image/")
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteIncidentDocument(incidentId, documentId)
      setDocuments((current) => current.filter((document) => document.id !== documentId))
      toast.success("Documento eliminado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el documento")
    }
  }

  return (
    <>
      <div className={cn("rounded-md border border-slate-300 bg-white p-3 shadow-xs", !compact && "mt-4")}>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4" />
          Documentos
        </div>

        <form onSubmit={handleUpload} className="grid gap-3">
          <div className="grid gap-2">
            <Label>Archivo</Label>
            <div className="flex min-h-10 flex-col gap-2 rounded-md border border-slate-300 bg-white px-2 py-2 shadow-xs sm:flex-row sm:items-center">
              <label
                className={cn(
                  "relative inline-flex h-8 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto",
                  uploading && "pointer-events-none opacity-50",
                )}
              >
                <Input
                  id={`incident-document-file-${incidentId}`}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  disabled={uploading}
                  aria-label="Seleccionar archivo"
                />
                <Upload className="h-3.5 w-3.5" />
                Seleccionar archivo
              </label>
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {file?.name ?? "Ningun archivo seleccionado"}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex h-10 items-center gap-2 text-sm">
              <Checkbox
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(checked === true)}
                disabled={uploading}
              />
              Confirmado
            </label>
            <Button type="submit" size="sm" className="w-full gap-2 sm:w-auto" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Subir
            </Button>
          </div>
        </form>

        <div className="mt-3 space-y-2">
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <p className="rounded-md border border-slate-300 bg-white p-3 text-sm text-muted-foreground shadow-xs">
              Sin documentos cargados.
            </p>
          ) : (
            documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{document.originalName || "Documento"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(document.size)} · {document.isConfirmed ? "Confirmado" : "Pendiente"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {document.downloadUrl && (
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => handleView(document)}>
                      {previewLoadingId === document.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {previewLoadingId === document.id ? "Cargando" : "Ver"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="gap-2"
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

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col bg-card p-0">
          <DialogHeader className="border-b border-border px-4 py-3">
            <DialogTitle className="truncate text-base">
              {preview?.document.originalName || preview?.document.type || "Documento"}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 p-4">
            {preview && canEmbedPreview(preview.mimeType) ? (
              preview.mimeType.startsWith("image/") ? (
                <div className="flex max-h-[70dvh] items-center justify-center overflow-auto rounded-md bg-secondary/40 p-2">
                  <img
                    src={preview.url}
                    alt={preview.document.originalName || "Documento"}
                    className="max-h-[68dvh] max-w-full rounded-md object-contain"
                  />
                </div>
              ) : (
                <iframe
                  title={preview.document.originalName || "Documento"}
                  src={preview.url}
                  className="h-[70dvh] w-full rounded-md border border-border bg-white"
                />
              )
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-secondary/30 p-6 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Vista previa no disponible</p>
                  <p className="text-sm text-muted-foreground">
                    Este tipo de archivo se puede abrir desde una pestana nueva.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border px-4 py-3">
            {preview && (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-4 w-4" />
                Abrir en pestana
              </Button>
            )}
            <Button type="button" onClick={closePreview}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function LaborNewsManager({ employees }: { employees: Employee[] }) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [viewMode, setViewMode] = useState<LaborNewsViewMode>("cards")
  const [documentsIncident, setDocumentsIncident] = useState<Incident | null>(null)
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [activeFilters, setActiveFilters] = useState<IncidentFilters>({})

  async function loadData(filters = activeFilters) {
    setLoading(true)
    try {
      const data = await listIncidents(filters)
      setIncidents(data)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudieron cargar las novedades laborales")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function getSelectedFilters(): IncidentFilters {
    return {
      employeeId: employeeFilter === "all" ? undefined : employeeFilter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }
  }

  function validateDateRange() {
    if (startDate && endDate && startDate > endDate) {
      toast.error("La fecha inicial no puede ser posterior a la fecha final")
      return false
    }

    return true
  }

  async function handleApplyFilters() {
    if (!validateDateRange()) return

    const filters = getSelectedFilters()
    setActiveFilters(filters)
    await loadData(filters)
  }

  async function handleClearFilters() {
    setEmployeeFilter("all")
    setStartDate("")
    setEndDate("")
    setActiveFilters({})
    await loadData({})
  }

  async function handleExport() {
    setExporting(true)
    try {
      const { blob, filename } = await exportIncidents(activeFilters)
      const url = URL.createObjectURL(blob)
      const anchor = window.document.createElement("a")
      anchor.href = url
      anchor.download = filename
      window.document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success("Archivo CSV descargado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el archivo CSV")
    } finally {
      setExporting(false)
    }
  }

  async function handleSaveIncident(payload: IncidentFormState, incidentId?: string) {
    try {
      const { status } = payload
      const incidentPayload = sanitizeIncidentPayload(payload)

      if (incidentId) {
        const currentIncident = incidents.find((incident) => incident.id === incidentId)
        const hasStatusChange = status !== currentIncident?.status
        const hasDataChanges = hasIncidentDataChanges(currentIncident, incidentPayload)

        if (hasStatusChange) {
          if (status === "ACTIVE") {
            await activateIncident(incidentId)
          } else {
            await deleteIncident(incidentId)
          }
        } else if (hasDataChanges) {
          await updateIncident(incidentId, incidentPayload)
        }

        toast.success("Novedad laboral actualizada")
      } else {
        await createIncident(incidentPayload)
        toast.success("Novedad laboral creada")
      }
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar la novedad laboral")
      throw error
    }
  }

  async function handleDeleteIncident(incident: Incident) {
    if (!window.confirm("Eliminar esta novedad laboral?")) return

    try {
      await deleteIncident(incident.id)
      toast.success("Novedad laboral eliminada")
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar la novedad laboral")
    }
  }

  async function handleActivateIncident(incident: Incident) {
    try {
      await activateIncident(incident.id)
      toast.success("Novedad laboral activada")
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo activar la novedad laboral")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novedades Laborales</h1>
          <p className="text-sm text-muted-foreground">Registra y consulta novedades laborales asociadas a funcionarios.</p>
        </div>
        <IncidentDialog employees={employees} onSave={handleSaveIncident} />
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_180px_auto_auto_auto] xl:items-end">
            <div className="grid gap-1">
              <Label>Funcionario</Label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className={incidentFieldControlClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los funcionarios</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {`${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || employee.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="labor-start-date">Fecha inicial</Label>
              <Input
                id="labor-start-date"
                className={incidentFieldControlClassName}
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="labor-end-date">Fecha final</Label>
              <Input
                id="labor-end-date"
                className={incidentFieldControlClassName}
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
            <Button type="button" onClick={handleApplyFilters} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
              Filtrar
            </Button>
            <Button type="button" variant="outline" onClick={handleClearFilters} disabled={loading}>
              Limpiar
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Lista de novedades laborales</h2>
          <p className="text-sm text-muted-foreground">{incidents.length} novedades encontradas</p>
        </div>
        <div className="flex w-fit rounded-md border border-border bg-secondary p-1">
          <Button
            type="button"
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            className="h-8 gap-2"
            onClick={() => setViewMode("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
            Tarjetas
          </Button>
          <Button
            type="button"
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className="h-8 gap-2"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
            Lista
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : incidents.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No hay novedades laborales registradas.
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <Card key={incident.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">
                        {incident.employee
                          ? `${incident.employee.name ?? ""} ${incident.employee.lastName ?? ""}`.trim()
                          : incident.employeeId}
                      </h3>
                      <Badge variant="outline">{formatIncidentConsecutive(incident.consecutive)}</Badge>
                      <Badge variant="secondary">{getIncidentTypeLabel(incident.type)}</Badge>
                      <Badge variant={incident.status === "ACTIVE" ? "accentActivd" : "destructive"}>
                        {getIncidentStatusLabel(incident.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Lugar: {incident.place}</p>
                    <p className="mt-2 text-sm">{incident.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <IncidentDialog incident={incident} employees={employees} onSave={handleSaveIncident} />
                    {incident.status === "ACTIVE" ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleDeleteIncident(incident)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleActivateIncident(incident)}>
                        Activar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Fecha: {formatDate(incident.date)}</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Area</p>
                    <p>{incident.workArea?.name ?? "No registrada"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Puesto</p>
                    <p>{incident.job?.name ?? "No registrado"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Origen del peligro</p>
                    <p>{getHazardOriginLabel(incident.hazardOrigin)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado del caso</p>
                    <p>{getCaseStatusLabel(incident.caseStatus)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fatal</p>
                    <p>{incident.isFatal ? "Si" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {hasIncapacityDetails(incident.type) ? getIncidentIncapacityDetailLabels(incident.type).title : "Periodo"}
                    </p>
                    <p>
                      {hasIncapacityDetails(incident.type)
                        ? `${incident.incapacityDays ?? 0} dias - ${getIncapacityOriginLabel(incident.incapacityOrigin)}`
                        : "No aplica"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {hasIncapacityDetails(incident.type) ? getIncidentIncapacityDetailLabels(incident.type).startLabel : "Inicio"}
                    </p>
                    <p>{hasIncapacityDetails(incident.type) ? formatDate(incident.incapacityStartDate) : "No aplica"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {hasIncapacityDetails(incident.type) ? getIncidentIncapacityDetailLabels(incident.type).endLabel : "Fin"}
                    </p>
                    <p>{hasIncapacityDetails(incident.type) ? formatDate(incident.incapacityEndDate) : "No aplica"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Consecuencias</p>
                    <p>{incident.consequences || "No registradas"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Acciones correctivas</p>
                    <p>{incident.correctiveActions || "No registradas"}</p>
                  </div>
                </div>

                <IncidentDocuments incidentId={incident.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Funcionario</th>
                <th className="px-4 py-3 font-medium">Novedad</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Area / Puesto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {incidents.map((incident) => (
                <tr key={incident.id} className="align-middle">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {incident.employee
                        ? `${incident.employee.name ?? ""} ${incident.employee.lastName ?? ""}`.trim()
                        : incident.employeeId}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatIncidentConsecutive(incident.consecutive)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{getIncidentTypeLabel(incident.type)}</Badge>
                    <p className="mt-1 max-w-[220px] truncate text-muted-foreground">{incident.place || "Lugar no registrado"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(incident.date)}</td>
                  <td className="px-4 py-3">
                    <p className="max-w-[220px] truncate">{incident.workArea?.name ?? "No registrada"}</p>
                    <p className="max-w-[220px] truncate text-muted-foreground">{incident.job?.name ?? "No registrado"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <Badge variant={incident.status === "ACTIVE" ? "accentActivd" : "destructive"}>
                        {getIncidentStatusLabel(incident.status)}
                      </Badge>
                      <span className="text-muted-foreground">{getCaseStatusLabel(incident.caseStatus)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <IncidentDialog
                          incident={incident}
                          employees={employees}
                          onSave={handleSaveIncident}
                          trigger={
                            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem onSelect={() => setDocumentsIncident(incident)}>
                          <Upload className="h-4 w-4" />
                          Cargar / ver archivos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {incident.status === "ACTIVE" ? (
                          <DropdownMenuItem variant="destructive" onSelect={() => handleDeleteIncident(incident)}>
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => handleActivateIncident(incident)}>
                            <UserCheck className="h-4 w-4" />
                            Activar
                          </DropdownMenuItem>
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

      <Dialog open={Boolean(documentsIncident)} onOpenChange={(open) => !open && setDocumentsIncident(null)}>
        <DialogContent className="max-h-[88vh] w-[calc(100vw-2rem)] max-w-4xl overflow-hidden bg-card p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Documentos de la novedad laboral</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-4">
            {documentsIncident && <IncidentDocuments incidentId={documentsIncident.id} compact />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function EmployeesPage() {
  const [search, setSearch] = useState("")
  const [workAreaFilter, setWorkAreaFilter] = useState<string>("all")
  const [jobFilter, setJobFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<EmployeeViewMode>("cards")
  const [reportGender, setReportGender] = useState<string>("all")
  const [reportArlRiskLevel, setReportArlRiskLevel] = useState<string>("all")
  const [reportMinAge, setReportMinAge] = useState("")
  const [reportMaxAge, setReportMaxAge] = useState("")
  const [reportContractType, setReportContractType] = useState<string>("all")
  const [reportPage, setReportPage] = useState("")
  const [reportLimit, setReportLimit] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [exportingEmployees, setExportingEmployees] = useState(false)

  const workAreas = useMemo(() => {
    const unique = new Map<string, string>()

    employees.forEach((employee) => {
      if (employee.workAreaId) {
        unique.set(employee.workAreaId, employee.workArea?.name ?? "Area sin nombre")
      }
    })

    return Array.from(unique, ([id, name]) => ({ id, name }))
  }, [employees])

  const jobs = useMemo(() => {
    const unique = new Map<string, string>()

    employees.forEach((employee) => {
      if (employee.jobId) {
        unique.set(employee.jobId, employee.job?.name ?? "Puesto sin nombre")
      }
    })

    return Array.from(unique, ([id, name]) => ({ id, name }))
  }, [employees])

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()

    return employees.filter((employee) => {
      const fullName = `${employee.name} ${employee.lastName}`.toLowerCase()
      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        formatEmployeeDocument(employee).toLowerCase().includes(query) ||
        employee.email?.toLowerCase().includes(query) ||
        employee.phone?.toLowerCase().includes(query) ||
        employee.job?.name?.toLowerCase().includes(query) ||
        employee.workArea?.name?.toLowerCase().includes(query)
      const matchesArea = workAreaFilter === "all" || employee.workAreaId === workAreaFilter
      const matchesJob = jobFilter === "all" || employee.jobId === jobFilter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && employee.status) ||
        (statusFilter === "inactive" && !employee.status)

      return matchesSearch && matchesArea && matchesJob && matchesStatus
    })
  }, [employees, jobFilter, search, statusFilter, workAreaFilter])

  const stats = {
    total: employees.length,
    active: employees.filter((employee) => employee.status).length,
    inactive: employees.filter((employee) => !employee.status).length,
    workAreas: workAreas.length,
  }

  function getEmployeeInitials(employee: Employee) {
    return `${employee.name ?? ""} ${employee.lastName ?? ""}`
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  function getEmployeeExportFilters(): EmployeeExportFilters | null {
    const minAge = reportMinAge ? Number(reportMinAge) : undefined
    const maxAge = reportMaxAge ? Number(reportMaxAge) : undefined
    const page = reportPage ? Number(reportPage) : undefined
    const limit = reportLimit ? Number(reportLimit) : undefined

    if (
      (reportMinAge && Number.isNaN(minAge)) ||
      (reportMaxAge && Number.isNaN(maxAge)) ||
      (reportPage && Number.isNaN(page)) ||
      (reportLimit && Number.isNaN(limit))
    ) {
      toast.error("Los valores numericos del reporte no son validos")
      return null
    }

    if ((minAge !== undefined && minAge < 0) || (maxAge !== undefined && maxAge < 0)) {
      toast.error("Las edades no pueden ser negativas")
      return null
    }

    if ((page !== undefined && page < 1) || (limit !== undefined && limit < 1)) {
      toast.error("Pagina y limite deben ser mayores a cero")
      return null
    }

    if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
      toast.error("La edad minima no puede ser mayor que la edad maxima")
      return null
    }

    return {
      search: search.trim() || undefined,
      workAreaId: workAreaFilter === "all" ? undefined : workAreaFilter,
      jobId: jobFilter === "all" ? undefined : jobFilter,
      status: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
      gender: reportGender === "all" ? undefined : (reportGender as EmployeeGender),
      arlRiskLevel: reportArlRiskLevel === "all" ? undefined : (reportArlRiskLevel as EmployeeArlRiskLevel),
      minAge,
      maxAge,
      contractType: reportContractType === "all" ? undefined : (reportContractType as EmployeeContractType),
      page,
      limit,
    }
  }

  function clearEmployeeReportFilters() {
    setSearch("")
    setWorkAreaFilter("all")
    setJobFilter("all")
    setStatusFilter("all")
    setReportGender("all")
    setReportArlRiskLevel("all")
    setReportMinAge("")
    setReportMaxAge("")
    setReportContractType("all")
    setReportPage("")
    setReportLimit("")
  }

  async function handleExportEmployees() {
    const filters = getEmployeeExportFilters()
    if (!filters) return

    setExportingEmployees(true)
    try {
      const { blob, filename } = await exportEmployees(filters)
      const url = URL.createObjectURL(blob)
      const anchor = window.document.createElement("a")
      anchor.href = url
      anchor.download = filename
      window.document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success("Reporte CSV descargado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el reporte")
    } finally {
      setExportingEmployees(false)
    }
  }

  async function loadEmployees() {
    setLoading(true)
    try {
      const data = await listEmployees()
      setEmployees(data)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudieron cargar los funcionarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  async function handleCreateEmployee(payload: CreateEmployeeDto | UpdateEmployeeDto) {
    try {
      await createEmployee(payload as CreateEmployeeDto)
      toast.success("Funcionario creado")
      await loadEmployees()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo crear el funcionario")
      throw error
    }
  }

  async function handleUpdateEmployee(employee: Employee, payload: CreateEmployeeDto | UpdateEmployeeDto) {
    try {
      await updateEmployee(employee.id, payload as UpdateEmployeeDto)
      toast.success("Funcionario actualizado")
      await loadEmployees()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo actualizar el funcionario")
      throw error
    }
  }

  async function handleDeleteEmployee(employee: Employee) {
    if (!window.confirm(`Eliminar el funcionario "${employee.name} ${employee.lastName}"?`)) return

    try {
      await deleteEmployee(employee.id)
      toast.success("Funcionario eliminado")
      await loadEmployees()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar el funcionario")
    }
  }

  async function handleActivateEmployee(employee: Employee) {
    try {
      await activateEmployee(employee.id)
      toast.success("Funcionario activado")
      await loadEmployees()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo activar el funcionario")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funcionarios</h1>
          <p className="text-muted-foreground">Gestion del talento humano</p>
        </div>

        <div className="flex gap-2">
          <EmployeeFormDialog onSave={handleCreateEmployee} />
        </div>
      </div>

      <div className="space-y-6">
          <div className="overflow-x-auto px-3 py-1">
            <div className="flex min-w-max items-center justify-center gap-2">
              <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-sm font-semibold">{stats.total}</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Activos</span>
                <span className="text-sm font-semibold text-green-600">{stats.active}</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Inactivos</span>
                <span className="text-sm font-semibold">{stats.inactive}</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Áreas vinculadas</span>
                <span className="text-sm font-semibold text-primary">{stats.workAreas}</span>
              </div>
            </div>
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="px-4 pb-2 pt-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, correo, area o puesto..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={workAreaFilter} onValueChange={setWorkAreaFilter}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las areas</SelectItem>
                      {workAreas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={jobFilter} onValueChange={setJobFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Puesto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los puestos</SelectItem>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Download className="h-5 w-5" />
                Generar reporte de empleados
              </CardTitle>
              <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={clearEmployeeReportFilters}
                >
                  Limpiar
                </Button>
                <Button
                  type="button"
                  className="w-full gap-2 sm:w-auto"
                  onClick={handleExportEmployees}
                  disabled={exportingEmployees}
                >
                  {exportingEmployees ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
                <div className="space-y-2">
                  <Label>Genero</Label>
                  <Select value={reportGender} onValueChange={setReportGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Genero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {employeeGenderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nivel ARL</Label>
                  <Select value={reportArlRiskLevel} onValueChange={setReportArlRiskLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nivel ARL" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {employeeArlRiskLevelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-report-min-age">Edad minima</Label>
                  <Input
                    id="employee-report-min-age"
                    type="number"
                    min="0"
                    value={reportMinAge}
                    onChange={(event) => setReportMinAge(event.target.value)}
                    placeholder="Min."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-report-max-age">Edad maxima</Label>
                  <Input
                    id="employee-report-max-age"
                    type="number"
                    min="0"
                    value={reportMaxAge}
                    onChange={(event) => setReportMaxAge(event.target.value)}
                    placeholder="Max."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo contrato</Label>
                  <Select value={reportContractType} onValueChange={setReportContractType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {employeeContractTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-report-page">Pagina</Label>
                  <Input
                    id="employee-report-page"
                    type="number"
                    min="1"
                    value={reportPage}
                    onChange={(event) => setReportPage(event.target.value)}
                    placeholder="Pag."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-report-limit">Limite</Label>
                  <Input
                    id="employee-report-limit"
                    type="number"
                    min="1"
                    value={reportLimit}
                    onChange={(event) => setReportLimit(event.target.value)}
                    placeholder="Cant."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Lista de empleados</h2>
              <p className="text-sm text-muted-foreground">{filteredEmployees.length} funcionarios encontrados</p>
            </div>
            <div className="flex w-fit rounded-md border border-border bg-secondary p-1">
              <Button
                type="button"
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                className="h-8 gap-2"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-4 w-4" />
                Tarjetas
              </Button>
              <Button
                type="button"
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="h-8 gap-2"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
                Lista
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {getEmployeeInitials(employee)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-medium">
                              {employee.name} {employee.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">{employee.job?.name ?? "Sin puesto"}</p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              employee.status ? "bg-accentActivd text-accentActivd-foreground" : "bg-destructive text-white",
                            )}
                          >
                            {employee.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Documento</span>
                        <span className="truncate text-right">{formatEmployeeDocument(employee)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Area</span>
                        <span className="truncate text-right">{employee.workArea?.name ?? "Sin area"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Correo</span>
                        <span className="truncate text-right">{employee.email || "No registrado"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Telefono</span>
                        <span>{employee.phone || "No registrado"}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                      <Link href={`/dashboard/employees/${employee.id}`} className="flex-1">
                        <Button variant="action" className="w-full gap-2">
                          <Eye className="h-4 w-4" />
                          Ver Hoja de Vida
                        </Button>
                      </Link>
                      <EmployeeFormDialog
                        employee={employee}
                        onSave={(payload) => handleUpdateEmployee(employee, payload)}
                        trigger={
                          <Button variant="action" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                      {employee.status ? (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteEmployee(employee)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleActivateEmployee(employee)}>
                          Activar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredEmployees.length === 0 && (
                <Card className="bg-card border-border md:col-span-2 lg:col-span-3">
                  <CardContent className="p-10 text-center text-sm text-muted-foreground">
                    No hay funcionarios para mostrar.
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {filteredEmployees.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">No hay funcionarios para mostrar.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredEmployees.map((employee) => (
                      <div key={employee.id} className="grid gap-4 p-4 md:grid-cols-[minmax(220px,1.4fr)_1fr_1fr_auto] md:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-sm text-primary">
                              {getEmployeeInitials(employee)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {employee.name} {employee.lastName}
                            </p>
                            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                              <IdCardIcon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{formatEmployeeDocument(employee)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="min-w-0 text-sm">
                          <p className="truncate font-medium">{employee.job?.name ?? "Sin puesto"}</p>
                          <p className="truncate text-muted-foreground">{employee.workArea?.name ?? "Sin area"}</p>
                        </div>
                        <div className="min-w-0 space-y-1 text-sm">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              employee.status ? "bg-accentActivd text-accentActivd-foreground" : "bg-destructive text-white",
                            )}
                          >
                            {employee.status ? "Activo" : "Inactivo"}
                          </Badge>
                          <p className="truncate text-muted-foreground">{employee.email || "No registrado"}</p>
                          <p className="truncate text-muted-foreground">{employee.phone || "Sin telefono"}</p>
                        </div>
                        <div className="flex items-center gap-2 md:justify-end">
                          <Link href={`/dashboard/employees/${employee.id}`}>
                            <Button variant="action" size="sm" className="gap-2">
                              <Eye className="h-4 w-4" />
                              Ver
                            </Button>
                          </Link>
                          <EmployeeFormDialog
                            employee={employee}
                            onSave={(payload) => handleUpdateEmployee(employee, payload)}
                            trigger={
                              <Button variant="action" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                          />
                          {employee.status ? (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteEmployee(employee)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleActivateEmployee(employee)}>
                              Activar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
      </div>

    </div>
  )
}
