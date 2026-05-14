import { apiFetch } from "@/lib/apiClient"
import type {
  CreateWorkAreaDto,
  UpdateWorkAreaDto,
  WorkArea,
  WorkAreaOption,
  WorkAreaOptionsResponse,
  WorkAreaResponse,
  WorkAreasResponse,
} from "@/types/manager/work-area"

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | WorkAreaResponse
    | WorkAreasResponse
    | WorkAreaOptionsResponse
    | null

  if (!res.ok || !json?.ok) {
    throw new Error(json?.message ?? fallbackMsg)
  }

  return json.data as T
}

export async function createWorkArea(dto: CreateWorkAreaDto): Promise<WorkArea> {
  const res = await apiFetch("/api/work-area", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<WorkArea>(res, "No se pudo crear el area de trabajo")
}

export async function listWorkAreas(): Promise<WorkArea[]> {
  const res = await apiFetch("/api/work-area", { method: "GET" })
  return parseOrThrow<WorkArea[]>(res, "No se pudo listar las areas de trabajo")
}

export async function listWorkAreaOptions(): Promise<WorkAreaOption[]> {
  const res = await apiFetch("/api/work-area/options", { method: "GET" })
  return parseOrThrow<WorkAreaOption[]>(res, "No se pudo cargar las areas de trabajo")
}

export async function getWorkAreaById(id: string): Promise<WorkArea> {
  const res = await apiFetch(`/api/work-area/${id}`, { method: "GET" })
  return parseOrThrow<WorkArea>(res, "No se pudo cargar el area de trabajo")
}

export async function updateWorkArea(id: string, dto: UpdateWorkAreaDto): Promise<WorkArea> {
  const res = await apiFetch(`/api/work-area/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<WorkArea>(res, "No se pudo actualizar el area de trabajo")
}

export async function deleteWorkArea(id: string): Promise<void> {
  const res = await apiFetch(`/api/work-area/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el area de trabajo")
}

export async function activateWorkArea(id: string): Promise<WorkArea> {
  const res = await apiFetch(`/api/work-area/active/${id}`, { method: "PUT" })
  return parseOrThrow<WorkArea>(res, "No se pudo activar el area de trabajo")
}
