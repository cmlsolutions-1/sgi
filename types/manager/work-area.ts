import type { ApiResponse } from "./company"

export type WorkAreaStatus = "ACTIVE" | "INACTIVE"

export type WorkArea = {
  id: string
  name: string
  description: string
  status: WorkAreaStatus
}

export type WorkAreaOption = {
  id: string
  name: string
}

export type CreateWorkAreaDto = {
  name: string
  description: string
}

export type UpdateWorkAreaDto = CreateWorkAreaDto

export type WorkAreaResponse = ApiResponse<WorkArea>
export type WorkAreasResponse = ApiResponse<WorkArea[]>
export type WorkAreaOptionsResponse = ApiResponse<WorkAreaOption[]>
