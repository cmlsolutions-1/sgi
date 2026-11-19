import { getPesv, listPesv, listPesvDocuments, pesvDocumentUrl, pesvPath, pesvRequest, savePesv, type PesvResource } from "@/services/pesvService"
import { configs, text, visibleFields, type Activity, type Catalogs, type Entry, type Kind, type Option, type PesvModule, type RecordItem, type Values } from "./planning"
import { objectiveCatalogs, objectivePayload, objectiveRecords } from "./objectives-api"
import { checksStatus, contractorChecks } from "./operations"

const resources: Record<string, PesvResource> = {
  objective: "objectives", program: "programs", "work-activity": "workActivities", competency: "competencies",
  "training-activity": "trainingActivities", procedure: "behaviorProcedures", "behavior-evaluation": "behaviorEvaluations",
  "emergency-plan": "emergencyPlans", "road-drill": "roadDrills",
  "road-protocol": "roadProtocols", "managed-road": "managedRoads", "road-action": "roadActions",
  "road-inspection": "roadInspections", "road-maintenance": "roadMaintenance", "road-incident": "roadIncidents",
  "journey-procedure": "journeyProcedures", journey: "journeys",
  "inspection-procedure": "inspectionProcedures", "vehicle-profile": "vehicleProfiles",
  "vehicle-inspection": "vehicleInspections", "vehicle-maintenance": "vehicleMaintenance",
  "change-procedure": "changeProcedures", change: "changes", contractor: "contractors", "contractor-check": "contractorChecks",
  "archive-procedure": "archiveProcedures", "archive-record": "archiveRecords", "archive-review": "archiveReviews",
  "statistical-event": "statisticalEvents", "statistical-analysis": "statisticalAnalyses", "loss-matrix": "lossMatrices",
  "audit-procedure": "auditProcedures", "pesv-audit": "pesvAudits", "audit-finding": "auditFindings",
}
export function isPlanningApiModule(module: PesvModule) { return ["objectives", "programs", "work-plan", "training", "behavior", "emergencies", "managed-roads", "journeys", "vehicle-inspections", "change-contractors", "document-retention", "statistics", "audits"].includes(module) }
const checkAliases: Record<string, Record<string, string>> = {
  "vehicle-inspection": { registration: "transitLicense", technical: "technicalInspection", license: "drivingLicense", identity: "identityDocument", lights: "lightsAndSignals", tires: "tiresAndSpare", fluids: "fluidsAndLevels", belts: "seatBelts", wipers: "windshieldWipers", safetyKit: "safetyEquipment" },
  "contractor-check": { pesv: "contractorPesv", validDocuments: "currentDocuments", training: "pesvTraining", controls: "operationalControls", reporting: "accidentReporting", health: "healthReporting" },
}
function recordFields(record: Record<string, unknown>, kind: Kind) {
  const result = { ...record }
  const checks = (record.checks ?? {}) as Record<string, unknown>
  for (const [ui, api] of Object.entries(checkAliases[kind.id] ?? {})) result[`check_${ui}`] = record[`check_${api}`] ?? checks[`check_${api}`] ?? checks[api]
  for (const field of kind.fields.filter(field => field.key.startsWith("check_"))) {
    result[field.key] ??= checks[field.key] ?? checks[field.key.replace("check_", "")]
  }
  if (kind.id === "archive-review" && typeof record.findings === "string") {
    const [findings, inventorySnapshot] = record.findings.split("\n\n--- Inventario SafeCloud ---\n")
    result.findings = findings
    if (inventorySnapshot) result.inventorySnapshot = inventorySnapshot
  }
  return result
}
export async function verificationToken(values: Record<string, unknown>, followUpId = "") {
  const snapshot = JSON.stringify([followUpId, ...["efficacy", "evaluatorId", "verificationDate", "verificationNotes"].map(key => values[key] ?? "")])
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(snapshot))
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("")
}
export async function planningDocumentTarget(record: RecordItem, targetId?: string) {
  if (record.kind === "audit-finding" && targetId?.startsWith("VERIFICATION:")) {
    const entryId = record.entries.filter(e => e.kind === "FOLLOW_UP").at(-1)?.id
    return { targetId: entryId, description: `SafeCloud:verificacion:${await verificationToken(record.values, entryId)}` }
  }
  return { targetId, description: "" }
}
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
  return value.filter((row): row is Record<string, unknown> => !!row && typeof row === "object").map(row => ({ value: String(row.value ?? row.id), label: String(row.label ?? row.employeeName ?? ([row.name, row.lastName].filter(Boolean).join(" ") || row.plate || [row.origin, row.destination].filter(Boolean).join(" → "))), ...(row.description ? { description: String(row.description) } : {}), ...(row.year != null ? { year: String(row.year) } : {}), ...(typeof row.eligible === "boolean" ? { eligible: row.eligible } : typeof row.currentRiskNumber === "number" ? { eligible: row.currentRiskNumber >= 6 } : {}) }))
}
export async function planningCatalogs(module: PesvModule, empty: Catalogs): Promise<Catalogs> {
  if (module === "objectives") return objectiveCatalogs(empty)
  if (!isPlanningApiModule(module)) throw new Error("Módulo no integrado")
  const remote = await pesvRequest<Record<string, unknown>>(`/api/pesv/${module}/catalogs`)
  return Object.fromEntries(Object.keys(empty).map(key => [key, catalogOptions(remote[key])])) as Catalogs
}
function referenceLinks(record: Record<string, unknown>, kind: Kind, catalogs: Catalogs): Record<string, Option[]> {
  const aliases: Record<string, string[]> = { riskIds: ["risks"], objectiveIds: ["relatedObjectives", "objectives"], responsibleIds: ["responsibles"], policyId: ["policy"], programIds: ["programs"], responsibleId: ["responsible"], personId: ["person"], evaluatorId: ["evaluator"], trainerId: ["trainer"], routeIds: ["routes"], responderIds: ["responders"], trainingIds: ["trainingActivities"], participantIds: ["participants"], planId: ["plan"], protocolId: ["protocol"], roadId: ["road"], workActivityId: ["workActivity"], inspectorId: ["inspector"], affectedIds: ["affectedPeople"], investigationId: ["investigation"], investigatorIds: ["investigators"], investigationIds: ["investigations"], vehicleId: ["vehicle"], vehicleIds: ["vehicles"], vehicleProfileId: ["vehicleProfile"], diagnosisVehicleId: ["diagnosisVehicle"], driverId: ["driver"], driverIds: ["drivers"], supervisorId: ["supervisor"], supervisorIds: ["supervisors"], controllerId: ["controller"], inspectorIds: ["inspectors"], custodianId: ["custodian"], reviewerIds: ["reviewers"], auditorIds: ["auditors"], competencyIds: ["competencies"], procedureId: ["procedure"], auditId: ["audit"], contractorId: ["contractor"], workActivityIds: ["workActivities"] }
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
    const visible = records.filter(record => record.status !== "ARCHIVED")
    return Promise.all(visible.map(async item => {
      const rawRecord = await getPesv<Record<string, unknown> & { id: string }>(resource, item.id)
      const record: Record<string, unknown> & { id: string } = { ...recordFields(rawRecord, kind), id: rawRecord.id }
      const [documents, entries] = await Promise.all([listPesvDocuments(resource, item.id), kind.tracking || kind.annualReview || kind.diffusion ? listPesv<Entry>(`${pesvPath(resource, item.id)}/entries`) : []])
      const orderedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))
      const token = kind.id === "audit-finding" ? await verificationToken(record, orderedEntries.filter(e => e.kind === "FOLLOW_UP").at(-1)?.id) : ""
      if (token) record.verificationToken = token
      const activities = Array.isArray(record.activities) ? record.activities as Record<string, unknown>[] : []
      const history = Array.isArray(record.history) ? record.history as Record<string, unknown>[] : []
      return {
        id: record.id, kind: kind.id, values: { ...valuesOf(record, kind), ...Object.fromEntries(["verificationToken", "inventorySnapshot", "matrixSnapshot", "statisticsSnapshot"].filter(key => record[key] != null).map(key => [key, String(record[key])])) },
        remoteVersion: Number(record.recordVersion ?? record.version), remoteStatus: String(record.status), ...(typeof record.progress === "number" ? { remoteProgress: record.progress } : {}),
        createdAt: String(record.createdAt), updatedAt: String(record.updatedAt), entries: orderedEntries,
        links: referenceLinks(record, kind, catalogs),
        activities: activities.map(activity => ({ id: String(activity.id), name: String(activity.name), responsibleId: String(activity.responsibleId), responsible: String(activity.responsibleNameSnapshot ?? catalogs.people.find(p => p.value === activity.responsibleId)?.label ?? activity.responsibleId), startDate: String(activity.startDate), endDate: String(activity.endDate), budget: String(activity.budget ?? 0), status: String(activity.status), observations: String(activity.observations ?? "") })),
        evidence: documents.map(document => ({ id: document.id, name: document.fileName, mime: document.mimeType, uploadedAt: document.uploadedAt, targetId: token && document.description === `SafeCloud:verificacion:${token}` ? `VERIFICATION:${token}` : document.targetId, url: pesvDocumentUrl(resource, record.id, document.id) })),
        history: history.map(event => ({ at: String(event.at ?? event.createdAt), action: String(event.action ?? event.event), ...(event.snapshot && typeof event.snapshot === "object" ? { snapshot: valuesOf(event.snapshot as Record<string, unknown>, kind) } : {}) })),
      } satisfies RecordItem
    }))
  }))
  return results.flat()
}
export function planningPayload(kind: Kind, values: Values, activities: Activity[], catalogs: Catalogs, version?: number) {
  if (kind.id === "objective") return objectivePayload(values, version)
  const payload: Record<string, unknown> = Object.fromEntries(visibleFields(kind, values).filter(field => !field.readOnly).map(field => [field.key, ["number", "year", "money"].includes(field.type ?? "") && values[field.key] !== "" ? Number(values[field.key]) : values[field.key]]))
  if (kind.id === "archive-review" && values.inventorySnapshot) payload.findings = `${values.findings}\n\n--- Inventario SafeCloud ---\n${values.inventorySnapshot}`
  const operational = !["objective", "program", "work-activity", "competency", "training-activity", "procedure", "behavior-evaluation"].includes(kind.id)
  if (operational) for (const field of kind.fields) {
    if (field.multiple && !Array.isArray(payload[field.key])) payload[field.key] = []
    if (field.reference && !field.multiple && !field.required && payload[field.key] === "") {
      if (version === undefined) delete payload[field.key]
      else payload[field.key] = null
    }
  }
  if (operational) for (const field of kind.fields) {
    if (!field.required && field.type === "date" && payload[field.key] === "") {
      if (version === undefined) delete payload[field.key]
      else payload[field.key] = null
    }
  }
  for (const [ui, api] of Object.entries(checkAliases[kind.id] ?? {})) {
    payload[`check_${api}`] = payload[`check_${ui}`]
    delete payload[`check_${ui}`]
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
export async function planningFieldDefaults(kind: string, key: string, value: string, items: RecordItem[]): Promise<Values> {
  if (kind === "statistical-event" && key === "investigationId" && value) {
    const detail = await getPesv<{ record: Record<string, unknown>; stages: { key: string; notes: string }[] }>("roadInvestigations", value)
    const row = detail.record
    return { name: String(row.name), eventDate: String(row.occurrenceDate), year: String(row.occurrenceDate).slice(0, 4), place: String(row.place), peopleIds: Array.isArray(row.peopleIds) ? row.peopleIds.map(String) : [], source: `Investigación interna: ${row.name}`, immediateCauses: detail.stages.find(s => s.key === "CAUSES")?.notes ?? "", rootCauses: detail.stages.find(s => s.key === "ROOT")?.notes ?? "" }
  }
  if (kind === "vehicle-inspection" && key === "vehicleProfileId") {
    const profile = items.find(i => i.id === value)
    if (!profile) return {}
    return { vehicleType: profile.values.vehicleType, mileage: profile.values.mileage, soatExpiry: profile.values.soatExpiry || profile.values.motorcycleSoatExpiry || "", technicalExpiry: profile.values.technicalExpiry || profile.values.motorcycleTechnicalExpiry || "" }
  }
  if (kind === "vehicle-profile" && key === "diagnosisVehicleId" && value) {
    const diagnoses = await listPesv<{ id: string }>(pesvPath("diagnoses"))
    for (const { id } of diagnoses) {
      const detail = await getPesv<{ vehicles: Record<string, unknown>[] }>("diagnoses", id)
      const vehicle = detail.vehicles.find(row => row.id === value)
      if (vehicle) return {
        ...Object.fromEntries(["plate", "vin", "engineNumber", "mileage", "manufactureDate", "technicalSpecs"].map(k => [k, String(vehicle[k] ?? "")])),
        name: String(vehicle.plate), vehicleType: /moto/i.test(String(vehicle.vehicleType)) ? "Motocicleta" : /bici|no automotor/i.test(String(vehicle.vehicleType)) ? "No automotor" : "Automotor",
        soatExpiry: String(vehicle.soatValidUntil ?? ""), technicalExpiry: String(vehicle.inspectionValidUntil ?? ""),
        motorcycleSoatExpiry: String(vehicle.soatValidUntil ?? ""), motorcycleTechnicalExpiry: String(vehicle.inspectionValidUntil ?? ""),
        maintenancePlan: String(vehicle.preventiveMaintenancePlan ?? ""), accidentHistory: `${vehicle.roadAccidents} siniestros registrados en diagnóstico.`, monthlyKm: String(vehicle.estimatedMonthlyKm ?? 0),
      }
    }
  }
  return {}
}
export function planningEntryPayload(kind: string, entry: Entry) {
  const { id: ignored, ...payload } = entry
  return ["work-activity", "journey", "vehicle-maintenance"].includes(kind) && entry.kind === "FOLLOW_UP" ? { ...payload, measuredValue: entry.measuredValue ?? entry.progress } : payload
}
export async function resetFindingVerification(id: string) {
  const current = await getPesv<{ recordVersion: number }>("auditFindings", id)
  await savePesv("auditFindings", { recordVersion: current.recordVersion, efficacy: "Pendiente", evaluatorId: null, verificationDate: null, verificationNotes: null }, id)
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
export async function syncContractorVerification(check: RecordItem) {
  if (checksStatus(check.values, contractorChecks) !== "Apto") return
  const contractorId = text(check.values.contractorId)
  const nextVerificationDate = text(check.values.nextVerificationDate)
  if (!contractorId || !nextVerificationDate) return
  const contractor = await getPesv<{ recordVersion: number; nextVerificationDate: string }>("contractors", contractorId)
  if (contractor.nextVerificationDate === nextVerificationDate) return
  const checks = await listPesv<{ id: string; contractorId: string; verificationDate: string; evidenceCount: number; status: string }>(pesvPath("contractorChecks"))
  if (checks.some(item => item.id !== check.id && item.contractorId === contractorId && item.status !== "ARCHIVED" && item.evidenceCount > 0 && item.verificationDate > text(check.values.verificationDate))) return
  await savePesv("contractors", { nextVerificationDate, recordVersion: contractor.recordVersion }, contractorId)
}
