import { apiFetch } from "@/lib/apiClient"
import type {
  SstObjective,
  SstObjectiveDiffusion,
  SstObjectiveDocument,
  SstObjectiveFilters,
  SstObjectiveFollowUp,
  SstObjectiveList,
  SstObjectiveSummary,
  UploadSstObjectiveDocumentDto,
  UpsertSstObjectiveDiffusionDto,
  UpsertSstObjectiveDto,
  UpsertSstObjectiveFollowUpDto,
} from "@/types/manager/sst-objective"

type ApiErrorResponse = { ok?: boolean; message?: string; errors?: Array<{ message?: string }> | null; data?: unknown }

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
  if (!res.ok || json?.ok === false || !json) {
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }
  return json.data as T
}

function buildQuery(filters: SstObjectiveFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

function documentFormData(dto: UploadSstObjectiveDocumentDto) {
  const data = new FormData()
  data.append("file", dto.file)
  if (dto.type?.trim()) data.append("type", dto.type.trim())
  data.append("isConfirmed", String(dto.isConfirmed ?? true))
  if (dto.observation?.trim()) data.append("observation", dto.observation.trim())
  if (dto.description?.trim()) data.append("description", dto.description.trim())
  return data
}

export async function listSstObjectives(filters?: SstObjectiveFilters): Promise<SstObjectiveList> {
  const res = await apiFetch(`/api/sst-objectives${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<SstObjectiveList>(res, "No se pudieron cargar los objetivos SST")
}

export async function getSstObjectiveSummary(): Promise<SstObjectiveSummary> {
  const res = await apiFetch("/api/sst-objectives/summary", { method: "GET" })
  return parseOrThrow<SstObjectiveSummary>(res, "No se pudieron cargar los indicadores")
}

export async function getSstObjective(id: string): Promise<SstObjective> {
  const res = await apiFetch(`/api/sst-objectives/${id}`, { method: "GET" })
  return parseOrThrow<SstObjective>(res, "No se pudo cargar el objetivo SST")
}

export async function createSstObjective(dto: UpsertSstObjectiveDto): Promise<SstObjective> {
  const res = await apiFetch("/api/sst-objectives", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow<SstObjective>(res, "No se pudo crear el objetivo SST")
}

export async function updateSstObjective(id: string, dto: UpsertSstObjectiveDto): Promise<SstObjective> {
  const res = await apiFetch(`/api/sst-objectives/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow<SstObjective>(res, "No se pudo actualizar el objetivo SST")
}

export async function deleteSstObjective(id: string): Promise<void> {
  const res = await apiFetch(`/api/sst-objectives/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el objetivo SST")
}

export async function createSstObjectiveFollowUp(objectiveId: string, dto: UpsertSstObjectiveFollowUpDto): Promise<SstObjectiveFollowUp> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/follow-ups`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow<SstObjectiveFollowUp>(res, "No se pudo registrar el seguimiento")
}

export async function listSstObjectiveFollowUps(objectiveId: string): Promise<SstObjectiveFollowUp[]> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/follow-ups`, { method: "GET" })
  return parseOrThrow<SstObjectiveFollowUp[]>(res, "No se pudieron cargar los seguimientos")
}

export async function updateSstObjectiveFollowUp(objectiveId: string, followUpId: string, dto: UpsertSstObjectiveFollowUpDto): Promise<SstObjectiveFollowUp> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/follow-ups/${followUpId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow<SstObjectiveFollowUp>(res, "No se pudo actualizar el seguimiento")
}

export async function deleteSstObjectiveFollowUp(objectiveId: string, followUpId: string): Promise<void> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/follow-ups/${followUpId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el seguimiento")
}

export async function createSstObjectiveDiffusion(objectiveId: string, dto: UpsertSstObjectiveDiffusionDto): Promise<SstObjectiveDiffusion> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/diffusions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow<SstObjectiveDiffusion>(res, "No se pudo registrar la difusión")
}

export async function listSstObjectiveDiffusions(objectiveId: string): Promise<SstObjectiveDiffusion[]> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/diffusions`, { method: "GET" })
  return parseOrThrow<SstObjectiveDiffusion[]>(res, "No se pudieron cargar las difusiones")
}

export async function updateSstObjectiveDiffusion(objectiveId: string, diffusionId: string, dto: UpsertSstObjectiveDiffusionDto): Promise<SstObjectiveDiffusion> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/diffusions/${diffusionId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow<SstObjectiveDiffusion>(res, "No se pudo actualizar la difusión")
}

export async function deleteSstObjectiveDiffusion(objectiveId: string, diffusionId: string): Promise<void> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/diffusions/${diffusionId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la difusión")
}

export async function uploadSstObjectiveFollowUpDocument(objectiveId: string, followUpId: string, dto: UploadSstObjectiveDocumentDto): Promise<SstObjectiveDocument> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/follow-ups/${followUpId}/documents`, { method: "POST", body: documentFormData(dto) })
  return parseOrThrow<SstObjectiveDocument>(res, "No se pudo cargar la evidencia del seguimiento")
}

export async function listSstObjectiveFollowUpDocuments(objectiveId: string, followUpId: string): Promise<SstObjectiveDocument[]> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/follow-ups/${followUpId}/documents`, { method: "GET" })
  return parseOrThrow<SstObjectiveDocument[]>(res, "No se pudieron cargar las evidencias del seguimiento")
}

export async function uploadSstObjectiveDiffusionDocument(objectiveId: string, diffusionId: string, dto: UploadSstObjectiveDocumentDto): Promise<SstObjectiveDocument> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/diffusions/${diffusionId}/documents`, { method: "POST", body: documentFormData(dto) })
  return parseOrThrow<SstObjectiveDocument>(res, "No se pudo cargar la evidencia de la difusión")
}

export async function listSstObjectiveDiffusionDocuments(objectiveId: string, diffusionId: string): Promise<SstObjectiveDocument[]> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/diffusions/${diffusionId}/documents`, { method: "GET" })
  return parseOrThrow<SstObjectiveDocument[]>(res, "No se pudieron cargar las evidencias de la difusión")
}

export async function getSstObjectiveDocument(objectiveId: string, documentId: string): Promise<SstObjectiveDocument> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/documents/${documentId}`, { method: "GET" })
  return parseOrThrow<SstObjectiveDocument>(res, "No se pudo cargar la evidencia")
}

export async function deleteSstObjectiveDocument(objectiveId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/sst-objectives/${objectiveId}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la evidencia")
}

export async function downloadSstObjectiveDocument(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  if (!res.ok) throw new Error("No se pudo descargar la evidencia")
  return res.blob()
}
