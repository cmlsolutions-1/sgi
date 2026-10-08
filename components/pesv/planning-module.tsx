"use client"

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { Download, Edit, Eye, FileCheck2, MoreHorizontal, Plus, Search, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  configs, completion, currentYear, dateToday, ids, initialValues, itemStatus, loadCatalogs, nextReview,
  readItems, readStore, storageKey, text, validateRecord, visibleFields,
  type Activity, type Catalogs, type Entry, type Evidence, type Field, type Kind, type Option,
  type PesvModule, type RecordItem, type Reference, type Values,
} from "@/lib/pesv/planning"

const selectClass = "h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
const money = (value: string) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value || 0))
const emptyCatalogs: Catalogs = { policies: [], risks: [], people: [], objectives: [], programs: [], competencies: [], trainingActivities: [], procedures: [], routes: [], vehicles: [], emergencyPlans: [], workActivities: [] }
const sourceLinks: Partial<Record<Reference, { href: string; label: string }>> = {
  policies: { href: "/dashboard/pesv-policy", label: "Política de Seguridad Vial" },
  risks: { href: "/dashboard/pesv-risks", label: "Riesgos Viales" },
  objectives: { href: "/dashboard/pesv-objectives", label: "Objetivos y metas del PESV" },
  programs: { href: "/dashboard/pesv-programs", label: "Programas de riesgos críticos" },
  competencies: { href: "/dashboard/pesv-training", label: "Competencia y formación" },
  trainingActivities: { href: "/dashboard/pesv-training", label: "Plan anual de formación" },
  procedures: { href: "/dashboard/pesv-behavior", label: "Procedimientos y responsabilidades" },
  routes: { href: "/dashboard/pesv-diagnosis", label: "Rutas del diagnóstico PESV" },
  vehicles: { href: "/dashboard/pesv-diagnosis", label: "Vehículos del diagnóstico PESV" },
  emergencyPlans: { href: "/dashboard/pesv-emergencies", label: "Planes de emergencias viales" },
  workActivities: { href: "/dashboard/pesv-work-plan", label: "Plan anual de trabajo del PESV" },
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid min-w-0 gap-2"><Label>{label}</Label>{children}</div>
}
export function Modal({ open, onOpenChange, title, children, footer }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; children: ReactNode; footer?: ReactNode }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] !max-w-5xl flex-col gap-0 overflow-hidden bg-card p-0">
      <DialogHeader className="shrink-0 border-b px-6 py-5 pr-12"><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      {footer && <DialogFooter className="shrink-0 border-t px-6 py-4">{footer}</DialogFooter>}
    </DialogContent>
  </Dialog>
}
export function ReferenceInput({ field, value, options, onChange }: { field: Field; value: string | string[]; options: Option[]; onChange: (value: string | string[]) => void }) {
  const [search, setSearch] = useState("")
  const selectedIds = ids(value)
  const available = options.filter(o => (!field.criticalOnly || o.eligible !== false || selectedIds.includes(o.value)))
  const selected = selectedIds.map(id => options.find(o => o.value === id)).filter((o): o is Option => Boolean(o))
  return <div className="min-w-0 space-y-2">
    {field.multiple ? <div className="rounded-md border">
      <Input aria-label={`Buscar en ${field.label}`} className="rounded-b-none border-0 border-b" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="max-h-40 overflow-y-auto p-2">{available.filter(o => o.label.toLowerCase().includes(search.toLowerCase())).map(o => <label key={o.value} className="flex cursor-pointer items-start gap-2 rounded px-2 py-2 text-sm hover:bg-muted"><input type="checkbox" className="mt-1 shrink-0 accent-blue-600" checked={selectedIds.includes(o.value)} onChange={e => onChange(e.target.checked ? [...selectedIds, o.value] : selectedIds.filter(id => id !== o.value))} /><span className="min-w-0 break-words">{o.label}{field.criticalOnly && o.eligible === false && <span className="block text-xs text-amber-700">Ya no tiene valoración crítica; se conserva la relación histórica.</span>}</span></label>)}{!available.length && <p className="px-2 py-3 text-sm text-muted-foreground">Sin registros disponibles.</p>}</div>
    </div> : <select aria-label={field.label} className={selectClass} required={field.required} value={text(value)} onChange={e => onChange(e.target.value)}><option value="">Seleccionar</option>{available.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>}
    {selected.length > 0 && <p className="text-xs text-muted-foreground">{selected.map(o => o.label).join(" · ")}</p>}
    {field.reference === "policies" && selected[0]?.description && <p className="whitespace-pre-wrap border-l-2 border-blue-300 pl-3 text-xs text-muted-foreground">{selected[0].description}</p>}
    {!available.length && field.reference && sourceLinks[field.reference] && <Link href={sourceLinks[field.reference]!.href} className="text-sm text-primary underline">Ir a {sourceLinks[field.reference]!.label}</Link>}
  </div>
}
export function FieldInput({ field, value, catalogs, onChange }: { field: Field; value: string | string[]; catalogs: Catalogs; onChange: (value: string | string[]) => void }) {
  if (field.type === "reference" && field.reference) return <ReferenceInput field={field} value={value} options={catalogs[field.reference]} onChange={onChange} />
  if (field.type === "textarea") return <Textarea aria-label={field.label} required={field.required} className="min-h-24 resize-y" value={text(value)} onChange={e => onChange(e.target.value)} />
  if (field.type === "select") return <select className={selectClass} aria-label={field.label} value={text(value)} onChange={e => onChange(e.target.value)}>{field.options?.map(o => <option key={o}>{o}</option>)}</select>
  if (field.type === "money") return <div className="relative"><span className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground">$</span><Input aria-label={field.label} required={field.required} className="pl-7" inputMode="numeric" value={text(value) ? Number(value).toLocaleString("es-CO") : ""} onChange={e => onChange(e.target.value.replace(/\D/g, ""))} /></div>
  return <Input aria-label={field.label} type={field.type === "date" ? "date" : field.type === "number" || field.type === "year" ? "number" : "text"} required={field.required} min={field.min ?? (field.type === "year" ? 2000 : undefined)} max={field.max ?? (field.type === "year" ? 2100 : undefined)} step={field.type === "year" || ["accidents", "infractions", "complaints"].includes(field.key) ? 1 : "any"} value={text(value)} onChange={e => onChange(e.target.value)} />
}

function displayValue(field: Field, record: RecordItem, catalogs: Catalogs) {
  const value = record.values[field.key]
  if (field.reference) return ids(value).map(id => catalogs[field.reference!].find(o => o.value === id)?.label ?? record.links[field.key]?.find(o => o.value === id)?.label ?? "Registro relacionado no disponible").join(" · ") || "Sin relación"
  return field.type === "money" ? money(text(value)) : text(value) || "Sin registrar"
}
function createDemo(kind: Kind, catalogs: Catalogs): RecordItem | null {
  const values = initialValues(kind)
  const year = currentYear()
  const base = { year: String(year), startDate: `${year}-01-01`, endDate: `${year}-12-31`, nextReviewDate: `${year + 1}-01-01` }
  const p = catalogs.people[0]?.value ?? ""
  const policyId = catalogs.policies[0]?.value ?? ""
  const patches: Record<string, Values> = {
    objective: { ...base, name: "Reducir la distracción en desplazamientos laborales", policyId, description: "Prevenir siniestros mediante hábitos de conducción atentos y controles al uso del celular.", alignment: "Promoción de movilidad segura y mejora continua de la política PESV.", indicator: "Conductores con formación preventiva", formula: "Conductores formados / total de conductores × 100", unit: "Porcentaje (%)", baseline: "40", target: "100", direction: "Aumentar", frequency: "Trimestral", responsibleId: p },
    program: { ...base, name: "Conducción sin distracciones", type: "Prevención de la distracción", riskIds: catalogs.risks.filter(r => r.eligible).slice(0, 1).map(r => r.value), objectiveIds: catalogs.objectives.slice(0, 1).map(o => o.value), scope: "Conductores en desplazamientos laborales.", objective: "Reducir la distracción durante la conducción.", goal: "Formar al 100% de los conductores.", baseline: "40% de conductores formados", indicator: "Cobertura de formación", measurement: "Conductores formados / conductores convocados × 100", performanceFactors: "Control del uso de celulares y elementos distractores.", budget: "1500000", responsibleIds: [p], evaluationFrequency: "Trimestral", trackingMechanism: "Inspecciones y seguimiento a reportes de conducción.", controlMechanism: "Observación de hábitos y reportes de supervisores.", distractions: "Celular y manipulación de dispositivos; detención segura antes de usarlos.", breachProcedure: "Retroalimentación, refuerzo y revisión de casos reiterativos.", communication: "Campañas y charla trimestral." },
    "work-activity": { ...base, name: "Renovar dos vehículos de la flota", policyId, objectiveIds: catalogs.objectives.slice(0, 1).map(o => o.value), programIds: [], description: "Adquirir dos vehículos con mejores especificaciones de seguridad.", nationalPlanAlignment: "Fortalecer el componente de vehículos seguros.", sstArticulation: "Articulación con compras y mantenimiento preventivo.", responsibleId: p, budget: "160000000", resources: "Equipo de compras y mantenimiento.", deliverable: "Facturas, actas de entrega y registros de los vehículos.", goal: "Dos vehículos incorporados a la operación." },
    competency: { ...base, name: "Perfil de competencia del líder PESV", role: "Líder PESV", personId: p, educationRequired: "Profesional o tecnólogo afín a la gestión de seguridad vial.", trainingRequired: "Formación en diseño e implementación del PESV.", experienceRequired: "Experiencia coordinando procesos de seguridad vial.", actualEducation: "Profesional", actualTraining: "Formación en seguridad vial registrada en diagnóstico.", actualExperience: "Dos años de coordinación de procesos.", evaluationDate: dateToday(), evaluatorId: catalogs.people[1]?.value ?? p, result: "Requiere formación", gaps: "Actualización en análisis de riesgos viales." },
    "training-activity": { ...base, name: "Prevención de la distracción", topic: "Conducción segura y uso de dispositivos", competencyIds: catalogs.competencies.slice(0, 1).map(c => c.value), participantIds: catalogs.people.map(o => o.value), objective: "Fortalecer hábitos de conducción sin distracciones.", trainerId: p, durationHours: "2", modality: "Presencial", budget: "350000", evaluationMethod: "Prueba de conocimientos y observación de hábitos." },
    procedure: { ...base, name: "Responsabilidades y comportamiento vial seguro", version: "1.0", responsibleId: p, contractRequirements: "Pruebas teóricas y prácticas y verificación de aptitud médica para el rol.", accidentReporting: "Reportar oportunamente los siniestros en desplazamientos laborales.", trainingParticipation: "Asistir a las actividades de formación programadas.", legalCommitment: "Cumplir las normas de tránsito y lineamientos internos.", healthReporting: "Informar oportunamente las condiciones que afectan la conducción segura.", evaluationProcedure: "Evaluación anual de siniestros, infracciones, quejas y formación; definir refuerzos.", safeHabitsStrategy: "Promover autocuidado, conducción preventiva y protección de los demás actores viales." },
    "behavior-evaluation": { ...base, name: "Evaluación anual de comportamiento vial", personId: p, procedureId: catalogs.procedures[0]?.value ?? "", evaluationDate: dateToday(), periodStart: `${year}-01-01`, periodEnd: dateToday(), evaluatorId: catalogs.people[1]?.value ?? p, accidents: "0", infractions: "1", complaints: "0", trainings: "Inducción de seguridad vial.", findings: "Una infracción de tránsito; requiere fortalecer el cumplimiento de límites.", result: "Requiere refuerzo", reinforcement: "Capacitación en velocidad segura.", trainingIds: [], communication: "Retroalimentación individual con el colaborador." },
    "emergency-plan": { ...base, name: "PPRAEV de desplazamientos laborales", version: "1.0", responsibleId: p, scope: "Colaboradores y contratistas durante desplazamientos laborales.", routeIds: catalogs.routes.map(r => r.value), riskIds: catalogs.risks.slice(0, 1).map(r => r.value), routeRisks: "Cruces urbanos, tráfico mixto y distracción durante recorridos frecuentes.", accidentReporting: "Registrar ubicación, hora y descripción del evento y activar la cadena de llamado.", callChain: "Primer respondiente → coordinador operativo → líder PESV → gerencia. Directorio por completar.", emergencyNumber: "123", externalContacts: "Organismos de socorro de la zona: directorio por completar.", medicalCenters: "Centro médico de referencia: nombre, ubicación, teléfono y acceso por completar.", responderIds: [p], responderProtocol: "Activar el plan de respuesta y coordinar con los organismos de socorro.", pasProtect: "Protección de la zona conforme al protocolo de la organización.", pasAlert: "Activación de la cadena de llamado y reporte de ubicación del evento.", pasAssist: "Atención dentro de las competencias del primer respondiente y coordinación con personal capacitado.", equipment: "Botiquines, extintores, chalecos reflectivos y conos. Inventario y ubicación por completar.", trainingProtocol: "Formación y evaluación de protocolos de atención, reporte y PAS.", trainingIds: catalogs.trainingActivities.slice(0, 1).map(r => r.value), drillStrategy: "Un simulacro vial anual con evaluación de tiempos y roles.", communityCoordination: "Invitar a organismos de socorro, comité y comunidad de las rutas cuando sea posible." },
    "road-drill": { ...base, name: "Simulacro anual de respuesta vial", planId: catalogs.emergencyPlans[0]?.value ?? "", scenario: "Siniestro vial durante un desplazamiento laboral.", place: "Zona controlada de la organización", responsibleId: p, startDate: dateToday(), endDate: dateToday(), participantIds: catalogs.people.map(r => r.value), externalParticipants: "Participación de organismos de socorro sujeta a coordinación.", objective: "Evaluar la cadena de llamado, roles y protocolo de respuesta.", equipment: "Botiquín, extintores y señalización del escenario.", expectedResponseMinutes: "10", evaluationCriteria: "Tiempo de respuesta, comunicaciones, roles y oportunidades de mejora." },
  }
  Object.assign(values, patches[kind.id])
  const activities: Activity[] = kind.activities ? [{ id: "demo-activity", name: "Taller de conducción sin distracciones", responsible: catalogs.people[0]?.label ?? "Responsable PESV", startDate: `${year}-10-15`, endDate: `${year}-10-15`, budget: "350000" }] : []
  if (validateRecord(kind, values, activities, catalogs)) return null
  const at = new Date().toISOString()
  const links: Record<string, Option[]> = {}
  for (const f of kind.fields.filter(f => f.reference)) links[f.key] = catalogs[f.reference!].filter(o => ids(values[f.key]).includes(o.value))
  return { id: crypto.randomUUID(), kind: kind.id, values, activities, entries: [], evidence: [], createdAt: at, updatedAt: at, history: [{ at, action: "Registro de demostración creado", snapshot: values, activities }], links }
}

export default function PesvPlanningModule({ module }: { module: PesvModule }) {
  const config = configs[module]
  const [kindId, setKindId] = useState(config.kinds[0].id)
  const kind = config.kinds.find(k => k.id === kindId)!
  const [items, setItems] = useState<RecordItem[]>([])
  const [catalogs, setCatalogs] = useState<Catalogs>(emptyCatalogs)
  const [ready, setReady] = useState(false)
  const [search, setSearch] = useState("")
  const [year, setYear] = useState(String(currentYear()))
  const [status, setStatus] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<Values>({})
  const [activities, setActivities] = useState<Activity[]>([])
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [uploadTarget, setUploadTarget] = useState<{ itemId: string; targetId?: string } | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<Evidence | null>(null)
  const [entryTarget, setEntryTarget] = useState<{ itemId: string; kind: Entry["kind"] } | null>(null)
  const [entryForm, setEntryForm] = useState({ date: dateToday(), observations: "", progress: "0", measuredValue: "0", medium: "Correo", audience: "Todos los colaboradores", conclusion: "", nextReviewDate: `${currentYear() + 1}${dateToday().slice(4)}` })
  const [attendeeIds, setAttendeeIds] = useState<string[]>([])
  const [evaluationOutcome, setEvaluationOutcome] = useState("")
  function refresh() { setCatalogs(loadCatalogs()) }
  useEffect(() => {
    const catalogs = loadCatalogs()
    const stored = readStore<RecordItem[] | null>(storageKey(module), null)
    let records = stored ?? []
    if (stored === null) {
      for (const k of config.kinds) {
        const demo = createDemo(k, catalogs)
        if (demo) {
          records.push(demo)
          if (k.id === "competency") catalogs.competencies.push({ value: demo.id, label: `${text(demo.values.name)} · ${text(demo.values.year)}` })
          if (k.id === "procedure") catalogs.procedures.push({ value: demo.id, label: text(demo.values.name) })
          if (k.id === "emergency-plan") catalogs.emergencyPlans.push({ value: demo.id, label: text(demo.values.name), year: text(demo.values.year) })
        }
      }
      try { localStorage.setItem(storageKey(module), JSON.stringify(records)) } catch { toast.error("No se pudieron guardar los registros de demostración.") }
    }
    setItems(records); refresh(); setReady(true)
    window.addEventListener("focus", refresh); window.addEventListener("storage", refresh)
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh) }
  }, [module, config])
  function persist(next: RecordItem[]) {
    try { localStorage.setItem(storageKey(module), JSON.stringify(next)); setItems(next); refresh(); return true }
    catch { toast.error("No se pudo guardar en el navegador. Reduce el tamaño del archivo o libera espacio."); return false }
  }
  const visible = useMemo(() => items.filter(item => item.kind === kindId && (!year || text(item.values.year) === year) && (!status || itemStatus(item) === status) && `${text(item.values.name)} ${text(item.values.description)} ${Object.values(item.links).flat().map(o => o.label).join(" ")}`.toLowerCase().includes(search.toLowerCase())), [items, kindId, year, status, search])
  const years = [...new Set([String(currentYear()), ...items.map(i => text(i.values.year))])].sort().reverse()
  const statuses = [...new Set(items.filter(i => i.kind === kindId).map(itemStatus))]
  const detail = items.find(i => i.id === detailId)
  const detailKind = detail ? config.kinds.find(k => k.id === detail.kind)! : kind
  const entryItem = items.find(i => i.id === entryTarget?.itemId)
  function openForm(item?: RecordItem) {
    refresh(); setEditingId(item?.id ?? null); setValues(item ? structuredClone(item.values) : initialValues(kind)); setActivities(item ? structuredClone(item.activities) : []); setFormOpen(true)
  }
  function save(event: FormEvent) {
    event.preventDefault()
    const currentCatalogs = loadCatalogs()
    const existing = items.find(i => i.id === editingId)
    const error = validateRecord(kind, values, activities, currentCatalogs, existing)
    if (error) { toast.error(error); return }
    if (kind.id === "behavior-evaluation" && items.some(i => i.id !== editingId && i.kind === kind.id && i.values.year === values.year && i.values.personId === values.personId)) { toast.error("Este colaborador ya tiene una evaluación en esa vigencia. Edita la existente."); return }
    if (existing?.entries.some(e => e.kind === "FOLLOW_UP") && kind.id === "objective" && ["baseline", "target", "direction", "unit"].some(key => text(values[key]) !== text(existing.values[key]))) { toast.error("El objetivo ya tiene mediciones. Conserva la meta y crea una nueva versión para cambiarla."); return }
    const activeValues = Object.fromEntries(visibleFields(kind, values).map(f => [f.key, typeof values[f.key] === "string" ? text(values[f.key]).trim() : values[f.key]])) as Values
    const links: Record<string, Option[]> = {}
    for (const f of kind.fields.filter(f => f.reference)) links[f.key] = ids(activeValues[f.key]).map(id => currentCatalogs[f.reference!].find(o => o.value === id) ?? existing?.links[f.key]?.find(o => o.value === id)).filter((o): o is Option => Boolean(o))
    const at = new Date().toISOString()
    const record: RecordItem = { id: existing?.id ?? crypto.randomUUID(), kind: kind.id, values: activeValues, activities, links, entries: existing?.entries ?? [], evidence: existing?.evidence ?? [], createdAt: existing?.createdAt ?? at, updatedAt: at, history: [...(existing?.history ?? []), { at, action: existing ? "Registro actualizado" : "Registro creado", snapshot: structuredClone(activeValues), activities: structuredClone(activities) }] }
    if (persist(existing ? items.map(i => i.id === existing.id ? record : i) : [...items, record])) { setYear(text(activeValues.year)); setFormOpen(false); toast.success("Registro guardado") }
  }
  function openEntry(item: RecordItem, entryKind: Entry["kind"]) {
    const last = item.entries.filter(e => e.kind === "FOLLOW_UP").at(-1)
    setEntryForm({ date: dateToday(), observations: "", progress: String(completion(item)), measuredValue: String(last?.measuredValue ?? item.values.baseline ?? 0), medium: "Correo", audience: "Todos los colaboradores", conclusion: "", nextReviewDate: `${currentYear() + 1}${dateToday().slice(4)}` })
    setAttendeeIds([]); setEvaluationOutcome(""); setEntryTarget({ itemId: item.id, kind: entryKind })
  }
  function saveEntry(event: FormEvent) {
    event.preventDefault()
    if (!entryTarget || !entryItem) return
    const start = text(entryItem.values.startDate) || text(entryItem.values.periodStart) || entryItem.createdAt.slice(0, 10)
    const previous = entryItem.entries.filter(e => e.kind === entryTarget.kind).at(-1)
    if (entryForm.date < start || entryForm.date > dateToday() || (previous && entryForm.date < previous.date)) { toast.error("La fecha debe ser posterior al inicio y al último registro, y no puede estar en el futuro."); return }
    const progress = Number(entryForm.progress), measuredValue = Number(entryForm.measuredValue)
    if (entryTarget.kind === "FOLLOW_UP" && (!Number.isFinite(progress) || progress < 0 || progress > 100 || !Number.isFinite(measuredValue) || measuredValue < 0)) { toast.error("Revisa el avance (0–100%) y el valor medido."); return }
    if (entryItem.kind === "objective" && entryItem.values.unit === "Porcentaje (%)" && measuredValue > 100) { toast.error("La medición porcentual no puede superar 100."); return }
    if (entryTarget.kind === "ANNUAL_REVIEW" && (!entryForm.conclusion.trim() || entryForm.nextReviewDate <= entryForm.date || entryForm.nextReviewDate > `${Number(entryForm.date.slice(0, 4)) + 1}${entryForm.date.slice(4)}`)) { toast.error("Completa la conclusión y programa la próxima revisión dentro de un año."); return }
    if (entryItem.kind === "training-activity" && entryTarget.kind === "FOLLOW_UP" && (!attendeeIds.length || !evaluationOutcome.trim())) { toast.error("Selecciona los asistentes y registra el resultado del aprendizaje."); return }
    if (entryItem.kind === "road-drill" && entryTarget.kind === "FOLLOW_UP" && (!attendeeIds.length || !evaluationOutcome.trim() || measuredValue <= 0 || entryForm.date.slice(0, 4) !== text(entryItem.values.year))) { toast.error("Registra asistentes, resultados y tiempo de respuesta; la ejecución debe pertenecer a la vigencia del simulacro."); return }
    const entry: Entry = { id: crypto.randomUUID(), kind: entryTarget.kind, date: entryForm.date, observations: entryForm.observations.trim(), ...(entryTarget.kind === "FOLLOW_UP" ? { progress, ...(entryItem.kind === "objective" ? { measuredValue } : {}) } : {}), ...(entryTarget.kind === "DIFFUSION" ? { medium: entryForm.medium, audience: entryForm.audience.trim() } : {}), ...(entryTarget.kind === "ANNUAL_REVIEW" ? { conclusion: entryForm.conclusion.trim(), nextReviewDate: entryForm.nextReviewDate } : {}) }
    if ((entryItem.kind === "training-activity" || entryItem.kind === "road-drill") && entry.kind === "FOLLOW_UP") { entry.attendeeIds = attendeeIds; entry.learningResult = evaluationOutcome.trim() }
    if (entryItem.kind === "road-drill" && entry.kind === "FOLLOW_UP") {
      entry.responseMinutes = measuredValue
      entry.observations += `\nTiempo de respuesta: ${measuredValue} minutos.\nEvaluación: ${evaluationOutcome.trim()}`
    }
    const at = new Date().toISOString()
    if (persist(items.map(i => i.id === entryItem.id ? { ...i, updatedAt: at, entries: [...i.entries, entry], history: [...i.history, { at, action: entry.kind === "FOLLOW_UP" ? `Seguimiento registrado: ${i.kind === "objective" ? `medición ${measuredValue}` : `avance ${progress}%`}` : entry.kind === "DIFFUSION" ? `Divulgación registrada: ${entry.medium}` : "Revisión anual registrada" }] } : i))) { setEntryTarget(null); toast.success("Registro guardado; ya puedes cargar su evidencia.") }
  }
  function openUpload(itemId: string, targetId?: string) { setFile(null); setUploadTarget({ itemId, targetId }) }
  async function upload(event: FormEvent) {
    event.preventDefault()
    if (!file || !uploadTarget) return
    if (file.size > 3 * 1024 * 1024) { toast.error("Selecciona un archivo de hasta 3 MB."); return }
    if (!(file.type.startsWith("image/") || file.type === "application/pdf")) { toast.error("Selecciona una imagen o un PDF."); return }
    setUploading(true)
    try {
      const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
      const at = new Date().toISOString()
      const evidence: Evidence = { id: crypto.randomUUID(), name: file.name, mime: file.type, url, uploadedAt: at, targetId: uploadTarget.targetId }
      if (persist(items.map(i => i.id === uploadTarget.itemId ? { ...i, updatedAt: at, evidence: [...i.evidence, evidence], history: [...i.history, { at, action: `Evidencia cargada: ${file.name}${uploadTarget.targetId ? " (registro de seguimiento, revisión o divulgación)" : ""}` }] } : i))) { setUploadTarget(null); toast.success("Evidencia cargada") }
    } catch { toast.error("No se pudo leer el archivo") } finally { setUploading(false) }
  }
  function download(record?: RecordItem) {
    const exported = record ? [record] : visible
    const doc = new jsPDF({ orientation: "landscape" })
    doc.setFontSize(16); doc.setTextColor(30, 64, 175); doc.text(config.title, 14, 18)
    doc.setFontSize(9); doc.setTextColor(60); doc.text(`Vigencia: ${year || "Todas"} · Fecha de generación: ${dateToday()}`, 14, 26)
    if (!record) {
      autoTable(doc, { startY: 32, head: [[...kind.columns.map(key => kind.fields.find(f => f.key === key)?.label ?? key), "Estado / avance"]], body: exported.map(i => [...kind.columns.map(key => displayValue(kind.fields.find(f => f.key === key)!, i, catalogs)), `${itemStatus(i)}${kind.tracking ? ` · ${completion(i)}%` : ""}`]), headStyles: { fillColor: [37, 99, 235] }, styles: { fontSize: 8 } })
      if (module === "work-plan" || kind.id === "training-activity") {
        for (const item of exported) {
          doc.addPage(); doc.setFontSize(13); doc.setTextColor(30, 64, 175)
          doc.text(doc.splitTextToSize(text(item.values.name), 260), 14, 18)
          autoTable(doc, { startY: 35, head: [["Campo", "Información de la actividad"]], body: visibleFields(kind, item.values).map(f => [f.label, displayValue(f, item, catalogs)]), columnStyles: { 0: { cellWidth: 75 } }, headStyles: { fillColor: [37, 99, 235] }, styles: { fontSize: 9 } })
        }
      }
    } else {
      const recordKind = config.kinds.find(k => k.id === record.kind)!
      autoTable(doc, { startY: 32, head: [["Campo", "Información"]], body: visibleFields(recordKind, record.values).map(f => [f.label, displayValue(f, record, catalogs)]), columnStyles: { 0: { cellWidth: 75 } }, headStyles: { fillColor: [37, 99, 235] }, styles: { fontSize: 9 } })
      if (record.activities.length) autoTable(doc, { head: [["Actividad", "Responsable", "Inicio", "Fin", "Presupuesto"]], body: record.activities.map(a => [a.name, a.responsible, a.startDate, a.endDate, money(a.budget)]), styles: { fontSize: 8 } })
      if (record.entries.length) autoTable(doc, { head: [["Fecha", "Registro", "Resultado", "Observaciones"]], body: record.entries.map(e => [e.date, entryTitle(e.kind), e.kind === "FOLLOW_UP" ? record.kind === "objective" ? `Medición: ${e.measuredValue}` : `${e.progress}%` : e.conclusion || `${e.medium} · ${e.audience}`, e.observations]), styles: { fontSize: 8 } })
      if (record.evidence.length) autoTable(doc, { head: [["Evidencia", "Fecha de carga"]], body: record.evidence.map(e => [e.name, e.uploadedAt.slice(0, 10)]), styles: { fontSize: 8 } })
    }
    doc.addPage(); doc.setFontSize(12); doc.text("Revisión y aprobación", 14, 22)
    doc.setFontSize(10); doc.text("Nombre: ________________________________________", 14, 42); doc.text("Cargo: __________________________________________", 14, 60); doc.text("Firma: __________________________________________", 14, 78); doc.text("Fecha: __________________________________________", 14, 96)
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(100); doc.text(`SafeCloud · PESV · Página ${i} de ${pageCount}`, 14, 203) }
    doc.save(`pesv-${module}-${record ? text(record.values.year) : year || "todos"}.pdf`)
  }
  const formFields = visibleFields(kind, values)
  const sections = [...new Set(formFields.map(f => f.section))]
  const missingReferences = kind.fields.filter(f => f.required && f.reference && !catalogs[f.reference].some(o => f.reference !== "risks" || o.eligible !== false))
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><h1 className="text-2xl font-bold">{config.title}</h1><p className="mt-1 text-sm text-muted-foreground">{config.subtitle}</p></div><Button disabled={!ready} onClick={() => openForm()}><Plus className="mr-2 h-4 w-4" />{kind.id === "behavior-evaluation" ? "Nueva evaluación" : kind.id === "training-activity" || kind.id === "work-activity" ? "Nueva actividad" : `Nuevo ${kind.singular}`}</Button></div>
    {config.kinds.length > 1 && <Tabs value={kindId} onValueChange={id => { setKindId(id); setStatus(""); setSearch("") }}><TabsList className="h-auto max-w-full flex-wrap justify-start">{config.kinds.map(k => <TabsTrigger className="min-h-9 whitespace-normal" key={k.id} value={k.id}>{k.title}</TabsTrigger>)}</TabsList></Tabs>}
    {module === "emergencies" && <EmergencyReadiness items={items} year={year} />}
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm"><span>Registros: <strong>{visible.length}</strong></span>{kind.tracking && <><span>Cumplidos: <strong className="text-green-700">{visible.filter(i => itemStatus(i) === "Cumplido").length}</strong></span><span>En ejecución: <strong className="text-blue-700">{visible.filter(i => completion(i) > 0 && completion(i) < 100).length}</strong></span></>}{kind.annualReview && <span>Revisión vencida: <strong className="text-red-600">{visible.filter(i => nextReview(i) && nextReview(i) < dateToday()).length}</strong></span>}{kind.id === "work-activity" && <span>Presupuesto: <strong>{money(String(visible.reduce((sum, i) => sum + Number(i.values.budget || 0), 0)))}</strong></span>}</div>
    {missingReferences.length > 0 && <div className="flex flex-wrap gap-x-5 gap-y-2 border-l-2 border-blue-500 py-2 pl-3 text-sm">{missingReferences.map(f => sourceLinks[f.reference!] && <Link key={f.key} className="text-primary underline" href={sourceLinks[f.reference!]!.href}>{f.reference === "risks" ? "Registrar o valorar riesgos críticos" : `Registrar ${sourceLinks[f.reference!]!.label}`}</Link>)}</div>}
    <div className="flex flex-wrap gap-3"><div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" aria-label="Buscar registros" placeholder="Buscar nombre o responsable" value={search} onChange={e => setSearch(e.target.value)} /></div><select className={`${selectClass} sm:w-36`} aria-label="Filtrar por vigencia" value={year} onChange={e => setYear(e.target.value)}><option value="">Todas las vigencias</option>{years.map(y => <option key={y}>{y}</option>)}</select><select className={`${selectClass} sm:w-48`} aria-label="Filtrar por estado" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos los estados</option>{statuses.map(s => <option key={s}>{s}</option>)}</select><Button variant="outline" disabled={!visible.length} onClick={() => download()}><Download className="mr-2 h-4 w-4" />{module === "work-plan" || kind.id === "training-activity" ? "Descargar plan anual" : "Descargar PDF"}</Button></div>
    <section className="overflow-hidden rounded-lg border bg-card"><h2 className="border-b px-4 py-3 font-semibold">{kind.title}</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100"><tr>{kind.columns.map(key => <th key={key} className="px-4 py-3 text-left whitespace-nowrap">{kind.fields.find(f => f.key === key)?.label}</th>)}<th className="px-4 py-3 text-left">Estado</th>{kind.annualReview && <th className="px-4 py-3 text-left whitespace-nowrap">Revisión anual</th>}<th className="px-4 py-3"><span className="sr-only">Acciones</span></th></tr></thead><tbody>{visible.map(item => <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">{kind.columns.map(key => <td key={key} className={`px-4 py-3 ${key === "name" ? "min-w-52 font-medium" : "min-w-28"}`}>{displayValue(kind.fields.find(f => f.key === key)!, item, catalogs)}</td>)}<td className="px-4 py-3"><Badge variant="outline" className={`whitespace-nowrap ${itemStatus(item) === "Cumplido" || itemStatus(item) === "Competente" ? "border-green-200 bg-green-50 text-green-700" : itemStatus(item).includes("Requiere") ? "border-amber-200 bg-amber-50 text-amber-800" : "border-blue-200 bg-blue-50 text-blue-800"}`}>{itemStatus(item)}</Badge>{kind.tracking && <p className="mt-1 text-xs text-muted-foreground">{completion(item)}%</p>}{kind.tracking && text(item.values.endDate) < dateToday() && completion(item) < 100 && <p className="mt-1 text-xs text-red-600">Plazo vencido</p>}</td>{kind.annualReview && <td className="px-4 py-3 whitespace-nowrap">{nextReview(item)}{nextReview(item) < dateToday() && <p className="text-xs text-red-600">Revisión vencida</p>}</td>}<td className="px-2"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Acciones de ${text(item.values.name)}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => { refresh(); setDetailId(item.id) }}><Eye className="mr-2 h-4 w-4" />Ver detalle y evidencias</DropdownMenuItem><DropdownMenuItem onSelect={() => openForm(item)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>{kind.tracking && <DropdownMenuItem onSelect={() => openEntry(item, "FOLLOW_UP")}><Plus className="mr-2 h-4 w-4" />Registrar seguimiento</DropdownMenuItem>}{kind.annualReview && <DropdownMenuItem onSelect={() => openEntry(item, "ANNUAL_REVIEW")}><FileCheck2 className="mr-2 h-4 w-4" />Revisión anual</DropdownMenuItem>}{kind.diffusion && <DropdownMenuItem onSelect={() => openEntry(item, "DIFFUSION")}><Plus className="mr-2 h-4 w-4" />Registrar divulgación</DropdownMenuItem>}<DropdownMenuItem onSelect={() => openUpload(item.id)}><Upload className="mr-2 h-4 w-4" />Cargar evidencia</DropdownMenuItem><DropdownMenuItem onSelect={() => download(item)}><Download className="mr-2 h-4 w-4" />Descargar documento</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600" onSelect={() => setDeleteId(item.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>)}</tbody></table></div>{!visible.length && <p className="p-8 text-center text-sm text-muted-foreground">{ready ? "No hay registros para mostrar." : "Cargando…"}</p>}</section>
    <Modal open={formOpen} onOpenChange={setFormOpen} title={`${editingId ? "Editar" : "Registrar"} ${kind.singular}`} footer={<><Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button type="submit" form="pesv-record-form">Guardar</Button></>}>
      <form id="pesv-record-form" onSubmit={save} className="space-y-6">{sections.map((section, index) => <section key={section} className={index ? "space-y-4 border-t pt-5" : "space-y-4"}><h3 className="font-semibold text-primary">{section}</h3><div className="grid gap-x-5 gap-y-4 md:grid-cols-2">{formFields.filter(f => f.section === section).map(f => <div key={f.key} className={f.wide ? "min-w-0 md:col-span-2" : "min-w-0"}><FormField label={`${f.label}${f.required ? " *" : " (opcional)"}`}><FieldInput field={f} value={values[f.key] ?? (f.multiple ? [] : "")} catalogs={catalogs} onChange={value => setValues(prev => ({ ...prev, [f.key]: value }))} /></FormField></div>)}</div></section>)}
        {kind.activities && <section className="space-y-4 border-t pt-5"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-primary">Actividades y cronograma</h3><Button variant="outline" type="button" onClick={() => setActivities(prev => [...prev, { id: crypto.randomUUID(), name: "", responsible: "", startDate: text(values.startDate), endDate: text(values.startDate), budget: "0" }])}><Plus className="mr-2 h-4 w-4" />Actividad</Button></div>{activities.map((activity, index) => <div className="space-y-3 border-b pb-4" key={activity.id}><div className="flex justify-between"><p className="text-sm font-medium">Actividad {index + 1}</p><Button type="button" variant="ghost" size="icon" aria-label={`Eliminar actividad ${index + 1}`} onClick={() => setActivities(prev => prev.filter(a => a.id !== activity.id))}><Trash2 className="h-4 w-4" /></Button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(["name", "responsible", "startDate", "endDate", "budget"] as const).map(key => <FormField key={key} label={{ name: "Actividad", responsible: "Responsable", startDate: "Inicio", endDate: "Fin", budget: "Presupuesto (COP)" }[key]}><Input aria-label={`Actividad ${index + 1}: ${key}`} required type={key.includes("Date") ? "date" : key === "budget" ? "number" : "text"} min={key === "budget" ? 0 : undefined} value={activity[key]} onChange={e => setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, [key]: e.target.value } : a))} /></FormField>)}</div></div>)}{text(values.startDate) && text(values.endDate) && <p className="text-sm text-muted-foreground">Duración del programa: {Math.max(0, Math.round((Date.parse(text(values.endDate)) - Date.parse(text(values.startDate))) / 86400000) + 1)} días.</p>}</section>}
      </form>
    </Modal>
    <Modal open={!!detail} onOpenChange={open => !open && setDetailId(null)} title={detail ? text(detail.values.name) : "Detalle"}>
      {detail && <div className="space-y-6"><div className="flex flex-wrap gap-3"><Badge variant="outline">{itemStatus(detail)}{detailKind.tracking ? ` · ${completion(detail)}%` : ""}</Badge><Button size="sm" variant="outline" onClick={() => download(detail)}><Download className="mr-2 h-4 w-4" />Descargar documento</Button></div><dl className="grid gap-4 md:grid-cols-2">{visibleFields(detailKind, detail.values).map(f => <div key={f.key} className={f.wide ? "min-w-0 md:col-span-2" : "min-w-0"}><dt className="text-xs text-muted-foreground">{f.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{displayValue(f, detail, catalogs)}</dd>{f.reference && sourceLinks[f.reference] && <Link className="mt-1 inline-block text-xs text-primary underline" href={sourceLinks[f.reference]!.href}>Ir al módulo relacionado</Link>}</div>)}</dl>
        {detail.activities.length > 0 && <section className="space-y-3 border-t pt-4"><h3 className="font-semibold">Cronograma</h3>{detail.activities.map(a => <p className="text-sm" key={a.id}><strong>{a.name}</strong> · {a.responsible}<br />{a.startDate} — {a.endDate} · {money(a.budget)}</p>)}</section>}
        <section className="space-y-4 border-t pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Seguimientos, revisiones y divulgación</h3><div className="flex flex-wrap gap-2">{detailKind.tracking && <Button size="sm" variant="outline" onClick={() => openEntry(detail, "FOLLOW_UP")}>Seguimiento</Button>}{detailKind.annualReview && <Button size="sm" variant="outline" onClick={() => openEntry(detail, "ANNUAL_REVIEW")}>Revisión anual</Button>}{detailKind.diffusion && <Button size="sm" variant="outline" onClick={() => openEntry(detail, "DIFFUSION")}>Divulgación</Button>}</div></div>{detail.entries.map(entry => <div key={entry.id} className="border-l-2 border-blue-300 pl-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{entry.date} · {entryTitle(entry.kind)}</p><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Acciones del registro ${entry.date}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => openUpload(detail.id, entry.id)}><Upload className="mr-2 h-4 w-4" />Cargar evidencia</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div><p className="whitespace-pre-wrap text-sm">{entry.observations}</p>{entry.kind === "FOLLOW_UP" && <p className="mt-1 text-sm text-primary">{detail.kind === "objective" ? `Valor medido: ${entry.measuredValue} ${text(detail.values.unit)}` : `Avance: ${entry.progress}%`}</p>}{entry.attendeeIds && <p className="text-sm">Asistentes: {entry.attendeeIds.map(id => catalogs.people.find(p => p.value === id)?.label ?? detail.links.participantIds?.find(p => p.value === id)?.label ?? "Colaborador").join(", ")}<br />Aprendizaje: {entry.learningResult}</p>}{entry.kind === "ANNUAL_REVIEW" && <p className="text-sm">Conclusión: {entry.conclusion}<br />Próxima revisión: {entry.nextReviewDate}</p>}{entry.kind === "DIFFUSION" && <p className="text-sm">{entry.medium} · {entry.audience}</p>}<EvidenceList evidence={detail.evidence.filter(e => e.targetId === entry.id)} onPreview={setPreview} /></div>)}{!detail.entries.length && <p className="text-sm text-muted-foreground">Sin registros de seguimiento, revisión o divulgación.</p>}</section>
        <section className="space-y-3 border-t pt-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Documentos y evidencias</h3><Button size="sm" variant="outline" onClick={() => openUpload(detail.id)}><Upload className="mr-2 h-4 w-4" />Cargar evidencia</Button></div><EvidenceList evidence={detail.evidence.filter(e => !e.targetId)} onPreview={setPreview} /></section>
        <section className="space-y-3 border-t pt-4"><h3 className="font-semibold">Historial</h3>{detail.history.map((event, index) => <div key={index} className="text-sm"><p className="text-xs text-muted-foreground">{new Date(event.at).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</p><p>{event.action}</p>{event.snapshot && <details className="mt-1 text-xs"><summary className="cursor-pointer text-primary">Datos de esta versión</summary><dl className="mt-2 grid gap-2">{visibleFields(detailKind, event.snapshot).map(f => <div key={f.key}><dt className="text-muted-foreground">{f.label}</dt><dd className="whitespace-pre-wrap break-words">{displayValue(f, { ...detail, values: event.snapshot! }, catalogs)}</dd></div>)}</dl></details>}</div>)}</section>
      </div>}
    </Modal>
    <Modal open={!!entryTarget} onOpenChange={open => !open && setEntryTarget(null)} title={entryTitle(entryTarget?.kind ?? "FOLLOW_UP")} footer={<><Button variant="outline" onClick={() => setEntryTarget(null)}>Cancelar</Button><Button form="pesv-entry-form" type="submit">Guardar</Button></>}>
      <form id="pesv-entry-form" onSubmit={saveEntry} className="grid gap-4 sm:grid-cols-2"><FormField label="Fecha"><Input aria-label="Fecha del registro" type="date" required max={dateToday()} value={entryForm.date} onChange={e => setEntryForm(prev => ({ ...prev, date: e.target.value }))} /></FormField>
        {entryTarget?.kind === "FOLLOW_UP" && (entryItem?.kind === "objective" ? <FormField label={`Valor medido (${text(entryItem.values.unit)})`}><Input aria-label="Valor medido" required type="number" min={0} max={entryItem.values.unit === "Porcentaje (%)" ? 100 : undefined} step="any" value={entryForm.measuredValue} onChange={e => setEntryForm(prev => ({ ...prev, measuredValue: e.target.value }))} /></FormField> : <FormField label="Avance de cumplimiento (%)"><Input aria-label="Avance de cumplimiento" required type="number" min={0} max={100} value={entryForm.progress} onChange={e => setEntryForm(prev => ({ ...prev, progress: e.target.value }))} /></FormField>)}
        {entryTarget?.kind === "ANNUAL_REVIEW" && <><FormField label="Próxima revisión (máximo un año)"><Input aria-label="Próxima revisión" required type="date" value={entryForm.nextReviewDate} onChange={e => setEntryForm(prev => ({ ...prev, nextReviewDate: e.target.value }))} /></FormField><div className="sm:col-span-2"><FormField label="Conclusión, actualización y evaluación de resultados"><Textarea required aria-label="Conclusión de revisión" value={entryForm.conclusion} onChange={e => setEntryForm(prev => ({ ...prev, conclusion: e.target.value }))} /></FormField></div></>}
        {entryTarget?.kind === "DIFFUSION" && <><FormField label="Medio de divulgación"><select aria-label="Medio de divulgación" className={selectClass} value={entryForm.medium} onChange={e => setEntryForm(prev => ({ ...prev, medium: e.target.value }))}>{["Correo", "WhatsApp", "Reunión", "Cartelera", "Intranet", "Otro"].map(m => <option key={m}>{m}</option>)}</select></FormField><div className="sm:col-span-2"><FormField label="Destinatarios / colaboradores informados"><Input aria-label="Destinatarios" required value={entryForm.audience} onChange={e => setEntryForm(prev => ({ ...prev, audience: e.target.value }))} /></FormField></div></>}
        {entryItem?.kind === "training-activity" && entryTarget?.kind === "FOLLOW_UP" && <><div className="sm:col-span-2"><FormField label="Colaboradores asistentes"><ReferenceInput field={{ key: "attendees", label: "Asistentes", section: "", multiple: true, reference: "people" }} value={attendeeIds} options={ids(entryItem.values.participantIds).map(id => catalogs.people.find(p => p.value === id) ?? entryItem.links.participantIds?.find(p => p.value === id)).filter((p): p is Option => Boolean(p))} onChange={v => setAttendeeIds(ids(v))} /></FormField></div><div className="sm:col-span-2"><FormField label="Resultado de evaluación del aprendizaje"><Textarea required aria-label="Resultado de aprendizaje" value={evaluationOutcome} onChange={e => setEvaluationOutcome(e.target.value)} /></FormField></div></>}
        {entryItem?.kind === "road-drill" && entryTarget?.kind === "FOLLOW_UP" && <>
          <FormField label="Tiempo de respuesta real (minutos)"><Input aria-label="Tiempo de respuesta real" type="number" required min={0.1} step="any" value={entryForm.measuredValue} onChange={e => setEntryForm(prev => ({ ...prev, measuredValue: e.target.value }))} /></FormField>
          <div className="sm:col-span-2"><FormField label="Colaboradores asistentes"><ReferenceInput field={{ key: "attendees", label: "Asistentes", section: "", multiple: true }} value={attendeeIds} options={catalogs.people.filter(p => ids(entryItem.values.participantIds).includes(p.value))} onChange={v => setAttendeeIds(ids(v))} /></FormField></div>
          <div className="sm:col-span-2"><FormField label="Evaluación del ejercicio / acciones de mejora"><Textarea aria-label="Evaluación del simulacro" required value={evaluationOutcome} onChange={e => setEvaluationOutcome(e.target.value)} /></FormField></div>
        </>}
        <div className="sm:col-span-2"><FormField label={entryItem?.kind === "work-activity" ? "Resultados obtenidos / cumplimiento de la estrategia" : "Observaciones"}><Textarea aria-label="Observaciones del registro" required value={entryForm.observations} onChange={e => setEntryForm(prev => ({ ...prev, observations: e.target.value }))} /></FormField></div>
      </form>
    </Modal>
    <Modal open={!!uploadTarget} onOpenChange={open => !uploading && !open && setUploadTarget(null)} title="Cargar evidencia" footer={<Button form="pesv-evidence-form" type="submit" disabled={!file || uploading}>{uploading ? "Cargando…" : "Cargar evidencia"}</Button>}><form id="pesv-evidence-form" onSubmit={upload}><FormField label="Documento o imagen"><Input aria-label="Seleccionar evidencia" type="file" accept="image/*,application/pdf" required onChange={e => setFile(e.target.files?.[0] ?? null)} /></FormField></form></Modal>
    <Modal open={!!preview} onOpenChange={open => !open && setPreview(null)} title={preview?.name ?? "Documento"} footer={preview && <Button asChild><a href={preview.url} download={preview.name}><Download className="mr-2 h-4 w-4" />Descargar</a></Button>}>{preview && <div className="h-[65dvh]">{preview.mime.startsWith("image/") ? <img src={preview.url} alt={preview.name} className="h-full w-full object-contain" /> : <iframe src={preview.url} title={preview.name} className="h-full w-full" />}</div>}</Modal>
    <Modal open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)} title="Eliminar registro" footer={<><Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button><Button variant="destructive" onClick={() => {
      const references = (["objectives", "programs", "work-plan", "training", "behavior", "emergencies"] as PesvModule[]).flatMap(readItems).filter(i => i.id !== deleteId && Object.values(i.values).some(v => ids(v).includes(deleteId!)))
      const roadCases = readStore<{ cases: { values: Values; actions: { workActivityId: string }[] }[] }>("safecloud:pesv-road-investigations", { cases: [] }).cases
      if (references.length || roadCases.some(r => Object.values(r.values).some(v => ids(v).includes(deleteId!)) || r.actions.some(a => a.workActivityId === deleteId))) { toast.error("Este registro está relacionado con otros módulos. Retira esas relaciones antes de eliminarlo."); return }
      if (persist(items.filter(i => i.id !== deleteId))) { setDeleteId(null); toast.success("Registro eliminado") }
    }}>Eliminar</Button></>}><p className="text-sm">Se eliminará este registro con su historial y evidencias. Esta acción no se puede deshacer.</p></Modal>
  </div>
}

