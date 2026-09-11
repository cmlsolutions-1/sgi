import { apiFetch } from "@/lib/apiClient"
import type {
  ChangeInvestigationStatusDto,
  Investigation,
  InvestigationEvidence,
  InvestigationEvidenceResponse,
  InvestigationEvidencesResponse,
  InvestigationFilters,
  InvestigationList,
  InvestigationListResponse,
  InvestigationResponse,
  InvestigationSummary,
  InvestigationSummaryResponse,
  InvestigationTraceability,
  InvestigationTraceabilityResponse,
  UpsertInvestigationDto,
  UploadInvestigationEvidenceDto,
  VerifyInvestigationEfficacyDto,
} from "@/types/manager/investigation"

type ApiErrorResponse = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }>
  data?: unknown
}

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | InvestigationResponse
    | InvestigationListResponse
    | InvestigationSummaryResponse
    | InvestigationTraceabilityResponse
    | InvestigationEvidenceResponse
    | InvestigationEvidencesResponse
    | ApiErrorResponse
    | null

  if (!res.ok || json?.ok === false || !json) {
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }

  return json.data as T
}

function buildQuery(filters: InvestigationFilters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  })

  const query = params.toString()
  return query ? `?${query}` : ""
}

function createEvidenceFormData(dto: UploadInvestigationEvidenceDto) {
  const formData = new FormData()
  formData.append("file", dto.file)
  if (dto.type) formData.append("type", dto.type)
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  if (dto.observation?.trim()) formData.append("observation", dto.observation.trim())
  return formData
}

export async function listInvestigations(filters?: InvestigationFilters): Promise<InvestigationList> {
  const res = await apiFetch(`/api/investigations${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<InvestigationList>(res, "No se pudieron cargar las investigaciones")
}

export async function getInvestigation(id: string): Promise<Investigation> {
  const res = await apiFetch(`/api/investigations/${id}`, { method: "GET" })
  return parseOrThrow<Investigation>(res, "No se pudo cargar la investigación")
}

export async function getInvestigationSummary(
  filters?: Pick<InvestigationFilters, "responsibleEmployeeId" | "startDate" | "endDate">,
): Promise<InvestigationSummary> {
  const res = await apiFetch(`/api/investigations/summary${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<InvestigationSummary>(res, "No se pudo cargar el resumen de investigaciones")
}

export async function getInvestigationTraceability(id: string): Promise<InvestigationTraceability[]> {
  const res = await apiFetch(`/api/investigations/${id}/traceability`, { method: "GET" })
  return parseOrThrow<InvestigationTraceability[]>(res, "No se pudo cargar la trazabilidad")
}

export async function createInvestigation(dto: UpsertInvestigationDto): Promise<Investigation> {
  const res = await apiFetch("/api/investigations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Investigation>(res, "No se pudo crear la investigación")
}

export async function updateInvestigation(id: string, dto: UpsertInvestigationDto): Promise<Investigation> {
  const res = await apiFetch(`/api/investigations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Investigation>(res, "No se pudo actualizar la investigación")
}

export async function changeInvestigationStatus(
  id: string,
  dto: ChangeInvestigationStatusDto,
): Promise<Investigation> {
  const res = await apiFetch(`/api/investigations/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Investigation>(res, "No se pudo cambiar el estado de la investigación")
}

export async function verifyInvestigationEfficacy(
  id: string,
  dto: VerifyInvestigationEfficacyDto,
): Promise<Investigation> {
  const res = await apiFetch(`/api/investigations/${id}/efficacy`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Investigation>(res, "No se pudo verificar la eficacia")
}

export async function uploadInvestigationEvidence(
  investigationId: string,
  dto: UploadInvestigationEvidenceDto,
): Promise<InvestigationEvidence> {
  const res = await apiFetch(`/api/investigations/${investigationId}/documents`, {
    method: "POST",
    body: createEvidenceFormData(dto),
  })
  return parseOrThrow<InvestigationEvidence>(res, "No se pudo subir la evidencia de la investigación")
}

export async function listInvestigationEvidence(investigationId: string): Promise<InvestigationEvidence[]> {
  const res = await apiFetch(`/api/investigations/${investigationId}/documents`, { method: "GET" })
  return parseOrThrow<InvestigationEvidence[]>(res, "No se pudieron cargar las evidencias")
}

export async function getInvestigationEvidence(
  investigationId: string,
  documentId: string,
): Promise<InvestigationEvidence> {
  const res = await apiFetch(`/api/investigations/${investigationId}/documents/${documentId}`, { method: "GET" })
  return parseOrThrow<InvestigationEvidence>(res, "No se pudo cargar la evidencia")
}

export async function deleteInvestigationEvidence(investigationId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/investigations/${investigationId}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la evidencia")
}
