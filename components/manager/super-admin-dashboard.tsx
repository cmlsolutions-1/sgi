//components/manager/super-admin-dashboard.tsx

"use client"

import type React from "react"
import type { Module } from "@/lib/modules"


import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { doLogout } from "@/lib/auth/logout";

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
import { getModulesFromSidebar } from "@/lib/modules"



type CompanyStatus = "active" | "inactive"
type UserStatus = "active" | "inactive"

type Company = {
  id: string
  name: string
  nit: string
  address: string
  phone: string
  email: string
  registrationDate: string
  status: CompanyStatus
  activeModules: string[]
  totalUsers: number
}

type User = {
  id: string
  companyId: string
  name: string
  email: string
  roleId: string
  status: UserStatus
  creationDate: string
  // NO guardes passwordHash en UI (eso es del backend)
}


type NivelRiesgoItem = {
  "CLASE DE RIESGO": number
  "CÓDIGO CIIU": number
  "CODIGO ADICIONAL": number
  "DESCRIPCION DE ACTIVIDAD ECONÓMICA FINAL": string
}



// Datos de empresas (quemados)
const INITIAL_COMPANIES: Company[] = [
  {
    id: "1",
    name: "Tech Solutions S.A.",
    nit: "900123456",
    address: "Calle 10 # 20-30",
    phone: "3001234567",
    email: "contacto@techsolutions.com",
    registrationDate: "2024-01-15",
    status: "active",
    activeModules: ["usuarios", "empleados", "gestion-documental"],
    totalUsers: 45,
  },
  {
    id: "2",
    name: "Innovatech Group",
    nit: "900987654",
    address: "Carrera 50 # 10-20",
    phone: "3019876543",
    email: "admin@innovatech.com",
    registrationDate: "2024-02-20",
    status: "active",
    activeModules: ["usuarios", "planificacion", "riesgos"],
    totalUsers: 28,
  },
  {
    id: "3",
    name: "Global Services Corp",
    nit: "901555666",
    address: "Av 80 # 12-40",
    phone: "3025556667",
    email: "info@globalservices.com",
    registrationDate: "2024-03-10",
    status: "active",
    activeModules: ["usuarios", "empleados"],
    totalUsers: 62,
  },
  {
    id: "4",
    name: "Digital Partners",
    nit: "902333444",
    address: "Calle 100 # 15-20",
    phone: "3033334445",
    email: "hola@digitalpartners.com",
    registrationDate: "2024-04-05",
    status: "inactive",
    activeModules: ["usuarios", "gestion-documental", "planificacion", "riesgos"],
    totalUsers: 18,
  },
]


export function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false)


  const [ciiu, setCiiu] = useState("")
  const [ciiuResults, setCiiuResults] = useState<NivelRiesgoItem[]>([])
  const [ciiuError, setCiiuError] = useState<string | null>(null)

  const [users, setUsers] = useState<User[]>([])
  const AVAILABLE_MODULES = getModulesFromSidebar()

  const router = useRouter();

  const [newCompany, setNewCompany] = useState({
  name: "",
  nit: "",
  address: "",
  phone: "",
  email: "",
  status: "active" as CompanyStatus,
})

const [newUser, setNewUser] = useState({
  name: "",
  email: "",
  password: "",
  roleId: "admin", // o el id real
  status: "active" as UserStatus,
})

