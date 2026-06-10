import { apiFetch } from "@/lib/apiClient"
import type {
  ManagedDocument,
  ManagedDocumentFile,
  ManagedDocumentFileResponse,
  ManagedDocumentFilesResponse,
  ManagedDocumentFilters,
  ManagedDocumentResponse,
  ManagedDocumentsResponse,
  UploadManagedDocumentFileDto,
  UpsertManagedDocumentDto,
} from "@/types/manager/document-management"

type ApiErrorResponse = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }>
  data?: unknown
}

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | ManagedDocumentResponse
    | ManagedDocumentsResponse
    | ManagedDocumentFileResponse
    | ManagedDocumentFilesResponse
    | ApiErrorResponse
    | null

  if (!res.ok || json?.ok === false) {
    const detail = json?.errors?.find((error: { message?: string }) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }

  if (!json) return undefined as T
  return "data" in json ? (json.data as T) : (json as T)
}

function buildQuery(filters: ManagedDocumentFilters = {}) {
  const params = new URLSearchParams()
  if (filters.workAreaId) params.set("workAreaId", filters.workAreaId)
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function createManagedDocument(dto: UpsertManagedDocumentDto): Promise<ManagedDocument> {
  const res = await apiFetch("/api/document-management", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<ManagedDocument>(res, "No se pudo crear el documento")
}

export async function listManagedDocuments(filters: ManagedDocumentFilters = {}): Promise<ManagedDocument[]> {
  const res = await apiFetch(`/api/document-management${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<ManagedDocument[]>(res, "No se pudo cargar los documentos")
}

export async function getManagedDocument(id: string): Promise<ManagedDocument> {
  const res = await apiFetch(`/api/document-management/${id}`, { method: "GET" })
  return parseOrThrow<ManagedDocument>(res, "No se pudo cargar el documento")
}

export async function updateManagedDocument(id: string, dto: UpsertManagedDocumentDto): Promise<ManagedDocument> {
  const res = await apiFetch(`/api/document-management/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<ManagedDocument>(res, "No se pudo actualizar el documento")
}

export async function deleteManagedDocument(id: string): Promise<void> {
  const res = await apiFetch(`/api/document-management/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el documento")
}

export async function activateManagedDocument(id: string): Promise<ManagedDocument> {
  const res = await apiFetch(`/api/document-management/active/${id}`, { method: "PUT" })
  return parseOrThrow<ManagedDocument>(res, "No se pudo activar el documento")
}

export async function uploadManagedDocumentFile(
  documentManagementId: string,
  dto: UploadManagedDocumentFileDto,
): Promise<ManagedDocumentFile> {
  const formData = new FormData()
  formData.append("file", dto.file)
  formData.append("type", dto.type ?? "DOCUMENT_MANAGEMENT")
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))

  const res = await apiFetch(`/api/document-management/${documentManagementId}/documents`, {
    method: "POST",
    body: formData,
  })
  return parseOrThrow<ManagedDocumentFile>(res, "No se pudo subir el archivo")
}

export async function listManagedDocumentFiles(documentManagementId: string): Promise<ManagedDocumentFile[]> {
  const res = await apiFetch(`/api/document-management/${documentManagementId}/documents`, { method: "GET" })
  return parseOrThrow<ManagedDocumentFile[]>(res, "No se pudo cargar los archivos")
}

export async function getManagedDocumentFile(
  documentManagementId: string,
  documentId: string,
): Promise<ManagedDocumentFile> {
  const res = await apiFetch(`/api/document-management/${documentManagementId}/documents/${documentId}`, {
    method: "GET",
  })
  return parseOrThrow<ManagedDocumentFile>(res, "No se pudo cargar el archivo")
}

export async function deleteManagedDocumentFile(documentManagementId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/document-management/${documentManagementId}/documents/${documentId}`, {
    method: "DELETE",
  })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el archivo")
}

export async function downloadManagedDocumentFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
    throw new Error(json?.message ?? "No se pudo descargar el archivo")
  }
  return res.blob()
}
