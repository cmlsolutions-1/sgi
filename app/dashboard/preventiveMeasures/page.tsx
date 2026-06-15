"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Plus, Search, Clock, CheckCircle, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  createPreventiveMeasure,
  deletePreventiveMeasure,
  listPreventiveMeasures,
  updatePreventiveMeasure,
} from "@/services/preventiveMeasureService"
import { listRisks } from "@/services/riskService"
import {
  getPreventiveProceduresFilled,
  type PreventiveProcedureFilled,
} from "@/lib/preventive-procedure-storage"
import type { Risk } from "@/types/manager/risk"
import type {
  PreventiveMeasure,
  PreventiveMeasureAction,
  PreventiveMeasureKey,
  PreventiveMeasureStatus,
  PreventiveMeasureType,
  UpsertPreventiveMeasureDto,
} from "@/types/manager/preventiveMeasure"

type SourceType = "PROCEDURE" | "RISK" | "FREE"

type MeasureForm = {
  sourceType: SourceType
  procedureId: string
  riskId: string
  key: PreventiveMeasureKey
  title: string
  description: string
  type: PreventiveMeasureType
  dueDate: string
  status: PreventiveMeasureStatus
  doneDate: string
  accion: PreventiveMeasureAction
}

const emptyForm: MeasureForm = {
  sourceType: "FREE",
  procedureId: "",
  riskId: "",
  key: "ELIMINACION",
  title: "",
  description: "",
  type: "DATE",
  dueDate: "",
  status: "PENDING",
  doneDate: "",
  accion: "PREVENTIVA",
}

const measureFieldControlClassName =
  "mt-1 w-full border-slate-400 bg-white shadow-sm hover:border-slate-500 focus-visible:border-primary focus-visible:ring-primary/25"

const statusConfig = {
  PENDING: { icon: Clock, color: "text-warning", label: "Pendiente" },
  DONE: { icon: CheckCircle, color: "text-accent", label: "Cumplida" },
} satisfies Record<PreventiveMeasureStatus, { icon: typeof Clock; color: string; label: string }>

const keyLabels: Record<PreventiveMeasureKey, string> = {
  ELIMINACION: "Eliminación",
  SUSTITUCION: "Sustitución",
  INGENIERIA: "Ingeniería",
  ADMINISTRATIVOS: "Administrativos",
  EPP: "EPP",
}

const actionLabels: Record<PreventiveMeasureAction, string> = {
  PREVENTIVA: "Preventiva",
  CORRECION: "Corrección",
  MEJORA: "Mejora",
}

function riskLabel(risk: Risk) {
  return [risk.process, risk.activity, risk.task].filter(Boolean).join(" / ")
}

function procedureLabel(procedure: PreventiveProcedureFilled) {
  return [procedure.documentName, procedure.department, procedure.workArea].filter(Boolean).join(" / ")
}

function buildPayload(form: MeasureForm): UpsertPreventiveMeasureDto {
  return {
    ...(form.sourceType === "RISK" && form.riskId ? { riskId: form.riskId } : {}),
    key: form.key,
    title: form.title.trim(),
    description: form.description.trim(),
    type: form.type,
    ...(form.type === "DATE" && form.dueDate ? { dueDate: form.dueDate } : {}),
    status: form.status,
    ...(form.status === "DONE" && form.doneDate ? { doneDate: form.doneDate } : {}),
    accion: form.accion,
  }
}

