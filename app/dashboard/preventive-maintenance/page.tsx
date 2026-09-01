"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Edit,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Power,
  Search,
  Upload,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { PreventiveMaintenanceDocumentPanel } from "@/components/preventive-maintenance/PreventiveMaintenanceDocumentPanel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { listEmployees } from "@/services/employeeService"
import {
  changePreventiveMaintenanceStatus,
  createPreventiveMaintenance,
  listPreventiveMaintenance,
  updatePreventiveMaintenance,
} from "@/services/preventiveMaintenanceService"
import type { Employee } from "@/types/manager/employee"
import type {
  PreventiveMaintenance,
  PreventiveMaintenanceAction,
  PreventiveMaintenanceStatus,
  UpsertPreventiveMaintenanceDto,
} from "@/types/manager/preventive-maintenance"

const actionOptions: Array<{ value: PreventiveMaintenanceAction; label: string }> = [
  { value: "PREVENTIVE", label: "Preventivo" },
  { value: "CORRECTIVE", label: "Correctivo" },
  { value: "IMPROVEMENT", label: "Mejora" },
]

type ViewMode = "cards" | "list"

type MaintenanceForm = Omit<UpsertPreventiveMaintenanceDto, "date"> & {
  date: string
}

const emptyForm: MaintenanceForm = {
  action: "PREVENTIVE",
  description: "",
  date: "",
  responsibleEmployeeId: "",
  observations: "",
}

function actionLabel(action: PreventiveMaintenanceAction) {
  return actionOptions.find((option) => option.value === action)?.label ?? action
}

function statusLabel(status: PreventiveMaintenanceStatus) {
  return status === "ACTIVE" ? "Activo" : "Inactivo"
}

function statusClassName(status: PreventiveMaintenanceStatus) {
  return status === "ACTIVE"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-destructive text-white border-transparent"
}

function actionClassName(action: PreventiveMaintenanceAction) {
  if (action === "CORRECTIVE") return "bg-warning/10 text-warning border-warning/20"
  if (action === "IMPROVEMENT") return "bg-blue-600 text-white border-transparent"
  return "bg-accentActivd text-accentActivd-foreground border-transparent"
}

function employeeName(employee?: Pick<Employee, "name" | "lastName" | "email"> | null) {
  if (!employee) return "No asignado"
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "No asignado"
}

function formatDateTime(value?: string | null) {
  if (!value) return "No registrada"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 16)

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return offsetDate.toISOString().slice(0, 16)
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString()
}

type MaintenanceDialogProps = {
  open: boolean
  maintenance: PreventiveMaintenance | null
  employees: Employee[]
  loadingEmployees: boolean
  onClose: () => void
  onSave: (payload: UpsertPreventiveMaintenanceDto) => Promise<void>
}

