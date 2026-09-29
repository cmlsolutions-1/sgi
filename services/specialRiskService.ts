import { apiFetch } from "@/lib/apiClient"
import type {
  SpecialRisk,
  SpecialRiskActivitiesResponse,
  SpecialRiskActivityOption,
  SpecialRiskDocument,
  SpecialRiskDocumentResponse,
  SpecialRiskDocumentsResponse,
  SpecialRiskFilters,
  SpecialRiskList,
  SpecialRiskListResponse,
  SpecialRiskResponse,
  SpecialRiskStatus,
  UploadSpecialRiskDocumentDto,
  UpsertSpecialRiskDto,
} from "@/types/manager/special-risk"

type ApiErrorResponse = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }>
  data?: unknown
}

type SpecialRiskApiResponse =
  | SpecialRiskResponse
  | SpecialRiskListResponse
  | SpecialRiskActivitiesResponse
  | SpecialRiskDocumentResponse
  | SpecialRiskDocumentsResponse
  | ApiErrorResponse

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as SpecialRiskApiResponse | null
  if (!res.ok || !json?.ok) {
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }
  return json.data as T
}

function buildQuery(filters: SpecialRiskFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

function createDocumentFormData(dto: UploadSpecialRiskDocumentDto) {
  const formData = new FormData()
  formData.append("file", dto.file)
  if (dto.type?.trim()) formData.append("type", dto.type.trim())
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  if (dto.observation?.trim()) formData.append("observation", dto.observation.trim())
  if (dto.description?.trim()) formData.append("description", dto.description.trim())
  return formData
}

async function parseFileOrThrow(res: Response, fallbackMsg: string): Promise<Blob> {
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }
  return res.blob()
}

export async function listSpecialRisks(filters: SpecialRiskFilters = {}): Promise<SpecialRiskList> {
  const res = await apiFetch(`/api/special-risks${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<SpecialRiskList>(res, "No se pudieron cargar los riesgos especiales")
}

export async function listSpecialRiskActivities(): Promise<SpecialRiskActivityOption[]> {
  const res = await apiFetch("/api/special-risks/catalogs/activities", { method: "GET" })
  return parseOrThrow<SpecialRiskActivityOption[]>(res, "No se pudo cargar el catálogo de actividades")
}

export async function getSpecialRisk(id: string): Promise<SpecialRisk> {
  const res = await apiFetch(`/api/special-risks/${id}`, { method: "GET" })
  return parseOrThrow<SpecialRisk>(res, "No se pudo cargar el riesgo especial")
}

export async function createSpecialRisk(dto: UpsertSpecialRiskDto): Promise<SpecialRisk> {
  const res = await apiFetch("/api/special-risks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<SpecialRisk>(res, "No se pudo crear el riesgo especial")
}

export async function updateSpecialRisk(id: string, dto: UpsertSpecialRiskDto): Promise<SpecialRisk> {
  const res = await apiFetch(`/api/special-risks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<SpecialRisk>(res, "No se pudo actualizar el riesgo especial")
}

export async function deleteSpecialRisk(id: string): Promise<void> {
  const res = await apiFetch(`/api/special-risks/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el riesgo especial")
}

export async function changeSpecialRiskStatus(id: string, status: SpecialRiskStatus): Promise<SpecialRisk> {
  const res = await apiFetch(`/api/special-risks/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<SpecialRisk>(res, "No se pudo actualizar el estado del riesgo especial")
}

export async function uploadSpecialRiskDocument(
  specialRiskId: string,
  dto: UploadSpecialRiskDocumentDto,
): Promise<SpecialRiskDocument> {
  const res = await apiFetch(`/api/special-risks/${specialRiskId}/documents`, {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<SpecialRiskDocument>(res, "No se pudo cargar la evidencia")
}

export async function listSpecialRiskDocuments(specialRiskId: string): Promise<SpecialRiskDocument[]> {
  const res = await apiFetch(`/api/special-risks/${specialRiskId}/documents`, { method: "GET" })
  return parseOrThrow<SpecialRiskDocument[]>(res, "No se pudieron cargar las evidencias")
}

export async function getSpecialRiskDocument(
  specialRiskId: string,
  documentId: string,
): Promise<SpecialRiskDocument> {
  const res = await apiFetch(`/api/special-risks/${specialRiskId}/documents/${documentId}`, { method: "GET" })
  return parseOrThrow<SpecialRiskDocument>(res, "No se pudo cargar la evidencia")
}

export async function deleteSpecialRiskDocument(specialRiskId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/special-risks/${specialRiskId}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la evidencia")
}

export async function downloadSpecialRiskDocumentFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(res, "No se pudo descargar la evidencia")
}
