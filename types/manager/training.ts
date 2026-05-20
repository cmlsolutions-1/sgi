import type { ApiResponse } from "./company"

export type TopicTrainingStatus = "ACTIVE" | "INACTIVE" | string

export type TopicTraining = {
  id: string
  name: string
  description: string
  status: TopicTrainingStatus
}

export type TopicTrainingOption = {
  id: string
  name: string
}

export type CreateTopicTrainingDto = {
  name: string
  description: string
}

export type UpdateTopicTrainingDto = Partial<CreateTopicTrainingDto>

export type TrainingStatus = "ACTIVE" | "INACTIVE" | "FINISHED" | "CANCELLED" | string

export type Training = {
  id: string
  date: string
  durationHours: number
  status: TrainingStatus
  topicId: string
  topic: TopicTrainingOption
}

export type CreateTrainingDto = {
  topicId: string
  date: string
  durationHours: number
}

export type UpdateTrainingDto = Partial<CreateTrainingDto> & {
  status?: TrainingStatus
}

export type TrainingList = {
  items: Training[]
  total: number
  page: number
  limit: number
}

export type TrainingAttendanceStatus = "ASSIGNED" | "ATTENDED" | "ABSENT"

export type TrainingAttendanceEmployee = {
  id: string
  name: string
  lastName: string
  email: string
}

export type TrainingAttendance = {
  id: string
  trainingId: string
  employeeId: string
  status: TrainingAttendanceStatus
  employee: TrainingAttendanceEmployee
}

export type CreateTrainingAttendanceDto = {
  employeeId: string
  status: TrainingAttendanceStatus
}

export type UpdateTrainingAttendanceDto = CreateTrainingAttendanceDto

export type EmployeeTraining = {
  attendanceId: string
  status: TrainingAttendanceStatus
  training: Training
}

export type TopicTrainingResponse = ApiResponse<TopicTraining>
export type TopicTrainingsResponse = ApiResponse<TopicTraining[]>
export type TopicTrainingOptionsResponse = ApiResponse<TopicTrainingOption[]>
export type TrainingResponse = ApiResponse<Training>
export type TrainingsResponse = ApiResponse<TrainingList>
export type TrainingAttendanceResponse = ApiResponse<TrainingAttendance>
export type TrainingAttendancesResponse = ApiResponse<TrainingAttendance[]>
export type EmployeeTrainingsResponse = ApiResponse<EmployeeTraining[]>
