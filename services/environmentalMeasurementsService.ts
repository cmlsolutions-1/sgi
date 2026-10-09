import { apiFetch } from "@/lib/apiClient"
import type {
  EnvironmentalMeasurement,
  EnvironmentalMeasurementDocument,
  EnvironmentalMeasurementFilters,
  EnvironmentalMeasurementList,
  EnvironmentalProcedure,
  EnvironmentalRecord,
  UpsertEnvironmentalMeasurementDto,
  UpsertEnvironmentalProcedureDto,
  UploadEnvironmentalEvidenceDto,
} from "@/types/manager/environmentalMeasurements"

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

function buildQuery(filters: EnvironmentalMeasurementFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listEnvironmentalMeasurements(filters: EnvironmentalMeasurementFilters = {}): Promise<EnvironmentalMeasurementList> {
  const response = await apiFetch(`/api/environmental-measurements${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar las mediciones ambientales")
}

export async function getEnvironmentalMeasurement(id: string): Promise<EnvironmentalRecord> {
  const response = await apiFetch(`/api/environmental-measurements/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar el registro ambiental")
}

export async function createEnvironmentalMeasurement(dto: UpsertEnvironmentalMeasurementDto): Promise<EnvironmentalMeasurement> {
  const response = await apiFetch("/api/environmental-measurements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo crear la medición ambiental")
}

export async function updateEnvironmentalMeasurement(id: string, dto: UpsertEnvironmentalMeasurementDto): Promise<EnvironmentalMeasurement> {
  const response = await apiFetch(`/api/environmental-measurements/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo actualizar la medición ambiental")
}

export async function createEnvironmentalProcedure(dto: UpsertEnvironmentalProcedureDto): Promise<EnvironmentalProcedure> {
  const response = await apiFetch("/api/environmental-measurements/procedures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo crear el procedimiento")
}

export async function updateEnvironmentalProcedure(id: string, dto: UpsertEnvironmentalProcedureDto): Promise<EnvironmentalProcedure> {
  const response = await apiFetch(`/api/environmental-measurements/procedures/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo actualizar el procedimiento")
}

export async function deleteEnvironmentalMeasurement(id: string): Promise<void> {
  const response = await apiFetch(`/api/environmental-measurements/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el registro ambiental")
}

export async function uploadEnvironmentalEvidence(id: string, dto: UploadEnvironmentalEvidenceDto): Promise<EnvironmentalMeasurementDocument> {
  const formData = new FormData()
  formData.append("file", dto.file)
  formData.append("description", dto.description.trim())
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch(`/api/environmental-measurements/${id}/evidence`, { method: "POST", body: formData })
  return parseOrThrow(response, "No se pudo cargar la evidencia")
}

export async function downloadEnvironmentalEvidence(id: string, documentId: string): Promise<Blob> {
  const response = await apiFetch(`/api/environmental-measurements/${id}/evidence/${documentId}`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar la evidencia")
}

export async function exportEnvironmentalMeasurement(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/environmental-measurements/${id}/export`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo exportar el registro ambiental")
}
