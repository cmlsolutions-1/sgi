"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { BarChart3, CalendarDays, CheckCircle2, Download, FileText, Filter, Loader2, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { AnalyticsBarChart, AnalyticsChartCard, AnalyticsDonutChart } from "@/components/dashboard/analytics-charts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  exportSstIndicatorReport,
  generateSstIndicatorReport,
  getSstIndicatorReport,
  listSstIndicatorReports,
} from "@/services/sstIndicatorsService"
import type {
  SstIndicatorPeriod,
  SstIndicatorReport,
  SstIndicatorState,
} from "@/types/manager/sst-indicators"

type PeriodFilter = SstIndicatorPeriod
type IndicatorState = SstIndicatorState

type FilterForm = {
  year: string
  period: PeriodFilter
  periodValue: string
  startDate: string
  endDate: string
  search: string
}

const currentYear = new Date().getFullYear()

const initialFilters: FilterForm = {
  year: String(currentYear),
  period: "ANNUAL",
  periodValue: "YEAR",
  startDate: `${currentYear}-01-01`,
  endDate: `${currentYear}-12-31`,
  search: "",
}

const periodOptions: Record<Exclude<PeriodFilter, "CUSTOM">, Array<{ value: string; label: string }>> = {
  ANNUAL: [{ value: "YEAR", label: "Todo el año" }],
  SEMESTER: [
    { value: "S1", label: "Semestre 1" },
    { value: "S2", label: "Semestre 2" },
  ],
  QUARTER: [
    { value: "Q1", label: "Trimestre 1" },
    { value: "Q2", label: "Trimestre 2" },
    { value: "Q3", label: "Trimestre 3" },
    { value: "Q4", label: "Trimestre 4" },
  ],
  BIMONTHLY: [
    { value: "B1", label: "Bimestre 1" },
    { value: "B2", label: "Bimestre 2" },
    { value: "B3", label: "Bimestre 3" },
    { value: "B4", label: "Bimestre 4" },
    { value: "B5", label: "Bimestre 5" },
    { value: "B6", label: "Bimestre 6" },
  ],
  MONTHLY: [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ],
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function formatDateTime(value?: string | null) {
  if (!value) return "No registrada"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function periodLabel(period: PeriodFilter, periodValue: string) {
  if (period === "CUSTOM") return "Rango personalizado"
  return periodOptions[period].find((option) => option.value === periodValue)?.label ?? "Periodo"
}

function periodDates(year: string, period: PeriodFilter, periodValue: string, startDate: string, endDate: string) {
  if (period === "CUSTOM") return { startDate, endDate }

  if (period === "ANNUAL") return { startDate: `${year}-01-01`, endDate: `${year}-12-31` }
  if (period === "SEMESTER") {
    return periodValue === "S2"
      ? { startDate: `${year}-07-01`, endDate: `${year}-12-31` }
      : { startDate: `${year}-01-01`, endDate: `${year}-06-30` }
  }
  if (period === "QUARTER") {
    const ranges: Record<string, [string, string]> = {
      Q1: ["01-01", "03-31"],
      Q2: ["04-01", "06-30"],
      Q3: ["07-01", "09-30"],
      Q4: ["10-01", "12-31"],
    }
    const [start, end] = ranges[periodValue] ?? ranges.Q1
    return { startDate: `${year}-${start}`, endDate: `${year}-${end}` }
  }
  if (period === "BIMONTHLY") {
    const ranges: Record<string, [string, string]> = {
      B1: ["01-01", "02-28"],
      B2: ["03-01", "04-30"],
      B3: ["05-01", "06-30"],
      B4: ["07-01", "08-31"],
      B5: ["09-01", "10-31"],
      B6: ["11-01", "12-31"],
    }
    const [start, end] = ranges[periodValue] ?? ranges.B1
    return { startDate: `${year}-${start}`, endDate: `${year}-${end}` }
  }

  const lastDay = new Date(Number(year), Number(periodValue), 0).getDate()
  return { startDate: `${year}-${periodValue}-01`, endDate: `${year}-${periodValue}-${String(lastDay).padStart(2, "0")}` }
}

function stateLabel(state: IndicatorState) {
  if (state === "CRITICAL") return "Crítico"
  if (state === "WATCH") return "Seguimiento"
  return "Cumple"
}

function stateClassName(state: IndicatorState) {
  if (state === "CRITICAL") return "bg-destructive text-destructive-foreground border-transparent"
  if (state === "WATCH") return "bg-amber-100 text-amber-800 border-amber-200"
  return "bg-accentActivd text-accentActivd-foreground border-transparent"
}

export default function SstIndicatorsPage() {
  const [filters, setFilters] = useState<FilterForm>(initialFilters)
  const [reports, setReports] = useState<SstIndicatorReport[]>([])
  const [currentReport, setCurrentReport] = useState<SstIndicatorReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [exportingId, setExportingId] = useState<string | null>(null)

  async function loadReports() {
    setLoading(true)
    try {
      const response = await listSstIndicatorReports({ page: 1, limit: 100 })
      setReports(response.items)
      if (response.items.length) {
        const detail = await getSstIndicatorReport(response.items[0].id)
        setCurrentReport(detail)
      } else {
        setCurrentReport(null)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los indicadores SST.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReports()
  }, [])

  const displayedReport = currentReport ?? {
    id: "",
    companyId: "",
    year: Number(filters.year) || currentYear,
    period: filters.period,
    periodValue: filters.periodValue,
    periodLabel: periodLabel(filters.period, filters.periodValue),
    ...periodDates(filters.year, filters.period, filters.periodValue, filters.startDate, filters.endDate),
    generatedAt: "",
    indicators: [],
    summary: { totalIndicators: 0, okCount: 0, watchCount: 0, criticalCount: 0 },
  }

  const filteredIndicators = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    if (!query) return displayedReport.indicators
    return displayedReport.indicators.filter((indicator) => `${indicator.name} ${indicator.description} ${stateLabel(indicator.state)}`.toLowerCase().includes(query))
  }, [displayedReport.indicators, filters.search])

  const chartData = displayedReport.indicators.map((indicator) => ({ name: indicator.name, total: indicator.numericValue }))
  const stateChartData = [
    { name: "Cumple", total: displayedReport.summary?.okCount ?? displayedReport.indicators.filter((indicator) => indicator.state === "OK").length },
    { name: "Seguimiento", total: displayedReport.summary?.watchCount ?? displayedReport.indicators.filter((indicator) => indicator.state === "WATCH").length },
    { name: "Crítico", total: displayedReport.summary?.criticalCount ?? displayedReport.indicators.filter((indicator) => indicator.state === "CRITICAL").length },
  ]

  const complianceCount = stateChartData[0].total
  const watchCount = stateChartData[1].total
  const criticalCount = stateChartData[2].total

  function updateFilter<K extends keyof FilterForm>(key: K, value: FilterForm[K]) {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === "period") {
        next.periodValue = value === "CUSTOM" ? "CUSTOM" : periodOptions[value as Exclude<PeriodFilter, "CUSTOM">][0].value
      }
      return next
    })
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!filters.year.trim()) {
      toast.error("Selecciona el año o vigencia para generar los indicadores.")
      return
    }
    if (filters.period === "CUSTOM" && (!filters.startDate || !filters.endDate)) {
      toast.error("Selecciona el rango de fechas para generar el informe.")
      return
    }
    if (filters.period === "CUSTOM" && filters.startDate > filters.endDate) {
      toast.error("La fecha de inicio no puede ser posterior a la fecha final.")
      return
    }

    setGenerating(true)
    try {
      const report = await generateSstIndicatorReport({
        year: Number(filters.year),
        period: filters.period,
        periodValue: filters.period === "CUSTOM" ? "CUSTOM" : filters.periodValue,
        startDate: filters.period === "CUSTOM" ? filters.startDate : null,
        endDate: filters.period === "CUSTOM" ? filters.endDate : null,
      })
      setCurrentReport(report)
      setReports((current) => [report, ...current.filter((item) => item.id !== report.id)])
      toast.success("Indicadores SST generados correctamente.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron generar los indicadores SST.")
    } finally {
      setGenerating(false)
    }
  }

  async function downloadReportPdf(report: SstIndicatorReport) {
    setExportingId(report.id)
    try {
      const blob = await exportSstIndicatorReport(report.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `indicadores-sst-${report.year}-${report.periodLabel.toLowerCase().replace(/\s+/g, "-")}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo exportar el informe.")
    } finally {
      setExportingId(null)
    }
  }

  return (
    <main className="module-polish flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Indicadores SST</h1>
          <p className="text-sm text-muted-foreground">Consulta y genera indicadores de accidentalidad, severidad, mortalidad, prevalencia, incidencia y ausentismo.</p>
        </div>
        <Button type="button" className="gap-2" disabled={!currentReport || exportingId === currentReport.id} onClick={() => currentReport && void downloadReportPdf(currentReport)}>
          {currentReport && exportingId === currentReport.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Exportar informe
        </Button>
      </div>

      <section className="rounded-md border border-border bg-card p-4">
        <form onSubmit={handleGenerate} className="grid gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">Filtros de indicadores</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[140px_190px_190px_1fr_1fr_auto] xl:items-end">
            <div className="grid gap-2">
              <Label htmlFor="indicator-year">Año / Vigencia</Label>
              <Input id="indicator-year" type="number" min="2000" max="2100" value={filters.year} onChange={(event) => updateFilter("year", event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="indicator-period">Periodo</Label>
              <select id="indicator-period" value={filters.period} onChange={(event) => updateFilter("period", event.target.value as PeriodFilter)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="ANNUAL">Anual</option>
                <option value="SEMESTER">Semestral</option>
                <option value="QUARTER">Trimestral</option>
                <option value="BIMONTHLY">Bimestral</option>
                <option value="MONTHLY">Mensual</option>
                <option value="CUSTOM">Rango de fechas</option>
              </select>
            </div>
            {filters.period === "CUSTOM" ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="indicator-start-date">Fecha inicio</Label>
                  <Input id="indicator-start-date" type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="indicator-end-date">Fecha fin</Label>
                  <Input id="indicator-end-date" type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="indicator-period-value">Detalle</Label>
                <select id="indicator-period-value" value={filters.periodValue} onChange={(event) => updateFilter("periodValue", event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {periodOptions[filters.period].map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="indicator-search">Buscar indicador</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="indicator-search" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} className="pl-9" placeholder="Buscar por nombre o estado" />
              </div>
            </div>
            <Button type="submit" className="gap-2" disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Generar
            </Button>
          </div>
        </form>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2"><span className="text-xl font-bold text-slate-900">{displayedReport.summary?.totalIndicators ?? displayedReport.indicators.length}</span><span className="text-xs font-medium text-slate-600">Indicadores</span></div>
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2"><span className="text-xl font-bold text-emerald-700">{complianceCount}</span><span className="text-xs font-medium text-slate-600">Cumplen</span></div>
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2"><span className="text-xl font-bold text-amber-700">{watchCount}</span><span className="text-xs font-medium text-slate-600">En seguimiento</span></div>
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2"><span className="text-xl font-bold text-rose-700">{criticalCount}</span><span className="text-xs font-medium text-slate-600">Críticos</span></div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <AnalyticsChartCard title="Resultado por indicador" description={`Periodo generado: ${displayedReport.periodLabel} · ${formatDate(displayedReport.startDate)} a ${formatDate(displayedReport.endDate)}`}>
          <AnalyticsBarChart data={chartData} layout="vertical" color="var(--chart-2)" />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Estado de indicadores" description="Distribución del cumplimiento calculado.">
          <AnalyticsDonutChart data={stateChartData} />
        </AnalyticsChartCard>
      </section>

      <section className="rounded-md border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Tabla automática de indicadores</h2>
            <p className="text-sm text-muted-foreground">Generado: {formatDateTime(displayedReport.generatedAt)}</p>
          </div>
          <Badge variant="outline" className="w-fit bg-blue-600 text-white border-transparent">{displayedReport.year} · {displayedReport.periodLabel}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Indicador</th>
                <th className="px-4 py-3 font-medium">Resultado</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredIndicators.map((indicator) => (
                <tr key={indicator.id} className="align-middle">
                  <td className="px-4 py-3 font-medium text-foreground">{indicator.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{indicator.result}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={stateClassName(indicator.state)}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      {stateLabel(indicator.state)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{indicator.description}</td>
                </tr>
              ))}
              {filteredIndicators.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">No hay indicadores que coincidan con la búsqueda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Historial de informes generados</h2>
        </div>
        <div className="mt-4 grid gap-2">
          {loading && <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando informes...</div>}
          {!loading && reports.slice(0, 5).map((report) => (
            <div key={report.id} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{report.year} · {report.periodLabel}</p>
                <p className="text-sm text-muted-foreground">{formatDate(report.startDate)} a {formatDate(report.endDate)} · {formatDateTime(report.generatedAt)}</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-2" disabled={exportingId === report.id} onClick={() => void downloadReportPdf(report)}>
                {exportingId === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}PDF
              </Button>
            </div>
          ))}
          {!loading && reports.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay informes de indicadores SST generados.</p>}
        </div>
      </section>
    </main>
  )
}
