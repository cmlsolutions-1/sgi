import { apiFetch } from "@/lib/apiClient"
import type {
  SstAudit,
  SstAuditAction,
  SstAuditDocument,
  SstAuditFilters,
  SstAuditList,
  SstAuditStatus,
  UpsertSstAuditActionDto,
  UpsertSstAuditDto,
  UploadSstAuditDocumentDto,
} from "@/types/manager/sst-audit"

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

function buildQuery(filters: SstAuditFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listSstAudits(filters: SstAuditFilters = {}): Promise<SstAuditList> {
  const response = await apiFetch(`/api/sst-audits${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar las auditorías SST")
}

export async function getSstAudit(id: string): Promise<SstAudit> {
  const response = await apiFetch(`/api/sst-audits/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar la auditoría SST")
}

export async function createSstAudit(dto: UpsertSstAuditDto): Promise<SstAudit> {
  const response = await apiFetch("/api/sst-audits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo crear la auditoría SST")
}

export async function updateSstAudit(id: string, dto: UpsertSstAuditDto): Promise<SstAudit> {
  const response = await apiFetch(`/api/sst-audits/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo actualizar la auditoría SST")
}

export async function changeSstAuditStatus(id: string, status: SstAuditStatus): Promise<SstAudit> {
  const response = await apiFetch(`/api/sst-audits/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow(response, "No se pudo cambiar el estado de la auditoría SST")
}

export async function uploadSstAuditDocument(auditId: string, dto: UploadSstAuditDocumentDto): Promise<SstAuditDocument> {
  const data = new FormData()
  data.append("file", dto.file)
  data.append("type", dto.type)
  if (dto.description?.trim()) data.append("description", dto.description.trim())
  data.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch(`/api/sst-audits/${auditId}/documents`, { method: "POST", body: data })
  return parseOrThrow(response, "No se pudo cargar el documento de auditoría")
}

export async function listSstAuditDocuments(auditId: string): Promise<SstAuditDocument[]> {
  const response = await apiFetch(`/api/sst-audits/${auditId}/documents`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar los documentos de auditoría")
}

export async function deleteSstAuditDocument(auditId: string, documentId: string): Promise<void> {
  const response = await apiFetch(`/api/sst-audits/${auditId}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el documento de auditoría")
}

export async function downloadSstAuditDocument(downloadUrl: string): Promise<Blob> {
  const response = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar el documento de auditoría")
}

export async function createSstAuditAction(auditId: string, dto: UpsertSstAuditActionDto): Promise<SstAuditAction> {
  const response = await apiFetch(`/api/sst-audits/${auditId}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo agregar la acción ACPM")
}

export async function listSstAuditActions(auditId: string): Promise<SstAuditAction[]> {
  const response = await apiFetch(`/api/sst-audits/${auditId}/actions`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar las acciones ACPM")
}

export async function exportSstAudit(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/sst-audits/${id}/export`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo exportar la auditoría SST")
}
