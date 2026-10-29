"use client"

import { loadPesv, pesvVersion, savePesv, deletePesv, uploadPesvDocument, pesvBlob, pesvDocumentUrl, downloadPesv, pesvPath, pesvRequest } from "@/services/pesvService"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Car,
  Download,
  Edit,
  Eye,
  FileCheck2,
  FileText,
  MoreHorizontal,
  Plus,
  Route,
  Search,
  Trash2,
  Upload,
  UsersRound,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormDialogIcon, FormSectionTitle } from "@/components/ui/form-dialog-visuals"
import { SafeCloudFormDrawerFrame } from "@/components/ui/safecloud-form-drawer"
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
import { PesvModuleHeader } from "@/components/pesv/module-experience"
import { KpiStrip } from "@/components/dashboard/kpi-strip"

type DiagnosisEvidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
  mimeType?: string
  url?: string
}

type CollaboratorRoadProfile = {
  id: string
  name: string
  birthDate: string
  gender: "MASCULINO" | "FEMENINO"
  role: string
  educationLevel: string
  maritalStatus: string
  licenseValidUntil: string
  trainings: number
  competencyEvaluation: string
  roadAccidents: number
  trafficFines: number
  finesPaymentStatus: string
  commuteTransport: string
  isWorkDriver: boolean
  vehicleTypeDriven: string
  linkedAt: string
}

type VehicleRoadProfile = {
  id: string
  plate: string
  vin: string
  engineNumber: string
  mileage: number
  manufactureDate: string
  technicalSpecs: string
  soatValidUntil: string
  inspectionValidUntil: string
  roadAccidents: number
  preventiveMaintenancePlan: string
  maintenanceActions: string
  vehicleType: string
  estimatedMonthlyKm: number
  ownershipType: "PROPIO" | "AFILIADO" | "ASOCIADO" | "SERVICIO"
}

type FrequentRoute = {
  id: string
  origin: string
  destination: string
  kilometers: number
  weeklyFrequency: number
  monthlyFrequency: number
  yearlyFrequency: number
}

type PesvDiagnosis = {
  id: string
  year: number
  sitesCount: number
  servicesDescription: string
  contractorsDescription: string
  permanentContractors: number
  occasionalContractors: number
  loyalFleets: number
  occasionalFleets: number
  affiliates: number
  collaborators: CollaboratorRoadProfile[]
  vehicles: VehicleRoadProfile[]
  routes: FrequentRoute[]
  emergencyPlanTrained: number
  firstAidEquipmentDescription: string
  emergencyDrillsDescription: string
  findings: string
  updateDate: string
  status: "DRAFT" | "DOCUMENTED" | "UPDATED"
  evidence?: DiagnosisEvidence
  createdAt: string
  updatedAt: string
}

type DiagnosisForm = Omit<PesvDiagnosis, "id" | "collaborators" | "vehicles" | "routes" | "status" | "evidence" | "createdAt" | "updatedAt">

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


const defaultForm: DiagnosisForm = {
  year: new Date().getFullYear(),
  sitesCount: 1,
  servicesDescription: "Prestación de servicios administrativos, operativos y desplazamientos laborales asociados al objeto social.",
  contractorsDescription:
    "Incluye contratistas permanentes, ocasionales, afiliados, terceros y personas vinculadas por intermediación laboral que realizan desplazamientos laborales.",
  permanentContractors: 2,
  occasionalContractors: 1,
  loyalFleets: 1,
  occasionalFleets: 1,
  affiliates: 0,
  emergencyPlanTrained: 8,
  firstAidEquipmentDescription: "Botiquines portátiles, extintores vehiculares, chalecos reflectivos, conos y elementos básicos de primeros auxilios.",
  emergencyDrillsDescription: "Simulacro anual de atención de siniestro vial con revisión de tiempos de respuesta y roles.",
  findings:
    "Actualizar evaluación de competencia de conductores, reforzar control documental de vehículos y socializar rutas críticas frecuentes.",
  updateDate: new Date().toISOString().slice(0, 10),
}

const statusLabels: Record<PesvDiagnosis["status"], string> = {
  DRAFT: "Borrador",
  DOCUMENTED: "Documentado",
  UPDATED: "Actualizado",
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

function statusClassName(status: PesvDiagnosis["status"]) {
  if (status === "UPDATED") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "DOCUMENTED") return "border-sky-200 bg-sky-50 text-sky-700"
  return "border-amber-200 bg-amber-50 text-amber-700"
}

