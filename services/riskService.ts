import { apiFetch } from "@/lib/apiClient"
import type {
  CreateRiskDto,
  Risk,
  RiskCatalogItem,
  RiskCatalogResponse,
  RiskDocument,
  RiskDocumentResponse,
  RiskDocumentsResponse,
  RiskHazardDescription,
  RiskHazardDescriptionsResponse,
  RiskList,
  RiskResponse,
  RisksResponse,
  RiskStatus,
  RiskValueCatalogItem,
  RiskValueCatalogResponse,
  UpdateRiskDto,
  UploadRiskDocumentDto,
} from "@/types/manager/risk"

type ApiErrorResponse = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }>
  data?: unknown
}

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | RiskResponse
    | RisksResponse
    | RiskCatalogResponse
    | RiskHazardDescriptionsResponse
    | RiskValueCatalogResponse
    | RiskDocumentResponse
    | RiskDocumentsResponse
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

function createDocumentFormData(dto: UploadRiskDocumentDto) {
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

export async function createRisk(dto: CreateRiskDto): Promise<Risk> {
  const res = await apiFetch("/api/risks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Risk>(res, "No se pudo crear el riesgo")
}

export async function listRisks(): Promise<RiskList> {
  const res = await apiFetch("/api/risks", { method: "GET" })
  return parseOrThrow<RiskList>(res, "No se pudo cargar los riesgos")
}

export async function updateRisk(id: string, dto: UpdateRiskDto): Promise<Risk> {
  const res = await apiFetch(`/api/risks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Risk>(res, "No se pudo actualizar el riesgo")
}

export async function deleteRisk(id: string): Promise<void> {
  const res = await apiFetch(`/api/risks/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el riesgo")
}

export async function changeRiskStatus(id: string, status: RiskStatus): Promise<Risk> {
  const res = await apiFetch(`/api/risks/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<Risk>(res, "No se pudo actualizar el estado del riesgo")
}

export async function activateRisk(id: string): Promise<Risk> {
  const res = await apiFetch(`/api/risks/active/${id}`, { method: "PUT" })
  return parseOrThrow<Risk>(res, "No se pudo activar el riesgo")
}

export async function listHazardTypes(): Promise<RiskCatalogItem[]> {
  const res = await apiFetch("/api/risks/catalogs/hazard-types", { method: "GET" })
  return parseOrThrow<RiskCatalogItem[]>(res, "No se pudo cargar los tipos de peligro")
}

export async function listHazardDescriptions(): Promise<RiskHazardDescription[]> {
  const res = await apiFetch("/api/risks/catalogs/hazard-descriptions", { method: "GET" })
  return parseOrThrow<RiskHazardDescription[]>(res, "No se pudo cargar las descripciones de peligro")
}

export async function listHazardDescriptionsByType(hazardTypeId: string): Promise<RiskHazardDescription[]> {
  const res = await apiFetch(`/api/risks/catalogs/hazard-types/${hazardTypeId}/descriptions`, { method: "GET" })
  return parseOrThrow<RiskHazardDescription[]>(res, "No se pudo cargar las descripciones del tipo de peligro")
}

export async function listDeficiencyLevels(): Promise<RiskValueCatalogItem[]> {
  const res = await apiFetch("/api/risks/catalogs/deficiency-levels", { method: "GET" })
  return parseOrThrow<RiskValueCatalogItem[]>(res, "No se pudo cargar los niveles de deficiencia")
}

export async function listExposureLevels(): Promise<RiskValueCatalogItem[]> {
  const res = await apiFetch("/api/risks/catalogs/exposure-levels", { method: "GET" })
  return parseOrThrow<RiskValueCatalogItem[]>(res, "No se pudo cargar los niveles de exposicion")
}

export async function listConsequenceLevels(): Promise<RiskValueCatalogItem[]> {
  const res = await apiFetch("/api/risks/catalogs/consequence-levels", { method: "GET" })
  return parseOrThrow<RiskValueCatalogItem[]>(res, "No se pudo cargar los niveles de consecuencia")
}

export async function uploadRiskDocument(riskId: string, dto: UploadRiskDocumentDto): Promise<RiskDocument> {
  const res = await apiFetch(`/api/risks/${riskId}/documents`, {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<RiskDocument>(res, "No se pudo subir la evidencia del riesgo")
}

export async function listRiskDocuments(riskId: string): Promise<RiskDocument[]> {
  const res = await apiFetch(`/api/risks/${riskId}/documents`, { method: "GET" })
  return parseOrThrow<RiskDocument[]>(res, "No se pudo cargar las evidencias del riesgo")
}

export async function deleteRiskDocument(riskId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/risks/${riskId}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la evidencia del riesgo")
}

export async function downloadRiskDocumentFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(res, "No se pudo descargar la evidencia del riesgo")
}
