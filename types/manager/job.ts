import type { ApiResponse } from "./company"
import type { WorkAreaOption } from "./work-area"

export type JobStatus = "ACTIVE" | "INACTIVE"

export type Job = {
  id: string
  name: string
  description: string
  status: JobStatus
  workAreaId: string
  workArea: WorkAreaOption
}

export type JobOption = {
  id: string
  name: string
}

export type JobsPage = {
  items: Job[]
  total: number
  page: number
  limit: number
}

export type CreateJobDto = {
  name: string
  description: string
  workAreaId: string
}

export type UpdateJobDto = CreateJobDto & {
  status: JobStatus
}

export type JobResponse = ApiResponse<Job>
export type JobsResponse = ApiResponse<JobsPage>
export type JobOptionsResponse = ApiResponse<JobOption[]>
