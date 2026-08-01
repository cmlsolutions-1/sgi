"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  BookOpen,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Plus,
  Power,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  activateManagedDocument,
  createManagedDocument,
  deleteManagedDocumentFile,
  deleteManagedDocument,
  downloadManagedDocumentFile,
  listManagedDocumentFiles,
  listManagedDocuments,
  updateManagedDocument,
  uploadManagedDocumentFile,
} from "@/services/documentManagementService"
import { listEmployees } from "@/services/employeeService"
import { listJobs } from "@/services/jobService"
import { listWorkAreaOptions } from "@/services/workAreaService"
import type {
  ManagedDocument,
  ManagedDocumentFile,
  ManagedDocumentType,
  UpsertManagedDocumentDto,
} from "@/types/manager/document-management"
import type { Employee } from "@/types/manager/employee"
import type { Job } from "@/types/manager/job"
import type { WorkAreaOption } from "@/types/manager/work-area"

type DocumentFormState = UpsertManagedDocumentDto & {
  id?: string
}

type ManagedDocumentPreviewState = {
  file: ManagedDocumentFile
  url: string
  mimeType: string
}

const documentFieldControlClassName =
  "w-full border-slate-300 bg-white shadow-sm hover:border-slate-400 focus-visible:border-primary focus-visible:ring-primary/25"

const DOCUMENT_TYPES: Array<{ value: ManagedDocumentType; label: string }> = [
  { value: "PROCEDURE", label: "Procedimiento" },
  { value: "MANUAL", label: "Manual" },
  { value: "INSTRUCTIVE", label: "Instructivo" },
  { value: "OTHERS", label: "Otros" },
  { value: "POLICY", label: "Política" },
]

const emptyForm: DocumentFormState = {
  name: "",
  type: "PROCEDURE",
  version: "1.0",
  objective: "",
  activities: "",
  resources: "",
  workAreaId: "",
  jobId: "",
  responsibleEmployeeId: "",
  consecutive: 1,
  code: "",
}

function documentTypeLabel(type: ManagedDocumentType) {
  return DOCUMENT_TYPES.find((item) => item.value === type)?.label ?? type
}

function statusLabel(status: ManagedDocument["status"]) {
  return status === "ACTIVE" ? "Activo" : "Inactivo"
}

