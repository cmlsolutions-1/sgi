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

export type EmployeeCertification = {
  id: string
  employeeId: string
  name: string
  issuer: string
  issuedAt: string
  expiresAt: string
  createdAt: string
}

export type CreateEmployeeCertificationDto = {
  name: string
  issuer: string
  issuedAt: string
  expiresAt: string
}

export type UpdateEmployeeCertificationDto = Partial<CreateEmployeeCertificationDto>

export type EmployeeContract = {
  id: string
  employeeId: string
  type: string
  status: string
  startDate: string
  endDate: string
  signedAt: string
  salary: number
  createdAt: string
}

export type CreateEmployeeContractDto = {
  type: string
  status: string
  startDate: string
  endDate?: string
  signedAt: string
  salary: number
}

export type UpdateEmployeeContractDto = Partial<CreateEmployeeContractDto>

export type EmployeeEvaluationPerson = {
  id: string
  name: string
  lastName: string
}

export type EmployeeEvaluation = {
  id: string
  companyId: string
  employeeId: string
  evaluatorId: string
  startDate: string
  endDate: string
  score: string
  comment: string
  type: string
  employee: EmployeeEvaluationPerson
  evaluator: EmployeeEvaluationPerson
  createdAt: string
}

export type CreateEmployeeEvaluationDto = {
  evaluatorId: string
  startDate: string
  endDate: string
  score: string
  comment: string
  type: string
}

export type UpdateEmployeeEvaluationDto = Partial<CreateEmployeeEvaluationDto>

export type EmployeeMedicalEvaluation = {
  id: string
  companyId: string
  employeeId: string
  type: string
  date: string
  result: string
  observations: string
  nextEvaluationDate: string
  medicalProfessional: string
  institution: string
  employee: EmployeeEvaluationPerson
  createdAt: string
}

export type CreateEmployeeMedicalEvaluationDto = {
  type: string
  date: string
  result: string
  observations: string
  nextEvaluationDate?: string
  medicalProfessional: string
  institution: string
}

export type UpdateEmployeeMedicalEvaluationDto = Partial<CreateEmployeeMedicalEvaluationDto>

export type EmployeeSgiResponsibleEmployee = {
  id: string
  name: string
  lastName: string
  email: string
  phone: string
}

export type EmployeeSgiResponsible = {
  id: string
  companyId: string
  employeeId: string
  signatureDate: string
  employee: EmployeeSgiResponsibleEmployee
}

export type UpsertEmployeeSgiResponsibleDto = {
  employeeId: string
  signatureDate: string
}

export type EmployeeDocument = {
  id: string
  companyId: string
  ownerType: string
  ownerId: string
  referenceType: string
  referenceId: string
  type: string
  originalName: string
  mimeType: string
  size: number
  storageProvider: string
  isConfirmed: boolean
  downloadUrl: string
  createdAt: string
  createdBy: string
}

export type UploadEmployeeDocumentDto = {
  file: File
  type: string
  isConfirmed: boolean
}

export type EmployeeDocumentContext =
  | { kind: "employee" }
  | { kind: "education"; educationId: string }
  | { kind: "certification"; certificationId: string }
  | { kind: "contract"; contractId: string }
  | { kind: "evaluation"; evaluationId: string }
  | { kind: "medicalEvaluation"; medicalEvaluationId: string }

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
export type EmployeeCertificationResponse = ApiResponse<EmployeeCertification>
export type EmployeeCertificationsResponse = ApiResponse<EmployeeCertification[]>
export type EmployeeContractResponse = ApiResponse<EmployeeContract>
export type EmployeeContractsResponse = ApiResponse<EmployeeContract[]>
export type EmployeeEvaluationResponse = ApiResponse<EmployeeEvaluation>
export type EmployeeEvaluationsResponse = ApiResponse<EmployeeEvaluation[]>
export type EmployeeMedicalEvaluationResponse = ApiResponse<EmployeeMedicalEvaluation>
export type EmployeeMedicalEvaluationsResponse = ApiResponse<EmployeeMedicalEvaluation[]>
export type EmployeeSgiResponsibleResponse = ApiResponse<EmployeeSgiResponsible>
export type EmployeeDocumentResponse = ApiResponse<EmployeeDocument>
export type EmployeeDocumentsResponse = ApiResponse<EmployeeDocument[]>