export default function PreventiveMeasuresPage() {
  const [measures, setMeasures] = useState<PreventiveMeasure[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [procedures, setProcedures] = useState<PreventiveProcedureFilled[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [keyFilter, setKeyFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const [openModal, setOpenModal] = useState(false)
  const [editingMeasure, setEditingMeasure] = useState<PreventiveMeasure | null>(null)
  const [form, setForm] = useState<MeasureForm>(emptyForm)

  async function loadData() {
    setLoading(true)
    const [measureResult, riskResult] = await Promise.allSettled([
      listPreventiveMeasures({
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter as PreventiveMeasureStatus } : {}),
        ...(actionFilter !== "all" ? { accion: actionFilter as PreventiveMeasureAction } : {}),
        ...(keyFilter !== "all" ? { key: keyFilter as PreventiveMeasureKey } : {}),
        ...(typeFilter !== "all" ? { type: typeFilter as PreventiveMeasureType } : {}),
      }),
      listRisks(),
    ])

    if (measureResult.status === "fulfilled") {
      setMeasures(measureResult.value.items ?? [])
    } else {
      toast.error(
        measureResult.reason instanceof Error
          ? measureResult.reason.message
          : "No se pudo cargar las medidas de prevención",
      )
    }

    if (riskResult.status === "fulfilled") {
      setRisks(riskResult.value.items ?? [])
    } else {
      toast.error(riskResult.reason instanceof Error ? riskResult.reason.message : "No se pudo cargar los riesgos")
    }

    setProcedures(getPreventiveProceduresFilled())
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [search, statusFilter, actionFilter, keyFilter, typeFilter])

  const filtered = useMemo(() => {
    const query = search.toLowerCase()

    return measures.filter((measure) => {
      const riskText = measure.risk
        ? `${measure.risk.process} ${measure.risk.activity} ${measure.risk.task}`.toLowerCase()
        : ""
      const matchesSearch =
        measure.title.toLowerCase().includes(query) ||
        measure.description.toLowerCase().includes(query) ||
        riskText.includes(query)

      const matchesStatus = statusFilter === "all" || measure.status === statusFilter
      const matchesAction = actionFilter === "all" || measure.accion === actionFilter
      const matchesKey = keyFilter === "all" || measure.key === keyFilter
      const matchesType = typeFilter === "all" || measure.type === typeFilter
      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "RISK" && Boolean(measure.riskId)) ||
        (sourceFilter === "FREE" && !measure.riskId)

      return matchesSearch && matchesStatus && matchesAction && matchesKey && matchesType && matchesSource
    })
  }, [measures, search, statusFilter, actionFilter, keyFilter, typeFilter, sourceFilter])

  const stats = useMemo(() => {
    return {
      total: measures.length,
      pending: measures.filter((measure) => measure.status === "PENDING").length,
      done: measures.filter((measure) => measure.status === "DONE").length,
      riskBased: measures.filter((measure) => Boolean(measure.riskId)).length,
    }
  }, [measures])

  function resetModal() {
    setEditingMeasure(null)
    setForm(emptyForm)
    setOpenModal(false)
  }

  function openCreateModal() {
    setEditingMeasure(null)
    setForm(emptyForm)
    setOpenModal(true)
  }

  function openEditModal(measure: PreventiveMeasure) {
    setEditingMeasure(measure)
    setForm({
      sourceType: measure.riskId ? "RISK" : "FREE",
      procedureId: "",
      riskId: measure.riskId ?? "",
      key: measure.key,
      title: measure.title,
      description: measure.description,
      type: measure.type,
      dueDate: measure.dueDate ?? "",
      status: measure.status,
      doneDate: measure.doneDate ?? "",
      accion: measure.accion,
    })
    setOpenModal(true)
  }

  function handleSourceChange(value: SourceType) {
    setForm((current) => ({
      ...current,
      sourceType: value,
      procedureId: "",
      riskId: "",
      title: value === "FREE" ? current.title : "",
      description: value === "FREE" ? current.description : "",
    }))
  }

  function handleProcedureChange(procedureId: string) {
    const procedure = procedures.find((item) => item.id === procedureId)
    setForm((current) => ({
      ...current,
      procedureId,
      title: procedure?.documentName || "Procedimiento - Medidas de Prevención",
      description: procedure
        ? `Procedimiento: ${procedureLabel(procedure)}. Actividades: ${procedure.activities}`
        : current.description,
    }))
  }

  function handleRiskChange(riskId: string) {
    const risk = risks.find((item) => item.id === riskId)
    setForm((current) => ({
      ...current,
      riskId,
      title: risk ? `Medida para ${risk.process}` : current.title,
      description: risk ? `Riesgo: ${riskLabel(risk)}. Efectos: ${risk.possibleEffects}` : current.description,
    }))
  }

  async function saveMeasure() {
    if (form.sourceType === "PROCEDURE" && !form.procedureId) {
      toast.error("Selecciona un procedimiento.")
      return
    }

    if (form.sourceType === "RISK" && !form.riskId) {
      toast.error("Selecciona un riesgo.")
      return
    }

    if (!form.title.trim()) {
      toast.error("Escribe el título de la medida.")
      return
    }

    if (!form.description.trim()) {
      toast.error("Escribe la descripción de la medida.")
      return
    }

    if (form.type === "DATE" && !form.dueDate) {
      toast.error("Selecciona una fecha límite.")
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload(form)
      if (editingMeasure) {
        await updatePreventiveMeasure(editingMeasure.id, payload)
        toast.success("Medida actualizada")
      } else {
        await createPreventiveMeasure(payload)
        toast.success("Medida creada")
      }

      resetModal()
      await loadData()
    } catch (error) {
    } finally {
      setSaving(false)
    }
  }

  async function removeMeasure(measure: PreventiveMeasure) {
    const confirmed = window.confirm(`¿Eliminar la medida "${measure.title}"?`)
    if (!confirmed) return

    try {
      await deletePreventiveMeasure(measure.id)
      toast.success("Medida eliminada")
      await loadData()
    } catch (error) {
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medidas de Prevención</h1>
          <p className="text-muted-foreground">
            Crea acciones preventivas desde procedimientos, riesgos laborales o medidas independientes.
          </p>
        </div>

        <Dialog open={openModal} onOpenChange={(value) => (value ? setOpenModal(true) : resetModal())}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Nueva Medida
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle>{editingMeasure ? "Editar Medida de Prevención" : "Nueva Medida de Prevención"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Origen de la medida *</label>
                  <Select value={form.sourceType} onValueChange={(value) => handleSourceChange(value as SourceType)}>
                    <SelectTrigger className={measureFieldControlClassName}>
                      <SelectValue placeholder="Selecciona el origen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROCEDURE">Procedimiento</SelectItem>
                      <SelectItem value="RISK">Riesgo laboral</SelectItem>
                      <SelectItem value="FREE">Medida independiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Acción *</label>
                  <Select
                    value={form.accion}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, accion: value as PreventiveMeasureAction }))
                    }
                  >
                    <SelectTrigger className={measureFieldControlClassName}>
                      <SelectValue placeholder="Selecciona la acción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PREVENTIVA">Preventiva</SelectItem>
                      <SelectItem value="CORRECION">Corrección</SelectItem>
                      <SelectItem value="MEJORA">Mejora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.sourceType === "PROCEDURE" ? (
                <div>
                  <label className="text-sm font-medium">Procedimiento diligenciado *</label>
                  <Select value={form.procedureId} onValueChange={handleProcedureChange}>
                    <SelectTrigger className={measureFieldControlClassName}>
                      <SelectValue placeholder="Selecciona un procedimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedures.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No hay procedimientos diligenciados
                        </SelectItem>
                      ) : (
                        procedures.map((procedure) => (
                          <SelectItem key={procedure.id} value={procedure.id}>
                            {procedureLabel(procedure)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    El backend no recibe un id de procedimiento; se conservará la trazabilidad en título y descripción.
                  </p>
                </div>
              ) : null}

              {form.sourceType === "RISK" ? (
                <div>
                  <label className="text-sm font-medium">Riesgo laboral *</label>
                  <Select value={form.riskId} onValueChange={handleRiskChange}>
                    <SelectTrigger className={measureFieldControlClassName}>
                      <SelectValue placeholder="Selecciona un riesgo" />
                    </SelectTrigger>
                    <SelectContent>
                      {risks.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No hay riesgos creados
                        </SelectItem>
                      ) : (
                        risks.map((risk) => (
                          <SelectItem key={risk.id} value={risk.id}>
                            {riskLabel(risk)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input
                  className={measureFieldControlClassName}
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Ej: Instalar baranda en plataforma elevada"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descripción *</label>
                <Textarea
                  className={measureFieldControlClassName}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe la medida, alcance y controles esperados."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Jerarquía *</label>
                  <Select
                    value={form.key}
                    onValueChange={(value) => setForm((current) => ({ ...current, key: value as PreventiveMeasureKey }))}
                  >
                    <SelectTrigger className={measureFieldControlClassName}>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ELIMINACION">Eliminación</SelectItem>
                      <SelectItem value="SUSTITUCION">Sustitución</SelectItem>
                      <SelectItem value="INGENIERIA">Ingeniería</SelectItem>
                      <SelectItem value="ADMINISTRATIVOS">Administrativos</SelectItem>
                      <SelectItem value="EPP">EPP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Tipo *</label>
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, type: value as PreventiveMeasureType }))
                    }
                  >
                    <SelectTrigger className={measureFieldControlClassName}>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DATE">Por fecha</SelectItem>
                      <SelectItem value="PERMANENT">Permanente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Estado *</label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        status: value as PreventiveMeasureStatus,
                        doneDate: value === "DONE" ? current.doneDate || new Date().toISOString().slice(0, 10) : "",
                      }))
                    }
                  >
                    <SelectTrigger className={measureFieldControlClassName}>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pendiente</SelectItem>
                      <SelectItem value="DONE">Cumplida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {form.type === "DATE" ? (
                  <div>
                    <label className="text-sm font-medium">Fecha límite *</label>
                    <Input
                      className={measureFieldControlClassName}
                      type="date"
                      value={form.dueDate}
                      onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                    />
                  </div>
                ) : null}

                {form.status === "DONE" ? (
                  <div>
                    <label className="text-sm font-medium">Fecha de cumplimiento</label>
                    <Input
                      className={measureFieldControlClassName}
                      type="date"
                      value={form.doneDate}
                      onChange={(event) => setForm((current) => ({ ...current, doneDate: event.target.value }))}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetModal} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={saveMeasure} disabled={saving}>
                  {saving ? "Guardando..." : editingMeasure ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Medidas</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cumplidas</p>
            <p className="text-2xl font-bold text-accent">{stats.done}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Desde riesgos</p>
            <p className="text-2xl font-bold">{stats.riskBased}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            <div className="relative md:col-span-2 xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descripción o riesgo..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10 bg-secondary border-0"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full bg-secondary border-0">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="DONE">Cumplida</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full bg-secondary border-0">
                <SelectValue placeholder="Acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="PREVENTIVA">Preventiva</SelectItem>
                <SelectItem value="CORRECION">Corrección</SelectItem>
                <SelectItem value="MEJORA">Mejora</SelectItem>
              </SelectContent>
            </Select>

            <Select value={keyFilter} onValueChange={setKeyFilter}>
              <SelectTrigger className="w-full bg-secondary border-0">
                <SelectValue placeholder="Jerarquía" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las jerarquías</SelectItem>
                <SelectItem value="ELIMINACION">Eliminación</SelectItem>
                <SelectItem value="SUSTITUCION">Sustitución</SelectItem>
                <SelectItem value="INGENIERIA">Ingeniería</SelectItem>
                <SelectItem value="ADMINISTRATIVOS">Administrativos</SelectItem>
                <SelectItem value="EPP">EPP</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full bg-secondary border-0">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="DATE">Por fecha</SelectItem>
                <SelectItem value="PERMANENT">Permanente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full bg-secondary border-0">
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los orígenes</SelectItem>
                <SelectItem value="RISK">Desde riesgo</SelectItem>
                <SelectItem value="FREE">Sin riesgo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-sm text-muted-foreground">Cargando medidas...</CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay medidas que coincidan con los filtros. Crea una nueva medida para empezar.
            </CardContent>
          </Card>
        ) : (
          filtered.map((measure) => {
            const status = statusConfig[measure.status]
            const StatusIcon = status.icon

            return (
              <Card
                key={measure.id}
                className="bg-card border-border hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-xs", status.color)}>
                          {status.label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {keyLabels[measure.key]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {actionLabels[measure.accion]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {measure.type === "DATE" ? "Por fecha" : "Permanente"}
                        </Badge>
                      </div>

                      <p className="text-sm font-medium">{measure.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{measure.description}</p>

                      {measure.risk ? (
                        <p className="text-xs text-muted-foreground mt-2">
                          Riesgo vinculado: {measure.risk.process} / {measure.risk.activity} / {measure.risk.task}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">Sin riesgo vinculado</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusIcon className={cn("h-4 w-4", status.color)} />
                      <Badge variant="secondary" className="text-xs">
                        {status.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {measure.type === "DATE" ? `Fecha límite: ${measure.dueDate || "Sin fecha"}` : "Medida permanente"}
                      {measure.doneDate ? ` · Cumplida: ${measure.doneDate}` : ""}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditModal(measure)}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => removeMeasure(measure)}>
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
