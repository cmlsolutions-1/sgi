"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BriefcaseBusiness,
  Building2,
  Edit,
  Eye,
  Filter,
  Loader2,
  Search,
  Trash2,
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JobsManager } from "@/app/dashboard/jobs/page"
import { WorkAreasManager } from "@/app/dashboard/work-areas/page"
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
import type {
  CreateEmployeeDto,
  Employee,
  EmployeeSgiResponsible,
  UpdateEmployeeDto,
  UpsertEmployeeSgiResponsibleDto,
} from "@/types/manager/employee"

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
