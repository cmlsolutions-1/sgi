import { apiFetch } from "@/lib/apiClient"
import type {
  PreventiveMeasure,
  PreventiveMeasureDocument,
  PreventiveMeasureDocumentResponse,
  PreventiveMeasureDocumentsResponse,
  PreventiveMeasureFilters,
  PreventiveMeasureList,
  PreventiveMeasureResponse,
  PreventiveMeasuresResponse,
  UploadPreventiveMeasureDocumentDto,
  UpsertPreventiveMeasureDto,
} from "@/types/manager/preventiveMeasure"

type ApiErrorResponse = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }>
  data?: unknown
}

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | PreventiveMeasureResponse
    | PreventiveMeasuresResponse
    | PreventiveMeasureDocumentResponse
    | PreventiveMeasureDocumentsResponse
    | ApiErrorResponse
    | null

  if (!res.ok || json?.ok === false) {
    const detail = json?.errors?.find((error: { message?: string }) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }

  if (!json) return undefined as T
  return "data" in json ? (json.data as T) : (json as T)
}

function buildQuery(filters: PreventiveMeasureFilters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    params.set(key, String(value))
  })

  const query = params.toString()
  return query ? `?${query}` : ""
}

function createDocumentFormData(dto: UploadPreventiveMeasureDocumentDto) {
  const formData = new FormData()
  formData.append("file", dto.file)
  formData.append("type", dto.type ?? "OTHER")
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  return formData
}

export async function listPreventiveMeasures(filters: PreventiveMeasureFilters = {}): Promise<PreventiveMeasureList> {
  const res = await apiFetch(`/api/preventive-measures${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<PreventiveMeasureList>(res, "No se pudo cargar las medidas de prevención")
}

export async function getPreventiveMeasure(id: string): Promise<PreventiveMeasure> {
  const res = await apiFetch(`/api/preventive-measures/${id}`, { method: "GET" })
  return parseOrThrow<PreventiveMeasure>(res, "No se pudo cargar la medida de prevención")
}

export async function createPreventiveMeasure(dto: UpsertPreventiveMeasureDto): Promise<PreventiveMeasure> {
  const res = await apiFetch("/api/preventive-measures", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<PreventiveMeasure>(res, "No se pudo crear la medida de prevención")
}

export async function updatePreventiveMeasure(id: string, dto: UpsertPreventiveMeasureDto): Promise<PreventiveMeasure> {
  const res = await apiFetch(`/api/preventive-measures/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<PreventiveMeasure>(res, "No se pudo actualizar la medida de prevención")
}

export async function deletePreventiveMeasure(id: string): Promise<void> {
  const res = await apiFetch(`/api/preventive-measures/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la medida de prevención")
}

export async function uploadPreventiveMeasureDocument(
  measureId: string,
  dto: UploadPreventiveMeasureDocumentDto,
): Promise<PreventiveMeasureDocument> {
  const res = await apiFetch(`/api/preventive-measures/${measureId}/documents`, {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<PreventiveMeasureDocument>(res, "No se pudo subir el documento de la medida")
}

export async function listPreventiveMeasureDocuments(measureId: string): Promise<PreventiveMeasureDocument[]> {
  const res = await apiFetch(`/api/preventive-measures/${measureId}/documents`, { method: "GET" })
  return parseOrThrow<PreventiveMeasureDocument[]>(res, "No se pudieron cargar los documentos de la medida")
}

export async function deletePreventiveMeasureDocument(measureId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/preventive-measures/${measureId}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el documento de la medida")
}

export async function downloadPreventiveMeasureDocumentFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? "No se pudo descargar el documento")
  }

  return res.blob()
}
