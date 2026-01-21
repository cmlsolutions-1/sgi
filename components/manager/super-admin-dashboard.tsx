//components/manager/super-admin-dashboard.tsx

"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Building2,
  Plus,
  Settings,
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import nivelRiesgos from "@/lib/nivelRiesgos.json"

type NivelRiesgoItem = {
  "CLASE DE RIESGO": number
  "CÓDIGO CIIU": number
  "CODIGO ADICIONAL": number
  "DESCRIPCION DE ACTIVIDAD ECONÓMICA FINAL": string
}

// Tipos de datos
type Module = {
  id: string
  name: string
  icon: React.ReactNode
  description: string
}

type Company = {
  id: string
  name: string
  email: string
  createdAt: string
  activeModules: string[]
  totalUsers: number
  status: "active" | "inactive"
}

// Módulos disponibles
const AVAILABLE_MODULES: Module[] = [
  {
    id: "usuarios",
    name: "Usuarios",
    icon: <Users className="h-4 w-4" />,
    description: "Gestión de usuarios y permisos",
  },
  {
    id: "empleados",
    name: "Empleados",
    icon: <Users className="h-4 w-4" />,
    description: "Control de empleados y nómina",
  },
  {
    id: "gestion-documental",
    name: "Gestión Documental",
    icon: <FileText className="h-4 w-4" />,
    description: "Almacenamiento y organización de documentos",
  },
  {
    id: "planificacion",
    name: "Planificación",
    icon: <Calendar className="h-4 w-4" />,
    description: "Planificación de proyectos y tareas",
  },
  {
    id: "riesgos",
    name: "Riesgos",
    icon: <AlertTriangle className="h-4 w-4" />,
    description: "Gestión y análisis de riesgos",
  },
]

// Datos de empresas (quemados)
const INITIAL_COMPANIES: Company[] = [
  {
    id: "1",
    name: "Tech Solutions S.A.",
    email: "contacto@techsolutions.com",
    createdAt: "2024-01-15",
    activeModules: ["usuarios", "empleados", "gestion-documental"],
    totalUsers: 45,
    status: "active",
  },
  {
    id: "2",
    name: "Innovatech Group",
    email: "admin@innovatech.com",
    createdAt: "2024-02-20",
    activeModules: ["usuarios", "planificacion", "riesgos"],
    totalUsers: 28,
    status: "active",
  },
  {
    id: "3",
    name: "Global Services Corp",
    email: "info@globalservices.com",
    createdAt: "2024-03-10",
    activeModules: ["usuarios", "empleados"],
    totalUsers: 62,
    status: "active",
  },
  {
    id: "4",
    name: "Digital Partners",
    email: "hola@digitalpartners.com",
    createdAt: "2024-04-05",
    activeModules: ["usuarios", "gestion-documental", "planificacion", "riesgos"],
    totalUsers: 18,
    status: "inactive",
  },
]