function statusClass(status: ManagedDocument["status"]) {
  return status === "ACTIVE"
    ? "bg-accentActivd text-accentActivd-foreground border-transparent"
    : "bg-destructive text-white border-transparent"
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function canEmbedPreview(mimeType: string) {
  return mimeType.startsWith("application/pdf") || mimeType.startsWith("image/")
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ManagedDocument[]>([])
  const [workAreas, setWorkAreas] = useState<WorkAreaOption[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<DocumentFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [workAreaFilter, setWorkAreaFilter] = useState<string>("all")
  const [fileDialogDocument, setFileDialogDocument] = useState<ManagedDocument | null>(null)
  const [documentFiles, setDocumentFiles] = useState<ManagedDocumentFile[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [preview, setPreview] = useState<ManagedDocumentPreviewState | null>(null)
  const [previewingDocumentId, setPreviewingDocumentId] = useState<string | null>(null)
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null)

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return documents.filter((document) => {
      const matchesSearch =
        !query ||
        document.name.toLowerCase().includes(query) ||
        document.code.toLowerCase().includes(query) ||
        document.version.toLowerCase().includes(query) ||
        document.objective?.toLowerCase().includes(query) ||
        document.activities?.toLowerCase().includes(query) ||
        document.resources?.toLowerCase().includes(query) ||
        document.workArea?.name?.toLowerCase().includes(query) ||
        document.job?.name?.toLowerCase().includes(query) ||
        document.responsibleEmployee?.name?.toLowerCase().includes(query) ||
        document.responsibleEmployee?.lastName?.toLowerCase().includes(query) ||
        document.responsibleEmployee?.email?.toLowerCase().includes(query)
      const matchesType = typeFilter === "all" || document.type === typeFilter
      const matchesStatus = statusFilter === "all" || document.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [documents, search, typeFilter, statusFilter])

  const availableJobs = useMemo(() => {
    if (!form.workAreaId) return jobs
    return jobs.filter((job) => job.workAreaId === form.workAreaId)
  }, [form.workAreaId, jobs])

  const consecutiveError = formError?.toLowerCase().includes("consecutivo") ? formError : null

  const stats = useMemo(
    () => ({
      total: documents.length,
      active: documents.filter((document) => document.status === "ACTIVE").length,
      inactive: documents.filter((document) => document.status === "INACTIVE").length,
      byType: DOCUMENT_TYPES.reduce(
        (acc, type) => {
          acc[type.value] = documents.filter((document) => document.type === type.value).length
          return acc
        },
        {} as Record<ManagedDocumentType, number>,
      ),
    }),
    [documents],
  )

  async function loadData() {
    setLoading(true)
    const [documentResult, workAreaResult, jobResult, employeeResult] = await Promise.allSettled([
      listManagedDocuments(workAreaFilter === "all" ? {} : { workAreaId: workAreaFilter }),
      listWorkAreaOptions(),
      listJobs(),
      listEmployees(),
    ])

    if (documentResult.status === "fulfilled") {
      setDocuments(documentResult.value)
    } else {
      toast.error(
        documentResult.reason instanceof Error
          ? documentResult.reason.message
          : "No se pudo cargar la gestión documental",
      )
    }

    if (workAreaResult.status === "fulfilled") {
      setWorkAreas(workAreaResult.value)
    } else {
      toast.error(
        workAreaResult.reason instanceof Error
          ? workAreaResult.reason.message
          : "No se pudo cargar las áreas de trabajo",
      )
    }

    if (jobResult.status === "fulfilled") {
      setJobs(jobResult.value.items ?? [])
    } else {
      toast.error(jobResult.reason instanceof Error ? jobResult.reason.message : "No se pudo cargar los puestos")
    }

    if (employeeResult.status === "fulfilled") {
      setEmployees(employeeResult.value)
    } else {
      toast.error(
        employeeResult.reason instanceof Error ? employeeResult.reason.message : "No se pudo cargar los funcionarios",
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [workAreaFilter])

  function resetForm() {
    setForm(emptyForm)
    setFormError(null)
    setDialogOpen(false)
  }

  function openCreateDialog() {
    setForm(emptyForm)
    setFormError(null)
    setDialogOpen(true)
  }

  function openEditDialog(document: ManagedDocument) {
    setFormError(null)
    setForm({
      id: document.id,
      name: document.name,
      type: document.type,
      version: document.version,
      objective: document.objective ?? "",
      activities: document.activities ?? "",
      resources: document.resources ?? "",
      workAreaId: document.workAreaId,
      jobId: document.jobId ?? "",
      responsibleEmployeeId: document.responsibleEmployeeId ?? "",
      consecutive: document.consecutive,
      code: document.code,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    setFormError(null)

    if (!form.name.trim()) {
      toast.error("Ingresa el nombre del documento")
      return
    }

    if (!form.version.trim()) {
      toast.error("Ingresa la versión del documento")
      return
    }

    if (!form.objective.trim()) {
      toast.error("Ingresa el objetivo del documento")
      return
    }

    if (!form.activities.trim()) {
      toast.error("Ingresa las actividades del documento")
      return
    }

    if (!form.resources.trim()) {
      toast.error("Ingresa los recursos del documento")
      return
    }

    if (!form.workAreaId) {
      toast.error("Selecciona un área de trabajo")
      return
    }

    if (!form.jobId) {
      toast.error("Selecciona un puesto de trabajo")
      return
    }

    if (!form.responsibleEmployeeId) {
      toast.error("Selecciona el funcionario responsable")
      return
    }

    if (!form.code.trim()) {
      toast.error("Ingresa el código del documento")
      return
    }

    const payload: UpsertManagedDocumentDto = {
      name: form.name.trim(),
      type: form.type,
      version: form.version.trim(),
      objective: form.objective.trim(),
      activities: form.activities.trim(),
      resources: form.resources.trim(),
      workAreaId: form.workAreaId,
      jobId: form.jobId,
      responsibleEmployeeId: form.responsibleEmployeeId,
      consecutive: Number(form.consecutive),
      code: form.code.trim(),
    }

    setSaving(true)
    try {
      if (form.id) {
        await updateManagedDocument(form.id, payload)
        toast.success("Documento actualizado")
      } else {
        await createManagedDocument(payload)
        toast.success("Documento creado")
      }

      resetForm()
      await loadData()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el documento"
      setFormError(message)
      toast.error(message, { duration: 7000 })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(document: ManagedDocument) {
    const confirmed = window.confirm(`¿Eliminar el documento "${document.name}"?`)
    if (!confirmed) return

    try {
      await deleteManagedDocument(document.id)
      toast.success("Documento eliminado")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el documento")
    }
  }

  async function handleActivate(document: ManagedDocument) {
    try {
      await activateManagedDocument(document.id)
      toast.success(document.status === "ACTIVE" ? "Documento inactivado" : "Documento activado")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado del documento")
    }
  }

  async function loadDocumentFiles(documentId: string) {
    setLoadingFiles(true)
    try {
      setDocumentFiles(await listManagedDocumentFiles(documentId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar los archivos")
      setDocumentFiles([])
    } finally {
      setLoadingFiles(false)
    }
  }

  async function openFileDialog(document: ManagedDocument) {
    setFileDialogDocument(document)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    await loadDocumentFiles(document.id)
  }

  function closeFileDialog() {
    setFileDialogDocument(null)
    setDocumentFiles([])
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleUploadFile() {
    if (!fileDialogDocument || !selectedFile) {
      toast.error("Selecciona un archivo")
      return
    }

    setUploadingFile(true)
    try {
      await uploadManagedDocumentFile(fileDialogDocument.id, {
        file: selectedFile,
        type: "DOCUMENT_MANAGEMENT",
        isConfirmed: true,
      })
      toast.success("Archivo subido")
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      await loadDocumentFiles(fileDialogDocument.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el archivo")
    } finally {
      setUploadingFile(false)
    }
  }

  async function handleDownloadFile(document: ManagedDocumentFile) {
    if (!document.downloadUrl) {
      toast.error("El archivo no tiene una URL de descarga")
      return
    }

    setDownloadingFileId(document.id)
    try {
      const blob = await downloadManagedDocumentFile(document.downloadUrl)
      const url = URL.createObjectURL(blob)
      const anchor = window.document.createElement("a")
      anchor.href = url
      anchor.download = document.originalName || "documento"
      window.document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el archivo")
    } finally {
      setDownloadingFileId(null)
    }
  }

  async function getPrimaryFileForDocument(document: ManagedDocument) {
    const files = await listManagedDocumentFiles(document.id)
    const sortedFiles = [...files].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime()
      const bTime = new Date(b.createdAt || 0).getTime()
      return bTime - aTime
    })
    const file = sortedFiles[0]

    if (!file) {
      throw new Error("Este documento no tiene archivos cargados")
    }

    if (!file.downloadUrl) {
      throw new Error("El archivo no tiene una URL de descarga")
    }

    return file
  }

  async function handlePreviewDocumentFile(document: ManagedDocument) {
    setPreviewingDocumentId(document.id)
    try {
      const file = await getPrimaryFileForDocument(document)
      const blob = await downloadManagedDocumentFile(file.downloadUrl)
      const url = URL.createObjectURL(blob)
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return {
          file,
          url,
          mimeType: blob.type || file.mimeType || "",
        }
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo visualizar el documento")
    } finally {
      setPreviewingDocumentId(null)
    }
  }

  async function handleDownloadDocumentFile(document: ManagedDocument) {
    setDownloadingDocumentId(document.id)
    try {
      const file = await getPrimaryFileForDocument(document)
      await handleDownloadFile(file)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el archivo")
    } finally {
      setDownloadingDocumentId(null)
    }
  }

  function closePreview() {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url)
      return null
    })
  }

  async function handleDeleteFile(document: ManagedDocumentFile) {
    if (!fileDialogDocument) return
    if (!window.confirm(`¿Eliminar el archivo "${document.originalName}"?`)) return

    setDeletingFileId(document.id)
    try {
      await deleteManagedDocumentFile(fileDialogDocument.id, document.id)
      toast.success("Archivo eliminado")
      await loadDocumentFiles(fileDialogDocument.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el archivo")
    } finally {
      setDeletingFileId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión Documental</h1>
          <p className="text-muted-foreground">
            Administra procedimientos, manuales, instructivos y otros documentos por área de trabajo.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : resetForm())}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar documento" : "Nuevo documento"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="document-name">Nombre</Label>
                <Input
                  id="document-name"
                  className={documentFieldControlClassName}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ej: Procedimiento de inspección de seguridad"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((current) => ({ ...current, type: value as ManagedDocumentType }))}
                >
                  <SelectTrigger className={documentFieldControlClassName}>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Área de trabajo</Label>
                <Select
                  value={form.workAreaId}
                  onValueChange={(value) => setForm((current) => ({ ...current, workAreaId: value, jobId: "" }))}
                >
                  <SelectTrigger className={documentFieldControlClassName}>
                    <SelectValue placeholder="Selecciona un área" />
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
                  value={form.jobId}
                  onValueChange={(value) => setForm((current) => ({ ...current, jobId: value }))}
                >
                  <SelectTrigger className={documentFieldControlClassName}>
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

              <div className="space-y-2">
                <Label>Responsable</Label>
                <Select
                  value={form.responsibleEmployeeId}
                  onValueChange={(value) => setForm((current) => ({ ...current, responsibleEmployeeId: value }))}
                >
                  <SelectTrigger className={documentFieldControlClassName}>
                    <SelectValue placeholder="Selecciona un funcionario" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-version">Versión</Label>
                <Input
                  id="document-version"
                  className={documentFieldControlClassName}
                  value={form.version}
                  onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
                  placeholder="1.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-consecutive">Consecutivo</Label>
                <Input
                  id="document-consecutive"
                  type="number"
                  min={1}
                  value={form.consecutive}
                  aria-invalid={Boolean(consecutiveError)}
                  className={`${documentFieldControlClassName} ${
                    consecutiveError ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, consecutive: Number(event.target.value) || 1 }))
                    setFormError(null)
                  }}
                />
                {consecutiveError && <p className="text-xs text-destructive">{consecutiveError}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="document-code">Código</Label>
                <Input
                  id="document-code"
                  className={documentFieldControlClassName}
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="PR-LAB-001"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="document-objective">Objetivo</Label>
                <Textarea
                  id="document-objective"
                  className={documentFieldControlClassName}
                  value={form.objective}
                  onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))}
                  placeholder="Describe el objetivo del documento"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="document-activities">Actividades</Label>
                <Textarea
                  id="document-activities"
                  className={documentFieldControlClassName}
                  value={form.activities}
                  onChange={(event) => setForm((current) => ({ ...current, activities: event.target.value }))}
                  placeholder="Describe las actividades que componen el documento"
                  rows={4}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="document-resources">Recursos</Label>
                <Textarea
                  id="document-resources"
                  className={documentFieldControlClassName}
                  value={form.resources}
                  onChange={(event) => setForm((current) => ({ ...current, resources: event.target.value }))}
                  placeholder="Indica recursos, herramientas o soportes necesarios"
                  rows={3}
                />
              </div>
            </div>

            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No se pudo guardar el documento</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={resetForm} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : form.id ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={Boolean(fileDialogDocument)} onOpenChange={(open) => !open && closeFileDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Archivos de {fileDialogDocument?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border border-slate-300 bg-white p-4 shadow-xs">
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="managed-document-file">Seleccionar archivo</Label>
                  <div className="flex min-h-9 items-center gap-2 overflow-hidden rounded-md border border-slate-300 bg-white px-2 py-1 shadow-xs">
                    <Input
                      ref={fileInputRef}
                      id="managed-document-file"
                      className="hidden"
                      type="file"
                      onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    />
                    <Button type="button" size="sm" className="h-8 shrink-0 gap-2 px-3 text-xs" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5" />
                      Seleccionar
                    </Button>
                    <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                      {selectedFile?.name ?? "Ningun archivo seleccionado"}
                    </span>
                  </div>
                </div>
                <Button className="gap-2" onClick={handleUploadFile} disabled={!selectedFile || uploadingFile}>
                  {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Subir archivo
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                El archivo quedará asociado al registro y podrá descargarse para imprimir.
              </p>
            </div>

            {loadingFiles ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando archivos...
              </div>
            ) : documentFiles.length === 0 ? (
              <div className="rounded-md border border-slate-300 bg-white p-4 text-center text-sm text-muted-foreground shadow-xs">
                Aún no hay archivos asociados.
              </div>
            ) : (
              <div className="space-y-2">
                {documentFiles.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-3 rounded-md border border-slate-300 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{document.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {document.mimeType || "Archivo"} · {formatFileSize(document.size)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleDownloadFile(document)}
                        disabled={downloadingFileId === document.id}
                      >
                        {downloadingFileId === document.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Descargar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleDeleteFile(document)}
                        disabled={deletingFileId === document.id}
                      >
                        {deletingFileId === document.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeFileDialog}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col bg-card p-0">
          <DialogHeader className="border-b border-border px-4 py-3">
            <DialogTitle className="truncate text-base">{preview?.file.originalName || "Documento"}</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 p-4">
            {preview && canEmbedPreview(preview.mimeType) ? (
              preview.mimeType.startsWith("image/") ? (
                <div className="flex max-h-[70dvh] items-center justify-center overflow-auto rounded-md bg-secondary/40 p-2">
                  <img
                    src={preview.url}
                    alt={preview.file.originalName || "Documento"}
                    className="max-h-[68dvh] max-w-full rounded-md object-contain"
                  />
                </div>
              ) : (
                <iframe
                  title={preview.file.originalName || "Documento"}
                  src={preview.url}
                  className="h-[70dvh] w-full rounded-md border border-border bg-white"
                />
              )
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-secondary/30 p-6 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Vista previa no disponible</p>
                  <p className="text-sm text-muted-foreground">
                    Este archivo se puede abrir o descargar desde una pestaña nueva.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border px-4 py-3">
            {preview && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en pestaña
                </Button>
                <Button type="button" variant="outline" className="gap-2" onClick={() => handleDownloadFile(preview.file)}>
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </>
            )}
            <Button type="button" onClick={closePreview}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto px-3 py-1">
        <div className="flex min-w-max items-center justify-center gap-2">
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Activos</span>
            <span className="text-sm font-semibold text-green-600">{stats.active}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Inactivos</span>
            <span className="text-sm font-semibold">{stats.inactive}</span>
          </div>
          {DOCUMENT_TYPES.map((type) => (
            <div key={type.value} className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
              <span className="text-xs text-muted-foreground">{type.label}</span>
              <span className="text-sm font-semibold">{stats.byType[type.value] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
                placeholder="Buscar por nombre, código, versión o área..."
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="lg:w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="lg:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
              </SelectContent>
            </Select>

            <div className="lg:w-64">
              <Select value={workAreaFilter} onValueChange={setWorkAreaFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Área de trabajo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  {workAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando documentos...
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No hay documentos que coincidan con los filtros.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <div className="hidden grid-cols-[minmax(240px,2fr)_minmax(120px,0.8fr)_minmax(180px,1fr)_minmax(180px,1fr)_100px_48px] gap-4 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground lg:grid">
            <span>Documento</span>
            <span>Tipo</span>
            <span>Área y puesto</span>
            <span>Responsable</span>
            <span>Estado</span>
            <span className="sr-only">Acciones</span>
          </div>

          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="group grid gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/30 lg:grid-cols-[minmax(240px,2fr)_minmax(120px,0.8fr)_minmax(180px,1fr)_minmax(180px,1fr)_100px_48px] lg:items-center lg:gap-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  {document.type === "MANUAL" ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{document.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {document.code} · Versión {document.version} · Consecutivo {document.consecutive}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 lg:block">
                <span className="text-xs font-medium text-muted-foreground lg:hidden">Tipo</span>
                <Badge variant="secondary" className="font-normal">
                  {documentTypeLabel(document.type)}
                </Badge>
              </div>

              <div className="flex items-start justify-between gap-3 lg:block">
                <span className="text-xs font-medium text-muted-foreground lg:hidden">Área y puesto</span>
                <div className="min-w-0 text-right lg:text-left">
                  <p className="truncate text-sm">{document.workArea?.name ?? "Área no disponible"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {document.job?.name ?? "Puesto no disponible"}
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between gap-3 lg:block">
                <span className="text-xs font-medium text-muted-foreground lg:hidden">Responsable</span>
                <div className="min-w-0 text-right lg:text-left">
                  <p className="truncate text-sm">
                    {document.responsibleEmployee
                      ? `${document.responsibleEmployee.name} ${document.responsibleEmployee.lastName}`
                      : "No disponible"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {document.responsibleEmployee?.email ?? "Sin correo registrado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 lg:block">
                <span className="text-xs font-medium text-muted-foreground lg:hidden">Estado</span>
                <Badge variant="outline" className={statusClass(document.status)}>
                  {statusLabel(document.status)}
                </Badge>
              </div>

              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Acciones de ${document.name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      disabled={previewingDocumentId === document.id}
                      onSelect={() => handlePreviewDocumentFile(document)}
                    >
                      {previewingDocumentId === document.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4" />
                      )}
                      {previewingDocumentId === document.id ? "Cargando" : "Ver"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => openFileDialog(document)}>
                      <Paperclip className="mr-2 h-4 w-4" />
                      Subir documento
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={downloadingDocumentId === document.id}
                      onSelect={() => handleDownloadDocumentFile(document)}
                    >
                      {downloadingDocumentId === document.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      {downloadingDocumentId === document.id ? "Descargando" : "Descargar archivo"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => openEditDialog(document)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleActivate(document)}>
                      <Power className="mr-2 h-4 w-4" />
                      {document.status === "ACTIVE" ? "Inactivar" : "Activar"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => handleDelete(document)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
