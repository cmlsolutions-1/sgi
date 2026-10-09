import { apiFetch } from "@/lib/apiClient"
import type {
  SstCommunication,
  SstCommunicationDocument,
  SstCommunicationFilters,
  SstCommunicationList,
  UpsertSstCommunicationDto,
  UploadSstCommunicationEvidenceDto,
} from "@/types/manager/sst-communication"

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

function buildQuery(filters: SstCommunicationFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listSstCommunications(filters: SstCommunicationFilters = {}): Promise<SstCommunicationList> {
  const response = await apiFetch(`/api/sst-communications${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar las comunicaciones SST")
}

export async function getSstCommunication(id: string): Promise<SstCommunication> {
  const response = await apiFetch(`/api/sst-communications/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar la comunicación SST")
}

export async function createSstCommunication(dto: UpsertSstCommunicationDto): Promise<SstCommunication> {
  const response = await apiFetch("/api/sst-communications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo crear la comunicación SST")
}

export async function updateSstCommunication(id: string, dto: UpsertSstCommunicationDto): Promise<SstCommunication> {
  const response = await apiFetch(`/api/sst-communications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo actualizar la comunicación SST")
}

export async function deleteSstCommunication(id: string): Promise<void> {
  const response = await apiFetch(`/api/sst-communications/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar la comunicación SST")
}

async function uploadEvidence(
  communicationId: string,
  endpoint: "initial-evidence" | "signed-evidence",
  dto: UploadSstCommunicationEvidenceDto,
) {
  const data = new FormData()
  data.append("file", dto.file)
  if (dto.description?.trim()) data.append("description", dto.description.trim())
  data.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch(`/api/sst-communications/${communicationId}/${endpoint}`, { method: "POST", body: data })
  return parseOrThrow<SstCommunicationDocument>(response, "No se pudo cargar la evidencia de comunicación SST")
}

export function uploadSstCommunicationInitialEvidence(id: string, dto: UploadSstCommunicationEvidenceDto) {
  return uploadEvidence(id, "initial-evidence", dto)
}

export function uploadSstCommunicationSignedEvidence(id: string, dto: UploadSstCommunicationEvidenceDto) {
  return uploadEvidence(id, "signed-evidence", dto)
}

export async function listSstCommunicationDocuments(id: string): Promise<SstCommunicationDocument[]> {
  const response = await apiFetch(`/api/sst-communications/${id}/documents`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar los documentos de la comunicación SST")
}

export async function deleteSstCommunicationDocument(id: string, documentId: string): Promise<void> {
  const response = await apiFetch(`/api/sst-communications/${id}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el documento de la comunicación SST")
}

export async function downloadSstCommunicationDocument(downloadUrl: string): Promise<Blob> {
  const response = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar el documento de la comunicación SST")
}

export async function downloadSstCommunicationSignaturePdf(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/sst-communications/${id}/signature-pdf`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo generar el PDF para firma")
}
