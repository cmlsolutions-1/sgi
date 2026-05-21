import type { ApiResponse } from "./company"

export type IncidentEmployee = {
  id: string
  name: string
  lastName: string
}

export type Incident = {
  id: string
  employeeId: string
  date: string
  place: string
  description: string
  consequences: string
  correctiveActions: string
  status: string
  employee: IncidentEmployee
}

export type CreateIncidentDto = {
  employeeId: string
  date: string
  place: string
  description: string
  consequences: string
  correctiveActions: string
}

export type UpdateIncidentDto = CreateIncidentDto

export type IncidentResponse = ApiResponse<Incident>
export type IncidentsResponse = ApiResponse<Incident[]>
