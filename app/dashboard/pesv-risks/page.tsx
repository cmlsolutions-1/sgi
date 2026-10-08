"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { Download, Edit, Eye, HelpCircle, MoreHorizontal, Plus, Search, Trash2, Upload } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Level = 1 | 2 | 3
type Status = "PENDIENTE" | "EN_EJECUCION" | "CONTROLADO"
type Evidence = { id: string; name: string; url: string; mime: string; date: string }
type Review = { id: string; date: string; observations: string; exposure: Level; probability: Level; status: Status }
type Diagnosis = {
  id: string; year: number; updateDate: string
  collaborators: { id: string; name: string }[]
  vehicles: { id: string; plate: string; vehicleType: string }[]
  routes: { id: string; origin: string; destination: string }[]
}
type RiskForm = {
  name: string; activity: string; roadUser: string; journey: string; diagnosisId: string
  sourceId: string; sourceLabel: string; sourceType: string; causes: string; consequences: string
  existingControls: string; exposure: Level; probability: Level; treatment: string
  action: string; responsible: string; dueDate: string
}
type Risk = RiskForm & { id: string; createdAt: string; status: Status; reviews: Review[]; evidence: Evidence[]; history: { date: string; text: string }[] }
const KEY = "safecloud:pesv-risks"
const treatments = ["Evitar el riesgo", "Aceptar el riesgo", "Eliminar la fuente", "Modificar la exposición", "Modificar la probabilidad"]
const statuses: Status[] = ["PENDIENTE", "EN_EJECUCION", "CONTROLADO"]
const statusLabels = { PENDIENTE: "Pendiente", EN_EJECUCION: "En ejecución", CONTROLADO: "Controlado" }
const exposures = ["Esporádica: menos de 3 horas al día", "Ocasional: entre 3 y 6 horas al día", "Frecuente: más de 6 horas al día"]
const probabilities = ["No es probable: controles eficaces", "Poco probable: controles de baja eficacia", "Muy probable: sin controles eficaces"]
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" })
const freshForm = (): RiskForm => ({ name: "", activity: "", roadUser: "Conductor", journey: "Laboral", diagnosisId: "", sourceId: "", sourceLabel: "", sourceType: "routes", causes: "", consequences: "", existingControls: "", exposure: 1, probability: 1, treatment: treatments[0], action: "", responsible: "", dueDate: today() })
const seeds: Risk[] = [{ ...freshForm(), id: "pesv-risk-demo-1", name: "Colisión por distracción al conducir", activity: "Desplazamiento a clientes", causes: "Uso del teléfono durante el recorrido y falta de pausas.", consequences: "Lesiones a ocupantes y terceros; daños materiales.", existingControls: "Inducción de seguridad vial y revisión preoperacional.", exposure: 2, probability: 3, treatment: "Modificar la probabilidad", action: "Reforzar la prohibición de uso del celular y verificar hábitos de conducción.", responsible: "Coordinador operativo", createdAt: "2026-10-07T14:00:00-05:00", status: "PENDIENTE", reviews: [], evidence: [], history: [{ date: "2026-10-07T14:00:00-05:00", text: "Riesgo identificado y valorado: 6 (Crítico)." }] }]
function valuation(exposure: Level, probability: Level) {
  const score = exposure * probability
  return { score, label: score >= 6 ? "Crítico" : score >= 3 ? "Moderado" : "Bajo", style: score >= 6 ? "bg-red-50 text-red-700 border-red-200" : score >= 3 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200" }
}
function currentValue(risk: Risk) {
  const last = risk.reviews.at(-1)
  return valuation(last?.exposure ?? risk.exposure, last?.probability ?? risk.probability)
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid min-w-0 gap-2 text-sm"><span className="font-medium">{label}</span>{children}</label>
}
const selectClass = "h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
function Rating({ exposure, probability, onChange }: { exposure: Level; probability: Level; onChange: (key: "exposure" | "probability", value: Level) => void }) {
  const value = valuation(exposure, probability)
  return <div className="grid gap-4 sm:grid-cols-2">
    {(["exposure", "probability"] as const).map(key => <div className="grid gap-2" key={key}>
      <Label className="flex items-center gap-2">{key === "exposure" ? "Nivel de exposición" : "Nivel de probabilidad"}<Tooltip><TooltipTrigger asChild><button type="button" aria-label={`Ayuda: ${key === "exposure" ? "exposición" : "probabilidad"}`}><HelpCircle className="h-4 w-4 text-muted-foreground" /></button></TooltipTrigger><TooltipContent className="max-w-xs">{key === "exposure" ? "Tiempo diario de exposición al riesgo vial. Frecuente = 3, ocasional = 2 y esporádica = 1." : "Eficacia de los controles actuales. Sin controles eficaces = 3; baja eficacia = 2; controles eficaces = 1."}</TooltipContent></Tooltip></Label>
      <select className={selectClass} value={key === "exposure" ? exposure : probability} onChange={e => onChange(key, Number(e.target.value) as Level)}>{(key === "exposure" ? exposures : probabilities).map((label, i) => <option key={label} value={i + 1}>{i + 1} · {label}</option>)}</select>
    </div>)}
    <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><Badge className={value.style}>{value.label} · NR {value.score}</Badge><span className="text-sm text-muted-foreground">Exposición {exposure} × Probabilidad {probability}</span></div>
  </div>
}

export default function PesvRisksPage() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [ready, setReady] = useState(false)
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("")
  const [form, setForm] = useState<RiskForm>(freshForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<Evidence | null>(null)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [review, setReview] = useState({ date: today(), observations: "", exposure: 1 as Level, probability: 1 as Level, status: "EN_EJECUCION" as Status })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  function loadDiagnoses() {
    try { setDiagnoses(JSON.parse(localStorage.getItem("safecloud:pesv-diagnosis") ?? "[]")) } catch { setDiagnoses([]) }
  }
  useEffect(() => {
    try { setRisks(JSON.parse(localStorage.getItem(KEY) ?? JSON.stringify(seeds))) } catch { setRisks(seeds) }
    loadDiagnoses(); setReady(true)
    window.addEventListener("focus", loadDiagnoses)
    window.addEventListener("storage", loadDiagnoses)
    return () => { window.removeEventListener("focus", loadDiagnoses); window.removeEventListener("storage", loadDiagnoses) }
  }, [])
  function persist(next: Risk[]) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); setRisks(next); return true }
    catch { toast.error("No se pudo guardar. El almacenamiento del navegador está lleno; intenta con un archivo más pequeño."); return false }
  }
  function change<K extends keyof RiskForm>(key: K, value: RiskForm[K]) { setForm(prev => ({ ...prev, [key]: value })) }
  const diagnosis = diagnoses.find(item => item.id === form.diagnosisId)
  const sources = diagnosis ? form.sourceType === "vehicles" ? diagnosis.vehicles.map(item => ({ id: item.id, label: `${item.plate} · ${item.vehicleType}` })) : form.sourceType === "collaborators" ? diagnosis.collaborators.map(item => ({ id: item.id, label: item.name })) : diagnosis.routes.map(item => ({ id: item.id, label: `${item.origin} → ${item.destination}` })) : []
  const selected = risks.find(item => item.id === detailId)
  const visible = risks.filter(item => `${item.name} ${item.activity} ${item.responsible} ${item.sourceLabel}`.toLowerCase().includes(search.toLowerCase()) && (!filter || currentValue(item).label === filter))
  function save(event: FormEvent) {
    event.preventDefault()
    if (form.diagnosisId && !form.sourceId) { toast.error("Selecciona la ruta, vehículo o colaborador del diagnóstico."); return }
    const date = new Date().toISOString()
    const existing = risks.find(item => item.id === editing)
    const record: Risk = { ...form, id: existing?.id ?? crypto.randomUUID(), createdAt: existing?.createdAt ?? date, status: existing?.status ?? "PENDIENTE", evidence: existing?.evidence ?? [], reviews: existing?.reviews ?? [], history: [...(existing?.history ?? []), { date, text: existing ? "Identificación, análisis o tratamiento actualizado." : `Riesgo registrado: NR ${form.exposure * form.probability}.` }] }
    if (persist(existing ? risks.map(item => item.id === existing.id ? record : item) : [...risks, record])) { setFormOpen(false); toast.success("Riesgo guardado") }
  }
  function exportMatrix() {
    const doc = new jsPDF({ orientation: "landscape" })
    doc.setFontSize(16); doc.text("PESV · Matriz de riesgos viales", 14, 18)
    doc.setFontSize(9); doc.text(`Fecha: ${today()} | Exposición × Probabilidad | Bajo: 1-2 · Moderado: 3-4 · Crítico: 6-9`, 14, 26)
    autoTable(doc, { startY: 32, head: [["Riesgo / actividad", "Relación", "Causas / consecuencias", "Controles actuales", "Inicial", "Actual", "Tratamiento / acción", "Responsable / plazo", "Estado"]], body: visible.map(item => [ `${item.name}\n${item.activity}`, item.sourceLabel || item.journey, `${item.causes}\n${item.consequences}`, item.existingControls || "Sin controles", `${item.exposure * item.probability}`, `${currentValue(item).score} · ${currentValue(item).label}`, `${item.treatment}\n${item.action}`, `${item.responsible}\n${item.dueDate}`, statusLabels[item.status] ]), styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [37, 99, 235] } })
    doc.save(`matriz-riesgos-viales-${today()}.pdf`)
  }
  async function upload(event: FormEvent) {
    event.preventDefault()
    if (!file || !uploadId) return
    if (file.size > 4 * 1024 * 1024) { toast.error("Selecciona un archivo de hasta 4 MB."); return }
    setUploading(true)
    try {
      const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
      const date = new Date().toISOString()
      const evidence: Evidence = { id: crypto.randomUUID(), name: file.name, url, mime: file.type, date }
      if (persist(risks.map(item => item.id === uploadId ? { ...item, evidence: [...item.evidence, evidence], history: [...item.history, { date, text: `Evidencia cargada: ${file.name}` }] } : item))) { setUploadId(null); setFile(null); toast.success("Evidencia cargada") }
    } catch { toast.error("No se pudo cargar el archivo") } finally { setUploading(false) }
  }
  function saveReview(event: FormEvent) {
    event.preventDefault()
    const risk = risks.find(item => item.id === reviewId)
    if (!risk) return
    if (review.date < risk.createdAt.slice(0, 10)) { toast.error("El seguimiento no puede ser anterior al registro del riesgo."); return }
    if (risk.reviews.at(-1) && review.date < risk.reviews.at(-1)!.date) { toast.error("La fecha no puede ser anterior al último seguimiento."); return }
    const date = new Date().toISOString()
    if (persist(risks.map(item => item.id === reviewId ? { ...item, status: review.status, reviews: [...item.reviews, { ...review, id: crypto.randomUUID() }], history: [...item.history, { date, text: `Seguimiento: ${statusLabels[review.status]}. NR residual ${review.exposure * review.probability}. ${review.observations}` }] } : item))) { setReviewId(null); toast.success("Seguimiento registrado") }
  }
  return <TooltipProvider><div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Caracterización, evaluación y control de riesgos</h1><p className="text-sm text-muted-foreground">Matriz de riesgos viales · PESV</p></div><Button disabled={!ready} onClick={() => { loadDiagnoses(); setEditing(null); setForm(freshForm()); setFormOpen(true) }}><Plus className="mr-2 h-4 w-4" />Nuevo riesgo</Button></div>
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm">{["Crítico", "Moderado", "Bajo"].map(label => <span key={label}>{label}: <strong className={label === "Crítico" ? "text-red-600" : label === "Moderado" ? "text-amber-600" : "text-green-700"}>{risks.filter(item => currentValue(item).label === label).length}</strong></span>)}<span>Controlados: <strong>{risks.filter(item => item.status === "CONTROLADO").length}</strong></span></div>
    <div className="flex flex-wrap gap-3"><div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar riesgos" className="pl-9" placeholder="Buscar riesgo, actividad o responsable" value={search} onChange={e => setSearch(e.target.value)} /></div><select aria-label="Filtrar por nivel de riesgo" className={`${selectClass} sm:w-48`} value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todos los niveles</option>{["Crítico", "Moderado", "Bajo"].map(item => <option key={item}>{item}</option>)}</select><Button variant="outline" disabled={!visible.length} onClick={exportMatrix}><Download className="mr-2 h-4 w-4" />Descargar matriz</Button></div>
    <section className="overflow-hidden rounded-lg border bg-card"><h2 className="border-b px-4 py-3 font-semibold">Lista de riesgos viales</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100"><tr>{["Riesgo / actividad", "Relación con diagnóstico", "Inicial", "Actual", "Responsable", "Fecha límite", "Estado", ""].map((heading, i) => <th className="px-4 py-3 text-left whitespace-nowrap" key={i}>{heading}</th>)}</tr></thead><tbody>{visible.map(risk => <tr className="border-b last:border-0" key={risk.id}><td className="min-w-52 px-4 py-3"><p className="font-medium">{risk.name}</p><p className="text-xs text-muted-foreground">{risk.activity}</p></td><td className="min-w-40 px-4 py-3">{risk.sourceLabel || "Sin vinculación"}</td><td className="px-4 py-3">{risk.exposure * risk.probability}</td><td className="px-4 py-3"><Badge className={`whitespace-nowrap ${currentValue(risk).style}`}>{currentValue(risk).label} · {currentValue(risk).score}</Badge></td><td className="px-4 py-3">{risk.responsible}</td><td className="whitespace-nowrap px-4 py-3">{risk.dueDate}{risk.status !== "CONTROLADO" && risk.dueDate < today() && <p className="text-xs text-red-600">Tratamiento vencido</p>}</td><td className="px-4 py-3 whitespace-nowrap">{statusLabels[risk.status]}</td><td className="px-3"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Acciones de ${risk.name}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setDetailId(risk.id)}><Eye className="mr-2 h-4 w-4" />Ver detalle</DropdownMenuItem><DropdownMenuItem onSelect={() => { loadDiagnoses(); setEditing(risk.id); setForm(risk); setFormOpen(true) }}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem><DropdownMenuItem onSelect={() => { const last = risk.reviews.at(-1); setReview({ date: today(), observations: "", exposure: last?.exposure ?? risk.exposure, probability: last?.probability ?? risk.probability, status: risk.status }); setReviewId(risk.id) }}><Plus className="mr-2 h-4 w-4" />Registrar seguimiento</DropdownMenuItem><DropdownMenuItem onSelect={() => { setFile(null); setUploadId(risk.id) }}><Upload className="mr-2 h-4 w-4" />Cargar evidencia</DropdownMenuItem><DropdownMenuItem className="text-red-600" onSelect={() => setDeleteId(risk.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>)}</tbody></table>{!visible.length && <p className="p-8 text-center text-muted-foreground">{ready ? "No hay riesgos para mostrar." : "Cargando riesgos…"}</p>}</div></section>
    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="!flex max-h-[90dvh] !max-w-5xl flex-col overflow-hidden p-0"><DialogHeader className="border-b px-6 py-5"><DialogTitle>{editing ? "Editar riesgo vial" : "Nuevo riesgo vial"}</DialogTitle></DialogHeader><form onSubmit={save} className="flex min-h-0 flex-1 flex-col"><div className="space-y-6 overflow-y-auto px-6 py-5">
      <section className="space-y-4"><h3 className="font-semibold text-primary">1. Identificación del riesgo</h3><div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre del riesgo"><Input required value={form.name} onChange={e => change("name", e.target.value)} /></Field><Field label="Actividad / desplazamiento"><Input required value={form.activity} onChange={e => change("activity", e.target.value)} /></Field><Field label="Actor vial"><select className={selectClass} value={form.roadUser} onChange={e => change("roadUser", e.target.value)}>{["Conductor", "Motociclista", "Ciclista", "Peatón", "Pasajero", "Varios actores"].map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Tipo de desplazamiento"><select className={selectClass} value={form.journey} onChange={e => change("journey", e.target.value)}>{["Laboral", "In itinere", "Ambos"].map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Diagnóstico PESV relacionado (opcional)"><select className={selectClass} value={form.diagnosisId} onChange={e => setForm(prev => ({ ...prev, diagnosisId: e.target.value, sourceId: "", sourceLabel: "" }))}><option value="">Sin vinculación</option>{diagnoses.map(item => <option key={item.id} value={item.id}>{item.year} · Actualización {item.updateDate}</option>)}</select></Field><Field label="Relacionar con"><select disabled={!diagnosis} className={selectClass} value={form.sourceType} onChange={e => setForm(prev => ({ ...prev, sourceType: e.target.value, sourceId: "", sourceLabel: "" }))}><option value="routes">Ruta frecuente</option><option value="vehicles">Vehículo</option><option value="collaborators">Colaborador</option></select></Field>{diagnosis && <Field label="Registro del diagnóstico"><select className={selectClass} required value={form.sourceId} onChange={e => setForm(prev => ({ ...prev, sourceId: e.target.value, sourceLabel: sources.find(item => item.id === e.target.value)?.label ?? "" }))}><option value="">Seleccionar</option>{sources.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>}</div>{!diagnoses.length && <Link className="inline-block text-sm text-primary underline" href="/dashboard/pesv-diagnosis">Registrar diagnóstico PESV para relacionar rutas, vehículos y colaboradores</Link>}</section>
      <section className="space-y-4 border-t pt-5"><h3 className="font-semibold text-primary">2. Análisis del riesgo</h3><div className="grid gap-4 sm:grid-cols-2"><Field label="Causas / factores de riesgo"><Textarea required value={form.causes} onChange={e => change("causes", e.target.value)} /></Field><Field label="Consecuencias posibles"><Textarea required value={form.consequences} onChange={e => change("consequences", e.target.value)} /></Field><div className="sm:col-span-2"><Field label="Controles existentes"><Textarea value={form.existingControls} onChange={e => change("existingControls", e.target.value)} /></Field></div></div></section>
      <section className="space-y-4 border-t pt-5"><h3 className="font-semibold text-primary">3. Valoración del riesgo{editing && " inicial"}</h3><Rating exposure={form.exposure} probability={form.probability} onChange={change} /><div className="overflow-x-auto"><table className="w-full text-center text-sm"><caption className="mb-2 text-left text-muted-foreground">Matriz de valoración · Exposición × Probabilidad</caption><thead><tr><th className="p-2 text-left">Exposición / Probabilidad</th>{[1, 2, 3].map(n => <th key={n} className="p-2">{n}</th>)}</tr></thead><tbody>{([3, 2, 1] as Level[]).map(e => <tr key={e}><th className="p-2 text-left">{["Esporádica", "Ocasional", "Frecuente"][e - 1]} · {e}</th>{([1, 2, 3] as Level[]).map(p => <td key={p} className={`border p-2 ${valuation(e, p).style} ${e === form.exposure && p === form.probability ? "font-bold ring-2 ring-inset ring-blue-600" : ""}`}>{e * p} · {valuation(e, p).label}</td>)}</tr>)}</tbody></table></div></section>
      <section className="space-y-4 border-t pt-5"><h3 className="font-semibold text-primary">4. Tratamiento del riesgo</h3><div className="grid gap-4 sm:grid-cols-2"><Field label="Acción frente al riesgo"><select className={selectClass} value={form.treatment} onChange={e => change("treatment", e.target.value)}>{treatments.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Responsable"><Input required list="pesv-risk-people" value={form.responsible} onChange={e => change("responsible", e.target.value)} /><datalist id="pesv-risk-people">{Array.from(new Set(diagnoses.flatMap(item => item.collaborators.map(person => person.name)))).map(name => <option key={name} value={name} />)}</datalist></Field><Field label={form.treatment === "Aceptar el riesgo" ? "Justificación y medidas de seguimiento" : "Medidas / plan de acción"}><Textarea required value={form.action} onChange={e => change("action", e.target.value)} /></Field><Field label="Fecha límite"><Input required type="date" value={form.dueDate} onChange={e => change("dueDate", e.target.value)} /></Field></div></section>
    </div><DialogFooter className="shrink-0 border-t px-6 py-4"><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button type="submit">Guardar riesgo</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={!!selected} onOpenChange={open => !open && setDetailId(null)}><DialogContent className="!flex max-h-[90dvh] !max-w-4xl flex-col overflow-hidden p-0"><DialogHeader className="border-b px-6 py-5"><DialogTitle>Detalle del riesgo vial</DialogTitle></DialogHeader>{selected && <div className="space-y-5 overflow-y-auto px-6 py-5"><h3 className="text-lg font-semibold">{selected.name}</h3><Badge className={currentValue(selected).style}>{currentValue(selected).label} · NR {currentValue(selected).score}</Badge><dl className="grid gap-4 sm:grid-cols-2">{[["Actividad", selected.activity], ["Actor vial", selected.roadUser], ["Desplazamiento", selected.journey], ["Relación con diagnóstico", selected.sourceLabel || "Sin vinculación"], ["Causas", selected.causes], ["Consecuencias", selected.consequences], ["Controles existentes", selected.existingControls || "Sin controles registrados"], ["Valoración inicial", `Exposición ${selected.exposure} × Probabilidad ${selected.probability} = ${selected.exposure * selected.probability}`], ["Tratamiento", selected.treatment], ["Plan de acción", selected.action], ["Responsable", selected.responsible], ["Fecha límite", selected.dueDate], ["Estado", statusLabels[selected.status]]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap break-words text-sm">{value}</dd></div>)}</dl><h4 className="border-t pt-4 font-semibold">Seguimientos y valoración residual</h4>{selected.reviews.length ? selected.reviews.map(item => <div className="border-l-2 border-primary pl-4" key={item.id}><p className="text-sm font-medium">{item.date} · {statusLabels[item.status]} · NR {item.exposure * item.probability}</p><p className="whitespace-pre-wrap text-sm">{item.observations}</p></div>) : <p className="text-sm text-muted-foreground">Sin seguimientos registrados.</p>}<h4 className="border-t pt-4 font-semibold">Evidencias</h4>{selected.evidence.map(item => <div className="flex flex-wrap items-center justify-between gap-2 border-b py-2" key={item.id}><span className="min-w-0 break-all text-sm">{item.name}</span><div className="flex gap-1"><Button size="icon" variant="ghost" aria-label={`Ver ${item.name}`} onClick={() => setPreview(item)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" asChild><a href={item.url} download={item.name} aria-label={`Descargar ${item.name}`}><Download className="h-4 w-4" /></a></Button></div></div>)}{!selected.evidence.length && <p className="text-sm text-muted-foreground">Sin evidencias cargadas.</p>}<h4 className="border-t pt-4 font-semibold">Historial</h4>{selected.history.map((item, i) => <div key={i} className="text-sm"><p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</p><p>{item.text}</p></div>)}</div>}</DialogContent></Dialog>
    <Dialog open={!!reviewId} onOpenChange={open => !open && setReviewId(null)}><DialogContent className="!max-w-2xl max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Seguimiento del tratamiento</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={saveReview}><Field label="Fecha del seguimiento"><Input type="date" required min={risks.find(item => item.id === reviewId)?.createdAt.slice(0, 10)} max={today()} value={review.date} onChange={e => setReview(prev => ({ ...prev, date: e.target.value }))} /></Field><Field label="Controles aplicados / verificación de eficacia"><Textarea required value={review.observations} onChange={e => setReview(prev => ({ ...prev, observations: e.target.value }))} /></Field><Rating exposure={review.exposure} probability={review.probability} onChange={(key, value) => setReview(prev => ({ ...prev, [key]: value }))} /><Field label="Estado del tratamiento"><select className={selectClass} value={review.status} onChange={e => setReview(prev => ({ ...prev, status: e.target.value as Status }))}>{statuses.map(item => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></Field><DialogFooter><Button type="submit">Guardar seguimiento</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={!!uploadId} onOpenChange={open => !uploading && !open && setUploadId(null)}><DialogContent><DialogHeader><DialogTitle>Cargar evidencia del riesgo vial</DialogTitle></DialogHeader><form onSubmit={upload} className="space-y-4"><Field label="Seleccionar archivo"><Input required type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} /></Field><DialogFooter><Button disabled={!file || uploading} type="submit">{uploading ? "Cargando…" : "Cargar evidencia"}</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={!!preview} onOpenChange={open => !open && setPreview(null)}><DialogContent className="!flex h-[85dvh] !max-w-5xl flex-col"><DialogHeader><DialogTitle className="break-all pr-6">{preview?.name}</DialogTitle></DialogHeader>{preview && <><div className="min-h-0 flex-1 overflow-auto">{preview.mime.startsWith("image/") ? <img src={preview.url} alt={preview.name} className="h-full w-full object-contain" /> : preview.mime === "application/pdf" ? <iframe title={preview.name} src={preview.url} className="h-full w-full" /> : <p className="text-sm">Vista previa no disponible para este archivo.</p>}</div><DialogFooter><Button asChild><a href={preview.url} download={preview.name}><Download className="mr-2 h-4 w-4" />Descargar</a></Button></DialogFooter></>}</DialogContent></Dialog>
    <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}><DialogContent><DialogHeader><DialogTitle>Eliminar riesgo vial</DialogTitle></DialogHeader><p className="text-sm">Se eliminarán el riesgo, sus seguimientos y evidencias. Esta acción no se puede deshacer.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button><Button variant="destructive" onClick={() => { if (persist(risks.filter(item => item.id !== deleteId))) setDeleteId(null) }}>Eliminar</Button></DialogFooter></DialogContent></Dialog>
  </div></TooltipProvider>
}
