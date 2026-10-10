"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Download,
  Edit,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

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
import { FormDialogIcon, FormSectionTitle } from "@/components/ui/form-dialog-visuals"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { listEmployees } from "@/services/employeeService"
import {
  createSstCommunication,
  deleteSstCommunication,
  downloadSstCommunicationDocument,
  downloadSstCommunicationSignaturePdf,
  getSstCommunication,
  listSstCommunications,
  updateSstCommunication,
  uploadSstCommunicationInitialEvidence,
  uploadSstCommunicationSignedEvidence,
} from "@/services/sstCommunicationService"
import type {
  SstCommunication,
  SstCommunicationMedium as CommunicationMedium,
  SstCommunicationResponsibleType as ResponsibleType,
  SstCommunicationType as CommunicationType,
  UpsertSstCommunicationDto,
} from "@/types/manager/sst-communication"

type EmployeeOption = {
  id: string
  name: string
  lastName: string
  job: string
}

type CommunicationForm = {
  mechanismName: string
  type: CommunicationType
  medium: CommunicationMedium
  customMedium: string
  responsibleType: ResponsibleType
  responsibleEmployeeId: string
  managerName: string
  implementationDate: string
  observations: string
  informedCopasst: "YES" | "NO"
}

type EvidenceForm = {
  fileName: string
  description: string
}

type EvidencePreview = {
  title: string
  url: string
  mimeType: string
  generated: boolean
}

const mediumOptions: Array<{ value: CommunicationMedium; label: string }> = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Correo" },
  { value: "MAILBOX", label: "Buzon" },
  { value: "FORM", label: "Formulario" },
  { value: "VERBAL", label: "Verbal" },
  { value: "MEETING", label: "Reunion" },
  { value: "OTHER", label: "Otro" },
]

const emptyForm: CommunicationForm = {
  mechanismName: "",
  type: "INTERNAL",
  medium: "EMAIL",
  customMedium: "",
  responsibleType: "EMPLOYEE",
  responsibleEmployeeId: "",
  managerName: "",
  implementationDate: new Date().toISOString().slice(0, 10),
  observations: "",
  informedCopasst: "NO",
}

