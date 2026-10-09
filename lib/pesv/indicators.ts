import { currentYear, dateToday, ids, loadCatalogs, readItems, readStore, text, type Evidence, type Field, type Kind, type RecordItem, type Values } from "./planning"
import { completedFinding, latestAnnualAudit, storedAssurance } from "./assurance"
import { pesvSteps } from "./standards"

export const INDICATORS_KEY = "safecloud:pesv-indicators"
export const methodologySource = "https://www.cancilleria.gov.co/normograma/compilacion/docs/resolucion_mintransporte_40595_2022.htm"
export type Level = "Básico" | "Estándar" | "Avanzado"
export type Frequency = "Mensual" | "Trimestral" | "Anual"
export type Formula = "RATE" | "COST" | "DIFFERENCE" | "PERCENTAGE"
export const losses = ["Fatalidades", "Heridos graves (más de 30 días)", "Heridos leves (hasta 30 días)", "Choques simples"]
export type IndicatorDefinition = {
  id: string; code: string; name: string; description: string; frequency: Frequency; levels: Level[]
  direction: "Aumentar" | "Reducir"; unit: string; formula: Formula; numerator: string; denominator: string
  sources: string; href: string; loss?: boolean; cumulativeCoverage?: boolean
}
const all: Level[] = ["Básico", "Estándar", "Avanzado"]
const higher: Level[] = ["Estándar", "Avanzado"]
const d = (id: string, code: string, name: string, description: string, frequency: Frequency, levels: Level[], direction: IndicatorDefinition["direction"], formula: Formula, numerator: string, denominator: string, sources: string, href: string, extra: Partial<IndicatorDefinition> = {}): IndicatorDefinition => ({ id, code, name, description, frequency, levels, direction, formula, numerator, denominator, sources, href, unit: formula === "PERCENTAGE" ? "%" : formula === "COST" ? "COP" : formula === "RATE" ? "Siniestros por K km" : "Riesgos", ...extra })
export const definitions: IndicatorDefinition[] = [
  d("tsv", "1 · TSV", "Reducir la tasa de siniestros por nivel de pérdida", "Siniestros del período en relación con los kilómetros recorridos por toda la flota, separados por gravedad.", "Trimestral", all, "Reducir", "RATE", "Siniestros del nivel de pérdida", "Kilómetros recorridos por toda la flota", "Reportes de siniestros y registros de kilometraje de la flota", "/dashboard/pesv-investigations", { loss: true }),
  d("cost", "2 · SSV", "Reducir los costos de siniestros por nivel de pérdida", "Pérdida económica por gravedad del evento. Los costos directos e indirectos se registran por separado.", "Trimestral", higher, "Reducir", "COST", "Costos directos (COP)", "Costos indirectos (COP)", "Contabilidad, aseguradoras e investigación del siniestro", "/dashboard/pesv-investigations", { loss: true }),
  d("identified", "3.1 · RSVI", "Aumentar la identificación de riesgos viales", "Cambio en la cantidad de riesgos registrados: cantidad al cierre menos cantidad al inicio del año.", "Anual", all, "Aumentar", "DIFFERENCE", "Riesgos identificados al cierre del año", "Riesgos identificados al inicio del año", "Versiones de la matriz de riesgos viales", "/dashboard/pesv-risks"),
  d("critical", "3.2 · GRV", "Reducir los riesgos con valoración alta", "Cambio en riesgos altos: cantidad al cierre menos cantidad al inicio. Un resultado negativo representa reducción.", "Anual", all, "Reducir", "DIFFERENCE", "Riesgos altos al cierre del año", "Riesgos altos al inicio del año", "Versiones y reevaluaciones de la matriz de riesgos", "/dashboard/pesv-risks"),
  d("goals", "4 · CM", "Aumentar el cumplimiento de metas del PESV", "Porcentaje de metas alcanzadas respecto de las metas definidas para el período.", "Trimestral", all, "Aumentar", "PERCENTAGE", "Metas alcanzadas", "Metas definidas", "Objetivos y metas del PESV y sus mediciones", "/dashboard/pesv-objectives"),
  d("work", "5 · CPlan", "Aumentar el cumplimiento del plan anual de trabajo", "Porcentaje de actividades ejecutadas respecto de las programadas para el período.", "Trimestral", all, "Aumentar", "PERCENTAGE", "Actividades ejecutadas", "Actividades programadas", "Plan anual de trabajo, seguimientos y soportes de ejecución", "/dashboard/pesv-work-plan"),
  d("hours", "6 · EJLC", "Reducir el exceso de jornada de conductores", "Porcentaje de eventos de exceso de jornada frente a la suma de días trabajados por los conductores.", "Mensual", all, "Reducir", "PERCENTAGE", "Eventos de exceso de jornada", "Suma de días trabajados por conductores", "Control de jornadas, turnos y registros de conducción", "/dashboard/pesv-journeys"),
  d("speedCoverage", "7 · GVE", "Aumentar la cobertura del programa de velocidad segura", "Vehículos incluidos en el programa frente a los utilizados en desplazamientos laborales.", "Mensual", higher, "Aumentar", "PERCENTAGE", "Vehículos incluidos en el programa", "Vehículos utilizados en desplazamientos laborales", "Programa de velocidad y registro de vehículos en operación", "/dashboard/pesv-programs"),
  d("speedExcess", "8 · ELVL", "Reducir los desplazamientos con exceso de velocidad", "Porcentaje de recorridos con exceso del límite definido por la organización.", "Mensual", ["Avanzado"], "Reducir", "PERCENTAGE", "Desplazamientos con exceso de velocidad", "Total de desplazamientos laborales", "GPS, telemetría y registros de desplazamientos", "/dashboard/pesv-journeys"),
  d("inspections", "9 · IDP", "Aumentar las inspecciones diarias preoperacionales", "Cobertura de inspección de los vehículos que operan cada día. El mes suma vehículos-día inspeccionados y operados.", "Mensual", all, "Aumentar", "PERCENTAGE", "Vehículos-día con inspección preoperacional", "Vehículos-día en operación", "Inspecciones diarias y registro real de vehículos en operación", "/dashboard/pesv-vehicle-inspections"),
  d("maintenance", "10 · CPMVh", "Aumentar el cumplimiento de mantenimiento preventivo", "Mantenimientos preventivos ejecutados frente a los programados para el período.", "Trimestral", all, "Aumentar", "PERCENTAGE", "Mantenimientos preventivos ejecutados", "Mantenimientos preventivos programados", "Plan preventivo, órdenes de trabajo y soportes de mantenimiento", "/dashboard/pesv-vehicle-inspections"),
  d("training", "11 · CPFSV", "Aumentar el cumplimiento del plan de formación", "Capacitaciones en seguridad vial ejecutadas frente a las programadas.", "Trimestral", all, "Aumentar", "PERCENTAGE", "Capacitaciones ejecutadas", "Capacitaciones programadas", "Plan anual de formación, asistentes y evidencias", "/dashboard/pesv-training"),
  d("coverage", "12 · Cobertura", "Aumentar la cobertura de formación en seguridad vial", "Colaboradores únicos capacitados desde el inicio del año hasta el corte, frente al total de colaboradores al corte.", "Trimestral", all, "Aumentar", "PERCENTAGE", "Colaboradores únicos capacitados al corte", "Total de colaboradores al corte", "Asistencia a formación y diagnóstico de colaboradores", "/dashboard/pesv-training", { cumulativeCoverage: true }),
  d("audit", "13 · NCAC", "Aumentar el cierre de no conformidades de auditoría", "No conformidades gestionadas y cerradas frente a las identificadas y analizadas en auditoría PESV.", "Anual", all, "Aumentar", "PERCENTAGE", "No conformidades gestionadas y cerradas", "No conformidades identificadas y analizadas", "Última auditoría interna PESV y soportes de cierre de hallazgos", "/dashboard/audits"),
]

