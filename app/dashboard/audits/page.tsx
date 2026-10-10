"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Download,
  Edit,
  Eye,
  FileText,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { listManagedDocuments } from "@/services/documentManagementService"
import { listEmployees } from "@/services/employeeService"
import {
  createSstAudit,
  createSstAuditAction,
  exportSstAudit,
  getSstAudit,
  listSstAuditActions,
  listSstAuditDocuments,
  listSstAudits,
  updateSstAudit,
  uploadSstAuditDocument,
} from "@/services/sstAuditService"
import type { ManagedDocument } from "@/types/manager/document-management"
import type { Employee } from "@/types/manager/employee"
import type {
  SstAudit,
  SstAuditAcpmType,
  SstAuditActionStatus,
  SstAuditDocument,
  SstAuditDocumentType,
  SstAuditMethodology,
  SstAuditStatus,
  SstAuditType,
} from "@/types/manager/sst-audit"

type AuditType = SstAuditType
type AuditMethodology = SstAuditMethodology
type AuditStatus = SstAuditStatus
type AcpmType = SstAuditAcpmType

type Option = {
  id: string
  name: string
  description?: string
}

type EmployeeOption = {
  id: string
  name: string
  email?: string
}

type Evidence = {
  id: string
  type: SstAuditDocumentType
  label: string
  fileName: string
  description: string
  uploadedAt: string
  isConfirmed: boolean
  mimeType: string
  size: number
  downloadUrl: string
}

type AuditAction = {
  id: string
  type: AcpmType
  name: string
  responsible: string
  dueDate: string
  status: SstAuditActionStatus
}

type AuditRecord = {
  id: string
  year: string
  name: string
  scheduledDate: string
  auditType: AuditType
  internalAuditorId: string
  internalAuditorName: string
  externalAuditTeam: string
  scope: string
  methodology: AuditMethodology
  status: AuditStatus
  procedureId: string
  procedureName: string
  evidencesCount: number
  actionsCount: number
  evidences: Evidence[]
  actions: AuditAction[]
  createdAt: string
}

type AuditForm = {
  year: string
  name: string
  scheduledDate: string
  auditType: AuditType
  internalAuditorId: string
  externalAuditTeam: string
  scope: string
  methodology: AuditMethodology
  status: AuditStatus
  procedureId: string
}

type EvidenceForm = {
  type: SstAuditDocumentType
  file: File | null
  description: string
  isConfirmed: boolean
}

type ActionForm = {
  type: AcpmType
  name: string
  responsible: string
  dueDate: string
  status: AuditAction["status"]
}

const currentYear = String(new Date().getFullYear())

const emptyAuditForm: AuditForm = {
  year: currentYear,
  name: "",
  scheduledDate: new Date().toISOString().slice(0, 10),
  auditType: "INTERNAL",
  internalAuditorId: "",
  externalAuditTeam: "",
  scope: "",
  methodology: "PRESENTIAL",
  status: "ACTIVE",
  procedureId: "",
}

const emptyEvidenceForm: EvidenceForm = {
  type: "OPENING_MINUTES",
  file: null,
  description: "",
  isConfirmed: true,
}

