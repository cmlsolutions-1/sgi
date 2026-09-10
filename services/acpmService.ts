import { apiFetch } from "@/lib/apiClient"
import type {
  Acpm,
  AcpmClosureEvidence,
  AcpmClosureEvidenceResponse,
  AcpmClosureEvidencesResponse,
  AcpmFilters,
  AcpmFollowUp,
  AcpmFollowUpResponse,
  AcpmFollowUpsResponse,
  AcpmList,
  AcpmListResponse,
  AcpmResponse,
  ChangeAcpmStatusDto,
  CreateAcpmDto,
  CreateAcpmFollowUpDto,
  UploadAcpmClosureEvidenceDto,
  UpdateAcpmDto,
} from "@/types/manager/acpm"

type ApiErrorResponse = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }>
  data?: unknown
}

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | AcpmResponse
    | AcpmListResponse
    | AcpmFollowUpResponse
    | AcpmFollowUpsResponse
    | AcpmClosureEvidenceResponse
    | AcpmClosureEvidencesResponse
    | ApiErrorResponse
    | null

  if (!res.ok || json?.ok === false || !json) {
    const detail = json?.errors?.find((error: { message?: string }) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }

  return json.data as T
}

function buildQuery(filters: AcpmFilters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  })

  const query = params.toString()
  return query ? `?${query}` : ""
}

function createClosureEvidenceFormData(dto: UploadAcpmClosureEvidenceDto) {
  const formData = new FormData()
  formData.append("file", dto.file)
  if (dto.type) formData.append("type", dto.type)
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  return formData
}

export async function listAcpms(filters?: AcpmFilters): Promise<AcpmList> {
  const res = await apiFetch(`/api/acpm${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<AcpmList>(res, "No se pudieron cargar los ACPM")
}

export async function getAcpm(id: string): Promise<Acpm> {
  const res = await apiFetch(`/api/acpm/${id}`, { method: "GET" })
  return parseOrThrow<Acpm>(res, "No se pudo cargar el ACPM")
}

export async function createAcpm(dto: CreateAcpmDto): Promise<Acpm> {
  const res = await apiFetch("/api/acpm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Acpm>(res, "No se pudo crear el ACPM")
}

export async function updateAcpm(id: string, dto: UpdateAcpmDto): Promise<Acpm> {
  const res = await apiFetch(`/api/acpm/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Acpm>(res, "No se pudo actualizar el ACPM")
}

export async function changeAcpmStatus(id: string, dto: ChangeAcpmStatusDto): Promise<Acpm> {
  const res = await apiFetch(`/api/acpm/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Acpm>(res, "No se pudo cambiar el estado del ACPM")
}

export async function createAcpmFollowUp(acpmId: string, dto: CreateAcpmFollowUpDto): Promise<AcpmFollowUp> {
  const res = await apiFetch(`/api/acpm/${acpmId}/follow-ups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<AcpmFollowUp>(res, "No se pudo crear el seguimiento")
}

export async function listAcpmFollowUps(acpmId: string): Promise<AcpmFollowUp[]> {
  const res = await apiFetch(`/api/acpm/${acpmId}/follow-ups`, { method: "GET" })
  return parseOrThrow<AcpmFollowUp[]>(res, "No se pudieron cargar los seguimientos")
}

export async function getAcpmFollowUp(acpmId: string, followUpId: string): Promise<AcpmFollowUp> {
  const res = await apiFetch(`/api/acpm/${acpmId}/follow-ups/${followUpId}`, { method: "GET" })
  return parseOrThrow<AcpmFollowUp>(res, "No se pudo cargar el seguimiento")
}

export async function uploadAcpmClosureEvidence(
  acpmId: string,
  dto: UploadAcpmClosureEvidenceDto,
): Promise<AcpmClosureEvidence> {
  const res = await apiFetch(`/api/acpm/${acpmId}/closure-evidence`, {
    method: "POST",
    body: createClosureEvidenceFormData(dto),
  })
  return parseOrThrow<AcpmClosureEvidence>(res, "No se pudo subir la evidencia de cierre")
}

export async function listAcpmClosureEvidence(acpmId: string): Promise<AcpmClosureEvidence[]> {
  const res = await apiFetch(`/api/acpm/${acpmId}/closure-evidence`, { method: "GET" })
  return parseOrThrow<AcpmClosureEvidence[]>(res, "No se pudieron cargar las evidencias de cierre")
}

export async function getAcpmClosureEvidence(acpmId: string, documentId: string): Promise<AcpmClosureEvidence> {
  const res = await apiFetch(`/api/acpm/${acpmId}/closure-evidence/${documentId}`, { method: "GET" })
  return parseOrThrow<AcpmClosureEvidence>(res, "No se pudo cargar la evidencia de cierre")
}

export async function deleteAcpmClosureEvidence(acpmId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/acpm/${acpmId}/closure-evidence/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la evidencia de cierre")
}

export async function downloadAcpmClosureEvidenceFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? "No se pudo descargar la evidencia")
  }

  return res.blob()
}