function canEmbed(mimeType?: string) {
  return Boolean(mimeType?.startsWith("image/") || mimeType === "application/pdf" || mimeType?.startsWith("text/"))
}

function DiagnosisDialog({
  open,
  diagnosis,
  onClose,
  onSave,
}: {
  open: boolean
  diagnosis: PesvDiagnosis | null
  onClose: () => void
  onSave: (form: DiagnosisForm, diagnosisId?: string) => Promise<boolean>
}) {
  const [form, setForm] = useState<DiagnosisForm>(defaultForm)
  const editing = Boolean(diagnosis)

  useEffect(() => {
    if (!open) return
    setForm(
      diagnosis
        ? {
            year: diagnosis.year,
            sitesCount: diagnosis.sitesCount,
            servicesDescription: diagnosis.servicesDescription,
            contractorsDescription: diagnosis.contractorsDescription,
            permanentContractors: diagnosis.permanentContractors,
            occasionalContractors: diagnosis.occasionalContractors,
            loyalFleets: diagnosis.loyalFleets,
            occasionalFleets: diagnosis.occasionalFleets,
            affiliates: diagnosis.affiliates,
            emergencyPlanTrained: diagnosis.emergencyPlanTrained,
            firstAidEquipmentDescription: diagnosis.firstAidEquipmentDescription,
            emergencyDrillsDescription: diagnosis.emergencyDrillsDescription,
            findings: diagnosis.findings,
            updateDate: diagnosis.updateDate,
          }
        : defaultForm,
    )
  }, [diagnosis, open])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.year) return toast.error("Ingresa el año del diagnóstico")
    if (!form.updateDate) return toast.error("Selecciona la fecha de actualización")
    if (!form.servicesDescription.trim()) return toast.error("Describe los servicios de la organización")
    if (!form.contractorsDescription.trim()) return toast.error("Describe contratistas, terceros y flotas")
    if (!form.findings.trim()) return toast.error("Registra los hallazgos del diagnóstico")

    const saved = await onSave(
      {
        ...form,
        servicesDescription: form.servicesDescription.trim(),
        contractorsDescription: form.contractorsDescription.trim(),
        firstAidEquipmentDescription: form.firstAidEquipmentDescription.trim(),
        emergencyDrillsDescription: form.emergencyDrillsDescription.trim(),
        findings: form.findings.trim(),
      },
      diagnosis?.id,
    )
    if (saved) onClose()
  }

  return (
    <SafeCloudFormDrawerFrame open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/75 px-6 py-4 pr-12">
          <div className="flex min-w-0 items-start gap-3">
            <FormDialogIcon icon="analytics" tone="blue" />
            <div className="min-w-0">
              <DialogTitle>{editing ? "Actualizar diagnóstico PESV" : "Nuevo diagnóstico PESV"}</DialogTitle>
              <p className="mt-1 text-sm text-slate-600">Registra el diagnóstico anual. La evidencia documental se carga después desde los 3 puntos.</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto bg-slate-50/40 px-6 py-5">
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="area" title="Organización" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Label className="grid gap-2">
                  Año
                  <Input type="number" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: Number(event.target.value) }))} />
                </Label>
                <Label className="grid gap-2">
                  Fecha de actualización
                  <Input type="date" value={form.updateDate} onChange={(event) => setForm((current) => ({ ...current, updateDate: event.target.value }))} />
                </Label>
                <Label className="grid gap-2">
                  Cantidad de sedes
                  <Input type="number" value={form.sitesCount} onChange={(event) => setForm((current) => ({ ...current, sitesCount: Number(event.target.value) }))} />
                </Label>
                <Label className="grid gap-2 sm:col-span-2">
                  Servicios que presta la organización
                  <Textarea value={form.servicesDescription} onChange={(event) => setForm((current) => ({ ...current, servicesDescription: event.target.value }))} rows={3} />
                </Label>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="employee" title="Contratistas, terceros y flotas" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Label className="grid gap-2">
                  Contratistas permanentes
                  <Input type="number" value={form.permanentContractors} onChange={(event) => setForm((current) => ({ ...current, permanentContractors: Number(event.target.value) }))} />
                </Label>
                <Label className="grid gap-2">
                  Contratistas ocasionales
                  <Input type="number" value={form.occasionalContractors} onChange={(event) => setForm((current) => ({ ...current, occasionalContractors: Number(event.target.value) }))} />
                </Label>
                <Label className="grid gap-2">
                  Afiliados / terceros
                  <Input type="number" value={form.affiliates} onChange={(event) => setForm((current) => ({ ...current, affiliates: Number(event.target.value) }))} />
                </Label>
                <Label className="grid gap-2">
                  Flotas fidelizadas
                  <Input type="number" value={form.loyalFleets} onChange={(event) => setForm((current) => ({ ...current, loyalFleets: Number(event.target.value) }))} />
                </Label>
                <Label className="grid gap-2">
                  Flotas ocasionales
                  <Input type="number" value={form.occasionalFleets} onChange={(event) => setForm((current) => ({ ...current, occasionalFleets: Number(event.target.value) }))} />
                </Label>
                <Label className="grid gap-2 sm:col-span-2">
                  Descripción
                  <Textarea value={form.contractorsDescription} onChange={(event) => setForm((current) => ({ ...current, contractorsDescription: event.target.value }))} rows={3} />
                </Label>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="emergency" title="Plan de emergencias viales" />
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  Colaboradores capacitados
                  <Input type="number" value={form.emergencyPlanTrained} onChange={(event) => setForm((current) => ({ ...current, emergencyPlanTrained: Number(event.target.value) }))} />
                </Label>
                <Label className="grid gap-2 md:col-span-2">
                  Equipos, equipamiento o elementos de primeros auxilios
                  <Textarea value={form.firstAidEquipmentDescription} onChange={(event) => setForm((current) => ({ ...current, firstAidEquipmentDescription: event.target.value }))} rows={3} />
                </Label>
                <Label className="grid gap-2 md:col-span-2">
                  Simulacros de atención de emergencias viales
                  <Textarea value={form.emergencyDrillsDescription} onChange={(event) => setForm((current) => ({ ...current, emergencyDrillsDescription: event.target.value }))} rows={3} />
                </Label>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <FormSectionTitle icon="details" title="Hallazgos del diagnóstico" />
              <Label className="grid gap-2">
                Hallazgos del diagnóstico
                <Textarea value={form.findings} onChange={(event) => setForm((current) => ({ ...current, findings: event.target.value }))} rows={4} />
              </Label>
            </section>

            <section className="rounded-md border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Upload className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Evidencia documental</h3>
                  <p className="text-sm text-muted-foreground">
                    El soporte del diagnóstico se carga después de crear el registro desde los 3 puntos.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{editing ? "Guardar cambios" : "Crear diagnóstico"}</Button>
          </DialogFooter>
        </form>
    </SafeCloudFormDrawerFrame>
  )
}

