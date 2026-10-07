"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import {
  createAccountabilityReport,
  deleteAccountabilityDocument,
  deleteAccountabilityReport,
  downloadAccountabilityDocument,
  downloadAccountabilityReportPdf,
  getAccountabilityReport,
  listAccountabilityDocuments,
  listAccountabilityReports,
  uploadAccountabilityDocument,
} from "@/services/accountabilityService"
import { getSgiResponsible, listEmployees } from "@/services/employeeService"
import type {
  AccountabilityDocument,
  AccountabilityExecutionType as ExecutionType,
  AccountabilityReport as AccountabilityRecord,
  AccountabilityReportDetail,
  AccountabilityResult,
  AccountabilityStatus,
  UpsertAccountabilityReportDto,
} from "@/types/manager/accountability"
import type { Employee, EmployeeSgiResponsible } from "@/types/manager/employee"

type ViewMode = "cards" | "list"

type AccountabilityForm = {
  year: string
  renditionDate: string
  legalRepresentativeEmployeeId: string
  legalRepresentativeName: string
  executionType: ExecutionType
  observations: string
}

type UploadForm = {
  file: File | null
  isConfirmed: boolean
  observation: string
  description: string
}

type DocumentPreview = { document: AccountabilityDocument; url: string; mimeType: string }

const currentYear = new Date().getFullYear()

