import { apiFetch } from "@/lib/apiClient"
import type {
  SstTrainingCertification,
  SstTrainingCertificationDocument,
  SstTrainingCertificationDocumentResponse,
  SstTrainingCertificationDocumentsResponse,
  SstTrainingCertificationFilters,
  SstTrainingCertificationList,
  SstTrainingCertificationListResponse,
  SstTrainingCertificationResponse,
  SstTrainingCertificationSummary,
  SstTrainingCertificationSummaryResponse,
  SstTrainingCompetenceOption,
  SstTrainingCompetenceOptionsResponse,
  UploadSstTrainingCertificationDocumentDto,
  UpsertSstTrainingCertificationDto,
} from "@/types/manager/sst-training-certification"

type ApiErrorResponse = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }> | null
  data?: unknown
}

type CertificationApiResponse =
  | SstTrainingCertificationResponse
  | SstTrainingCertificationListResponse
  | SstTrainingCertificationSummaryResponse
  | SstTrainingCompetenceOptionsResponse
  | SstTrainingCertificationDocumentResponse
  | SstTrainingCertificationDocumentsResponse
  | ApiErrorResponse

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as CertificationApiResponse | null
  if (!res.ok || json?.ok === false || !json) {
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }
  return json.data as T
}

async function parseFileOrThrow(res: Response, fallbackMsg: string): Promise<Blob> {
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }
  return res.blob()
}

function buildQuery(filters: SstTrainingCertificationFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

function createDocumentFormData(dto: UploadSstTrainingCertificationDocumentDto) {
  const formData = new FormData()
  formData.append("file", dto.file)
  if (dto.type?.trim()) formData.append("type", dto.type.trim())
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  if (dto.observation?.trim()) formData.append("observation", dto.observation.trim())
  if (dto.description?.trim()) formData.append("description", dto.description.trim())
  return formData
}

export async function listSstTrainingCertifications(
  filters?: SstTrainingCertificationFilters,
): Promise<SstTrainingCertificationList> {
  const res = await apiFetch(`/api/sst-training-certifications${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<SstTrainingCertificationList>(res, "No se pudieron cargar las formaciones y certificaciones")
}

export async function getSstTrainingCertificationSummary(): Promise<SstTrainingCertificationSummary> {
  const res = await apiFetch("/api/sst-training-certifications/summary", { method: "GET" })
  return parseOrThrow<SstTrainingCertificationSummary>(res, "No se pudieron cargar los indicadores")
}

export async function listSstTrainingCompetenceTypes(): Promise<SstTrainingCompetenceOption[]> {
  const res = await apiFetch("/api/sst-training-certifications/catalogs/competence-types", { method: "GET" })
  return parseOrThrow<SstTrainingCompetenceOption[]>(res, "No se pudo cargar el catálogo de competencias")
}

export async function getSstTrainingCertification(id: string): Promise<SstTrainingCertification> {
  const res = await apiFetch(`/api/sst-training-certifications/${id}`, { method: "GET" })
  return parseOrThrow<SstTrainingCertification>(res, "No se pudo cargar la formación o certificación")
}

export async function createSstTrainingCertification(
  dto: UpsertSstTrainingCertificationDto,
): Promise<SstTrainingCertification> {
  const res = await apiFetch("/api/sst-training-certifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<SstTrainingCertification>(res, "No se pudo crear la formación o certificación")
}

export async function updateSstTrainingCertification(
  id: string,
  dto: UpsertSstTrainingCertificationDto,
): Promise<SstTrainingCertification> {
  const res = await apiFetch(`/api/sst-training-certifications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<SstTrainingCertification>(res, "No se pudo actualizar la formación o certificación")
}

export async function deleteSstTrainingCertification(id: string): Promise<void> {
  const res = await apiFetch(`/api/sst-training-certifications/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la formación o certificación")
}

export async function uploadSstTrainingCertificationDocument(
  certificationId: string,
  dto: UploadSstTrainingCertificationDocumentDto,
): Promise<SstTrainingCertificationDocument> {
  const res = await apiFetch(`/api/sst-training-certifications/${certificationId}/documents`, {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<SstTrainingCertificationDocument>(res, "No se pudo cargar la evidencia")
}

export async function listSstTrainingCertificationDocuments(
  certificationId: string,
): Promise<SstTrainingCertificationDocument[]> {
  const res = await apiFetch(`/api/sst-training-certifications/${certificationId}/documents`, { method: "GET" })
  return parseOrThrow<SstTrainingCertificationDocument[]>(res, "No se pudieron cargar las evidencias")
}

export async function getSstTrainingCertificationDocument(
  certificationId: string,
  documentId: string,
): Promise<SstTrainingCertificationDocument> {
  const res = await apiFetch(`/api/sst-training-certifications/${certificationId}/documents/${documentId}`, {
    method: "GET",
  })
  return parseOrThrow<SstTrainingCertificationDocument>(res, "No se pudo cargar la evidencia")
}

export async function deleteSstTrainingCertificationDocument(
  certificationId: string,
  documentId: string,
): Promise<void> {
  const res = await apiFetch(`/api/sst-training-certifications/${certificationId}/documents/${documentId}`, {
    method: "DELETE",
  })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la evidencia")
}

export async function downloadSstTrainingCertificationDocument(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(res, "No se pudo descargar la evidencia")
}
