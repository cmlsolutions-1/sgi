import type { ComponentType } from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileClock,
  FileText,
  FlaskConical,
  Gauge,
  HeartPulse,
  Leaf,
  ListChecks,
  Medal,
  MessageSquareText,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  UserRoundX,
  Users,
  WalletCards,
  Waves,
} from "lucide-react"
import type { LucideProps } from "lucide-react"

import { KpiCard } from "@/components/dashboard/kpi-card"
import { cn } from "@/lib/utils"

export type KpiStripIcon =
  | "total" | "active" | "inactive" | "pending" | "overdue" | "completed"
  | "evidence" | "document" | "users" | "analysis" | "risk" | "calendar"
  | "budget" | "internal" | "external" | "progress" | "automatic" | "program"
  | "chemical" | "measurement" | "legal" | "meeting" | "emergency" | "hygiene"
  | "waste" | "sanitation" | "pest" | "score" | "findings" | "objective"
  | "training" | "job" | "area"

export type KpiStripItem = {
  title: string
  value: string | number
  description: string
  icon?: KpiStripIcon
  tone?: "slate" | "blue" | "cyan" | "green" | "amber" | "red"
}

const icons: Record<KpiStripIcon, ComponentType<LucideProps>> = {
  total: ListChecks,
  active: CheckCircle2,
  inactive: UserRoundX,
  pending: FileClock,
  overdue: Clock3,
  completed: ClipboardCheck,
  evidence: FileCheck2,
  document: FileText,
  users: Users,
  analysis: BarChart3,
  risk: ShieldAlert,
  calendar: CalendarClock,
  budget: WalletCards,
  internal: Building2,
  external: MessageSquareText,
  progress: Gauge,
  automatic: Sparkles,
  program: BookOpenCheck,
  chemical: FlaskConical,
  measurement: Waves,
  legal: Scale,
  meeting: Users,
  emergency: TriangleAlert,
  hygiene: HeartPulse,
  waste: Trash2,
  sanitation: Leaf,
  pest: ShieldCheck,
  score: Medal,
  findings: AlertTriangle,
  objective: Target,
  training: BookOpenCheck,
  job: BriefcaseBusiness,
  area: Building2,
}

const columns: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
  6: "grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
  7: "grid-cols-2 md:grid-cols-4 xl:grid-cols-7",
  8: "grid-cols-2 md:grid-cols-4 xl:grid-cols-8",
}

export function KpiStrip({ items, className }: { items: KpiStripItem[]; className?: string }) {
  return (
    <section className={cn(
      "grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm",
      columns[Math.min(items.length, 8)] ?? "grid-cols-2 md:grid-cols-4 xl:grid-cols-8",
      className,
    )}>
      {items.map((item) => {
        const Icon = icons[item.icon ?? "total"] ?? Activity
        return (
          <KpiCard
            key={item.title}
            compact
            title={item.title}
            value={item.value}
            description={item.description}
            tone={item.tone}
            icon={<Icon />}
            className="bg-white"
          />
        )
      })}
    </section>
  )
}
