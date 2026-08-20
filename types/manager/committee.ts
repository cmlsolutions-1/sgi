import type { ApiResponse } from "./company"

export type CommitteeType = "COPAST" | "WORKPLACE_COEXISTENCE"
export type CommitteeStatus = "ACTIVE" | "INACTIVE"

export type CommitteeEmployee = {
  id: string
  name: string
  lastName: string
  email: string
}

export type Committee = {
  id: string
  companyId: string
  type: CommitteeType
  startDate: string
  endDate: string
  presidentEmployeeId: string
  president?: CommitteeEmployee | null
  secretaryEmployeeId: string
  secretary?: CommitteeEmployee | null
  principalMemberIds: string[]
  principalMembers?: CommitteeEmployee[] | null
  alternateMemberIds: string[]
  alternateMembers?: CommitteeEmployee[] | null
  status: CommitteeStatus
}

export type CommitteeList = {
  items: Committee[]
  total: number
  page: number
  limit: number
}

export type CreateCommitteeDto = {
  type: CommitteeType
  startDate: string
  endDate: string
  presidentEmployeeId: string
  secretaryEmployeeId: string
  principalMemberIds: string[]
  alternateMemberIds: string[]
}

export type UpdateCommitteeDto = Partial<CreateCommitteeDto>

export type CommitteeFilters = {
  page?: string | number
  limit?: string | number
  type?: CommitteeType | "all"
  status?: CommitteeStatus | "all"
}

export type Meeting = {
  id: string
  companyId: string
  committeeId: string
  committee?: Pick<Committee, "id" | "type"> | null
  minutesNumber: string
  topic: string
  description: string
  observations?: string | null
  meetingDate: string
  startTime: string
  endTime: string
  location: string
  attendeeIds: string[]
  attendees?: CommitteeEmployee[] | null
  status: CommitteeStatus
}

export type MeetingList = {
  items: Meeting[]
  total: number
  page: number
  limit: number
}

export type CreateMeetingDto = {
  committeeId: string
  minutesNumber: string
  topic: string
  description: string
  observations?: string | null
  meetingDate: string
  startTime: string
  endTime: string
  location: string
  attendeeIds: string[]
}

export type UpdateMeetingDto = Partial<CreateMeetingDto>

export type MeetingFilters = {
  page?: string | number
  limit?: string | number
  committeeId?: string
  status?: CommitteeStatus | "all"
  startDate?: string
  endDate?: string
  search?: string
}

export type CommitteeDocument = {
  id: string
  companyId: string
  ownerType: string
  ownerId: string
  referenceType: "COMMITTEE" | "MEETING" | string
  referenceId: string
  type: "COMMITTEE" | "MEETING" | "OTHER" | string
  originalName: string
  mimeType: string
  size: number
  storageProvider: string
  isConfirmed: boolean
  downloadUrl: string
  createdAt: string
  createdBy?: string | null
}

export type UploadCommitteeDocumentDto = {
  file: File
  type?: "COMMITTEE" | "MEETING" | "OTHER" | "DOCUMENT_MANAGEMENT" | string
  isConfirmed?: boolean
}

export type CommitteeResponse = ApiResponse<Committee>
export type CommitteeListResponse = ApiResponse<CommitteeList>
export type MeetingResponse = ApiResponse<Meeting>
export type MeetingListResponse = ApiResponse<MeetingList>
export type CommitteeDocumentResponse = ApiResponse<CommitteeDocument>
export type CommitteeDocumentsResponse = ApiResponse<CommitteeDocument[]>
