"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { mockEmployees, departments, Employee,typeContract } from "@/lib/mock-data"
import { Search, Filter, Eye, Users, Award, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { EmployeeFormDialog } from "@/components/dashboard/employee-form-dialog"

export default function EmployeesPage() {
  const [search, setSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [employees] = useState<Employee[]>(mockEmployees) 

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) || 
      (emp.position && emp.position.toLowerCase().includes(search.toLowerCase()))
    const matchesDept = departmentFilter === "all" || 
      (emp.department && emp.department === departmentFilter)
    // Convertir el estado booleano a string para la comparación
    const empStatusString = typeof emp.status === 'boolean' ? 
      (emp.status ? 'active' : 'inactive') : emp.status
    const statusFilterString = statusFilter === 'all' ? 'all' : statusFilter
    const matchesStatus = statusFilterString === "all" || 
      empStatusString === statusFilterString
    return matchesSearch && matchesDept && matchesStatus
  })

  const handleSaveUser = (employeeData: Partial<Employee>) => {
    // Implementa la lógica de guardado si es necesario
    console.log("Guardar empleado:", employeeData)
  }

  // Stats - adaptado para manejar el nuevo tipo de status
  const stats = {
    total: employees.length,
    active: employees.filter((e) => {
      return typeof e.status === 'boolean' ? e.status : e.status === 'active'
    }).length,
    certifications: employees.reduce((acc, e) => {
      return acc + (e.certifications ? e.certifications.length : 0)
    }, 0),
    trainings: employees.reduce((acc, e) => {
      if (!e.trainings) return acc
      return acc + e.trainings.filter((t) => t.status === "completed").length
    }, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hoja de Vida de Funcionarios</h1>
          <p className="text-muted-foreground">Gestión del talento humano</p>
        </div>
        <EmployeeFormDialog onSave={handleSaveUser} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Users className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Certificaciones</p>
                <p className="text-2xl font-bold text-primary">{stats.certifications}</p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Capacitaciones</p>
                <p className="text-2xl font-bold text-warning">{stats.trainings}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o cargo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary border-0"
              />
            </div>
            <div className="flex gap-3">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px] bg-secondary border-0">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
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

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => {
          // Convertir el estado booleano a string para mostrar
          const displayStatus = typeof employee.status === 'boolean' ? 
            (employee.status ? 'active' : 'inactive') : employee.status
          
          return (
          <Card key={employee.id} className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {employee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{employee.name} {employee.lastName}</h3>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        displayStatus === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {displayStatus === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Departamento</span>
                  <span>{employee.department || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ingreso</span>
                  <span>{employee.hireDate || employee.entryDate || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Certificaciones</span>
                  <Badge variant="outline" className="text-xs">
                    {employee.certifications ? employee.certifications.length : 0}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <Link href={`/dashboard/employees/${employee.id}`}>
                  <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                    <Eye className="h-4 w-4" />
                    Ver Hoja de Vida
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>
    </div>
  )
}