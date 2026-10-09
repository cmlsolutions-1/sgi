export type SstIndicatorPeriod = "ANNUAL" | "SEMESTER" | "QUARTER" | "BIMONTHLY" | "MONTHLY" | "CUSTOM"

export type SstIndicatorState = "OK" | "WATCH" | "CRITICAL"

export type SstIndicatorKey =
  | "FREQUENCY"
  | "SEVERITY"
  | "MORTALITY"
  | "PREVALENCE"
  | "INCIDENCE"
  | "ABSENTEEISM"

export type SstIndicatorResult = {
  id: string
  reportId: string
  key: SstIndicatorKey
  name: string
  result: string
  numericValue: number
  unit?: string | null
  state: SstIndicatorState
  description: string
  formula?: string | null
  source?: string | null
}

export type SstIndicatorSummary = {
  totalIndicators: number
  okCount: number
  watchCount: number
  criticalCount: number
}

export type SstIndicatorReport = {
  id: string
  companyId: string
  year: number
  period: SstIndicatorPeriod
  periodValue: string
  periodLabel: string
  startDate: string
  endDate: string
  generatedAt: string
  indicators: SstIndicatorResult[]
  summary: SstIndicatorSummary
  createdAt?: string
  createdBy?: string | null
}

export type SstIndicatorReportList = {
  items: SstIndicatorReport[]
  total: number
  page: number
  limit: number
}

export type GenerateSstIndicatorReportDto = {
  year: number
  period: SstIndicatorPeriod
  periodValue: string
  startDate: string | null
  endDate: string | null
}

export type SstIndicatorFilters = {
  page?: number
  limit?: number
  year?: number
  period?: SstIndicatorPeriod
  startDate?: string
  endDate?: string
  state?: SstIndicatorState
  search?: string
}
