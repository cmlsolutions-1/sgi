"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Building2,
  Calendar,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Search,
  Trash2,
  TriangleAlert,
  Upload,
  UserCheck,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { EmployeeFormDialog } from "@/components/dashboard/employee-form-dialog"
import { SgiResponsibleFormDialog } from "@/components/dashboard/SgiResponsibleFormDialog"
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
  createSgiResponsible,
  deleteEmployee,
  exportEmployees,
  getSgiResponsible,
  listEmployees,
  updateSgiResponsible,
  updateEmployee,
} from "@/services/employeeService"
import { cn } from "@/lib/utils"
import type {
  CreateIncidentDto,
  Incident,
  IncidentDocument,
  IncidentFilters,
  IncidentStatus,
  UpdateIncidentDto,
} from "@/types/manager/incident"
import type {
  CreateEmployeeDto,
  Employee,
  EmployeeArlRiskLevel,
  EmployeeContractType,
  EmployeeExportFilters,
  EmployeeGender,
  EmployeeSgiResponsible,
  UpdateEmployeeDto,
  UpsertEmployeeSgiResponsibleDto,
} from "@/types/manager/employee"

type EmployeeViewMode = "cards" | "list"

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

function hasIncidentDataChanges(current: Incident | undefined, payload: UpdateIncidentDto) {
  if (!current) return true

  return (
    current.employeeId !== payload.employeeId ||
    formatDate(current.date) !== payload.date ||
    (current.place ?? "") !== payload.place ||
    (current.description ?? "") !== payload.description ||
    (current.consequences ?? "") !== payload.consequences ||
    (current.correctiveActions ?? "") !== payload.correctiveActions
  )
}

type IncidentFormState = CreateIncidentDto & {
  status: IncidentStatus
}

const emptyIncidentForm: IncidentFormState = {
  employeeId: "",
  date: "",
  place: "",
  description: "",
  consequences: "",
  correctiveActions: "",
  status: "ACTIVE",
}

const incidentFieldControlClassName =
  "w-full border-slate-400 bg-white shadow-sm hover:border-slate-500 focus-visible:border-primary focus-visible:ring-primary/25"

