import { apiFetch } from "@/lib/apiClient"
import type { InspectionDocument, InspectionFilters, InspectionList, InspectionRecord, UpsertInspectionDto, UploadInspectionEvidenceDto } from "@/types/manager/inspections"

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

function buildQuery(filters: InspectionFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listInspections(filters: InspectionFilters = {}): Promise<InspectionList> {
  const response = await apiFetch(`/api/inspections${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar las inspecciones")
}

export async function getInspection(id: string): Promise<InspectionRecord> {
  const response = await apiFetch(`/api/inspections/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar la inspección")
}

export async function createInspection(dto: UpsertInspectionDto): Promise<InspectionRecord> {
  const response = await apiFetch("/api/inspections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo crear la inspección")
}

export async function updateInspection(id: string, dto: UpsertInspectionDto): Promise<InspectionRecord> {
  const response = await apiFetch(`/api/inspections/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo actualizar la inspección")
}

export async function deleteInspection(id: string): Promise<void> {
  const response = await apiFetch(`/api/inspections/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar la inspección")
}

export async function uploadInspectionEvidence(id: string, dto: UploadInspectionEvidenceDto): Promise<InspectionDocument> {
  const formData = new FormData()
  formData.append("file", dto.file)
  formData.append("description", dto.description.trim())
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch(`/api/inspections/${id}/evidence`, { method: "POST", body: formData })
  return parseOrThrow(response, "No se pudo cargar la evidencia")
}

export async function downloadInspectionEvidence(id: string, documentId: string): Promise<Blob> {
  const response = await apiFetch(`/api/inspections/${id}/evidence/${documentId}`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar la evidencia")
}

export async function exportInspection(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/inspections/${id}/export`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo exportar la inspección")
}
