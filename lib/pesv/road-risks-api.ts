import { getPesv, listPesv, listPesvDocuments, pesvDocumentUrl, pesvPath, pesvRequest } from "@/services/pesvService"

export type Level = 1 | 2 | 3
export type Status = "PENDIENTE" | "EN_EJECUCION" | "CONTROLADO"
export type RiskEvidence = { id: string; name: string; url: string; mime: string; date: string; targetId?: string }
export type RiskReview = { id: string; date: string; observations: string; exposure: Level; probability: Level; status: Status; createdAt?: string }
export type RiskDiagnosis = { id: string; year: number; updateDate: string; collaborators: { id: string; name: string }[]; vehicles: { id: string; plate: string; vehicleType: string }[]; routes: { id: string; origin: string; destination: string }[] }
export type RiskForm = { name: string; activity: string; roadUser: string; journey: string; diagnosisId: string; sourceId: string; sourceLabel: string; sourceType: string; causes: string; consequences: string; existingControls: string; exposure: Level; probability: Level; treatment: string; action: string; responsible: string; dueDate: string }
export type RoadRisk = RiskForm & { id: string; createdAt: string; version: number; status: Status; currentExposure?: Level; currentProbability?: Level; reviews: RiskReview[]; evidence: RiskEvidence[]; history: { date: string; text: string; snapshot?: Record<string, unknown> }[] }
export async function roadRiskCatalogs(): Promise<RiskDiagnosis[]> {
  const result = await pesvRequest<{ diagnoses: RiskDiagnosis[] }>("/api/pesv/road-risks/catalogs")
  if (!Array.isArray(result.diagnoses)) throw new Error("El backend no devolvió el catálogo de diagnósticos")
  return result.diagnoses.map(diagnosis => ({ ...diagnosis, collaborators: diagnosis.collaborators ?? [], vehicles: diagnosis.vehicles ?? [], routes: diagnosis.routes ?? [] }))
}
export async function roadRiskRecords(): Promise<RoadRisk[]> {
  const records = await listPesv<{ id: string }>(pesvPath("roadRisks"))
  return Promise.all(records.map(async ({ id }) => {
    const record = await getPesv<RoadRisk & { history?: Record<string, unknown>[] }>("roadRisks", id)
    const [reviews, documents] = await Promise.all([listPesv<RiskReview>(`${pesvPath("roadRisks", id)}/reviews`), listPesvDocuments("roadRisks", id)])
    const rawHistory = (record.history ?? []) as unknown as Record<string, unknown>[]
    const labels: Record<string, string> = { CREATED: "Riesgo registrado", UPDATED: "Riesgo actualizado", STATUS_CHANGED: "Estado actualizado", REVIEW_CREATED: "Seguimiento registrado", REVIEW_UPDATED: "Seguimiento actualizado", DOCUMENT_UPLOADED: "Evidencia cargada", DOCUMENT_DOWNLOADED: "Evidencia consultada", DOCUMENT_REMOVED: "Evidencia eliminada", PDF_EXPORTED: "Matriz exportada" }
    return { ...record, diagnosisId: record.diagnosisId ?? "", sourceId: record.sourceId ?? "", sourceLabel: record.sourceLabel ?? "", reviews: [...reviews].sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt ?? "").localeCompare(b.createdAt ?? "")),
      evidence: documents.map(document => ({ id: document.id, name: document.fileName, url: pesvDocumentUrl("roadRisks", id, document.id), mime: document.mimeType, date: document.uploadedAt, targetId: document.targetId })),
      history: rawHistory.map(event => ({ date: String(event.createdAt ?? event.date), text: labels[String(event.event)] ?? String(event.text ?? event.event), ...(event.snapshot && typeof event.snapshot === "object" ? { snapshot: event.snapshot as Record<string, unknown> } : {}) })),
    }
  }))
}
export function roadRiskPayload(form: RiskForm, version?: number) {
  const { sourceLabel: ignored, diagnosisId, sourceId, ...payload } = form
  // Only editable DTO fields are sent, even when the edit form came from a detail response.
  const keys = ["name", "activity", "roadUser", "journey", "sourceType", "causes", "consequences", "existingControls", "exposure", "probability", "treatment", "action", "responsible", "dueDate"]
  return { ...Object.fromEntries(keys.map(key => [key, payload[key as keyof typeof payload]])), ...(diagnosisId ? { diagnosisId } : {}), ...(sourceId ? { sourceId } : {}), ...(version === undefined ? {} : { version }) }
}