function EvidenceDialog({
  diagnosis,
  onClose,
  onSave,
}: {
  diagnosis: PesvDiagnosis | null
  onClose: () => void
  onSave: (diagnosisId: string, form: EvidenceForm, file: File | null) => Promise<boolean>
}) {
  const [form, setForm] = useState<EvidenceForm>({ fileName: "", description: "" })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!diagnosis) return
    setForm({
      fileName: diagnosis.evidence?.fileName ?? "",
      description: diagnosis.evidence?.description ?? "",
    })
    setFile(null)
  }, [diagnosis])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!diagnosis) return
    if (!form.fileName.trim() && !file) return toast.error("Selecciona o registra el soporte del diagnóstico")

    const saved = await onSave(diagnosis.id, form, file)
    if (saved) onClose()
  }

  return (
    <Dialog open={Boolean(diagnosis)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl bg-card">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Cargar evidencia del diagnóstico</DialogTitle>
            <p className="text-sm text-muted-foreground">Adjunta el documento soporte del diagnóstico anual PESV.</p>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Label className="grid gap-2">
              Evidencia
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
              <Input value={form.fileName} onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.value }))} placeholder="diagnostico-pesv.pdf" />
            </Label>
            <Label className="grid gap-2 md:col-span-2">
              Descripción
              <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} />
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar evidencia</Button>
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
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{preview?.title ?? "Evidencia"}</DialogTitle>
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
              <p className="text-sm">Puedes abrir o descargar el documento desde las acciones.</p>
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          {preview && (
            <Button type="button" variant="outline" onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")}>
              Abrir en otra pestaña
            </Button>
          )}
          <Button type="button" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PesvDiagnosisPage() {
  const [diagnoses, setDiagnoses] = useState<PesvDiagnosis[]>([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDiagnosis, setEditingDiagnosis] = useState<PesvDiagnosis | null>(null)
  const [evidenceDiagnosis, setEvidenceDiagnosis] = useState<PesvDiagnosis | null>(null)
  const [preview, setPreview] = useState<EvidencePreview | null>(null)

  const [loadError, setLoadError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  async function reload() {
    const result = await loadPesv<PesvDiagnosis>("diagnoses")
    setDiagnoses(result.map(item => ({ ...item, collaborators: item.collaborators ?? [], vehicles: item.vehicles ?? [], routes: item.routes ?? [] })))
    setLoadError("")
  }
  useEffect(() => { let active = true; loadPesv<PesvDiagnosis>("diagnoses").then(result => { if (active) setDiagnoses(result.map(item => ({ ...item, collaborators: item.collaborators ?? [], vehicles: item.vehicles ?? [], routes: item.routes ?? [] }))) }).catch(error => { if (active) setLoadError(error.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])

  const latestDiagnosis = diagnoses[0]
  const stats = useMemo(() => {
    const vehicles = diagnoses.reduce((sum, diagnosis) => sum + diagnosis.vehicles.length, 0)
    const collaborators = diagnoses.reduce((sum, diagnosis) => sum + diagnosis.collaborators.length, 0)
    const routes = diagnoses.reduce((sum, diagnosis) => sum + diagnosis.routes.length, 0)
    return {
      total: diagnoses.length,
      vehicles,
      collaborators,
      routes,
      pendingEvidence: diagnoses.filter((diagnosis) => !diagnosis.evidence).length,
    }
  }, [diagnoses])

  const filteredDiagnoses = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return diagnoses
    return diagnoses.filter((diagnosis) =>
      `${diagnosis.year} ${diagnosis.servicesDescription} ${diagnosis.findings}`.toLowerCase().includes(term),
    )
  }, [diagnoses, search])

  async function saveDiagnosis(form: DiagnosisForm, id?: string): Promise<boolean> {
    if (saving) return false
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { ...form, ...pesvVersion(diagnoses.find(item => item.id === id)) }
      if (!id) {
        const catalogs = await pesvRequest<Record<string, unknown>>("/api/pesv/diagnoses/catalogs")
        const fields = {
          collaborators: ["sourceEmployeeId", "name", "birthDate", "gender", "role", "educationLevel", "maritalStatus", "licenseValidUntil", "trainings", "competencyEvaluation", "roadAccidents", "trafficFines", "finesPaymentStatus", "commuteTransport", "isWorkDriver", "vehicleTypeDriven", "linkedAt"],
          vehicles: ["plate", "vin", "engineNumber", "mileage", "manufactureDate", "technicalSpecs", "soatValidUntil", "inspectionValidUntil", "roadAccidents", "preventiveMaintenancePlan", "maintenanceActions", "vehicleType", "estimatedMonthlyKm", "ownershipType"],
          routes: ["origin", "destination", "kilometers", "weeklyFrequency", "monthlyFrequency", "yearlyFrequency"],
        }
        for (const [key, allowed] of Object.entries(fields)) {
          const rows = catalogs[key]
          if (Array.isArray(rows)) payload[key] = rows.map(row => Object.fromEntries(Object.entries(row).filter(([field]) => allowed.includes(field))))
        }
      }
      await savePesv("diagnoses", payload, id)
      await reload().catch(error => { toast.error("Cambios guardados, pero no se pudo actualizar la vista: " + error.message) })
      toast.success(id ? "Registro actualizado" : "Registro creado")
      return true
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar"); return false }
    finally { setSaving(false) }
  }
  async function saveEvidence(id: string, form: EvidenceForm, file: File | null): Promise<boolean> {
    if (!file) { toast.error("Selecciona el archivo que deseas cargar"); return false }
    if (saving) return false
    setSaving(true)
    try { await uploadPesvDocument("diagnoses", id, file, form.description); await reload().catch(error => { toast.error("Cambios guardados, pero no se pudo actualizar la vista: " + error.message) }); toast.success("Evidencia cargada"); return true }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo cargar"); return false }
    finally { setSaving(false) }
  }
  async function deleteDiagnosis(diagnosis: PesvDiagnosis) {
    if (saving || !window.confirm("¿Eliminar este registro?")) return
    setSaving(true)
    try { await deletePesv("diagnoses", diagnosis.id); await reload().catch(error => { toast.error("Cambios guardados, pero no se pudo actualizar la vista: " + error.message) }); toast.success("Registro eliminado") }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo eliminar") }
    finally { setSaving(false) }
  }
  async function viewEvidence(diagnosis: PesvDiagnosis) {
    if (!diagnosis.evidence) return
    try { const blob = await pesvBlob(pesvDocumentUrl("diagnoses", diagnosis.id, diagnosis.evidence.id), diagnosis.evidence.mimeType); setPreview({ title: diagnosis.evidence.fileName, url: URL.createObjectURL(blob), mimeType: blob.type || diagnosis.evidence.mimeType || "application/octet-stream", generated: true }) }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento") }
  }
  function closePreview() { if (preview) URL.revokeObjectURL(preview.url); setPreview(null) }
  function downloadEvidence(diagnosis: PesvDiagnosis) {
    if (!diagnosis.evidence) return
    void downloadPesv(pesvDocumentUrl("diagnoses", diagnosis.id, diagnosis.evidence.id), diagnosis.evidence.fileName).catch(error => toast.error(error.message))
  }

  return (
    <main className="space-y-6">
      {loading && <p role="status">Cargando registros…</p>}
      {loadError && <div role="alert" className="border-l-2 border-red-500 p-3 text-sm text-red-700">{loadError}<Button variant="outline" onClick={() => { void reload().catch(error => setLoadError(error.message)) }}>Reintentar</Button></div>}
      <PesvModuleHeader title="Diagnóstico PESV" description="Documenta anualmente problemas de seguridad vial, perfiles de colaboradores, hoja de vida vehicular, rutas y emergencias." icon={FileText} actions={
        <Button
          className="w-full gap-2 sm:w-auto"
          onClick={() => {
            setEditingDiagnosis(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo diagnóstico
        </Button>
      } />

      <KpiStrip items={[
        { title: "Diagnósticos", value: stats.total, description: "Vigencias documentadas", icon: "total", tone: "blue" },
        { title: "Colaboradores", value: stats.collaborators, description: "Perfiles caracterizados", icon: "users", tone: "cyan" },
        { title: "Vehículos", value: stats.vehicles, description: "Flota relacionada", icon: "internal", tone: "slate" },
        { title: "Rutas", value: stats.routes, description: "Recorridos identificados", icon: "analysis", tone: "blue" },
        { title: "Pendientes evidencia", value: stats.pendingEvidence, description: "Soporte por cargar", icon: "evidence", tone: "amber" },
      ]} />

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Diagnósticos documentados</h2>
              <p className="text-sm text-muted-foreground">El soporte documental se carga después de crear el diagnóstico.</p>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar diagnóstico" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Año</th>
                  <th className="px-4 py-3 font-medium">Sedes / servicios</th>
                  <th className="px-4 py-3 font-medium">Contratistas</th>
                  <th className="px-4 py-3 font-medium">Colab.</th>
                  <th className="px-4 py-3 font-medium">Vehículos</th>
                  <th className="px-4 py-3 font-medium">Rutas</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDiagnoses.map((diagnosis) => (
                  <tr key={diagnosis.id}>
                    <td className="px-4 py-3 font-medium text-foreground">{diagnosis.year}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>{diagnosis.sitesCount} sede(s)</p>
                      <p className="max-w-[260px] truncate">{diagnosis.servicesDescription}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {diagnosis.permanentContractors + diagnosis.occasionalContractors + diagnosis.affiliates}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{diagnosis.collaborators.length}</td>
                    <td className="px-4 py-3 text-muted-foreground">{diagnosis.vehicles.length}</td>
                    <td className="px-4 py-3 text-muted-foreground">{diagnosis.routes.length}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusClassName(diagnosis.status)}>
                        {statusLabels[diagnosis.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60">
                          <DropdownMenuItem onSelect={() => { void downloadPesv(`${pesvPath("diagnoses", diagnosis.id)}/export`, "pesv-diagnoses.pdf").catch(error => toast.error(error.message)) }}>
                            <Download className="h-4 w-4" />
                            Descargar diagnóstico
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => viewEvidence(diagnosis)} disabled={!diagnosis.evidence}>
                            <Eye className="h-4 w-4" />
                            Ver evidencia
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => downloadEvidence(diagnosis)} disabled={!diagnosis.evidence}>
                            <Download className="h-4 w-4" />
                            Descargar evidencia
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEvidenceDiagnosis(diagnosis)}>
                            <Upload className="h-4 w-4" />
                            {diagnosis.evidence ? "Actualizar evidencia" : "Cargar evidencia"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditingDiagnosis(diagnosis)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onSelect={() => deleteDiagnosis(diagnosis)}>
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {latestDiagnosis && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UsersRound className="h-5 w-5" />
                Perfil vial de colaboradores
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 font-medium">Funcionario</th>
                    <th className="py-2 font-medium">Licencia</th>
                    <th className="py-2 font-medium">Transporte</th>
                    <th className="py-2 font-medium">Conductor</th>
                    <th className="py-2 font-medium">Comparendos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {latestDiagnosis.collaborators.map((collaborator) => (
                    <tr key={collaborator.id}>
                      <td className="py-3">
                        <p className="font-medium text-foreground">{collaborator.name}</p>
                        <p className="text-xs text-muted-foreground">{collaborator.role} · {collaborator.educationLevel}</p>
                      </td>
                      <td className="py-3 text-muted-foreground">{formatDate(collaborator.licenseValidUntil)}</td>
                      <td className="py-3 text-muted-foreground">{collaborator.commuteTransport}</td>
                      <td className="py-3 text-muted-foreground">{collaborator.isWorkDriver ? collaborator.vehicleTypeDriven : "No"}</td>
                      <td className="py-3 text-muted-foreground">{collaborator.trafficFines} · {collaborator.finesPaymentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-5 w-5" />
                Hoja de vida de vehículos
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 font-medium">Vehículo</th>
                    <th className="py-2 font-medium">VIN / motor</th>
                    <th className="py-2 font-medium">SOAT</th>
                    <th className="py-2 font-medium">Tecnomecánica</th>
                    <th className="py-2 font-medium">Km/mes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {latestDiagnosis.vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td className="py-3">
                        <p className="font-medium text-foreground">{vehicle.plate}</p>
                        <p className="text-xs text-muted-foreground">{vehicle.vehicleType} · {vehicle.ownershipType}</p>
                      </td>
                      <td className="py-3 text-muted-foreground">{vehicle.vin} / {vehicle.engineNumber}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(vehicle.soatValidUntil)}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(vehicle.inspectionValidUntil)}</td>
                      <td className="py-3 text-muted-foreground">{vehicle.estimatedMonthlyKm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border-border bg-card xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Route className="h-5 w-5" />
                Rutas frecuentes y emergencias viales
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2 font-medium">Ruta</th>
                      <th className="py-2 font-medium">Km</th>
                      <th className="py-2 font-medium">Semana</th>
                      <th className="py-2 font-medium">Mes</th>
                      <th className="py-2 font-medium">Año</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {latestDiagnosis.routes.map((route) => (
                      <tr key={route.id}>
                        <td className="py-3 text-foreground">{route.origin} - {route.destination}</td>
                        <td className="py-3 text-muted-foreground">{route.kilometers}</td>
                        <td className="py-3 text-muted-foreground">{route.weeklyFrequency}</td>
                        <td className="py-3 text-muted-foreground">{route.monthlyFrequency}</td>
                        <td className="py-3 text-muted-foreground">{route.yearlyFrequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="font-medium text-foreground">Emergencias viales</p>
                <p className="mt-2 text-sm text-muted-foreground">Capacitados: {latestDiagnosis.emergencyPlanTrained}</p>
                <p className="mt-2 text-sm text-muted-foreground">{latestDiagnosis.firstAidEquipmentDescription}</p>
                <p className="mt-2 text-sm text-muted-foreground">{latestDiagnosis.emergencyDrillsDescription}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <DiagnosisDialog
        open={dialogOpen}
        diagnosis={editingDiagnosis}
        onClose={() => {
          setDialogOpen(false)
          setEditingDiagnosis(null)
        }}
        onSave={saveDiagnosis}
      />
      <EvidenceDialog diagnosis={evidenceDiagnosis} onClose={() => setEvidenceDiagnosis(null)} onSave={saveEvidence} />
      <EvidencePreviewDialog preview={preview} onClose={closePreview} />
    </main>
  )
}
