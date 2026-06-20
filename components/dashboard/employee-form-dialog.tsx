"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { listJobs } from "@/services/jobService"
import { listWorkAreaOptions } from "@/services/workAreaService"
import type { CreateEmployeeDto, Employee, EmployeeGender, UpdateEmployeeDto } from "@/types/manager/employee"
import type { Job } from "@/types/manager/job"
import type { WorkAreaOption } from "@/types/manager/work-area"

type EmployeeFormValues = {
  name: string
  lastName: string
  phone: string
  email: string
  address: string
  birthDate: string
  gender: EmployeeGender | ""
  workAreaId: string
  jobId: string
  status: boolean
}

type EmployeeFormPayload = CreateEmployeeDto | UpdateEmployeeDto

interface EmployeeFormDialogProps {
  employee?: Employee
  onSave: (employee: EmployeeFormPayload) => Promise<void> | void
  trigger?: React.ReactNode
}

const emptyForm: EmployeeFormValues = {
  name: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  birthDate: "",
  gender: "",
  workAreaId: "",
  jobId: "",
  status: true,
}

const genderOptions: Array<{ value: EmployeeGender; label: string }> = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMENINO", label: "Femenino" },
]

const fieldControlClassName =
  "w-full border-slate-300 bg-white shadow-sm hover:border-slate-400 focus-visible:border-primary focus-visible:ring-primary/25"

function toDateInput(value?: string | null) {
  if (!value) return ""
  return value.slice(0, 10)
}

function getInitialForm(employee?: Employee): EmployeeFormValues {
  if (!employee) return emptyForm

  return {
    name: employee.name ?? "",
    lastName: employee.lastName ?? "",
    phone: employee.phone ?? "",
    email: employee.email ?? "",
    address: employee.address ?? "",
    birthDate: toDateInput(employee.birthDate),
    gender: employee.gender ?? "",
    workAreaId: employee.workAreaId ?? "",
    jobId: employee.jobId ?? "",
    status: employee.status ?? true,
  }
}

export function EmployeeFormDialog({ employee, onSave, trigger }: EmployeeFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<EmployeeFormValues>(() => getInitialForm(employee))
  const [workAreas, setWorkAreas] = useState<WorkAreaOption[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [saving, setSaving] = useState(false)

  const availableJobs = useMemo(() => {
    if (!formData.workAreaId) return jobs
    return jobs.filter((job) => job.workAreaId === formData.workAreaId)
  }, [formData.workAreaId, jobs])

  useEffect(() => {
    if (!open) return

    setFormData(getInitialForm(employee))
    setLoadingOptions(true)

    Promise.all([listWorkAreaOptions(), listJobs()])
      .then(([workAreaData, jobsData]) => {
        setWorkAreas(workAreaData)
        setJobs(jobsData.items ?? [])
      })
      .catch((error: any) => {
        toast.error(error.message ?? "No se pudieron cargar areas y puestos")
      })
      .finally(() => setLoadingOptions(false))
  }, [employee, open])

  function updateField<K extends keyof EmployeeFormValues>(field: K, value: EmployeeFormValues[K]) {
    setFormData((current) => {
      if (field === "workAreaId" && current.workAreaId !== value) {
        return { ...current, workAreaId: value as string, jobId: "" }
      }

      return { ...current, [field]: value }
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!formData.name.trim() || !formData.lastName.trim()) {
      toast.error("Nombre y apellido son requeridos")
      return
    }

    if (!formData.workAreaId) {
      toast.error("Selecciona un area de trabajo")
      return
    }

    if (!formData.jobId) {
      toast.error("Selecciona un puesto de trabajo")
      return
    }

    if (!formData.gender) {
      toast.error("Selecciona el genero")
      return
    }

    const payload: EmployeeFormPayload = {
      name: formData.name.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      birthDate: formData.birthDate,
      gender: formData.gender,
      workAreaId: formData.workAreaId,
      jobId: formData.jobId,
      status: formData.status,
    }

    setSaving(true)
    try {
      await onSave(payload)
      setOpen(false)
      if (!employee) setFormData(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo funcionario
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-card border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{employee ? "Editar funcionario" : "Crear funcionario"}</DialogTitle>
          </DialogHeader>

          {loadingOptions ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employee-name">Nombre</Label>
                  <Input
                    id="employee-name"
                    className={fieldControlClassName}
                    value={formData.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Nombre"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-lastName">Apellido</Label>
                  <Input
                    id="employee-lastName"
                    className={fieldControlClassName}
                    value={formData.lastName}
                    onChange={(event) => updateField("lastName", event.target.value)}
                    placeholder="Apellido"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-phone">Telefono</Label>
                  <Input
                    id="employee-phone"
                    className={fieldControlClassName}
                    value={formData.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    placeholder="Telefono de contacto"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-email">Correo</Label>
                  <Input
                    id="employee-email"
                    className={fieldControlClassName}
                    type="email"
                    value={formData.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="correo@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-birthDate">Fecha de nacimiento</Label>
                  <Input
                    id="employee-birthDate"
                    className={fieldControlClassName}
                    type="date"
                    value={formData.birthDate}
                    onChange={(event) => updateField("birthDate", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Genero</Label>
                  <Select value={formData.gender} onValueChange={(value) => updateField("gender", value as EmployeeGender)}>
                    <SelectTrigger className={fieldControlClassName}>
                      <SelectValue placeholder="Selecciona el genero" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={String(formData.status)} onValueChange={(value) => updateField("status", value === "true")}>
                    <SelectTrigger className={fieldControlClassName}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="employee-address">Direccion</Label>
                  <Input
                    id="employee-address"
                    className={fieldControlClassName}
                    value={formData.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    placeholder="Direccion de residencia"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Area de trabajo</Label>
                  <Select value={formData.workAreaId} onValueChange={(value) => updateField("workAreaId", value)}>
                    <SelectTrigger className={fieldControlClassName}>
                      <SelectValue placeholder="Selecciona un area" />
                    </SelectTrigger>
                    <SelectContent>
                      {workAreas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Puesto de trabajo</Label>
                  <Select
                    value={formData.jobId}
                    onValueChange={(value) => updateField("jobId", value)}
                    disabled={!formData.workAreaId || availableJobs.length === 0}
                  >
                    <SelectTrigger className={fieldControlClassName}>
                      <SelectValue placeholder="Selecciona un puesto" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableJobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || loadingOptions}>
              {saving ? "Guardando..." : employee ? "Guardar cambios" : "Crear funcionario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EditEmployeeButton({
  employee,
  onSave,
}: {
  employee: Employee
  onSave: (employee: EmployeeFormPayload) => Promise<void> | void
}) {
  return (
    <EmployeeFormDialog
      employee={employee}
      onSave={onSave}
      trigger={
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  )
}