export function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false)
  const [newCompany, setNewCompany] = useState({ name: "", email: "" })

  const [ciiu, setCiiu] = useState("")
  const [ciiuResults, setCiiuResults] = useState<NivelRiesgoItem[]>([])
  const [ciiuError, setCiiuError] = useState<string | null>(null)

  const handleConsultarCiiu = () => {
    setCiiuError(null)
    setCiiuResults([])

    // Permite que el usuario pegue cosas como "6201", "6201.0", " 6201 "
    const cleaned = ciiu.replace(/[^\d]/g, "")
    if (!cleaned) {
      setCiiuError("Ingresa un código CIIU válido (solo números).")
      return
    }

    const code = Number(cleaned)
    if (Number.isNaN(code)) {
      setCiiuError("Código CIIU inválido.")
      return
    }

    const data = nivelRiesgos as NivelRiesgoItem[]
    const matches = data
      .filter((x) => x["CÓDIGO CIIU"] === code)
      .sort((a, b) => (a["CODIGO ADICIONAL"] ?? 0) - (b["CODIGO ADICIONAL"] ?? 0))

    if (matches.length === 0) {
      setCiiuError(`No se encontró información para el CIIU ${code}.`)
      return
    }

    setCiiuResults(matches)
  }

  // Crear nueva empresa
  const handleCreateCompany = () => {
    if (!newCompany.name || !newCompany.email) return

    const company: Company = {
      id: Date.now().toString(),
      name: newCompany.name,
      email: newCompany.email,
      createdAt: new Date().toISOString().split("T")[0],
      activeModules: ["usuarios"], // Por defecto, todas las empresas tienen el módulo de usuarios
      totalUsers: 0,
      status: "active",
    }

    setCompanies([...companies, company])
    setNewCompany({ name: "", email: "" })
    setIsCreateDialogOpen(false)
  }

  // Toggle módulo para empresa seleccionada
  const toggleModule = (moduleId: string) => {
    if (!selectedCompany) return

    const updatedCompanies = companies.map((company) => {
      if (company.id === selectedCompany.id) {
        const activeModules = company.activeModules.includes(moduleId)
          ? company.activeModules.filter((id) => id !== moduleId)
          : [...company.activeModules, moduleId]

        return { ...company, activeModules }
      }
      return company
    })

    setCompanies(updatedCompanies)
    setSelectedCompany(updatedCompanies.find((c) => c.id === selectedCompany.id) || null)
  }

  // Estadísticas generales
  const stats = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter((c) => c.status === "active").length,
    totalUsers: companies.reduce((acc, c) => acc + c.totalUsers, 0),
    avgModulesPerCompany: (companies.reduce((acc, c) => acc + c.activeModules.length, 0) / companies.length).toFixed(1),
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">Panel de Super Usuario Empresarial</h1>
        <p className="text-muted-foreground text-lg">Gestionar empresas y sus módulos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">Total Empresas</CardDescription>
            <CardTitle className="text-3xl text-foreground">{stats.totalCompanies}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">Empresas Activas</CardDescription>
            <CardTitle className="text-3xl text-foreground">{stats.activeCompanies}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">Total Usuarios</CardDescription>
            <CardTitle className="text-3xl text-foreground">{stats.totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">Módulos Promedio</CardDescription>
            <CardTitle className="text-3xl text-foreground">{stats.avgModulesPerCompany}</CardTitle>
          </CardHeader>
        </Card>
      </div>
            {/* Consulta CIIU */}
      <Card className="bg-card border-border shadow-sm mb-8">
        <CardHeader>
          <CardTitle className="text-foreground">Consulta de Riesgo por CIIU</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ingresa el código CIIU para ver a qué clase(s) de riesgo está asociado.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end">
            <div className="grid gap-2">
              <Label htmlFor="ciiu" className="text-foreground">
                CÓDIGO CIIU
              </Label>
              <Input
                id="ciiu"
                value={ciiu}
                onChange={(e) => setCiiu(e.target.value)}
                placeholder="Ej: 6201"
                className="bg-input border-border text-foreground"
                inputMode="numeric"
              />
            </div>

            <Button
              onClick={handleConsultarCiiu}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Consultar
            </Button>
          </div>

          {ciiuError && (
            <div className="text-sm text-destructive">{ciiuError}</div>
          )}

          {ciiuResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">
                  Resultados para:
                </span>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  CIIU {ciiu.replace(/[^\d]/g, "")}
                </Badge>

                {/* Clases únicas */}
                {Array.from(new Set(ciiuResults.map(r => r["CLASE DE RIESGO"])))
                  .sort((a, b) => a - b)
                  .map((clase) => (
                    <Badge
                      key={clase}
                      className="bg-primary/10 text-primary border-primary/20"
                      variant="outline"
                    >
                      Clase de riesgo: {clase}
                    </Badge>
                  ))}
              </div>

              <div className="grid gap-3">
                {ciiuResults.map((r, idx) => (
                  <div
                    key={`${r["CÓDIGO CIIU"]}-${r["CODIGO ADICIONAL"]}-${idx}`}
                    className="p-4 rounded-lg border border-border bg-white shadow-sm space-y-2"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-border text-foreground">
                        CIIU {r["CÓDIGO CIIU"]}
                      </Badge>
                      <Badge variant="outline" className="border-border text-foreground">
                        Adicional {r["CODIGO ADICIONAL"]}
                      </Badge>
                      <Badge className="bg-success/20 text-success border-success/30" variant="outline">
                        Riesgo {r["CLASE DE RIESGO"]}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {r["DESCRIPCION DE ACTIVIDAD ECONÓMICA FINAL"]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Companies List */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Empresas</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Gestiona las empresas registradas en el sistema
                </CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Empresa
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Crear Nueva Empresa</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Ingresa los datos de la nueva empresa
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-foreground">
                        Nombre de la Empresa
                      </Label>
                      <Input
                        id="name"
                        value={newCompany.name}
                        onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                        placeholder="Tech Solutions S.A."
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-foreground">
                        Email de Contacto
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newCompany.email}
                        onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                        placeholder="contacto@empresa.com"
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateCompany}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Crear Empresa
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-white hover:bg-secondary/50 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{company.name}</h3>
                          <Badge
                            variant={company.status === "active" ? "default" : "secondary"}
                            className={
                              company.status === "active"
                                ? "bg-success/20 text-success border-success/30"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {company.status === "active" ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {company.status === "active" ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{company.email}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{company.totalUsers} usuarios</span>
                          <span>•</span>
                          <span>{company.activeModules.length} módulos activos</span>
                          <span>•</span>
                          <span>Creada: {new Date(company.createdAt).toLocaleDateString("es-ES")}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCompany(company)
                        setIsModulesDialogOpen(true)
                      }}
                      className="border-border text-foreground hover:bg-secondary"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Módulos
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules Overview */}
        <div>
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Módulos Disponibles</CardTitle>
              <CardDescription className="text-muted-foreground">
                Módulos que se pueden habilitar para las empresas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {AVAILABLE_MODULES.map((module) => {
                  const companiesUsingModule = companies.filter((c) => c.activeModules.includes(module.id)).length

                  return (
                    <div key={module.id} className="p-4 rounded-lg border border-border bg-white shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                          {module.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">{module.name}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{module.description}</p>
                          <div className="text-xs text-muted-foreground">
                            {companiesUsingModule} empresa{companiesUsingModule !== 1 ? "s" : ""} usando
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modules Management Dialog */}
      <Dialog open={isModulesDialogOpen} onOpenChange={setIsModulesDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Gestionar Módulos - {selectedCompany?.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Habilita o deshabilita los módulos para esta empresa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {AVAILABLE_MODULES.map((module) => {
              const isActive = selectedCompany?.activeModules.includes(module.id) || false
              const isUsuarios = module.id === "usuarios"

              return (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-white shadow-sm"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {module.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{module.name}</h4>
                        {isUsuarios && (
                          <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                            Requerido
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => toggleModule(module.id)}
                    disabled={isUsuarios} // El módulo de usuarios no se puede desactivar
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsModulesDialogOpen(false)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
