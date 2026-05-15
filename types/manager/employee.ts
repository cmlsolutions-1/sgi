import type { ApiResponse } from "./company"
import type { Job, JobOption } from "./job"
import type { WorkAreaOption } from "./work-area"

export type SocialSecurityEntity = {
  id?: string
  name?: string
  [key: string]: unknown
}

export type EmployeeCatalogOption = {
  id: string
  name: string
}

export type Employee = {
  id: string
  name: string
  lastName: string
  phone: string
  email: string
  address: string
  birthDate: string
  companyId: string
  workAreaId: string
  workArea?: WorkAreaOption
  jobId: string
  job?: Job | JobOption
  epsId?: string | null
  eps?: SocialSecurityEntity | null
  arlId?: string | null
  arl?: SocialSecurityEntity | null
  pensionId?: string | null
  pension?: SocialSecurityEntity | null
  compensationId?: string | null
  compensation?: SocialSecurityEntity | null
  startDateEps?: string | null
  endDateEps?: string | null
  statusEps?: boolean | null
  startDateArl?: string | null
  endDateArl?: string | null
  statusArl?: boolean | null
  startDatePension?: string | null
  endDatePension?: string | null
  statusPension?: boolean | null
  startDateCompensation?: string | null
  endDateCompensation?: string | null
  statusCompensation?: boolean | null
  status: boolean
}

export type EmployeeEducation = {
  id: string
  employeeId: string
  level: string
  institution: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate: string
  isCompleted: boolean
  createdAt: string
}

export type CreateEmployeeEducationDto = {
  level: string
  institution: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate: string
  isCompleted: boolean
}

export type UpdateEmployeeEducationDto = Partial<CreateEmployeeEducationDto>

export type CreateEmployeeDto = {
  name: string
  lastName: string
  phone: string
  email: string
  address: string
  birthDate: string
  workAreaId: string
  jobId: string
  epsId?: string
  startDateEps?: string
  endDateEps?: string
  statusEps?: boolean
  arlId?: string
  startDateArl?: string
  endDateArl?: string
  statusArl?: boolean
  pensionId?: string
  startDatePension?: string
  endDatePension?: string
  statusPension?: boolean
  compensationId?: string
  startDateCompensation?: string
  endDateCompensation?: string
  statusCompensation?: boolean
  status: boolean
}

export type UpdateEmployeeDto = {
  name: string
  lastName: string
  phone: string
  email: string
  address: string
  birthDate: string
  workAreaId: string
  jobId: string
  status: boolean
}

export type UpdateEmployeeSocialSecurityDto = Partial<
  Pick<
    CreateEmployeeDto,
    | "epsId"
    | "startDateEps"
    | "endDateEps"
    | "statusEps"
    | "arlId"
    | "startDateArl"
    | "endDateArl"
    | "statusArl"
    | "pensionId"
    | "startDatePension"
    | "endDatePension"
    | "statusPension"
    | "compensationId"
    | "startDateCompensation"
    | "endDateCompensation"
    | "statusCompensation"
  >
>

export type EmployeeResponse = ApiResponse<Employee>
export type EmployeesResponse = ApiResponse<Employee[]>
export type EmployeeCatalogResponse = ApiResponse<EmployeeCatalogOption[]>
export type EmployeeEducationResponse = ApiResponse<EmployeeEducation>
export type EmployeeEducationsResponse = ApiResponse<EmployeeEducation[]>
