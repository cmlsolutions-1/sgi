import { apiFetch } from "@/lib/apiClient"
import type {
  CustodyDocument,
  CustodyDocumentType,
  CustodyFilters,
  CustodyList,
  CustodyRecord,
  CustodySummary,
  UploadCustodyDocumentDto,
  UpsertCustodyDto,
} from "@/types/manager/custody"

type ApiErrorResponse = { ok?: boolean; message?: string; errors?: Array<{ message?: string }> | null; data?: unknown }

async function parseOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  const json = (await response.json().catch(() => null)) as ApiErrorResponse | null
  if (!response.ok || json?.ok === false || !json) {
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMessage)
  }
  return json.data as T
}

async function parseFileOrThrow(response: Response, fallbackMessage: string): Promise<Blob> {
  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as ApiErrorResponse | null
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMessage)
  }
  return response.blob()
}

function buildQuery(filters: Record<string, unknown> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listCustodyRecords(filters: CustodyFilters = {}): Promise<CustodyList> {
  const response = await apiFetch(`/api/custody${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<CustodyList>(response, "No se pudieron cargar los registros de custodia")
}

export async function getCustodySummary(): Promise<CustodySummary> {
  const response = await apiFetch("/api/custody/summary", { method: "GET" })
  return parseOrThrow<CustodySummary>(response, "No se pudo cargar el resumen de custodia")
}

export async function getCustodyRecord(id: string): Promise<CustodyRecord> {
  const response = await apiFetch(`/api/custody/${id}`, { method: "GET" })
  return parseOrThrow<CustodyRecord>(response, "No se pudo cargar el registro de custodia")
}

export async function createCustodyRecord(dto: UpsertCustodyDto): Promise<CustodyRecord> {
  const response = await apiFetch("/api/custody", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<CustodyRecord>(response, "No se pudo crear el registro de custodia")
}

export async function updateCustodyRecord(id: string, dto: UpsertCustodyDto): Promise<CustodyRecord> {
  const response = await apiFetch(`/api/custody/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<CustodyRecord>(response, "No se pudo actualizar el registro de custodia")
}

export async function deleteCustodyRecord(id: string): Promise<void> {
  const response = await apiFetch(`/api/custody/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el registro de custodia")
}

export async function downloadCustodyCommitment(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/custody/${id}/confidentiality-commitment`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo generar el compromiso de confidencialidad")
}

export async function uploadCustodyDocument(id: string, dto: UploadCustodyDocumentDto): Promise<CustodyDocument> {
  const data = new FormData()
  data.append("file", dto.file)
  data.append("type", dto.type)
  if (dto.description?.trim()) data.append("description", dto.description.trim())
  data.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch(`/api/custody/${id}/documents`, { method: "POST", body: data })
  return parseOrThrow<CustodyDocument>(response, "No se pudo cargar el documento de custodia")
}

export async function listCustodyDocuments(id: string, type?: CustodyDocumentType): Promise<CustodyDocument[]> {
  const response = await apiFetch(`/api/custody/${id}/documents${buildQuery({ type })}`, { method: "GET" })
  return parseOrThrow<CustodyDocument[]>(response, "No se pudieron cargar los documentos de custodia")
}

export async function getCustodyDocument(id: string, documentId: string): Promise<CustodyDocument> {
  const response = await apiFetch(`/api/custody/${id}/documents/${documentId}`, { method: "GET" })
  return parseOrThrow<CustodyDocument>(response, "No se pudo cargar el documento de custodia")
}

export async function deleteCustodyDocument(id: string, documentId: string): Promise<void> {
  const response = await apiFetch(`/api/custody/${id}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el documento de custodia")
}

export async function downloadCustodyDocument(downloadUrl: string): Promise<Blob> {
  const response = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar el documento de custodia")
}
