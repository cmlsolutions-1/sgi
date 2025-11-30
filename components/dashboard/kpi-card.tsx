import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  target?: string | number
  unit?: string
  trend?: "up" | "down" | "stable"
  icon?: React.ReactNode
  className?: string
}

export function KpiCard({ title, value, target, unit, trend, icon, className }: KpiCardProps) {
  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {target && (
              <p className="text-xs text-muted-foreground">
                Meta: {target}
                {unit}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {icon && (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
            )}
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  trend === "up" && "text-accent bg-accent/10",
                  trend === "down" && "text-destructive bg-destructive/10",
                  trend === "stable" && "text-muted-foreground bg-muted",
                )}
              >
                {trend === "up" && <TrendingUp className="h-3 w-3" />}
                {trend === "down" && <TrendingDown className="h-3 w-3" />}
                {trend === "stable" && <Minus className="h-3 w-3" />}
                <span>{trend === "up" ? "Subiendo" : trend === "down" ? "Bajando" : "Estable"}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