export type IndicatorSheet = { id: string; year: string; name: string; description: string; sources: string; sourceReliability: string; baseline: string; target: string; responsibleId: string; workActivityIds: string[]; workActivityNames: string[] }
export type Measurement = { id: string; indicatorId: string; year: string; period: string; loss: string; numerator: number; denominator: number; result: number | null; analysis: string; source: string; sourceDetails: string; registeredAt: string; definition: IndicatorDefinition; sheet: IndicatorSheet; rateConstant: number; costMethod: "SUM" | "PRODUCT"; evidence: Evidence[]; supersedesId?: string; correctionReason?: string }
export type CsvReview = { id: string; year: string; quarter: string; date: string; reviewerIds: string[]; reviewerNames: string[]; conclusion: string; decisions: string; measurements: Measurement[]; evidence: Evidence[]; createdAt: string }
export type ReportRow = { id: string; label: string; category: string; count: number }
export type StepResult = { step: number; status: "Sin evaluar" | "Cumple" | "No cumple" | "No aplica"; observations: string }
export type AnnualReport = { id: string; values: Values; fleet: ReportRow[]; actors: ReportRow[]; contractors: ReportRow[]; fines: ReportRow[]; steps: StepResult[]; measurements: Measurement[]; reviews: CsvReview[]; objectives: RecordItem[]; nextObjectives: RecordItem[]; programs: RecordItem[]; nextPrograms: RecordItem[]; evidence: Evidence[]; createdAt: string; presentations: { date: string; authority: string; reference: string; at: string }[] }
export type IndicatorsState = {
  protocol: Values; protocolEvidence: Evidence[]; level: Level; rateConstant: number; costMethod: "SUM" | "PRODUCT"
  sheets: IndicatorSheet[]; measurements: Measurement[]; reviews: CsvReview[]; reports: AnnualReport[]
  history: { at: string; event: string; details: string }[]
}
const field = (key: string, label: string, section: string, type: Field["type"] = "text", extra: Partial<Field> = {}): Field => ({ key, label, section, type, required: true, ...extra })
export const protocolKind: Kind = { id: "indicator-protocol", title: "Protocolo", singular: "protocolo de indicadores", columns: [], fields: [
  field("name", "Nombre del protocolo", "Protocolo"), field("version", "Versión", "Protocolo"), field("responsibleId", "Responsable del manejo de indicadores", "Protocolo", "reference", { reference: "people" }),
  field("collection", "Recolección, responsables y validación de datos", "Medición", "textarea", { wide: true }), field("quality", "Verificación de confiabilidad y trazabilidad de fuentes", "Medición", "textarea", { wide: true }),
  field("analysis", "Análisis y evaluación por el Comité de Seguridad Vial", "Análisis y comunicación", "textarea", { wide: true }), field("communication", "Comunicación de resultados y acciones de mejora", "Análisis y comunicación", "textarea", { wide: true }),
] }
export const annualReportKind: Kind = { id: "annual-report", title: "Autogestión", singular: "reporte de autogestión", columns: [], fields: [
  field("year", "Año del reporte", "Organización", "year"), field("companyName", "Razón social", "Organización"), field("nit", "NIT", "Organización"), field("address", "Dirección de la sede principal", "Organización"), field("phone", "Teléfono", "Organización"),
  field("representative", "Representante legal", "Organización"), field("mission", "Misionalidad", "Organización", "textarea", { wide: true }), field("size", "Tamaño / clasificación de la organización", "Organización"),
  field("leaderName", "Nombre del líder PESV", "Responsables"), field("leaderRole", "Cargo del líder", "Responsables"), field("leaderEmail", "Correo institucional del líder", "Responsables"),
  field("auditors", "Auditores del último año: nombres, cargos y correos", "Responsables", "textarea", { wide: true }), field("auditDate", "Fecha de la última auditoría interna PESV", "Auditoría", "date"),
  field("authority", "Autoridad verificadora destinataria", "Reporte"), field("analysis", "Análisis anual de indicadores, avances y brechas", "Reporte", "textarea", { wide: true }), field("improvements", "Acciones y compromisos para el nuevo año", "Reporte", "textarea", { wide: true }),
] }

