"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Edit, Loader2, Plus, Power, Search, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { EmergencyDocumentPanel } from "@/components/emergency/EmergencyDocumentPanel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  changeEmergencyBrigadeStatus,
  createEmergencyBrigade,
  listEmergencyBrigades,
  updateEmergencyBrigade,
} from "@/services/emergencyService"
import { listEmployees } from "@/services/employeeService"
import type {
  BrigadeType,
  EmergencyBrigade,
  EmergencyStatus,
  UpsertEmergencyBrigadeDto,
} from "@/types/manager/emergency"
import type { Employee } from "@/types/manager/employee"

const BRIGADE_TYPES: Array<{ value: BrigadeType; label: string }> = [
  { value: "EVACUATION", label: "Evacuación" },
  { value: "FIRST_AID", label: "Primeros auxilios" },
  { value: "FIRE_PREVENTION_AND_CONTROL", label: "Prevención y control de incendios" },
  { value: "SEARCH_AND_RESCUE", label: "Búsqueda y rescate" },
  { value: "COMMUNICATION_AND_INFORMATION", label: "Comunicación e información" },
]

const emptyForm: UpsertEmergencyBrigadeDto = {
  objective: "",
  functions: "",
  observations: "",
  employeeIds: [],
  brigadeType: "EVACUATION",
}

function brigadeTypeLabel(type: BrigadeType) {
  return BRIGADE_TYPES.find((item) => item.value === type)?.label ?? type
}

function employeeName(employee?: Pick<Employee, "name" | "lastName" | "email"> | null) {
  if (!employee) return "Funcionario"
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "Funcionario"
}

function statusLabel(status: EmergencyStatus) {
  return status === "ACTIVE" ? "Activo" : "Inactivo"
}

