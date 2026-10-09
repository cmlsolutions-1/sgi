import { apiFetch } from "@/lib/apiClient"
import type {
  HazardousSubstance,
  HazardousSubstanceDocument,
  HazardousSubstanceFilters,
  HazardousSubstanceList,
  HazardousSubstanceProgram,
  HazardousSubstanceRecord,
  UpsertHazardousProgramDto,
  UpsertHazardousSubstanceDto,
  UploadHazardousEvidenceDto,
} from "@/types/manager/hazardousSubstances"

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

function buildQuery(filters: HazardousSubstanceFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listHazardousSubstances(filters: HazardousSubstanceFilters = {}): Promise<HazardousSubstanceList> {
  const response = await apiFetch(`/api/hazardous-substances${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar las sustancias peligrosas")
}

export async function getHazardousSubstance(id: string): Promise<HazardousSubstanceRecord> {
  const response = await apiFetch(`/api/hazardous-substances/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar el registro")
}

export async function createHazardousSubstance(dto: UpsertHazardousSubstanceDto): Promise<HazardousSubstance> {
  const response = await apiFetch("/api/hazardous-substances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo crear la sustancia peligrosa")
}

export async function updateHazardousSubstance(id: string, dto: UpsertHazardousSubstanceDto): Promise<HazardousSubstance> {
  const response = await apiFetch(`/api/hazardous-substances/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo actualizar la sustancia peligrosa")
}

export async function createHazardousProgram(dto: UpsertHazardousProgramDto): Promise<HazardousSubstanceProgram> {
  const response = await apiFetch("/api/hazardous-substances/programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo crear el programa")
}

export async function updateHazardousProgram(id: string, dto: UpsertHazardousProgramDto): Promise<HazardousSubstanceProgram> {
  const response = await apiFetch(`/api/hazardous-substances/programs/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) })
  return parseOrThrow(response, "No se pudo actualizar el programa")
}

export async function deleteHazardousSubstance(id: string): Promise<void> {
  const response = await apiFetch(`/api/hazardous-substances/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el registro")
}

export async function uploadHazardousSubstanceEvidence(id: string, dto: UploadHazardousEvidenceDto): Promise<HazardousSubstanceDocument> {
  const formData = new FormData()
  formData.append("file", dto.file)
  formData.append("description", dto.description.trim())
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch(`/api/hazardous-substances/${id}/evidence`, { method: "POST", body: formData })
  return parseOrThrow(response, "No se pudo cargar la evidencia")
}

export async function downloadHazardousSubstanceEvidence(id: string, documentId: string): Promise<Blob> {
  const response = await apiFetch(`/api/hazardous-substances/${id}/evidence/${documentId}`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar la evidencia")
}

export async function exportHazardousSubstance(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/hazardous-substances/${id}/export`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo exportar el registro")
}
