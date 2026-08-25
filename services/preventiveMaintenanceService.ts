import { apiFetch } from "@/lib/apiClient"
import type {
  PreventiveMaintenance,
  PreventiveMaintenanceDocument,
  PreventiveMaintenanceDocumentResponse,
  PreventiveMaintenanceDocumentsResponse,
  PreventiveMaintenanceFilters,
  PreventiveMaintenanceList,
  PreventiveMaintenanceListResponse,
  PreventiveMaintenanceResponse,
  PreventiveMaintenanceStatus,
  UploadPreventiveMaintenanceDocumentDto,
  UpsertPreventiveMaintenanceDto,
} from "@/types/manager/preventive-maintenance"

type PreventiveMaintenanceApiResponse =
  | PreventiveMaintenanceResponse
  | PreventiveMaintenanceListResponse
  | PreventiveMaintenanceDocumentResponse
  | PreventiveMaintenanceDocumentsResponse
  | { ok: boolean; message?: string; data?: unknown; errors?: Array<{ message?: string }> }

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as PreventiveMaintenanceApiResponse | null

  if (!res.ok || !json?.ok) {
    const detail = json?.errors?.find((error: { message?: string }) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }

  return json.data as T
}

function buildQuery(filters: Record<string, string | number | undefined | null> = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      params.set(key, String(value))
    }
  })

  const query = params.toString()
  return query ? `?${query}` : ""
}

function createDocumentFormData(dto: UploadPreventiveMaintenanceDocumentDto) {
  const formData = new FormData()
  formData.append("file", dto.file)

  if (dto.type) {
    formData.append("type", dto.type)
  }

  if (typeof dto.isConfirmed === "boolean") {
    formData.append("isConfirmed", String(dto.isConfirmed))
  }

  return formData
}

async function parseFileOrThrow(res: Response, fallbackMsg: string): Promise<Blob> {
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as
      | { message?: string; errors?: Array<{ message?: string }> }
      | null
    const detail = json?.errors?.find((error: { message?: string }) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }

  return res.blob()
}

export async function createPreventiveMaintenance(
  dto: UpsertPreventiveMaintenanceDto,
): Promise<PreventiveMaintenance> {
  const res = await apiFetch("/api/preventive-maintenance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<PreventiveMaintenance>(res, "No se pudo crear el mantenimiento preventivo")
}

export async function listPreventiveMaintenance(
  filters: PreventiveMaintenanceFilters = {},
): Promise<PreventiveMaintenanceList> {
  const res = await apiFetch(`/api/preventive-maintenance${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<PreventiveMaintenanceList>(res, "No se pudo cargar los mantenimientos preventivos")
}

export async function getPreventiveMaintenance(id: string): Promise<PreventiveMaintenance> {
  const res = await apiFetch(`/api/preventive-maintenance/${id}`, { method: "GET" })
  return parseOrThrow<PreventiveMaintenance>(res, "No se pudo cargar el mantenimiento preventivo")
}

export async function updatePreventiveMaintenance(
  id: string,
  dto: UpsertPreventiveMaintenanceDto,
): Promise<PreventiveMaintenance> {
  const res = await apiFetch(`/api/preventive-maintenance/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<PreventiveMaintenance>(res, "No se pudo actualizar el mantenimiento preventivo")
}

export async function changePreventiveMaintenanceStatus(
  id: string,
  status: PreventiveMaintenanceStatus,
): Promise<PreventiveMaintenance> {
  const res = await apiFetch(`/api/preventive-maintenance/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<PreventiveMaintenance>(res, "No se pudo actualizar el estado del mantenimiento")
}

export async function uploadPreventiveMaintenanceDocument(
  preventiveMaintenanceId: string,
  dto: UploadPreventiveMaintenanceDocumentDto,
): Promise<PreventiveMaintenanceDocument> {
  const res = await apiFetch(`/api/preventive-maintenance/${preventiveMaintenanceId}/documents`, {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<PreventiveMaintenanceDocument>(res, "No se pudo subir el documento del mantenimiento")
}

export async function listPreventiveMaintenanceDocuments(
  preventiveMaintenanceId: string,
): Promise<PreventiveMaintenanceDocument[]> {
  const res = await apiFetch(`/api/preventive-maintenance/${preventiveMaintenanceId}/documents`, { method: "GET" })
  return parseOrThrow<PreventiveMaintenanceDocument[]>(res, "No se pudo cargar los documentos del mantenimiento")
}

export async function getPreventiveMaintenanceDocument(
  preventiveMaintenanceId: string,
  documentId: string,
): Promise<PreventiveMaintenanceDocument> {
  const res = await apiFetch(`/api/preventive-maintenance/${preventiveMaintenanceId}/documents/${documentId}`, {
    method: "GET",
  })
  return parseOrThrow<PreventiveMaintenanceDocument>(res, "No se pudo cargar el documento del mantenimiento")
}

export async function deletePreventiveMaintenanceDocument(
  preventiveMaintenanceId: string,
  documentId: string,
): Promise<void> {
  const res = await apiFetch(`/api/preventive-maintenance/${preventiveMaintenanceId}/documents/${documentId}`, {
    method: "DELETE",
  })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el documento del mantenimiento")
}

export async function downloadPreventiveMaintenanceDocumentFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(res, "No se pudo descargar el documento del mantenimiento")
}
