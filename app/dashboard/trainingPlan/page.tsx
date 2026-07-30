"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarDays, Edit, Eye, Loader2, Plus, Power, Trash2 } from "lucide-react"
import { toast } from "sonner"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  activateTopicTraining,
  activateTraining,
  changeTrainingStatus,
  createTopicTraining,
  createTraining,
  deleteTopicTraining,
  deleteTraining,
  listTopicTraining,
  listTopicTrainingOptions,
  listTraining,
  updateTopicTraining,
  updateTraining,
} from "@/services/trainingService"
import { listEmployees } from "@/services/employeeService"
import type { Employee } from "@/types/manager/employee"
import type {
  CreateTopicTrainingDto,
  CreateTrainingDto,
  TopicTraining,
  TopicTrainingOption,
  Training,
  TrainingStatus,
  TrainingType,
  UpdateTopicTrainingDto,
  UpdateTrainingDto,
} from "@/types/manager/training"

const months = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function getEmployeeFullName(employee: Employee) {
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || employee.id
}

function getTrainingTypeLabel(type?: string | null) {
  if (type === "INDUCCION") return "Induccion"
  if (type === "REINDUCCION") return "Reinduccion"
  return "Capacitacion"
}

function getTrainingStatusLabel(status?: string | null) {
  if (status === "ACTIVE") return "Activa"
  if (status === "INACTIVE") return "Inactiva"
  if (status === "FINALIZADA" || status === "FINISHED") return "Finalizada"
  if (status === "CANCELADA" || status === "CANCELLED") return "Cancelada"
  return status ?? "No registrada"
}

function getTrainingStatusBadgeClassName(status?: string | null) {
  if (status === "FINALIZADA" || status === "FINISHED") return "bg-blue-600 text-white border-transparent"
  if (status === "CANCELADA" || status === "CANCELLED") return "bg-destructive text-white border-transparent"
  return undefined
}

const trainingStatusOptions = [
  { value: "ACTIVE", label: "Activa" },
  { value: "INACTIVE", label: "Inactiva" },
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "CANCELADA", label: "Cancelada" },
]

const trainingTypeOptions: Array<{ value: TrainingType; label: string }> = [
  { value: "CAPACITACION", label: "Capacitacion" },
  { value: "INDUCCION", label: "Induccion" },
  { value: "REINDUCCION", label: "Reinduccion" },
]

type TopicFormState = CreateTopicTrainingDto

const emptyTopicForm: TopicFormState = {
  name: "",
  description: "",
}

