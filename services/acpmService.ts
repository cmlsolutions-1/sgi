import { apiFetch } from "@/lib/apiClient"
import type {
  Acpm,
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