const emptyActionForm: ActionForm = {
  type: "CORRECTIVE",
  name: "",
  responsible: "",
  dueDate: "",
  status: "PENDING",
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function employeeFullName(employee: Employee) {
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "Funcionario sin nombre"
}

function documentLabel(document: ManagedDocument) {
  const code = document.code ? `${document.code} · ` : ""
  return `${code}${document.name}`
}

function auditTypeLabel(value: AuditType) {
  return value === "EXTERNAL" ? "Externa" : "Interna"
}

function methodologyLabel(value: AuditMethodology) {
  return value === "VIRTUAL" ? "Virtual" : "Presencial"
}

function statusLabel(value: AuditStatus) {
  if (value === "EXPIRED") return "Vencida"
  if (value === "FINISHED") return "Finalizada"
  return "Activa"
}

function statusClassName(value: AuditStatus) {
  if (value === "EXPIRED") return "bg-destructive text-destructive-foreground border-transparent"
  if (value === "FINISHED") return "bg-accentActivd text-accentActivd-foreground border-transparent"
  return "bg-blue-600 text-white border-transparent"
}

function acpmTypeLabel(value: AcpmType) {
  if (value === "PREVENTIVE") return "Preventiva"
  if (value === "IMPROVEMENT") return "Mejora"
  return "Correctiva"
}

function evidenceTypeLabel(value: SstAuditDocumentType) {
  if (value === "CLOSING_MINUTES") return "Acta de fin de auditoría"
  if (value === "AUDIT_REPORT") return "Informe de auditoría"
  if (value === "OTHER_EVIDENCE") return "Otra evidencia"
  return "Acta de inicio de auditoría"
}

function mapEvidence(document: SstAuditDocument): Evidence {
  return {
    id: document.id,
    type: document.type,
    label: document.label || evidenceTypeLabel(document.type),
    fileName: document.originalName,
    description: document.description ?? "",
    uploadedAt: document.createdAt,
    isConfirmed: document.isConfirmed,
    mimeType: document.mimeType,
    size: document.size,
    downloadUrl: document.downloadUrl,
  }
}

function mapAudit(audit: SstAudit): AuditRecord {
  const internalAuditorName = audit.internalAuditor
    ? `${audit.internalAuditor.name ?? ""} ${audit.internalAuditor.lastName ?? ""}`.trim()
    : ""
  const procedureName = audit.procedure
    ? `${audit.procedure.code ? `${audit.procedure.code} · ` : ""}${audit.procedure.name}`
    : ""
  const evidences = (audit.evidences ?? []).map(mapEvidence)
  const actions = (audit.actions ?? []).map((action) => ({
    id: action.id,
    type: action.type,
    name: action.name,
    responsible: action.responsible,
    dueDate: action.dueDate,
    status: action.status,
  }))

  return {
    id: audit.id,
    year: String(audit.year),
    name: audit.name,
    scheduledDate: audit.scheduledDate,
    auditType: audit.auditType,
    internalAuditorId: audit.internalAuditorId ?? "",
    internalAuditorName,
    externalAuditTeam: audit.externalAuditTeam ?? "",
    scope: audit.scope,
    methodology: audit.methodology,
    status: audit.status,
    procedureId: audit.procedureId,
    procedureName,
    evidencesCount: audit.evidencesCount ?? evidences.length,
    actionsCount: audit.actionsCount ?? actions.length,
    evidences,
    actions,
    createdAt: audit.createdAt,
  }
}

function EmployeePicker({
  employees,
  value,
  loading,
  onChange,
}: {
  employees: EmployeeOption[]
  value: string
  loading: boolean
  onChange: (employeeId: string) => void
}) {
  const [query, setQuery] = useState("")
  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return employees
    return employees.filter((employee) => employee.name.toLowerCase().includes(normalizedQuery) || (employee.email?.toLowerCase() ?? "").includes(normalizedQuery))
  }, [employees, query])

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-foreground">Empleado auditor</span>
      <div className="rounded-md border border-input bg-background">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 pl-9" placeholder="Buscar funcionario..." />
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando funcionarios...
            </div>
          ) : filteredEmployees.length > 0 ? (
            <div className="grid gap-1">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => onChange(employee.id)}
                  className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${value === employee.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}
                >
                  <span className="block font-medium">{employee.name}</span>
                  {employee.email && <span className={`block truncate text-xs ${value === employee.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{employee.email}</span>}
                </button>
              ))}
            </div>
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">No hay funcionarios disponibles.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function SearchableOptionPicker({
  label,
  value,
  options,
  loading,
  placeholder,
  emptyMessage,
  onChange,
}: {
  label: string
  value: string
  options: Option[]
  loading: boolean
  placeholder: string
  emptyMessage: string
  onChange: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return options
    return options.filter((option) => `${option.name} ${option.description ?? ""}`.toLowerCase().includes(normalizedQuery))
  }, [options, query])

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="rounded-md border border-input bg-background">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 pl-9" placeholder={placeholder} />
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando opciones...
            </div>
          ) : filteredOptions.length > 0 ? (
            <div className="grid gap-1">
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange(option.id)}
                  className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${value === option.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}
                >
                  <span className="block truncate font-medium">{option.name}</span>
                  {option.description && <span className={`block truncate text-xs ${value === option.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{option.description}</span>}
                </button>
              ))}
            </div>
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">{emptyMessage}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function AuditDialog({
  open,
  audit,
  employees,
  documents,
  loading,
  saving,
  onClose,
  onSave,
}: {
  open: boolean
  audit: AuditRecord | null
  employees: EmployeeOption[]
  documents: Option[]
  loading: boolean
  saving: boolean
  onClose: () => void
  onSave: (form: AuditForm, auditId?: string) => void
}) {
  const [form, setForm] = useState<AuditForm>(emptyAuditForm)

  useEffect(() => {
    if (!open) return
    setForm(
      audit
        ? {
            year: audit.year,
            name: audit.name,
            scheduledDate: audit.scheduledDate,
            auditType: audit.auditType,
            internalAuditorId: audit.internalAuditorId,
            externalAuditTeam: audit.externalAuditTeam,
            scope: audit.scope,
            methodology: audit.methodology,
            status: audit.status,
            procedureId: audit.procedureId,
          }
        : emptyAuditForm,
    )
  }, [audit, open])

  const update = <K extends keyof AuditForm>(key: K, value: AuditForm[K]) => setForm((current) => ({ ...current, [key]: value }))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.year.trim() || !form.name.trim() || !form.scheduledDate || !form.scope.trim() || !form.procedureId) {
      toast.error("Diligencia vigencia, nombre, fecha, alcance y procedimiento.")
      return
    }
    if (form.auditType === "INTERNAL" && !form.internalAuditorId) {
      toast.error("Selecciona el empleado auditor para la auditoría interna.")
      return
    }
    if (form.auditType === "EXTERNAL" && !form.externalAuditTeam.trim()) {
      toast.error("Registra el equipo auditor externo.")
      return
    }
    onSave(form, audit?.id)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="module-dialog-polish record-dialog-polish !flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-6 py-4 pr-12">
          <div className="flex items-start gap-3 text-left">
            <FormDialogIcon icon="tracking" tone="blue" />
            <div>
              <DialogTitle>{audit ? "Editar auditoría SST" : "Nueva auditoría SST"}</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">Programa la auditoría, define su alcance y asigna el equipo responsable.</p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/40 px-6 py-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <FormSectionTitle icon="details" title="Información general" description="Identifica la auditoría, su vigencia y la fecha programada." tone="blue" />
            <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="audit-year">Año / Vigencia</Label>
              <Input id="audit-year" type="number" min="2000" max="2100" value={form.year} onChange={(event) => update("year", event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="audit-date">Fecha programada</Label>
              <Input id="audit-date" type="date" value={form.scheduledDate} onChange={(event) => update("scheduledDate", event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="audit-name">Nombre de la auditoría</Label>
              <Input id="audit-name" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Ej. Auditoría interna SG-SST" />
            </div>
            <div>
              <Label className="mb-2 block">Tipo de auditoría</Label>
              <Select value={form.auditType} onValueChange={(value) => update("auditType", value as AuditType)}>
                <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="INTERNAL">Interna</SelectItem><SelectItem value="EXTERNAL">Externa</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Metodología</Label>
              <Select value={form.methodology} onValueChange={(value) => update("methodology", value as AuditMethodology)}>
                <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="PRESENTIAL">Presencial</SelectItem><SelectItem value="VIRTUAL">Virtual</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Estado</Label>
              <Select value={form.status} onValueChange={(value) => update("status", value as AuditStatus)}>
                <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ACTIVE">Activa</SelectItem><SelectItem value="EXPIRED">Vencida</SelectItem><SelectItem value="FINISHED">Finalizada</SelectItem></SelectContent>
              </Select>
            </div>
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <FormSectionTitle icon="employee" title="Equipo y procedimiento" description="Asigna el auditor y relaciona el procedimiento aplicable." tone="cyan" />
            <div className="grid gap-4 md:grid-cols-2">
            {form.auditType === "INTERNAL" ? (
              <EmployeePicker employees={employees} loading={loading} value={form.internalAuditorId} onChange={(employeeId) => update("internalAuditorId", employeeId)} />
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="external-team">Equipo auditor</Label>
                <Textarea id="external-team" value={form.externalAuditTeam} onChange={(event) => update("externalAuditTeam", event.target.value)} placeholder="Empresa, auditor líder y equipo externo" />
              </div>
            )}
            <SearchableOptionPicker label="Procedimiento relacionado" value={form.procedureId} options={documents} loading={loading} placeholder="Buscar procedimiento..." emptyMessage="No hay procedimientos disponibles." onChange={(id) => update("procedureId", id)} />
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <FormSectionTitle icon="document" title="Alcance de la auditoría" description="Describe los procesos, sedes y requisitos que serán evaluados." tone="amber" />
            <div className="grid gap-2">
              <Label htmlFor="audit-scope">Alcance</Label>
              <Textarea id="audit-scope" value={form.scope} onChange={(event) => update("scope", event.target.value)} placeholder="Procesos, sedes, módulos o requisitos que cubre la auditoría" rows={4} />
            </div>
          </section>
          </div>
          <DialogFooter className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{audit ? "Guardar cambios" : "Crear auditoría"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  audit,
  uploading,
  onClose,
  onUpload,
}: {
  audit: AuditRecord | null
  uploading: boolean
  onClose: () => void
  onUpload: (audit: AuditRecord, form: EvidenceForm) => void
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)

  useEffect(() => {
    if (audit) setForm(emptyEvidenceForm)
  }, [audit])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!audit) return
    if (!form.file) {
      toast.error("Selecciona el archivo o soporte de la auditoría.")
      return
    }
    onUpload(audit, form)
  }

  return (
    <Dialog open={Boolean(audit)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="module-dialog-polish sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Cargar documento de auditoría</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="evidence-label">Tipo de documento</Label>
            <select id="evidence-label" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as SstAuditDocumentType }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="OPENING_MINUTES">Acta de inicio de auditoría</option>
              <option value="CLOSING_MINUTES">Acta de fin de auditoría</option>
              <option value="AUDIT_REPORT">Informe de auditoría</option>
              <option value="OTHER_EVIDENCE">Otra evidencia</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="evidence-file">Archivo</Label>
            <Input id="evidence-file" type="file" onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="evidence-description">Descripción</Label>
            <Textarea id="evidence-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe el soporte cargado" />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.isConfirmed} onChange={(event) => setForm((current) => ({ ...current, isConfirmed: event.target.checked }))} />
            Documento confirmado
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={uploading} onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="gap-2" disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Cargar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ActionDialog({
  audit,
  saving,
  onClose,
  onSave,
}: {
  audit: AuditRecord | null
  saving: boolean
  onClose: () => void
  onSave: (audit: AuditRecord, form: ActionForm) => void
}) {
  const [form, setForm] = useState<ActionForm>(emptyActionForm)

  useEffect(() => {
    if (audit) setForm(emptyActionForm)
  }, [audit])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!audit) return
    if (!form.name.trim() || !form.responsible.trim() || !form.dueDate) {
      toast.error("Diligencia nombre, responsable y fecha límite de la acción ACPM.")
      return
    }
    onSave(audit, form)
  }

  return (
    <Dialog open={Boolean(audit)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="module-dialog-polish sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar acción ACPM</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="action-type">Tipo</Label>
              <select id="action-type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AcpmType }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="PREVENTIVE">Preventiva</option>
                <option value="CORRECTIVE">Correctiva</option>
                <option value="IMPROVEMENT">Mejora</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="action-due-date">Fecha límite</Label>
              <Input id="action-due-date" type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="action-name">Acción</Label>
            <Input id="action-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Acción derivada de la auditoría" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="action-responsible">Responsable</Label>
            <Input id="action-responsible" value={form.responsible} onChange={(event) => setForm((current) => ({ ...current, responsible: event.target.value }))} placeholder="Responsable de ejecutar la acción" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Agregar acción</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DetailDialog({
  audit,
  onClose,
  onDownload,
}: {
  audit: AuditRecord | null
  onClose: () => void
  onDownload: (audit: AuditRecord) => void
}) {
  if (!audit) return null

  return (
    <Dialog open={Boolean(audit)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="module-dialog-polish max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{audit.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusClassName(audit.status)}>{statusLabel(audit.status)}</Badge>
            <Badge variant="outline">{auditTypeLabel(audit.auditType)}</Badge>
            <Badge variant="outline">{methodologyLabel(audit.methodology)}</Badge>
          </div>
          <div className="grid gap-3 rounded-md border border-border p-4 text-sm md:grid-cols-2">
            <p><span className="font-medium">Vigencia:</span> {audit.year}</p>
            <p><span className="font-medium">Fecha programada:</span> {formatDate(audit.scheduledDate)}</p>
            <p><span className="font-medium">Auditor / equipo:</span> {audit.auditType === "INTERNAL" ? audit.internalAuditorName : audit.externalAuditTeam}</p>
            <p><span className="font-medium">Procedimiento:</span> {audit.procedureName || "No relacionado"}</p>
            <p className="md:col-span-2"><span className="font-medium">Alcance:</span> {audit.scope}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-border p-4">
              <h3 className="font-semibold text-foreground">Documentos de auditoría</h3>
              <div className="mt-3 grid gap-2">
                {audit.evidences.length ? audit.evidences.map((evidence) => (
                  <div key={evidence.id} className="rounded-md bg-secondary/40 p-3 text-sm">
                    <p className="font-medium text-foreground">{evidence.label}</p>
                    <p className="text-muted-foreground">{evidence.fileName}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">Sin documentos cargados.</p>}
              </div>
            </div>
            <div className="rounded-md border border-border p-4">
              <h3 className="font-semibold text-foreground">Acciones derivadas ACPM</h3>
              <div className="mt-3 grid gap-2">
                {audit.actions.length ? audit.actions.map((action) => (
                  <div key={action.id} className="rounded-md bg-secondary/40 p-3 text-sm">
                    <p className="font-medium text-foreground">{action.name}</p>
                    <p className="text-muted-foreground">{acpmTypeLabel(action.type)} · {action.responsible} · {formatDate(action.dueDate)}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">Sin acciones registradas.</p>}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
          <Button type="button" className="gap-2" onClick={() => onDownload(audit)}><Download className="h-4 w-4" />Descargar plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditRecord[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [documents, setDocuments] = useState<Option[]>([])
  const [loadingAudits, setLoadingAudits] = useState(true)
  const [loadingCatalogs, setLoadingCatalogs] = useState(false)
  const [savingAudit, setSavingAudit] = useState(false)
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const [savingAction, setSavingAction] = useState(false)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [yearFilter, setYearFilter] = useState(currentYear)
  const [statusFilter, setStatusFilter] = useState<"ALL" | AuditStatus>("ALL")
  const [auditDialogOpen, setAuditDialogOpen] = useState(false)
  const [editingAudit, setEditingAudit] = useState<AuditRecord | null>(null)
  const [evidenceAudit, setEvidenceAudit] = useState<AuditRecord | null>(null)
  const [actionAudit, setActionAudit] = useState<AuditRecord | null>(null)
  const [detailAudit, setDetailAudit] = useState<AuditRecord | null>(null)

  async function loadAudits() {
    setLoadingAudits(true)
    try {
      const response = await listSstAudits({ page: 1, limit: 100 })
      setAudits(response.items.map(mapAudit))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las auditorías SST.")
    } finally {
      setLoadingAudits(false)
    }
  }

  useEffect(() => {
    void loadAudits()
  }, [])

  useEffect(() => {
    let mounted = true
    setLoadingCatalogs(true)

    Promise.allSettled([listEmployees(), listManagedDocuments()])
      .then(([employeeResult, documentResult]) => {
        if (!mounted) return

        if (employeeResult.status === "fulfilled") {
          setEmployees(employeeResult.value.map((employee) => ({ id: employee.id, name: employeeFullName(employee), email: employee.email })))
        } else {
          toast.error("No se pudo cargar la lista de funcionarios.")
        }

        if (documentResult.status === "fulfilled") {
          const procedureDocuments = documentResult.value.filter((document) => document.type === "PROCEDURE")
          const source = procedureDocuments.length > 0 ? procedureDocuments : documentResult.value
          setDocuments(source.map((document) => ({ id: document.id, name: documentLabel(document), description: document.workArea?.name })))
        } else {
          toast.error("No se pudieron cargar los procedimientos.")
        }
      })
      .finally(() => {
        if (mounted) setLoadingCatalogs(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const filteredAudits = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return audits.filter((audit) => {
      const matchesYear = !yearFilter || audit.year === yearFilter
      const matchesStatus = statusFilter === "ALL" || audit.status === statusFilter
      const searchable = `${audit.name} ${audit.scope} ${audit.procedureName} ${audit.internalAuditorName} ${audit.externalAuditTeam}`
      const matchesSearch = !normalizedSearch || searchable.toLowerCase().includes(normalizedSearch)
      return matchesYear && matchesStatus && matchesSearch
    })
  }, [audits, search, statusFilter, yearFilter])

  const stats = {
    total: audits.length,
    active: audits.filter((audit) => audit.status === "ACTIVE").length,
    expired: audits.filter((audit) => audit.status === "EXPIRED").length,
    finished: audits.filter((audit) => audit.status === "FINISHED").length,
  }

  async function handleSaveAudit(form: AuditForm, auditId?: string) {
    setSavingAudit(true)
    try {
      const dto = {
        year: Number(form.year),
        name: form.name.trim(),
        scheduledDate: form.scheduledDate,
        auditType: form.auditType,
        internalAuditorId: form.auditType === "INTERNAL" ? form.internalAuditorId : null,
        externalAuditTeam: form.auditType === "EXTERNAL" ? form.externalAuditTeam.trim() : null,
        scope: form.scope.trim(),
        methodology: form.methodology,
        status: form.status,
        procedureId: form.procedureId,
      }
      if (auditId) await updateSstAudit(auditId, dto)
      else await createSstAudit(dto)
      await loadAudits()
      setAuditDialogOpen(false)
      setEditingAudit(null)
      toast.success(auditId ? "Auditoría actualizada." : "Auditoría creada en el plan anual.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la auditoría SST.")
    } finally {
      setSavingAudit(false)
    }
  }

  async function handleUploadEvidence(audit: AuditRecord, form: EvidenceForm) {
    if (!form.file) return
    setUploadingEvidence(true)
    try {
      await uploadSstAuditDocument(audit.id, {
        file: form.file,
        type: form.type,
        description: form.description,
        isConfirmed: form.isConfirmed,
      })
      await loadAudits()
      setEvidenceAudit(null)
      toast.success("Documento de auditoría cargado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el documento de auditoría.")
    } finally {
      setUploadingEvidence(false)
    }
  }

  async function handleSaveAction(audit: AuditRecord, form: ActionForm) {
    setSavingAction(true)
    try {
      await createSstAuditAction(audit.id, form)
      await loadAudits()
      setActionAudit(null)
      toast.success("Acción ACPM agregada a la auditoría.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo agregar la acción ACPM.")
    } finally {
      setSavingAction(false)
    }
  }

  async function openAuditDetail(audit: AuditRecord) {
    try {
      const [detail, evidences, actions] = await Promise.all([
        getSstAudit(audit.id),
        listSstAuditDocuments(audit.id),
        listSstAuditActions(audit.id),
      ])
      setDetailAudit(mapAudit({ ...detail, evidences, actions }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el detalle de la auditoría.")
    }
  }

  async function downloadAuditPdf(audit: AuditRecord) {
    setExportingId(audit.id)
    try {
      const blob = await exportSstAudit(audit.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `auditoria-sst-${audit.year}-${audit.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el plan de auditoría.")
    } finally {
      setExportingId(null)
    }
  }

  return (
    <main className="module-polish flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auditorías SST</h1>
          <p className="text-sm text-muted-foreground">Gestiona el plan anual, procedimientos, documentos de apertura/cierre, informes y acciones ACPM.</p>
        </div>
        <Button type="button" className="gap-2" onClick={() => { setEditingAudit(null); setAuditDialogOpen(true) }}>
          <Plus className="h-4 w-4" />Nueva auditoría
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2"><span className="text-xl font-bold text-slate-900">{stats.total}</span><span className="text-xs font-medium text-slate-600">Plan anual</span></div>
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2"><span className="text-xl font-bold text-emerald-700">{stats.active}</span><span className="text-xs font-medium text-slate-600">Activas</span></div>
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2"><span className="text-xl font-bold text-rose-700">{stats.expired}</span><span className="text-xs font-medium text-slate-600">Vencidas</span></div>
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2"><span className="text-xl font-bold text-blue-700">{stats.finished}</span><span className="text-xs font-medium text-slate-600">Finalizadas</span></div>
      </section>

      <section className="rounded-md border border-border bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[140px_180px_1fr] lg:items-end">
          <div className="grid gap-2">
            <Label htmlFor="audit-year-filter">Vigencia</Label>
            <Input id="audit-year-filter" type="number" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="audit-status-filter">Estado</Label>
            <select id="audit-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | AuditStatus)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activa</option>
              <option value="EXPIRED">Vencida</option>
              <option value="FINISHED">Finalizada</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="audit-search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="audit-search" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar por nombre, auditor, alcance o procedimiento" />
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-x-auto rounded-md border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <List className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Plan anual de auditorías</h2>
        </div>
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Auditoría</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Auditor / equipo</th>
              <th className="px-4 py-3 font-medium">Procedimiento</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Soportes</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingAudits && <tr><td colSpan={8} className="px-4 py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></td></tr>}
            {!loadingAudits && filteredAudits.map((audit) => (
              <tr key={audit.id} className="align-middle">
                <td className="px-4 py-3">
                  <p className="max-w-[260px] truncate font-medium text-foreground">{audit.name}</p>
                  <p className="max-w-[260px] truncate text-muted-foreground">{audit.scope}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(audit.scheduledDate)}</p>
                  <p>Vigencia {audit.year}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{auditTypeLabel(audit.auditType)} · {methodologyLabel(audit.methodology)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p className="max-w-[190px] truncate">{audit.auditType === "INTERNAL" ? audit.internalAuditorName : audit.externalAuditTeam}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground"><p className="max-w-[220px] truncate">{audit.procedureName || "No relacionado"}</p></td>
                <td className="px-4 py-3"><Badge variant="outline" className={statusClassName(audit.status)}>{statusLabel(audit.status)}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p>{audit.evidencesCount} documentos</p>
                  <p>{audit.actionsCount} ACPM</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <DropdownMenuItem onSelect={() => void openAuditDetail(audit)}><Eye className="h-4 w-4" />Ver detalle</DropdownMenuItem>
                      <DropdownMenuItem disabled={exportingId === audit.id} onSelect={() => void downloadAuditPdf(audit)}><Download className="h-4 w-4" />Descargar plan</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => { setEditingAudit(audit); setAuditDialogOpen(true) }}><Edit className="h-4 w-4" />Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setEvidenceAudit(audit)}><Upload className="h-4 w-4" />Cargar acta o informe</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setActionAudit(audit)}><Plus className="h-4 w-4" />Agregar acción ACPM</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {!loadingAudits && filteredAudits.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No hay auditorías para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <AuditDialog
        open={auditDialogOpen}
        audit={editingAudit}
        employees={employees}
        documents={documents}
        loading={loadingCatalogs}
        saving={savingAudit}
        onClose={() => { setAuditDialogOpen(false); setEditingAudit(null) }}
        onSave={handleSaveAudit}
      />
      <EvidenceDialog audit={evidenceAudit} uploading={uploadingEvidence} onClose={() => setEvidenceAudit(null)} onUpload={handleUploadEvidence} />
      <ActionDialog audit={actionAudit} saving={savingAction} onClose={() => setActionAudit(null)} onSave={handleSaveAction} />
      <DetailDialog audit={detailAudit} onClose={() => setDetailAudit(null)} onDownload={downloadAuditPdf} />
    </main>
  )
}
