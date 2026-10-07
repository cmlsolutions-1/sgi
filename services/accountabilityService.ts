import { apiFetch } from "@/lib/apiClient"
import type {
  AccountabilityDocument,
  AccountabilityFilters,
  AccountabilityReport,
  AccountabilityReportDetail,
  AccountabilityReportList,
  AccountabilityStatus,
  AccountabilitySummary,
  UpsertAccountabilityReportDto,
  UploadAccountabilityDocumentDto,
} from "@/types/manager/accountability"

type ApiEnvelope<T> = { ok?: boolean; message?: string; errors?: Array<{ message?: string }> | null; data?: T }

async function parseOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!response.ok || json?.ok === false || !json || !("data" in json)) {
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMessage)
  }
  return json.data as T
}

function buildQuery(filters: AccountabilityFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

function documentFormData(dto: UploadAccountabilityDocumentDto) {
  const formData = new FormData()
  formData.append("file", dto.file)
  if (dto.type?.trim()) formData.append("type", dto.type.trim())
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  if (dto.observation?.trim()) formData.append("observation", dto.observation.trim())
  if (dto.description?.trim()) formData.append("description", dto.description.trim())
  return formData
}

export async function listAccountabilityReports(filters: AccountabilityFilters = {}): Promise<AccountabilityReportList> {
  const response = await apiFetch(`/api/accountability-reports${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar las rendiciones de cuentas")
}

export async function getAccountabilitySummary(year?: number): Promise<AccountabilitySummary> {
  const query = year ? `?year=${year}` : ""
  const response = await apiFetch(`/api/accountability-reports/summary${query}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar el resumen de rendición de cuentas")
}

export async function getAccountabilityReport(id: string): Promise<AccountabilityReportDetail> {
  const response = await apiFetch(`/api/accountability-reports/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar la rendición de cuentas")
}

export async function createAccountabilityReport(dto: UpsertAccountabilityReportDto): Promise<AccountabilityReport> {
  const response = await apiFetch("/api/accountability-reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo crear la rendición de cuentas")
}

export async function updateAccountabilityReport(id: string, dto: UpsertAccountabilityReportDto): Promise<AccountabilityReport> {
  const response = await apiFetch(`/api/accountability-reports/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo actualizar la rendición de cuentas")
}

export async function changeAccountabilityStatus(id: string, status: AccountabilityStatus): Promise<AccountabilityReport> {
  const response = await apiFetch(`/api/accountability-reports/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow(response, "No se pudo cambiar el estado de la rendición")
}

export async function deleteAccountabilityReport(id: string): Promise<void> {
  const response = await apiFetch(`/api/accountability-reports/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar la rendición")
}

export async function recalculateAccountabilityReport(id: string): Promise<AccountabilityReport> {
  const response = await apiFetch(`/api/accountability-reports/${id}/recalculate`, { method: "POST" })
  return parseOrThrow(response, "No se pudieron recalcular los indicadores")
}

export async function downloadAccountabilityReportPdf(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/accountability-reports/${id}/pdf`, { method: "GET" })
  if (!response.ok) throw new Error("No se pudo descargar el PDF de la rendición")
  return response.blob()
}

export async function uploadAccountabilityDocument(reportId: string, dto: UploadAccountabilityDocumentDto): Promise<AccountabilityDocument> {
  const response = await apiFetch(`/api/accountability-reports/${reportId}/documents`, {
    method: "POST",
    body: documentFormData(dto),
  })
  return parseOrThrow(response, "No se pudo cargar el documento de rendición")
}

export async function listAccountabilityDocuments(reportId: string): Promise<AccountabilityDocument[]> {
  const response = await apiFetch(`/api/accountability-reports/${reportId}/documents`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar los documentos de rendición")
}

export async function getAccountabilityDocument(reportId: string, documentId: string): Promise<AccountabilityDocument> {
  const response = await apiFetch(`/api/accountability-reports/${reportId}/documents/${documentId}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar el documento de rendición")
}

export async function deleteAccountabilityDocument(reportId: string, documentId: string): Promise<void> {
  const response = await apiFetch(`/api/accountability-reports/${reportId}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el documento de rendición")
}

export async function downloadAccountabilityDocument(downloadUrl: string): Promise<Blob> {
  const response = await apiFetch(downloadUrl, { method: "GET" })
  if (!response.ok) throw new Error("No se pudo descargar el documento de rendición")
  return response.blob()
}
