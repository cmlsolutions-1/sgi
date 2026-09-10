"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Edit,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  UserRound,
} from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
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
import { Textarea } from "@/components/ui/textarea"
import { listEmployees } from "@/services/employeeService"
import { listWorkAreaOptions } from "@/services/workAreaService"
import type { Employee } from "@/types/manager/employee"
import type { WorkAreaOption } from "@/types/manager/work-area"

type ViewMode = "cards" | "list"
type ElementType = "INSTALLATION" | "MACHINERY" | "EQUIPMENT" | "EMERGENCY" | "OTHER"
type InspectionAction = "INSPECTION" | "MAINTENANCE"
type InspectionResult = "COMPLIES" | "DOES_NOT_COMPLY" | "PARTIAL"

type Evidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
  isConfirmed: boolean
}

type EmployeeOption = {
  id: string
  name: string
  email?: string
}

type InspectionRecord = {
  id: string
  elementName: string
  elementType: ElementType
  action: InspectionAction
  description: string
  workAreaId: string
  workAreaName: string
  date: string
  responsibleEmployeeId: string
  responsibleName: string
  copasstParticipated: boolean
  result: InspectionResult
  observations: string
  evidence?: Evidence
  createdAt: string
}

type InspectionForm = {
  elementName: string
  elementType: ElementType
  action: InspectionAction
  description: string
  workAreaId: string
  date: string
  responsibleEmployeeId: string
  copasstParticipated: boolean
  result: InspectionResult
  observations: string
}

type EvidenceForm = {
  fileName: string
  description: string
  isConfirmed: boolean
}

const emptyInspectionForm: InspectionForm = {
  elementName: "",
  elementType: "INSTALLATION",
  action: "INSPECTION",
  description: "",
  workAreaId: "",
  date: new Date().toISOString().slice(0, 10),
  responsibleEmployeeId: "",
  copasstParticipated: false,
  result: "COMPLIES",
  observations: "",
}

const emptyEvidenceForm: EvidenceForm = {
  fileName: "",
  description: "",
  isConfirmed: true,
}

