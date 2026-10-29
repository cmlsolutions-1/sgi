import { getPesv, listPesv, listPesvDocuments, pesvDocumentUrl, pesvPath, pesvRequest } from "@/services/pesvService"
import { configs, type Catalogs, type Entry, type Option, type RecordItem, type Values } from "./planning"

type RemoteObjective = Record<string, unknown> & { id: string }
function valuesOf(source: Record<string, unknown>): Values {
  return Object.fromEntries(Object.entries(source).filter(([, v]) => typeof v === "string" || typeof v === "number" || Array.isArray(v)).map(([key, v]) => [key, Array.isArray(v) ? v.map(String) : String(v)]))
}
function options(values: unknown): Option[] {
  if (!Array.isArray(values)) return []
  return values.map(value => ({ value: String(value.value ?? value.id), label: String(value.label ?? value.employeeName ?? [value.name, value.lastName].filter(Boolean).join(" ")), description: value.description, eligible: value.eligible, year: value.year === undefined ? undefined : String(value.year) }))
}
export async function objectiveCatalogs(empty: Catalogs): Promise<Catalogs> {
  const remote = await pesvRequest<Record<string, unknown>>("/api/pesv/objectives/catalogs")
  return { ...empty, policies: options(remote.policies), people: options(remote.people) }
}
export async function objectiveRecords(): Promise<RecordItem[]> {
  const records = await listPesv<RemoteObjective>(pesvPath("objectives"))
  return Promise.all(records.map(async item => {
    const record = await getPesv<RemoteObjective>("objectives", item.id)
    const [documents, entries] = await Promise.all([listPesvDocuments("objectives", item.id), listPesv<Entry>(`${pesvPath("objectives", item.id)}/entries`)])
    const history = Array.isArray(record.history) ? record.history as Record<string, unknown>[] : []
    return {
      id: record.id, kind: "objective", values: valuesOf(record.values && typeof record.values === "object" ? record.values as Record<string, unknown> : record),
      remoteVersion: typeof record.version === "number" ? record.version : undefined,
      remoteStatus: typeof record.status === "string" ? record.status : undefined,
      createdAt: String(record.createdAt), updatedAt: String(record.updatedAt),
      links: { policyId: [{ value: String(record.policyId), label: `${record.policyName ?? "Política relacionada"} · ${record.policyVersion ?? ""}` }], responsibleId: [{ value: String(record.responsibleId), label: String(record.responsibleName ?? "Responsable relacionado") }], ...((record.links ?? {}) as RecordItem["links"]) }, activities: [], entries,
      evidence: documents.map(document => ({ id: document.id, name: document.fileName, mime: document.mimeType, uploadedAt: document.uploadedAt, targetId: document.targetId, url: pesvDocumentUrl("objectives", record.id, document.id) })),
      history: history.map(event => ({ at: String(event.at ?? event.createdAt), action: String(event.action ?? event.event), ...(event.snapshot && typeof event.snapshot === "object" ? { snapshot: valuesOf(event.snapshot as Record<string, unknown>) } : {}) })),
    }
  }))
}
export function objectivePayload(values: Values, version?: number) {
  const fields = configs.objectives.kinds[0].fields
  return Object.fromEntries([...Object.entries(values).filter(([, value]) => value !== "").map(([key, value]) => [key, ["number", "year", "money"].includes(fields.find(f => f.key === key)?.type ?? "") ? Number(value) : value]), ...(version === undefined ? [] : [["version", version]])])
}