function entryTitle(kind: Entry["kind"]) { return kind === "FOLLOW_UP" ? "Seguimiento" : kind === "ANNUAL_REVIEW" ? "Revisión anual" : "Divulgación" }
function EmergencyReadiness({ items, year }: { items: RecordItem[]; year: string }) {
  const plans = items.filter(i => i.kind === "emergency-plan" && (!year || text(i.values.year) === year))
  const covered = plans.filter(plan => items.some(drill => drill.kind === "road-drill" && drill.values.planId === plan.id && drill.entries.some(entry => entry.kind === "FOLLOW_UP" && entry.progress === 100 && entry.date.slice(0, 4) === text(plan.values.year) && drill.evidence.some(e => e.targetId === entry.id)))).length
  return <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-l-2 border-blue-500 py-2 pl-3 text-sm"><span>Planes con simulacro anual documentado: <strong className="text-green-700">{covered} / {plans.length}</strong></span>{plans.length > covered && <span className="text-amber-700">{plans.length - covered} plan(es) pendiente(s) de simulacro ejecutado y evidencia.</span>}</div>
}
export function EvidenceList({ evidence, onPreview }: { evidence: Evidence[]; onPreview: (e: Evidence) => void }) {
  if (!evidence.length) return <p className="text-xs text-muted-foreground">Sin evidencias cargadas.</p>
  return <div>{evidence.map(e => <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2"><div className="min-w-0"><p className="break-all text-sm">{e.name}</p><p className="text-xs text-muted-foreground">{new Date(e.uploadedAt).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}</p></div><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" aria-label={`Ver ${e.name}`} onClick={() => onPreview(e)}><Eye className="h-4 w-4" /></Button><Button asChild variant="ghost" size="icon"><a href={e.url} download={e.name} aria-label={`Descargar ${e.name}`}><Download className="h-4 w-4" /></a></Button></div></div>)}</div>
}
