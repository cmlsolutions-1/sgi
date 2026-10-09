export type HealthyLifestyleActivityType = "CAMPAIGN" | "TALK" | "DAY" | "ACTIVITY"
export type HealthyLifestyleActivityStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED"

export type HealthyLifestyleEmployee = {
  id: string
  name: string
  lastName: string
  email?: string | null
  job?: { id: string; name: string } | null
}

export type HealthyLifestyleDocument = {
  id: string
  companyId?: string
  ownerType?: string
  ownerId?: string
  referenceType?: string
  referenceId?: string
  type: "HEALTHY_LIFESTYLE_EVIDENCE"
  originalName: string
  mimeType: string
  size?: number
  storageProvider?: string
  isConfirmed: boolean
  downloadUrl: string
  description?: string | null
  createdAt?: string
  createdBy?: string | null
}

export type HealthyLifestyleActivity = {
  id: string
  companyId: string
  name: string
  type: HealthyLifestyleActivityType
  startDate: string
  endDate: string
  responsibleEmployeeId: string
  responsibleEmployee?: HealthyLifestyleEmployee | null
  objective: string
  scope: string
  status: HealthyLifestyleActivityStatus
  evidenceId?: string | null
  evidence?: HealthyLifestyleDocument | null
  createdAt: string
  updatedAt: string
  createdBy?: string | null
}

export type HealthyLifestyleSummary = {
  total: number
  planned: number
  inProgress: number
  completed: number
  withEvidence: number
}

export type HealthyLifestyleList = {
  items: HealthyLifestyleActivity[]
  total: number
  page: number
  limit: number
  summary?: HealthyLifestyleSummary
}

export type HealthyLifestyleFilters = {
  page?: number
  limit?: number
  type?: HealthyLifestyleActivityType
  status?: HealthyLifestyleActivityStatus
  responsibleEmployeeId?: string
  startDate?: string
  endDate?: string
  hasEvidence?: boolean
  search?: string
}

export type UpsertHealthyLifestyleDto = {
  name: string
  type: HealthyLifestyleActivityType
  startDate: string
  endDate: string
  responsibleEmployeeId: string
  objective: string
  scope: string
}

export type UploadHealthyLifestyleEvidenceDto = {
  file: File
  description: string
  isConfirmed?: boolean
}
