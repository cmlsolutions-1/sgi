import { apiFetch } from "@/lib/apiClient"
import type {
  EmergencyBrigade,
  EmergencyBrigadeFilters,
  EmergencyBrigadeList,
  EmergencyBrigadeListResponse,
  EmergencyBrigadeResponse,
  EmergencyDocument,
  EmergencyDocumentsResponse,
  EmergencyDocumentResponse,
  EmergencyManagement,
  EmergencyManagementFilters,
  EmergencyManagementList,
  EmergencyManagementListResponse,
  EmergencyManagementResponse,
  EmergencyStatus,
  UploadEmergencyBrigadeDocumentDto,
  UploadEmergencyManagementDocumentDto,
  UpsertEmergencyBrigadeDto,
  UpsertEmergencyManagementDto,
} from "@/types/manager/emergency"

type EmergencyApiResponse =
  | EmergencyManagementResponse
  | EmergencyManagementListResponse
  | EmergencyBrigadeResponse
  | EmergencyBrigadeListResponse
  | EmergencyDocumentResponse
  | EmergencyDocumentsResponse
  | { ok: boolean; message?: string; data?: unknown; errors?: Array<{ message?: string }> }

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as EmergencyApiResponse | null

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

function createDocumentFormData(dto: UploadEmergencyManagementDocumentDto | UploadEmergencyBrigadeDocumentDto) {
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

export async function createEmergencyManagement(
  dto: UpsertEmergencyManagementDto,
): Promise<EmergencyManagement> {
  const res = await apiFetch("/api/emergency-management", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmergencyManagement>(res, "No se pudo crear el plan de emergencia")
}

export async function listEmergencyManagement(
  filters: EmergencyManagementFilters = {},
): Promise<EmergencyManagementList> {
  const res = await apiFetch(`/api/emergency-management${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<EmergencyManagementList>(res, "No se pudo cargar los planes de emergencia")
}

export async function updateEmergencyManagement(
  id: string,
  dto: UpsertEmergencyManagementDto,
): Promise<EmergencyManagement> {
  const res = await apiFetch(`/api/emergency-management/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmergencyManagement>(res, "No se pudo actualizar el plan de emergencia")
}

export async function changeEmergencyManagementStatus(
  id: string,
  status: EmergencyStatus,
): Promise<EmergencyManagement> {
  const res = await apiFetch(`/api/emergency-management/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<EmergencyManagement>(res, "No se pudo actualizar el estado del plan")
}

export async function uploadEmergencyManagementDocument(
  emergencyManagementId: string,
  dto: UploadEmergencyManagementDocumentDto,
): Promise<EmergencyDocument> {
  const res = await apiFetch(`/api/emergency-management/${emergencyManagementId}/documents`, {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<EmergencyDocument>(res, "No se pudo subir el documento del plan")
}

export async function listEmergencyManagementDocuments(emergencyManagementId: string): Promise<EmergencyDocument[]> {
  const res = await apiFetch(`/api/emergency-management/${emergencyManagementId}/documents`, { method: "GET" })
  return parseOrThrow<EmergencyDocument[]>(res, "No se pudo cargar los documentos del plan")
}

export async function getEmergencyManagementDocument(
  emergencyManagementId: string,
  documentId: string,
): Promise<EmergencyDocument> {
  const res = await apiFetch(`/api/emergency-management/${emergencyManagementId}/documents/${documentId}`, {
    method: "GET",
  })
  return parseOrThrow<EmergencyDocument>(res, "No se pudo cargar el documento del plan")
}

export async function deleteEmergencyManagementDocument(
  emergencyManagementId: string,
  documentId: string,
): Promise<void> {
  const res = await apiFetch(`/api/emergency-management/${emergencyManagementId}/documents/${documentId}`, {
    method: "DELETE",
  })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el documento del plan")
}

export async function createEmergencyBrigade(dto: UpsertEmergencyBrigadeDto): Promise<EmergencyBrigade> {
  const res = await apiFetch("/api/emergency-brigades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmergencyBrigade>(res, "No se pudo crear la brigada de emergencia")
}

export async function listEmergencyBrigades(filters: EmergencyBrigadeFilters = {}): Promise<EmergencyBrigadeList> {
  const res = await apiFetch(`/api/emergency-brigades${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<EmergencyBrigadeList>(res, "No se pudo cargar las brigadas de emergencia")
}

export async function updateEmergencyBrigade(
  id: string,
  dto: UpsertEmergencyBrigadeDto,
): Promise<EmergencyBrigade> {
  const res = await apiFetch(`/api/emergency-brigades/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmergencyBrigade>(res, "No se pudo actualizar la brigada de emergencia")
}

export async function changeEmergencyBrigadeStatus(
  id: string,
  status: EmergencyStatus,
): Promise<EmergencyBrigade> {
  const res = await apiFetch(`/api/emergency-brigades/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<EmergencyBrigade>(res, "No se pudo actualizar el estado de la brigada")
}

export async function uploadEmergencyBrigadeDocument(
  emergencyBrigadeId: string,
  dto: UploadEmergencyBrigadeDocumentDto,
): Promise<EmergencyDocument> {
  const res = await apiFetch(`/api/emergency-brigades/${emergencyBrigadeId}/documents`, {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<EmergencyDocument>(res, "No se pudo subir el documento de la brigada")
}

export async function listEmergencyBrigadeDocuments(emergencyBrigadeId: string): Promise<EmergencyDocument[]> {
  const res = await apiFetch(`/api/emergency-brigades/${emergencyBrigadeId}/documents`, { method: "GET" })
  return parseOrThrow<EmergencyDocument[]>(res, "No se pudo cargar los documentos de la brigada")
}

export async function getEmergencyBrigadeDocument(
  emergencyBrigadeId: string,
  documentId: string,
): Promise<EmergencyDocument> {
  const res = await apiFetch(`/api/emergency-brigades/${emergencyBrigadeId}/documents/${documentId}`, {
    method: "GET",
  })
  return parseOrThrow<EmergencyDocument>(res, "No se pudo cargar el documento de la brigada")
}

export async function deleteEmergencyBrigadeDocument(emergencyBrigadeId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/emergency-brigades/${emergencyBrigadeId}/documents/${documentId}`, {
    method: "DELETE",
  })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el documento de la brigada")
}

export async function downloadEmergencyDocumentFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(res, "No se pudo descargar el documento")
}
