import { apiFetch } from "@/lib/apiClient"
import type {
  HealthyLifestyleActivity,
  HealthyLifestyleDocument,
  HealthyLifestyleFilters,
  HealthyLifestyleList,
  UpsertHealthyLifestyleDto,
  UploadHealthyLifestyleEvidenceDto,
} from "@/types/manager/healthy-lifestyle"

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

function buildQuery(filters: HealthyLifestyleFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listHealthyLifestyles(filters: HealthyLifestyleFilters = {}): Promise<HealthyLifestyleList> {
  const response = await apiFetch(`/api/healthy-lifestyles${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar las actividades de estilos de vida saludable")
}

export async function getHealthyLifestyle(id: string): Promise<HealthyLifestyleActivity> {
  const response = await apiFetch(`/api/healthy-lifestyles/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar la actividad saludable")
}

export async function createHealthyLifestyle(dto: UpsertHealthyLifestyleDto): Promise<HealthyLifestyleActivity> {
  const response = await apiFetch("/api/healthy-lifestyles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo crear la actividad saludable")
}

export async function updateHealthyLifestyle(id: string, dto: UpsertHealthyLifestyleDto): Promise<HealthyLifestyleActivity> {
  const response = await apiFetch(`/api/healthy-lifestyles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo actualizar la actividad saludable")
}

export async function deleteHealthyLifestyle(id: string): Promise<void> {
  const response = await apiFetch(`/api/healthy-lifestyles/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar la actividad saludable")
}

export async function uploadHealthyLifestyleEvidence(
  id: string,
  dto: UploadHealthyLifestyleEvidenceDto,
): Promise<HealthyLifestyleDocument> {
  const data = new FormData()
  data.append("file", dto.file)
  data.append("description", dto.description.trim())
  data.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch(`/api/healthy-lifestyles/${id}/evidence`, { method: "POST", body: data })
  return parseOrThrow(response, "No se pudo cargar la evidencia")
}

export async function deleteHealthyLifestyleEvidence(id: string, documentId: string): Promise<void> {
  const response = await apiFetch(`/api/healthy-lifestyles/${id}/evidence/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar la evidencia")
}

export async function downloadHealthyLifestyleEvidence(downloadUrl: string): Promise<Blob> {
  const response = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar la evidencia")
}

export async function exportHealthyLifestyle(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/healthy-lifestyles/${id}/export`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar el programa")
}
