import { apiFetch } from "@/lib/apiClient"
import type {
  LegalMatrixDocument,
  LegalMatrixFilters,
  LegalMatrixItem,
  LegalMatrixList,
  UpsertLegalMatrixDto,
  UploadLegalMatrixEvidenceDto,
} from "@/types/manager/legal-matrix"

type ApiEnvelope<T> = { ok?: boolean; message?: string; errors?: Array<{ message?: string }> | null; data?: T }

async function parseOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!response.ok || json?.ok === false || !json || !("data" in json)) {
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMessage)
  }
  return json.data as T
}

async function parseFileOrThrow(response: Response, fallbackMessage: string): Promise<Blob> {
  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as ApiEnvelope<unknown> | null
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMessage)
  }
  return response.blob()
}

function buildQuery(filters: LegalMatrixFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listLegalMatrixItems(filters: LegalMatrixFilters = {}): Promise<LegalMatrixList> {
  const response = await apiFetch(`/api/legal-matrix${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar la matriz legal")
}

export async function getLegalMatrixItem(id: string): Promise<LegalMatrixItem> {
  const response = await apiFetch(`/api/legal-matrix/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar la norma")
}

export async function createLegalMatrixItem(dto: UpsertLegalMatrixDto): Promise<LegalMatrixItem> {
  const response = await apiFetch("/api/legal-matrix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo crear la norma")
}

export async function updateLegalMatrixItem(id: string, dto: UpsertLegalMatrixDto): Promise<LegalMatrixItem> {
  const response = await apiFetch(`/api/legal-matrix/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo actualizar la norma")
}

export async function deleteLegalMatrixItem(id: string): Promise<void> {
  const response = await apiFetch(`/api/legal-matrix/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar la norma")
}

export async function uploadLegalMatrixEvidence(id: string, dto: UploadLegalMatrixEvidenceDto): Promise<LegalMatrixDocument> {
  const data = new FormData()
  data.append("file", dto.file)
  if (dto.description?.trim()) data.append("description", dto.description.trim())
  data.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch(`/api/legal-matrix/${id}/evidence`, { method: "POST", body: data })
  return parseOrThrow(response, "No se pudo cargar el documento legal")
}

export async function deleteLegalMatrixEvidence(id: string, documentId: string): Promise<void> {
  const response = await apiFetch(`/api/legal-matrix/${id}/evidence/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el documento legal")
}

export async function downloadLegalMatrixEvidence(downloadUrl: string): Promise<Blob> {
  const response = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar el documento legal")
}
