import { apiFetch } from "@/lib/apiClient"
import type {
  ApproveWorkPlanDto,
  GeneratedWorkPlanDocument,
  GenerateWorkPlanDocumentDto,
  UpsertWorkPlanDto,
  UploadWorkPlanDocumentDto,
  WorkPlanApprovalResult,
  WorkPlanDocument,
  WorkPlanFilters,
  WorkPlanItem,
  WorkPlanList,
  WorkPlanSummary,
} from "@/types/manager/work-plan"

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

function buildQuery(filters: WorkPlanFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listWorkPlanItems(filters: WorkPlanFilters = {}): Promise<WorkPlanList> {
  const response = await apiFetch(`/api/work-plan${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar el plan de trabajo")
}

export async function getWorkPlanItem(id: string): Promise<WorkPlanItem> {
  const response = await apiFetch(`/api/work-plan/${id}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar la actividad")
}

export async function createWorkPlanItem(dto: UpsertWorkPlanDto): Promise<WorkPlanItem> {
  const response = await apiFetch("/api/work-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo crear la actividad")
}

export async function updateWorkPlanItem(id: string, dto: UpsertWorkPlanDto): Promise<WorkPlanItem> {
  const response = await apiFetch(`/api/work-plan/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo actualizar la actividad")
}

export async function deleteWorkPlanItem(id: string): Promise<void> {
  const response = await apiFetch(`/api/work-plan/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar la actividad")
}

export async function getWorkPlanSummary(year?: number): Promise<WorkPlanSummary> {
  const query = year ? `?year=${year}` : ""
  const response = await apiFetch(`/api/work-plan/summary${query}`, { method: "GET" })
  return parseOrThrow(response, "No se pudo cargar el resumen del plan")
}

export async function generateWorkPlanDocument(dto: GenerateWorkPlanDocumentDto): Promise<GeneratedWorkPlanDocument> {
  const response = await apiFetch("/api/work-plan/generate-document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow(response, "No se pudo generar el documento")
}

export async function approveWorkPlan(dto: ApproveWorkPlanDto): Promise<WorkPlanApprovalResult> {
  const formData = new FormData()
  dto.workPlanItemIds.forEach((id) => formData.append("workPlanItemIds", id))
  formData.append("approvedBy", dto.approvedBy.trim())
  formData.append("file", dto.file)
  formData.append("type", dto.type ?? "WORK_PLAN_SIGNED")
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch("/api/work-plan/approve", { method: "POST", body: formData })
  return parseOrThrow(response, "No se pudo aprobar el plan de trabajo")
}

export async function uploadWorkPlanDocument(id: string, dto: UploadWorkPlanDocumentDto): Promise<WorkPlanDocument> {
  const formData = new FormData()
  formData.append("file", dto.file)
  formData.append("type", dto.type ?? "WORK_PLAN_SIGNED")
  formData.append("isConfirmed", String(dto.isConfirmed ?? true))
  const response = await apiFetch(`/api/work-plan/${id}/documents`, { method: "POST", body: formData })
  return parseOrThrow(response, "No se pudo cargar el documento")
}

export async function listWorkPlanDocuments(id: string): Promise<WorkPlanDocument[]> {
  const response = await apiFetch(`/api/work-plan/${id}/documents`, { method: "GET" })
  return parseOrThrow(response, "No se pudieron cargar los documentos")
}

export async function deleteWorkPlanDocument(id: string, documentId: string): Promise<void> {
  const response = await apiFetch(`/api/work-plan/${id}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(response, "No se pudo eliminar el documento")
}

export async function downloadWorkPlanFile(downloadUrl: string): Promise<Blob> {
  const response = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(response, "No se pudo descargar el documento")
}
