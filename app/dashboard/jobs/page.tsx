"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { BriefcaseBusiness, Edit, Loader2, Plus, Search, Trash2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { activateJob, createJob, deleteJob, listJobs, updateJob } from "@/services/jobService"
import { listWorkAreaOptions } from "@/services/workAreaService"
import type { Job, JobStatus } from "@/types/manager/job"
import type { WorkAreaOption } from "@/types/manager/work-area"

type FormState = {
  id?: string
  name: string
  description: string
  workAreaId: string
  status: JobStatus
}

const emptyForm: FormState = {
  name: "",
  description: "",
  workAreaId: "",
  status: "ACTIVE",
}

const fieldControlClassName =
  "w-full border-slate-300 bg-white shadow-sm hover:border-slate-400 focus-visible:border-primary focus-visible:ring-primary/25"

export function JobsManager() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [workAreas, setWorkAreas] = useState<WorkAreaOption[]>([])
  const [search, setSearch] = useState("")
  const [workAreaFilter, setWorkAreaFilter] = useState("all")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.name.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.workArea?.name?.toLowerCase().includes(query)
      const matchesArea = workAreaFilter === "all" || job.workAreaId === workAreaFilter

      return matchesSearch && matchesArea
    })
  }, [jobs, search, workAreaFilter])

  async function loadData() {
    setLoading(true)
    try {
      const [jobsData, workAreasData] = await Promise.all([listJobs(), listWorkAreaOptions()])
      setJobs(jobsData.items ?? [])
      setWorkAreas(workAreasData)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo cargar puestos de trabajo")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openCreateDialog() {
    setForm(emptyForm)
    setOpen(true)
  }

  function openEditDialog(job: Job) {
    setForm({
      id: job.id,
      name: job.name,
      description: job.description,
      workAreaId: job.workAreaId,
      status: job.status,
    })
    setOpen(true)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error("El nombre del puesto es requerido")
      return
    }

    if (!form.workAreaId) {
      toast.error("Selecciona un area de trabajo")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        workAreaId: form.workAreaId,
      }

      if (form.id) {
        await updateJob(form.id, { ...payload, status: form.status })
        toast.success("Puesto actualizado")
      } else {
        await createJob(payload)
        toast.success("Puesto creado")
      }

      setOpen(false)
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar el puesto")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(job: Job) {
    if (!window.confirm(`Eliminar el puesto "${job.name}"?`)) return

    try {
      await deleteJob(job.id)
      toast.success("Puesto eliminado")
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar el puesto")
    }
  }

  async function handleActivate(job: Job) {
    try {
      await activateJob(job.id)
      toast.success("Puesto activado")
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo activar el puesto")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Puestos de trabajo</h1>
          <p className="text-muted-foreground">Crea cargos asociados a las areas de trabajo.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2" disabled={workAreas.length === 0}>
              <Plus className="h-4 w-4" />
              Nuevo puesto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{form.id ? "Editar puesto" : "Crear puesto"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="job-name">Nombre</Label>
                  <Input
                    id="job-name"
                    className={fieldControlClassName}
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ej: Analista SST"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="job-work-area">Area de trabajo</Label>
                  <Select
                    value={form.workAreaId}
                    onValueChange={(value) => setForm((current) => ({ ...current, workAreaId: value }))}
                  >
                    <SelectTrigger id="job-work-area" className={fieldControlClassName}>
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
                {form.id && (
                  <div className="grid gap-2">
                    <Label>Estado</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value: JobStatus) => setForm((current) => ({ ...current, status: value }))}
                    >
                      <SelectTrigger className={fieldControlClassName}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="INACTIVE">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="job-description">Descripcion</Label>
                  <Textarea
                    id="job-description"
                    className={fieldControlClassName}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Describe el puesto de trabajo"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar puesto"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {workAreas.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Primero debes crear al menos un area de trabajo para registrar puestos.
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar puesto o area..."
                className="pl-10"
              />
            </div>
            <Select value={workAreaFilter} onValueChange={setWorkAreaFilter}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las areas</SelectItem>
                {workAreas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-medium">{filteredJobs.length} puestos encontrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Puesto</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Area</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Descripcion</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Estado</th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BriefcaseBusiness className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{job.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm">{job.workArea?.name ?? "Sin area"}</td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">{job.description || "Sin descripcion"}</td>
                    <td className="px-2 py-3">
                      <Badge variant={job.status === "ACTIVE" ? "accentActivd" : "destructive"}>{job.status}</Badge>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex justify-end gap-1">
                        {job.status !== "ACTIVE" && (
                          <Button variant="accentActivd" size="sm" onClick={() => handleActivate(job)}>
                            Activar
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(job)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(job)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredJobs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-10 text-center text-sm text-muted-foreground">
                      No hay puestos de trabajo para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function JobsPage() {
  return <JobsManager />
}
