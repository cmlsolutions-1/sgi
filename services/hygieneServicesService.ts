import { apiFetch } from "@/lib/apiClient"
import type { HygieneDailyEvidence, HygieneProgram, HygieneServiceDocument, HygieneServiceFilters, HygieneServiceList, HygieneServiceRecord, UpsertHygieneDailyEvidenceDto, UpsertHygieneProgramDto, UploadHygieneEvidenceDto } from "@/types/manager/hygieneServices"

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

function buildQuery(filters: HygieneServiceFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listHygieneServices(filters: HygieneServiceFilters = {}): Promise<HygieneServiceList> {
  const response = await apiFetch(`/api/hygiene-services${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar los servicios de higiene")
}

export async function getHygieneService(id: string): Promise<HygieneServiceRecord> {
  const response = await apiFetch(`/api/hygiene-services/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar el registro de higiene")
}

export async function createHygieneDailyEvidence(dto: UpsertHygieneDailyEvidenceDto): Promise<HygieneDailyEvidence> {
  const response = await apiFetch("/api/hygiene-services/daily-evidence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo crear la evidencia diaria")
}

export async function updateHygieneDailyEvidence(id: string, dto: UpsertHygieneDailyEvidenceDto): Promise<HygieneDailyEvidence> {
  const response = await apiFetch(`/api/hygiene-services/daily-evidence/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo actualizar la evidencia diaria")
}

export async function createHygieneProgram(dto: UpsertHygieneProgramDto): Promise<HygieneProgram> {
  const response = await apiFetch("/api/hygiene-services/programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo crear el programa")
}

export async function updateHygieneProgram(id: string, dto: UpsertHygieneProgramDto): Promise<HygieneProgram> {
  const response = await apiFetch(`/api/hygiene-services/programs/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo actualizar el programa")
}

export async function deleteHygieneService(id: string): Promise<void> {
  const response = await apiFetch(`/api/hygiene-services/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el registro")
}

export async function uploadHygieneEvidence(id: string, dto: UploadHygieneEvidenceDto): Promise<HygieneServiceDocument> {
  const formData = new FormData()
  formData.append("file", dto.file)
  formData.append("description", dto.description.trim())
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch(`/api/hygiene-services/${id}/evidence`, { method: "POST", body: formData })
  return parseOrThrow(response, "No se pudo cargar la evidencia")
}

export async function downloadHygieneEvidence(id: string, documentId: string): Promise<Blob> {
  const response = await apiFetch(`/api/hygiene-services/${id}/evidence/${documentId}`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar la evidencia")
}

export async function deleteHygieneEvidence(id: string, documentId: string): Promise<void> {
  const response = await apiFetch(`/api/hygiene-services/${id}/evidence/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar la evidencia")
}

export async function exportHygieneService(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/hygiene-services/${id}/export`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo exportar el registro")
}