const initialRecords: InspectionRecord[] = [
  {
    id: "inspection-1",
    elementName: "Extintor zona de bodega",
    elementType: "EMERGENCY",
    action: "INSPECTION",
    description: "Verificación visual de presión, sello, señalización y acceso libre.",
    workAreaId: "mock-area-1",
    workAreaName: "Bodega",
    date: "2026-09-10",
    responsibleEmployeeId: "mock-employee-1",
    responsibleName: "Responsable SG-SST",
    copasstParticipated: true,
    result: "COMPLIES",
    observations: "El elemento se encuentra operativo y señalizado.",
    evidence: {
      id: "inspection-evidence-1",
      fileName: "inspeccion-extintor-bodega.pdf",
      description: "Registro fotográfico y lista de chequeo.",
      uploadedAt: "2026-09-10T14:00:00.000Z",
      isConfirmed: true,
    },
    createdAt: "2026-09-10T14:00:00.000Z",
  },
]

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}`
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

function employeeFullName(employee: Employee) {
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "Funcionario sin nombre"
}

function toEmployeeOptions(employees: Employee[]): EmployeeOption[] {
  return employees.map((employee) => ({ id: employee.id, name: employeeFullName(employee), email: employee.email }))
}

function elementTypeLabel(value: ElementType) {
  const labels: Record<ElementType, string> = {
    INSTALLATION: "Instalación",
    MACHINERY: "Maquinaria",
    EQUIPMENT: "Equipo",
    EMERGENCY: "Emergencias",
    OTHER: "Otro",
  }
  return labels[value]
}

function actionLabel(value: InspectionAction) {
  return value === "MAINTENANCE" ? "Mantenimiento" : "Inspección"
}

function resultLabel(value: InspectionResult) {
  if (value === "DOES_NOT_COMPLY") return "No cumple"
  if (value === "PARTIAL") return "Parcial"
  return "Cumple"
}

function resultClassName(value: InspectionResult) {
  if (value === "COMPLIES") return "bg-accentActivd text-accentActivd-foreground border-transparent"
  if (value === "DOES_NOT_COMPLY") return "bg-destructive text-destructive-foreground border-transparent"
  return "bg-amber-100 text-amber-800 border-amber-200"
}

function findEmployeeName(employees: EmployeeOption[], employeeId: string) {
  return employees.find((employee) => employee.id === employeeId)?.name ?? ""
}

function findAreaName(areas: WorkAreaOption[], areaId: string) {
  return areas.find((area) => area.id === areaId)?.name ?? ""
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
      <span className="text-sm font-medium text-foreground">Responsable</span>
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
          ) : employees.length > 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">No se encontraron funcionarios con esa búsqueda.</p>
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">No hay funcionarios disponibles para seleccionar.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function WorkAreaPicker({
  areas,
  value,
  loading,
  onChange,
}: {
  areas: WorkAreaOption[]
  value: string
  loading: boolean
  onChange: (areaId: string) => void
}) {
  const [query, setQuery] = useState("")
  const filteredAreas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return areas
    return areas.filter((area) => area.name.toLowerCase().includes(normalizedQuery))
  }, [areas, query])

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-foreground">Área</span>
      <div className="rounded-md border border-input bg-background">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 pl-9" placeholder="Buscar área..." />
          </div>
        </div>
        <div className="max-h-44 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando áreas...
            </div>
          ) : filteredAreas.length > 0 ? (
            <div className="grid gap-1">
              {filteredAreas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => onChange(area.id)}
                  className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${value === area.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}
                >
                  <span className="block truncate font-medium">{area.name}</span>
                </button>
              ))}
            </div>
          ) : areas.length > 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">No se encontraron áreas con esa búsqueda.</p>
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">No hay áreas disponibles para seleccionar.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function downloadInspectionPdf(record: InspectionRecord) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text("Inspección y mantenimiento", 14, 18)
  doc.setFontSize(10)
  doc.text("SafeCloud - Sistema de Gestión Integral", 14, 26)

  autoTable(doc, {
    startY: 34,
    head: [["Campo", "Información"]],
    body: [
      ["Elemento", record.elementName],
      ["Tipo de elemento", elementTypeLabel(record.elementType)],
      ["Acción", actionLabel(record.action)],
      ["Descripción", record.description],
      ["Área", record.workAreaName],
      ["Fecha", formatDate(record.date)],
      ["Responsable", record.responsibleName],
      ["Participó el COPASST", record.copasstParticipated ? "Sí" : "No"],
      ["Resultado", resultLabel(record.result)],
      ["Observaciones", record.observations || "Sin observaciones"],
      ["Evidencia", record.evidence?.fileName ?? "Sin evidencia"],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [43, 135, 213] },
    columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" } },
  })

  doc.save(`${record.elementName.toLowerCase().replace(/\s+/g, "-")}.pdf`)
}

function InspectionDialog({
  open,
  record,
  employees,
  areas,
  loading,
  onClose,
  onSave,
}: {
  open: boolean
  record: InspectionRecord | null
  employees: EmployeeOption[]
  areas: WorkAreaOption[]
  loading: boolean
  onClose: () => void
  onSave: (form: InspectionForm, recordId?: string) => void
}) {
  const [form, setForm] = useState<InspectionForm>(emptyInspectionForm)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            elementName: record.elementName,
            elementType: record.elementType,
            action: record.action,
            description: record.description,
            workAreaId: record.workAreaId,
            date: record.date,
            responsibleEmployeeId: record.responsibleEmployeeId,
            copasstParticipated: record.copasstParticipated,
            result: record.result,
            observations: record.observations,
          }
        : emptyInspectionForm,
    )
  }, [open, record])

  const update = <K extends keyof InspectionForm>(key: K, value: InspectionForm[K]) => setForm((current) => ({ ...current, [key]: value }))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.elementName.trim() || !form.description.trim() || !form.workAreaId || !form.date || !form.responsibleEmployeeId) {
      toast.error("Diligencia el elemento, descripción, área, fecha y responsable.")
      return
    }
    onSave(form, record?.id)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{record ? "Editar inspección" : "Nueva inspección"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="element-name">Nombre del elemento</Label>
              <Input id="element-name" value={form.elementName} onChange={(event) => update("elementName", event.target.value)} placeholder="Ej. Extintor, escalera, máquina" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="element-type">Tipo de elemento</Label>
              <select id="element-type" value={form.elementType} onChange={(event) => update("elementType", event.target.value as ElementType)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="INSTALLATION">Instalación</option>
                <option value="MACHINERY">Maquinaria</option>
                <option value="EQUIPMENT">Equipo</option>
                <option value="EMERGENCY">Emergencias</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inspection-action">Acción</Label>
              <select id="inspection-action" value={form.action} onChange={(event) => update("action", event.target.value as InspectionAction)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="INSPECTION">Inspección</option>
                <option value="MAINTENANCE">Mantenimiento</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inspection-date">Fecha</Label>
              <Input id="inspection-date" type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inspection-result">Resultado</Label>
              <select id="inspection-result" value={form.result} onChange={(event) => update("result", event.target.value as InspectionResult)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="COMPLIES">Cumple</option>
                <option value="DOES_NOT_COMPLY">No cumple</option>
                <option value="PARTIAL">Parcial</option>
              </select>
            </div>
            <label className="flex min-h-10 items-center gap-2 rounded-md border border-input px-3 text-sm text-foreground md:mt-6">
              <input type="checkbox" checked={form.copasstParticipated} onChange={(event) => update("copasstParticipated", event.target.checked)} />
              Participó el COPASST
            </label>
            <WorkAreaPicker areas={areas} loading={loading} value={form.workAreaId} onChange={(areaId) => update("workAreaId", areaId)} />
            <EmployeePicker employees={employees} loading={loading} value={form.responsibleEmployeeId} onChange={(employeeId) => update("responsibleEmployeeId", employeeId)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inspection-description">Descripción</Label>
            <Textarea id="inspection-description" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Describe qué se inspecciona o mantiene" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inspection-observations">Observaciones</Label>
            <Textarea id="inspection-observations" value={form.observations} onChange={(event) => update("observations", event.target.value)} placeholder="Hallazgos, acciones o recomendaciones" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{record ? "Guardar cambios" : "Crear inspección"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EvidenceDialog({
  record,
  onClose,
  onUpload,
}: {
  record: InspectionRecord | null
  onClose: () => void
  onUpload: (record: InspectionRecord, evidence: EvidenceForm) => void
}) {
  const [form, setForm] = useState<EvidenceForm>(emptyEvidenceForm)

  useEffect(() => {
    if (record) setForm(emptyEvidenceForm)
  }, [record])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record) return
    if (!form.fileName.trim()) {
      toast.error("Selecciona o registra el nombre del archivo de evidencia.")
      return
    }
    onUpload(record, form)
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Subir evidencia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="evidence-file">Archivo</Label>
            <Input id="evidence-file" value={form.fileName} onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.value }))} placeholder="Nombre del archivo o soporte" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="evidence-description">Descripción</Label>
            <Textarea id="evidence-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe la evidencia cargada" />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.isConfirmed} onChange={(event) => setForm((current) => ({ ...current, isConfirmed: event.target.checked }))} />
            Evidencia confirmada
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="gap-2"><Upload className="h-4 w-4" />Subir</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DetailDialog({
  record,
  onClose,
  onDownload,
}: {
  record: InspectionRecord | null
  onClose: () => void
  onDownload: (record: InspectionRecord) => void
}) {
  if (!record) return null

  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{record.elementName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-blue-600 text-white border-transparent">{actionLabel(record.action)}</Badge>
            <Badge variant="outline" className={resultClassName(record.result)}>{resultLabel(record.result)}</Badge>
            <Badge variant="outline">Fecha: {formatDate(record.date)}</Badge>
          </div>
          <div className="grid gap-3 rounded-md border border-border p-4 text-sm md:grid-cols-2">
            <p><span className="font-medium">Tipo de elemento:</span> {elementTypeLabel(record.elementType)}</p>
            <p><span className="font-medium">Área:</span> {record.workAreaName}</p>
            <p><span className="font-medium">Responsable:</span> {record.responsibleName}</p>
            <p><span className="font-medium">Participó COPASST:</span> {record.copasstParticipated ? "Sí" : "No"}</p>
            <p><span className="font-medium">Creado:</span> {formatDateTime(record.createdAt)}</p>
            <p className="md:col-span-2"><span className="font-medium">Descripción:</span> {record.description}</p>
            <p className="md:col-span-2"><span className="font-medium">Observaciones:</span> {record.observations || "Sin observaciones"}</p>
          </div>
          <div className="rounded-md border border-border p-4">
            <h3 className="font-semibold text-foreground">Evidencia</h3>
            <p className="mt-2 text-sm text-muted-foreground">{record.evidence ? `${record.evidence.fileName} · ${formatDateTime(record.evidence.uploadedAt)}` : "Sin evidencia cargada."}</p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
          <Button type="button" className="gap-2" onClick={() => onDownload(record)}><Download className="h-4 w-4" />Descargar PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function InspectionsPage() {
  const [records, setRecords] = useState<InspectionRecord[]>(initialRecords)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [areas, setAreas] = useState<WorkAreaOption[]>([])
  const [loadingCatalogs, setLoadingCatalogs] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<"ALL" | InspectionAction>("ALL")
  const [resultFilter, setResultFilter] = useState<"ALL" | InspectionResult>("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<InspectionRecord | null>(null)
  const [evidenceRecord, setEvidenceRecord] = useState<InspectionRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<InspectionRecord | null>(null)

  useEffect(() => {
    let mounted = true
    setLoadingCatalogs(true)

    Promise.allSettled([listEmployees(), listWorkAreaOptions()])
      .then(([employeeResult, areaResult]) => {
        if (!mounted) return

        if (employeeResult.status === "fulfilled") {
          setEmployees(toEmployeeOptions(employeeResult.value))
        } else {
          toast.error("No se pudo cargar la lista de funcionarios.")
        }

        if (areaResult.status === "fulfilled") {
          setAreas(areaResult.value)
        } else {
          toast.error("No se pudieron cargar las áreas de trabajo.")
        }
      })
      .finally(() => {
        if (mounted) setLoadingCatalogs(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return records.filter((record) => {
      const matchesAction = actionFilter === "ALL" || record.action === actionFilter
      const matchesResult = resultFilter === "ALL" || record.result === resultFilter
      const searchable = `${record.elementName} ${record.description} ${record.workAreaName} ${record.responsibleName} ${record.observations}`
      const matchesSearch = !normalizedSearch || searchable.toLowerCase().includes(normalizedSearch)
      return matchesAction && matchesResult && matchesSearch
    })
  }, [actionFilter, records, resultFilter, search])

  const inspectionsCount = records.filter((record) => record.action === "INSPECTION").length
  const maintenanceCount = records.filter((record) => record.action === "MAINTENANCE").length
  const withEvidenceCount = records.filter((record) => record.evidence).length
  const pendingCount = records.filter((record) => record.result !== "COMPLIES").length

  function handleSave(form: InspectionForm, recordId?: string) {
    const responsibleName = findEmployeeName(employees, form.responsibleEmployeeId)
    const workAreaName = findAreaName(areas, form.workAreaId)

    setRecords((current) => {
      if (recordId) {
        return current.map((record) => (record.id === recordId ? { ...record, ...form, responsibleName, workAreaName } : record))
      }

      return [
        {
          id: createId("inspection"),
          ...form,
          responsibleName,
          workAreaName,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]
    })

    setDialogOpen(false)
    setEditingRecord(null)
    toast.success(recordId ? "Inspección actualizada." : "Inspección creada.")
  }

  function handleUpload(record: InspectionRecord, form: EvidenceForm) {
    const evidence: Evidence = {
      id: createId("inspection-evidence"),
      fileName: form.fileName,
      description: form.description,
      uploadedAt: new Date().toISOString(),
      isConfirmed: form.isConfirmed,
    }

    setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, evidence } : item)))
    setEvidenceRecord(null)
    toast.success("Evidencia cargada correctamente.")
  }

  function openEdit(record: InspectionRecord) {
    setEditingRecord(record)
    setDialogOpen(true)
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inspecciones</h1>
          <p className="text-sm text-muted-foreground">Registra inspecciones y mantenimientos de instalaciones, maquinaria, equipos y elementos de emergencia.</p>
        </div>
        <Button type="button" className="gap-2" onClick={() => { setEditingRecord(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4" />Nueva inspección
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Inspecciones</p><p className="mt-2 text-2xl font-bold text-foreground">{inspectionsCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Mantenimientos</p><p className="mt-2 text-2xl font-bold text-foreground">{maintenanceCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Con evidencia</p><p className="mt-2 text-2xl font-bold text-foreground">{withEvidenceCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pendientes</p><p className="mt-2 text-2xl font-bold text-foreground">{pendingCount}</p></CardContent></Card>
      </section>

      <section className="rounded-md border border-border bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
          <div className="grid gap-2">
            <Label htmlFor="inspection-search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="inspection-search" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar por elemento, área, responsable u observación" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inspection-action-filter">Acción</Label>
            <select id="inspection-action-filter" value={actionFilter} onChange={(event) => setActionFilter(event.target.value as "ALL" | InspectionAction)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="ALL">Todas</option>
              <option value="INSPECTION">Inspección</option>
              <option value="MAINTENANCE">Mantenimiento</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inspection-result-filter">Resultado</Label>
            <select id="inspection-result-filter" value={resultFilter} onChange={(event) => setResultFilter(event.target.value as "ALL" | InspectionResult)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="ALL">Todos</option>
              <option value="COMPLIES">Cumple</option>
              <option value="DOES_NOT_COMPLY">No cumple</option>
              <option value="PARTIAL">Parcial</option>
            </select>
          </div>
          <div className="flex rounded-md border border-border bg-secondary p-1">
            <Button type="button" size="sm" variant={viewMode === "cards" ? "default" : "ghost"} className="gap-2" onClick={() => setViewMode("cards")}><LayoutGrid className="h-4 w-4" />Tarjetas</Button>
            <Button type="button" size="sm" variant={viewMode === "list" ? "default" : "ghost"} className="gap-2" onClick={() => setViewMode("list")}><List className="h-4 w-4" />Lista</Button>
          </div>
        </div>
      </section>

      <section>
        {viewMode === "cards" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="grid gap-4 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{record.elementName}</h3>
                        <Badge variant="outline" className="bg-blue-600 text-white border-transparent">{actionLabel(record.action)}</Badge>
                        <Badge variant="outline" className={resultClassName(record.result)}>{resultLabel(record.result)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{elementTypeLabel(record.elementType)} · {record.workAreaName}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDetailRecord(record)}><Eye className="h-4 w-4" />Ver</Button>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(record.date)}</p>
                    <p className="flex items-center gap-2"><UserRound className="h-4 w-4" />{record.responsibleName}</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />COPASST: {record.copasstParticipated ? "Sí" : "No"}</p>
                    <p className="flex items-center gap-2"><FileText className="h-4 w-4" />{record.evidence ? "Con evidencia" : "Sin evidencia"}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openEdit(record)}><Edit className="h-4 w-4" />Editar</Button>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => downloadInspectionPdf(record)}><Download className="h-4 w-4" />PDF</Button>
                    <Button type="button" size="sm" className="gap-2" onClick={() => setEvidenceRecord(record)}><Upload className="h-4 w-4" />Evidencia</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredRecords.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No hay inspecciones para mostrar.</CardContent></Card>}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Elemento</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                  <th className="px-4 py-3 font-medium">Área</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Resultado</th>
                  <th className="px-4 py-3 font-medium">Evidencia</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{record.elementName}</p>
                      <p className="text-muted-foreground">{formatDate(record.date)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{elementTypeLabel(record.elementType)}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="bg-blue-600 text-white border-transparent">{actionLabel(record.action)}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{record.workAreaName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.responsibleName}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={resultClassName(record.result)}>{resultLabel(record.result)}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{record.evidence?.fileName ?? "Sin evidencia"}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => setDetailRecord(record)}><Eye className="h-4 w-4" />Ver detalle</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(record)}><Edit className="h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => downloadInspectionPdf(record)}><Download className="h-4 w-4" />Descargar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEvidenceRecord(record)}><Upload className="h-4 w-4" />Subir evidencia</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No hay inspecciones para mostrar.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <InspectionDialog
        open={dialogOpen}
        record={editingRecord}
        employees={employees}
        areas={areas}
        loading={loadingCatalogs}
        onClose={() => { setDialogOpen(false); setEditingRecord(null) }}
        onSave={handleSave}
      />
      <EvidenceDialog record={evidenceRecord} onClose={() => setEvidenceRecord(null)} onUpload={handleUpload} />
      <DetailDialog record={detailRecord} onClose={() => setDetailRecord(null)} onDownload={downloadInspectionPdf} />
    </main>
  )
}
