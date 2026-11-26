import { getPesv, listPesv, listPesvDocuments, pesvDocumentUrl, pesvPath, pesvRequest, savePesv, uploadPesvDocument, type PesvResource } from "@/services/pesvService"
import { catalogOptions, planningCatalogs, planningRecords } from "./planning-api"
import { pesvModuleCatalog } from "./module-catalog"
import { text, type Catalogs, type Evidence, type PesvModule, type RecordItem, type Values } from "./planning"
import { annualReportKind, definitions, emptySheet, initialIndicatorsState, makeAnnualReport, protocolKind, stepNames, type AnnualReport, type CsvReview, type IndicatorDefinition, type IndicatorSheet, type IndicatorsState, type Level, type Measurement, type ReportRow, type StepResult } from "./indicators"

type Row = Record<string, unknown> & { id: string }
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : []
const str = (value: unknown) => value == null ? "" : String(value)
const strings = (value: unknown): string[] => Array.isArray(value) ? value.map(String) : []
const ids: Record<string, string> = { tsv: "TSV", cost: "SSV", identified: "RSVI", critical: "GRV", goals: "CM", work: "CPlan", hours: "EJLC", speedCoverage: "GVE", speedExcess: "ELVL", inspections: "IDP", maintenance: "CPMVh", training: "CPFSV", coverage: "Cobertura", audit: "NCAC" }
export type ApiDefinition = { id: string; name: string; formula: string; frequency: string; levels: string[]; requiresLoss?: boolean }
export function assertIndicatorDefinition(definition: IndicatorDefinition, remote: ApiDefinition[]) {
  const match = remote.find(row => row.id === ids[definition.id])
  const frequencies: Record<string, string> = { MONTHLY: "Mensual", QUARTERLY: "Trimestral", ANNUAL: "Anual" }
  const sameLevels = match && [...match.levels].sort().join("|") === [...definition.levels].sort().join("|")
  const meanings: Record<string, RegExp> = { cost: /cost/i, identified: /identifica/i, critical: /alt|cr[ií]tic/i, goals: /meta/i, hours: /exceso/i, speedCoverage: /velocidad/i, speedExcess: /velocidad/i }
  const sameMeaning = !meanings[definition.id] || meanings[definition.id].test(match?.name ?? "")
  if (!match || !sameMeaning || match.formula !== definition.formula || (frequencies[match.frequency] ?? match.frequency) !== definition.frequency || Boolean(match.requiresLoss) !== Boolean(definition.loss) || !sameLevels) {
    throw new Error(`El contrato del indicador ${definition.code} no coincide con su fórmula, frecuencia, nivel o pérdida en SafeCloud. El backend debe alinearlo antes de guardar; no se enviarán variables con otro significado.`)
  }
}
function localDefinition(id: unknown) {
  const result = definitions.find(d => ids[d.id] === id)
  if (!result) throw new Error(`El backend devolvió un indicador desconocido: ${str(id)}`)
  return result
}
export function emptyApiIndicators(): IndicatorsState {
  return initialIndicatorsState()
}
function decodeProtocol(value: unknown): Values {
  if (typeof value !== "string" || !value) return emptyApiIndicators().protocol
  try { const row = object(JSON.parse(value)); if (row.safecloudProtocol === 1) return object(row.fields) as Values } catch { /* Plain backend protocols remain editable. */ }
  return { ...emptyApiIndicators().protocol, collection: value }
}
function mapSheet(row: Row, catalogs: Catalogs): IndicatorSheet {
  const definition = localDefinition(row.indicatorId)
  const links = object(row.links)
  const activities = catalogOptions(links.workActivities)
  return {
    ...emptySheet(definition, str(row.year)), remoteId: row.id, remoteVersion: Number(row.version),
    ...Object.fromEntries(["name", "description", "sources", "sourceReliability", "baseline", "target", "responsibleId"].map(key => [key, str(row[key])])),
    workActivityIds: strings(row.workActivityIds), workActivityNames: strings(row.workActivityIds).map(id => activities.find(a => a.value === id)?.label ?? catalogs.workActivities.find(a => a.value === id)?.label ?? id),
  }
}
async function evidence(resource: PesvResource, id: string): Promise<Evidence[]> {
  return (await listPesvDocuments(resource, id)).map(d => ({ id: d.id, name: d.fileName, mime: d.mimeType, uploadedAt: d.uploadedAt, url: pesvDocumentUrl(resource, id, d.id), ...(d.description.startsWith("SafeCloud:purpose:") ? { targetId: d.description.slice("SafeCloud:purpose:".length) } : d.targetId ? { targetId: d.targetId } : {}) }))
}
const snapshotSeparator = "\n\n--- Ficha SafeCloud ---\n"
function mapMeasurement(row: Row, sheets: IndicatorSheet[], remote: ApiDefinition[]): Measurement {
  const definition = localDefinition(row.indicatorId)
  assertIndicatorDefinition(definition, remote)
  const links = object(row.links), sheetRef = object(links.sheet)
  let sourceDetails = str(row.sourceDetails)
  let sheet = sheets.find(s => s.remoteId === row.sheetId)
  const index = sourceDetails.lastIndexOf(snapshotSeparator)
  if (index >= 0) {
    const stored = object(JSON.parse(sourceDetails.slice(index + snapshotSeparator.length)))
    if (stored.id === definition.id && stored.year === str(row.year)) sheet = stored as IndicatorSheet
    sourceDetails = sourceDetails.slice(0, index)
  } else if (sheet && Number(sheetRef.version) !== sheet.remoteVersion) {
    throw new Error("El backend no conserva la ficha completa de una medición histórica. Se necesita su snapshot para mostrarla sin reemplazarla por la ficha actual.")
  }
  if (!sheet) throw new Error("La medición no incluye una ficha histórica disponible")
  return {
    id: row.id, remoteVersion: Number(row.version), indicatorId: definition.id, year: str(row.year), period: str(row.period),
    loss: str(row.loss), numerator: Number(row.numerator), denominator: Number(row.denominator), result: row.result == null ? null : Number(row.result),
    analysis: str(row.analysis), source: str(row.source), sourceDetails, registeredAt: str(row.registeredAt ?? row.CreatedAt),
    definition, sheet, rateConstant: Number(row.rateConstant), costMethod: row.costMethod === "PRODUCT" ? "PRODUCT" : "SUM",
    evidence: [], ...(row.supersedesId ? { supersedesId: str(row.supersedesId) } : {}), ...(row.correctionReason ? { correctionReason: str(row.correctionReason) } : {}),
  }
}
function mapReview(row: Row, measurements: Measurement[]): CsvReview {
  const links = object(row.links)
  return {
    id: row.id, year: str(row.year), quarter: str(row.quarter), date: str(row.date), reviewerIds: strings(row.reviewerIds),
    reviewerNames: rows(links.reviewers).map(p => str(p.employeeName ?? p.name)), conclusion: str(row.conclusion), decisions: str(row.decisions),
    measurements: strings(row.measurementIds).map(id => measurements.find(m => m.id === id)).filter((m): m is Measurement => Boolean(m)), evidence: [], createdAt: str(row.CreatedAt ?? row.createdAt),
  }
}
type ReportApiRow = { id?: string; category: string; label: string; value: string | number | null; source: string; observations?: string }
export function annualReportPayload(report: AnnualReport) {
  const data: ReportApiRow[] = Object.entries(report.values).map(([key, value]) => ({ category: "ORGANIZATION", label: key, value: text(value), source: "SafeCloud" }))
  for (const group of ["fleet", "actors", "contractors", "fines"] as const) data.push(...report[group].map(row => ({ id: row.id, category: group, label: row.label, value: row.count, source: row.category || group })))
  for (const group of ["objectives", "nextObjectives", "programs", "nextPrograms"] as const) {
    data.push({ category: "RELATED_RECORDS", label: group, value: JSON.stringify(report[group]), source: "SafeCloud" })
  }
  // The API owns the annual cutoff; preserve full historical display snapshots alongside its minimal ID/result snapshot.
  data.push({ category: "SNAPSHOT", label: "measurements", value: JSON.stringify(report.measurements.map(({ evidence, ...m }) => ({ ...m, evidence: evidence.map(e => ({ ...e })) }))), source: "SafeCloud" })
  data.push({ category: "SNAPSHOT", label: "reviews", value: JSON.stringify(report.reviews), source: "SafeCloud" })
  return { year: Number(report.values.year), level: report.values.level, rows: data, steps: report.steps.map(s => ({ step: String(s.step), status: s.status, observations: s.observations })) }
}
function mapReport(row: Row, measurements: Measurement[], reviews: CsvReview[]): AnnualReport {
  const data = rows(row.rows)
  const snapshot = object(row.sourceSnapshot)
  const values = Object.fromEntries(data.filter(r => r.category === "ORGANIZATION").map(r => [str(r.label), str(r.value)])) as Values
  values.year = str(row.year); values.level = str(row.level)
  const parsed = <T,>(category: string, key: string, fallback: T): T => {
    const found = data.find(r => r.category === category && r.label === key)
    return typeof found?.value === "string" ? JSON.parse(found.value) as T : fallback
  }
  const inventory = (group: string): ReportRow[] => data.filter(r => r.category === group).map(r => ({ id: r.id, label: str(r.label), category: str(r.source), count: Number(r.value) }))
  return {
    id: row.id, remoteVersion: Number(row.version), values, fleet: inventory("fleet"), actors: inventory("actors"), contractors: inventory("contractors"), fines: inventory("fines"),
    steps: rows(row.steps).map(s => ({ step: Number(s.step), status: str(s.status) as StepResult["status"], observations: str(s.observations) })),
    measurements: parsed("SNAPSHOT", "measurements", rows(snapshot.measurements).map(m => measurements.find(item => item.id === m.id)).filter((m): m is Measurement => Boolean(m))),
    reviews: parsed("SNAPSHOT", "reviews", rows(snapshot.reviews).map(r => reviews.find(item => item.id === r.id)).filter((r): r is CsvReview => Boolean(r))),
    objectives: parsed("RELATED_RECORDS", "objectives", []), nextObjectives: parsed("RELATED_RECORDS", "nextObjectives", []), programs: parsed("RELATED_RECORDS", "programs", []), nextPrograms: parsed("RELATED_RECORDS", "nextPrograms", []),
    evidence: [], createdAt: str(row.CreatedAt ?? row.createdAt),
    presentations: rows(row.presentations).map(p => ({ date: str(p.date), authority: str(p.audience), reference: str(p.title), at: str(p.createdAt) })),
  }
}
export async function loadApiIndicators(catalogs: Catalogs) {
  const [remoteDefinitions, protocol, sheetRows, measurementRows, reviewRows, reportRows] = await Promise.all([
    pesvRequest<ApiDefinition[]>("/api/pesv/indicators/definitions"), pesvRequest<Row>("/api/pesv/indicators/protocol"),
    listPesv<Row>(pesvPath("indicatorSheets")), listPesv<Row>(pesvPath("indicatorMeasurements")),
    listPesv<Row>(pesvPath("indicatorReviews")), listPesv<Row>(pesvPath("indicatorReports")),
  ])
  const alive = (row: Row) => row.status !== "ARCHIVED"
  const hydrate = (resource: PesvResource, list: Row[]) => Promise.all(list.filter(alive).map(row => getPesv<Row>(resource, row.id)))
  const [sheetDetails, measurementDetails, reviewDetails] = await Promise.all([
    hydrate("indicatorSheets", sheetRows), hydrate("indicatorMeasurements", measurementRows), hydrate("indicatorReviews", reviewRows),
  ])
  const sheets = sheetDetails.map(row => mapSheet(row, catalogs))
  const measurements = await Promise.all(measurementDetails.map(async row => ({ ...mapMeasurement(row, sheets, remoteDefinitions), evidence: await evidence("indicatorMeasurements", row.id) })))
  const reviews = await Promise.all(reviewDetails.map(async row => ({ ...mapReview(row, measurements), evidence: await evidence("indicatorReviews", row.id) })))
  const reportDetails = await Promise.all(reportRows.filter(alive).map(row => getPesv<Row>("indicatorReports", row.id)))
  const reports = await Promise.all(reportDetails.map(async row => ({ ...mapReport(row, measurements, reviews), evidence: await evidence("indicatorReports", row.id) })))
  const history = [...sheetDetails, ...measurementDetails, ...reviewDetails, ...reportDetails].flatMap(row => rows(row.history).map(h => ({ at: str(h.createdAt), event: str(h.event), details: JSON.stringify(h.snapshot ?? {}) }))).sort((a, b) => a.at.localeCompare(b.at))
  const state: IndicatorsState = {
    ...emptyApiIndicators(), protocol: decodeProtocol(protocol.measurementProtocol), level: (protocol.level || "Básico") as Level,
    rateConstant: protocol.id ? Number(protocol.rateConstant) : 5000000, costMethod: protocol.costMethod === "PRODUCT" ? "PRODUCT" : "SUM",
    sheets, measurements, reviews, reports, history,
  }
  return { state, definitions: remoteDefinitions, protocolVersion: protocol.id ? Number(protocol.version) : undefined }
}
export async function indicatorCatalogs(empty: Catalogs) {
  const permitted = async (url: string) => {
    try { return await listPesv<Row>(url) }
    catch (error) { if (object(error).status === 403) return []; throw error }
  }
  const [people, workActivities, committees] = await Promise.all([
    permitted("/api/employee"), permitted(pesvPath("workActivities")), permitted(pesvPath("committee") + "?status=CURRENT"),
  ])
  const members = rows(committees[0]?.members)
  return { catalogs: { ...empty, people: catalogOptions(people), workActivities: catalogOptions(workActivities.filter(r => r.status !== "ARCHIVED")) }, committeeMembers: members.map(m => ({ value: str(m.employeeId), label: str(m.employeeName) })) }
}
export async function saveApiSheet(sheet: IndicatorSheet, remote: ApiDefinition[]) {
  const definition = definitions.find(d => d.id === sheet.id)!
  assertIndicatorDefinition(definition, remote)
  const { remoteId, remoteVersion, workActivityNames, id, year, ...fields } = sheet
  if (!sheet.workActivityIds.length) throw new Error("El backend exige al menos una actividad del plan de trabajo en la ficha")
  return savePesv("indicatorSheets", { ...fields, indicatorId: ids[id], year: Number(year), ...(remoteId ? { version: remoteVersion } : {}) }, remoteId)
}
export async function saveApiMeasurement(measurement: Measurement, remote: ApiDefinition[], previous?: Measurement) {
  assertIndicatorDefinition(measurement.definition, remote)
  if (!measurement.sheet.remoteId) throw new Error("Guarda primero la ficha del indicador")
  const sourceDetails = measurement.sourceDetails + snapshotSeparator + JSON.stringify(measurement.sheet)
  if (sourceDetails.length > 20000) throw new Error("La ficha y sus detalles superan el tamaño admitido por el backend")
  const common = { numerator: measurement.numerator, denominator: measurement.denominator, analysis: measurement.analysis, source: measurement.source, sourceDetails, ...(measurement.loss ? { loss: measurement.loss } : {}), rateConstant: measurement.rateConstant, costMethod: measurement.costMethod }
  return previous
    ? pesvRequest(`${pesvPath("indicatorMeasurements", previous.id)}/rectifications`, "POST", { ...common, correctionReason: measurement.correctionReason, version: previous.remoteVersion })
    : savePesv("indicatorMeasurements", { ...common, sheetId: measurement.sheet.remoteId, indicatorId: ids[measurement.indicatorId], year: Number(measurement.year), period: Number(measurement.period) })
}
export async function saveApiProtocol(state: Pick<IndicatorsState, "level" | "rateConstant" | "costMethod" | "protocol">, version?: number) {
  return pesvRequest("/api/pesv/indicators/protocol", "PUT", {
    level: state.level, rateConstant: state.rateConstant, costMethod: state.costMethod,
    measurementProtocol: JSON.stringify({ safecloudProtocol: 1, fields: state.protocol }), ...(version ? { version } : {}),
  })
}
export async function uploadIndicatorEvidence(scope: "protocol" | "measurement" | "review" | "report", id: string, file: File, purpose?: string) {
  if (scope === "protocol") throw new Error("El backend aún no dispone de carga documental para el protocolo de indicadores")
  const resource = scope === "measurement" ? "indicatorMeasurements" : scope === "review" ? "indicatorReviews" : "indicatorReports"
  await uploadPesvDocument(resource, id, file, purpose ? `SafeCloud:purpose:${purpose}` : "")
}
export type IndicatorSources = {
  records: Partial<Record<PesvModule, RecordItem[]>>
  diagnoses: { id: string; year: number; updateDate: string; servicesDescription: string; vehicles: { vehicleType: string; ownershipType: string }[]; collaborators: { id: string; isWorkDriver: boolean }[] }[]
  leader: Record<string, unknown>; policy: Record<string, unknown>; company: Record<string, unknown>
}
export async function indicatorSources(catalogs: Catalogs, allowed: Set<string>, company: Record<string, unknown>): Promise<IndicatorSources> {
  const records: IndicatorSources["records"] = {}
  const needed = ["objectives", "programs", "work-plan", "training", "vehicle-inspections", "audits", "change-contractors", "statistics"]
  for (const slug of needed) {
    const module = pesvModuleCatalog.find(m => m.href === `/dashboard/pesv-${slug}`)
    if (module && allowed.has(module.code)) {
      const moduleCatalogs = await planningCatalogs(slug as PesvModule, catalogs)
      records[slug as PesvModule] = await planningRecords(slug as PesvModule, moduleCatalogs)
    }
  }
  const diagnoses = allowed.has("PESV_DIAGNOSIS") ? await listPesv<IndicatorSources["diagnoses"][number]>(pesvPath("diagnoses")) : []
  const details = await Promise.all(diagnoses.map(row => getPesv<IndicatorSources["diagnoses"][number]>("diagnoses", row.id)))
  const leader = allowed.has("PESV_RESPONSIBLE") ? (await listPesv<Row>(pesvPath("responsible") + "?status=CURRENT"))[0] ?? {} : {}
  const policy = allowed.has("PESV_POLICY") ? (await listPesv<Row>(pesvPath("policies"))).find(p => p.status === "ACTIVE") ?? {} : {}
  return { records, diagnoses: details, leader, policy, company }
}
export function apiReportInitial(year: string, source: IndicatorSources) {
  const audit = source.records.audits?.filter(i => i.kind === "pesv-audit" && i.values.year === year && i.values.phase === "Realizada").sort((a, b) => text(a.values.auditDate).localeCompare(text(b.values.auditDate))).at(-1)
  const values: Values = Object.fromEntries(annualReportKind.fields.map(f => [f.key, ""]))
  Object.assign(values, {
    year, companyName: str(source.company.name), nit: str(source.company.nit), address: str(source.company.address), phone: str(source.company.phone),
    representative: str(source.policy.legalRepresentative), mission: source.diagnoses.find(d => String(d.year) === year)?.servicesDescription ?? "",
    leaderName: str(source.leader.employeeName), leaderRole: str(source.leader.roleDescription), leaderEmail: str(source.leader.employeeEmail),
    auditors: audit?.links.auditorIds?.map(o => o.label).join("; ") ?? "", auditDate: text(audit?.values.auditDate),
  })
  const diagnosis = source.diagnoses.filter(d => String(d.year) === year).sort((a, b) => a.updateDate.localeCompare(b.updateDate)).at(-1)
  const fleet: ReportRow[] = []
  for (const v of diagnosis?.vehicles ?? []) {
    const existing = fleet.find(r => r.label === v.vehicleType && r.category === v.ownershipType)
    if (existing) existing.count++
    else fleet.push({ id: crypto.randomUUID(), label: v.vehicleType, category: v.ownershipType, count: 1 })
  }
  return {
    values, rows: { fleet, actors: diagnosis ? [{ id: crypto.randomUUID(), label: "Conductores", category: "", count: diagnosis.collaborators.filter(c => c.isWorkDriver).length }] : [], contractors: (source.records["change-contractors"] ?? []).filter(i => i.kind === "contractor" && i.values.year === year).map(i => ({ id: crypto.randomUUID(), label: text(i.values.service), category: text(i.values.relationship), count: 1 })), fines: [] as ReportRow[] },
    steps: stepNames.map((_, i) => ({ step: i + 1, status: (text(audit?.values[`step_${i + 1}`]) || "Sin evaluar") as StepResult["status"], observations: text(audit?.values[`stepNotes_${i + 1}`]) })),
  }
}
export function buildApiAnnual(values: Values, inventories: Pick<AnnualReport, "fleet" | "actors" | "contractors" | "fines">, steps: StepResult[], state: IndicatorsState, sources: IndicatorSources): AnnualReport {
  return makeAnnualReport(values, inventories, steps, state, sources)
}
