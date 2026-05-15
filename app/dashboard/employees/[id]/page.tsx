"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowLeft,
  BriefcaseBusiness,
  Building,
  Calendar,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  getEmployeeById,
  listArlCatalog,
  listCompensationCatalog,
  listEpsCatalog,
  listPensionCatalog,
  updateEmployeeSocialSecurity,
} from "@/services/employeeService"
import { cn } from "@/lib/utils"
import type { Employee, EmployeeCatalogOption, UpdateEmployeeSocialSecurityDto } from "@/types/manager/employee"

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

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [employee, setEmployee] = useState<Employee | null>(null)
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
        const [data, eps, arl, pension, compensation] = await Promise.all([
          getEmployeeById(id),
          listEpsCatalog(),
          listArlCatalog(),
          listPensionCatalog(),
          listCompensationCatalog(),
        ])
        if (mounted) setEmployee(data)
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
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
