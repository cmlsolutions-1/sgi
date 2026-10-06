import { apiFetch } from "@/lib/apiClient"
import type {
  SstPolicy,
  SstPolicyFilters,
  SstPolicyList,
  UpsertSstPolicyDto,
} from "@/types/manager/sst-policy"

type ApiErrorResponse = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }> | null
  data?: unknown
}

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
  if (!res.ok || json?.ok === false || !json) {
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }
  return json.data as T
}

function buildQuery(filters: SstPolicyFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listSstPolicies(filters?: SstPolicyFilters): Promise<SstPolicyList> {
  const res = await apiFetch(`/api/sst-policies${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<SstPolicyList>(res, "No se pudieron cargar las politicas SST")
}

export async function createSstPolicy(dto: UpsertSstPolicyDto): Promise<SstPolicy> {
  const res = await apiFetch("/api/sst-policies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<SstPolicy>(res, "No se pudo crear la politica SST")
}