function TopicDialog({
  topic,
  onSave,
}: {
  topic?: TopicTraining
  onSave: (payload: CreateTopicTrainingDto | UpdateTopicTrainingDto, topicId?: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<TopicFormState>(emptyTopicForm)

  useEffect(() => {
    if (!open) return
    setForm(topic ? { name: topic.name ?? "", description: topic.description ?? "" } : emptyTopicForm)
  }, [open, topic])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error("Ingresa el nombre del tema")
      return
    }

    setSaving(true)
    try {
      await onSave({ name: form.name.trim(), description: form.description.trim() }, topic?.id)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={topic ? "action" : "default"} size="sm" className="gap-2">
          {topic ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {topic ? "Editar" : "Nuevo tema"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{topic ? "Editar tema" : "Nuevo tema de capacitacion"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="topic-name">Nombre</Label>
              <Input
                id="topic-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="topic-description">Descripcion</Label>
              <Textarea
                id="topic-description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
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

type TrainingFormState = {
  topicId: string
  date: string
  durationHours: string
  type: TrainingType
  employeeIds: string[]
  entryDate: string
  inductionDate: string
  responsibleEmployeeId: string
  modality: string
  status: string
}

const emptyTrainingForm: TrainingFormState = {
  topicId: "",
  date: "",
  durationHours: "",
  type: "CAPACITACION",
  employeeIds: [],
  entryDate: "",
  inductionDate: "",
  responsibleEmployeeId: "",
  modality: "",
  status: "ACTIVE",
}

const trainingFieldControlClassName =
  "w-full border-slate-300 bg-white shadow-sm hover:border-slate-400 focus-visible:border-primary focus-visible:ring-primary/25"

function TrainingDialog({
  training,
  topics,
  employees,
  onSave,
}: {
  training?: Training
  topics: TopicTrainingOption[]
  employees: Employee[]
  onSave: (payload: CreateTrainingDto | UpdateTrainingDto, trainingId?: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<TrainingFormState>(emptyTrainingForm)
  const requiresInductionFields = form.type !== "CAPACITACION"

  function toggleEmployee(employeeId: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      employeeIds: checked
        ? Array.from(new Set([...current.employeeIds, employeeId]))
        : current.employeeIds.filter((id) => id !== employeeId),
    }))
  }

  function handleTypeChange(value: TrainingType) {
    setForm((current) => ({
      ...current,
      type: value,
      employeeIds: value === "CAPACITACION" ? [] : current.employeeIds,
      entryDate: value === "CAPACITACION" ? "" : current.entryDate,
      inductionDate: value === "CAPACITACION" ? "" : current.inductionDate,
      responsibleEmployeeId: value === "CAPACITACION" ? "" : current.responsibleEmployeeId,
      modality: value === "CAPACITACION" ? "" : current.modality,
    }))
  }

  useEffect(() => {
    if (!open) return
    setForm(
      training
        ? {
            topicId: training.topicId ?? "",
            date: formatDate(training.date) === "No registrada" ? "" : formatDate(training.date),
            durationHours: String(training.durationHours ?? ""),
            type: (training.type as TrainingType | null) ?? "CAPACITACION",
            employeeIds: training.employeeIds ?? [],
            entryDate: formatDate(training.entryDate) === "No registrada" ? "" : formatDate(training.entryDate),
            inductionDate: formatDate(training.inductionDate) === "No registrada" ? "" : formatDate(training.inductionDate),
            responsibleEmployeeId: training.responsibleEmployeeId ?? "",
            modality: training.modality ?? "",
            status: training.status ?? "ACTIVE",
          }
        : emptyTrainingForm,
    )
  }, [open, training])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const durationHours = Number(form.durationHours)

    if (!form.topicId || !form.date || !Number.isFinite(durationHours) || durationHours <= 0) {
      toast.error("Selecciona tema, fecha y una duracion valida")
      return
    }

    if (
      requiresInductionFields &&
      (form.employeeIds.length === 0 || !form.entryDate || !form.inductionDate || !form.responsibleEmployeeId || !form.modality.trim())
    ) {
      toast.error("Completa asistentes, fechas, responsable y modalidad")
      return
    }

    if (requiresInductionFields && form.entryDate > form.inductionDate) {
      toast.error("La fecha de ingreso no puede ser posterior a la fecha de induccion")
      return
    }

    setSaving(true)
    try {
      const baseTrainingData: CreateTrainingDto = {
        topicId: form.topicId,
        date: form.date,
        durationHours,
        type: form.type,
      }
      const trainingData: CreateTrainingDto =
        form.type === "CAPACITACION"
          ? baseTrainingData
          : {
              ...baseTrainingData,
              employeeIds: form.employeeIds,
              entryDate: form.entryDate,
              inductionDate: form.inductionDate,
              responsibleEmployeeId: form.responsibleEmployeeId,
              modality: form.modality.trim(),
            }
      const payload: CreateTrainingDto | UpdateTrainingDto = training
        ? { ...trainingData, status: form.status }
        : trainingData

      await onSave(payload, training?.id)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={training ? "action" : "default"} size="sm" className="gap-2">
          {training ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {training ? "Editar" : "Nueva capacitacion"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden bg-card p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>{training ? "Editar capacitacion" : "Nueva capacitacion"}</DialogTitle>
          </DialogHeader>

          <div className="grid max-h-[calc(90vh-140px)] gap-4 overflow-y-auto px-6 py-4">
            <div className="grid gap-2">
              <Label>Tema</Label>
              <Select value={form.topicId} onValueChange={(value) => setForm((current) => ({ ...current, topicId: value }))}>
                <SelectTrigger className={trainingFieldControlClassName}>
                  <SelectValue placeholder="Selecciona un tema" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(value) => handleTypeChange(value as TrainingType)}>
                <SelectTrigger className={trainingFieldControlClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trainingTypeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="training-date">Fecha</Label>
                <Input
                  id="training-date"
                  className={trainingFieldControlClassName}
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="training-duration">Duracion en horas</Label>
                <Input
                  id="training-duration"
                  className={trainingFieldControlClassName}
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.durationHours}
                  onChange={(event) => setForm((current) => ({ ...current, durationHours: event.target.value }))}
                  required
                />
              </div>
            </div>

            {requiresInductionFields && (
              <div className="grid gap-4 rounded-md border border-border bg-secondary/20 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="training-entry-date">Fecha de ingreso</Label>
                    <Input
                      id="training-entry-date"
                      className={trainingFieldControlClassName}
                      type="date"
                      value={form.entryDate}
                      max={form.inductionDate || undefined}
                      onChange={(event) => setForm((current) => ({ ...current, entryDate: event.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="training-induction-date">Fecha de induccion</Label>
                    <Input
                      id="training-induction-date"
                      className={trainingFieldControlClassName}
                      type="date"
                      value={form.inductionDate}
                      min={form.entryDate || undefined}
                      onChange={(event) => setForm((current) => ({ ...current, inductionDate: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Responsable</Label>
                    <Select
                      value={form.responsibleEmployeeId}
                      onValueChange={(value) => setForm((current) => ({ ...current, responsibleEmployeeId: value }))}
                    >
                      <SelectTrigger className={trainingFieldControlClassName}>
                        <SelectValue placeholder="Selecciona responsable" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {getEmployeeFullName(employee)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="training-modality">Modalidad</Label>
                    <Input
                      id="training-modality"
                      className={trainingFieldControlClassName}
                      value={form.modality}
                      placeholder="Presencial"
                      onChange={(event) => setForm((current) => ({ ...current, modality: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Funcionarios</Label>
                  <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-white p-2">
                    {employees.length === 0 ? (
                      <p className="p-2 text-sm text-muted-foreground">No hay funcionarios disponibles.</p>
                    ) : (
                      <div className="grid gap-1">
                        {employees.map((employee) => (
                          <label
                            key={employee.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                          >
                            <Checkbox
                              checked={form.employeeIds.includes(employee.id)}
                              onCheckedChange={(checked) => toggleEmployee(employee.id, checked === true)}
                            />
                            <span className="min-w-0 flex-1 truncate">{getEmployeeFullName(employee)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
                <SelectTrigger className={trainingFieldControlClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trainingStatusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || topics.length === 0}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function TrainingPlanPage() {
  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState<TopicTraining[]>([])
  const [topicOptions, setTopicOptions] = useState<TopicTrainingOption[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [yearFilter, setYearFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  async function loadData() {
    setLoading(true)
    try {
      const [topicsData, topicOptionsData, trainingsData, employeesData] = await Promise.all([
        listTopicTraining(),
        listTopicTrainingOptions(),
        listTraining(),
        listEmployees(),
      ])
      setTopics(topicsData)
      setTopicOptions(topicOptionsData)
      setTrainings(trainingsData.items ?? [])
      setEmployees(employeesData)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar capacitaciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const years = useMemo(
    () => Array.from(new Set(trainings.map((item) => new Date(item.date).getFullYear().toString()))),
    [trainings],
  )

  const filteredTrainings = useMemo(() => {
    return trainings.filter((training) => {
      const date = new Date(`${formatDate(training.date)}T00:00:00`)
      const year = date.getFullYear().toString()
      const month = String(date.getMonth() + 1).padStart(2, "0")

      return (
        (yearFilter === "all" || year === yearFilter) &&
        (monthFilter === "all" || month === monthFilter) &&
        (statusFilter === "all" || training.status === statusFilter)
      )
    })
  }, [monthFilter, statusFilter, trainings, yearFilter])

  async function handleSaveTopic(payload: CreateTopicTrainingDto | UpdateTopicTrainingDto, topicId?: string) {
    try {
      if (topicId) {
        await updateTopicTraining(topicId, payload)
        toast.success("Tema actualizado")
      } else {
        await createTopicTraining(payload as CreateTopicTrainingDto)
        toast.success("Tema creado")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el tema")
    }
  }

  async function handleDeleteTopic(topicId: string) {
    try {
      await deleteTopicTraining(topicId)
      toast.success("Tema eliminado")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el tema")
    }
  }

  async function handleActivateTopic(topicId: string) {
    try {
      await activateTopicTraining(topicId)
      toast.success("Tema activado")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo activar el tema")
    }
  }

  async function handleSaveTraining(payload: CreateTrainingDto | UpdateTrainingDto, trainingId?: string) {
    try {
      if (trainingId) {
        const { status, ...trainingPayload } = payload as UpdateTrainingDto
        await updateTraining(trainingId, trainingPayload)
        if (status) {
          await changeTrainingStatus(trainingId, status as TrainingStatus)
        }
        toast.success("Capacitacion actualizada")
      } else {
        await createTraining(payload as CreateTrainingDto)
        toast.success("Capacitacion creada")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la capacitacion")
    }
  }

  async function handleDeleteTraining(trainingId: string) {
    try {
      await deleteTraining(trainingId)
      toast.success("Capacitacion eliminada")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la capacitacion")
    }
  }

  async function handleActivateTraining(trainingId: string) {
    try {
      await activateTraining(trainingId)
      toast.success("Capacitacion activada")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo activar la capacitacion")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plan Anual de Capacitaciones</h1>
          <p className="text-muted-foreground">Planifica temas, fechas y asistentes de capacitacion.</p>
        </div>
        <TrainingDialog topics={topicOptions} employees={employees} onSave={handleSaveTraining} />
      </div>

      <Tabs defaultValue="trainings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trainings">Capacitaciones</TabsTrigger>
          <TabsTrigger value="topics">Temas</TabsTrigger>
        </TabsList>

        <TabsContent value="trainings" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="grid gap-1">
                  <Label>Año</Label>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label>Mes</Label>
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label>Estado</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {trainingStatusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTrainings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Sin capacitaciones registradas</p>
                <p className="text-sm text-muted-foreground">Crea un tema y programa la primera capacitacion.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTrainings.map((training) => (
                <Card key={training.id}>
                  <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{training.topic?.name ?? training.topicId}</h3>
                        <Badge variant="outline">{getTrainingTypeLabel(training.type)}</Badge>
                        <Badge
                          variant={
                            training.status === "ACTIVE"
                              ? "accentActivd"
                              : training.status === "INACTIVE"
                                ? "destructive"
                                : "secondary"
                          }
                          className={getTrainingStatusBadgeClassName(training.status)}
                        >
                          {getTrainingStatusLabel(training.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(training.date)} · {training.durationHours} horas
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/trainingPlan/${training.id}`}>
                        <Button variant="action" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Detalle
                        </Button>
                      </Link>
                      <TrainingDialog training={training} topics={topicOptions} employees={employees} onSave={handleSaveTraining} />
                      {training.status === "ACTIVE" ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleDeleteTraining(training.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleActivateTraining(training.id)}>
                          <Power className="h-4 w-4" />
                          Activar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="topics">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Temas de capacitacion</CardTitle>
              <TopicDialog onSave={handleSaveTopic} />
            </CardHeader>
            <CardContent>
              {topics.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No hay temas registrados.
                </div>
              ) : (
                <div className="space-y-3">
                  {topics.map((topic) => (
                    <div key={topic.id} className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{topic.name}</h3>
                          <Badge variant={topic.status === "ACTIVE" ? "accentActivd" : "destructive"}>{topic.status}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{topic.description || "Sin descripcion"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <TopicDialog topic={topic} onSave={handleSaveTopic} />
                        {topic.status === "ACTIVE" ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDeleteTopic(topic.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => handleActivateTopic(topic.id)}>
                            <Power className="h-4 w-4" />
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
