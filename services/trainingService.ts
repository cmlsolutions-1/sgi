import { apiFetch } from "@/lib/apiClient"
import type {
  CreateTopicTrainingDto,
  CreateTrainingAttendanceDto,
  CreateTrainingDto,
  EmployeeTraining,
  EmployeeTrainingsResponse,
  TopicTraining,
  TopicTrainingOption,
  TopicTrainingOptionsResponse,
  TopicTrainingResponse,
  TopicTrainingsResponse,
  Training,
  TrainingAttendance,
  TrainingAttendanceResponse,
  TrainingAttendancesResponse,
  TrainingList,
  TrainingResponse,
  TrainingsResponse,
  TrainingAttendanceStatus,
  UpdateTopicTrainingDto,
  UpdateTrainingAttendanceDto,
  UpdateTrainingDto,
} from "@/types/manager/training"

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | TopicTrainingResponse
    | TopicTrainingsResponse
    | TopicTrainingOptionsResponse
    | TrainingResponse
    | TrainingsResponse
    | TrainingAttendanceResponse
    | TrainingAttendancesResponse
    | EmployeeTrainingsResponse
    | null

  if (!res.ok || !json?.ok) {
    throw new Error(json?.message ?? fallbackMsg)
  }

  return json.data as T
}

export async function createTopicTraining(dto: CreateTopicTrainingDto): Promise<TopicTraining> {
  const res = await apiFetch("/api/topic-training", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<TopicTraining>(res, "No se pudo crear el tema de capacitacion")
}

export async function listTopicTraining(): Promise<TopicTraining[]> {
  const res = await apiFetch("/api/topic-training", { method: "GET" })
  return parseOrThrow<TopicTraining[]>(res, "No se pudo cargar los temas de capacitacion")
}

export async function listTopicTrainingOptions(): Promise<TopicTrainingOption[]> {
  const res = await apiFetch("/api/topic-training/options", { method: "GET" })
  return parseOrThrow<TopicTrainingOption[]>(res, "No se pudo cargar las opciones de temas")
}

export async function updateTopicTraining(id: string, dto: UpdateTopicTrainingDto): Promise<TopicTraining> {
  const res = await apiFetch(`/api/topic-training/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<TopicTraining>(res, "No se pudo actualizar el tema de capacitacion")
}

export async function deleteTopicTraining(id: string): Promise<void> {
  const res = await apiFetch(`/api/topic-training/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el tema de capacitacion")
}

export async function activateTopicTraining(id: string): Promise<TopicTraining> {
  const res = await apiFetch(`/api/topic-training/active/${id}`, { method: "PUT" })
  return parseOrThrow<TopicTraining>(res, "No se pudo activar el tema de capacitacion")
}

export async function createTraining(dto: CreateTrainingDto): Promise<Training> {
  const res = await apiFetch("/api/training", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Training>(res, "No se pudo crear la capacitacion")
}

export async function listTraining(): Promise<TrainingList> {
  const res = await apiFetch("/api/training", { method: "GET" })
  return parseOrThrow<TrainingList>(res, "No se pudo cargar las capacitaciones")
}

export async function getTrainingById(id: string): Promise<Training> {
  const res = await apiFetch(`/api/training/${id}`, { method: "GET" })
  return parseOrThrow<Training>(res, "No se pudo cargar la capacitacion")
}

export async function updateTraining(id: string, dto: UpdateTrainingDto): Promise<Training> {
  const res = await apiFetch(`/api/training/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Training>(res, "No se pudo actualizar la capacitacion")
}

export async function deleteTraining(id: string): Promise<void> {
  const res = await apiFetch(`/api/training/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la capacitacion")
}

export async function activateTraining(id: string): Promise<Training> {
  const res = await apiFetch(`/api/training/active/${id}`, { method: "PUT" })
  return parseOrThrow<Training>(res, "No se pudo activar la capacitacion")
}

export async function createTrainingAttendance(
  trainingId: string,
  dto: CreateTrainingAttendanceDto,
): Promise<TrainingAttendance> {
  const res = await apiFetch(`/api/training/${trainingId}/attendees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<TrainingAttendance>(res, "No se pudo asignar el asistente")
}

export async function listTrainingAttendances(trainingId: string): Promise<TrainingAttendance[]> {
  const res = await apiFetch(`/api/training/${trainingId}/attendees`, { method: "GET" })
  return parseOrThrow<TrainingAttendance[]>(res, "No se pudo cargar los asistentes")
}

export async function updateTrainingAttendance(
  trainingId: string,
  attendanceId: string,
  dto: UpdateTrainingAttendanceDto,
): Promise<TrainingAttendance> {
  const res = await apiFetch(`/api/training/${trainingId}/attendees/${attendanceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<TrainingAttendance>(res, "No se pudo actualizar el asistente")
}

export async function deleteTrainingAttendance(trainingId: string, attendanceId: string): Promise<void> {
  const res = await apiFetch(`/api/training/${trainingId}/attendees/${attendanceId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el asistente")
}

export async function listEmployeeTrainings(
  employeeId: string,
  status?: TrainingAttendanceStatus,
): Promise<EmployeeTraining[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ""
  const res = await apiFetch(`/api/employees/${employeeId}/trainings${query}`, { method: "GET" })
  return parseOrThrow<EmployeeTraining[]>(res, "No se pudo cargar las capacitaciones del funcionario")
}