function MaintenanceDialog({
  open,
  maintenance,
  employees,
  loadingEmployees,
  onClose,
  onSave,
}: MaintenanceDialogProps) {
  const [form, setForm] = useState<MaintenanceForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      maintenance
        ? {
            action: maintenance.action,
            description: maintenance.description ?? "",
            date: toDateTimeLocal(maintenance.date),
            responsibleEmployeeId: maintenance.responsibleEmployeeId ?? "",
            observations: maintenance.observations ?? "",
          }
        : emptyForm,
    )
  }, [maintenance, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.description.trim()) {
      toast.error("Ingresa la descripción del mantenimiento")
      return
    }

    if (!form.date) {
      toast.error("Selecciona la fecha y hora del mantenimiento")
      return
    }

    if (!form.responsibleEmployeeId) {
      toast.error("Selecciona el funcionario responsable")
      return
    }

    if (!form.observations.trim()) {
      toast.error("Ingresa las observaciones")
      return
    }

    setSaving(true)
    try {
      await onSave({
        action: form.action,
        description: form.description.trim(),
        date: toIsoDateTime(form.date),
        responsibleEmployeeId: form.responsibleEmployeeId,
        observations: form.observations.trim(),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{maintenance ? "Editar mantenimiento preventivo" : "Nuevo mantenimiento preventivo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Acción</Label>
              <select
                value={form.action}
                onChange={(event) =>
                  setForm((current) => ({ ...current, action: event.target.value as PreventiveMaintenanceAction }))
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Fecha y hora</Label>
              <Input
                type="datetime-local"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Responsable</Label>
            <select
              value={form.responsibleEmployeeId}
              onChange={(event) => setForm((current) => ({ ...current, responsibleEmployeeId: event.target.value }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{loadingEmployees ? "Cargando funcionarios..." : "Selecciona funcionario"}</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employeeName(employee)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label>Observaciones</Label>
            <Textarea
              rows={3}
              value={form.observations}
              onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function PreventiveMaintenancePage() {
  const [maintenances, setMaintenances] = useState<PreventiveMaintenance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState<PreventiveMaintenance | null>(null)
  const [documentsMaintenance, setDocumentsMaintenance] = useState<PreventiveMaintenance | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<PreventiveMaintenanceAction | "all">("all")
  const [statusFilter, setStatusFilter] = useState<PreventiveMaintenanceStatus | "all">("all")
  const [responsibleFilter, setResponsibleFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const activeCount = useMemo(
    () => maintenances.filter((maintenance) => maintenance.status === "ACTIVE").length,
    [maintenances],
  )

  async function loadData() {
    setLoading(true)
    const [maintenanceResult, employeeResult] = await Promise.allSettled([
      listPreventiveMaintenance({
        search: search.trim(),
        action: actionFilter,
        status: statusFilter,
        responsibleEmployeeId: responsibleFilter === "all" ? undefined : responsibleFilter,
        startDate: startDate ? toIsoDateTime(`${startDate}T00:00`) : undefined,
        endDate: endDate ? toIsoDateTime(`${endDate}T23:59`) : undefined,
      }),
      listEmployees(),
    ])

    if (maintenanceResult.status === "fulfilled") {
      setMaintenances(maintenanceResult.value.items ?? [])
    } else {
      toast.error(
        maintenanceResult.reason instanceof Error
          ? maintenanceResult.reason.message
          : "No se pudo cargar el mantenimiento preventivo",
      )
    }

    if (employeeResult.status === "fulfilled") {
      setEmployees(employeeResult.value)
    } else {
      toast.error(
        employeeResult.reason instanceof Error
          ? employeeResult.reason.message
          : "No se pudo cargar los funcionarios",
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, statusFilter, responsibleFilter])

  async function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loadData()
  }

  async function handleSave(payload: UpsertPreventiveMaintenanceDto) {
    try {
      if (editingMaintenance) {
        await updatePreventiveMaintenance(editingMaintenance.id, payload)
        toast.success("Mantenimiento actualizado")
      } else {
        await createPreventiveMaintenance(payload)
        toast.success("Mantenimiento creado")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el mantenimiento")
      throw error
    }
  }

  async function handleChangeStatus(maintenance: PreventiveMaintenance) {
    const nextStatus: PreventiveMaintenanceStatus = maintenance.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"

    try {
      await changePreventiveMaintenanceStatus(maintenance.id, nextStatus)
      toast.success(nextStatus === "ACTIVE" ? "Mantenimiento activado" : "Mantenimiento inactivado")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado")
    }
  }

  return (
    <main className="space-y-6 ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mantenimiento Preventivo</h1>
          <p className="text-muted-foreground">Programa, consulta y soporta las acciones de mantenimiento.</p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            setEditingMaintenance(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo mantenimiento
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="overflow-x-auto px-3 py-1">
            <div className="flex min-w-max items-center justify-center gap-2">
              <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-sm font-semibold">{maintenances.length}</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Activos</span>
                <span className="text-sm font-semibold text-green-600">{activeCount}</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Inactivos</span>
                <span className="text-sm font-semibold">{maintenances.length - activeCount}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleFilter} className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_170px_170px_190px_150px_150px_auto]">
            <div className="grid gap-2">
              <Label>Buscar</Label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Descripción u observaciones"
              />
            </div>
            <div className="grid gap-2">
              <Label>Acción</Label>
              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value as PreventiveMaintenanceAction | "all")}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Todas</option>
                {actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as PreventiveMaintenanceStatus | "all")}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Todos</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Responsable</Label>
              <select
                value={responsibleFilter}
                onChange={(event) => setResponsibleFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Todos</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employeeName(employee)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Desde</Label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Hasta</Label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            <Button type="submit" variant="outline" className="mt-8 gap-2">
              <Search className="h-4 w-4" />
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : maintenances.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No hay mantenimientos preventivos registrados.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Lista de mantenimientos</h2>
              <p className="text-sm text-muted-foreground">{maintenances.length} registros encontrados</p>
            </div>
            <div className="inline-flex w-fit rounded-md border border-border bg-secondary p-1">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "cards" ? "default" : "ghost"}
                className="h-8 gap-2"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-4 w-4" />
                Tarjetas
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                className="h-8 gap-2"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
                Lista
              </Button>
            </div>
          </div>

          {viewMode === "cards" ? (
            <section className="grid gap-4">
              {maintenances.map((maintenance) => (
                <Card key={maintenance.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900">{actionLabel(maintenance.action)}</h2>
                          <Badge className={actionClassName(maintenance.action)}>{actionLabel(maintenance.action)}</Badge>
                          <Badge className={statusClassName(maintenance.status)}>{statusLabel(maintenance.status)}</Badge>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">{maintenance.description}</p>
                        <p className="mt-2 text-sm text-slate-600">{maintenance.observations}</p>
                        <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                          <p className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            {formatDateTime(maintenance.date)}
                          </p>
                          <p className="flex items-center gap-2">
                            <UserRound className="h-4 w-4" />
                            {employeeName(maintenance.responsibleEmployee)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            setEditingMaintenance(maintenance)
                            setDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleChangeStatus(maintenance)}
                        >
                          <Power className="h-4 w-4" />
                          {maintenance.status === "ACTIVE" ? "Inactivar" : "Activar"}
                        </Button>
                      </div>
                    </div>

                    <PreventiveMaintenanceDocumentPanel maintenanceId={maintenance.id} />
                  </CardContent>
                </Card>
              ))}
            </section>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border bg-card">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Acción</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Responsable</th>
                    <th className="px-4 py-3 font-medium">Descripción</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {maintenances.map((maintenance) => (
                    <tr key={maintenance.id} className="align-middle">
                      <td className="px-4 py-3">
                        <Badge className={actionClassName(maintenance.action)}>{actionLabel(maintenance.action)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(maintenance.date)}</td>
                      <td className="px-4 py-3">
                        <p className="max-w-[220px] truncate text-muted-foreground">
                          {employeeName(maintenance.responsibleEmployee)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[320px] truncate font-medium">{maintenance.description}</p>
                        <p className="max-w-[320px] truncate text-muted-foreground">{maintenance.observations}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusClassName(maintenance.status)}>{statusLabel(maintenance.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditingMaintenance(maintenance)
                                setDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setDocumentsMaintenance(maintenance)}>
                              <Upload className="h-4 w-4" />
                              Cargar / ver archivos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleChangeStatus(maintenance)}>
                              <Power className="h-4 w-4" />
                              {maintenance.status === "ACTIVE" ? "Inactivar" : "Activar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <MaintenanceDialog
        open={dialogOpen}
        maintenance={editingMaintenance}
        employees={employees}
        loadingEmployees={loading}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      <Dialog open={Boolean(documentsMaintenance)} onOpenChange={(open) => !open && setDocumentsMaintenance(null)}>
        <DialogContent className="max-h-[88vh] w-[calc(100vw-2rem)] max-w-4xl overflow-hidden bg-card p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Documentos del mantenimiento preventivo</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-4">
            {documentsMaintenance && <PreventiveMaintenanceDocumentPanel maintenanceId={documentsMaintenance.id} />}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
