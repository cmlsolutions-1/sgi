import { apiFetch } from "@/lib/apiClient"
import type {
  CreateJobDto,
  Job,
  JobDocument,
  JobDocumentResponse,
  JobDocumentsResponse,
  JobOption,
  JobOptionsResponse,
  JobResponse,
  JobsPage,
  JobsResponse,
  UpdateJobDto,
  UploadJobDocumentDto,
} from "@/types/manager/job"

type ApiErrorResponse = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }>
  data?: unknown
}

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | JobResponse
    | JobsResponse
    | JobOptionsResponse
    | JobDocumentResponse
    | JobDocumentsResponse
    | ApiErrorResponse
    | null

  if (!res.ok || !json?.ok) {
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
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
  return parseOrThrow<Job>(res, "No se pudo cambiar el estado del cargo")
}

function createDocumentFormData(dto: UploadJobDocumentDto) {
  const formData = new FormData()
  formData.append("file", dto.file)
  formData.append("type", dto.type ?? "JOB_PROFILE")
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  if (dto.description?.trim()) formData.append("description", dto.description.trim())
  return formData
}

async function parseFileOrThrow(res: Response, fallbackMsg: string): Promise<Blob> {
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
    const detail = json?.errors?.find((error) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }
  return res.blob()
}

export async function uploadJobDocument(jobId: string, dto: UploadJobDocumentDto): Promise<JobDocument> {
  const res = await apiFetch(`/api/jobs/${jobId}/documents`, {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<JobDocument>(res, "No se pudo cargar la evidencia del cargo")
}

export async function listJobDocuments(jobId: string): Promise<JobDocument[]> {
  const res = await apiFetch(`/api/jobs/${jobId}/documents`, { method: "GET" })
  return parseOrThrow<JobDocument[]>(res, "No se pudieron cargar las evidencias del cargo")
}

export async function getJobDocument(jobId: string, documentId: string): Promise<JobDocument> {
  const res = await apiFetch(`/api/jobs/${jobId}/documents/${documentId}`, { method: "GET" })
  return parseOrThrow<JobDocument>(res, "No se pudo cargar la evidencia del cargo")
}

export async function deleteJobDocument(jobId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/jobs/${jobId}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la evidencia del cargo")
}

export async function downloadJobDocumentFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(res, "No se pudo descargar la evidencia del cargo")
}
