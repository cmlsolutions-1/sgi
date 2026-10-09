import type { Catalogs, Field, Kind, ModuleConfig, RecordItem, Values } from "./planning"
import { pesvSteps, stepApplies } from "./standards"

export type AssuranceModule = "statistics" | "audits" | "improvement" | "communications"
const f = (key: string, label: string, section: string, type: Field["type"] = "text", extra: Partial<Field> = {}): Field => ({ key, label, section, type, required: true, ...extra })
const ny = (section: string) => [f("name", "Nombre", section), f("year", "Vigencia", section, "year")]
const prose = (key: string, label: string, section: string, required = true) => f(key, label, section, "textarea", { required, wide: true })
const ref = (key: string, label: string, section: string, reference: Field["reference"], multiple = false, required = true) => f(key, label, section, "reference", { reference, multiple, required })
const person = (section: string) => ref("responsibleId", "Responsable", section, "people")
const levels = ["Bajo", "Medio", "Grave", "Crítico"]
export const personLosses = ["Solo daños materiales", "Primeros auxilios", "Heridos leves (hasta 30 días)", "Heridos graves (más de 30 días)", "Fatalidades"]
const quarters = ["1", "2", "3", "4"]
const media = ["WhatsApp", "Correo", "Buzón", "Formulario", "Verbal", "Reunión", "Cartelera", "Otro"]
export const assuranceCatalogKinds = { "loss-matrix": "lossMatrices", "audit-procedure": "auditProcedures", "pesv-audit": "pesvAudits", "audit-finding": "auditFindings", "communication-mechanism": "communicationMechanisms" } as const
export const assuranceConfigs: Record<AssuranceModule, ModuleConfig> = {
  statistics: { title: "Registro y análisis estadístico de siniestros viales", subtitle: "Paso 21 · Registro por contexto, gravedad y nivel de pérdida", kinds: [
    { id: "statistical-event", title: "Registro de siniestros", singular: "registro estadístico", columns: ["name", "eventDate", "journey", "personLoss", "lossLevel"], fields: [
      ...ny("Identificación"), ref("investigationId", "Investigación relacionada", "Identificación", "roadInvestigations", false, false), f("eventDate", "Fecha del siniestro", "Identificación", "date"), f("place", "Lugar / tramo / punto de ocurrencia", "Identificación"),
      f("journey", "Contexto del desplazamiento", "Identificación", "select", { options: ["Laboral", "Cotidiano / no laboral"] }), f("relationship", "Vinculación de involucrados", "Identificación", "select", { options: ["Colaboradores", "Contratistas", "Terceros", "Mixto"] }), ref("peopleIds", "Colaboradores involucrados", "Identificación", "people", true, false),
      ref("matrixId", "Matriz de nivel de pérdida", "Clasificación", "lossMatrices"), f("personLoss", "Afectación a personas", "Clasificación", "select", { options: personLosses }),
      ...[ ["fatalities", "Personas fallecidas"], ["severeInjuries", "Lesionados con más de 30 días de incapacidad"], ["lightInjuries", "Lesionados con hasta 30 días de incapacidad"], ["firstAid", "Personas que requirieron primeros auxilios"] ].map(([key, label]) => f(key, label, "Clasificación", "number", { min: 0 })),
      f("directCosts", "Costos directos (COP)", "Clasificación", "money", { min: 0 }), f("indirectCosts", "Costos indirectos (COP)", "Clasificación", "money", { min: 0 }),
      f("imageImpact", "Afectación a la imagen", "Otras dimensiones", "select", { options: levels }), f("sanctionsImpact", "Investigaciones / sanciones", "Otras dimensiones", "select", { options: levels }), f("damageImpact", "Daños y consecuencias", "Otras dimensiones", "select", { options: levels }), f("environmentImpact", "Afectación ambiental", "Otras dimensiones", "select", { options: levels }),
      prose("impactDetails", "Descripción de las afectaciones y soportes", "Otras dimensiones"), f("lossLevel", "Nivel de pérdida calculado", "Resultado", "text", { readOnly: true }), f("matrixSnapshot", "Criterios de la matriz utilizada", "Resultado", "textarea", { readOnly: true, required: false, wide: true }),
      prose("description", "Hechos y consecuencias", "Análisis causal"), prose("immediateCauses", "Causas inmediatas", "Análisis causal"), prose("rootCauses", "Causas raíz / hipótesis por verificar", "Análisis causal"), person("Registro"), prose("source", "Fuente y referencia del registro", "Registro"),
    ] },
    { id: "statistical-analysis", title: "Análisis y conclusiones", singular: "análisis estadístico", columns: ["name", "year", "periodEnd", "responsibleId"], fields: [
      ...ny("Período"), f("periodStart", "Inicio del período", "Período", "date"), f("periodEnd", "Fin del período", "Período", "date"), f("analysisDate", "Fecha de análisis", "Período", "date"),
      person("Responsables"), ref("reviewerIds", "Miembros del CSV / revisores", "Responsables", "people", true), prose("baseline", "Línea base y fuente histórica", "Evaluación"), f("tolerableMaximum", "Límite máximo tolerable de siniestros", "Evaluación", "number", { min: 0 }),
      prose("trend", "Tendencias y comparación con períodos equivalentes", "Evaluación"), prose("spatialTemporal", "Patrones por lugar, fecha y horario", "Evaluación"), prose("causes", "Factores, causas inmediatas y causas raíz", "Evaluación"),
      prose("projection", "Proyección realista, método y supuestos", "Decisiones"), prose("conclusions", "Conclusiones del análisis", "Decisiones"), prose("actions", "Decisiones, recursos y acciones preventivas", "Decisiones"), ref("workActivityIds", "Acciones del plan anual", "Decisiones", "workActivities", true, false), ref("trainingIds", "Formación relacionada", "Decisiones", "trainingActivities", true, false),
      f("statisticsSnapshot", "Registro estadístico al momento del análisis", "Corte guardado", "textarea", { readOnly: true, required: false, wide: true }),
    ] },
    { id: "loss-matrix", title: "Matriz de pérdida", singular: "matriz de pérdida", columns: ["name", "version", "year", "responsibleId"], fields: [
      ...ny("Matriz"), f("version", "Versión", "Matriz"), person("Matriz"),
      f("lowCostMax", "Límite de costos bajo (COP)", "Afectación en costos", "money", { min: 0 }), f("mediumCostMax", "Límite de costos medio (COP)", "Afectación en costos", "money", { min: 0 }), f("severeCostMax", "Límite de costos grave (COP)", "Afectación en costos", "money", { min: 0 }),
      prose("personsCriteria", "Criterios de afectación a personas", "Criterios de pérdida"), prose("imageCriteria", "Criterios de imagen: bajo, medio, grave y crítico", "Criterios de pérdida"), prose("sanctionsCriteria", "Criterios de investigaciones y sanciones", "Criterios de pérdida"), prose("damageCriteria", "Criterios de daños y consecuencias", "Criterios de pérdida"), prose("environmentCriteria", "Criterios ambientales", "Criterios de pérdida"), prose("method", "Método de clasificación y validación", "Criterios de pérdida"),
    ] },
  ] },
  audits: { title: "Auditoría anual PESV", subtitle: "Paso 22 · Procedimiento, evaluación de los 24 pasos y planes de acción", kinds: [
    { id: "audit-procedure", title: "Procedimiento", singular: "procedimiento de auditoría", columns: ["name", "version", "responsibleId"], fields: [
      ...ny("Procedimiento"), f("version", "Versión", "Procedimiento"), person("Procedimiento"), prose("planning", "Planificación, frecuencia anual y participación del CSV", "Auditoría"), prose("guidelines", "Pautas, criterios, muestreo y realización", "Auditoría"), prose("competency", "Competencias e independencia de los auditores", "Auditoría"), ref("competencyIds", "Perfiles de competencia relacionados", "Auditoría", "competencies", true, false), prose("reportContents", "Contenidos mínimos del informe", "Informe y seguimiento"), prose("followUp", "Gestión de no conformidades y planes de acción", "Informe y seguimiento"),
    ] },
    { id: "pesv-audit", title: "Auditorías", singular: "auditoría anual", columns: ["name", "year", "plannedDate", "auditDate", "phase"], fields: [
      ...ny("Planificación"), ref("procedureId", "Procedimiento de auditoría", "Planificación", "auditProcedures"), f("level", "Nivel del PESV", "Planificación", "select", { options: ["Básico", "Estándar", "Avanzado"] }), f("plannedDate", "Fecha programada", "Planificación", "date"), f("phase", "Fase de auditoría", "Planificación", "select", { options: ["Planificada", "Realizada"] }), f("auditDate", "Fecha de realización", "Planificación", "date", { showWhen: ["phase", "Realizada"] }),
      ref("auditorIds", "Auditores internos / externos", "Equipo", "people", true), prose("auditorCompetence", "Competencia e independencia del equipo auditor", "Equipo"), prose("csvParticipation", "Participación del CSV en la planificación", "Equipo"), person("Equipo"), prose("scope", "Alcance, criterios, procesos y requisitos aplicables", "Plan de auditoría"), prose("schedule", "Agenda, metodología y muestra", "Plan de auditoría"),
      ...pesvSteps.flatMap((name, i) => [f(`step_${i + 1}`, `${i + 1}. ${name}`, "Evaluación de los 24 pasos", "select", { options: ["Sin evaluar", "Cumple", "No cumple", "No aplica"] }), prose(`stepNotes_${i + 1}`, `Soporte / hallazgo / justificación del paso ${i + 1}`, "Evaluación de los 24 pasos", false)]),
      prose("conclusions", "Conclusiones, fortalezas y oportunidades de mejora", "Informe", false), prose("reportReference", "Referencia del informe de auditoría", "Informe", false),
    ] },
    { id: "audit-finding", title: "Hallazgos y planes de acción", singular: "hallazgo de auditoría", tracking: true, columns: ["name", "auditId", "step", "responsibleId", "endDate"], fields: [
      ...ny("Hallazgo"), ref("auditId", "Auditoría relacionada", "Hallazgo", "pesvAudits"), f("step", "Paso PESV evaluado", "Hallazgo", "select", { options: pesvSteps.map((name, i) => `${i + 1}. ${name}`) }), f("findingType", "Tipo de hallazgo", "Hallazgo", "select", { options: ["No conformidad", "Oportunidad de mejora", "Observación"] }), prose("description", "Requisito y evidencia del hallazgo", "Hallazgo"), prose("causes", "Análisis de causas", "Plan de acción"), prose("action", "Acción correctiva / preventiva / mejora", "Plan de acción"), person("Plan de acción"), f("startDate", "Inicio del plan de acción", "Plan de acción", "date"), f("endDate", "Fecha límite del plan de acción", "Plan de acción", "date"), ref("workActivityId", "Actividad del plan anual", "Plan de acción", "workActivities", false, false),
      f("efficacy", "Resultado de verificación de eficacia", "Verificación", "select", { options: ["Pendiente", "Eficaz", "No eficaz"] }), ref("evaluatorId", "Evaluador de eficacia", "Verificación", "people", false, false), f("verificationDate", "Fecha de verificación", "Verificación", "date", { required: false }), prose("verificationNotes", "Conclusión de la verificación", "Verificación", false),
    ] },
  ] },
  improvement: { title: "Mejora continua · Formato ACPM PESV", subtitle: "Paso 23 · Acciones correctivas, preventivas y de mejora", kinds: [
    { id: "pesv-acpm-format", title: "Formatos ACPM", singular: "formato ACPM", columns: ["consecutive", "name", "type", "origin", "responsibleId", "endDate"], fields: [
      f("consecutive", "Consecutivo", "Identificación", "text", { readOnly: true }), ...ny("Identificación"), f("documentDate", "Fecha del documento", "Identificación", "date"), f("type", "Tipo de acción", "Identificación", "select", { options: ["Correctiva", "Preventiva", "Mejora"] }), f("origin", "Origen", "Identificación", "select", { options: ["Auditoría", "Investigación", "Indicadores", "Inspección", "Verificación", "Otro"] }), ref("findingId", "Hallazgo de auditoría relacionado", "Origen y situación", "auditFindings", false, false), ref("investigationId", "Investigación relacionada", "Origen y situación", "roadInvestigations", false, false), prose("source", "Documento / referencia de origen", "Origen y situación"), prose("description", "No conformidad / situación que requiere mejora", "Origen y situación"), prose("causes", "Análisis de causas", "Acciones"), prose("action", "Acción propuesta", "Acciones"), person("Acciones"), f("startDate", "Inicio previsto", "Acciones", "date"), f("endDate", "Fecha límite", "Acciones", "date"), prose("resources", "Recursos y entregable esperado", "Acciones"), prose("verification", "Criterios para verificar cumplimiento y eficacia", "Verificación"), f("approver", "Nombre / cargo de quien aprueba", "Verificación"),
    ] },
  ] },
  communications: { title: "Mecanismos de comunicación y participación PESV", subtitle: "Paso 24 · Comunicaciones trimestrales y retroalimentación", kinds: [
    { id: "communication-mechanism", title: "Mecanismos", singular: "mecanismo de comunicación", columns: ["name", "medium", "frequency", "responsibleId"], fields: [
      ...ny("Mecanismo"), f("medium", "Medio", "Mecanismo", "select", { options: media }), f("otherMedium", "Otro medio", "Mecanismo", "text", { showWhen: ["medium", "Otro"] }), f("type", "Tipo", "Mecanismo", "select", { options: ["Interno", "Externo", "Mixto"] }), f("frequency", "Frecuencia mínima", "Mecanismo", "select", { options: ["Mensual", "Trimestral"] }), person("Responsabilidad"), f("audience", "Destinatarios y niveles de la organización", "Responsabilidad"), prose("participation", "Cómo recibir propuestas y retroalimentación", "Participación"), prose("responseProcedure", "Recepción, respuesta y responsables", "Participación"), prose("safeHabits", "Promoción de hábitos y comportamientos seguros", "Participación"),
    ] },
    { id: "pesv-communication", title: "Comunicaciones trimestrales", singular: "comunicación PESV", columns: ["name", "quarter", "communicationDate", "mechanismId", "responsibleId"], fields: [
      ...ny("Comunicación"), f("quarter", "Trimestre", "Comunicación", "select", { options: quarters }), f("communicationDate", "Fecha de comunicación", "Comunicación", "date"), ref("mechanismId", "Mecanismo utilizado", "Comunicación", "communicationMechanisms"), person("Comunicación"), f("audience", "Destinatarios y alcance de la difusión", "Contenido"), prose("promotion", "Promoción de la seguridad vial y hábitos seguros", "Contenido"), prose("indicators", "Indicadores y resultados comunicados", "Contenido"), prose("implementation", "Resultados de implementación del PESV", "Contenido"), prose("risksControls", "Riesgos y controles adoptados", "Contenido"), prose("lessons", "Lecciones aprendidas", "Contenido", false), ref("investigationIds", "Investigaciones / lecciones relacionadas", "Relaciones", "roadInvestigations", true, false), ref("riskIds", "Riesgos relacionados", "Relaciones", "risks", true, false), prose("feedback", "Retroalimentación recibida y decisiones", "Participación", false),
    ] },
    { id: "pesv-feedback", title: "Participación y respuestas", singular: "comunicación recibida", columns: ["name", "receivedDate", "type", "responsibleId", "responseDate"], fields: [
      ...ny("Recepción"), f("receivedDate", "Fecha de recepción", "Recepción", "date"), f("type", "Tipo de comunicación", "Recepción", "select", { options: ["Propuesta de mejora", "Consulta interna", "Comunicación externa", "Reporte de riesgo"] }), f("sender", "Remitente / organización", "Recepción"), ref("mechanismId", "Canal de recepción", "Recepción", "communicationMechanisms"), prose("description", "Contenido de la comunicación recibida", "Recepción"), person("Gestión"), f("endDate", "Fecha límite de respuesta", "Gestión", "date"), f("responseDate", "Fecha de respuesta", "Respuesta", "date", { required: false }), prose("response", "Respuesta y decisiones adoptadas", "Respuesta", false),
    ] },
  ] },
}
const value = (v: string | string[] | undefined) => typeof v === "string" ? v : (v ?? []).join(", ")
function read<T>(key: string, fallback: T): T { if (typeof window === "undefined") return fallback; try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback } catch { return fallback } }
export function storedAssurance(module: AssuranceModule) { return read<RecordItem[]>(`safecloud:pesv-${module}`, []) }
export function lossClassification(values: Values, matrix: Values) {
  const costs = Number(values.directCosts || 0) + Number(values.indirectCosts || 0)
  const person = Math.max(0, personLosses.indexOf(value(values.personLoss)) - 1)
  const cost = costs <= Number(matrix.lowCostMax) ? 0 : costs <= Number(matrix.mediumCostMax) ? 1 : costs <= Number(matrix.severeCostMax) ? 2 : 3
  return levels[Math.max(person, cost, ...["imageImpact", "sanctionsImpact", "damageImpact", "environmentImpact"].map(key => Math.max(0, levels.indexOf(value(values[key])))))]
}
export function statisticalSummary(items: RecordItem[], start: string, end: string) {
  const selected = items.filter(i => i.kind === "statistical-event" && value(i.values.eventDate) >= start && value(i.values.eventDate) <= end)
  return ["Laboral", "Cotidiano / no laboral"].flatMap(journey => levels.map(level => {
    const group = selected.filter(i => i.values.journey === journey && i.values.lossLevel === level)
    return { journey, level, events: group.length, fatalities: group.reduce((n, i) => n + Number(i.values.fatalities || 0), 0), injured: group.reduce((n, i) => n + Number(i.values.severeInjuries || 0) + Number(i.values.lightInjuries || 0), 0), costs: group.reduce((n, i) => n + Number(i.values.directCosts || 0) + Number(i.values.indirectCosts || 0), 0) }
  }))
}
export function auditComplete(values: Values) {
  return values.phase === "Realizada" && Boolean(value(values.auditDate)) && Boolean(value(values.conclusions).trim()) && pesvSteps.every((_, i) => ["Cumple", "No cumple", "No aplica"].includes(value(values[`step_${i + 1}`])) && Boolean(value(values[`stepNotes_${i + 1}`]).trim()) && (stepApplies(i + 1, value(values.level)) || values[`step_${i + 1}`] === "No aplica"))
}
export function documentedAudit(item: RecordItem) { return item.kind === "pesv-audit" && auditComplete(item.values) && item.evidence.some(e => !e.targetId && e.mime === "application/pdf") }
export function completedFinding(item: RecordItem) {
  const last = item.entries.filter(e => e.kind === "FOLLOW_UP").at(-1)
  return Boolean(last?.progress === 100 && item.evidence.some(e => e.targetId === last.id) && item.values.efficacy === "Eficaz" && value(item.values.verificationDate) >= last.date && value(item.values.verificationToken) && item.evidence.some(e => e.targetId === `VERIFICATION:${value(item.values.verificationToken)}`))
}
export function assuranceStatus(item: RecordItem, today: string): string | null {
  if (item.kind === "pesv-audit") return item.values.phase === "Planificada" ? "Planificada" : !auditComplete(item.values) ? "Evaluación incompleta" : documentedAudit(item) ? "Auditada · informe disponible" : "Pendiente de informe PDF"
  if (item.kind === "audit-finding") { const last = item.entries.filter(e => e.kind === "FOLLOW_UP").at(-1); return completedFinding(item) ? "Cerrada · eficaz" : item.values.efficacy === "No eficaz" ? "Requiere ajuste" : last?.progress === 100 ? "Pendiente de verificación documentada" : last ? "En ejecución" : "Abierta" }
  if (item.kind === "pesv-feedback") return value(item.values.responseDate) && value(item.values.response).trim() ? item.evidence.some(e => e.targetId === "RESPONSE") ? "Respondida" : "Pendiente de evidencia de respuesta" : value(item.values.endDate) < today ? "Respuesta vencida" : "Pendiente de respuesta"
  if (item.kind === "pesv-acpm-format") return item.evidence.length ? "Formato con soporte" : "Formato generado"
  if (["statistical-event", "statistical-analysis", "loss-matrix", "audit-procedure", "communication-mechanism", "pesv-communication"].includes(item.kind)) return item.evidence.length ? "Documentado" : "Pendiente de evidencia"
  return null
}
export function communicationCoverage(items: RecordItem[], year: string, today: string) {
  return quarters.map(q => {
    const end = `${year}-${["03-31", "06-30", "09-30", "12-31"][Number(q) - 1]}`
    const records = items.filter(i => i.kind === "pesv-communication" && i.values.year === year && i.values.quarter === q)
    return { quarter: q, count: records.length, status: records.some(i => i.evidence.some(e => !e.targetId)) ? "Documentada" : records.length ? "Pendiente de evidencia" : end < today ? "Trimestre sin comunicación" : "Por programar" }
  })
}
export function deriveAssurance(kind: string, values: Values, items: RecordItem[]): Values {
  if (kind === "statistical-event") {
    const matrix = items.find(i => i.id === values.matrixId && i.kind === "loss-matrix")
    return { ...values, lossLevel: matrix ? lossClassification(values, matrix.values) : "Pendiente de matriz", matrixSnapshot: matrix ? `${value(matrix.values.name)} · v${value(matrix.values.version)}\nCostos: bajo hasta $${Number(matrix.values.lowCostMax).toLocaleString("es-CO")}; medio hasta $${Number(matrix.values.mediumCostMax).toLocaleString("es-CO")}; grave hasta $${Number(matrix.values.severeCostMax).toLocaleString("es-CO")}; crítico por encima.\n${["personsCriteria", "imageCriteria", "sanctionsCriteria", "damageCriteria", "environmentCriteria", "method"].map(k => value(matrix.values[k])).join("\n")}` : "" }
  }
  if (kind === "statistical-analysis") {
    const records = items.filter(i => i.kind === "statistical-event" && value(i.values.eventDate) >= value(values.periodStart) && value(i.values.eventDate) <= value(values.periodEnd))
    const summary = statisticalSummary(items, value(values.periodStart), value(values.periodEnd))
    return { ...values, statisticsSnapshot: `Corte ${value(values.periodStart)} a ${value(values.periodEnd)}\n${summary.map(r => `${r.journey} · ${r.level}: ${r.events} siniestros, ${r.fatalities} fallecidos, ${r.injured} lesionados, costos $${r.costs.toLocaleString("es-CO")}`).join("\n")}\n\nRegistros incluidos (${records.length}):\n${records.map(i => `${value(i.values.name)} [${i.id}] · ${value(i.values.eventDate)} · ${value(i.values.place)} · ${value(i.values.journey)} · ${value(i.values.personLoss)} · ${value(i.values.lossLevel)} · Costos directos $${value(i.values.directCosts)}, indirectos $${value(i.values.indirectCosts)}\nCausas inmediatas: ${value(i.values.immediateCauses)}\nCausas raíz: ${value(i.values.rootCauses)}`).join("\n\n") || "Sin registros dentro del período."}` }
  }
  if (kind === "pesv-acpm-format" && !value(values.consecutive).startsWith(`ACPM-PESV-${value(values.year)}-`)) {
    const max = Math.max(0, ...items.filter(i => i.values.year === values.year).flatMap(i => [value(i.values.consecutive), ...i.history.map(h => value(h.snapshot?.consecutive))]).map(c => Number(c.split("-").at(-1)) || 0))
    return { ...values, consecutive: `ACPM-PESV-${value(values.year)}-${String(max + 1).padStart(3, "0")}` }
  }
  return values
}
export function investigationDefaults(id: string): Values {
  const source = read<{ cases: { id: string; values: Values; stages: { key: string; notes: string }[] }[] }>("safecloud:pesv-road-investigations", { cases: [] }).cases.find(i => i.id === id)
  if (!source) return {}
  return { name: value(source.values.name), eventDate: value(source.values.occurrenceDate), year: value(source.values.occurrenceDate).slice(0, 4), place: value(source.values.place), peopleIds: source.values.peopleIds ?? [], source: `Investigación interna: ${value(source.values.name)}`, immediateCauses: source.stages.find(s => s.key === "CAUSES")?.notes ?? "", rootCauses: source.stages.find(s => s.key === "ROOT")?.notes ?? "" }
}
export function validateAssurance(kind: Kind, values: Values, previous: RecordItem | undefined, today: string) {
  if (kind.id === "pesv-acpm-format" && previous && ["year", "documentDate", "startDate", "endDate", "consecutive"].some(key => value(previous.values[key]) !== value(values[key]))) return "Conserva el consecutivo y las fechas del formato creado."
  const pastDates = ["eventDate", "analysisDate", "auditDate", "documentDate", "communicationDate", "receivedDate", "responseDate", "verificationDate"]
  if (pastDates.some(k => value(values[k]) && value(values[k]) > today)) return "Las fechas de registros realizados no pueden estar en el futuro."
  if (["eventDate", "auditDate", "plannedDate", "documentDate", "communicationDate", "receivedDate"].some(k => value(values[k]) && value(values[k]).slice(0, 4) !== value(values.year))) return "La fecha del registro debe pertenecer a la vigencia seleccionada."
  if (kind.id === "loss-matrix" && !(Number(values.lowCostMax) < Number(values.mediumCostMax) && Number(values.mediumCostMax) < Number(values.severeCostMax))) return "Los límites de costos deben aumentar: bajo, medio y grave."
  if (kind.id === "statistical-event") {
    if (["fatalities", "severeInjuries", "lightInjuries", "firstAid"].some(k => !Number.isInteger(Number(values[k])) || Number(values[k]) < 0)) return "Las cantidades de personas deben ser enteras y no negativas."
    const category = Number(values.fatalities) > 0 ? personLosses[4] : Number(values.severeInjuries) > 0 ? personLosses[3] : Number(values.lightInjuries) > 0 ? personLosses[2] : Number(values.firstAid) > 0 ? personLosses[1] : personLosses[0]
    if (values.personLoss !== category) return "La afectación a personas debe corresponder a la consecuencia más grave registrada."
  }
  if (kind.id === "statistical-analysis" && (value(values.periodEnd) > value(values.analysisDate) || value(values.periodStart).slice(0, 4) !== value(values.year) || value(values.periodEnd).slice(0, 4) !== value(values.year))) return "El período debe estar en la vigencia y finalizar antes del análisis."
  if (kind.id === "pesv-audit") {
    const leader = read<{ employeeId: string } | null>("safecloud:pesv-responsible", null)
    if (leader && Array.isArray(values.auditorIds) && values.auditorIds.includes(leader.employeeId)) return "El auditor debe ser diferente al líder del PESV."
    if (pesvSteps.some((_, i) => values[`step_${i + 1}`] === "No aplica" && stepApplies(i + 1, value(values.level)))) return "No marques como No aplica un paso exigible para el nivel seleccionado."
    if (values.phase === "Realizada" && !auditComplete(values)) return "Completa los 24 pasos, soportes y conclusiones; justifica los no aplicables según el nivel."
  }
  if (kind.id === "audit-finding" && values.efficacy !== "Pendiente") {
    const last = previous?.entries.filter(e => e.kind === "FOLLOW_UP").at(-1)
    if (!last || last.progress !== 100 || !previous?.evidence.some(e => e.targetId === last.id)) return "Registra un seguimiento al 100% con evidencia antes de verificar su eficacia."
    if (!value(values.evaluatorId) || !value(values.verificationNotes).trim() || value(values.verificationDate) < last.date) return "Registra evaluador, conclusión y fecha posterior al seguimiento."
  }
  if (kind.id === "pesv-communication" && Math.ceil(Number(value(values.communicationDate).slice(5, 7)) / 3) !== Number(values.quarter)) return "El trimestre debe coincidir con la fecha de comunicación."
  if (kind.id === "pesv-feedback" && (value(values.endDate) < value(values.receivedDate) || (value(values.responseDate) && (value(values.responseDate) < value(values.receivedDate) || !value(values.response).trim())) || (value(values.response).trim() && !value(values.responseDate)))) return "Revisa el plazo y registra conjuntamente la fecha y el contenido de la respuesta."
  return null
}
export function assuranceDemo(kind: Kind, catalogs: Catalogs, today: string): Values {
  const values: Values = { name: `Ejemplo · ${kind.singular}`, year: today.slice(0, 4) }
  for (const field of kind.fields) {
    if (field.readOnly) continue
    if (field.reference) values[field.key] = field.multiple ? catalogs[field.reference].slice(0, 1).map(o => o.value) : catalogs[field.reference][0]?.value ?? ""
    else if (field.type === "number" || field.type === "money") values[field.key] = "0"
    else if (field.type === "date") values[field.key] = field.required ? today : ""
    else if (field.type === "select") values[field.key] = field.options?.[0] ?? ""
    else if (field.required && !values[field.key]) values[field.key] = `Ejemplo de ${field.label.toLowerCase()}; pendiente de validación por la organización.`
  }
  if (kind.id === "loss-matrix") Object.assign(values, { version: "1.0", lowCostMax: "1000000", mediumCostMax: "10000000", severeCostMax: "100000000", personsCriteria: "Bajo: primeros auxilios o solo daños; medio: incapacidad hasta 30 días; grave: más de 30 días; crítico: fatalidad.", imageCriteria: "Bajo: entorno de la empresa; medio: medios locales; grave: nacionales; crítico: internacionales.", sanctionsCriteria: "Bajo: quejas; medio: investigaciones bajas; grave: medias; crítico: críticas.", damageCriteria: "Bajo: choque simple; medio: salida de vía; grave: semivolcamiento; crítico: volcamiento.", environmentCriteria: "Bajo: derrames; medio: afectación leve; grave: media; crítico: severa.", method: "Referencia configurable de la organización. Se toma el mayor nivel entre las seis dimensiones; registrar la justificación." })
  if (kind.id === "statistical-event") Object.assign(values, { lossLevel: "Bajo", matrixSnapshot: "Ejemplo de clasificación por matriz de referencia", personLoss: personLosses[0] })
  if (kind.id === "statistical-analysis") Object.assign(values, { periodStart: `${today.slice(0, 4)}-01-01`, periodEnd: today })
  if (kind.id === "pesv-acpm-format") values.consecutive = `ACPM-PESV-${today.slice(0, 4)}-001`
  if (kind.id === "pesv-communication") values.quarter = String(Math.ceil(Number(today.slice(5, 7)) / 3))
  if (kind.id === "pesv-audit") {
    const leader = read<{ employeeId: string } | null>("safecloud:pesv-responsible", null)
    values.auditorIds = catalogs.people.filter(p => p.value !== leader?.employeeId).slice(0, 1).map(p => p.value)
  }
  return values
}
export function latestAnnualAudit(year: string) {
  return storedAssurance("audits").filter(i => i.values.year === year && documentedAudit(i)).sort((a, b) => value(a.values.auditDate).localeCompare(value(b.values.auditDate))).at(-1)
}