const emptyEvidenceForm: EvidenceForm = {
  fileName: "",
  description: "",
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

function typeLabel(type: CommunicationType) {
  return type === "INTERNAL" ? "Interno" : "Externo"
}

function mediumLabel(record: Pick<SstCommunication, "medium" | "customMedium">) {
  if (record.medium === "OTHER") return record.customMedium?.trim() || "Otro"
  return mediumOptions.find((option) => option.value === record.medium)?.label ?? record.medium
}

function responsibleLabel(record: SstCommunication, employees: EmployeeOption[] = []) {
  if (record.responsibleType === "MANAGER") return record.managerName?.trim() || "Gerente"
  if (record.responsibleEmployee) {
    return `${record.responsibleEmployee.name} ${record.responsibleEmployee.lastName}`.trim()
  }
  const employee = employees.find((item) => item.id === record.responsibleEmployeeId)
  return employee ? `${employee.name} ${employee.lastName}` : "Empleado no asignado"
}

function canEmbed(mimeType?: string) {
  return Boolean(mimeType?.startsWith("image/") || mimeType === "application/pdf" || mimeType?.startsWith("text/"))
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function CommunicationDialog({
  open,
  record,
  employees,
  saving,
  onClose,
  onSave,
}: {
  open: boolean
  record: SstCommunication | null
  employees: EmployeeOption[]
  saving: boolean
  onClose: () => void
  onSave: (form: CommunicationForm, recordId?: string) => Promise<void>
}) {
  const [form, setForm] = useState<CommunicationForm>(emptyForm)
  const editing = Boolean(record)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            mechanismName: record.mechanismName,
            type: record.type,
            medium: record.medium,
            customMedium: record.customMedium ?? "",
            responsibleType: record.responsibleType,
            responsibleEmployeeId: record.responsibleEmployeeId ?? "",
            managerName: record.managerName ?? "",
            implementationDate: record.implementationDate,
            observations: record.observations ?? "",
            informedCopasst: record.informedCopasst ? "YES" : "NO",
          }
        : emptyForm,
    )
  }, [open, record])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.mechanismName.trim()) return toast.error("Ingresa el nombre del mecanismo")
    if (!form.implementationDate) return toast.error("Selecciona la fecha de implementacion")
    if (form.medium === "OTHER" && !form.customMedium.trim()) return toast.error("Ingresa el medio")
    if (form.responsibleType === "EMPLOYEE" && !form.responsibleEmployeeId) return toast.error("Selecciona el empleado responsable")
    if (form.responsibleType === "MANAGER" && !form.managerName.trim()) return toast.error("Ingresa el responsable gerente")

    await onSave(form, record?.id)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="module-dialog-polish record-dialog-polish !flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <div className="flex items-start gap-3 text-left">
            <FormDialogIcon icon="document" tone="blue" />
            <div><DialogTitle>{editing ? "Editar comunicacion SST" : "Nueva comunicacion SST"}</DialogTitle><p className="mt-1 text-sm text-muted-foreground">Registra el mecanismo de comunicación y su responsable.</p></div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <FormSectionTitle icon="details" title="Datos del mecanismo" description="Define el nombre, tipo y medio utilizado para la comunicación." tone="blue" />
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2 md:col-span-2">
                  Nombre del mecanismo
                  <Input
                    value={form.mechanismName}
                    onChange={(event) => setForm((current) => ({ ...current, mechanismName: event.target.value }))}
                    placeholder="Ej. Canal interno de reportes SST"
                  />
                </Label>
                <div><Label className="mb-2 block">Tipo</Label><Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value as CommunicationType }))}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INTERNAL">Interno</SelectItem><SelectItem value="EXTERNAL">Externo</SelectItem></SelectContent></Select></div>
                <div><Label className="mb-2 block">Medio</Label><Select value={form.medium} onValueChange={(value) => setForm((current) => ({ ...current, medium: value as CommunicationMedium }))}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent>{mediumOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                {form.medium === "OTHER" && (
                  <Label className="grid gap-2 md:col-span-2">
                    Otro medio
                    <Input
                      value={form.customMedium}
                      onChange={(event) => setForm((current) => ({ ...current, customMedium: event.target.value }))}
                      placeholder="Describe el medio de comunicacion"
                    />
                  </Label>
                )}
                <div><Label className="mb-2 block">Tipo de responsable</Label><Select value={form.responsibleType} onValueChange={(value) => setForm((current) => ({ ...current, responsibleType: value as ResponsibleType }))}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EMPLOYEE">Empleado</SelectItem><SelectItem value="MANAGER">Gerente</SelectItem></SelectContent></Select></div>
                {form.responsibleType === "EMPLOYEE" ? (
                  <div><Label className="mb-2 block">Empleado responsable</Label><Select value={form.responsibleEmployeeId} onValueChange={(value) => setForm((current) => ({ ...current, responsibleEmployeeId: value }))}><SelectTrigger className="h-10 w-full"><SelectValue placeholder="Selecciona un empleado" /></SelectTrigger><SelectContent>{employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.name} {employee.lastName} - {employee.job}</SelectItem>)}</SelectContent></Select></div>
                ) : (
                  <Label className="grid gap-2">
                    Gerente responsable
                    <Input
                      value={form.managerName}
                      onChange={(event) => setForm((current) => ({ ...current, managerName: event.target.value }))}
                      placeholder="Nombre del gerente"
                    />
                  </Label>
                )}
                <Label className="grid gap-2">
                  Fecha de implementacion
                  <Input
                    type="date"
                    value={form.implementationDate}
                    onChange={(event) => setForm((current) => ({ ...current, implementationDate: event.target.value }))}
                  />
                </Label>
                <div><Label className="mb-2 block">Informó a miembros del COPASST</Label><Select value={form.informedCopasst} onValueChange={(value) => setForm((current) => ({ ...current, informedCopasst: value as "YES" | "NO" }))}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="YES">Sí</SelectItem><SelectItem value="NO">No</SelectItem></SelectContent></Select></div>
                <Label className="grid gap-2 md:col-span-2">
                  Observaciones
                  <Textarea
                    value={form.observations}
                    onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
                    placeholder="Observaciones del mecanismo de comunicacion"
                    rows={4}
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-primary/20 bg-primary/5 p-4">
              <FormSectionTitle icon="tracking" title="Flujo documental" description="Completa la evidencia inicial, firma y documento final." tone="cyan" />
              <div className="flex items-start gap-3">
                <FileCheck2 className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Después de guardar, carga la evidencia inicial desde los 3 puntos. Con esa evidencia se habilita el PDF para firma y luego podrás subir el documento firmado.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Guardar cambios" : "Crear comunicacion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  record,
  kind,
  uploading,
  onClose,
  onSave,
}: {
  record: SstCommunication | null
  kind: "initial" | "signed"
  uploading: boolean
  onClose: () => void
  onSave: (recordId: string, form: EvidenceForm, file: File, kind: "initial" | "signed") => Promise<void>
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!record) return
    const evidence = kind === "initial" ? record.initialEvidence : record.signedEvidence
    setForm({
      fileName: evidence?.originalName ?? "",
      description: evidence?.description ?? "",
    })
    setFile(null)
  }, [kind, record])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!file) {
      return toast.error(kind === "initial" ? "Selecciona la evidencia inicial" : "Selecciona el documento firmado")
    }

    await onSave(record.id, form, file, kind)
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="module-dialog-polish max-w-2xl bg-card">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{kind === "initial" ? "Cargar evidencia inicial" : "Cargar documento firmado"}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {kind === "initial"
                ? `Adjunta la evidencia inicial para ${record?.mechanismName ?? "la comunicacion SST"}.`
                : `Adjunta el PDF firmado por gerencia para ${record?.mechanismName ?? "la comunicacion SST"}.`}
            </p>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              {kind === "initial" ? "Evidencia inicial" : "Archivo firmado"}
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null
                  setFile(selected)
                  setForm((current) => ({ ...current, fileName: selected?.name ?? current.fileName }))
                }}
              />
            </Label>
            <Label className="grid gap-2">
              Nombre del archivo
              <Input
                value={form.fileName}
                readOnly
                placeholder={kind === "initial" ? "evidencia-comunicacion-sst.pdf" : "comunicaciones-sst-firmado.pdf"}
              />
            </Label>
            <Label className="grid gap-2 md:col-span-2">
              Descripcion
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                placeholder={kind === "initial" ? "Observacion sobre la evidencia inicial" : "Observacion sobre el documento firmado"}
              />
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              {kind === "initial" ? "Guardar evidencia inicial" : "Guardar documento firmado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidencePreviewDialog({
  preview,
  onClose,
}: {
  preview: EvidencePreview | null
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(preview)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="module-dialog-polish flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{preview?.title ?? "Evidencia firmada"}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {preview && canEmbed(preview.mimeType) ? (
            preview.mimeType.startsWith("image/") ? (
              <img src={preview.url} alt={preview.title} className="mx-auto max-h-[70dvh] max-w-full rounded-md object-contain" />
            ) : (
              <iframe title={preview.title} src={preview.url} className="h-[70dvh] w-full rounded-md border border-border" />
            )
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-md border border-dashed border-border text-center text-muted-foreground">
              <FileText className="mb-3 h-10 w-10" />
              <p className="font-medium">Vista previa no disponible</p>
              <p className="text-sm">Puedes abrir o descargar el archivo desde las acciones.</p>
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          {preview && (
            <Button type="button" variant="outline" onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")}>
              Abrir en otra pestaña
            </Button>
          )}
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

export default function SstCommunicationsPage() {
  const [records, setRecords] = useState<SstCommunication[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SstCommunication | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<SstCommunication | null>(null)
  const [evidenceKind, setEvidenceKind] = useState<"initial" | "signed">("initial")
  const [detailRecord, setDetailRecord] = useState<SstCommunication | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busyRecordId, setBusyRecordId] = useState<string | null>(null)

  async function loadRecords(showError = true) {
    try {
      const response = await listSstCommunications({ limit: 100 })
      setRecords(response.items)
    } catch (error) {
      if (showError) toast.error(error instanceof Error ? error.message : "No se pudieron cargar las comunicaciones SST")
    }
  }

  useEffect(() => {
    let active = true
    async function loadPage() {
      setLoading(true)
      try {
        const [communications, employeeList] = await Promise.all([
          listSstCommunications({ limit: 100 }),
          listEmployees(),
        ])
        if (!active) return
        setRecords(communications.items)
        setEmployees(
          employeeList.map((employee) => ({
            id: employee.id,
            name: employee.name,
            lastName: employee.lastName,
            job: employee.job?.name ?? "Sin cargo asignado",
          })),
        )
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "No se pudo cargar el módulo de comunicaciones SST")
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadPage()
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    return {
      total: records.length,
      internal: records.filter((record) => record.type === "INTERNAL").length,
      external: records.filter((record) => record.type === "EXTERNAL").length,
      withInitialEvidence: records.filter((record) => record.initialEvidence).length,
      signed: records.filter((record) => record.signedEvidence).length,
    }
  }, [records])

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return records

    return records.filter(
      (record) =>
        record.mechanismName.toLowerCase().includes(term) ||
        mediumLabel(record).toLowerCase().includes(term) ||
        responsibleLabel(record, employees).toLowerCase().includes(term) ||
        record.initialEvidence?.originalName.toLowerCase().includes(term) ||
        record.signedEvidence?.originalName.toLowerCase().includes(term),
    )
  }, [employees, records, search])

  async function saveRecord(form: CommunicationForm, recordId?: string) {
    const payload: UpsertSstCommunicationDto = {
      mechanismName: form.mechanismName.trim(),
      type: form.type,
      medium: form.medium,
      customMedium: form.medium === "OTHER" ? form.customMedium.trim() : null,
      responsibleType: form.responsibleType,
      responsibleEmployeeId: form.responsibleType === "EMPLOYEE" ? form.responsibleEmployeeId : null,
      managerName: form.responsibleType === "MANAGER" ? form.managerName.trim() : null,
      implementationDate: form.implementationDate,
      observations: form.observations.trim(),
      informedCopasst: form.informedCopasst === "YES",
    }

    setSaving(true)
    try {
      if (recordId) {
        await updateSstCommunication(recordId, payload)
        toast.success("Comunicación SST actualizada")
      } else {
        await createSstCommunication(payload)
        toast.success("Comunicación SST creada")
      }
      await loadRecords(false)
      setDialogOpen(false)
      setEditingRecord(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la comunicación SST")
    } finally {
      setSaving(false)
    }
  }

  async function saveEvidence(recordId: string, form: EvidenceForm, file: File, kind: "initial" | "signed") {
    setUploading(true)
    try {
      const payload = { file, description: form.description.trim(), isConfirmed: true }
      if (kind === "initial") await uploadSstCommunicationInitialEvidence(recordId, payload)
      else await uploadSstCommunicationSignedEvidence(recordId, payload)
      toast.success(kind === "initial" ? "Evidencia inicial cargada" : "Documento firmado cargado")
      await loadRecords(false)
      setEvidenceRecord(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el documento")
    } finally {
      setUploading(false)
    }
  }

  async function deleteRecord(record: SstCommunication) {
    if (!window.confirm(`Eliminar la comunicacion "${record.mechanismName}"?`)) return
    setBusyRecordId(record.id)
    try {
      await deleteSstCommunication(record.id)
      setRecords((current) => current.filter((item) => item.id !== record.id))
      toast.success("Comunicación eliminada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la comunicación")
    } finally {
      setBusyRecordId(null)
    }
  }

  async function downloadPdf(record: SstCommunication) {
    if (!record.initialEvidence) {
      toast.error("Primero carga la evidencia inicial para poder generar el PDF de firma")
      return
    }

    setBusyRecordId(record.id)
    try {
      const blob = await downloadSstCommunicationSignaturePdf(record.id)
      downloadBlob(blob, `comunicacion-sst-${record.mechanismName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el PDF para firma")
    } finally {
      setBusyRecordId(null)
    }
  }

  async function viewEvidence(record: SstCommunication, kind: "initial" | "signed") {
    const evidence = kind === "initial" ? record.initialEvidence : record.signedEvidence
    if (!evidence) {
      toast.error(kind === "initial" ? "Esta comunicacion no tiene evidencia inicial" : "Esta comunicacion no tiene evidencia firmada")
      return
    }

    setBusyRecordId(record.id)
    try {
      const blob = await downloadSstCommunicationDocument(evidence.downloadUrl)
      setPreview({
        title: evidence.originalName,
        url: URL.createObjectURL(blob),
        mimeType: evidence.mimeType || blob.type || "application/octet-stream",
        generated: true,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento")
    } finally {
      setBusyRecordId(null)
    }
  }

  function closePreview() {
    if (preview?.generated) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  async function downloadEvidence(record: SstCommunication, kind: "initial" | "signed") {
    const evidence = kind === "initial" ? record.initialEvidence : record.signedEvidence
    if (!evidence) {
      toast.error(kind === "initial" ? "Esta comunicacion no tiene evidencia inicial" : "Esta comunicacion no tiene evidencia firmada")
      return
    }

    setBusyRecordId(record.id)
    try {
      const blob = await downloadSstCommunicationDocument(evidence.downloadUrl)
      downloadBlob(blob, evidence.originalName)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el documento")
    } finally {
      setBusyRecordId(null)
    }
  }

  async function openDetail(record: SstCommunication) {
    setBusyRecordId(record.id)
    try {
      setDetailRecord(await getSstCommunication(record.id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el detalle")
    } finally {
      setBusyRecordId(null)
    }
  }

  return (
    <main className="module-polish space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comunicaciones SST</h1>
          <p className="text-muted-foreground">
            Mecanismos internos y externos de comunicación del SG-SST, con evidencia inicial y documento firmado por gerencia.
          </p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            setEditingRecord(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nueva comunicación
        </Button>
      </div>

      <section className="overflow-x-auto py-1">
        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <div className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2">
            <span className="text-xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs font-medium text-slate-600">Total</span>
          </div>
          <div className="flex min-h-14 items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2">
            <span className="text-xl font-bold text-blue-700">{stats.internal}</span>
            <span className="text-xs font-medium text-slate-600">Internas</span>
          </div>
          <div className="flex min-h-14 items-center gap-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3.5 py-2">
            <span className="text-xl font-bold text-cyan-700">{stats.external}</span>
            <span className="text-xs font-medium text-slate-600">Externas</span>
          </div>
          <div className="flex min-h-14 items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2">
            <span className="text-xl font-bold text-blue-700">{stats.withInitialEvidence}</span>
            <span className="text-xs font-medium text-slate-600">Con evidencia</span>
          </div>
          <div className="flex min-h-14 items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2">
            <span className="text-xl font-bold text-emerald-700">{stats.signed}</span>
            <span className="text-xs font-medium text-slate-600">Firmadas</span>
          </div>
        </div>
      </section>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <MessageSquare className="h-5 w-5" />
                Lista de comunicaciones
              </h2>
              <p className="text-sm text-muted-foreground">
                Primero carga la evidencia inicial, luego descarga el PDF para firma de gerencia y finalmente sube el documento firmado.
              </p>
            </div>
            <div className="relative w-full lg:w-[360px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Buscar por mecanismo, medio o responsable"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[1280px] text-sm">
          <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Mecanismo</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Medio</th>
              <th className="px-4 py-3 font-medium">Responsable</th>
              <th className="px-4 py-3 font-medium">Implementación</th>
              <th className="px-4 py-3 font-medium">COPASST</th>
              <th className="px-4 py-3 font-medium">Evidencia inicial</th>
              <th className="px-4 py-3 font-medium">Documento firmado</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="align-middle hover:bg-secondary/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{record.mechanismName}</p>
                  <p className="max-w-[280px] truncate text-muted-foreground">{record.observations || "Sin observaciones"}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                    {typeLabel(record.type)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{mediumLabel(record)}</td>
                <td className="px-4 py-3 text-muted-foreground">{responsibleLabel(record, employees)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(record.implementationDate)}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      record.informedCopasst
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }
                  >
                    {record.informedCopasst ? "Informado" : "Pendiente"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {record.initialEvidence ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      {record.initialEvidence.originalName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sin evidencia inicial</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {record.signedEvidence ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-700" />
                      {record.signedEvidence.originalName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sin evidencia</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <DropdownMenuItem onSelect={() => void openDetail(record)} disabled={busyRecordId === record.id}>
                        <Eye className="h-4 w-4" />
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEvidenceKind("initial")
                          setEvidenceRecord(record)
                        }}
                      >
                        <Upload className="h-4 w-4" />
                        Cargar evidencia inicial
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void downloadPdf(record)} disabled={!record.initialEvidence || busyRecordId === record.id}>
                        <Download className="h-4 w-4" />
                        Descargar PDF para firma
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEvidenceKind("signed")
                          setEvidenceRecord(record)
                        }}
                        disabled={!record.initialEvidence}
                      >
                        <Upload className="h-4 w-4" />
                        Cargar evidencia firmada
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void viewEvidence(record, "initial")} disabled={!record.initialEvidence || busyRecordId === record.id}>
                        <FileText className="h-4 w-4" />
                        Ver evidencia inicial
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void viewEvidence(record, "signed")} disabled={!record.signedEvidence || busyRecordId === record.id}>
                        <FileText className="h-4 w-4" />
                        Ver documento firmado
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void downloadEvidence(record, "signed")} disabled={!record.signedEvidence || busyRecordId === record.id}>
                        <Download className="h-4 w-4" />
                        Descargar firmado
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditingRecord(record)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => void deleteRecord(record)} className="text-destructive" disabled={busyRecordId === record.id}>
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando comunicaciones SST...</span>
                </td>
              </tr>
            )}
            {!loading && filteredRecords.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No hay comunicaciones SST para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <Dialog open={Boolean(detailRecord)} onOpenChange={(nextOpen) => !nextOpen && setDetailRecord(null)}>
        <DialogContent className="module-dialog-polish max-w-4xl bg-card">
          <DialogHeader>
            <DialogTitle>Detalle de la comunicación SST</DialogTitle>
          </DialogHeader>
          {detailRecord && (
            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock label="Mecanismo" value={detailRecord.mechanismName} />
              <InfoBlock label="Tipo" value={typeLabel(detailRecord.type)} />
              <InfoBlock label="Medio" value={mediumLabel(detailRecord)} />
              <InfoBlock label="Responsable" value={responsibleLabel(detailRecord, employees)} />
              <InfoBlock label="Fecha implementación" value={formatDate(detailRecord.implementationDate)} />
              <InfoBlock label="COPASST" value={detailRecord.informedCopasst ? "Informado" : "Pendiente"} />
              <div className="rounded-md bg-secondary p-3 md:col-span-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">Evidencia inicial</p>
                <p className="mt-1 text-sm text-foreground">
                  {detailRecord.initialEvidence
                    ? `${detailRecord.initialEvidence.originalName} · ${formatDateTime(detailRecord.initialEvidence.createdAt)}`
                    : "Sin evidencia inicial"}
                </p>
              </div>
              <div className="rounded-md bg-secondary p-3 md:col-span-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">Observaciones</p>
                <p className="mt-1 text-sm text-foreground">{detailRecord.observations || "Sin observaciones"}</p>
              </div>
              <div className="rounded-md bg-secondary p-3 md:col-span-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">Evidencia firmada</p>
                <p className="mt-1 text-sm text-foreground">
                  {detailRecord.signedEvidence
                    ? `${detailRecord.signedEvidence.originalName} · ${formatDateTime(detailRecord.signedEvidence.createdAt)}`
                    : "Sin evidencia firmada"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setDetailRecord(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CommunicationDialog
        open={dialogOpen}
        record={editingRecord}
        employees={employees}
        saving={saving}
        onClose={() => {
          setDialogOpen(false)
          setEditingRecord(null)
        }}
        onSave={saveRecord}
      />
      <EvidenceDialog
        record={evidenceRecord}
        kind={evidenceKind}
        uploading={uploading}
        onClose={() => setEvidenceRecord(null)}
        onSave={saveEvidence}
      />
      <EvidencePreviewDialog preview={preview} onClose={closePreview} />
    </main>
  )
}
