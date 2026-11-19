import { listPesv, listPesvDocuments, pesvDocumentUrl, pesvPath, type PesvResource } from "@/services/pesvService"
import { configs, type Catalogs, type PesvModule } from "./planning"
import { archiveInventory, retentionUntil, type ArchivedEvidence } from "./operations"
import { isPlanningApiModule, planningRecords } from "./planning-api"
import { pesvModuleCatalog } from "./module-catalog"

const extraResources: Record<string, PesvResource[]> = {
  PESV_RESPONSIBLE: ["responsible"], PESV_COMMITTEE: ["committee"], PESV_POLICY: ["policies"],
  PESV_LEADERSHIP: ["leadership"], PESV_DIAGNOSIS: ["diagnoses"], PESV_RISKS: ["roadRisks"],
  PESV_INVESTIGATIONS: ["roadInvestigations"], PESV_INDICATORS: ["indicatorMeasurements", "indicatorReviews", "indicatorReports"],
}
export async function remoteInventory(catalogs: Catalogs, allowedCodes: Set<string>): Promise<ArchivedEvidence[]> {
  const inventory: ArchivedEvidence[] = []
  for (const module of pesvModuleCatalog.filter(item => allowedCodes.has(item.code))) {
    try {
      const slug = module.href.replace("/dashboard/pesv-", "") as PesvModule
      if (slug in configs && isPlanningApiModule(slug)) {
        const records = await planningRecords(slug, catalogs)
        inventory.push(...archiveInventory([{ module: slug, title: module.name, records }]))
      } else for (const resource of extraResources[module.code] ?? []) {
        const rows = await listPesv<{ id: string; name?: string; consecutive?: string; createdAt?: string; status?: string }>(pesvPath(resource))
        for (const row of rows.filter(row => row.status !== "ARCHIVED")) {
          const documents = await listPesvDocuments(resource, row.id)
          inventory.push(...documents.map(document => {
            const date = document.uploadedAt.slice(0, 10)
            return { id: `${resource}:${row.id}:${document.id}`, name: document.fileName, source: `${module.name} · ${row.name ?? row.consecutive ?? ""}`, href: module.href, date, until: retentionUntil(date, 5), years: 5, url: pesvDocumentUrl(resource, row.id, document.id), mime: document.mimeType, uploadedAt: document.uploadedAt }
          }))
        }
      }
    } catch (error) {
      if (!(error && typeof error === "object" && "status" in error && error.status === 403)) throw error
    }
  }
  return inventory
}
export function moduleCodes(nodes: { code: string; children?: { code: string; children?: unknown[] }[] }[]): Set<string> {
  const result = new Set<string>()
  const visit = (nodes: { code: string; children?: unknown[] }[]) => { for (const node of nodes) { result.add(node.code); visit((node.children ?? []) as typeof nodes) } }
  visit(nodes)
  return result
}
