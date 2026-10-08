"use client"

import { type FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { Check, Download, Edit, Eye, FileCheck2, MoreHorizontal, Plus, Search, Trash2, Upload } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EvidenceList, FieldInput, FormField, Modal, ReferenceInput } from "@/components/pesv/planning-module"
import { dateToday, ids, initialValues, loadCatalogs, readStore, text, validateRecord, visibleFields, type Catalogs, type Evidence, type Kind, type Option, type RecordItem, type Values } from "@/lib/pesv/planning"
import {
  ROAD_INVESTIGATIONS_KEY, actionState, caseStatus, closeIfReady, demoInvestigations, lessonsDocumented,
  methodologies, nextStage, procedureKind, reportKind, snapshotLinks, stageComplete, stageDefinitions,
  validateEvaluation, validateFollowUp, validateReport, validateStage,
  type CorrectiveAction, type InvestigationStore, type RoadCase, type Stage, type StageKey,
} from "@/lib/pesv/road-investigations"

const selectClass = "h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
const emptyStore: InvestigationStore = { procedures: [], cases: [], sequences: {} }
const today = dateToday
const entryDefaults = () => ({ date: today(), progress: "0", notes: "", evaluatorId: "", result: "EFICAZ" as "EFICAZ" | "NO_EFICAZ", medium: "Reunión", audience: "Todos los colaboradores", csvResponsibleId: "" })
const stageDefaults = () => ({ date: today(), notes: "", authorId: "", details: {} as Values })

