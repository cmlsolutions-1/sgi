import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  target?: string | number
  targetLabel?: string
  unit?: string
  trend?: "up" | "down" | "stable"
  icon?: React.ReactNode
  className?: string
  compact?: boolean
  description?: string
  tone?: "slate" | "blue" | "cyan" | "green" | "amber" | "red"
}

export function KpiCard({ title, value, target, targetLabel = "Meta", unit, trend, icon, className, compact = false, description, tone }: KpiCardProps) {
  const displayValue = compact && typeof value === "number" ? String(value): value
  const compactTone = tone ?? (trend === "down" ? "red" : trend === "up" ? "green" : "blue")

  return (
    <Card className={cn("bg-card border-border", compact && "rounded-none border-0 bg-transparent shadow-none", className)}>
      <CardContent className={cn("p-4 sm:p-5 lg:p-6", compact && "px-4 py-1.5 sm:px-5 sm:py-2 lg:px-6 lg:py-0")}>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className={cn("min-w-0 flex-1 space-y-2", compact && "space-y-0.5")}>
            <p className={cn("truncate text-sm text-muted-foreground", compact && "text-xs font-medium text-slate-500 sm:text-sm")}>{title}</p>
            <div className="flex items-baseline gap-1">
              <span className={cn("min-w-0 truncate text-2xl font-bold text-foreground sm:text-3xl", compact && "text-xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-2xl")}>{displayValue}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {(description || (target !== undefined && target !== null && target !== "")) && (
              compact ? (
                <p className="flex min-w-0 items-center gap-2 truncate text-[11px] text-slate-500 sm:text-xs">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      compactTone === "slate" && "bg-slate-400",
                      compactTone === "blue" && "bg-blue-500",
                      compactTone === "cyan" && "bg-cyan-500",
                      compactTone === "green" && "bg-emerald-500",
                      compactTone === "amber" && "bg-amber-500",
                      compactTone === "red" && "bg-red-400",
                    )}
                  />
                  <span className="truncate">{description ?? `${targetLabel}: ${target}${unit ?? ""}`}</span>
                </p>
              ) : (
                <p className="truncate text-xs text-muted-foreground">
                  {description ?? `${targetLabel}: ${target}${unit ?? ""}`}
                </p>
              )
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {icon && (
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10",
                compact && "h-8 w-8 rounded-lg sm:h-8 sm:w-8 [&_svg]:h-4 [&_svg]:w-4",
                compact && compactTone === "slate" && "bg-slate-100 text-slate-600",
                compact && compactTone === "blue" && "bg-blue-50 text-blue-600",
                compact && compactTone === "cyan" && "bg-cyan-50 text-cyan-600",
                compact && compactTone === "green" && "bg-emerald-50 text-emerald-600",
                compact && compactTone === "amber" && "bg-amber-50 text-amber-600",
                compact && compactTone === "red" && "bg-red-50 text-red-500",
              )}>
                {icon}
              </div>
            )}
            {trend && !compact && (
              <div
                className={cn(
                  "flex max-w-[96px] items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                  trend === "up" && "text-accent bg-accent/10",
                  trend === "down" && "text-destructive bg-destructive/10",
                  trend === "stable" && "text-muted-foreground bg-muted",
                )}
              >
                {trend === "up" && <TrendingUp className="h-3 w-3 shrink-0" />}
                {trend === "down" && <TrendingDown className="h-3 w-3 shrink-0" />}
                {trend === "stable" && <Minus className="h-3 w-3 shrink-0" />}
                <span className="truncate">{trend === "up" ? "Subiendo" : trend === "down" ? "Bajando" : "Estable"}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
