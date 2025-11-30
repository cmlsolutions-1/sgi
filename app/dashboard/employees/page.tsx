"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { mockEmployees, departments } from "@/lib/mock-data"
import { Search, Filter, Eye, Users, Award, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function EmployeesPage() {
  const [search, setSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredEmployees = mockEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) || emp.position.toLowerCase().includes(search.toLowerCase())
    const matchesDept = departmentFilter === "all" || emp.department === departmentFilter
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter
    return matchesSearch && matchesDept && matchesStatus
  })

  // Stats
  const stats = {
    total: mockEmployees.length,
    active: mockEmployees.filter((e) => e.status === "active").length,
    certifications: mockEmployees.reduce((acc, e) => acc + e.certifications.length, 0),
    trainings: mockEmployees.reduce((acc, e) => acc + e.trainings.filter((t) => t.status === "completed").length, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hoja de Vida de Funcionarios</h1>
          <p className="text-muted-foreground">Gestión del talento humano</p>
        </div>
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
        {filteredEmployees.map((employee) => (
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
                      <h3 className="font-medium">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        employee.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {employee.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Departamento</span>
                  <span>{employee.department}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ingreso</span>
                  <span>{employee.hireDate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Certificaciones</span>
                  <Badge variant="outline" className="text-xs">
                    {employee.certifications.length}
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
        ))}
      </div>
    </div>
  )
}