export default function RoadInvestigationsPage() {
  const [store, setStore] = useState<InvestigationStore>(emptyStore)
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null)
  const [tab, setTab] = useState("cases")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("")
  const [formMode, setFormMode] = useState<"case" | "procedure" | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [values, setValues] = useState<Values>({})
  const [procedureId, setProcedureId] = useState("")
  const [external, setExternal] = useState<RoadCase["externalInvestigators"]>([])
  const [detailId, setDetailId] = useState<string | null>(null)
  const [procedureDetailId, setProcedureDetailId] = useState<string | null>(null)
  const [stageTarget, setStageTarget] = useState<{ caseId: string; key: StageKey } | null>(null)
  const [stageForm, setStageForm] = useState(stageDefaults)
  const [actionDrafts, setActionDrafts] = useState<CorrectiveAction[]>([])
  const [entryTarget, setEntryTarget] = useState<{ caseId: string; actionId?: string; type: "FOLLOW_UP" | "EVALUATION" | "DIFFUSION" } | null>(null)
  const [entryForm, setEntryForm] = useState(entryDefaults)
  const [uploadTarget, setUploadTarget] = useState<{ owner: "case" | "procedure"; ownerId: string; targetId?: string } | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<Evidence | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "case" | "procedure"; id: string } | null>(null)
  function refreshCatalogs() { setCatalogs(loadCatalogs()) }
  useEffect(() => {
    const data = readStore<InvestigationStore | null>(ROAD_INVESTIGATIONS_KEY, null)
    const initial = data ?? demoInvestigations(loadCatalogs())
    if (!data) { try { localStorage.setItem(ROAD_INVESTIGATIONS_KEY, JSON.stringify(initial)) } catch { toast.error("No se pudieron guardar los datos iniciales.") } }
    setStore(initial); refreshCatalogs()
    window.addEventListener("focus", refreshCatalogs); window.addEventListener("storage", refreshCatalogs)
    return () => { window.removeEventListener("focus", refreshCatalogs); window.removeEventListener("storage", refreshCatalogs) }
  }, [])
  function persist(data: InvestigationStore) {
    try { localStorage.setItem(ROAD_INVESTIGATIONS_KEY, JSON.stringify(data)); setStore(data); return true }
    catch { toast.error("No se pudo guardar. Reduce el tamaño del archivo o libera espacio del navegador."); return false }
  }
  function updateCase(record: RoadCase, event: string, data?: unknown) {
    const at = new Date().toISOString()
    const updated = closeIfReady({ ...record, updatedAt: at, history: [...record.history, { at, event, data }] })
    return persist({ ...store, cases: store.cases.map(r => r.id === record.id ? updated : r) })
  }
  const selected = store.cases.find(r => r.id === detailId)
  const selectedProcedure = store.procedures.find(p => p.id === procedureDetailId)
  const stageCase = store.cases.find(r => r.id === stageTarget?.caseId)
  const stageDefinition = stageDefinitions.find(s => s.key === stageTarget?.key)
  const entryCase = store.cases.find(r => r.id === entryTarget?.caseId)
  const entryAction = entryCase?.actions.find(a => a.id === entryTarget?.actionId)
  const csv = readStore<{ members: { employeeId: string }[] } | null>("safecloud:pesv-committee", null)
  const csvPeople = csv?.members.length ? catalogs?.people.filter(p => csv.members.some(m => m.employeeId === p.value)) ?? [] : catalogs?.people ?? []
  function personName(id: string, record?: RoadCase) { return catalogs?.people.find(p => p.value === id)?.label ?? Object.values(record?.links ?? {}).flat().find(o => o.value === id)?.label ?? "Colaborador no disponible" }
  function referenceLabels(kind: Kind, data: Values, links: Record<string, Option[]>) {
    return visibleFields(kind, data).map(field => [field.label, field.reference ? ids(data[field.key]).map(id => catalogs?.[field.reference!].find(o => o.value === id)?.label ?? links[field.key]?.find(o => o.value === id)?.label ?? "Referencia no disponible").join(" · ") || "Sin relación" : text(data[field.key]) || "Sin registrar"])
  }
  function openForm(mode: "case" | "procedure", id?: string) {
    refreshCatalogs(); setEditId(id ?? null); setFormMode(mode)
    if (mode === "procedure") { const item = store.procedures.find(p => p.id === id); setValues(item ? structuredClone(item.values) : initialValues(procedureKind)) }
    else {
      const item = store.cases.find(r => r.id === id)
      setValues(item ? structuredClone(item.values) : { ...initialValues(reportKind), occurrenceTime: "09:00" })
      setProcedureId(item?.procedureId ?? store.procedures[0]?.id ?? ""); setExternal(structuredClone(item?.externalInvestigators ?? []))
    }
  }
  function saveForm(event: FormEvent) {
    event.preventDefault()
    const current = loadCatalogs()
    const at = new Date().toISOString()
    if (formMode === "procedure") {
      const previous = store.procedures.find(p => p.id === editId)
      const error = validateRecord(procedureKind, values, [], current, previous)
      if (error) { toast.error(error); return }
      const active = Object.fromEntries(visibleFields(procedureKind, values).map(f => [f.key, values[f.key]])) as Values
      const record: RecordItem = { id: previous?.id ?? crypto.randomUUID(), kind: procedureKind.id, values: active, activities: [], entries: [], evidence: previous?.evidence ?? [], createdAt: previous?.createdAt ?? at, updatedAt: at, links: snapshotLinks(procedureKind, active, current, previous?.links), history: [...(previous?.history ?? []), { at, action: previous ? "Procedimiento actualizado" : "Procedimiento creado", snapshot: structuredClone(active) }] }
      if (persist({ ...store, procedures: previous ? store.procedures.map(p => p.id === previous.id ? record : p) : [...store.procedures, record] })) { setFormMode(null); toast.success("Procedimiento guardado") }
      return
    }
    const previous = store.cases.find(r => r.id === editId)
    if (previous?.closedAt) { toast.error("La investigación está cerrada."); return }
    const error = validateReport(values, external, current, previous)
    if (error) { toast.error(error); return }
    const procedure = store.procedures.find(p => p.id === procedureId)
    if (!procedure) { toast.error("Selecciona un procedimiento de investigación."); return }
    if (previous?.stages.length && procedureId !== previous.procedureId) { toast.error("Conserva el procedimiento con el que inició la investigación."); return }
    if (previous?.stages.length && text(values.occurrenceDate) !== text(previous.values.occurrenceDate)) { toast.error("La fecha del siniestro no puede cambiar después de registrar etapas."); return }
    const active = Object.fromEntries(reportKind.fields.map(f => [f.key, values[f.key]])) as Values
    const year = text(active.occurrenceDate).slice(0, 4)
    const number = (store.sequences[year] ?? 0) + 1
    const record: RoadCase = {
      id: previous?.id ?? crypto.randomUUID(), consecutive: previous?.consecutive ?? `SV-${year}-${String(number).padStart(3, "0")}`, values: active,
      procedureId, procedureSnapshot: previous?.procedureId === procedureId ? previous.procedureSnapshot : structuredClone(procedure.values),
      externalInvestigators: external, links: snapshotLinks(reportKind, active, current, previous?.links), stages: previous?.stages ?? [], actions: previous?.actions ?? [], diffusions: previous?.diffusions ?? [], evidence: previous?.evidence ?? [], createdAt: previous?.createdAt ?? at, updatedAt: at,
      history: [...(previous?.history ?? []), { at, event: previous ? "Reporte del siniestro actualizado" : "Siniestro reportado y equipo investigador asignado", data: { values: structuredClone(active), externalInvestigators: structuredClone(external), procedure: structuredClone(procedure.values) } }],
    }
    if (persist({ ...store, cases: previous ? store.cases.map(r => r.id === previous.id ? record : r) : [...store.cases, record], sequences: previous ? store.sequences : { ...store.sequences, [year]: number } })) { setFormMode(null); toast.success("Siniestro guardado") }
  }
  function openStage(record: RoadCase, key: StageKey) {
    const existing = record.stages.find(s => s.key === key)
    setStageTarget({ caseId: record.id, key })
    setStageForm(existing ? { date: existing.date, notes: existing.notes, authorId: existing.authorId, details: structuredClone(existing.details) } : { ...stageDefaults(), authorId: text(record.values.responsibleId), details: key === "ROOT" ? { methodology: text(record.procedureSnapshot.methodology) } : {} })
    setActionDrafts(structuredClone(record.actions)); refreshCatalogs()
  }
  function saveStage(event: FormEvent) {
    event.preventDefault()
    if (!stageCase || !stageTarget || stageCase.closedAt) return
    const prior = stageCase.stages.find(s => s.key === stageTarget.key)
    const stage: Stage = { ...stageForm, id: prior?.id ?? crypto.randomUUID(), key: stageTarget.key, recordedAt: new Date().toISOString() }
    const error = validateStage(stageCase, stage, actionDrafts)
    if (error) { toast.error(error); return }
    const actions = stage.key === "ACTIONS" ? actionDrafts : stageCase.actions
    const evidence = stage.key === "EVIDENCE" ? stageCase.evidence.map(e => !e.targetId ? { ...e, targetId: stage.id } : e) : stageCase.evidence
    const current = loadCatalogs()
    const links = { ...stageCase.links, actionPeople: actions.map(a => current.people.find(p => p.value === a.responsibleId)).filter((p): p is Option => Boolean(p)), workActivities: actions.map(a => current.workActivities.find(p => p.value === a.workActivityId)).filter((p): p is Option => Boolean(p)) }
    if (updateCase({ ...stageCase, links, stages: prior ? stageCase.stages.map(s => s.id === prior.id ? stage : s) : [...stageCase.stages, stage], actions, evidence }, `${prior ? "Etapa actualizada" : "Etapa registrada"}: ${stageDefinition?.title}`, { stage: structuredClone(stage), actions: stage.key === "ACTIONS" ? structuredClone(actions) : undefined })) { setStageTarget(null); toast.success("Etapa guardada") }
  }
  function openEntry(record: RoadCase, type: NonNullable<typeof entryTarget>["type"], action?: CorrectiveAction) {
    setEntryTarget({ caseId: record.id, type, actionId: action?.id })
    const leader = readStore<{ employeeId: string } | null>("safecloud:pesv-responsible", null)
    setEntryForm({ ...entryDefaults(), progress: String(action?.followUps.at(-1)?.progress ?? 0), evaluatorId: leader?.employeeId ?? text(record.values.responsibleId), csvResponsibleId: csvPeople[0]?.value ?? "" })
  }
  function saveEntry(event: FormEvent) {
    event.preventDefault()
    if (!entryCase || !entryTarget || entryCase.closedAt) return
    const at = new Date().toISOString()
    if (entryTarget.type === "DIFFUSION") {
      const lessons = entryCase.stages.find(s => s.key === "LESSONS")
      if (!lessons) { toast.error("Registra las lecciones aprendidas antes de divulgarlas."); return }
      if (entryForm.date < lessons.date || entryForm.date > today() || !entryForm.audience.trim() || !entryForm.csvResponsibleId || !entryForm.notes.trim()) { toast.error("Completa destinatarios, responsable del CSV, observaciones y una fecha posterior a las lecciones aprendidas."); return }
      const diffusion = { id: crypto.randomUUID(), date: entryForm.date, medium: entryForm.medium, audience: entryForm.audience.trim(), csvResponsibleId: entryForm.csvResponsibleId, observations: entryForm.notes.trim(), recordedAt: at }
      if (updateCase({ ...entryCase, diffusions: [...entryCase.diffusions, diffusion] }, "Lecciones aprendidas divulgadas", diffusion)) { setEntryTarget(null); toast.success("Divulgación registrada; carga su soporte desde las acciones del registro.") }
    } else if (entryAction) {
      const error = entryTarget.type === "FOLLOW_UP" ? validateFollowUp(entryCase, entryAction, entryForm.date, Number(entryForm.progress), entryForm.notes) : validateEvaluation(entryCase, entryAction, entryForm.date, entryForm.evaluatorId, entryForm.notes)
      if (error) { toast.error(error); return }
      const updated = entryTarget.type === "FOLLOW_UP" ? { ...entryAction, followUps: [...entryAction.followUps, { id: crypto.randomUUID(), date: entryForm.date, progress: Number(entryForm.progress), notes: entryForm.notes.trim(), recordedAt: at }] } : { ...entryAction, evaluations: [...entryAction.evaluations, { id: crypto.randomUUID(), followUpId: entryAction.followUps.at(-1)!.id, date: entryForm.date, result: entryForm.result, observations: entryForm.notes.trim(), evaluatorId: entryForm.evaluatorId, recordedAt: at }] }
      if (updateCase({ ...entryCase, actions: entryCase.actions.map(a => a.id === updated.id ? updated : a) }, entryTarget.type === "FOLLOW_UP" ? `Seguimiento de acción: ${entryForm.progress}%` : `Eficacia de acción: ${entryForm.result}`, updated)) { setEntryTarget(null); toast.success(entryTarget.type === "FOLLOW_UP" ? "Seguimiento registrado; ya puedes cargar su evidencia." : entryForm.result === "EFICAZ" ? "Acción evaluada como eficaz" : "La acción requiere ajuste y un nuevo seguimiento con evidencia") }
    }
  }
  function openUpload(owner: "case" | "procedure", ownerId: string, targetId?: string) {
    const record = store.cases.find(r => r.id === ownerId)
    setFile(null); setUploadTarget({ owner, ownerId, targetId: targetId ?? (owner === "case" ? record?.stages.find(s => s.key === "EVIDENCE")?.id : undefined) })
  }
  async function upload(event: FormEvent) {
    event.preventDefault()
    if (!file || !uploadTarget) return
    if (file.size > 3 * 1024 * 1024 || !(file.type.startsWith("image/") || file.type === "application/pdf")) { toast.error("Selecciona una imagen o PDF de hasta 3 MB."); return }
    setUploading(true)
    try {
      const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
      const at = new Date().toISOString()
      const evidence: Evidence = { id: crypto.randomUUID(), name: file.name, mime: file.type, url, uploadedAt: at, targetId: uploadTarget.targetId }
      let saved = false
      if (uploadTarget.owner === "procedure") saved = persist({ ...store, procedures: store.procedures.map(p => p.id === uploadTarget.ownerId ? { ...p, updatedAt: at, evidence: [...p.evidence, evidence], history: [...p.history, { at, action: `Documento cargado: ${file.name}` }] } : p) })
      else { const record = store.cases.find(r => r.id === uploadTarget.ownerId); if (record) saved = updateCase({ ...record, evidence: [...record.evidence, evidence] }, `Evidencia cargada: ${file.name}`, { evidenceId: evidence.id, targetId: evidence.targetId }) }
      if (saved) { setUploadTarget(null); toast.success("Evidencia cargada") }
    } catch { toast.error("No se pudo leer el archivo") } finally { setUploading(false) }
  }
  async function downloadCase(record: RoadCase, lessonsOnly = false) {
    const lessons = record.stages.find(s => s.key === "LESSONS")
    if (lessonsOnly && !lessons) { toast.error("Registra primero las lecciones aprendidas."); return }
    const doc = new jsPDF()
    doc.setFontSize(15); doc.setTextColor(30, 64, 175); doc.text(lessonsOnly ? "Lecciones aprendidas por siniestro vial" : "Investigación interna de siniestro vial", 14, 18)
    doc.setFontSize(9); doc.setTextColor(60); doc.text(`SafeCloud · PESV · ${record.consecutive}`, 14, 26)
    const basic = [["Fecha y hora", `${text(record.values.occurrenceDate)} ${text(record.values.occurrenceTime)}`], ["Lugar", text(record.values.place)], ["Evento", text(record.values.name)], ["Estado", caseStatus(record)], ["Equipo investigador", `${ids(record.values.investigatorIds).map(id => personName(id, record)).join(", ")}${record.externalInvestigators.length ? ` · ${record.externalInvestigators.map(p => `${p.name} (${p.organization})`).join(", ")}` : ""}`]]
    autoTable(doc, { startY: 32, head: [["Registro", "Información"]], body: basic, styles: { fontSize: 9 }, headStyles: { fillColor: [37, 99, 235] }, columnStyles: { 0: { cellWidth: 45 } } })
    if (lessonsOnly) {
      const causes = record.stages.find(s => s.key === "CAUSES"), root = record.stages.find(s => s.key === "ROOT")
      autoTable(doc, { head: [["Contenido", "Lección / análisis"]], body: [["¿Qué ocurrió?", text(lessons!.details.whatHappened)], ["Causas inmediatas", causes ? `${causes.notes}\n${Object.entries(causes.details).map(([k, v]) => `${factorLabels[k] ?? k}: ${text(v)}`).join("\n")}` : "Sin registrar"], ["Causa raíz", root ? `${root.notes}\n${text(root.details.analysis)}` : "Sin registrar"], ["Principales lecciones", lessons!.notes], ["Conclusiones / recomendaciones", text(lessons!.details.recommendations)]], styles: { fontSize: 9 }, headStyles: { fillColor: [37, 99, 235] }, columnStyles: { 0: { cellWidth: 45 } } })
    } else {
      autoTable(doc, { head: [["Campo", "Reporte del siniestro"]], body: referenceLabels(reportKind, record.values, record.links), styles: { fontSize: 9 }, columnStyles: { 0: { cellWidth: 55 } } })
      autoTable(doc, { head: [["Campo", "Procedimiento aplicado"]], body: referenceLabels(procedureKind, record.procedureSnapshot, record.links), styles: { fontSize: 9 } })
      if (record.stages.length) autoTable(doc, { head: [["Fecha", "Etapa", "Análisis"]], body: record.stages.map(s => [s.date, stageDefinitions.find(d => d.key === s.key)!.title, `${s.notes}\n${Object.entries(s.details).map(([k, v]) => `${factorLabels[k] ?? detailLabels[k] ?? k}: ${text(v)}`).join("\n")}\nResponsable: ${personName(s.authorId, record)}`]), styles: { fontSize: 8 } })
    }
    if (record.actions.length) autoTable(doc, { head: [["Tipo / acción", "Responsable", "Plazo", "Eficacia"]], body: record.actions.map(a => [`${a.type}: ${a.description}`, personName(a.responsibleId, record), a.dueDate, actionState(a, record.evidence)]), styles: { fontSize: 8 } })
    if (record.diffusions.length) autoTable(doc, { head: [["Fecha", "Divulgación", "Destinatarios / responsable CSV"]], body: record.diffusions.map(d => [d.date, `${d.medium}\n${d.observations}`, `${d.audience}\n${personName(d.csvResponsibleId, record)}`]), styles: { fontSize: 8 } })
    if (!lessonsOnly) {
      const followUps = record.actions.flatMap(a => a.followUps.map(f => [a.description, f.date, `${f.progress}%`, f.notes]))
      const evaluations = record.actions.flatMap(a => a.evaluations.map(e => [a.description, e.date, e.result, `${personName(e.evaluatorId, record)}\n${e.observations}`]))
      if (followUps.length) autoTable(doc, { head: [["Acción", "Fecha", "Avance", "Seguimiento"]], body: followUps, styles: { fontSize: 8 } })
      if (evaluations.length) autoTable(doc, { head: [["Acción", "Fecha", "Resultado", "Evaluación de eficacia"]], body: evaluations, styles: { fontSize: 8 } })
      if (record.evidence.length) autoTable(doc, { head: [["Evidencia", "Fecha de carga"]], body: record.evidence.map(e => [e.name, e.uploadedAt.slice(0, 10)]), styles: { fontSize: 8 } })
    }
    for (const photo of record.evidence.filter(e => e.mime.startsWith("image/") && (!e.targetId || record.stages.some(s => s.key === "EVIDENCE" && s.id === e.targetId))).slice(0, 4)) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = photo.url })
        const canvas = document.createElement("canvas"); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; canvas.getContext("2d")!.drawImage(img, 0, 0)
        const scale = Math.min(180 / img.naturalWidth, 225 / img.naturalHeight)
        doc.addPage(); doc.setFontSize(11); doc.text(doc.splitTextToSize(photo.name, 180), 14, 18)
        doc.addImage(canvas.toDataURL("image/jpeg"), "JPEG", 14, 32, img.naturalWidth * scale, img.naturalHeight * scale)
      } catch { toast.error(`No se pudo incluir la imagen ${photo.name} en el PDF.`) }
    }
    const count = doc.internal.pages.length - 1
    for (let page = 1; page <= count; page++) { doc.setPage(page); doc.setFontSize(8); doc.setTextColor(100); doc.text(`SafeCloud · ${record.consecutive} · Página ${page} de ${count}`, 14, 289) }
    doc.save(`${lessonsOnly ? "lecciones-aprendidas" : "investigacion"}-${record.consecutive}.pdf`)
  }
  function downloadProcedure(record: RecordItem) {
    const doc = new jsPDF(); doc.setFontSize(15); doc.text("Procedimiento de investigación vial", 14, 18)
    autoTable(doc, { startY: 26, head: [["Campo", "Información"]], body: referenceLabels(procedureKind, record.values, record.links), headStyles: { fillColor: [37, 99, 235] }, styles: { fontSize: 9 } }); doc.save("procedimiento-investigacion-vial.pdf")
  }
  const visibleCases = store.cases.filter(r => `${r.consecutive} ${text(r.values.name)} ${text(r.values.place)}`.toLowerCase().includes(search.toLowerCase()) && (!filter || (filter === "closed" ? Boolean(r.closedAt) : !r.closedAt)))
  const visibleProcedures = store.procedures.filter(p => text(p.values.name).toLowerCase().includes(search.toLowerCase()))
  const formKind = formMode === "procedure" ? procedureKind : reportKind
  const formFields = visibleFields(formKind, values)
  const editingCase = store.cases.find(r => r.id === editId)
  if (!catalogs) return <p className="p-6 text-sm text-muted-foreground">Cargando investigaciones…</p>
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Investigación interna de siniestros viales</h1><p className="mt-1 text-sm text-muted-foreground">PESV · Procedimientos, lecciones aprendidas y eficacia de las acciones · Nivel estándar y avanzado</p></div><Button onClick={() => openForm(tab === "cases" ? "case" : "procedure")}><Plus className="mr-2 h-4 w-4" />{tab === "cases" ? "Reportar siniestro" : "Nuevo procedimiento"}</Button></div>
    <Tabs value={tab} onValueChange={value => { setTab(value); setSearch(""); setFilter("") }}><TabsList className="h-auto max-w-full flex-wrap"><TabsTrigger value="cases">Siniestros e investigaciones</TabsTrigger><TabsTrigger value="procedures">Procedimientos</TabsTrigger></TabsList></Tabs>
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm"><span>Reportados: <strong>{store.cases.length}</strong></span><span>Abiertos: <strong className="text-blue-700">{store.cases.filter(r => !r.closedAt).length}</strong></span><span>Cerrados: <strong className="text-green-700">{store.cases.filter(r => r.closedAt).length}</strong></span><span>Acciones por ajustar: <strong className="text-amber-700">{store.cases.flatMap(r => r.actions.filter(a => actionState(a, r.evidence) === "Requiere ajuste")).length}</strong></span></div>
    <div className="flex flex-wrap gap-3"><div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar investigaciones" className="pl-9" placeholder="Buscar siniestro, consecutivo o lugar" value={search} onChange={e => setSearch(e.target.value)} /></div>{tab === "cases" && <select aria-label="Filtrar investigaciones" className={`${selectClass} sm:w-48`} value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todos los estados</option><option value="open">Abiertas</option><option value="closed">Cerradas</option></select>}</div>
    <section className="overflow-hidden rounded-lg border bg-card"><h2 className="border-b px-4 py-3 font-semibold">{tab === "cases" ? "Lista de siniestros viales" : "Procedimientos de investigación"}</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100"><tr>{(tab === "cases" ? ["Consecutivo / siniestro", "Fecha / lugar", "Responsable", "Estado", "Cierre previsto", "Cierre real", ""] : ["Nombre", "Versión", "Metodología", "Responsable", ""]).map((label, i) => <th className="px-4 py-3 text-left whitespace-nowrap" key={i}>{label}</th>)}</tr></thead><tbody>{tab === "cases" ? visibleCases.map(record => <tr className="border-b last:border-0" key={record.id}><td className="min-w-56 px-4 py-3"><p className="text-xs text-primary">{record.consecutive}</p><p className="font-medium">{text(record.values.name)}</p></td><td className="min-w-40 px-4 py-3">{text(record.values.occurrenceDate)}<p className="text-xs text-muted-foreground">{text(record.values.place)}</p></td><td className="px-4 py-3">{personName(text(record.values.responsibleId), record)}</td><td className="min-w-48 px-4 py-3"><Badge variant="outline" className={record.closedAt ? "border-green-200 bg-green-50 text-green-700" : "border-blue-200 bg-blue-50 text-blue-800"}>{caseStatus(record)}</Badge></td><td className="whitespace-nowrap px-4 py-3">{text(record.values.dueDate)}{!record.closedAt && text(record.values.dueDate) < today() && <p className="text-xs text-red-600">Plazo vencido</p>}</td><td className="whitespace-nowrap px-4 py-3">{record.closedAt ? new Date(record.closedAt).toLocaleDateString("es-CO", { timeZone: "America/Bogota" }) : "—"}</td><td className="px-2"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Acciones de ${record.consecutive}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => { refreshCatalogs(); setDetailId(record.id) }}><Eye className="mr-2 h-4 w-4" />Ver investigación</DropdownMenuItem><DropdownMenuItem disabled={!!record.closedAt} onSelect={() => openForm("case", record.id)}><Edit className="mr-2 h-4 w-4" />Editar reporte</DropdownMenuItem>{nextStage(record) && <DropdownMenuItem disabled={!!record.closedAt || record.stages.some(s => s.key === nextStage(record)!.key)} onSelect={() => openStage(record, nextStage(record)!.key)}><Plus className="mr-2 h-4 w-4" />Registrar siguiente etapa</DropdownMenuItem>}<DropdownMenuItem onSelect={() => openUpload("case", record.id)}><Upload className="mr-2 h-4 w-4" />Cargar evidencia</DropdownMenuItem><DropdownMenuItem onSelect={() => downloadCase(record)}><Download className="mr-2 h-4 w-4" />Descargar investigación</DropdownMenuItem><DropdownMenuItem disabled={!record.stages.some(s => s.key === "LESSONS")} onSelect={() => downloadCase(record, true)}><Download className="mr-2 h-4 w-4" />Descargar lecciones aprendidas</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem disabled={record.stages.length > 0 || record.evidence.length > 0} className="text-red-600" onSelect={() => setDeleteTarget({ kind: "case", id: record.id })}><Trash2 className="mr-2 h-4 w-4" />Eliminar reporte sin seguimiento</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>) : visibleProcedures.map(p => <tr className="border-b last:border-0" key={p.id}><td className="min-w-56 px-4 py-3 font-medium">{text(p.values.name)}</td><td className="px-4 py-3">{text(p.values.version)}</td><td className="px-4 py-3">{text(p.values.methodology)}</td><td className="px-4 py-3">{personName(text(p.values.responsibleId))}</td><td className="px-2"><DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Acciones de ${text(p.values.name)}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setProcedureDetailId(p.id)}><Eye className="mr-2 h-4 w-4" />Ver procedimiento</DropdownMenuItem><DropdownMenuItem onSelect={() => openForm("procedure", p.id)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem><DropdownMenuItem onSelect={() => openUpload("procedure", p.id)}><Upload className="mr-2 h-4 w-4" />Cargar evidencia</DropdownMenuItem><DropdownMenuItem onSelect={() => downloadProcedure(p)}><Download className="mr-2 h-4 w-4" />Descargar PDF</DropdownMenuItem><DropdownMenuItem className="text-red-600" onSelect={() => setDeleteTarget({ kind: "procedure", id: p.id })}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>)}</tbody></table></div>{!(tab === "cases" ? visibleCases.length : visibleProcedures.length) && <p className="p-8 text-center text-sm text-muted-foreground">Sin registros para mostrar.</p>}</section>
    <Modal open={!!formMode} onOpenChange={open => !open && setFormMode(null)} title={formMode === "case" ? `${editId ? "Editar" : "Reportar"} siniestro vial` : `${editId ? "Editar" : "Nuevo"} procedimiento de investigación`} footer={<><Button variant="outline" onClick={() => setFormMode(null)}>Cancelar</Button><Button type="submit" form="road-report-form">Guardar</Button></>}>
      <form id="road-report-form" onSubmit={saveForm} className="space-y-6">{formMode === "case" && <FormField label="Procedimiento de investigación"><select required disabled={!!editingCase?.stages.length} aria-label="Procedimiento de investigación" className={selectClass} value={procedureId} onChange={e => setProcedureId(e.target.value)}><option value="">Seleccionar</option>{store.procedures.map(p => <option key={p.id} value={p.id}>{text(p.values.name)} · {text(p.values.version)}</option>)}</select></FormField>}{[...new Set(formFields.map(f => f.section))].map((section, index) => <section key={section} className={index ? "space-y-4 border-t pt-5" : "space-y-4"}><h3 className="font-semibold text-primary">{section}</h3><div className="grid gap-4 md:grid-cols-2">{formFields.filter(f => f.section === section).map(field => <div key={field.key} className={field.wide ? "min-w-0 md:col-span-2" : "min-w-0"}><FormField label={`${field.label}${field.required ? " *" : " (opcional)"}`}>{field.key === "occurrenceTime" ? <Input aria-label={field.label} type="time" required value={text(values[field.key])} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} /> : <FieldInput field={field} catalogs={catalogs} value={values[field.key] ?? (field.multiple ? [] : "")} onChange={value => setValues(prev => ({ ...prev, [field.key]: value }))} />}</FormField></div>)}</div></section>)}{formMode === "case" && <section className="space-y-4 border-t pt-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-primary">Investigadores externos (opcional)</h3><Button type="button" variant="outline" onClick={() => setExternal(prev => [...prev, { id: crypto.randomUUID(), name: "", organization: "" }])}><Plus className="mr-2 h-4 w-4" />Persona externa</Button></div>{external.map((p, index) => <div key={p.id} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"><FormField label={`Nombre · persona ${index + 1}`}><Input required aria-label={`Nombre externo ${index + 1}`} value={p.name} onChange={e => setExternal(prev => prev.map(person => person.id === p.id ? { ...person, name: e.target.value } : person))} /></FormField><FormField label="Organización / rol"><Input required aria-label={`Organización externo ${index + 1}`} value={p.organization} onChange={e => setExternal(prev => prev.map(person => person.id === p.id ? { ...person, organization: e.target.value } : person))} /></FormField><Button type="button" size="icon" variant="ghost" aria-label={`Quitar investigador externo ${index + 1}`} onClick={() => setExternal(prev => prev.filter(person => person.id !== p.id))}><Trash2 className="h-4 w-4" /></Button></div>)}</section>}</form>
    </Modal>
    <Modal open={!!selected} onOpenChange={open => !open && setDetailId(null)} title={selected ? `${selected.consecutive} · ${text(selected.values.name)}` : "Investigación"}>
      {selected && <div className="space-y-6"><div className="flex flex-wrap items-center gap-3"><Badge variant="outline">{caseStatus(selected)}</Badge><Button size="sm" variant="outline" onClick={() => downloadCase(selected)}><Download className="mr-2 h-4 w-4" />Investigación PDF</Button><Button size="sm" variant="outline" disabled={!selected.stages.some(s => s.key === "LESSONS")} onClick={() => downloadCase(selected, true)}><Download className="mr-2 h-4 w-4" />Lecciones aprendidas PDF</Button></div><dl className="grid gap-4 sm:grid-cols-2">{referenceLabels(reportKind, selected.values, selected.links).map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value}</dd></div>)}<div><dt className="text-xs text-muted-foreground">Procedimiento aplicado</dt><dd className="text-sm">{text(selected.procedureSnapshot.name)} · v{text(selected.procedureSnapshot.version)}</dd></div><div><dt className="text-xs text-muted-foreground">Investigadores externos</dt><dd className="text-sm">{selected.externalInvestigators.map(p => `${p.name} (${p.organization})`).join(" · ") || "No registrados"}</dd></div>{selected.closedAt && <div><dt className="text-xs text-muted-foreground">Cierre de investigación</dt><dd className="text-sm">{new Date(selected.closedAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</dd></div>}</dl>
        <section className="space-y-4 border-t pt-5"><h3 className="font-semibold">Etapas de investigación</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{stageDefinitions.map((definition, index) => {
          const complete = stageComplete(selected, definition.key), stage = selected.stages.find(s => s.key === definition.key), current = nextStage(selected)?.key === definition.key
          return <div key={definition.key} className={`rounded-md border p-3 ${complete ? "border-green-200" : current ? "border-blue-300 bg-blue-50/50 dark:bg-blue-950/30" : ""}`}><p className="flex items-start gap-2 text-sm font-medium">{complete ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-700" /> : <span className="text-primary">{index + 2}.</span>}{definition.title}</p><p className="mt-1 text-xs text-muted-foreground">{definition.role}</p>{stage && <details className="mt-2 text-sm"><summary className="cursor-pointer text-primary">Ver registro · {stage.date}</summary><p className="mt-2 whitespace-pre-wrap">{stage.notes}</p>{Object.entries(stage.details).filter(([, value]) => text(value)).map(([key, value]) => <p className="mt-1 whitespace-pre-wrap text-xs" key={key}><strong>{factorLabels[key] ?? detailLabels[key] ?? key}: </strong>{text(value)}</p>)}<p className="mt-2 text-xs text-muted-foreground">{personName(stage.authorId, selected)}</p><EvidenceList evidence={selected.evidence.filter(e => e.targetId === stage.id)} onPreview={setPreview} /></details>}{!selected.closedAt && <div className="mt-2 flex flex-wrap gap-2">{(current && !stage || stage) && <Button variant="outline" size="sm" onClick={() => openStage(selected, definition.key)}>{stage ? "Editar etapa" : "Registrar etapa"}</Button>}{stage && definition.key === "EVIDENCE" && <Button size="sm" variant="outline" onClick={() => openUpload("case", selected.id, stage.id)}><Upload className="mr-1 h-3 w-3" />Evidencia</Button>}</div>}</div>
        })}</div></section>
        <section className="space-y-4 border-t pt-5"><h3 className="font-semibold">Acciones, seguimiento y verificación de eficacia</h3>{selected.actions.map(action => <div className="space-y-3 rounded-md border p-4" key={action.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{action.type} · {action.description}</p><p className="text-xs text-muted-foreground">{personName(action.responsibleId, selected)} · Fecha límite {action.dueDate}</p>{action.dueDate < today() && actionState(action, selected.evidence) !== "Eficaz" && <p className="text-xs text-red-600">Acción vencida</p>}{action.workActivityId && <Link href="/dashboard/pesv-work-plan" className="text-xs text-primary underline">Actividad del plan anual: {catalogs.workActivities.find(p => p.value === action.workActivityId)?.label ?? selected.links.workActivities?.find(p => p.value === action.workActivityId)?.label ?? "Actividad relacionada"}</Link>}</div><Badge variant="outline">{actionState(action, selected.evidence)}</Badge></div>{!selected.closedAt && <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={actionState(action, selected.evidence) === "Eficaz"} onClick={() => openEntry(selected, "FOLLOW_UP", action)}><Plus className="mr-1 h-3 w-3" />Seguimiento de acción</Button><Button size="sm" variant="outline" disabled={actionState(action, selected.evidence) !== "Pendiente de verificación" || !lessonsDocumented(selected)} onClick={() => openEntry(selected, "EVALUATION", action)}><FileCheck2 className="mr-1 h-3 w-3" />Evaluar eficacia</Button></div>}<p className="text-xs text-muted-foreground">Último avance: {action.followUps.at(-1)?.progress ?? 0}%</p>{actionState(action, selected.evidence) === "Pendiente de evidencia" && <p className="text-sm text-amber-700">Carga la evidencia del seguimiento al 100% para habilitar la verificación.</p>}{action.followUps.map(followUp => <div className="border-l-2 border-blue-300 pl-3" key={followUp.id}><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{followUp.date} · Avance {followUp.progress}%</p><DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Acciones del seguimiento ${followUp.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => openUpload("case", selected.id, followUp.id)}><Upload className="mr-2 h-4 w-4" />Cargar evidencia</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div><p className="whitespace-pre-wrap text-sm">{followUp.notes}</p><EvidenceList evidence={selected.evidence.filter(e => e.targetId === followUp.id)} onPreview={setPreview} />{action.evaluations.filter(e => e.followUpId === followUp.id).map(evaluation => <div className="mt-3 text-sm" key={evaluation.id}><p className={evaluation.result === "EFICAZ" ? "font-medium text-green-700" : "font-medium text-red-600"}>{evaluation.date} · {evaluation.result === "EFICAZ" ? "Eficaz" : "No eficaz · requiere ajuste"}</p><p className="whitespace-pre-wrap">{evaluation.observations}</p><p className="text-xs text-muted-foreground">Evaluador: {personName(evaluation.evaluatorId, selected)}</p></div>)}</div>)}</div>)}{!selected.actions.length && <p className="text-sm text-muted-foreground">Las acciones se definen en la etapa de plan de acción.</p>}</section>
        <section className="space-y-4 border-t pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Divulgación de lecciones aprendidas · CSV</h3><Button size="sm" variant="outline" disabled={!!selected.closedAt || !selected.stages.some(s => s.key === "LESSONS")} onClick={() => openEntry(selected, "DIFFUSION")}><Plus className="mr-1 h-3 w-3" />Registrar divulgación</Button></div>{selected.diffusions.map(d => <div className="border-l-2 border-blue-300 pl-3" key={d.id}><div className="flex items-center justify-between"><p className="text-sm font-medium">{d.date} · {d.medium}</p><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Acciones de divulgación ${d.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => openUpload("case", selected.id, d.id)}><Upload className="mr-2 h-4 w-4" />Cargar evidencia</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div><p className="text-sm">{d.audience} · Responsable CSV: {personName(d.csvResponsibleId, selected)}</p><p className="whitespace-pre-wrap text-sm">{d.observations}</p><EvidenceList evidence={selected.evidence.filter(e => e.targetId === d.id)} onPreview={setPreview} /></div>)}{!lessonsDocumented(selected) && <p className="text-sm text-amber-700">Pendiente la divulgación de lecciones aprendidas y su soporte documental.</p>}</section>
        <section className="space-y-3 border-t pt-5"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Documentos del siniestro</h3><Button variant="outline" size="sm" onClick={() => openUpload("case", selected.id)}><Upload className="mr-1 h-3 w-3" />Cargar evidencia</Button></div><EvidenceList evidence={selected.evidence.filter(e => !e.targetId || selected.stages.some(s => s.key === "EVIDENCE" && s.id === e.targetId))} onPreview={setPreview} /></section>
        <section className="space-y-3 border-t pt-5"><h3 className="font-semibold">Historial de investigación</h3>{selected.history.map((event, index) => <div key={index} className="text-sm"><p className="text-xs text-muted-foreground">{new Date(event.at).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</p><p>{event.event}</p>{event.data != null && <details className="mt-1"><summary className="cursor-pointer text-xs text-primary">Ver datos del registro</summary><AuditSnapshot data={event.data} catalogs={catalogs} /></details>}</div>)}</section>
      </div>}
    </Modal>
    <Modal open={!!selectedProcedure} onOpenChange={open => !open && setProcedureDetailId(null)} title="Detalle del procedimiento de investigación">
      {selectedProcedure && <div className="space-y-5"><dl className="grid gap-4 sm:grid-cols-2">{referenceLabels(procedureKind, selectedProcedure.values, selectedProcedure.links).map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap text-sm">{value}</dd></div>)}</dl><div className="flex gap-2"><Button variant="outline" onClick={() => downloadProcedure(selectedProcedure)}><Download className="mr-2 h-4 w-4" />Descargar PDF</Button><Button variant="outline" onClick={() => openUpload("procedure", selectedProcedure.id)}><Upload className="mr-2 h-4 w-4" />Cargar evidencia</Button></div><EvidenceList evidence={selectedProcedure.evidence} onPreview={setPreview} /></div>}
    </Modal>
    <Modal open={!!stageTarget} onOpenChange={open => !open && setStageTarget(null)} title={stageDefinition?.title ?? "Etapa de investigación"} footer={<><Button variant="outline" onClick={() => setStageTarget(null)}>Cancelar</Button><Button type="submit" form="road-stage-form">Guardar etapa</Button></>}>
      <form id="road-stage-form" onSubmit={saveStage} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><FormField label="Fecha del registro"><Input aria-label="Fecha de etapa" required type="date" max={today()} value={stageForm.date} onChange={e => setStageForm(prev => ({ ...prev, date: e.target.value }))} /></FormField><FormField label="Responsable de la etapa"><ReferenceInput field={{ key: "authorId", label: "Responsable de la etapa", section: "", reference: "people", required: true }} options={catalogs.people} value={stageForm.authorId} onChange={value => setStageForm(prev => ({ ...prev, authorId: text(value) }))} /></FormField></div><FormField label={stageDefinition?.label ?? "Análisis"}><Textarea aria-label="Análisis de etapa" required value={stageForm.notes} onChange={e => setStageForm(prev => ({ ...prev, notes: e.target.value }))} /></FormField>
        {stageTarget?.key === "CAUSES" && <div className="grid gap-4 sm:grid-cols-2">{Object.entries(factorLabels).map(([key, label]) => <FormField key={key} label={label}><Textarea aria-label={label} value={text(stageForm.details[key])} onChange={e => setStageForm(prev => ({ ...prev, details: { ...prev.details, [key]: e.target.value } }))} /></FormField>)}</div>}
        {stageTarget?.key === "ROOT" && <><FormField label="Metodología aplicada"><select className={selectClass} aria-label="Metodología aplicada" value={text(stageForm.details.methodology)} onChange={e => setStageForm(prev => ({ ...prev, details: { ...prev.details, methodology: e.target.value } }))}>{methodologies.map(method => <option key={method}>{method}</option>)}</select></FormField><FormField label="Análisis de causa raíz / relación entre hechos y causas"><Textarea aria-label="Análisis de causa raíz" required value={text(stageForm.details.analysis)} onChange={e => setStageForm(prev => ({ ...prev, details: { ...prev.details, analysis: e.target.value } }))} /></FormField></>}
        {stageTarget?.key === "LESSONS" && <><FormField label="¿Qué ocurrió?"><Textarea aria-label="Qué ocurrió" required value={text(stageForm.details.whatHappened)} onChange={e => setStageForm(prev => ({ ...prev, details: { ...prev.details, whatHappened: e.target.value } }))} /></FormField><FormField label="Conclusiones / recomendaciones / acciones tomadas"><Textarea aria-label="Recomendaciones de lecciones" required value={text(stageForm.details.recommendations)} onChange={e => setStageForm(prev => ({ ...prev, details: { ...prev.details, recommendations: e.target.value } }))} /></FormField></>}
        {stageTarget?.key === "ACTIONS" && <section className="space-y-4 border-t pt-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Acciones propuestas</h3><Button type="button" variant="outline" onClick={() => setActionDrafts(prev => [...prev, { id: crypto.randomUUID(), type: "Correctiva", description: "", responsibleId: "", dueDate: today(), workActivityId: "", followUps: [], evaluations: [] }])}><Plus className="mr-2 h-4 w-4" />Agregar acción</Button></div>{actionDrafts.map((action, index) => {
          const saved = stageCase?.actions.some(a => a.id === action.id)
          function update(key: keyof CorrectiveAction, value: string) { setActionDrafts(prev => prev.map(a => a.id === action.id ? { ...a, [key]: value } : a)) }
          return <div key={action.id} className="space-y-3 border-b pb-4"><div className="flex justify-between gap-2"><h4 className="text-sm font-medium">Acción {index + 1}</h4>{!saved && <Button size="icon" type="button" variant="ghost" aria-label={`Quitar acción ${index + 1}`} onClick={() => setActionDrafts(prev => prev.filter(a => a.id !== action.id))}><Trash2 className="h-4 w-4" /></Button>}</div>{saved ? <p className="text-sm">{action.type}: {action.description} · {personName(action.responsibleId, stageCase)} · {action.dueDate}</p> : <div className="grid gap-4 sm:grid-cols-2"><FormField label="Tipo de acción"><select aria-label={`Tipo de acción ${index + 1}`} className={selectClass} value={action.type} onChange={e => update("type", e.target.value)}>{["Correctiva", "Preventiva", "Mejora"].map(t => <option key={t}>{t}</option>)}</select></FormField><FormField label="Responsable de la acción"><ReferenceInput field={{ key: "responsibleId", label: `Responsable acción ${index + 1}`, section: "", required: true }} options={catalogs.people} value={action.responsibleId} onChange={value => update("responsibleId", text(value))} /></FormField><div className="sm:col-span-2"><FormField label="Descripción de la acción"><Textarea aria-label={`Descripción acción ${index + 1}`} required value={action.description} onChange={e => update("description", e.target.value)} /></FormField></div><FormField label="Fecha límite"><Input aria-label={`Fecha límite acción ${index + 1}`} required type="date" min={stageForm.date} value={action.dueDate} onChange={e => update("dueDate", e.target.value)} /></FormField><FormField label="Actividad del plan anual PESV (opcional)"><ReferenceInput field={{ key: "workActivityId", label: `Actividad plan acción ${index + 1}`, section: "" }} options={catalogs.workActivities} value={action.workActivityId} onChange={value => update("workActivityId", text(value))} /></FormField></div>}</div>
        })}</section>}
      </form>
    </Modal>
    <Modal open={!!entryTarget} onOpenChange={open => !open && setEntryTarget(null)} title={entryTarget?.type === "EVALUATION" ? "Evaluar eficacia de la acción" : entryTarget?.type === "DIFFUSION" ? "Divulgar lecciones aprendidas" : "Seguimiento de la acción"} footer={<><Button variant="outline" onClick={() => setEntryTarget(null)}>Cancelar</Button><Button type="submit" form="road-entry-form">Guardar</Button></>}>
      <form id="road-entry-form" onSubmit={saveEntry} className="space-y-4">{entryAction && <p className="text-sm font-medium">{entryAction.description}</p>}<FormField label="Fecha"><Input aria-label="Fecha de seguimiento o evaluación" required type="date" max={today()} value={entryForm.date} onChange={e => setEntryForm(prev => ({ ...prev, date: e.target.value }))} /></FormField>{entryTarget?.type === "FOLLOW_UP" && <FormField label="Avance de cumplimiento (%)"><Input aria-label="Avance de acción" required type="number" min={0} max={100} value={entryForm.progress} onChange={e => setEntryForm(prev => ({ ...prev, progress: e.target.value }))} /></FormField>}{entryTarget?.type === "EVALUATION" && <><FormField label="Resultado de eficacia"><select aria-label="Resultado de eficacia" className={selectClass} value={entryForm.result} onChange={e => setEntryForm(prev => ({ ...prev, result: e.target.value as "EFICAZ" | "NO_EFICAZ" }))}><option value="EFICAZ">Eficaz</option><option value="NO_EFICAZ">No eficaz · requiere ajuste y nueva evidencia</option></select></FormField><FormField label="Evaluador / líder PESV"><ReferenceInput field={{ key: "evaluatorId", label: "Evaluador de eficacia", section: "", required: true }} options={catalogs.people} value={entryForm.evaluatorId} onChange={value => setEntryForm(prev => ({ ...prev, evaluatorId: text(value) }))} /></FormField></>}{entryTarget?.type === "DIFFUSION" && <><FormField label="Medio de divulgación"><Input aria-label="Medio de divulgación de lecciones" required value={entryForm.medium} onChange={e => setEntryForm(prev => ({ ...prev, medium: e.target.value }))} /></FormField><FormField label="Destinatarios / colaboradores informados"><Input aria-label="Destinatarios de lecciones" required value={entryForm.audience} onChange={e => setEntryForm(prev => ({ ...prev, audience: e.target.value }))} /></FormField><FormField label="Responsable de divulgación · CSV"><ReferenceInput field={{ key: "csvResponsibleId", label: "Responsable CSV", section: "", required: true }} options={csvPeople} value={entryForm.csvResponsibleId} onChange={value => setEntryForm(prev => ({ ...prev, csvResponsibleId: text(value) }))} /></FormField></>}<FormField label={entryTarget?.type === "EVALUATION" ? "Conclusión del evaluador" : "Observaciones / resultados"}><Textarea aria-label="Observaciones de acción o divulgación" required value={entryForm.notes} onChange={e => setEntryForm(prev => ({ ...prev, notes: e.target.value }))} /></FormField></form>
    </Modal>
    <Modal open={!!uploadTarget} onOpenChange={open => !uploading && !open && setUploadTarget(null)} title="Cargar evidencia" footer={<Button type="submit" form="road-evidence-form" disabled={!file || uploading}>{uploading ? "Cargando…" : "Cargar evidencia"}</Button>}><form id="road-evidence-form" onSubmit={upload}><FormField label="Documento o fotografía"><Input aria-label="Seleccionar evidencia vial" type="file" accept="image/*,application/pdf" required onChange={e => setFile(e.target.files?.[0] ?? null)} /></FormField></form></Modal>
    <Modal open={!!preview} onOpenChange={open => !open && setPreview(null)} title={preview?.name ?? "Documento"} footer={preview && <Button asChild><a href={preview.url} download={preview.name}><Download className="mr-2 h-4 w-4" />Descargar</a></Button>}>{preview && <div className="h-[65dvh]">{preview.mime.startsWith("image/") ? <img src={preview.url} alt={preview.name} className="h-full w-full object-contain" /> : <iframe title={preview.name} src={preview.url} className="h-full w-full" />}</div>}</Modal>
    <Modal open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)} title="Eliminar registro" footer={<><Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button variant="destructive" onClick={() => {
      if (!deleteTarget) return
      if (deleteTarget.kind === "procedure" && store.cases.some(c => c.procedureId === deleteTarget.id)) { toast.error("El procedimiento está relacionado con una investigación."); return }
      const record = store.cases.find(c => c.id === deleteTarget.id)
      if (deleteTarget.kind === "case" && record && (record.stages.length || record.evidence.length)) { toast.error("Conserva la investigación con seguimiento para mantener su historial."); return }
      if (persist({ ...store, procedures: deleteTarget.kind === "procedure" ? store.procedures.filter(p => p.id !== deleteTarget.id) : store.procedures, cases: deleteTarget.kind === "case" ? store.cases.filter(c => c.id !== deleteTarget.id) : store.cases })) { setDeleteTarget(null); toast.success("Registro eliminado") }
    }}>Eliminar</Button></>}><p className="text-sm">Se eliminará el registro seleccionado. Esta acción no se puede deshacer.</p></Modal>
  </div>
}

const factorLabels: Record<string, string> = { human: "Factor humano", vehicle: "Factor vehículo", infrastructure: "Factor infraestructura", environment: "Factor entorno", organization: "Factor organización" }
const detailLabels: Record<string, string> = { methodology: "Metodología", analysis: "Análisis de causa raíz", whatHappened: "¿Qué ocurrió?", recommendations: "Recomendaciones" }

function AuditSnapshot({ data, catalogs, depth = 0 }: { data: unknown; catalogs: Catalogs; depth?: number }) {
  if (!data || typeof data !== "object" || depth > 4) return null
  const labels: Record<string, string> = {
    ...Object.fromEntries([...reportKind.fields, ...procedureKind.fields].map(f => [f.key, f.label])),
    ...factorLabels, ...detailLabels, values: "Información del reporte", procedure: "Procedimiento aplicado",
    externalInvestigators: "Equipo externo", organization: "Organización / rol", stage: "Etapa",
    key: "Etapa", notes: "Observaciones", details: "Análisis", authorId: "Responsable", actions: "Acciones propuestas",
    type: "Tipo", description: "Descripción", followUps: "Seguimientos", evaluations: "Evaluaciones de eficacia",
    date: "Fecha", progress: "Avance (%)", result: "Resultado", observations: "Conclusión / observaciones",
    evaluatorId: "Evaluador", medium: "Medio", audience: "Destinatarios", csvResponsibleId: "Responsable CSV",
    workActivityId: "Actividad del plan anual", recordedAt: "Fecha de registro",
  }
  const allOptions = Object.values(catalogs).flat()
  if (Array.isArray(data)) return <div className="grid gap-2">{data.map((item, i) => <AuditSnapshot key={i} data={item} catalogs={catalogs} depth={depth + 1} />)}</div>
  return <dl className="mt-2 grid gap-2 border-l pl-3 text-xs">{Object.entries(data).filter(([key, value]) => labels[key] && value != null && value !== "").map(([key, value]) => {
    const reference = key.endsWith("Id") || key.endsWith("Ids")
    const resolved = reference ? (Array.isArray(value) ? value : [value]).map(id => allOptions.find(o => o.value === id)?.label ?? "Referencia conservada en el expediente").join(" · ") : key === "key" ? stageDefinitions.find(s => s.key === value)?.title ?? String(value) : String(value)
    return <div key={key}><dt className="text-muted-foreground">{labels[key]}</dt><dd className="whitespace-pre-wrap break-words">{typeof value === "object" && !reference ? <AuditSnapshot data={value} catalogs={catalogs} depth={depth + 1} /> : resolved}</dd></div>
  })}</dl>
}
