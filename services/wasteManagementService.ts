import { apiFetch } from "@/lib/apiClient"
import type {
  UpsertWasteDailyEvidenceDto,
  UpsertWasteProgramDto,
  UploadWasteEvidenceDto,
  WasteDailyEvidence,
  WasteManagementDocument,
  WasteManagementFilters,
  WasteManagementList,
  WasteManagementRecord,
  WasteProgram,
} from "@/types/manager/wasteManagement"

type ApiEnvelope<T> = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }> | null
  data?: T
}

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

function buildQuery(filters: WasteManagementFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listWasteManagement(filters: WasteManagementFilters = {}): Promise<WasteManagementList> {
  const response = await apiFetch(`/api/waste-management${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar los registros de manejo de residuos")
}

export async function getWasteManagement(id: string): Promise<WasteManagementRecord> {
  const response = await apiFetch(`/api/waste-management/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar el registro de manejo de residuos")
}

export async function createWasteDailyEvidence(dto: UpsertWasteDailyEvidenceDto): Promise<WasteDailyEvidence> {
  const response = await apiFetch("/api/waste-management/daily-evidence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo crear la evidencia diaria")
}

export async function updateWasteDailyEvidence(id: string, dto: UpsertWasteDailyEvidenceDto): Promise<WasteDailyEvidence> {
  const response = await apiFetch(`/api/waste-management/daily-evidence/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo actualizar la evidencia diaria")
}

export async function createWasteProgram(dto: UpsertWasteProgramDto): Promise<WasteProgram> {
  const response = await apiFetch("/api/waste-management/programs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo crear el programa")
}

export async function updateWasteProgram(id: string, dto: UpsertWasteProgramDto): Promise<WasteProgram> {
  const response = await apiFetch(`/api/waste-management/programs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo actualizar el programa")
}

export async function deleteWasteManagement(id: string): Promise<void> {
  const response = await apiFetch(`/api/waste-management/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el registro")
}

export async function uploadWasteEvidence(id: string, dto: UploadWasteEvidenceDto): Promise<WasteManagementDocument> {
  const formData = new FormData()
  formData.append("file", dto.file)
  formData.append("description", dto.description.trim())
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch(`/api/waste-management/${id}/evidence`, { method: "POST", body: formData })
  return parseOrThrow(response, "No se pudo cargar la evidencia")
}

export async function downloadWasteEvidence(id: string, documentId: string): Promise<Blob> {
  const response = await apiFetch(`/api/waste-management/${id}/evidence/${documentId}`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar la evidencia")
}

export async function deleteWasteEvidence(id: string, documentId: string): Promise<void> {
  const response = await apiFetch(`/api/waste-management/${id}/evidence/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar la evidencia")
}

export async function exportWasteManagement(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/waste-management/${id}/export`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo exportar el registro")
}
