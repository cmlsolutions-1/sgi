import { apiFetch } from "@/lib/apiClient"
import type {
  CreateJobDto,
  Job,
  JobOption,
  JobOptionsResponse,
  JobResponse,
  JobsPage,
  JobsResponse,
  UpdateJobDto,
} from "@/types/manager/job"

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as JobResponse | JobsResponse | JobOptionsResponse | null

  if (!res.ok || !json?.ok) {
    throw new Error(json?.message ?? fallbackMsg)
  }

  return json.data as T
}

export async function createJob(dto: CreateJobDto): Promise<Job> {
  const res = await apiFetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Job>(res, "No se pudo crear el puesto de trabajo")
}

export async function listJobs(): Promise<JobsPage> {
  const res = await apiFetch("/api/jobs", { method: "GET" })
  return parseOrThrow<JobsPage>(res, "No se pudo listar los puestos de trabajo")
}

export async function listJobOptions(): Promise<JobOption[]> {
  const res = await apiFetch("/api/jobs/options", { method: "GET" })
  return parseOrThrow<JobOption[]>(res, "No se pudo cargar los puestos de trabajo")
}

export async function getJobById(id: string): Promise<Job> {
  const res = await apiFetch(`/api/jobs/${id}`, { method: "GET" })
  return parseOrThrow<Job>(res, "No se pudo cargar el puesto de trabajo")
}

export async function updateJob(id: string, dto: UpdateJobDto): Promise<Job> {
  const res = await apiFetch(`/api/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Job>(res, "No se pudo actualizar el puesto de trabajo")
}

export async function deleteJob(id: string): Promise<void> {
  const res = await apiFetch(`/api/jobs/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el puesto de trabajo")
}

export async function activateJob(id: string): Promise<Job> {
  const res = await apiFetch(`/api/jobs/active/${id}`, { method: "PUT" })
  return parseOrThrow<Job>(res, "No se pudo activar el puesto de trabajo")
}
