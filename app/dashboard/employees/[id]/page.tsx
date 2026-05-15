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
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
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
  createEmployeeEducation,
  deleteEmployeeEducation,
  getEmployeeById,
  listEmployeeEducation,
  listArlCatalog,
  listCompensationCatalog,
  listEpsCatalog,
  listPensionCatalog,
  updateEmployeeEducation,
  updateEmployeeSocialSecurity,
} from "@/services/employeeService"
import { cn } from "@/lib/utils"
import type {
  CreateEmployeeEducationDto,
  Employee,
  EmployeeCatalogOption,
  EmployeeEducation,
  UpdateEmployeeEducationDto,
  UpdateEmployeeSocialSecurityDto,
} from "@/types/manager/employee"

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

type EducationFormState = CreateEmployeeEducationDto

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
                <Label htmlFor="education-level">Nivel</Label>
                <Input
                  id="education-level"
                  value={form.level}
                  onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))}
                  placeholder="Ej: Universitario"
                  required
                />
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

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [education, setEducation] = useState<EmployeeEducation[]>([])
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
        const [data, educationData, eps, arl, pension, compensation] = await Promise.all([
          getEmployeeById(id),
          listEmployeeEducation(id),
          listEpsCatalog(),
          listArlCatalog(),
          listPensionCatalog(),
          listCompensationCatalog(),
        ])
        if (mounted) setEmployee(data)
        if (mounted) setEducation(educationData)
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