export function quarterEnd(year: string, quarter: string) { return `${year}-${["03-31", "06-30", "09-30", "12-31"][Number(quarter) - 1]}` }
export function periodRange(year: string, frequency: Frequency, period: string) {
  if (frequency === "Anual") return { start: `${year}-01-01`, end: `${year}-12-31` }
  const index = Number(period)
  if (frequency === "Trimestral") return { start: `${year}-${String((index - 1) * 3 + 1).padStart(2, "0")}-01`, end: quarterEnd(year, period) }
  const end = new Date(Date.UTC(Number(year), index, 0)).toISOString().slice(0, 10)
  return { start: `${year}-${String(index).padStart(2, "0")}-01`, end }
}
export function periodLabel(definition: IndicatorDefinition, period: string) { return definition.frequency === "Anual" ? "Anual" : definition.frequency === "Trimestral" ? `Trimestre ${period}` : new Intl.DateTimeFormat("es-CO", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, Number(period) - 1, 1))) }
export function expectedPeriods(definition: IndicatorDefinition, quarter: number) { return definition.frequency === "Anual" ? quarter === 4 ? ["1"] : [] : Array.from({ length: definition.frequency === "Mensual" ? quarter * 3 : quarter }, (_, i) => String(i + 1)) }
export function compute(definition: IndicatorDefinition, numerator: number, denominator: number, constant: number, costMethod: "SUM" | "PRODUCT") {
  if (definition.formula === "DIFFERENCE") return numerator - denominator
  if (definition.formula === "COST") return costMethod === "SUM" ? numerator + denominator : numerator * denominator
  return denominator === 0 ? null : numerator / denominator * (definition.formula === "RATE" ? constant : 100)
}
export function formulaLabel(definition: IndicatorDefinition, constant: number, costMethod: "SUM" | "PRODUCT") {
  return definition.formula === "DIFFERENCE" ? "Cantidad al cierre − cantidad al inicio" : definition.formula === "COST" ? costMethod === "SUM" ? "Costos directos + costos indirectos" : "Costos directos × costos indirectos (transcripción de tabla)" : definition.formula === "RATE" ? `Siniestros × ${constant.toLocaleString("es-CO")} / kilómetros` : "Numerador / denominador × 100"
}
export const measurementKey = (m: Pick<Measurement, "indicatorId" | "year" | "period" | "loss">) => `${m.indicatorId}:${m.year}:${m.period}:${m.loss}`
export function activeMeasurements(measurements: Measurement[]) {
  const superseded = new Set(measurements.map(m => m.supersedesId).filter(Boolean))
  return measurements.filter(m => !superseded.has(m.id))
}
export function aggregate(definition: IndicatorDefinition, measurements: Measurement[], year: string, quarter: number, loss = "") {
  const expected = expectedPeriods(definition, quarter)
  const relevant = activeMeasurements(measurements).filter(m => m.indicatorId === definition.id && m.year === year && m.loss === loss && expected.includes(m.period))
  const missing = expected.filter(period => !relevant.some(m => m.period === period))
  if (!expected.length || missing.length) return { value: null, missing, count: relevant.length, reason: !expected.length ? "Cierre anual" : "Mediciones faltantes" }
  if (definition.cumulativeCoverage || definition.frequency === "Anual") {
    const latest = relevant.sort((a, b) => Number(a.period) - Number(b.period)).at(-1)!
    return { value: latest.result, missing, count: relevant.length, reason: latest.result === null ? "Sin base de cálculo" : "" }
  }
  const conventions = new Set(relevant.map(m => definition.formula === "RATE" ? String(m.rateConstant) : m.costMethod))
  if ((definition.formula === "RATE" || definition.formula === "COST") && conventions.size > 1) return { value: null, missing, count: relevant.length, reason: "Métodos de cálculo diferentes" }
  const result = compute(definition, relevant.reduce((n, m) => n + m.numerator, 0), relevant.reduce((n, m) => n + m.denominator, 0), relevant[0].rateConstant, relevant[0].costMethod)
  return { value: result, missing, count: relevant.length, reason: result === null ? "Sin base de cálculo" : "" }
}
export function validateMeasurement(definition: IndicatorDefinition, sheet: IndicatorSheet, form: { year: string; period: string; loss: string; numerator: string; denominator: string; analysis: string; source: string; correctionReason: string }, state: IndicatorsState, previous?: Measurement, today = dateToday()) {
  if (!Number.isInteger(Number(form.year)) || Number(form.year) < 2000 || Number(form.year) > 2100) return "Revisa la vigencia de la medición."
  const max = definition.frequency === "Mensual" ? 12 : definition.frequency === "Trimestral" ? 4 : 1
  if (!Number.isInteger(Number(form.period)) || Number(form.period) < 1 || Number(form.period) > max) return "Selecciona un período válido."
  if (periodRange(form.year, definition.frequency, form.period).end > today) return "El período aún no ha terminado. Registra la medición después de su fecha de corte."
  if (definition.loss && !losses.includes(form.loss)) return "Selecciona el nivel de pérdida."
  if (!sheet.name.trim() || !sheet.sources.trim() || !sheet.sourceReliability.trim() || !sheet.responsibleId || !sheet.baseline.trim() || !sheet.target.trim()) return "Completa la ficha: nombre, fuentes, confiabilidad, responsable, línea base y meta."
  if (form.numerator.trim() === "" || form.denominator.trim() === "") return "Registra ambas variables; un campo vacío no equivale a cero."
  const n = Number(form.numerator), d = Number(form.denominator)
  if (!Number.isFinite(n) || !Number.isFinite(d) || n < 0 || d < 0) return "Las variables deben ser números válidos y no negativos."
  if (definition.formula !== "COST" && (!Number.isInteger(n) || (definition.formula !== "RATE" && !Number.isInteger(d)))) return "Las cantidades deben ser enteras; los kilómetros admiten decimales."
  if (definition.formula === "PERCENTAGE" && n > d) return "El numerador no puede superar la población o actividades del denominador."
  if (!form.source.trim() || !form.analysis.trim()) return "Registra la fuente utilizada y el análisis del resultado."
  const key = measurementKey({ indicatorId: definition.id, year: form.year, period: form.period, loss: definition.loss ? form.loss : "" })
  const existing = activeMeasurements(state.measurements).find(m => measurementKey(m) === key)
  if (existing && existing.id !== previous?.id) return "Este corte ya tiene medición. Usa Rectificar para conservar la trazabilidad."
  if (previous && (!form.correctionReason.trim() || existing?.id !== previous.id)) return "Registra el motivo de rectificación y utiliza la versión vigente."
  return null
}
export function emptySheet(definition: IndicatorDefinition, year: string): IndicatorSheet {
  return { id: definition.id, year, name: definition.name, description: definition.description, sources: definition.sources, sourceReliability: "", baseline: "", target: "", responsibleId: "", workActivityIds: [], workActivityNames: [] }
}
export function initialIndicatorsState(): IndicatorsState {
  const catalogs = loadCatalogs()
  return { level: "Básico", rateConstant: 5000000, costMethod: "SUM", protocol: { name: "Protocolo de medición y análisis de indicadores PESV", version: "1.0", responsibleId: catalogs.people[0]?.value ?? "", collection: "Consolidar las variables de cada fuente, validar responsables y conservar el soporte de cada corte.", quality: "Verificar período, duplicados, unidades y consistencia de numeradores y denominadores antes de medir.", analysis: "El Comité de Seguridad Vial evalúa resultados y brechas al cierre de cada trimestre y registra sus decisiones.", communication: "Comunicar resultados y acciones al CSV y a la dirección, conservando actas y reportes." }, protocolEvidence: [], sheets: [], measurements: [], reviews: [], reports: [], history: [] }
}
const inRange = (date: string, start: string, end: string) => date >= start && date <= end
export function evidenceDate(timestamp: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(timestamp)) return timestamp
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(date)
}
function supportedExecution(item: RecordItem, end: string) {
  return item.entries.some(e => e.kind === "FOLLOW_UP" && e.date <= end && e.progress === 100 && item.evidence.some(file => file.targetId === e.id && evidenceDate(file.uploadedAt) && evidenceDate(file.uploadedAt) <= end))
}
export function sourceSuggestion(definition: IndicatorDefinition, year: string, period: string, sheet: IndicatorSheet, loss = ""): { numerator: string; denominator: string; details: string } | null {
  const { start, end } = periodRange(year, definition.frequency, period)
  const cohorts = (module: Parameters<typeof readItems>[0], kind: string) => readStore<RecordItem[] | null>(`safecloud:pesv-${module}`, null)?.filter(i => i.kind === kind && text(i.values.year) === year && inRange(text(i.values.endDate), start, end))
  if (definition.id === "tsv" || definition.id === "cost") {
    const source = readStore<RecordItem[] | null>("safecloud:pesv-statistics", null)
    if (!source) return null
    const records = source.filter(i => i.kind === "statistical-event" && i.values.journey === "Laboral" && inRange(text(i.values.eventDate), start, end) && (loss === "Choques simples" ? ["Solo daños materiales", "Primeros auxilios"].includes(text(i.values.personLoss)) : i.values.personLoss === loss))
    return definition.id === "tsv" ? { numerator: String(records.length), denominator: "", details: "Siniestros laborales del registro estadístico, clasificados por afectación a personas. Completa kilómetros con el registro real de toda la flota." } : { numerator: String(records.reduce((n, i) => n + Number(i.values.directCosts || 0), 0)), denominator: String(records.reduce((n, i) => n + Number(i.values.indirectCosts || 0), 0)), details: "Costos directos e indirectos de siniestros laborales del período y nivel de pérdida seleccionado." }
  }
  if (definition.id === "audit") {
    const audits = storedAssurance("audits")
    if (!audits.length) return null
    const selected = audits.filter(i => i.kind === "audit-finding" && i.values.year === year && i.values.findingType === "No conformidad")
    const closed = selected.filter(i => completedFinding(i) && text(i.values.verificationDate) <= end && i.evidence.some(e => e.targetId === `VERIFICATION:${text(i.values.verificationToken)}` && evidenceDate(e.uploadedAt) <= end))
    return { numerator: String(closed.length), denominator: String(selected.length), details: "No conformidades del módulo Auditoría PESV. Cierre con ejecución, verificación eficaz y evidencia disponible al corte." }
  }
  if (["work", "maintenance", "training"].includes(definition.id)) {
    let selected = definition.id === "work" ? cohorts("work-plan", "work-activity") : definition.id === "maintenance" ? cohorts("vehicle-inspections", "vehicle-maintenance")?.filter(i => i.values.type === "Preventivo") : cohorts("training", "training-activity")
    if (!selected) return null
    if (definition.id === "work" && sheet.workActivityIds.length) selected = selected.filter(i => sheet.workActivityIds.includes(i.id))
    return { numerator: String(selected.filter(i => supportedExecution(i, end)).length), denominator: String(selected.length), details: `Cohorte programada con fecha final entre ${start} y ${end}. Ejecución 100% y evidencia registrada hasta el corte. ${selected.map(i => text(i.values.name)).join("; ") || "Sin actividades en esta cohorte."}` }
  }
  if (definition.id === "goals") {
    const selected = cohorts("objectives", "objective")
    if (!selected) return null
    const reached = selected.filter(i => {
      const latest = i.entries.filter(e => e.kind === "FOLLOW_UP" && e.date <= end).sort((a, b) => a.date.localeCompare(b.date)).at(-1)
      return latest?.measuredValue !== undefined && (i.values.direction === "Aumentar" ? latest.measuredValue >= Number(i.values.target) : latest.measuredValue <= Number(i.values.target))
    })
    return { numerator: String(reached.length), denominator: String(selected.length), details: `Metas con fecha final en el período ${start} a ${end}. Se usa la última medición registrada hasta el corte.` }
  }
  if (definition.id === "inspections") {
    const checks = readStore<RecordItem[] | null>("safecloud:pesv-vehicle-inspections", null)
    if (!checks) return null
    const pairs = new Set(checks.filter(i => i.kind === "vehicle-inspection" && i.values.moment === "Preoperacional diaria" && inRange(text(i.values.inspectionDate), start, end) && i.evidence.some(e => evidenceDate(e.uploadedAt) && evidenceDate(e.uploadedAt) <= end)).map(i => `${text(i.values.vehicleProfileId)}:${text(i.values.inspectionDate)}`))
    return { numerator: String(pairs.size), denominator: "", details: "Vehículos-día únicos con inspección y evidencia. Completa el denominador con el registro real de operación; no se infiere del tamaño de la flota." }
  }
  if (definition.id === "coverage") {
    const formation = readStore<RecordItem[] | null>("safecloud:pesv-training", null)
    const diagnoses = readStore<{ year: number; updateDate: string; collaborators: { id: string }[] }[] | null>("safecloud:pesv-diagnosis", null)?.filter(d => String(d.year) === year && d.updateDate <= end).sort((a, b) => a.updateDate.localeCompare(b.updateDate))
    if (!formation) return null
    const people = new Set(formation.filter(i => i.kind === "training-activity" && text(i.values.year) === year).flatMap(i => i.entries.filter(e => e.kind === "FOLLOW_UP" && e.progress === 100 && inRange(e.date, `${year}-01-01`, end) && i.evidence.some(file => file.targetId === e.id && evidenceDate(file.uploadedAt) && evidenceDate(file.uploadedAt) <= end)).flatMap(e => e.attendeeIds ?? [])))
    return { numerator: String(people.size), denominator: diagnoses?.length ? String(new Set(diagnoses.at(-1)!.collaborators.map(c => c.id)).size) : "", details: `Asistentes únicos acreditados entre ${year}-01-01 y ${end}. Total de colaboradores tomado del último diagnóstico disponible al corte, si existe.` }
  }
  return null
}
export function reportInitialValues(year: string): Values {
  const audit = latestAnnualAudit(year)
  const leader = readStore<{ employeeName: string; roleDescription: string; employeeEmail: string } | null>("safecloud:pesv-responsible", null)
  const policy = readStore<{ legalRepresentative: string }[]>("safecloud:pesv-policy", []).at(-1)
  const diagnosis = readStore<{ year: number; servicesDescription: string }[]>("safecloud:pesv-diagnosis", []).find(d => String(d.year) === year)
  return { year, companyName: "", nit: "", address: "", phone: "", representative: policy?.legalRepresentative ?? "", mission: diagnosis?.servicesDescription ?? "", size: "", leaderName: leader?.employeeName ?? "", leaderRole: leader?.roleDescription ?? "", leaderEmail: leader?.employeeEmail ?? "", auditors: audit?.links.auditorIds?.map(o => o.label).join("; ") ?? "", auditDate: text(audit?.values.auditDate), authority: "", analysis: "", improvements: "" }
}
export function reportSourceRows(year: string) {
  const diagnosis = readStore<{ year: number; updateDate: string; vehicles: { vehicleType: string; ownershipType: string }[]; collaborators: { isWorkDriver: boolean }[] }[]>("safecloud:pesv-diagnosis", []).filter(d => String(d.year) === year).sort((a, b) => a.updateDate.localeCompare(b.updateDate)).at(-1)
  const fleet: ReportRow[] = []
  for (const v of diagnosis?.vehicles ?? []) {
    const existing = fleet.find(row => row.label === v.vehicleType && row.category === v.ownershipType)
    if (existing) existing.count++; else fleet.push({ id: crypto.randomUUID(), label: v.vehicleType, category: v.ownershipType, count: 1 })
  }
  const contractors = readItems("change-contractors").filter(i => i.kind === "contractor" && text(i.values.year) === year).map(i => ({ id: crypto.randomUUID(), label: text(i.values.service), category: text(i.values.relationship), count: 1 }))
  return { fleet, contractors, actors: diagnosis ? [{ id: crypto.randomUUID(), label: "Conductores", category: "", count: diagnosis.collaborators.filter(c => c.isWorkDriver).length }] : [], fines: [] as ReportRow[] }
}
export const stepNames = pesvSteps
export function auditReportSteps(year: string): StepResult[] {
  const audit = latestAnnualAudit(year)
  return stepNames.map((_, index) => ({ step: index + 1, status: audit ? text(audit.values[`step_${index + 1}`]) as StepResult["status"] : "Sin evaluar", observations: text(audit?.values[`stepNotes_${index + 1}`]) }))
}
export function reportWarnings(report: AnnualReport, level: Level, today = dateToday()) {
  const warnings: string[] = []
  if (`${text(report.values.year)}-12-31` > today) warnings.push("El año reportado no ha terminado.")
  if (!report.fleet.length || !report.actors.length || !report.contractors.length || !report.fines.length) warnings.push("Completa los inventarios; registra una fila con cantidad cero cuando no existan casos.")
  if (report.steps.some(s => s.status === "Sin evaluar" || !s.observations.trim())) warnings.push("Completa el resumen de auditoría de los 24 pasos y sus observaciones.")
  if (!report.evidence.some(e => e.targetId === "AUDIT")) warnings.push("Carga el informe de la última auditoría interna PESV.")
  if (!report.objectives.length || !report.nextObjectives.length) warnings.push("Relaciona los objetivos y metas del año reportado y los propuestos para el nuevo año.")
  if (!report.programs.length || !report.nextPrograms.length) warnings.push("Relaciona los programas de riesgos críticos del año reportado y los propuestos para el nuevo año.")
  if (report.measurements.some(m => m.definition.formula === "COST" && m.costMethod === "PRODUCT")) warnings.push("Valida la metodología de costos: la multiplicación transcrita está pendiente de validación.")
  for (const definition of definitions.filter(d => d.levels.includes(level))) {
    if ((definition.loss ? losses : [""]).some(loss => aggregate(definition, report.measurements, text(report.values.year), 4, loss).missing.length)) warnings.push(`Faltan cortes: ${definition.code}.`)
    if ((definition.loss ? losses : [""]).some(loss => { const a = aggregate(definition, report.measurements, text(report.values.year), 4, loss); return !a.missing.length && a.reason })) warnings.push(`Revisa el método de cálculo: ${definition.code}.`)
  }
  if (["1", "2", "3", "4"].some(q => !report.reviews.some(r => r.quarter === q && r.evidence.length))) warnings.push("Faltan revisiones trimestrales del CSV con acta de soporte.")
  return warnings
}
export function makeAnnualReport(values: Values, rows: { fleet: ReportRow[]; actors: ReportRow[]; contractors: ReportRow[]; fines: ReportRow[] }, steps: StepResult[], state: IndicatorsState): AnnualReport {
  const year = text(values.year)
  return { id: crypto.randomUUID(), values: structuredClone({ ...values, level: state.level, rateConstant: String(state.rateConstant), costMethod: state.costMethod }), ...structuredClone(rows), steps: structuredClone(steps), measurements: structuredClone(activeMeasurements(state.measurements).filter(m => m.year === year)), reviews: structuredClone(state.reviews.filter(r => r.year === year)), objectives: structuredClone(readItems("objectives").filter(i => text(i.values.year) === year)), nextObjectives: structuredClone(readItems("objectives").filter(i => Number(i.values.year) === Number(year) + 1)), programs: structuredClone(readItems("programs").filter(i => text(i.values.year) === year)), nextPrograms: structuredClone(readItems("programs").filter(i => Number(i.values.year) === Number(year) + 1)), evidence: [], createdAt: new Date().toISOString(), presentations: [] }
}
export function demonstrationMeasurements(state: IndicatorsState): Measurement[] {
  const year = String(currentYear()), end = `${year}-03-31`
  if (end > dateToday()) return []
  const definition = definitions.find(d => d.id === "work")!
  const sheet: IndicatorSheet = { ...emptySheet(definition, year), baseline: "50", target: "100", responsibleId: loadCatalogs().people[0]?.value ?? "", sourceReliability: "Ejemplo de plan y actas de ejecución verificados por el responsable." }
  return [{ id: "pesv-indicator-demo-1", indicatorId: definition.id, year, period: "1", loss: "", numerator: 3, denominator: 4, result: 75, source: "Datos de demostración: plan anual y actas de ejecución", sourceDetails: "Medición de ejemplo; no representa los datos de la empresa.", analysis: "Tres de cuatro actividades ejecutadas. Reprogramar la actividad pendiente y verificar su cumplimiento.", registeredAt: new Date().toISOString(), definition, sheet, rateConstant: state.rateConstant, costMethod: state.costMethod, evidence: [] }]
}