const emptyForm: AccountabilityForm = {
  year: String(currentYear),
  renditionDate: new Date().toISOString().slice(0, 10),
  legalRepresentativeEmployeeId: "",
  legalRepresentativeName: "",
  executionType: "AUTOMATIC",
  observations: "",
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
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

function fileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1048576).toFixed(1)} MB`
}

function executionTypeLabel(type: ExecutionType) {
  return type === "AUTOMATIC" ? "Automático" : "Manual"
}

function statusLabel(status: AccountabilityStatus) {
  if (status === "SIGNED") return "Firmada"
  if (status === "DOCUMENT_UPLOADED") return "Documento cargado"
  if (status === "INACTIVE") return "Inactiva"
  return "Pendiente documento"
}

function statusClassName(status: AccountabilityStatus) {
  if (status === "SIGNED") return "bg-accentActivd text-accentActivd-foreground border-transparent"
  if (status === "DOCUMENT_UPLOADED") return "bg-blue-600 text-white border-transparent"
  if (status === "INACTIVE") return "bg-slate-200 text-slate-700 border-slate-300"
  return "bg-warning/10 text-warning border-warning/20"
}

function resultItems(result: AccountabilityResult) {
  return [
    {
      label: "Plan anual",
      value: `${result.annualPlanExecution}% ejecutado`,
    },
    {
      label: "Capacitaciones",
      value: `${result.trainingsCompleted} de ${result.trainingsPlanned} realizadas`,
    },
    {
      label: "Accidentes",
      value: `${result.accidentsReported} reportados`,
    },
    {
      label: "COPASST",
      value: `${result.copasstMeetings} reuniones realizadas`,
    },
    {
      label: "Matriz de riesgos",
      value: result.riskMatrixUpdated ? "Actualizada" : "Pendiente",
    },
    {
      label: "Medidas de prevención",
      value: `${result.preventiveMeasuresImplementation}% implementadas`,
    },
  ]
}


function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function Metric({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "blue" | "green" | "amber" }) {
  const toneClass =
    tone === "blue"
      ? "text-blue-700"
      : tone === "green"
        ? "text-emerald-700"
        : tone === "amber"
          ? "text-amber-700"
          : "text-foreground"

  return (
    <div className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2">
      <span className={`text-xl font-bold leading-none ${toneClass}`}>{value}</span>
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </div>
  )
}

function AccountabilityDialog({
  open,
  employees,
  responsible,
  onClose,
  onSave,
}: {
  open: boolean
  employees: Employee[]
  responsible: EmployeeSgiResponsible | null
  onClose: () => void
  onSave: (form: AccountabilityForm) => Promise<void>
}) {
  const [form, setForm] = useState<AccountabilityForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const year = Number(form.year)

    if (!Number.isInteger(year) || year < 2019) return toast.error("Ingresa una vigencia válida")
    if (!form.renditionDate) return toast.error("Selecciona la fecha de rendición")
    if (!responsible?.employeeId) return toast.error("Primero debes asignar el responsable del SG-SST")
    if (!form.legalRepresentativeEmployeeId) return toast.error("Selecciona el representante legal")

    try {
      setSaving(true)
      await onSave(form)
      setForm(emptyForm)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-3xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Nueva rendición de cuentas</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Selecciona la vigencia y el tipo de ejecución para consolidar el informe anual del SG-SST.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Información general</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  Año / Vigencia
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(event) => setForm((current) => ({ ...current, year: event.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha de rendición
                  <Input
                    type="date"
                    value={form.renditionDate}
                    onChange={(event) => setForm((current) => ({ ...current, renditionDate: event.target.value }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Responsable SG-SST
                  <Input value={responsible ? `${responsible.employee.name} ${responsible.employee.lastName}`.trim() : "Sin responsable asignado"} disabled />
                </Label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Representante legal</span>
                  <select
                    value={form.legalRepresentativeEmployeeId}
                    onChange={(event) => {
                      const employee = employees.find((item) => item.id === event.target.value)
                      setForm((current) => ({
                        ...current,
                        legalRepresentativeEmployeeId: event.target.value,
                        legalRepresentativeName: employee ? `${employee.name} ${employee.lastName}`.trim() : "",
                      }))
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona representante</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} {employee.lastName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Tipo de ejecución</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["AUTOMATIC", "MANUAL"] as ExecutionType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, executionType: type }))}
                    className={`rounded-md border p-4 text-left transition ${
                      form.executionType === type
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary text-foreground hover:border-primary/50"
                    }`}
                  >
                    <p className="text-sm font-semibold">{executionTypeLabel(type)}</p>
                    <p className={`mt-1 text-xs ${form.executionType === type ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {type === "AUTOMATIC"
                        ? "El sistema consolida indicadores de la vigencia seleccionada."
                        : "Solo crea el registro para cargar el documento firmado."}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <Label className="grid gap-2">
              Observaciones
              <Textarea
                value={form.observations}
                onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
                rows={3}
                placeholder="Agrega notas sobre la rendición, compromisos o información relevante."
              />
            </Label>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear rendición
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function UploadDialog({
  record,
  onClose,
  onUpload,
}: {
  record: AccountabilityRecord | null
  onClose: () => void
  onUpload: (recordId: string, form: UploadForm) => Promise<void>
}) {
  const [form, setForm] = useState<UploadForm>({ file: null, isConfirmed: true, observation: "", description: "" })
  const [uploading, setUploading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.file) return toast.error("Selecciona el documento firmado")

    try {
      setUploading(true)
      await onUpload(record.id, form)
      setForm({ file: null, isConfirmed: true, observation: "", description: "" })
      onClose()
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Cargar documento firmado</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adjunta el documento de rendición de cuentas firmado para conservarlo como soporte.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-dashed border-border bg-secondary p-4">
            <Label className="grid gap-2">
              Archivo
              <Input
                type="file"
                onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))}
              />
            </Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Label className="grid gap-2">Descripción<Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Descripción del soporte" /></Label>
            <Label className="grid gap-2">Observación<Input value={form.observation} onChange={(event) => setForm((current) => ({ ...current, observation: event.target.value }))} placeholder="Observación opcional" /></Label>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isConfirmed}
              onChange={(event) => setForm((current) => ({ ...current, isConfirmed: event.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            Documento confirmado
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Subiendo..." : "Subir documento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DetailDialog({
  record,
  documents,
  loadingDocumentId,
  onClose,
  onDownload,
  onPreviewDocument,
  onDownloadDocument,
  onDeleteDocument,
}: {
  record: AccountabilityReportDetail | null
  documents: AccountabilityDocument[]
  loadingDocumentId: string | null
  onClose: () => void
  onDownload: (record: AccountabilityRecord) => void
  onPreviewDocument: (document: AccountabilityDocument) => void
  onDownloadDocument: (document: AccountabilityDocument) => void
  onDeleteDocument: (document: AccountabilityDocument) => void
}) {
  if (!record) return null

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Detalle de rendición {record.year}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Consulta la información consolidada, documento soporte y resultado anual.
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoBlock label="Vigencia" value={String(record.year)} />
            <InfoBlock label="Fecha" value={formatDate(record.renditionDate)} />
            <InfoBlock label="Tipo" value={executionTypeLabel(record.executionType)} />
            <InfoBlock label="Estado" value={statusLabel(record.status)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock label="Responsable SG-SST" value={record.sgiResponsibleName} />
            <InfoBlock label="Representante legal" value={record.legalRepresentativeName} />
          </div>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <BarChart3 className="h-4 w-4" />
              Resultado automático
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {resultItems(record.result).map((item) => (
                <div key={item.label} className="rounded-md bg-secondary p-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Documentos soporte</h3>
            {!documents.length ? <p className="text-sm text-muted-foreground">Aún no hay documentos firmados cargados.</p> : <div className="space-y-2">{documents.map((document) => <div key={document.id} className="flex flex-col gap-3 rounded-md bg-secondary p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{document.originalName}</p><p className="text-xs text-muted-foreground">{fileSize(document.size)} · {formatDateTime(document.createdAt)}{document.description ? ` · ${document.description}` : ""}</p></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" className="gap-2" disabled={loadingDocumentId === document.id} onClick={() => onPreviewDocument(document)}>{loadingDocumentId === document.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}Ver</Button><Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => onDownloadDocument(document)}><Download className="h-4 w-4" />Descargar</Button><Button type="button" size="sm" variant="destructive" className="gap-2" onClick={() => onDeleteDocument(document)}><Trash2 className="h-4 w-4" />Eliminar</Button></div></div>)}</div>}
          </section>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Observaciones</h3>
            <p className="text-sm text-muted-foreground">{record.observations || "Sin observaciones."}</p>
          </section>
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" className="gap-2" onClick={() => onDownload(record)}>
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AccountabilityPage() {
  const [records, setRecords] = useState<AccountabilityRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [responsible, setResponsible] = useState<EmployeeSgiResponsible | null>(null)
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [createOpen, setCreateOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<AccountabilityReportDetail | null>(null)
  const [documents, setDocuments] = useState<AccountabilityDocument[]>([])
  const [uploadRecord, setUploadRecord] = useState<AccountabilityRecord | null>(null)
  const [reportToDelete, setReportToDelete] = useState<AccountabilityRecord | null>(null)
  const [deletingReport, setDeletingReport] = useState(false)
  const [preview, setPreview] = useState<DocumentPreview | null>(null)
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const [reportsResult, employeesResult, responsibleResult] = await Promise.allSettled([
        listAccountabilityReports({ limit: 100 }),
        listEmployees(),
        getSgiResponsible(),
      ])
      if (reportsResult.status === "rejected") throw reportsResult.reason
      setRecords(reportsResult.value.items)
      if (employeesResult.status === "fulfilled") setEmployees(employeesResult.value.filter((employee) => employee.status))
      if (responsibleResult.status === "fulfilled") setResponsible(responsibleResult.value)
      else setResponsible(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las rendiciones de cuentas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url) }, [preview?.url])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return records

    return records.filter(
      (record) =>
        String(record.year).includes(query) ||
        record.legalRepresentativeName.toLowerCase().includes(query) ||
        record.sgiResponsibleName.toLowerCase().includes(query) ||
        executionTypeLabel(record.executionType).toLowerCase().includes(query) ||
        statusLabel(record.status).toLowerCase().includes(query),
    )
  }, [records, search])

  const latestRecord = records[0]
  const stats = useMemo(() => {
    const automatic = records.filter((record) => record.executionType === "AUTOMATIC").length
    const withDocument = records.filter((record) => Boolean(record.document)).length
    const averageExecution = records.length
      ? Math.round(records.reduce((sum, record) => sum + record.result.annualPlanExecution, 0) / records.length)
      : 0

    return {
      total: records.length,
      automatic,
      withDocument,
      averageExecution,
    }
  }, [records])

  async function handleCreate(form: AccountabilityForm) {
    if (!responsible?.employeeId) throw new Error("No hay responsable SG-SST asignado")
    const payload: UpsertAccountabilityReportDto = {
      year: Number(form.year),
      renditionDate: form.renditionDate,
      sgiResponsibleEmployeeId: responsible.employeeId,
      legalRepresentativeEmployeeId: form.legalRepresentativeEmployeeId,
      legalRepresentativeName: form.legalRepresentativeName,
      executionType: form.executionType,
      observations: form.observations.trim() || undefined,
    }
    try {
      await createAccountabilityReport(payload)
      await loadData()
      toast.success(form.executionType === "AUTOMATIC" ? "Rendición creada con indicadores automáticos" : "Rendición manual creada. Ya puedes cargar el documento firmado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la rendición")
      throw error
    }
  }

  async function handleUpload(recordId: string, form: UploadForm) {
    if (!form.file) return
    try {
      await uploadAccountabilityDocument(recordId, { file: form.file, isConfirmed: form.isConfirmed, observation: form.observation, description: form.description })
      await loadData()
      if (detailRecord?.id === recordId) setDocuments(await listAccountabilityDocuments(recordId))
      toast.success("Documento de rendición cargado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el documento")
      throw error
    }
  }

  async function openDetail(id: string) {
    try {
      const [record, reportDocuments] = await Promise.all([getAccountabilityReport(id), listAccountabilityDocuments(id)])
      setDetailRecord(record)
      setDocuments(reportDocuments)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el detalle")
    }
  }

  async function downloadPdf(record: AccountabilityRecord) {
    try {
      const blob = await downloadAccountabilityReportPdf(record.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `rendicion-cuentas-sg-sst-${record.year}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el PDF")
    }
  }

  async function getDocumentBlob(document: AccountabilityDocument) {
    if (!document.downloadUrl) throw new Error("El documento no tiene archivo disponible")
    return downloadAccountabilityDocument(document.downloadUrl)
  }

  async function previewDocument(document: AccountabilityDocument) {
    setLoadingDocumentId(document.id)
    try {
      const blob = await getDocumentBlob(document)
      const url = URL.createObjectURL(blob)
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return { document, url, mimeType: blob.type || document.mimeType || "application/octet-stream" }
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo previsualizar el documento")
    } finally {
      setLoadingDocumentId(null)
    }
  }

  async function downloadDocument(document: AccountabilityDocument) {
    try {
      const blob = await getDocumentBlob(document)
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement("a")
      link.href = url
      link.download = document.originalName || "documento-rendicion"
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el documento")
    }
  }

  async function removeDocument(document: AccountabilityDocument) {
    if (!detailRecord || !window.confirm(`¿Eliminar ${document.originalName}?`)) return
    try {
      await deleteAccountabilityDocument(detailRecord.id, document.id)
      setDocuments((current) => current.filter((item) => item.id !== document.id))
      await loadData()
      toast.success("Documento de rendición eliminado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el documento")
    }
  }

  async function removeReport() {
    if (!reportToDelete) return
    const record = reportToDelete
    try {
      setDeletingReport(true)
      await deleteAccountabilityReport(record.id)
      if (detailRecord?.id === record.id) {
        setDetailRecord(null)
        setDocuments([])
      }
      await loadData()
      toast.success("Rendición de cuentas eliminada")
      setReportToDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la rendición")
    } finally {
      setDeletingReport(false)
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rendición de Cuentas</h1>
          <p className="text-muted-foreground">
            Consolida la rendición anual del SG-SST, genera el documento y conserva el soporte firmado.
          </p>
        </div>
        <Button type="button" className="gap-2" disabled={loading} onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva rendición
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Rendiciones" value={stats.total} /><Metric label="Automáticas" value={stats.automatic} tone="blue" /><Metric label="Con soporte" value={stats.withDocument} tone="green" /><Metric label="Plan ejecutado promedio" value={`${stats.averageExecution}%`} tone="amber" /></section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_auto] md:items-end">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Vigencia, responsable, representante o estado"
              />
            </div>
          </Label>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => latestRecord && void downloadPdf(latestRecord)}
            disabled={!latestRecord}
          >
            <Download className="h-4 w-4" />
            Descargar última rendición
          </Button>
        </div>
      </section>

      {latestRecord && (
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-card md:col-span-2">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Resultado automático {latestRecord.year}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {resultItems(latestRecord.result).map((item) => (
                  <div key={item.label} className="rounded-md bg-secondary p-3">
                    <p className="text-xs font-medium uppercase text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <h2 className="text-lg font-semibold text-foreground">Flujo</h2>
              <div className="flex items-start gap-3 rounded-md bg-secondary p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
                <p className="text-sm text-muted-foreground">Crea una rendición por vigencia anual.</p>
              </div>
              <div className="flex items-start gap-3 rounded-md bg-secondary p-3">
                <FileText className="mt-0.5 h-4 w-4 text-blue-700" />
                <p className="text-sm text-muted-foreground">Descarga el PDF para firma del responsable y representante legal.</p>
              </div>
              <div className="flex items-start gap-3 rounded-md bg-secondary p-3">
                <Upload className="mt-0.5 h-4 w-4 text-amber-700" />
                <p className="text-sm text-muted-foreground">Carga el documento firmado como soporte de auditoría.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Rendiciones registradas</h2>
            <p className="text-sm text-muted-foreground">{filteredRecords.length} registros encontrados</p>
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
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="border-border bg-card">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">Rendición {record.year}</h3>
                        <Badge variant="outline" className={statusClassName(record.status)}>
                          {statusLabel(record.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{executionTypeLabel(record.executionType)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void openDetail(record.id)}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Fecha: {formatDate(record.renditionDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {record.document ? "Soporte cargado" : "Sin soporte"}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void downloadPdf(record)}>
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button type="button" size="sm" className="gap-2" onClick={() => setUploadRecord(record)}>
                      <Upload className="h-4 w-4" />
                      Cargar firmado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Vigencia</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Responsable SG-SST</th>
                  <th className="px-4 py-3 font-medium">Representante legal</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Plan anual</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{record.year}</p>
                      <p className="text-muted-foreground">Creada: {formatDate(record.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(record.renditionDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.sgiResponsibleName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.legalRepresentativeName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{executionTypeLabel(record.executionType)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.result.annualPlanExecution}%</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusClassName(record.status)}>
                        {statusLabel(record.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => void openDetail(record.id)}>
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => void downloadPdf(record)}>
                            <Download className="h-4 w-4" />
                            Descargar PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setUploadRecord(record)}>
                            <Upload className="h-4 w-4" />
                            Cargar documento firmado
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setReportToDelete(record)}>
                            <Trash2 className="h-4 w-4" />
                            Eliminar rendición
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {!loading && filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No hay rendiciones de cuentas para mostrar.
                    </td>
                  </tr>
                )}
                {loading && <tr><td colSpan={8} className="px-4 py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AccountabilityDialog open={createOpen} employees={employees} responsible={responsible} onClose={() => setCreateOpen(false)} onSave={handleCreate} />
      <UploadDialog record={uploadRecord} onClose={() => setUploadRecord(null)} onUpload={handleUpload} />
      <DetailDialog record={detailRecord} documents={documents} loadingDocumentId={loadingDocumentId} onClose={() => { setDetailRecord(null); setDocuments([]) }} onDownload={(record) => void downloadPdf(record)} onPreviewDocument={(document) => void previewDocument(document)} onDownloadDocument={(document) => void downloadDocument(document)} onDeleteDocument={(document) => void removeDocument(document)} />
      <AlertDialog open={Boolean(reportToDelete)} onOpenChange={(open) => { if (!open && !deletingReport) setReportToDelete(null) }}>
        <AlertDialogContent className="overflow-hidden p-0 sm:max-w-md">
          <AlertDialogHeader className="border-b bg-destructive/5 px-6 py-5 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <AlertDialogTitle>Eliminar rendición de cuentas</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará la rendición de la vigencia <strong className="text-foreground">{reportToDelete?.year}</strong>.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="px-6 py-4 text-sm text-muted-foreground">
            ¿Estás seguro de continuar? El registro dejará de aparecer en el listado de rendiciones.
          </div>
          <AlertDialogFooter className="border-t bg-muted/30 px-6 py-4">
            <AlertDialogCancel disabled={deletingReport}>Cancelar</AlertDialogCancel>
            <Button type="button" variant="destructive" className="gap-2" disabled={deletingReport} onClick={() => void removeReport()}>
              {deletingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deletingReport ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={Boolean(preview)} onOpenChange={(nextOpen) => !nextOpen && setPreview(null)}><DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-5xl"><DialogHeader className="shrink-0 border-b px-6 py-4 pr-12"><DialogTitle className="truncate">{preview?.document.originalName || "Vista previa"}</DialogTitle></DialogHeader><div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4">{preview?.mimeType.startsWith("image/") ? <div className="flex min-h-[24rem] items-center justify-center rounded-md border bg-card p-3"><img src={preview.url} alt={preview.document.originalName} className="max-h-[70dvh] max-w-full object-contain" /></div> : preview?.mimeType.startsWith("application/pdf") ? <iframe src={preview.url} title={preview.document.originalName} className="h-[70dvh] min-h-[28rem] w-full rounded-md border bg-white" /> : preview ? <div className="flex min-h-[24rem] flex-col items-center justify-center rounded-md border border-dashed bg-card"><FileText className="h-12 w-12 text-muted-foreground" /><p className="mt-3 font-medium">Vista previa no disponible</p></div> : null}</div><DialogFooter className="border-t px-6 py-4">{preview && <><Button variant="outline" className="gap-2" onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")}><ExternalLink className="h-4 w-4" />Abrir</Button><Button className="gap-2" onClick={() => void downloadDocument(preview.document)}><Download className="h-4 w-4" />Descargar</Button></>}</DialogFooter></DialogContent></Dialog>
    </main>
  )
}
