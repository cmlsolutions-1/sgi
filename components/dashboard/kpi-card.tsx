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
}

export function KpiCard({ title, value, target, targetLabel = "Meta", unit, trend, icon, className }: KpiCardProps) {
  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardContent className="p-4 sm:p-5 lg:p-6">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="min-w-0 truncate text-2xl font-bold text-foreground sm:text-3xl">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {target !== undefined && target !== null && target !== "" && (
              <p className="truncate text-xs text-muted-foreground">
                {targetLabel}: {target}
                {unit}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {icon && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10">
                {icon}
              </div>
            )}
            {trend && (
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
