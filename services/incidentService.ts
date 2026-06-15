import { apiFetch } from "@/lib/apiClient"
import type {
  CreateIncidentDto,
  Incident,
  IncidentDocument,
  IncidentDocumentResponse,
  IncidentDocumentsResponse,
  IncidentFilters,
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

function buildIncidentQuery(filters: IncidentFilters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })

  const query = params.toString()
  return query ? `?${query}` : ""
}

function getExportFilename(res: Response) {
  const disposition = res.headers.get("content-disposition")
  const match = disposition?.match(/filename="?([^"]+)"?/i)

  if (!match?.[1]) return "novedades-laborales.csv"

  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
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
  return parseOrThrow<Incident>(res, "No se pudo crear la novedad laboral")
}

export async function listIncidents(filters?: IncidentFilters): Promise<Incident[]> {
  const res = await apiFetch(`/api/incidents${buildIncidentQuery(filters)}`, { method: "GET" })
  return parseOrThrow<Incident[]>(res, "No se pudieron cargar las novedades laborales")
}

export async function exportIncidents(filters?: IncidentFilters): Promise<{ blob: Blob; filename: string }> {
  const res = await apiFetch(`/api/incidents/export${buildIncidentQuery(filters)}`, { method: "GET" })

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
    const detail = json?.errors?.find((error: { message?: string }) => error.message)?.message
    throw new Error(detail ?? json?.message ?? "No se pudo exportar las novedades laborales")
  }

  const csv = await res.text()
  const content = csv.startsWith("\uFEFF") ? csv : `\uFEFF${csv}`

  return {
    blob: new Blob([content], { type: "text/csv;charset=utf-8" }),
    filename: getExportFilename(res),
  }
}

export async function updateIncident(id: string, dto: UpdateIncidentDto): Promise<Incident> {
  const res = await apiFetch(`/api/incidents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Incident>(res, "No se pudo actualizar la novedad laboral")
}

export async function deleteIncident(id: string): Promise<void> {
  const res = await apiFetch(`/api/incidents/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la novedad laboral")
}

export async function activateIncident(id: string): Promise<Incident> {
  const res = await apiFetch(`/api/incidents/active/${id}`, { method: "PUT" })
  return parseOrThrow<Incident>(res, "No se pudo activar la novedad laboral")
}

export async function uploadIncidentDocument(
  incidentId: string,
  dto: UploadIncidentDocumentDto,
): Promise<IncidentDocument> {
  const res = await apiFetch(`/api/incidents/${incidentId}/documents`, {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<IncidentDocument>(res, "No se pudo subir el documento de la novedad laboral")
}

export async function listIncidentDocuments(incidentId: string): Promise<IncidentDocument[]> {
  const res = await apiFetch(`/api/incidents/${incidentId}/documents`, { method: "GET" })
  return parseOrThrow<IncidentDocument[]>(res, "No se pudieron cargar los documentos de la novedad laboral")
}

export async function deleteIncidentDocument(incidentId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/incidents/${incidentId}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el documento de la novedad laboral")
}

export async function downloadIncidentDocumentFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(res, "No se pudo descargar el documento de la novedad laboral")
}
