"use client"

import type { ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type AnalyticsChartItem = {
  name: string
  total: number
}

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#64748b",
  "#0f766e",
  "#dc2626",
]

function truncateLabel(value: string, maxLength = 16) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength).trim()}...`
}

function ChartTooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="min-w-36 rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-xl">
      {label ? <p className="mb-2 border-b border-border pb-1 font-semibold text-foreground">{label}</p> : null}
      {payload.map((item: any) => (
        <div key={`${item.name}-${item.value}`} className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color ?? item.payload?.fill }}
            />
            <span className="truncate text-muted-foreground">{item.name ?? "Total"}</span>
          </div>
          <span className="font-semibold tabular-nums text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function ChartLegendBox({ payload }: any) {
  if (!payload?.length) return null

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-3 text-[11px]">
      {payload.map((item: any) => (
        <div key={item.value} className="flex min-w-0 items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="max-w-28 truncate text-muted-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyChart({ message = "No hay datos suficientes para graficar." }: { message?: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed border-border bg-secondary/30 px-4 text-center text-sm text-muted-foreground">
      <div>
        <p className="font-medium text-foreground">Sin datos</p>
        <p className="mt-1">{message}</p>
      </div>
    </div>
  )
}

export function AnalyticsChartCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border bg-secondary/20 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="h-5 w-1 rounded-full bg-primary" />
          {title}
        </CardTitle>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  )
}

export function AnalyticsBarChart({
  data,
  color = "var(--chart-1)",
  layout = "horizontal",
}: {
  data: AnalyticsChartItem[]
  color?: string
  layout?: "horizontal" | "vertical"
}) {
  if (data.length === 0 || data.every((item) => item.total === 0)) return <EmptyChart />
  const chartHeight = layout === "vertical" ? Math.max(280, data.length * 38 + 80) : 280

  return (
    <div className="w-full min-w-0 rounded-md bg-white" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={layout === "vertical" ? { top: 8, right: 18, left: 8, bottom: 0 } : { top: 8, right: 12, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.65} />
          {layout === "vertical" ? (
            <>
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(value) => truncateLabel(String(value), 20)}
                width={124}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(value) => truncateLabel(String(value), 12)} interval={0} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={36} />
            </>
          )}
          <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipBox />} />
          <Bar dataKey="total" fill={color} radius={layout === "vertical" ? [0, 6, 6, 0] : [6, 6, 0, 0]} barSize={layout === "vertical" ? 18 : 34}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
            ))}
            <LabelList
              dataKey="total"
              position={layout === "vertical" ? "right" : "top"}
              className="fill-foreground text-[11px] font-medium"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AnalyticsDonutChart({ data }: { data: AnalyticsChartItem[] }) {
  const visibleData = data.filter((item) => item.total > 0)
  if (visibleData.length === 0) return <EmptyChart />

  const total = visibleData.reduce((acc, item) => acc + item.total, 0)

  return (
    <div className="relative h-[280px] w-full min-w-0 rounded-md bg-white">
      <div className="pointer-events-none absolute left-1/2 top-[43%] z-10 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-3xl font-bold tabular-nums text-foreground">{total}</p>
        <p className="text-[11px] font-medium uppercase text-muted-foreground">Total</p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={visibleData}
            dataKey="total"
            nameKey="name"
            innerRadius={52}
            outerRadius={86}
            paddingAngle={3}
            stroke="var(--card)"
            strokeWidth={3}
          >
            {visibleData.map((entry, index) => (
              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltipBox />} />
          <Legend content={<ChartLegendBox />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
