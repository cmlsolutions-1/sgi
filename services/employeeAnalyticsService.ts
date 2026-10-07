import { apiFetch } from "@/lib/apiClient"
import type {
  EmployeeAnalyticsDocument,
  EmployeeAnalyticsFilters,
  EmployeeAnalyticsImprovementAction,
  EmployeeAnalyticsList,
  EmployeeAnalyticsReport,
  SaveEmployeeAnalyticsImprovementDto,
  UploadEmployeeAnalyticsDocumentDto,
  UpsertEmployeeAnalyticsDto,
} from "@/types/manager/employee-analytics"

type ApiErrorResponse = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }>
  data?: unknown
}

async function parseOrThrow<T>(res: Response, fallbackMessage: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
  if (!res.ok || !json?.ok) {
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMessage)
  }
  return json.data as T
}

async function parseFileOrThrow(res: Response, fallbackMessage: string): Promise<Blob> {
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMessage)
  }
  return res.blob()
}

function buildQuery(filters: EmployeeAnalyticsFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listEmployeeAnalytics(filters: EmployeeAnalyticsFilters = {}): Promise<EmployeeAnalyticsList> {
  const response = await apiFetch(`/api/employee-analytics${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<EmployeeAnalyticsList>(response, "No se pudieron cargar los análisis")
}

export async function getEmployeeAnalytics(id: string): Promise<EmployeeAnalyticsReport> {
  const response = await apiFetch(`/api/employee-analytics/${id}`, { method: "GET" })
  return parseOrThrow<EmployeeAnalyticsReport>(response, "No se pudo cargar el análisis")
}

export async function createEmployeeAnalytics(dto: UpsertEmployeeAnalyticsDto): Promise<EmployeeAnalyticsReport> {
  const response = await apiFetch("/api/employee-analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeAnalyticsReport>(response, "No se pudo crear el análisis")
}

export async function updateEmployeeAnalytics(id: string, dto: UpsertEmployeeAnalyticsDto): Promise<EmployeeAnalyticsReport> {
  const response = await apiFetch(`/api/employee-analytics/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeAnalyticsReport>(response, "No se pudo actualizar el análisis")
}

export async function deleteEmployeeAnalytics(id: string): Promise<void> {
  const response = await apiFetch(`/api/employee-analytics/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el análisis")
}

export async function saveEmployeeAnalyticsImprovement(
  id: string,
  dto: SaveEmployeeAnalyticsImprovementDto,
): Promise<EmployeeAnalyticsImprovementAction> {
  const response = await apiFetch(`/api/employee-analytics/${id}/improvement-action`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeAnalyticsImprovementAction>(response, "No se pudo guardar la acción de mejora")
}

export async function exportEmployeeAnalyticsPdf(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/employee-analytics/${id}/export`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo generar el PDF del análisis")
}

export async function exportEmployeeAnalyticsCsv(filters: EmployeeAnalyticsFilters = {}): Promise<Blob> {
  const response = await apiFetch(`/api/employee-analytics/export${buildQuery(filters)}`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo exportar el consolidado")
}

export async function uploadEmployeeAnalyticsDocument(
  reportId: string,
  dto: UploadEmployeeAnalyticsDocumentDto,
): Promise<EmployeeAnalyticsDocument> {
  const formData = new FormData()
  formData.append("file", dto.file)
  formData.append("description", dto.description.trim())
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch(`/api/employee-analytics/${reportId}/documents`, { method: "POST", body: formData })
  return parseOrThrow<EmployeeAnalyticsDocument>(response, "No se pudo cargar la evidencia")
}

export async function listEmployeeAnalyticsDocuments(reportId: string): Promise<EmployeeAnalyticsDocument[]> {
  const response = await apiFetch(`/api/employee-analytics/${reportId}/documents`, { method: "GET" })
  return parseOrThrow<EmployeeAnalyticsDocument[]>(response, "No se pudieron cargar las evidencias")
}

export async function getEmployeeAnalyticsDocument(reportId: string, documentId: string): Promise<EmployeeAnalyticsDocument> {
  const response = await apiFetch(`/api/employee-analytics/${reportId}/documents/${documentId}`, { method: "GET" })
  return parseOrThrow<EmployeeAnalyticsDocument>(response, "No se pudo cargar la evidencia")
}

export async function deleteEmployeeAnalyticsDocument(reportId: string, documentId: string): Promise<void> {
  const response = await apiFetch(`/api/employee-analytics/${reportId}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar la evidencia")
}

export async function downloadEmployeeAnalyticsDocument(downloadUrl: string): Promise<Blob> {
  const response = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar la evidencia")
}
