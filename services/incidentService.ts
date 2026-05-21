import { apiFetch } from "@/lib/apiClient"
import type {
  CreateIncidentDto,
  Incident,
  IncidentResponse,
  IncidentsResponse,
  UpdateIncidentDto,
} from "@/types/manager/incident"

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as IncidentResponse | IncidentsResponse | null

  if (!res.ok || !json?.ok) {
    throw new Error(json?.message ?? fallbackMsg)
  }

  return json.data as T
}

export async function createIncident(dto: CreateIncidentDto): Promise<Incident> {
  const res = await apiFetch("/api/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Incident>(res, "No se pudo crear el incidente")
}

export async function listIncidents(employeeId?: string): Promise<Incident[]> {
  const query = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : ""
  const res = await apiFetch(`/api/incidents${query}`, { method: "GET" })
  return parseOrThrow<Incident[]>(res, "No se pudo cargar los incidentes")
}

export async function updateIncident(id: string, dto: UpdateIncidentDto): Promise<Incident> {
  const res = await apiFetch(`/api/incidents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Incident>(res, "No se pudo actualizar el incidente")
}

export async function deleteIncident(id: string): Promise<void> {
  const res = await apiFetch(`/api/incidents/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el incidente")
}

export async function activateIncident(id: string): Promise<Incident> {
  const res = await apiFetch(`/api/incidents/active/${id}`, { method: "PUT" })
  return parseOrThrow<Incident>(res, "No se pudo activar el incidente")
}
