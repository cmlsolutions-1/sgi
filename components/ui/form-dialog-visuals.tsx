import type { ReactNode } from "react"
import {
  Archive,
  BriefcaseBusiness,
  Bug,
  Building2,
  CalendarCheck2,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileText,
  GraduationCap,
  PackageCheck,
  Presentation,
  ShieldCheck,
  Siren,
  Sparkles,
  Target,
  TriangleAlert,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { DialogTitle } from "@/components/ui/dialog"

export type FormVisualIcon =
  | "acpm"
  | "area"
  | "job"
  | "employee"
  | "labor"
  | "training"
  | "prevention"
  | "maintenance"
  | "document"
  | "committee"
  | "meeting"
  | "emergency"
  | "brigade"
  | "supply"
  | "sanitation"
  | "pest"
  | "details"
  | "tracking"
  | "accountability"
  | "analytics"
  | "custody"

type Tone = "blue" | "cyan" | "emerald" | "amber" | "violet" | "rose"

const icons = {
  acpm: ClipboardCheck,
  area: Building2,
  job: BriefcaseBusiness,
  employee: UserRound,
  labor: TriangleAlert,
  training: GraduationCap,
  prevention: ShieldCheck,
  maintenance: Wrench,
  document: FileText,
  committee: UsersRound,
  meeting: CalendarCheck2,
  emergency: Siren,
  brigade: ShieldCheck,
  supply: PackageCheck,
  sanitation: Sparkles,
  pest: Bug,
  details: FileText,
  tracking: Target,
  accountability: Presentation,
  analytics: ChartNoAxesCombined,
  custody: Archive,
} satisfies Record<FormVisualIcon, typeof Target>

const tones: Record<Tone, string> = {
  blue: "bg-sky-50 text-sky-700",
  cyan: "bg-cyan-50 text-cyan-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
}

export function FormDialogIcon({ icon, tone = "blue", className }: { icon: FormVisualIcon; tone?: Tone; className?: string }) {
  const Icon = icons[icon]

  return (
    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone], className)}>
      <Icon className="h-5 w-5" />
    </div>
  )
}

export function FormSectionTitle({
  icon,
  title,
  description,
  tone = "cyan",
  className,
}: {
  icon: FormVisualIcon
  title: ReactNode
  description?: ReactNode
  tone?: Tone
  className?: string
}) {
  const Icon = icons[icon]

  return (
    <div className={cn("mb-4 flex items-start gap-3", className)}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  )
}

export function DetailDialogHeading({
  title,
  description,
  badge,
  icon = "details",
  tone = "blue",
}: {
  title: ReactNode
  description?: ReactNode
  badge?: ReactNode
  icon?: FormVisualIcon
  tone?: Tone
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 text-left">
      <FormDialogIcon icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <DialogTitle className="min-w-0 break-words text-lg leading-tight text-slate-950">{title}</DialogTitle>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        {description ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  )
}

export function DetailSection({
  icon = "details",
  title,
  description,
  tone = "cyan",
  children,
  className,
}: {
  icon?: FormVisualIcon
  title: ReactNode
  description?: ReactNode
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("record-detail-section", className)}>
      <FormSectionTitle icon={icon} title={title} description={description} tone={tone} />
      {children}
    </section>
  )
}

export function DetailInfoBlock({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn("record-detail-info", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <div className="mt-1.5 break-words text-sm font-medium leading-relaxed text-slate-900">{value}</div>
    </div>
  )
}
