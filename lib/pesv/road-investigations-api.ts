import { getPesv, listPesv, listPesvDocuments, pesvDocumentUrl, pesvPath, pesvRequest, type PesvResource } from "@/services/pesvService"
import { catalogOptions, valuesOf } from "./planning-api"
import { snapshotLinks, closureAllowed, procedureKind, reportKind, type ActionEvaluation, type ActionFollowUp, type CorrectiveAction, type Diffusion, type InvestigationStore, type RoadCase, type Stage } from "./road-investigations"
import { visibleFields, type Catalogs, type RecordItem, type Values } from "./planning"

type Row = Record<string, unknown> & { id: string }
type Related = Record<string, unknown>
type Dated = { CreatedAt?: string; createdAt?: string; recordedAt?: string }
type Detail = {
  record: Row
  stages: (Omit<Stage, "details" | "recordedAt"> & Dated)[]
  actions: (Omit<CorrectiveAction, "workActivityId" | "followUps" | "evaluations"> & { planActivityId?: string; links?: Related })[]
  followUps: (Omit<ActionFollowUp, "notes" | "recordedAt"> & Dated & { actionId: string; observations: string })[]
  evaluations: (Omit<ActionEvaluation, "followUpId" | "recordedAt"> & Dated & { actionId: string; followUpId?: string })[]
  diffusions: (Omit<Diffusion, "recordedAt"> & Dated)[]
  history: { createdAt: string; event: string; snapshot?: unknown }[]
}
const stamp = (row: Dated) => row.recordedAt ?? row.createdAt ?? row.CreatedAt ?? ""
const optionalList = async (resource: PesvResource, query = "") => {
  try { return await listPesv<Row>(pesvPath(resource) + query) } catch { return [] }
}
export async function investigationCatalogs(empty: Catalogs) {
  const [catalog, diagnoses, risks, plans, work, committees, leaders] = await Promise.all([
    pesvRequest<Related>("/api/pesv/road-investigations/catalogs"),
    optionalList("diagnoses"), optionalList("roadRisks"), listPesv<Row>("/api/emergency-management?status=ACTIVE").catch(() => []),
    optionalList("workActivities"), optionalList("committee", "?status=CURRENT"), optionalList("responsible", "?status=CURRENT"),
  ])
  const profiles = await Promise.all(diagnoses.map(d => getPesv<Row>("diagnoses", d.id).catch(() => null)))
  const people = catalogOptions(catalog.employees)
  const members = Array.isArray(committees[0]?.members) ? committees[0].members as { employeeId: string }[] : []
  return {
    catalogs: {
      ...empty, people, procedures: catalogOptions(catalog.procedures), risks: catalogOptions(risks),
      emergencyPlans: catalogOptions(plans.filter(plan => plan.status === "ACTIVE").map(plan => ({ ...plan, name: plan.planName }))),
      workActivities: catalogOptions(work.filter(row => ["PENDING", "IN_PROGRESS"].includes(String(row.status)))),
      routes: catalogOptions(profiles.flatMap(d => Array.isArray(d?.routes) ? d.routes.map(r => ({ ...r, name: `${r.origin} → ${r.destination}` })) : [])),
      vehicles: catalogOptions(profiles.flatMap(d => Array.isArray(d?.vehicles) ? d.vehicles.map(v => ({ ...v, name: `${v.plate} · ${v.vehicleType}` })) : [])),
    },
    csvPeople: members.length ? people.filter(p => members.some(m => m.employeeId === p.value)) : people,
    leaderId: String(leaders[0]?.employeeId ?? ""),
  }
}
export function investigationPayload(values: Values, procedureId: string, external: RoadCase["externalInvestigators"], version?: number) {
  return {
    ...Object.fromEntries(reportKind.fields.filter(f => values[f.key] !== "" && values[f.key] !== undefined).map(f => [f.key, values[f.key]])),
    procedureId, externalInvestigators: external.map(({ name, organization, role }) => ({ name, organization, ...(role ? { role } : {}) })),
    ...(version !== undefined ? { version, emergencyPlanId: values.emergencyPlanId || null, laborReference: values.laborReference || null } : {}),
  }
}
export function procedurePayload(values: Values, recordVersion?: number) {
  return { ...Object.fromEntries(visibleFields(procedureKind, values).map(f => [f.key, values[f.key]])), ...(recordVersion !== undefined ? { recordVersion } : {}) }
}
// This API currently stores only notes. Keep the individual form fields reversible in that text.
const detailSeparator = "\n\n--- Detalles SafeCloud ---\n"
export function stagePayload(stage: Stage) {
  const notes = Object.keys(stage.details).length ? stage.notes + detailSeparator + JSON.stringify(stage.details) : stage.notes
  return { key: stage.key, date: stage.date, authorId: stage.authorId, notes, ...(stage.version !== undefined ? { version: stage.version } : {}) }
}
function stageFrom(row: Detail["stages"][number]): Stage {
  const i = row.notes.lastIndexOf(detailSeparator)
  if (i >= 0) try {
    const details = JSON.parse(row.notes.slice(i + detailSeparator.length))
    if (details && typeof details === "object" && !Array.isArray(details) && Object.values(details).every(v => typeof v === "string")) {
      return { ...row, notes: row.notes.slice(0, i), details, recordedAt: stamp(row) }
    }
  } catch { /* Older notes need not contain structured details. */ }
  return { ...row, details: {}, recordedAt: stamp(row) }
}
export async function investigationCase(id: string, catalogs: Catalogs, procedures: RecordItem[]): Promise<RoadCase> {
  const [detail, documents] = await Promise.all([getPesv<Detail>("roadInvestigations", id), listPesvDocuments("roadInvestigations", id)])
  const { record } = detail
  const values = valuesOf(record, reportKind)
  const related = (record.links ?? {}) as Related
  const procedureId = String(record.procedureId)
  const people = [related.responsible, related.reporter, related.firstResponder, ...(Array.isArray(related.people) ? related.people : []), ...(Array.isArray(related.investigators) ? related.investigators : []), ...detail.stages.map(s => (s as { authorSnapshot?: unknown }).authorSnapshot), ...detail.actions.map(a => a.links?.responsible)].filter(Boolean)
  const links = snapshotLinks(reportKind, values, {
    ...catalogs, people: [...catalogs.people, ...catalogOptions(people)],
    routes: [...catalogs.routes, ...catalogOptions(Array.isArray(related.routes) ? related.routes.map(r => ({ ...r, name: `${r.origin} → ${r.destination}` })) : [])],
    vehicles: [...catalogs.vehicles, ...catalogOptions(Array.isArray(related.vehicles) ? related.vehicles.map(v => ({ ...v, name: v.plate })) : [])],
    risks: [...catalogs.risks, ...catalogOptions(related.risks)],
    emergencyPlans: [...catalogs.emergencyPlans, ...catalogOptions(related.emergencyPlan ? [related.emergencyPlan] : [])],
  })
  links.people = catalogOptions(people)
  const actions = detail.actions.map(action => {
    const followUps = detail.followUps.filter(f => f.actionId === action.id).map(f => ({ ...f, notes: f.observations, recordedAt: stamp(f) }))
    const evaluations = detail.evaluations.filter(e => e.actionId === action.id).map(e => ({
      ...e, recordedAt: stamp(e), followUpId: e.followUpId ?? followUps.filter(f => f.progress === 100 && (stamp(f) && stamp(e) ? stamp(f) <= stamp(e) : f.date <= e.date)).at(-1)?.id ?? "",
    }))
    return { ...action, workActivityId: action.planActivityId ?? "", followUps, evaluations }
  })
  return {
    id, consecutive: String(record.consecutive), values, procedureId,
    procedureSnapshot: valuesOf({ ...procedures.find(p => p.id === procedureId)?.values, ...(related.procedure as Related | undefined) }, procedureKind),
    externalInvestigators: (Array.isArray(record.externalInvestigators) ? record.externalInvestigators : []).map((p, i) => ({ ...p, id: `external-${i}`, organization: p.organization ?? "" })),
    links, actions, stages: detail.stages.map(stageFrom), diffusions: detail.diffusions.map(d => ({ ...d, recordedAt: stamp(d) })),
    evidence: documents.map(d => ({ id: d.id, name: d.fileName, mime: d.mimeType, uploadedAt: d.uploadedAt, targetId: d.targetId, url: pesvDocumentUrl("roadInvestigations", id, d.id) })),
    createdAt: String(record.createdAt ?? ""), updatedAt: String(record.updatedAt ?? ""), version: Number(record.version),
    closedAt: typeof record.closedAt === "string" ? record.closedAt : undefined,
    history: [...detail.history].reverse().map(h => ({ at: h.createdAt, event: h.event, data: h.snapshot })),
  }
}
export async function investigationRecords(catalogs: Catalogs): Promise<InvestigationStore> {
  const [procedureRows, cases] = await Promise.all([listPesv<Row>(pesvPath("investigationProcedures")), listPesv<Row>(pesvPath("roadInvestigations"))])
  const procedures = await Promise.all(procedureRows.map(async ({ id }) => {
    const row = await getPesv<Row>("investigationProcedures", id)
    const values = valuesOf(row, procedureKind)
    const history = Array.isArray(row.history) ? row.history : []
    return { id, kind: procedureKind.id, values, remoteVersion: Number(row.recordVersion), activities: [], entries: [], evidence: [], links: snapshotLinks(procedureKind, values, catalogs), createdAt: String(row.createdAt ?? ""), updatedAt: String(row.updatedAt ?? ""), history: [...history].reverse().map(h => ({ at: h.createdAt, action: h.event, snapshot: h.snapshot ? valuesOf(h.snapshot, procedureKind) : undefined })) } satisfies RecordItem
  }))
  return { procedures, cases: await Promise.all(cases.map(({ id }) => investigationCase(id, catalogs, procedures))), sequences: {} }
}
export async function closeInvestigationIfReady(record: RoadCase) {
  if (!record.closedAt && closureAllowed(record)) await pesvRequest(`${pesvPath("roadInvestigations", record.id)}/close`, "PUT")
}
