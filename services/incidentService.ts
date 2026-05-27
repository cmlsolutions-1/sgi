import { apiFetch } from "@/lib/apiClient"
import type {
  CreateIncidentDto,
  Incident,
  IncidentDocument,
  IncidentDocumentResponse,
  IncidentDocumentsResponse,
  IncidentResponse,
  IncidentsResponse,
  UpdateIncidentDto,
  UploadIncidentDocumentDto,
} from "@/types/manager/incident"

type ApiErrorResponse = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }>
  data?: unknown
}

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | IncidentResponse
    | IncidentsResponse
    | IncidentDocumentResponse
    | IncidentDocumentsResponse
    | ApiErrorResponse
    | null

  if (!res.ok || json?.ok === false) {
    const detail = json?.errors?.find((error: { message?: string }) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }

  if (!json) {
    return undefined as T
  }

  return "data" in json ? (json.data as T) : (json as T)
}

function createDocumentFormData(dto: UploadIncidentDocumentDto) {
  const formData = new FormData()
  formData.append("file", dto.file)
  formData.append("type", dto.type)
  formData.append("isConfirmed", String(dto.isConfirmed))
  return formData
}

async function parseFileOrThrow(res: Response, fallbackMsg: string): Promise<Blob> {
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
    const detail = json?.errors?.find((error: { message?: string }) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }

  return res.blob()
}

export async function createIncident(dto: CreateIncidentDto): Promise<Incident> {
  const res = await apiFetch("/api/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Incident>(res, "No se pudo crear el incidente")
}

export async function listIncidents(employeeId?: string): Promise<Incident[]> {
  const query = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : ""
  const res = await apiFetch(`/api/incidents${query}`, { method: "GET" })
  return parseOrThrow<Incident[]>(res, "No se pudo cargar los incidentes")
}

export async function updateIncident(id: string, dto: UpdateIncidentDto): Promise<Incident> {
  const res = await apiFetch(`/api/incidents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Incident>(res, "No se pudo actualizar el incidente")
}

export async function deleteIncident(id: string): Promise<void> {
  const res = await apiFetch(`/api/incidents/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el incidente")
}

export async function activateIncident(id: string): Promise<Incident> {
  const res = await apiFetch(`/api/incidents/active/${id}`, { method: "PUT" })
  return parseOrThrow<Incident>(res, "No se pudo activar el incidente")
}

export async function uploadIncidentDocument(
  incidentId: string,
  dto: UploadIncidentDocumentDto,
): Promise<IncidentDocument> {
  const res = await apiFetch(`/api/incidents/${incidentId}/documents`, {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<IncidentDocument>(res, "No se pudo subir el documento del incidente")
}

export async function listIncidentDocuments(incidentId: string): Promise<IncidentDocument[]> {
  const res = await apiFetch(`/api/incidents/${incidentId}/documents`, { method: "GET" })
  return parseOrThrow<IncidentDocument[]>(res, "No se pudo cargar los documentos del incidente")
}

export async function deleteIncidentDocument(incidentId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/incidents/${incidentId}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el documento del incidente")
}

export async function downloadIncidentDocumentFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(res, "No se pudo descargar el documento del incidente")
}
