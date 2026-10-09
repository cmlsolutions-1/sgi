import { apiFetch } from "@/lib/apiClient"
import type {
  GenerateSstIndicatorReportDto,
  SstIndicatorFilters,
  SstIndicatorReport,
  SstIndicatorReportList,
} from "@/types/manager/sst-indicators"

type ApiEnvelope<T> = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }> | null
  data?: T
}

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

function buildQuery(filters: SstIndicatorFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listSstIndicatorReports(filters: SstIndicatorFilters = {}): Promise<SstIndicatorReportList> {
  const response = await apiFetch(`/api/sst-indicators${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar los informes de indicadores SST")
}

export async function getSstIndicatorReport(id: string): Promise<SstIndicatorReport> {
  const response = await apiFetch(`/api/sst-indicators/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar el informe de indicadores SST")
}

export async function generateSstIndicatorReport(dto: GenerateSstIndicatorReportDto): Promise<SstIndicatorReport> {
  const response = await apiFetch("/api/sst-indicators/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudieron generar los indicadores SST")
}

export async function exportSstIndicatorReport(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/sst-indicators/${id}/export`, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo exportar el informe de indicadores SST")
}
