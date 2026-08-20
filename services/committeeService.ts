import { apiFetch } from "@/lib/apiClient"
import type {
  Committee,
  CommitteeDocument,
  CommitteeDocumentsResponse,
  CommitteeDocumentResponse,
  CommitteeFilters,
  CommitteeList,
  CommitteeListResponse,
  CommitteeResponse,
  CommitteeStatus,
  CreateCommitteeDto,
  CreateMeetingDto,
  Meeting,
  MeetingFilters,
  MeetingList,
  MeetingListResponse,
  MeetingResponse,
  UpdateCommitteeDto,
  UpdateMeetingDto,
  UploadCommitteeDocumentDto,
} from "@/types/manager/committee"

type CommitteeApiResponse =
  | CommitteeResponse
  | CommitteeListResponse
  | MeetingResponse
  | MeetingListResponse
  | CommitteeDocumentResponse
  | CommitteeDocumentsResponse
  | { ok: boolean; message?: string; data?: unknown; errors?: Array<{ message?: string }> }

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as CommitteeApiResponse | null

  if (!res.ok || !json?.ok) {
    const detail = json?.errors?.find((error: { message?: string }) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }

  return json.data as T
}

function buildQuery(filters: Record<string, string | number | undefined | null> = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      params.set(key, String(value))
    }
  })

  const query = params.toString()
  return query ? `?${query}` : ""
}

function createDocumentFormData(dto: UploadCommitteeDocumentDto) {
  const formData = new FormData()
  formData.append("file", dto.file)

  if (dto.type) {
    formData.append("type", dto.type)
  }

  if (typeof dto.isConfirmed === "boolean") {
    formData.append("isConfirmed", String(dto.isConfirmed))
  }

  return formData
}

async function parseFileOrThrow(res: Response, fallbackMsg: string): Promise<Blob> {
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as
      | { message?: string; errors?: Array<{ message?: string }> }
      | null
    const detail = json?.errors?.find((error: { message?: string }) => error.message)?.message
    throw new Error(detail ?? json?.message ?? fallbackMsg)
  }

  return res.blob()
}

export async function createCommittee(dto: CreateCommitteeDto): Promise<Committee> {
  const res = await apiFetch("/api/committee-management", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Committee>(res, "No se pudo crear el comité")
}

export async function listCommittees(filters: CommitteeFilters = {}): Promise<CommitteeList> {
  const res = await apiFetch(`/api/committee-management${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<CommitteeList>(res, "No se pudo cargar los comités")
}

export async function getCommitteeById(id: string): Promise<Committee> {
  const res = await apiFetch(`/api/committee-management/${id}`, { method: "GET" })
  return parseOrThrow<Committee>(res, "No se pudo cargar el comité")
}

export async function updateCommittee(id: string, dto: UpdateCommitteeDto): Promise<Committee> {
  const res = await apiFetch(`/api/committee-management/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Committee>(res, "No se pudo actualizar el comité")
}

export async function changeCommitteeStatus(id: string, status: CommitteeStatus): Promise<Committee> {
  const res = await apiFetch(`/api/committee-management/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<Committee>(res, "No se pudo actualizar el estado del comité")
}

export async function uploadCommitteeDocument(
  committeeId: string,
  dto: UploadCommitteeDocumentDto,
): Promise<CommitteeDocument> {
  const res = await apiFetch(`/api/committee-management/${committeeId}/documents`, {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<CommitteeDocument>(res, "No se pudo subir el documento del comité")
}

export async function listCommitteeDocuments(committeeId: string): Promise<CommitteeDocument[]> {
  const res = await apiFetch(`/api/committee-management/${committeeId}/documents`, { method: "GET" })
  return parseOrThrow<CommitteeDocument[]>(res, "No se pudo cargar los documentos del comité")
}

export async function deleteCommitteeDocument(committeeId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/committee-management/${committeeId}/documents/${documentId}`, {
    method: "DELETE",
  })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el documento del comité")
}

export async function downloadCommitteeDocumentFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(res, "No se pudo descargar el documento del comité")
}

export async function createMeeting(dto: CreateMeetingDto): Promise<Meeting> {
  const res = await apiFetch("/api/meetings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Meeting>(res, "No se pudo crear la reunión")
}

export async function listMeetings(filters: MeetingFilters = {}): Promise<MeetingList> {
  const res = await apiFetch(`/api/meetings${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<MeetingList>(res, "No se pudo cargar las reuniones")
}

export async function getMeetingById(id: string): Promise<Meeting> {
  const res = await apiFetch(`/api/meetings/${id}`, { method: "GET" })
  return parseOrThrow<Meeting>(res, "No se pudo cargar la reunión")
}

export async function updateMeeting(id: string, dto: UpdateMeetingDto): Promise<Meeting> {
  const res = await apiFetch(`/api/meetings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Meeting>(res, "No se pudo actualizar la reunión")
}

export async function changeMeetingStatus(id: string, status: CommitteeStatus): Promise<Meeting> {
  const res = await apiFetch(`/api/meetings/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<Meeting>(res, "No se pudo actualizar el estado de la reunión")
}

export async function uploadMeetingDocument(
  meetingId: string,
  dto: UploadCommitteeDocumentDto,
): Promise<CommitteeDocument> {
  const res = await apiFetch(`/api/meetings/${meetingId}/documents`, {
    method: "POST",
    body: createDocumentFormData(dto),
  })
  return parseOrThrow<CommitteeDocument>(res, "No se pudo subir el documento de la reunión")
}

export async function listMeetingDocuments(meetingId: string): Promise<CommitteeDocument[]> {
  const res = await apiFetch(`/api/meetings/${meetingId}/documents`, { method: "GET" })
  return parseOrThrow<CommitteeDocument[]>(res, "No se pudo cargar los documentos de la reunión")
}

export async function deleteMeetingDocument(meetingId: string, documentId: string): Promise<void> {
  const res = await apiFetch(`/api/meetings/${meetingId}/documents/${documentId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el documento de la reunión")
}

export async function downloadMeetingDocumentFile(downloadUrl: string): Promise<Blob> {
  const res = await apiFetch(downloadUrl, { method: "GET" })
  return parseFileOrThrow(res, "No se pudo descargar el documento de la reunión")
}
