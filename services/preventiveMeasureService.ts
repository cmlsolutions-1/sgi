import { apiFetch } from "@/lib/apiClient"
import type {
  PreventiveMeasure,
  PreventiveMeasureFilters,
  PreventiveMeasureList,
  PreventiveMeasureResponse,
  PreventiveMeasuresResponse,
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