function IncidentDialog({
  incident,
  employees,
  onSave,
}: {
  incident?: Incident
  employees: Employee[]
  onSave: (payload: IncidentFormState, incidentId?: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<IncidentFormState>(emptyIncidentForm)

  useEffect(() => {
    if (!open) return

    setForm(
      incident
        ? {
            employeeId: incident.employeeId ?? "",
            date: formatDate(incident.date) === "No registrada" ? "" : formatDate(incident.date),
            place: incident.place ?? "",
            description: incident.description ?? "",
            consequences: incident.consequences ?? "",
            correctiveActions: incident.correctiveActions ?? "",
            status: incident.status ?? "ACTIVE",
          }
        : emptyIncidentForm,
    )
  }, [incident, open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.employeeId || !form.date || !form.place || !form.description) {
      toast.error("Completa funcionario, fecha, lugar y descripcion")
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
        <Button variant={incident ? "outline" : "default"} size="sm" className="gap-2">
          {incident ? <Edit className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
          {incident ? "Editar" : "Nueva novedad"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{incident ? "Editar novedad laboral" : "Nueva novedad laboral"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Funcionario</Label>
                <Select value={form.employeeId} onValueChange={(value) => setForm((current) => ({ ...current, employeeId: value }))}>
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

          <DialogFooter>
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

function IncidentDocuments({ incidentId }: { incidentId: string }) {
  const [documents, setDocuments] = useState<IncidentDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState("OTHER")
  const [isConfirmed, setIsConfirmed] = useState(true)

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
      await uploadIncidentDocument(incidentId, {
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

  async function handleView(document: IncidentDocument) {
    if (!document.downloadUrl) return

    try {
      const blob = await downloadIncidentDocumentFile(document.downloadUrl)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento")
    }
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
    <div className="mt-4 rounded-md border border-dashed p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <FileText className="h-4 w-4" />
        Documentos
      </div>

      <form onSubmit={handleUpload} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto_auto] lg:items-end">
        <div className="grid gap-2">
          <Label>Archivo</Label>
          <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} disabled={uploading} />
        </div>
        <div className="grid gap-2">
          <Label>Tipo</Label>
          <Input value={type} onChange={(event) => setType(event.target.value)} disabled={uploading} />
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

      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Sin documentos cargados.</p>
        ) : (
          documents.map((document) => (
            <div
              key={document.id}
              className="flex flex-col gap-3 rounded-md border px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
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

export function LaborNewsManager({ employees }: { employees: Employee[] }) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
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
      const { status, ...incidentPayload } = payload

      if (incidentId) {
        const currentIncident = incidents.find((incident) => incident.id === incidentId)
        const hasStatusChange = status !== currentIncident?.status
        const hasDataChanges = hasIncidentDataChanges(currentIncident, incidentPayload as UpdateIncidentDto)

        if (hasStatusChange) {
          if (status === "ACTIVE") {
            await activateIncident(incidentId)
          } else {
            await deleteIncident(incidentId)
          }
        } else if (hasDataChanges) {
          await updateIncident(incidentId, incidentPayload as UpdateIncidentDto)
        }

        toast.success("Novedad laboral actualizada")
      } else {
        await createIncident(incidentPayload as CreateIncidentDto)
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
                <SelectTrigger className="w-full bg-secondary border-0">
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
      ) : (
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
                      <Badge variant="outline">{incident.consecutive || "Sin consecutivo"}</Badge>
                      <Badge variant={incident.status === "ACTIVE" ? "default" : "secondary"}>
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
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
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
      )}
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
  const [sgiResponsible, setSgiResponsible] = useState<EmployeeSgiResponsible | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportingEmployees, setExportingEmployees] = useState(false)
  const [sgiResponsibleDialogOpen, setSgiResponsibleDialogOpen] = useState(false)

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

  const sgiResponsibleEmployee =
    sgiResponsible?.employee ??
    (sgiResponsible?.employeeId ? employees.find((employee) => employee.id === sgiResponsible.employeeId) : null)

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

  async function loadSgiResponsible() {
    try {
      const data = await getSgiResponsible()
      setSgiResponsible(data)
    } catch {
      setSgiResponsible(null)
    }
  }

  useEffect(() => {
    loadEmployees()
    loadSgiResponsible()
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

  async function handleSaveSgiResponsible(data: UpsertEmployeeSgiResponsibleDto) {
    try {
      const saved = sgiResponsible ? await updateSgiResponsible(data) : await createSgiResponsible(data)
      const selectedEmployee = employees.find((employee) => employee.id === data.employeeId)

      setSgiResponsible({
        ...saved,
        employeeId: data.employeeId,
        signatureDate: data.signatureDate,
        employee: selectedEmployee
          ? {
              id: selectedEmployee.id,
              name: selectedEmployee.name,
              lastName: selectedEmployee.lastName,
              email: selectedEmployee.email,
              phone: selectedEmployee.phone,
            }
          : saved.employee,
      })
      toast.success(sgiResponsible ? "Responsable SGI actualizado" : "Responsable SGI asignado")
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar el responsable SGI")
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funcionarios</h1>
          <p className="text-muted-foreground">Gestion del talento humano</p>
          {sgiResponsibleEmployee && (
            <p className="mt-1 text-sm text-muted-foreground">
              Responsable SGI:{" "}
              <span className="font-medium text-foreground">
                {sgiResponsibleEmployee.name} {sgiResponsibleEmployee.lastName}
              </span>
              {sgiResponsible?.signatureDate && (
                <span> · Firma: {sgiResponsible.signatureDate.slice(0, 10)}</span>
              )}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSgiResponsibleDialogOpen(true)}
            className="gap-2"
            disabled={employees.length === 0}
          >
            <UserCheck className="h-4 w-4" />
            {sgiResponsible ? "Actualizar Responsable SGI" : "Asignar Responsable SGI"}
          </Button>
          <EmployeeFormDialog onSave={handleCreateEmployee} />
        </div>
      </div>

      <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Funcionarios</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Activos</p>
                    <p className="text-2xl font-bold text-accent">{stats.active}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Inactivos</p>
                    <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Areas vinculadas</p>
                    <p className="text-2xl font-bold text-primary">{stats.workAreas}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, correo, area o puesto..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-10 bg-secondary border-0"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Select value={workAreaFilter} onValueChange={setWorkAreaFilter}>
                    <SelectTrigger className="w-[200px] bg-secondary border-0">
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
                    <SelectTrigger className="w-[200px] bg-secondary border-0">
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
                    <SelectTrigger className="w-[140px] bg-secondary border-0">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex rounded-md border border-border bg-secondary p-1">
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
                    <SelectTrigger className="bg-secondary border-0">
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
                    <SelectTrigger className="bg-secondary border-0">
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
                    className="bg-secondary border-0"
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
                    className="bg-secondary border-0"
                    placeholder="Max."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo contrato</Label>
                  <Select value={reportContractType} onValueChange={setReportContractType}>
                    <SelectTrigger className="bg-secondary border-0">
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
                    className="bg-secondary border-0"
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
                    className="bg-secondary border-0"
                    placeholder="Cant."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Lista de empleados</h2>
              <p className="text-sm text-muted-foreground">{filteredEmployees.length} funcionarios encontrados</p>
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
                              employee.status ? "bg-accentActivd text-accentActivd-foreground" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {employee.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
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
                        <Button className="w-full gap-2">
                          <Eye className="h-4 w-4" />
                          Ver Hoja de Vida
                        </Button>
                      </Link>
                      <EmployeeFormDialog
                        employee={employee}
                        onSave={(payload) => handleUpdateEmployee(employee, payload)}
                        trigger={
                          <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                      {employee.status ? (
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
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
                            <p className="truncate text-sm text-muted-foreground">{employee.email || "No registrado"}</p>
                          </div>
                        </div>
                        <div className="min-w-0 text-sm">
                          <p className="truncate font-medium">{employee.job?.name ?? "Sin puesto"}</p>
                          <p className="truncate text-muted-foreground">{employee.workArea?.name ?? "Sin area"}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              employee.status ? "bg-accentActivd text-accentActivd-foreground" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {employee.status ? "Activo" : "Inactivo"}
                          </Badge>
                          <span className="text-muted-foreground">{employee.phone || "Sin telefono"}</span>
                        </div>
                        <div className="flex items-center gap-2 md:justify-end">
                          <Link href={`/dashboard/employees/${employee.id}`}>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Eye className="h-4 w-4" />
                              Ver
                            </Button>
                          </Link>
                          <EmployeeFormDialog
                            employee={employee}
                            onSave={(payload) => handleUpdateEmployee(employee, payload)}
                            trigger={
                              <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                          />
                          {employee.status ? (
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:text-destructive"
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

      <SgiResponsibleFormDialog
        employees={employees}
        open={sgiResponsibleDialogOpen}
        responsible={sgiResponsible}
        onOpenChange={setSgiResponsibleDialogOpen}
        onSave={handleSaveSgiResponsible}
      />
    </div>
  )
}