function statusClassName(status: EmergencyStatus) {
  return status === "ACTIVE"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-destructive text-white border-transparent"
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

type EmergencyBrigadeDialogProps = {
  open: boolean
  brigade: EmergencyBrigade | null
  employees: Employee[]
  loadingEmployees: boolean
  onClose: () => void
  onSave: (payload: UpsertEmergencyBrigadeDto) => Promise<void>
}

function EmergencyBrigadeDialog({
  open,
  brigade,
  employees,
  loadingEmployees,
  onClose,
  onSave,
}: EmergencyBrigadeDialogProps) {
  const [form, setForm] = useState<UpsertEmergencyBrigadeDto>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      brigade
        ? {
            objective: brigade.objective ?? "",
            functions: brigade.functions ?? "",
            observations: brigade.observations ?? "",
            employeeIds: brigade.employeeIds ?? brigade.employees?.map((employee) => employee.id) ?? [],
            brigadeType: brigade.brigadeType,
          }
        : emptyForm,
    )
  }, [brigade, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.objective.trim()) {
      toast.error("Ingresa el objetivo de la brigada")
      return
    }

    if (!form.functions.trim()) {
      toast.error("Ingresa las funciones de la brigada")
      return
    }

    if (!form.observations.trim()) {
      toast.error("Ingresa las observaciones")
      return
    }

    setSaving(true)
    try {
      await onSave({
        objective: form.objective.trim(),
        functions: form.functions.trim(),
        observations: form.observations.trim(),
        employeeIds: Array.from(new Set(form.employeeIds)),
        brigadeType: form.brigadeType,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{brigade ? "Editar brigada de emergencia" : "Nueva brigada de emergencia"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Tipo de brigada</Label>
            <select
              value={form.brigadeType}
              onChange={(event) => setForm((current) => ({ ...current, brigadeType: event.target.value as BrigadeType }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {BRIGADE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Objetivo</Label>
              <Textarea
                rows={4}
                value={form.objective}
                onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Funciones</Label>
              <Textarea
                rows={4}
                value={form.functions}
                onChange={(event) => setForm((current) => ({ ...current, functions: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Observaciones</Label>
            <Textarea
              rows={3}
              value={form.observations}
              onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
            />
          </div>

          <section className="rounded-md border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Integrantes</h3>
                <p className="text-xs text-muted-foreground">Selecciona los funcionarios que harán parte de la brigada.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    employeeIds:
                      current.employeeIds.length === employees.length ? [] : employees.map((employee) => employee.id),
                  }))
                }
              >
                {form.employeeIds.length === employees.length ? "Limpiar" : "Seleccionar todos"}
              </Button>
            </div>
            <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
              {loadingEmployees && employees.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando funcionarios...
                </div>
              ) : employees.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay funcionarios disponibles para seleccionar.</p>
              ) : (
                employees.map((employee) => (
                  <label key={employee.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
                    <Checkbox
                      checked={form.employeeIds.includes(employee.id)}
                      onCheckedChange={() =>
                        setForm((current) => ({ ...current, employeeIds: toggleId(current.employeeIds, employee.id) }))
                      }
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{employeeName(employee)}</span>
                      <span className="block truncate text-xs text-muted-foreground">{employee.email}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </section>

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

export default function EmergencyBrigadesPage() {
  const [brigades, setBrigades] = useState<EmergencyBrigade[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBrigade, setEditingBrigade] = useState<EmergencyBrigade | null>(null)
  const [statusFilter, setStatusFilter] = useState<EmergencyStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<BrigadeType | "all">("all")
  const [search, setSearch] = useState("")

  const activeCount = useMemo(() => brigades.filter((brigade) => brigade.status === "ACTIVE").length, [brigades])
  const membersCount = useMemo(
    () => new Set(brigades.flatMap((brigade) => brigade.employeeIds ?? brigade.employees?.map((employee) => employee.id) ?? [])).size,
    [brigades],
  )

  async function loadData() {
    setLoading(true)
    const [brigadeResult, employeeResult] = await Promise.allSettled([
      listEmergencyBrigades({
        status: statusFilter,
        brigadeType: typeFilter,
        search: search.trim(),
      }),
      listEmployees(),
    ])

    if (brigadeResult.status === "fulfilled") {
      setBrigades(brigadeResult.value.items ?? [])
    } else {
      toast.error(
        brigadeResult.reason instanceof Error
          ? brigadeResult.reason.message
          : "No se pudo cargar las brigadas de emergencia",
      )
    }

    if (employeeResult.status === "fulfilled") {
      setEmployees(employeeResult.value)
    } else {
      toast.error(
        employeeResult.reason instanceof Error
          ? employeeResult.reason.message
          : "No se pudo cargar los funcionarios para la brigada",
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter])

  async function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loadData()
  }

  async function handleSave(payload: UpsertEmergencyBrigadeDto) {
    try {
      if (editingBrigade) {
        await updateEmergencyBrigade(editingBrigade.id, payload)
        toast.success("Brigada actualizada")
      } else {
        await createEmergencyBrigade(payload)
        toast.success("Brigada creada")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la brigada")
      throw error
    }
  }

  async function handleChangeStatus(brigade: EmergencyBrigade) {
    const nextStatus: EmergencyStatus = brigade.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await changeEmergencyBrigadeStatus(brigade.id, nextStatus)
      toast.success(nextStatus === "ACTIVE" ? "Brigada activada" : "Brigada inactivada")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado")
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brigada de Emergencias</h1>
          <p className="text-muted-foreground">Organiza brigadas, funciones, integrantes y soportes documentales.</p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            setEditingBrigade(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nueva brigada
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-2xl font-bold text-slate-900">{brigades.length}</p>
              <p className="text-sm text-slate-500">Brigadas registradas</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
              <p className="text-sm text-slate-500">Brigadas activas</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-2xl font-bold text-slate-900">{membersCount}</p>
              <p className="text-sm text-slate-500">Integrantes vinculados</p>
            </div>
          </div>

          <form onSubmit={handleFilter} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px_160px_auto]">
            <div className="grid gap-2">
              <Label>Buscar</Label>
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Objetivo o funciones" />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as BrigadeType | "all")}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Todos</option>
                {BRIGADE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as EmergencyStatus | "all")}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Todos</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
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
      ) : brigades.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">No hay brigadas registradas.</CardContent>
        </Card>
      ) : (
        <section className="grid gap-4">
          {brigades.map((brigade) => (
            <Card key={brigade.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{brigadeTypeLabel(brigade.brigadeType)}</h2>
                      <Badge className={statusClassName(brigade.status)}>{statusLabel(brigade.status)}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{brigade.objective}</p>
                    <p className="mt-2 text-sm text-slate-600">{brigade.functions}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                      <UsersRound className="h-4 w-4" />
                      {brigade.employees?.length ?? brigade.employeeIds?.length ?? 0} integrantes
                    </div>
                    {brigade.employees?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {brigade.employees.map((employee) => (
                          <Badge key={employee.id} variant="outline">
                            {employeeName(employee)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setEditingBrigade(brigade)
                        setDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => handleChangeStatus(brigade)}>
                      <Power className="h-4 w-4" />
                      {brigade.status === "ACTIVE" ? "Inactivar" : "Activar"}
                    </Button>
                  </div>
                </div>

                <EmergencyDocumentPanel owner="brigade" ownerId={brigade.id} />
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <EmergencyBrigadeDialog
        open={dialogOpen}
        brigade={editingBrigade}
        employees={employees}
        loadingEmployees={loading}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </main>
  )
}
