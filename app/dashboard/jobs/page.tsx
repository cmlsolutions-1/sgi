"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  BriefcaseBusiness,
  Download,
  Edit,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  activateJob,
  createJob,
  deleteJob,
  deleteJobDocument,
  downloadJobDocumentFile,
  listJobDocuments,
  listJobs,
  updateJob,
  uploadJobDocument,
} from "@/services/jobService"
import { listWorkAreaOptions } from "@/services/workAreaService"
import type { Job, JobDocument, JobRiskLevel, JobStatus } from "@/types/manager/job"
import type { WorkAreaOption } from "@/types/manager/work-area"

type FormState = {
  id?: string
  name: string
  description: string
  workAreaId: string
  status: JobStatus
  workEnvironment: string
  riskLevel: JobRiskLevel
}

type EvidenceForm = {
  file: File | null
  description: string
  isConfirmed: boolean
}

const emptyForm: FormState = {
  name: "",
  description: "",
  workAreaId: "",
  status: "ACTIVE",
  workEnvironment: "",
  riskLevel: "RIESGO_I",
}

const emptyEvidenceForm: EvidenceForm = {
  file: null,
  description: "",
  isConfirmed: true,
}

const riskLevelOptions: Array<{ value: JobRiskLevel; label: string }> = [
  { value: "RIESGO_I", label: "Riesgo I" },
  { value: "RIESGO_II", label: "Riesgo II" },
  { value: "RIESGO_III", label: "Riesgo III" },
  { value: "RIESGO_IV", label: "Riesgo IV" },
  { value: "RIESGO_V", label: "Riesgo V" },
]

const fieldControlClassName =
  "w-full border-slate-300 bg-white shadow-sm hover:border-slate-400 focus-visible:border-primary focus-visible:ring-primary/25"

