import { dateToday, ids, initialValues, readStore, text, validateRecord, type Catalogs, type Evidence, type Field, type Kind, type Option, type RecordItem, type Values } from "@/lib/pesv/planning"

export const ROAD_INVESTIGATIONS_KEY = "safecloud:pesv-road-investigations"
export const methodologies = ["Árbol de causas", "Cinco porqués", "Ishikawa", "Otra"]
const f = (key: string, label: string, section: string, type: Field["type"] = "text", extra: Partial<Field> = {}): Field => ({ key, label, section, type, required: true, ...extra })
export const procedureKind: Kind = {
  id: "road-procedure", title: "Procedimientos de investigación", singular: "procedimiento de investigación", columns: ["name", "version", "methodology", "responsibleId"],
  fields: [
    f("name", "Nombre del procedimiento", "Procedimiento"), f("version", "Versión", "Procedimiento"),
    f("methodology", "Metodología", "Procedimiento", "select", { options: methodologies }),
    f("otherMethodology", "Otra metodología", "Procedimiento", "text", { showWhen: ["methodology", "Otra"] }),
    f("responsibleId", "Responsable", "Procedimiento", "reference", { reference: "people" }),
    f("scope", "Alcance: desplazamientos laborales y entorno próximo", "Procedimiento", "textarea", { wide: true }),
    f("reportProtocol", "Reporte, registro y acciones inmediatas", "Etapas de investigación", "textarea"),
    f("collectionProtocol", "Evaluación del riesgo, evidencias y recolección de hechos", "Etapas de investigación", "textarea"),
    f("analysisProtocol", "Reconstrucción, causas inmediatas y causa raíz", "Etapas de investigación", "textarea"),
    f("controlProtocol", "Fallos de control y planes de acción", "Etapas de investigación", "textarea"),
    f("lessonsProtocol", "Divulgación de lecciones aprendidas y evaluación de eficacia", "Etapas de investigación", "textarea", { wide: true }),
    f("authorityCoordination", "Coordinación con autoridades e investigación de accidentes laborales", "Coordinación y custodia", "textarea"),
    f("confidentiality", "Custodia y manejo de los soportes de la investigación", "Coordinación y custodia", "textarea"),
  ],
}
export const reportKind: Kind = {
  id: "road-case", title: "Siniestros viales", singular: "siniestro vial", columns: [],
  fields: [
    f("name", "Nombre / descripción breve del siniestro", "Reporte del evento", "text", { wide: true }),
    f("occurrenceDate", "Fecha del siniestro", "Reporte del evento", "date"), f("occurrenceTime", "Hora del siniestro", "Reporte del evento"),
    f("place", "Lugar de ocurrencia", "Reporte del evento"), f("journey", "Contexto del evento", "Reporte del evento", "select", { options: ["Desplazamiento laboral", "Entorno próximo", "In itinere"] }),
    f("peopleIds", "Colaboradores involucrados", "Relaciones con el PESV", "reference", { reference: "people", multiple: true }),
    f("routeIds", "Rutas del diagnóstico", "Relaciones con el PESV", "reference", { reference: "routes", multiple: true, required: false }),
    f("vehicleIds", "Vehículos del diagnóstico", "Relaciones con el PESV", "reference", { reference: "vehicles", multiple: true, required: false }),
    f("riskIds", "Riesgos viales relacionados", "Relaciones con el PESV", "reference", { reference: "risks", multiple: true, required: false }),
    f("emergencyPlanId", "Plan de emergencias activado", "Relaciones con el PESV", "reference", { reference: "emergencyPlans", required: false }),
    f("laborReference", "Referencia de novedad laboral / actuación de autoridad", "Relaciones con el PESV", "text", { required: false }),
    f("reporterId", "Colaborador que reporta", "Acciones inmediatas y equipo", "reference", { reference: "people" }),
    f("firstResponderId", "Primer respondiente", "Acciones inmediatas y equipo", "reference", { reference: "people" }),
    f("immediateActions", "Acciones inmediatas y reporte realizado", "Acciones inmediatas y equipo", "textarea", { wide: true }),
    f("investigatorIds", "Equipo investigador interno", "Acciones inmediatas y equipo", "reference", { reference: "people", multiple: true, required: false }),
    f("responsibleId", "Responsable de la investigación", "Acciones inmediatas y equipo", "reference", { reference: "people" }),
    f("dueDate", "Fecha prevista de cierre", "Acciones inmediatas y equipo", "date"),
  ],
}
export const stageDefinitions = [
  { key: "RISK", title: "Evaluación del riesgo", role: "Primer respondiente y equipo investigador", label: "Riesgos de la escena y controles adoptados" },
  { key: "EVIDENCE", title: "Recopilación de evidencias", role: "Primer respondiente y equipo investigador", label: "Descripción de los soportes recolectados en sitio y oficina" },
  { key: "FACTS", title: "Hechos e historia", role: "Equipo investigador", label: "Hechos, antecedentes y testimonios" },
  { key: "RECONSTRUCTION", title: "Reconstrucción del evento", role: "Equipo investigador", label: "Secuencia y reconstrucción de lo ocurrido" },
  { key: "CAUSES", title: "Causas inmediatas", role: "Equipo investigador", label: "Análisis de los factores de seguridad vial" },
  { key: "ROOT", title: "Causa raíz", role: "Equipo investigador", label: "Causa raíz y aplicación de la metodología" },
  { key: "FAILURES", title: "Fallos de control", role: "Equipo investigador", label: "Fallos de control de la organización" },
  { key: "ACTIONS", title: "Plan de acción", role: "Equipo investigador", label: "Justificación de las acciones propuestas" },
  { key: "LESSONS", title: "Lecciones aprendidas", role: "Comité de Seguridad Vial", label: "Principales lecciones aprendidas" },
] as const
export type StageKey = typeof stageDefinitions[number]["key"]
export type Stage = { id: string; key: StageKey; date: string; notes: string; details: Values; authorId: string; recordedAt: string }
export type ActionFollowUp = { id: string; date: string; progress: number; notes: string; recordedAt: string }
export type ActionEvaluation = { id: string; followUpId: string; date: string; result: "EFICAZ" | "NO_EFICAZ"; observations: string; evaluatorId: string; recordedAt: string }
export type CorrectiveAction = { id: string; type: "Correctiva" | "Preventiva" | "Mejora"; description: string; responsibleId: string; dueDate: string; workActivityId: string; followUps: ActionFollowUp[]; evaluations: ActionEvaluation[] }
export type Diffusion = { id: string; date: string; medium: string; audience: string; csvResponsibleId: string; observations: string; recordedAt: string }
export type RoadCase = {
  id: string; consecutive: string; values: Values; procedureId: string; procedureSnapshot: Values
  externalInvestigators: { id: string; name: string; organization: string }[]
  links: Record<string, Option[]>; stages: Stage[]; actions: CorrectiveAction[]; diffusions: Diffusion[]; evidence: Evidence[]
  createdAt: string; updatedAt: string; closedAt?: string
  history: { at: string; event: string; data?: unknown }[]
}
export type InvestigationStore = { procedures: RecordItem[]; cases: RoadCase[]; sequences: Record<string, number> }
export const emptyInvestigationStore = (): InvestigationStore => ({ procedures: [], cases: [], sequences: {} })
export function readInvestigations() { return readStore(ROAD_INVESTIGATIONS_KEY, emptyInvestigationStore()) }
export function actionState(action: CorrectiveAction, evidence: Evidence[]) {
  const followUp = action.followUps.at(-1)
  if (!followUp) return "Pendiente"
  const evaluation = action.evaluations.findLast(e => e.followUpId === followUp.id)
  if (evaluation) return evaluation.result === "EFICAZ" ? "Eficaz" : "Requiere ajuste"
  if (followUp.progress === 100) return evidence.some(e => e.targetId === followUp.id) ? "Pendiente de verificación" : "Pendiente de evidencia"
  return "En ejecución"
}
export function stageComplete(record: RoadCase, key: StageKey) {
  const stage = record.stages.find(s => s.key === key)
  return Boolean(stage && (key !== "EVIDENCE" || record.evidence.some(e => e.targetId === stage.id)))
}
export function nextStage(record: RoadCase) { return stageDefinitions.find(s => !stageComplete(record, s.key)) }
export function lessonsDocumented(record: RoadCase) {
  return record.diffusions.some(d => record.evidence.some(e => e.targetId === d.id))
}
export function closureAllowed(record: RoadCase) {
  return !nextStage(record) && lessonsDocumented(record) && record.actions.length > 0 && record.actions.every(a => actionState(a, record.evidence) === "Eficaz")
}
export function caseStatus(record: RoadCase) {
  if (record.closedAt) return "Cerrada"
  const next = nextStage(record)
  if (next) return record.stages.length ? `En investigación · ${next.title}` : "Reportado"
  if (!lessonsDocumented(record)) return "Pendiente de divulgación documentada"
  return record.actions.some(a => actionState(a, record.evidence) === "Requiere ajuste") ? "Acciones por ajustar" : "Pendiente de verificación de eficacia"
}
export function closeIfReady(record: RoadCase): RoadCase {
  if (record.closedAt || !closureAllowed(record)) return record
  const at = new Date().toISOString()
  return { ...record, closedAt: at, history: [...record.history, { at, event: "Investigación cerrada: lecciones divulgadas y todas las acciones eficaces." }] }
}
export function snapshotLinks(kind: Kind, values: Values, catalogs: Catalogs, oldLinks: Record<string, Option[]> = {}) {
  return Object.fromEntries(kind.fields.filter(f => f.reference).map(f => [f.key, ids(values[f.key]).map(id => catalogs[f.reference!].find(o => o.value === id) ?? oldLinks[f.key]?.find(o => o.value === id)).filter((o): o is Option => Boolean(o))]))
}
export function validateReport(values: Values, external: RoadCase["externalInvestigators"], catalogs: Catalogs, previous?: RoadCase) {
  const error = validateRecord(reportKind, values, [], catalogs, previous ? { values: previous.values } as RecordItem : undefined)
  if (error) return error
  if (text(values.occurrenceDate) > dateToday()) return "El siniestro no puede tener una fecha futura."
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(text(values.occurrenceTime))) return "Ingresa la hora en formato HH:mm."
  if (text(values.dueDate) < text(values.occurrenceDate)) return "La fecha prevista de cierre no puede ser anterior al siniestro."
  if (!ids(values.investigatorIds).length && !external.length) return "Agrega al menos una persona al equipo investigador."
  if (external.some(p => !p.name.trim() || !p.organization.trim())) return "Completa el nombre y organización de cada investigador externo."
  return null
}
export function validateStage(record: RoadCase, stage: Stage, actions: CorrectiveAction[]) {
  const next = nextStage(record)
  const previous = record.stages.find(s => s.key === stage.key)
  if (!previous && stage.key !== next?.key) return "Completa primero la etapa anterior."
  if (!stage.notes.trim() || !stage.authorId) return "Registra el análisis y el responsable de la etapa."
  const lastDate = previous?.date ?? record.stages.at(-1)?.date ?? text(record.values.occurrenceDate)
  if (stage.date < lastDate || stage.date > dateToday()) return "La fecha de la etapa debe ser posterior al registro anterior y no puede estar en el futuro."
  if (stage.key === "CAUSES" && !["human", "vehicle", "infrastructure", "environment", "organization"].some(k => text(stage.details[k]).trim())) return "Registra al menos un factor con causa inmediata identificada."
  if (stage.key === "ROOT" && (!text(stage.details.methodology) || !text(stage.details.analysis).trim())) return "Registra la metodología y el análisis de causa raíz."
  if (stage.key === "LESSONS" && (!text(stage.details.recommendations).trim() || !text(stage.details.whatHappened).trim())) return "Completa lo ocurrido y las conclusiones / recomendaciones."
  if (stage.key === "ACTIONS") {
    if (!actions.length) return "Agrega al menos una acción al plan."
    if (actions.some(a => !a.description.trim() || !a.responsibleId || !a.dueDate || (!record.actions.some(saved => saved.id === a.id) && a.dueDate < stage.date))) return "Completa la descripción, responsable y plazo de las acciones. El plazo no puede ser anterior a la etapa."
  }
  return null
}
export function validateFollowUp(record: RoadCase, action: CorrectiveAction, date: string, progress: number, notes: string) {
  const last = action.followUps.at(-1)
  const evaluation = action.evaluations.at(-1)
  const minimumDate = evaluation?.date ?? last?.date ?? record.stages.find(s => s.key === "ACTIONS")?.date ?? text(record.values.occurrenceDate)
  if (record.closedAt || actionState(action, record.evidence) === "Eficaz") return "La acción ya fue evaluada como eficaz."
  if (date < minimumDate || date > dateToday()) return "La fecha debe ser posterior al seguimiento o evaluación anterior y no puede estar en el futuro."
  if (!Number.isFinite(progress) || progress < 0 || progress > 100 || !notes.trim()) return "Registra un avance entre 0 y 100 y las observaciones."
  return null
}
export function validateEvaluation(record: RoadCase, action: CorrectiveAction, date: string, evaluatorId: string, notes: string) {
  const followUp = action.followUps.at(-1)
  if (record.closedAt || !followUp || actionState(action, record.evidence) !== "Pendiente de verificación") return "La acción requiere un seguimiento al 100% con evidencia antes de evaluar su eficacia."
  if (!lessonsDocumented(record)) return "Documenta la divulgación de lecciones aprendidas antes de la evaluación final de eficacia."
  if (date < followUp.date || date > dateToday()) return "La fecha de evaluación no puede ser anterior al seguimiento ni estar en el futuro."
  if (!evaluatorId || !notes.trim()) return "Selecciona el evaluador y registra su conclusión."
  return null
}
export function demoInvestigations(catalogs: Catalogs): InvestigationStore {
  const at = new Date().toISOString()
  const person = catalogs.people[0]?.value ?? ""
  const procedureValues: Values = {
    name: "Procedimiento de investigación interna de siniestros viales", version: "1.0", methodology: "Árbol de causas", responsibleId: person,
    scope: "Siniestros de colaboradores en desplazamientos laborales y en el entorno próximo de la organización.",
    reportProtocol: "Registrar el evento, acciones inmediatas y responsables del reporte.", collectionProtocol: "Evaluar la escena y conservar soportes y testimonios.",
    analysisProtocol: "Reconstruir el evento; identificar causas por factor y analizar la causa raíz.", controlProtocol: "Identificar fallos de control y definir acciones con responsable y plazo.",
    lessonsProtocol: "Comunicar las lecciones mediante el CSV y evaluar la eficacia de las acciones por el líder PESV.",
    authorityCoordination: "Registrar actuaciones de autoridades y relacionar la investigación laboral cuando aplique. La investigación interna no sustituye la de las autoridades.",
    confidentiality: "Acceso limitado al equipo investigador; conservación de soportes e historial.",
  }
  const procedure: RecordItem = { id: "pesv-road-procedure-demo", kind: procedureKind.id, values: procedureValues, activities: [], entries: [], evidence: [], links: snapshotLinks(procedureKind, procedureValues, catalogs), createdAt: at, updatedAt: at, history: [{ at, action: "Procedimiento de demostración registrado", snapshot: procedureValues }] }
  const values: Values = { ...initialValues(reportKind), name: "Colisión leve durante recorrido urbano", occurrenceDate: dateToday(), occurrenceTime: "09:00", place: "Cruce urbano de la ruta operativa", journey: "Desplazamiento laboral", peopleIds: [person], reporterId: person, firstResponderId: person, responsibleId: person, investigatorIds: catalogs.people.slice(0, 2).map(p => p.value), immediateActions: "Se registró el siniestro y se activó la cadena interna de reporte.", dueDate: dateToday(), routeIds: catalogs.routes.slice(0, 1).map(r => r.value), vehicleIds: catalogs.vehicles.slice(0, 1).map(v => v.value), riskIds: catalogs.risks.slice(0, 1).map(r => r.value), emergencyPlanId: catalogs.emergencyPlans[0]?.value ?? "" }
  const record: RoadCase = { id: "pesv-road-case-demo", consecutive: `SV-${dateToday().slice(0, 4)}-001`, values, procedureId: procedure.id, procedureSnapshot: structuredClone(procedureValues), externalInvestigators: [], links: snapshotLinks(reportKind, values, catalogs), stages: [], actions: [], diffusions: [], evidence: [], createdAt: at, updatedAt: at, history: [{ at, event: "Reporte de demostración creado", data: values }] }
  return { procedures: [procedure], cases: [record], sequences: { [dateToday().slice(0, 4)]: 1 } }
}