const handleCreateCompanyWithUser = () => {
    if (!newCompany.name || !newCompany.nit || !newCompany.email) return
    if (!newUser.name || !newUser.email || !newUser.password) return

    const companyId = Date.now().toString()

    const company: Company = {
      id: companyId,
      name: newCompany.name,
      nit: newCompany.nit,
      address: newCompany.address,
      phone: newCompany.phone,
      email: newCompany.email,
      registrationDate: new Date().toISOString().split("T")[0],
      status: newCompany.status,
      activeModules: ["usuarios"],
      totalUsers: 1,
    }

    const user: User = {
      id: (Date.now() + 1).toString(),
      companyId,
      name: newUser.name,
      email: newUser.email,
      roleId: newUser.roleId,
      status: newUser.status,
      creationDate: new Date().toISOString().split("T")[0],
    }

    setCompanies((prev) => [...prev, company])
    setUsers((prev) => [...prev, user])

    setNewCompany({ name: "", nit: "", address: "", phone: "", email: "", status: "active" })
    setNewUser({ name: "", email: "", password: "", roleId: "admin", status: "active" })
    setIsCreateDialogOpen(false)
  }



  async function handleLogout() {
    await doLogout();
    router.push("/login");
    router.refresh();
  }

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

  //limpiar busqueda
  const handleClearCiiu = () => {
    setCiiu("")
    setCiiuResults([])
    setCiiuError(null)
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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">
            Panel de Super Usuario Empresarial
          </h1>
          <p className="text-muted-foreground text-lg">Gestionar empresas y sus módulos</p>
        </div>

        <Button
          onClick={handleLogout}
          className="
            bg-red-400 
            text-white 
            hover:bg-red-500 
            active:bg-red-600
            flex items-center gap-2
          "
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
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
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] items-end">
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

            {Boolean(ciiu || ciiuResults.length > 0 || ciiuError) && (
            <Button
              variant="outline"
              onClick={handleClearCiiu}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cerrar
            </Button>
          )}
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
                      onClick={handleCreateCompanyWithUser}
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
                          <span>Creada: {new Date(company.registrationDate).toLocaleDateString("es-ES")}</span>
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
                          <module.icon className="h-4 w-4" />
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
            <DialogTitle className="text-foreground">Crear Empresa + Usuario Administrador</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Registra la empresa y crea su usuario inicial (admin).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* ===================== */}
            {/* Datos de la empresa   */}
            {/* ===================== */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Datos de la empresa</h3>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  Company
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="company-name" className="text-foreground">
                    Nombre de la Empresa
                  </Label>
                  <Input
                    id="company-name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="Tech Solutions S.A."
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company-nit" className="text-foreground">
                    NIT
                  </Label>
                  <Input
                    id="company-nit"
                    value={newCompany.nit}
                    onChange={(e) => setNewCompany({ ...newCompany, nit: e.target.value })}
                    placeholder="900123456"
                    className="bg-input border-border text-foreground"
                    inputMode="numeric"
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="company-address" className="text-foreground">
                    Dirección
                  </Label>
                  <Input
                    id="company-address"
                    value={newCompany.address}
                    onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                    placeholder="Calle 10 # 20-30"
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company-phone" className="text-foreground">
                    Teléfono
                  </Label>
                  <Input
                    id="company-phone"
                    value={newCompany.phone}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                    placeholder="3001234567"
                    className="bg-input border-border text-foreground"
                    inputMode="tel"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company-email" className="text-foreground">
                    Email de Contacto
                  </Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* ===================== */}
            {/* Usuario administrador */}
            {/* ===================== */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Usuario administrador inicial</h3>
                <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                  User
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="user-name" className="text-foreground">
                    Nombre
                  </Label>
                  <Input
                    id="user-name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Juan Pérez"
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="user-email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="admin@empresa.com"
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="user-password" className="text-foreground">
                    Contraseña (se encripta en backend)
                  </Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="********"
                    className="bg-input border-border text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nota: aquí capturamos la contraseña, pero el <b>hash</b> debe generarse en el servidor.
                  </p>
                </div>
              </div>

              {/* Role fijo por ahora */}
              <div className="text-xs text-muted-foreground">
                Rol asignado: <span className="font-medium text-foreground">Administrador</span> (roleId:{" "}
                <span className="font-mono">{newUser.roleId}</span>)
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCompanyWithUser}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Crear Empresa y Usuario
            </Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>
    </div>
  )
}
