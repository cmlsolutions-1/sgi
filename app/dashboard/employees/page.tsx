"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  Edit,
  Eye,
  Filter,
  Loader2,
  Search,
  Trash2,
  TriangleAlert,
  UserCheck,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { EmployeeFormDialog } from "@/components/dashboard/employee-form-dialog"
import { SgiResponsibleFormDialog } from "@/components/dashboard/SgiResponsibleFormDialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { JobsManager } from "@/app/dashboard/jobs/page"
import { WorkAreasManager } from "@/app/dashboard/work-areas/page"
import {
  activateIncident,
  createIncident,
  deleteIncident,
  listIncidents,
  updateIncident,
} from "@/services/incidentService"
import {
  activateEmployee,
  createEmployee,
  createSgiResponsible,
  deleteEmployee,
  getSgiResponsible,
  listEmployees,
  updateSgiResponsible,
  updateEmployee,
} from "@/services/employeeService"
import { cn } from "@/lib/utils"
import type { CreateIncidentDto, Incident, UpdateIncidentDto } from "@/types/manager/incident"
import type {
  CreateEmployeeDto,
  Employee,
  EmployeeSgiResponsible,
  UpdateEmployeeDto,
  UpsertEmployeeSgiResponsibleDto,
} from "@/types/manager/employee"

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

type IncidentFormState = CreateIncidentDto

const emptyIncidentForm: IncidentFormState = {
  employeeId: "",
  date: "",
  place: "",
  description: "",
  consequences: "",
  correctiveActions: "",
}

function IncidentDialog({
  incident,
  employees,
  onSave,
}: {
  incident?: Incident
  employees: Employee[]
  onSave: (payload: CreateIncidentDto | UpdateIncidentDto, incidentId?: string) => Promise<void>
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
          {incident ? "Editar" : "Nuevo incidente"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{incident ? "Editar incidente" : "Nuevo incidente laboral"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Funcionario</Label>
                <Select value={form.employeeId} onValueChange={(value) => setForm((current) => ({ ...current, employeeId: value }))}>
                  <SelectTrigger>
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
                value={form.place}
                onChange={(event) => setForm((current) => ({ ...current, place: event.target.value }))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="incident-description">Descripcion</Label>
              <Textarea
                id="incident-description"
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
                  value={form.consequences}
                  onChange={(event) => setForm((current) => ({ ...current, consequences: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="incident-actions">Acciones correctivas</Label>
                <Textarea
                  id="incident-actions"
                  value={form.correctiveActions}
                  onChange={(event) => setForm((current) => ({ ...current, correctiveActions: event.target.value }))}
                />
              </div>
            </div>
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

function IncidentsManager({ employees }: { employees: Employee[] }) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [employeeFilter, setEmployeeFilter] = useState("all")

  async function loadData(filter = employeeFilter) {
    setLoading(true)
    try {
      const data = await listIncidents(filter === "all" ? undefined : filter)
      setIncidents(data)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo cargar los incidentes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleFilterChange(value: string) {
    setEmployeeFilter(value)
    await loadData(value)
  }

  async function handleSaveIncident(payload: CreateIncidentDto | UpdateIncidentDto, incidentId?: string) {
    try {
      if (incidentId) {
        await updateIncident(incidentId, payload as UpdateIncidentDto)
        toast.success("Incidente actualizado")
      } else {
        await createIncident(payload as CreateIncidentDto)
        toast.success("Incidente creado")
      }
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar el incidente")
      throw error
    }
  }

  async function handleDeleteIncident(incident: Incident) {
    if (!window.confirm("Eliminar este incidente laboral?")) return

    try {
      await deleteIncident(incident.id)
      toast.success("Incidente eliminado")
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar el incidente")
    }
  }

  async function handleActivateIncident(incident: Incident) {
    try {
      await activateIncident(incident.id)
      toast.success("Incidente activado")
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo activar el incidente")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Incidentes laborales</h2>
          <p className="text-sm text-muted-foreground">Registra y consulta incidentes asociados a funcionarios.</p>
        </div>
        <IncidentDialog employees={employees} onSave={handleSaveIncident} />
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="grid gap-1">
              <Label>Funcionario</Label>
              <Select value={employeeFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-full bg-secondary border-0 md:w-[260px]">
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
            No hay incidentes registrados.
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
                      <Badge variant={incident.status === "ACTIVE" ? "default" : "secondary"}>{incident.status}</Badge>
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
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [sgiResponsible, setSgiResponsible] = useState<EmployeeSgiResponsible | null>(null)
  const [loading, setLoading] = useState(true)
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
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && employee.status) ||
        (statusFilter === "inactive" && !employee.status)

      return matchesSearch && matchesArea && matchesStatus
    })
  }, [employees, search, statusFilter, workAreaFilter])

  const stats = {
    total: employees.length,
    active: employees.filter((employee) => employee.status).length,
    inactive: employees.filter((employee) => !employee.status).length,
    workAreas: workAreas.length,
  }

  const sgiResponsibleEmployee =
    sgiResponsible?.employee ??
    (sgiResponsible?.employeeId ? employees.find((employee) => employee.id === sgiResponsible.employeeId) : null)

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

      <Tabs defaultValue="officials" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="officials" className="gap-2">
            <Users className="h-4 w-4" />
            Funcionarios
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-2">
            <Building2 className="h-4 w-4" />
            Estructura Organizacional
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-2">
            <TriangleAlert className="h-4 w-4" />
            Incidentes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="officials" className="space-y-6">
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
                <div className="flex gap-3">
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
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {employee.name
                            .split(" ")
                            .map((name) => name[0])
                            .join("")}
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
                              employee.status ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground",
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
          )}
        </TabsContent>

        <TabsContent value="structure" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Estructura Organizacional</h2>
            <p className="text-sm text-muted-foreground">
              Administra las areas y los puestos de trabajo que se usan en la vinculacion de funcionarios.
            </p>
          </div>

          <Tabs defaultValue="work-areas" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="work-areas" className="gap-2">
                <Users className="h-4 w-4" />
                Areas de trabajo
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2">
                <BriefcaseBusiness className="h-4 w-4" />
                Puestos de trabajo
              </TabsTrigger>
            </TabsList>
            <TabsContent value="work-areas">
              <WorkAreasManager />
            </TabsContent>
            <TabsContent value="jobs">
              <JobsManager />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <IncidentsManager employees={employees} />
        </TabsContent>
      </Tabs>

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
