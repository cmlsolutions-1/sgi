export type IntelligencePriority = "critical" | "high" | "medium" | "low"

export type IntelligenceAction = {
  id: string
  label: string
  href?: string
  emphasis?: boolean
}

export type IntelligenceInsight = {
  id: string
  module: string
  priority: IntelligencePriority
  title: string
  description: string
  reason: string
  count?: number
  actions: IntelligenceAction[]
}
