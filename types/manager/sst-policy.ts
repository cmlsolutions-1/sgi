export type SstPolicyStatus = "ACTIVE" | "INACTIVE"

export type SstPolicy = {
  id: string
  companyId: string
  name: string
  description: string
  status: SstPolicyStatus
  createdAt: string
  updatedAt: string
}

export type SstPolicyList = {
  items: SstPolicy[]
  total: number
  page: number
  limit: number
}

export type SstPolicyFilters = {
  page?: number
  limit?: number
  status?: SstPolicyStatus
  search?: string
}

export type UpsertSstPolicyDto = {
  name: string
  description: string
}
