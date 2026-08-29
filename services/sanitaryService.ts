import { apiFetch } from "@/lib/apiClient"
import type {
  CreateHygieneSupplyRequest,
  CreatePestControlRequest,
  CreateSanitationRequest,
  HygieneSupply,
  HygieneSupplyFilters,
  PaginatedResponse,
  PestControlFilters,
  PestControlRecord,
  RecordStatus,
  SanitationFilters,
  SanitationRecord,
  SanitaryDocument,
  SanitaryDocumentType,
  SanitaryReferenceType,
  UpdateHygieneSupplyRequest,
  UpdatePestControlRequest,
  UpdateSanitationRequest,
  UploadSanitaryDocumentDto,
} from "@/types/manager/sanitary"

type ApiResponse<T> = {
  ok: boolean
  message?: string
  data?: T
  errors?: Array<{ message?: string }>
}

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null

  if (!res.ok || !json?.ok) {
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }

  return json.data as T
}

async function parseFileOrThrow(res: Response, fallbackMsg: string): Promise<Blob> {
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiResponse<unknown> | null
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }

  return res.blob()
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

function createDocumentFormData(dto: UploadSanitaryDocumentDto) {
  const formData = new FormData()
  formData.append("file", dto.file)

  if (dto.type) formData.append("type", dto.type)
  if (typeof dto.isConfirmed === "boolean") formData.append("isConfirmed", String(dto.isConfirmed))

  return formData
}

function documentBasePath(referenceType: SanitaryReferenceType, resourceId: string) {
  if (referenceType === "HYGIENE_SUPPLY") return `/api/hygiene-supplies/${resourceId}/documents`
  if (referenceType === "SANITATION") return `/api/sanitation/${resourceId}/documents`
  return `/api/pest-control/${resourceId}/documents`
}

export async function createHygieneSupply(dto: CreateHygieneSupplyRequest): Promise<HygieneSupply> {
  const res = await apiFetch("/api/hygiene-supplies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<HygieneSupply>(res, "No se pudo crear el insumo de higiene")
}

export async function listHygieneSupplies(
  filters: HygieneSupplyFilters = {},
): Promise<PaginatedResponse<HygieneSupply>> {
  const res = await apiFetch(`/api/hygiene-supplies${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<PaginatedResponse<HygieneSupply>>(res, "No se pudo cargar los insumos de higiene")
}

export async function getHygieneSupply(id: string): Promise<HygieneSupply> {
  const res = await apiFetch(`/api/hygiene-supplies/${id}`, { method: "GET" })
  return parseOrThrow<HygieneSupply>(res, "No se pudo cargar el insumo de higiene")
}

export async function updateHygieneSupply(
  id: string,
  dto: UpdateHygieneSupplyRequest,
): Promise<HygieneSupply> {
  const res = await apiFetch(`/api/hygiene-supplies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<HygieneSupply>(res, "No se pudo actualizar el insumo de higiene")
}

export async function changeHygieneSupplyStatus(id: string, status: RecordStatus): Promise<HygieneSupply> {
  const res = await apiFetch(`/api/hygiene-supplies/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<HygieneSupply>(res, "No se pudo actualizar el estado del insumo")
}

export async function createSanitationRecord(dto: CreateSanitationRequest): Promise<SanitationRecord> {
  const res = await apiFetch("/api/sanitation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<SanitationRecord>(res, "No se pudo crear el registro de saneamiento")
}

export async function listSanitationRecords(
  filters: SanitationFilters = {},
): Promise<PaginatedResponse<SanitationRecord>> {
  const res = await apiFetch(`/api/sanitation${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<PaginatedResponse<SanitationRecord>>(res, "No se pudo cargar saneamiento")
}

export async function getSanitationRecord(id: string): Promise<SanitationRecord> {
  const res = await apiFetch(`/api/sanitation/${id}`, { method: "GET" })
  return parseOrThrow<SanitationRecord>(res, "No se pudo cargar el registro de saneamiento")
}

export async function updateSanitationRecord(
  id: string,
  dto: UpdateSanitationRequest,
): Promise<SanitationRecord> {
  const res = await apiFetch(`/api/sanitation/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<SanitationRecord>(res, "No se pudo actualizar el registro de saneamiento")
}

export async function changeSanitationStatus(id: string, status: RecordStatus): Promise<SanitationRecord> {
  const res = await apiFetch(`/api/sanitation/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<SanitationRecord>(res, "No se pudo actualizar el estado de saneamiento")
}

export async function createPestControl(dto: CreatePestControlRequest): Promise<PestControlRecord> {
  const res = await apiFetch("/api/pest-control", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<PestControlRecord>(res, "No se pudo crear el control de plagas")
}

export async function listPestControls(
  filters: PestControlFilters = {},
): Promise<PaginatedResponse<PestControlRecord>> {
  const res = await apiFetch(`/api/pest-control${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<PaginatedResponse<PestControlRecord>>(res, "No se pudo cargar control de plagas")
}

export async function getPestControl(id: string): Promise<PestControlRecord> {
  const res = await apiFetch(`/api/pest-control/${id}`, { method: "GET" })
  return parseOrThrow<PestControlRecord>(res, "No se pudo cargar el control de plagas")
}

export async function updatePestControl(
  id: string,
  dto: UpdatePestControlRequest,
): Promise<PestControlRecord> {
  const res = await apiFetch(`/api/pest-control/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<PestControlRecord>(res, "No se pudo actualizar el control de plagas")
}

export async function changePestControlStatus(id: string, status: RecordStatus): Promise<PestControlRecord> {
  const res = await apiFetch(`/api/pest-control/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<PestControlRecord>(res, "No se pudo actualizar el estado del control de plagas")
}

export async function uploadSanitaryDocument(
  referenceType: SanitaryReferenceType,
  resourceId: string,
  dto: UploadSanitaryDocumentDto,
): Promise<SanitaryDocument> {
  const res = await apiFetch(documentBasePath(referenceType, resourceId), {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<SanitaryDocument>(res, "No se pudo subir el documento")
}

export async function listSanitaryDocuments(
  referenceType: SanitaryReferenceType,
  resourceId: string,
): Promise<SanitaryDocument[]> {
  const res = await apiFetch(documentBasePath(referenceType, resourceId), { method: "GET" })
  return parseOrThrow<SanitaryDocument[]>(res, "No se pudo cargar documentos")
}

export async function getSanitaryDocument(
  referenceType: SanitaryReferenceType,
  resourceId: string,
  documentId: string,
): Promise<SanitaryDocument> {
  const res = await apiFetch(`${documentBasePath(referenceType, resourceId)}/${documentId}`, { method: "GET" })
  return parseOrThrow<SanitaryDocument>(res, "No se pudo cargar el documento")
}

export async function deleteSanitaryDocument(
  referenceType: SanitaryReferenceType,
  resourceId: string,
  documentId: string,
): Promise<void> {
  const res = await apiFetch(`${documentBasePath(referenceType, resourceId)}/${documentId}`, { method: "DELETE" })
  await parseOrThrow<unknown>(res, "No se pudo eliminar el documento")
}

export async function downloadSanitaryDocumentFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(res, "No se pudo descargar el documento")
}

export function defaultSanitaryDocumentType(_referenceType: SanitaryReferenceType): SanitaryDocumentType {
  if (_referenceType === "HYGIENE_SUPPLY") return "HYGIENE_SUPPLY"
  if (_referenceType === "SANITATION") return "SANITATION"
  if (_referenceType === "PEST_CONTROL") return "PEST_CONTROL"
  return "OTHER"
}
