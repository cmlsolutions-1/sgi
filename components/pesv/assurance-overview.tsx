"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3, CalendarRange, CircleDollarSign, PieChartIcon } from "lucide-react"
import { communicationCoverage, documentedAudit, statisticalSummary } from "@/lib/pesv/assurance"
import { dateToday, text, type PesvModule, type RecordItem } from "@/lib/pesv/planning"
import { pesvSteps, stepApplies } from "@/lib/pesv/standards"

const currency = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value)
const chartColors = { blue: "#2563eb", cyan: "#0891b2", emerald: "#059669", amber: "#d97706", rose: "#e11d48" }
const lossColors = [chartColors.emerald, chartColors.amber, chartColors.rose, "#991b1b"]

function ChartCard({ icon, title, description, children, className = "" }: { icon: ReactNode; title: string; description: string; children: ReactNode; className?: string }) {
  return <article className={`min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</span>
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-950">{title}</h3>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </article>
}

function EmptyChart({ children }: { children: ReactNode }) {
  return <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center text-sm text-muted-foreground">{children}</div>
}

function StatisticsOverview({ items, year, kindId }: { items: RecordItem[]; year: string; kindId: string }) {
  const selected = items.filter(item => !year || item.values.year === year)

  if (kindId === "statistical-event") {
    const events = selected.filter(item => item.kind === "statistical-event")
    const rows = statisticalSummary(events, "0000-01-01", "9999-12-31")
    const months = Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, "0")
      const records = events.filter(item => year ? text(item.values.eventDate).startsWith(`${year}-${month}`) : Number(text(item.values.eventDate).slice(5, 7)) === index + 1)
      return {
        month: new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, index, 1))).replace(".", ""),
        Laborales: records.filter(item => item.values.journey === "Laboral").length,
        "Cotidianos / no laborales": records.filter(item => item.values.journey === "Cotidiano / no laboral").length,
      }
    })
    const context = [
      { name: "Laborales", value: events.filter(item => item.values.journey === "Laboral").length },
      { name: "Cotidianos / no laborales", value: events.filter(item => item.values.journey === "Cotidiano / no laboral").length },
    ].filter(item => item.value > 0)
    const severity = ["Bajo", "Medio", "Grave", "Crítico"].map(name => ({
      name,
      Siniestros: events.filter(item => item.values.lossLevel === name).length,
    }))

    return <section className="space-y-4" aria-label="Análisis visual de los siniestros registrados">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        <ChartCard icon={<BarChart3 className="h-5 w-5" />} title="Evolución mensual" description={`Comparación de siniestros laborales y cotidianos${year ? ` durante ${year}` : " por mes"}.`}>
          {events.length ? <div className="h-72 w-full" role="img" aria-label="Gráfica mensual de siniestros por contexto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={3}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgb(15 23 42 / 0.08)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="Laborales" fill={chartColors.blue} radius={[5, 5, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Cotidianos / no laborales" fill={chartColors.emerald} radius={[5, 5, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div> : <EmptyChart>Aún no hay siniestros registrados para construir la evolución mensual.</EmptyChart>}
        </ChartCard>

        <ChartCard icon={<PieChartIcon className="h-5 w-5" />} title="Contexto del desplazamiento" description="Participación de los registros según el tipo de desplazamiento.">
          {context.length ? <div className="h-72 w-full" role="img" aria-label="Distribución de siniestros por contexto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={context} dataKey="value" nameKey="name" innerRadius={55} outerRadius={86} paddingAngle={4} stroke="#ffffff" strokeWidth={3}>
                  {context.map((entry, index) => <Cell key={entry.name} fill={[chartColors.blue, chartColors.emerald][index]} />)}
                </Pie>
                <Tooltip contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgb(15 23 42 / 0.08)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div> : <EmptyChart>La distribución aparecerá cuando existan registros en la vigencia seleccionada.</EmptyChart>}
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.7fr)]">
        <ChartCard icon={<BarChart3 className="h-5 w-5" />} title="Nivel de pérdida" description="Cantidad de siniestros clasificados en cada nivel.">
          <div className="h-64 w-full" role="img" aria-label="Siniestros por nivel de pérdida">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severity} layout="vertical" margin={{ top: 4, right: 16, left: 2, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={55} axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 12 }} />
                <Bar dataKey="Siniestros" radius={[0, 6, 6, 0]} maxBarSize={22}>{severity.map((entry, index) => <Cell key={entry.name} fill={lossColors[index]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard icon={<CircleDollarSign className="h-5 w-5" />} title="Consolidado por contexto y pérdida" description="Personas afectadas y costos registrados, sin estimaciones adicionales.">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                <tr>{["Desplazamiento", "Nivel de pérdida", "Siniestros", "Fallecidos", "Lesionados", "Costos"].map(label => <th className="whitespace-nowrap px-3 py-3 font-medium" key={label}>{label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">{rows.map(row => <tr key={`${row.journey}-${row.level}`} className="transition-colors hover:bg-slate-50/70"><td className="px-3 py-2.5">{row.journey}</td><td className="px-3 py-2.5">{row.level}</td><td className="px-3 py-2.5 font-semibold">{row.events}</td><td className="px-3 py-2.5">{row.fatalities}</td><td className="px-3 py-2.5">{row.injured}</td><td className="whitespace-nowrap px-3 py-2.5">{currency(row.costs)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-3 text-right"><Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href="/dashboard/pesv-investigations">Consultar investigaciones de siniestros</Link></div>
        </ChartCard>
      </div>
    </section>
  }

  if (kindId === "statistical-analysis") {
    const analyses = selected.filter(item => item.kind === "statistical-analysis")
    const quarters = [1, 2, 3, 4].map(quarter => ({
      name: `T${quarter}`,
      Análisis: analyses.filter(item => {
        const month = Number(text(item.values.analysisDate || item.values.periodEnd).slice(5, 7))
        return Math.ceil(month / 3) === quarter
      }).length,
    }))
    const periods = analyses.slice().sort((a, b) => text(a.values.periodEnd).localeCompare(text(b.values.periodEnd))).slice(-8).map(item => {
      const start = Date.parse(text(item.values.periodStart))
      const end = Date.parse(text(item.values.periodEnd))
      return { name: text(item.values.name).slice(0, 22), Días: Number.isFinite(start) && Number.isFinite(end) ? Math.max(1, Math.round((end - start) / 86400000) + 1) : 0 }
    })

    return <section className="grid gap-4 xl:grid-cols-2" aria-label="Análisis visual de los períodos estadísticos">
      <ChartCard icon={<BarChart3 className="h-5 w-5" />} title="Análisis por trimestre" description={`Cantidad de análisis registrados por corte${year ? ` durante ${year}` : ""}.`}>
        {analyses.length ? <div className="h-72 w-full" role="img" aria-label="Análisis estadísticos por trimestre">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={quarters} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} /><Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 12 }} /><Bar dataKey="Análisis" fill={chartColors.blue} radius={[7, 7, 0, 0]} maxBarSize={48} /></BarChart></ResponsiveContainer>
        </div> : <EmptyChart>Registra un análisis para visualizar su distribución trimestral.</EmptyChart>}
      </ChartCard>
      <ChartCard icon={<CalendarRange className="h-5 w-5" />} title="Cobertura de los períodos" description="Duración en días de los últimos períodos analizados.">
        {periods.length ? <div className="h-72 w-full" role="img" aria-label="Duración de los períodos estadísticos">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={periods} layout="vertical" margin={{ top: 4, right: 16, left: 18, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="4 4" /><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} /><YAxis type="category" dataKey="name" width={110} axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 11 }} /><Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 12 }} /><Bar dataKey="Días" fill={chartColors.cyan} radius={[0, 7, 7, 0]} maxBarSize={24} /></BarChart></ResponsiveContainer>
        </div> : <EmptyChart>La cobertura aparecerá cuando existan períodos de análisis registrados.</EmptyChart>}
      </ChartCard>
    </section>
  }

  if (kindId === "loss-matrix") {
    const matrices = selected.filter(item => item.kind === "loss-matrix").slice().sort((a, b) => `${text(a.values.year)}-${text(a.values.version)}`.localeCompare(`${text(b.values.year)}-${text(b.values.version)}`))
    const trend = matrices.map(item => ({
      name: `${text(item.values.year)} · v${text(item.values.version)}`,
      Bajo: Number(item.values.lowCostMax || 0),
      Medio: Number(item.values.mediumCostMax || 0),
      Grave: Number(item.values.severeCostMax || 0),
    }))
    const latest = trend.at(-1)
    const thresholds = latest ? [
      { name: "Bajo", Valor: latest.Bajo },
      { name: "Medio", Valor: latest.Medio },
      { name: "Grave", Valor: latest.Grave },
    ] : []

    return <section className="grid gap-4 xl:grid-cols-2" aria-label="Análisis visual de las matrices de pérdida">
      <ChartCard icon={<CircleDollarSign className="h-5 w-5" />} title="Límites de costos vigentes" description={latest ? `Valores definidos en ${latest.name}.` : "Umbrales monetarios de la matriz vigente."}>
        {thresholds.length ? <div className="h-72 w-full" role="img" aria-label="Límites monetarios de la matriz de pérdida vigente"><ResponsiveContainer width="100%" height="100%"><BarChart data={thresholds} layout="vertical" margin={{ top: 4, right: 18, left: 2, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="4 4" /><XAxis type="number" axisLine={false} tickLine={false} tickFormatter={value => new Intl.NumberFormat("es-CO", { notation: "compact" }).format(value)} tick={{ fill: "#64748b", fontSize: 11 }} /><YAxis type="category" dataKey="name" width={48} axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 11 }} /><Tooltip formatter={value => currency(Number(value))} cursor={{ fill: "#f8fafc" }} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 12 }} /><Bar dataKey="Valor" radius={[0, 7, 7, 0]} maxBarSize={28}>{thresholds.map((entry, index) => <Cell key={entry.name} fill={lossColors[index]} />)}</Bar></BarChart></ResponsiveContainer></div> : <EmptyChart>Registra una matriz para visualizar sus límites monetarios.</EmptyChart>}
      </ChartCard>
      <ChartCard icon={<CalendarRange className="h-5 w-5" />} title="Evolución de límites" description="Comparación entre las versiones registradas de la matriz.">
        {trend.length ? <div className="h-72 w-full" role="img" aria-label="Evolución de límites de costos entre matrices"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} /><YAxis width={58} axisLine={false} tickLine={false} tickFormatter={value => new Intl.NumberFormat("es-CO", { notation: "compact" }).format(value)} tick={{ fill: "#64748b", fontSize: 11 }} /><Tooltip formatter={value => currency(Number(value))} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 12 }} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} /><Line type="monotone" dataKey="Bajo" stroke={chartColors.emerald} strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="Medio" stroke={chartColors.amber} strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="Grave" stroke={chartColors.rose} strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div> : <EmptyChart>La comparación aparecerá cuando exista al menos una matriz registrada.</EmptyChart>}
      </ChartCard>
    </section>
  }

  return null
}

export function AssuranceOverview({ module, items, year, kindId }: { module: PesvModule; items: RecordItem[]; year: string; kindId: string }) {
  const selected = items.filter(item => !year || item.values.year === year)
  if (module === "statistics") return <StatisticsOverview items={items} year={year} kindId={kindId} />
  if (module === "audits") {
    const audits = selected.filter(item => item.kind === "pesv-audit")
    const latest = audits.filter(documentedAudit).sort((a, b) => text(a.values.auditDate).localeCompare(text(b.values.auditDate))).at(-1)
    return <section className="space-y-3 border-y py-4"><div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm"><span>Auditorías programadas: <strong>{audits.length}</strong></span><span>Con informe y evaluación completa: <strong className="text-green-700">{audits.filter(documentedAudit).length}</strong></span><Link className="text-primary underline" href="/dashboard/pesv-indicators">Indicadores y autogestión</Link></div>{!latest && <p className="border-l-2 border-amber-500 pl-3 text-sm text-amber-700">{year && `${year}-12-31` < dateToday() ? "Vigencia sin auditoría anual documentada." : "Pendiente la auditoría anual con evaluación de los pasos aplicables e informe PDF."}</p>}{latest && <p className="text-sm">Última auditoría documentada: <strong>{text(latest.values.name)}</strong> · {text(latest.values.auditDate)} · {pesvSteps.filter((_, index) => stepApplies(index + 1, text(latest.values.level)) && latest.values[`step_${index + 1}`] === "Cumple").length} / {pesvSteps.filter((_, index) => stepApplies(index + 1, text(latest.values.level))).length} pasos aplicables cumplen.</p>}</section>
  }
  if (module === "communications") return <section className="space-y-3 border-y py-4"><h2 className="font-semibold">Control de comunicaciones trimestrales · {year || "Selecciona una vigencia"}</h2>{year && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{communicationCoverage(items, year, dateToday()).map(quarter => <div className="border-l-2 border-blue-300 pl-3" key={quarter.quarter}><p className="text-sm font-medium">Trimestre {quarter.quarter}</p><p className={`text-sm ${quarter.status === "Documentada" ? "text-green-700" : quarter.status === "Trimestre sin comunicación" ? "text-red-600" : "text-amber-700"}`}>{quarter.status}</p><p className="text-xs text-muted-foreground">{quarter.count} comunicación(es)</p></div>)}</div>}</section>
  return null
}
