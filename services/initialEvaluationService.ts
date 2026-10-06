import { apiFetch } from "@/lib/apiClient"
import type {
  InitialEvaluation,
  InitialEvaluationDetail,
  InitialEvaluationDocument,
  InitialEvaluationFilters,
  InitialEvaluationFinding,
  InitialEvaluationList,
  InitialEvaluationStandardItem,
  InitialEvaluationStatus,
  InitialEvaluationSummary,
  UploadInitialEvaluationDocumentDto,
  UpsertInitialEvaluationDto,
} from "@/types/manager/initial-evaluation"

type ApiErrorResponse = { ok?: boolean; message?: string; errors?: Array<{ message?: string }> | null; data?: unknown }

async function parseOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  const json = (await response.json().catch(() => null)) as ApiErrorResponse | null
  if (!response.ok || json?.ok === false || !json) {
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMessage)
  }
  return json.data as T
}

function buildQuery(filters: Record<string, unknown> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

function documentFormData(dto: UploadInitialEvaluationDocumentDto) {
  const data = new FormData()
  data.append("file", dto.file)
  if (dto.type?.trim()) data.append("type", dto.type.trim())
  data.append("isConfirmed", String(dto.isConfirmed ?? true))
  if (dto.observation?.trim()) data.append("observation", dto.observation.trim())
  if (dto.description?.trim()) data.append("description", dto.description.trim())
  return data
}

export async function listInitialEvaluationStandardItems(): Promise<InitialEvaluationStandardItem[]> {
  const response = await apiFetch("/api/initial-evaluations/catalogs/standard-items?status=ACTIVE", { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar el catalogo de estandares")
}

export async function listInitialEvaluations(filters: InitialEvaluationFilters = {}): Promise<InitialEvaluationList> {
  const response = await apiFetch(`/api/initial-evaluations${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar las evaluaciones iniciales")
}

export async function getInitialEvaluationSummary(): Promise<InitialEvaluationSummary> {
  const response = await apiFetch("/api/initial-evaluations/summary", { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar el resumen de evaluacion inicial")
}

export async function getInitialEvaluation(id: string): Promise<InitialEvaluationDetail> {
  const response = await apiFetch(`/api/initial-evaluations/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar la evaluacion inicial")
}

export async function createInitialEvaluation(dto: UpsertInitialEvaluationDto): Promise<InitialEvaluation> {
  const response = await apiFetch("/api/initial-evaluations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo crear la evaluacion inicial")
}

export async function updateInitialEvaluation(id: string, dto: UpsertInitialEvaluationDto): Promise<InitialEvaluation> {
  const response = await apiFetch(`/api/initial-evaluations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo actualizar la evaluacion inicial")
}

export async function deleteInitialEvaluation(id: string): Promise<void> {
  const response = await apiFetch(`/api/initial-evaluations/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar la evaluacion inicial")
}

export async function changeInitialEvaluationStatus(id: string, status: InitialEvaluationStatus): Promise<InitialEvaluation> {
  const response = await apiFetch(`/api/initial-evaluations/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow(response, "No se pudo cambiar el estado de la evaluacion")
}

export async function listInitialEvaluationFindings(id: string): Promise<InitialEvaluationFinding[]> {
  const response = await apiFetch(`/api/initial-evaluations/${id}/findings`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar los hallazgos")
}

export async function downloadInitialEvaluationPdf(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/initial-evaluations/${id}/pdf`, { method: "GET" })
  if (!response.ok) throw new Error("No se pudo descargar la evaluacion inicial")
  return response.blob()
}

export async function uploadInitialEvaluationDocument(id: string, dto: UploadInitialEvaluationDocumentDto): Promise<InitialEvaluationDocument> {
  const response = await apiFetch(`/api/initial-evaluations/${id}/documents`, { method: "POST", body: documentFormData(dto) })
  return parseOrThrow(response, "No se pudo cargar el soporte de la evaluacion")
}

export async function listInitialEvaluationDocuments(id: string): Promise<InitialEvaluationDocument[]> {
  const response = await apiFetch(`/api/initial-evaluations/${id}/documents`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar los soportes de la evaluacion")
}

export async function deleteInitialEvaluationDocument(id: string, documentId: string): Promise<void> {
  const response = await apiFetch(`/api/initial-evaluations/${id}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el soporte")
}

export async function downloadInitialEvaluationDocument(downloadUrl: string): Promise<Blob> {
  const response = await apiFetch(downloadUrl, { method: "GET" })
  if (!response.ok) throw new Error("No se pudo descargar el soporte")
  return response.blob()
}
