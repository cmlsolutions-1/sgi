import { getPesv, listPesv, listPesvDocuments, pesvDocumentUrl, pesvPath, pesvRequest, savePesv, type PesvResource } from "@/services/pesvService"
import { configs, text, visibleFields, type Activity, type Catalogs, type Entry, type Kind, type Option, type PesvModule, type RecordItem, type Values } from "./planning"
import { objectiveCatalogs, objectivePayload, objectiveRecords } from "./objectives-api"

const resources: Record<string, PesvResource> = {
  objective: "objectives", program: "programs", "work-activity": "workActivities", competency: "competencies",
  "training-activity": "trainingActivities", procedure: "behaviorProcedures", "behavior-evaluation": "behaviorEvaluations",
  "emergency-plan": "emergencyPlans", "road-drill": "roadDrills",
  "road-protocol": "roadProtocols", "managed-road": "managedRoads", "road-action": "roadActions",
  "road-inspection": "roadInspections", "road-maintenance": "roadMaintenance", "road-incident": "roadIncidents",
}
export function isPlanningApiModule(module: PesvModule) { return ["objectives", "programs", "work-plan", "training", "behavior", "emergencies", "managed-roads"].includes(module) }
export function planningResource(kind: string): PesvResource {
  const resource = resources[kind]
  if (!resource) throw new Error("Tipo de registro PESV no integrado")
  return resource
}
export function valuesOf(record: Record<string, unknown>, kind: Kind): Values {
  return Object.fromEntries(kind.fields.map(field => [field.key, Array.isArray(record[field.key]) ? (record[field.key] as unknown[]).map(String) : record[field.key] == null ? (field.multiple ? [] : "") : String(record[field.key])]))
}
export function catalogOptions(value: unknown): Option[] {
  if (!Array.isArray(value)) return []
  return value.filter((row): row is Record<string, unknown> => !!row && typeof row === "object").map(row => ({ value: String(row.value ?? row.id), label: String(row.label ?? row.employeeName ?? [row.name, row.lastName].filter(Boolean).join(" ")), ...(row.description ? { description: String(row.description) } : {}), ...(row.year != null ? { year: String(row.year) } : {}), ...(typeof row.eligible === "boolean" ? { eligible: row.eligible } : typeof row.currentRiskNumber === "number" ? { eligible: row.currentRiskNumber >= 6 } : {}) }))
}
export async function planningCatalogs(module: PesvModule, empty: Catalogs): Promise<Catalogs> {
  if (module === "objectives") return objectiveCatalogs(empty)
  if (!isPlanningApiModule(module)) throw new Error("Módulo no integrado")
  const remote = await pesvRequest<Record<string, unknown>>(`/api/pesv/${module}/catalogs`)
  return Object.fromEntries(Object.keys(empty).map(key => [key, catalogOptions(remote[key])])) as Catalogs
}
function referenceLinks(record: Record<string, unknown>, kind: Kind, catalogs: Catalogs): Record<string, Option[]> {
  const aliases: Record<string, string[]> = { riskIds: ["risks"], objectiveIds: ["relatedObjectives", "objectives"], responsibleIds: ["responsibles"], policyId: ["policy"], programIds: ["programs"], responsibleId: ["responsible"], personId: ["person"], evaluatorId: ["evaluator"], trainerId: ["trainer"], routeIds: ["routes"], responderIds: ["responders"], trainingIds: ["trainingActivities"], participantIds: ["participants"], planId: ["plan"], protocolId: ["protocol"], roadId: ["road"], workActivityId: ["workActivity"], inspectorId: ["inspector"], affectedIds: ["affectedPeople"], investigationId: ["investigation"] }
  const links = (record.links ?? {}) as Record<string, unknown>
  return Object.fromEntries(kind.fields.filter(field => field.reference).map(field => {
    const raw = record[field.key], ids = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : []
    const related = aliases[field.key]?.map(key => links[key] ?? record[key]).find(Boolean)
    const snapshots = catalogOptions(Array.isArray(related) ? related : related ? [related] : [])
    return [field.key, ids.map(id => snapshots.find(option => option.value === id) ?? catalogs[field.reference!].find(option => option.value === id) ?? { value: id, label: String(record[field.key.replace(/Id$/, "Name")] ?? id) })]
  }))
}
export async function planningRecords(module: PesvModule, catalogs: Catalogs): Promise<RecordItem[]> {
  if (module === "objectives") return objectiveRecords()
  const results = await Promise.all(configs[module].kinds.map(async kind => {
    const resource = planningResource(kind.id)
    const records = await listPesv<{ id: string; status?: string }>(pesvPath(resource))
    const visible = module === "emergencies" || module === "managed-roads" ? records.filter(record => record.status !== "ARCHIVED") : records
    return Promise.all(visible.map(async item => {
      const record = await getPesv<Record<string, unknown> & { id: string }>(resource, item.id)
      const [documents, entries] = await Promise.all([listPesvDocuments(resource, item.id), kind.tracking || kind.annualReview || kind.diffusion ? listPesv<Entry>(`${pesvPath(resource, item.id)}/entries`) : []])
      const activities = Array.isArray(record.activities) ? record.activities as Record<string, unknown>[] : []
      const history = Array.isArray(record.history) ? record.history as Record<string, unknown>[] : []
      return {
        id: record.id, kind: kind.id, values: valuesOf(record, kind),
        remoteVersion: Number(record.recordVersion ?? record.version), remoteStatus: String(record.status), ...(typeof record.progress === "number" ? { remoteProgress: record.progress } : {}),
        createdAt: String(record.createdAt), updatedAt: String(record.updatedAt), entries: [...entries].sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt ?? "").localeCompare(b.createdAt ?? "")),
        links: referenceLinks(record, kind, catalogs),
        activities: activities.map(activity => ({ id: String(activity.id), name: String(activity.name), responsibleId: String(activity.responsibleId), responsible: String(activity.responsibleNameSnapshot ?? catalogs.people.find(p => p.value === activity.responsibleId)?.label ?? activity.responsibleId), startDate: String(activity.startDate), endDate: String(activity.endDate), budget: String(activity.budget ?? 0), status: String(activity.status), observations: String(activity.observations ?? "") })),
        evidence: documents.map(document => ({ id: document.id, name: document.fileName, mime: document.mimeType, uploadedAt: document.uploadedAt, targetId: document.targetId, url: pesvDocumentUrl(resource, record.id, document.id) })),
        history: history.map(event => ({ at: String(event.at ?? event.createdAt), action: String(event.action ?? event.event), ...(event.snapshot && typeof event.snapshot === "object" ? { snapshot: valuesOf(event.snapshot as Record<string, unknown>, kind) } : {}) })),
      } satisfies RecordItem
    }))
  }))
  return results.flat()
}
export function planningPayload(kind: Kind, values: Values, activities: Activity[], catalogs: Catalogs, version?: number) {
  if (kind.id === "objective") return objectivePayload(values, version)
  const payload: Record<string, unknown> = Object.fromEntries(visibleFields(kind, values).map(field => [field.key, ["number", "year", "money"].includes(field.type ?? "") && values[field.key] !== "" ? Number(values[field.key]) : values[field.key]]))
  const operational = ["emergencyPlans", "roadDrills", "roadProtocols", "managedRoads", "roadActions", "roadInspections", "roadMaintenance", "roadIncidents"].includes(resources[kind.id])
  if (operational) for (const field of kind.fields) {
    if (field.multiple && !Array.isArray(payload[field.key])) payload[field.key] = []
    if (field.reference && !field.multiple && !field.required && payload[field.key] === "") {
      if (version === undefined) delete payload[field.key]
      else payload[field.key] = null
    }
  }
  if (version !== undefined) payload[operational || kind.id === "procedure" || kind.id === "behavior-evaluation" ? "recordVersion" : "version"] = version
  if (kind.activities) payload.activities = activities.map(activity => {
    if (Number(activity.budget) !== 0) throw new Error("El backend aún no admite presupuesto por actividad del cronograma. No se guardará descartando ese dato; solicita agregar budget al contrato de actividades.")
    const matches = catalogs.people.filter(person => person.value === activity.responsible || person.label === activity.responsible)
    const responsibleId = activity.responsibleId || (matches.length === 1 ? matches[0].value : undefined)
    if (!responsibleId) throw new Error("Selecciona un funcionario del catálogo como responsable de cada actividad del cronograma")
    return { name: activity.name.trim(), responsibleId, startDate: activity.startDate, endDate: activity.endDate, status: activity.status ?? "PENDING", ...(activity.observations ? { observations: activity.observations } : {}) }
  })
  return payload
}
export function planningEntryPayload(kind: string, entry: Entry) {
  const { id: ignored, ...payload } = entry
  return kind === "work-activity" && entry.kind === "FOLLOW_UP" ? { ...payload, measuredValue: entry.progress } : payload
}
export async function syncManagedRoadInspection(inspection: RecordItem) {
  const roadId = text(inspection.values.roadId)
  const nextInspectionDate = text(inspection.values.nextInspectionDate)
  if (!roadId || !nextInspectionDate) return
  const road = await getPesv<{ recordVersion: number; nextInspectionDate: string }>("managedRoads", roadId)
  if (road.nextInspectionDate === nextInspectionDate) return
  const inspections = await listPesv<{ id: string; roadId: string; inspectionDate: string; evidenceCount: number; status: string }>(pesvPath("roadInspections"))
  if (inspections.some(item => item.id !== inspection.id && item.roadId === roadId && item.status !== "ARCHIVED" && item.evidenceCount > 0 && item.inspectionDate > text(inspection.values.inspectionDate))) return
  await savePesv("managedRoads", { nextInspectionDate, recordVersion: road.recordVersion }, roadId)
}