function formatDateTime(value?: string | null) {
  if (!value) return "No registrada"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function riskLevelLabel(value: JobRiskLevel) {
  return riskLevelOptions.find((option) => option.value === value)?.label ?? value
}

export function JobsManager() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [workAreas, setWorkAreas] = useState<WorkAreaOption[]>([])
  const [documentsByJob, setDocumentsByJob] = useState<Record<string, JobDocument[]>>({})
  const [search, setSearch] = useState("")
  const [workAreaFilter, setWorkAreaFilter] = useState("all")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [detailJob, setDetailJob] = useState<Job | null>(null)
  const [evidenceJob, setEvidenceJob] = useState<Job | null>(null)
  const [evidenceForm, setEvidenceForm] = useState<EvidenceForm>(emptyEvidenceForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null)

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.name.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.workArea?.name?.toLowerCase().includes(query) ||
        (job.workEnvironment ?? "").toLowerCase().includes(query) ||
        riskLevelLabel(job.riskLevel).toLowerCase().includes(query)
      const matchesArea = workAreaFilter === "all" || job.workAreaId === workAreaFilter

      return matchesSearch && matchesArea
    })
  }, [jobs, search, workAreaFilter])

  const stats = useMemo(() => {
    const withEvidence = jobs.filter((job) => job.evidenceCount > 0).length

    return {
      total: jobs.length,
      active: jobs.filter((job) => job.status === "ACTIVE").length,
      inactive: jobs.filter((job) => job.status !== "ACTIVE").length,
      withEvidence,
    }
  }, [jobs])

  async function loadData() {
    setLoading(true)
    try {
      const [jobsData, workAreasData] = await Promise.all([listJobs(), listWorkAreaOptions()])
      setJobs(jobsData.items ?? [])
      setWorkAreas(workAreasData)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo cargar cargos")
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
      workEnvironment: job.workEnvironment ?? "",
      riskLevel: job.riskLevel ?? "RIESGO_I",
    })
    setOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error("El nombre del cargo es requerido")
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
        workEnvironment: form.workEnvironment.trim(),
        riskLevel: form.riskLevel,
      }

      if (form.id) {
        await updateJob(form.id, payload)
        if (form.status !== jobs.find((job) => job.id === form.id)?.status) {
          await activateJob(form.id)
        }
        toast.success("Cargo actualizado")
      } else {
        await createJob(payload)
        toast.success("Cargo creado")
      }

      setOpen(false)
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar el cargo")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(job: Job) {
    if (!window.confirm(`Eliminar el cargo "${job.name}"?`)) return

    try {
      await deleteJob(job.id)
      toast.success("Cargo eliminado")
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar el cargo")
    }
  }

  async function handleToggleStatus(job: Job) {
    try {
      await activateJob(job.id)
      toast.success(job.status === "ACTIVE" ? "Cargo inactivado" : "Cargo activado")
      await loadData()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo cambiar el estado del cargo")
    }
  }

  async function loadJobDocuments(jobId: string) {
    const documents = await listJobDocuments(jobId)
    setDocumentsByJob((current) => ({ ...current, [jobId]: documents }))
    return documents
  }

  async function openJobDetail(job: Job) {
    setDetailJob(job)
    try {
      await loadJobDocuments(job.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las evidencias")
    }
  }

  async function openEvidenceDialog(job: Job) {
    setEvidenceJob(job)
    setEvidenceForm(emptyEvidenceForm)
    try {
      await loadJobDocuments(job.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las evidencias")
    }
  }

  async function handleSaveEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!evidenceJob) return
    if (!evidenceForm.file) {
      toast.error("Selecciona un archivo de evidencia")
      return
    }

    setUploadingEvidence(true)
    try {
      await uploadJobDocument(evidenceJob.id, {
        file: evidenceForm.file,
        type: "JOB_PROFILE",
        isConfirmed: evidenceForm.isConfirmed,
        description: evidenceForm.description,
      })
      await loadJobDocuments(evidenceJob.id)
      await loadData()
      setEvidenceForm(emptyEvidenceForm)
      setEvidenceJob(null)
      toast.success("Evidencia cargada correctamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la evidencia")
    } finally {
      setUploadingEvidence(false)
    }
  }

  async function downloadEvidence(document: JobDocument) {
    if (!document.downloadUrl) return
    try {
      const blob = await downloadJobDocumentFile(document.downloadUrl)
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement("a")
      link.href = url
      link.download = document.originalName || "evidencia-cargo"
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar la evidencia")
    }
  }

  async function handleDeleteDocument(jobId: string, document: JobDocument) {
    if (!window.confirm(`Eliminar la evidencia "${document.originalName}"?`)) return
    setDeletingDocumentId(document.id)
    try {
      await deleteJobDocument(jobId, document.id)
      await Promise.all([loadJobDocuments(jobId), loadData()])
      toast.success("Evidencia eliminada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la evidencia")
    } finally {
      setDeletingDocumentId(null)
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
          <h1 className="text-2xl font-bold text-foreground">Cargos de trabajo</h1>
          <p className="text-muted-foreground">
            Gestiona perfiles de cargos para remitir al medico ocupacional sus tareas, medio de labor y soportes.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2" disabled={workAreas.length === 0}>
              <Plus className="h-4 w-4" />
              Nuevo cargo
            </Button>
          </DialogTrigger>
          <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-4xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader className="border-b border-border px-6 py-4 pr-12">
                <DialogTitle>{form.id ? "Editar cargo" : "Crear cargo"}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Registra el perfil para que pueda ser informado y soportado ante el medico que realiza evaluaciones ocupacionales.
                </p>
              </DialogHeader>
              <div className="max-h-[calc(100dvh-13rem)] space-y-5 overflow-y-auto px-6 py-5">
                <section className="rounded-md border border-border p-4">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Datos del cargo</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="job-name">Nombre del cargo</Label>
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
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="job-description">Descripcion de tareas</Label>
                      <Textarea
                        id="job-description"
                        className={fieldControlClassName}
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Describe las tareas principales del cargo"
                        rows={4}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-md border border-border p-4">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Perfil ocupacional</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="job-work-environment">Medio donde desarrolla la labor</Label>
                      <Textarea
                        id="job-work-environment"
                        className={fieldControlClassName}
                        value={form.workEnvironment}
                        onChange={(event) => setForm((current) => ({ ...current, workEnvironment: event.target.value }))}
                        placeholder="Ej: oficina administrativa, planta, alturas, campo, area operativa"
                        rows={4}
                      />
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Nivel de riesgo</Label>
                        <Select
                          value={form.riskLevel}
                          onValueChange={(value: JobRiskLevel) =>
                            setForm((current) => ({ ...current, riskLevel: value }))
                          }
                        >
                          <SelectTrigger className={fieldControlClassName}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {riskLevelOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
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
                    </div>
                  </div>
                </section>

                <div className="rounded-md bg-secondary p-4 text-sm text-muted-foreground">
                  Este perfil sirve como soporte para informar al medico ocupacional las tareas y el medio donde se desarrolla la labor.
                  Las evidencias documentales se cargan desde las acciones del cargo.
                </div>
              </div>
              <DialogFooter className="border-t border-border px-6 py-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cargo"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {workAreas.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Primero debes crear al menos un area de trabajo para registrar cargos.
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto px-3 py-1">
        <div className="flex min-w-max items-center justify-center gap-2">
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Cargos</span>
            <span className="text-sm font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Activos</span>
            <span className="text-sm font-semibold text-emerald-700">{stats.active}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Inactivos</span>
            <span className="text-sm font-semibold text-destructive">{stats.inactive}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Con evidencia</span>
            <span className="text-sm font-semibold text-blue-700">{stats.withEvidence}</span>
          </div>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cargo, area, medio o nivel de riesgo..."
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

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Lista de cargos</h2>
          <p className="text-sm text-muted-foreground">{filteredJobs.length} cargos encontrados</p>
        </div>

        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[1180px] text-sm">
            <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Cargo</th>
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">Tareas</th>
                <th className="px-4 py-3 font-medium">Medio de labor</th>
                <th className="px-4 py-3 font-medium">Nivel de riesgo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Evidencias</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredJobs.map((job) => {
                const documents = documentsByJob[job.id] ?? []
                const lastEvidence = documents[0]

                return (
                  <tr key={job.id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BriefcaseBusiness className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-foreground">{job.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{job.workArea?.name ?? "Sin área"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p className="max-w-[240px] truncate">{job.description || "Sin descripción"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p className="max-w-[220px] truncate">{job.workEnvironment || "No registrado"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{riskLevelLabel(job.riskLevel)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={job.status === "ACTIVE" ? "accentActivd" : "destructive"}>
                        {job.status === "ACTIVE" ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{job.evidenceCount ?? documents.length}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60">
                          <DropdownMenuItem onSelect={() => void openJobDetail(job)}>
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEditDialog(job)}>
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => void openEvidenceDialog(job)}
                          >
                            <Upload className="h-4 w-4" />
                            Cargar evidencia
                          </DropdownMenuItem>
                          {lastEvidence && (
                            <DropdownMenuItem onSelect={() => void downloadEvidence(lastEvidence)}>
                              <Download className="h-4 w-4" />
                              Descargar ultima evidencia
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => void handleToggleStatus(job)}>
                            <BriefcaseBusiness className="h-4 w-4" />
                            {job.status === "ACTIVE" ? "Inactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => handleDelete(job)}>
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No hay cargos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={Boolean(evidenceJob)} onOpenChange={(nextOpen) => !nextOpen && setEvidenceJob(null)}>
        <DialogContent className="max-w-2xl bg-card">
          <form onSubmit={handleSaveEvidence}>
            <DialogHeader>
              <DialogTitle>Cargar evidencia del perfil de cargo</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Adjunta o registra el soporte enviado al medico ocupacional sobre tareas, perfil y medio de labor.
              </p>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="job-evidence-file">Seleccionar archivo</Label>
                <Input
                  id="job-evidence-file"
                  type="file"
                  onChange={(event) =>
                    setEvidenceForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Descripcion</Label>
                <Textarea
                  value={evidenceForm.description}
                  onChange={(event) => setEvidenceForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  placeholder="Describe el soporte documental cargado"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={evidenceForm.isConfirmed}
                  onChange={(event) =>
                    setEvidenceForm((current) => ({ ...current, isConfirmed: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Confirmar evidencia
              </label>

              {(documentsByJob[evidenceJob?.id ?? ""] ?? []).length > 0 && (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-sm font-semibold text-foreground">Evidencias cargadas</p>
                  {(documentsByJob[evidenceJob?.id ?? ""] ?? []).map((document) => (
                    <div key={document.id} className="flex items-center justify-between gap-3 rounded-md bg-secondary p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{document.originalName}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(document.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => void downloadEvidence(document)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={deletingDocumentId === document.id}
                          onClick={() => evidenceJob && void handleDeleteDocument(evidenceJob.id, document)}
                        >
                          {deletingDocumentId === document.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEvidenceJob(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2" disabled={uploadingEvidence}>
                {uploadingEvidence ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingEvidence ? "Subiendo..." : "Guardar evidencia"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailJob)} onOpenChange={(nextOpen) => !nextOpen && setDetailJob(null)}>
        {detailJob && (
          <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
            <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
              <DialogTitle>Detalle del perfil de cargo</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Verifica tareas, medio de labor, nivel de riesgo y soportes remitidos al medico ocupacional.
              </p>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {(() => {
                const documents = documentsByJob[detailJob.id] ?? []
                return (
                  <>
                    <div className="grid gap-4 md:grid-cols-4">
                      <InfoBlock label="Cargo" value={detailJob.name} />
                      <InfoBlock label="Area" value={detailJob.workArea?.name ?? "Sin area"} />
                      <InfoBlock label="Nivel de riesgo" value={riskLevelLabel(detailJob.riskLevel)} />
                      <InfoBlock label="Estado" value={detailJob.status === "ACTIVE" ? "Activo" : "Inactivo"} />
                    </div>

                    <section className="rounded-md border border-border p-4">
                      <h3 className="mb-2 text-sm font-semibold text-foreground">Descripcion de tareas</h3>
                      <p className="text-sm text-muted-foreground">{detailJob.description || "Sin descripcion registrada."}</p>
                    </section>

                    <section className="rounded-md border border-border p-4">
                      <h3 className="mb-2 text-sm font-semibold text-foreground">Medio donde desarrolla la labor</h3>
                      <p className="text-sm text-muted-foreground">{detailJob.workEnvironment || "No registrado."}</p>
                    </section>

                    <section className="rounded-md border border-border p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileText className="h-4 w-4" />
                        Evidencias
                      </h3>
                      {documents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay soportes documentales registrados.</p>
                      ) : (
                        <div className="space-y-3">
                          {documents.map((document) => (
                            <div
                              key={document.id}
                              className="flex flex-col gap-3 rounded-md bg-secondary p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="font-medium text-foreground">{document.originalName}</p>
                                <p className="text-sm text-muted-foreground">{document.description || document.mimeType}</p>
                                <p className="text-xs text-muted-foreground">Cargado: {formatDateTime(document.createdAt)}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => void downloadEvidence(document)}
                                >
                                  <Download className="h-4 w-4" />
                                  Descargar
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={deletingDocumentId === document.id}
                                  onClick={() => void handleDeleteDocument(detailJob.id, document)}
                                >
                                  {deletingDocumentId === document.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                )
              })()}
            </div>
            <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
              <Button type="button" onClick={() => setDetailJob(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

export default function JobsPage() {
  return <JobsManager />
}
