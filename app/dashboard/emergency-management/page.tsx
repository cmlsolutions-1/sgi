"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { CalendarDays, Edit, Loader2, Plus, Power, Search, X } from "lucide-react"
import { toast } from "sonner"

import { EmergencyDocumentPanel } from "@/components/emergency/EmergencyDocumentPanel"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  changeEmergencyManagementStatus,
  createEmergencyManagement,
  listEmergencyManagement,
  updateEmergencyManagement,
} from "@/services/emergencyService"
import type {
  EmergencyManagement,
  EmergencyStatus,
  UpsertEmergencyManagementDto,
} from "@/types/manager/emergency"

const emptyForm: UpsertEmergencyManagementDto = {
  planName: "",
  version: "1.0",
  preparationDate: "",
  effectiveDate: "",
  observations: "",
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function statusLabel(status: EmergencyStatus) {
  return status === "ACTIVE" ? "Activo" : "Inactivo"
}

function statusClassName(status: EmergencyStatus) {
  return status === "ACTIVE"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-destructive text-white border-transparent"
}

type EmergencyManagementDialogProps = {
  open: boolean
  plan: EmergencyManagement | null
  onClose: () => void
  onSave: (payload: UpsertEmergencyManagementDto) => Promise<void>
}

function EmergencyManagementDialog({ open, plan, onClose, onSave }: EmergencyManagementDialogProps) {
  const [form, setForm] = useState<UpsertEmergencyManagementDto>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      plan
        ? {
            planName: plan.planName ?? "",
            version: plan.version ?? "1.0",
            preparationDate: formatDate(plan.preparationDate),
            effectiveDate: formatDate(plan.effectiveDate),
            observations: plan.observations ?? "",
          }
        : emptyForm,
    )
  }, [open, plan])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.planName.trim()) {
      toast.error("Ingresa el nombre del plan")
      return
    }

    if (!form.version.trim()) {
      toast.error("Ingresa la versión del plan")
      return
    }

    if (!form.preparationDate || !form.effectiveDate) {
      toast.error("Selecciona la fecha de elaboración y la fecha de vigencia")
      return
    }

    if (form.effectiveDate < form.preparationDate) {
      toast.error("La fecha de vigencia debe ser igual o posterior a la fecha de elaboración")
      return
    }

    if (!form.observations.trim()) {
      toast.error("Ingresa las observaciones del plan")
      return
    }

    setSaving(true)
    try {
      await onSave({
        planName: form.planName.trim(),
        version: form.version.trim(),
        preparationDate: form.preparationDate,
        effectiveDate: form.effectiveDate,
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
          <DialogTitle>{plan ? "Editar plan de emergencia" : "Nuevo plan de emergencia"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nombre del plan</Label>
              <Input
                value={form.planName}
                onChange={(event) => setForm((current) => ({ ...current, planName: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Versión</Label>
              <Input
                value={form.version}
                onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Fecha de elaboración</Label>
              <Input
                type="date"
                value={form.preparationDate}
                onChange={(event) => setForm((current) => ({ ...current, preparationDate: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Fecha de vigencia</Label>
              <Input
                type="date"
                value={form.effectiveDate}
                min={form.preparationDate || undefined}
                onChange={(event) => setForm((current) => ({ ...current, effectiveDate: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Observaciones</Label>
            <Textarea
              rows={4}
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

export default function EmergencyManagementPage() {
  const [plans, setPlans] = useState<EmergencyManagement[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<EmergencyManagement | null>(null)
  const [statusFilter, setStatusFilter] = useState<EmergencyStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const activePlans = useMemo(() => plans.filter((plan) => plan.status === "ACTIVE").length, [plans])

  async function loadData() {
    setLoading(true)
    try {
      const data = await listEmergencyManagement({
        status: statusFilter,
        search: search.trim(),
        startDate,
        endDate,
      })
      setPlans(data.items ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar los planes de emergencia")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loadData()
  }

  async function handleSave(payload: UpsertEmergencyManagementDto) {
    try {
      if (editingPlan) {
        await updateEmergencyManagement(editingPlan.id, payload)
        toast.success("Plan de emergencia actualizado")
      } else {
        await createEmergencyManagement(payload)
        toast.success("Plan de emergencia creado")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el plan")
      throw error
    }
  }

  async function handleChangeStatus(plan: EmergencyManagement) {
    const nextStatus: EmergencyStatus = plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"

    try {
      await changeEmergencyManagementStatus(plan.id, nextStatus)
      toast.success(nextStatus === "ACTIVE" ? "Plan activado" : "Plan inactivado")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado")
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Emergencias</h1>
          <p className="text-muted-foreground">Administra planes, vigencias y evidencias del plan de emergencia.</p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            setEditingPlan(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo plan
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-2xl font-bold text-slate-900">{plans.length}</p>
              <p className="text-sm text-slate-500">Planes registrados</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-2xl font-bold text-emerald-600">{activePlans}</p>
              <p className="text-sm text-slate-500">Planes activos</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-2xl font-bold text-slate-900">{plans.length - activePlans}</p>
              <p className="text-sm text-slate-500">Planes inactivos</p>
            </div>
          </div>

          <form onSubmit={handleFilter} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px_160px_auto]">
            <div className="grid gap-2">
              <Label>Buscar</Label>
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o versión" />
            </div>
            <div className="grid gap-2">
              <Label>Desde</Label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Hasta</Label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
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
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">No hay planes de emergencia registrados.</CardContent>
        </Card>
      ) : (
        <section className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{plan.planName}</h2>
                      <Badge className={statusClassName(plan.status)}>{statusLabel(plan.status)}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">Versión {plan.version}</p>
                    <p className="mt-3 text-sm text-slate-600">{plan.observations}</p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Elaboración: {formatDate(plan.preparationDate)}
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Vigencia: {formatDate(plan.effectiveDate)}
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
                        setEditingPlan(plan)
                        setDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => handleChangeStatus(plan)}>
                      <Power className="h-4 w-4" />
                      {plan.status === "ACTIVE" ? "Inactivar" : "Activar"}
                    </Button>
                  </div>
                </div>

                <EmergencyDocumentPanel owner="management" ownerId={plan.id} />
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <EmergencyManagementDialog
        open={dialogOpen}
        plan={editingPlan}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </main>
  )
}
