import type { ApiResponse } from "./company"

export type RiskStatus = "ACTIVE" | "INACTIVE"

export type RiskCatalogItem = {
  id: string
  code: string
  name: string
}

export type RiskHazardDescription = RiskCatalogItem & {
  hazardTypeId: string
}

export type RiskValueCatalogItem = RiskCatalogItem & {
  value: number
}

export type Risk = {
  id: string
  companyId: string
  process: string
  workZone: string
  activity: string
  task: string
  possibleEffects: string
  sourceControls: string
  mediumControls: string
  personControls: string
  probabilityLevel: number
  probabilityInterpretation: string
  riskLevel: number
  riskLevelName: string
  riskInterpretation: string
  acceptability: string
  exposedPeopleNumber: string
  worstConsequence: string
  routine: boolean
  legalRequirement: boolean
  status: RiskStatus
  hazardTypeId: string
  hazardDescriptionId: string
  deficiencyLevelId: string
  exposureLevelId: string
  consequenceLevelId: string
  hazardType?: RiskCatalogItem
  hazardDescription?: RiskHazardDescription
  deficiencyLevel?: RiskValueCatalogItem
  exposureLevel?: RiskValueCatalogItem
  consequenceLevel?: RiskValueCatalogItem
}

export type RiskList = {
  items: Risk[]
  total: number
  page: number
  limit: number
}

export type CreateRiskDto = {
  process: string
  workZone: string
  activity: string
  task: string
  possibleEffects: string
  sourceControls: string
  mediumControls: string
  personControls: string
  probabilityLevel: number
  probabilityInterpretation: string
  riskLevel: number
  riskLevelName: string
  riskInterpretation: string
  acceptability: string
  exposedPeopleNumber: string
  worstConsequence: string
  routine: boolean
  legalRequirement: boolean
  hazardTypeId: string
  hazardDescriptionId: string
  deficiencyLevelId: string
  exposureLevelId: string
  consequenceLevelId: string
}

export type UpdateRiskDto = CreateRiskDto

export type RiskResponse = ApiResponse<Risk>
export type RisksResponse = ApiResponse<RiskList>
export type RiskCatalogResponse = ApiResponse<RiskCatalogItem[]>
export type RiskHazardDescriptionsResponse = ApiResponse<RiskHazardDescription[]>
export type RiskValueCatalogResponse = ApiResponse<RiskValueCatalogItem[]>
