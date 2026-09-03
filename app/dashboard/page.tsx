"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Filter,
  HardHat,
  Loader2,
  ShieldAlert,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KpiCard } from "@/components/dashboard/kpi-card"
import {
  buildReportPdf,
  defaultDateRangeFilter,
  formatDisplayDate,
  getRangeDates,
  isWithinRange,
  validateDateRange,
  type DateRangeFilter,
  type DateRangeMode,
} from "@/lib/reporting"
import { toast } from "sonner"
import { listManagedDocuments } from "@/services/documentManagementService"
import { listEmployees, getSgiResponsible } from "@/services/employeeService"
import { listIncidents } from "@/services/incidentService"
import { listPreventiveMeasures } from "@/services/preventiveMeasureService"
import { listRisks } from "@/services/riskService"
import { listTraining } from "@/services/trainingService"
import { useAuthStore } from "@/store/auth.store"
import type { ManagedDocument } from "@/types/manager/document-management"
import type { Employee, EmployeeSgiResponsible } from "@/types/manager/employee"
import type { Incident } from "@/types/manager/incident"
import type { PreventiveMeasure } from "@/types/manager/preventiveMeasure"
import type { Risk } from "@/types/manager/risk"
import type { Training } from "@/types/manager/training"

type DashboardData = {
  employees: Employee[]
  risks: Risk[]
  preventiveMeasures: PreventiveMeasure[]
  trainings: Training[]
  documents: ManagedDocument[]
  incidents: Incident[]
  sgiResponsible: EmployeeSgiResponsible | null
}

type LoadResult<T> = {
  data: T
  error: string | null
}

const initialData: DashboardData = {
  employees: [],
  risks: [],
  preventiveMeasures: [],
  trainings: [],
  documents: [],
  incidents: [],
  sgiResponsible: null,
}

const riskStatusLabels: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  EN_PROCESO: "En proceso",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
}

const trainingStatusLabels: Record<string, string> = {
  ACTIVE: "Activa",
  INACTIVE: "Inactiva",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
}

const incidentTypeLabels: Record<string, string> = {
  INCIDENTE: "Incidente",
  ACCIDENTE: "Accidente",
  ENFERMEDAD_LABORAL: "Enfermedad laboral",
  INCAPACIDAD_MEDICA: "Incapacidad medica",
  LICENCIA_MATERNIDAD: "Licencia maternidad",
  LICENCIA_PATERNIDAD: "Licencia paternidad",
  VACACIONES: "Vacaciones",
  DIAS_NO_REMUNERADO: "Dias no remunerado",
  DIA_REMUNERADO: "Dia remunerado",
  REVISION_POR_LA_DIRECCION: "Revision por direccion",
  REQUERIMIENTO_DE_AUTORIDAD_ADMINISTRATIVA: "Req. autoridad",
  RECOMENDACION_DE_LA_ARL: "Recomendacion ARL",
}

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#64748b",
]

function flattenModuleCodes(modules: ReturnType<typeof useAuthStore.getState>["modules"]) {
  const codes = new Set<string>()

  const walk = (items: typeof modules) => {
    items.forEach((item) => {
      codes.add(item.code)
      if (item.children?.length) walk(item.children)
    })
  }

  walk(modules)
  return codes
}

function formatDate(value?: string | null) {
  return formatDisplayDate(value)
}

function isBeforeToday(value?: string | null) {
  if (!value) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

function isTodayOrFuture(value?: string | null) {
  if (!value) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date.getTime() >= today.getTime()
}

function percent(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

function countByLabel<T>(items: T[], getKey: (item: T) => string | null | undefined, labels: Record<string, string>) {
  const totals = new Map<string, number>()

  items.forEach((item) => {
    const key = getKey(item) ?? "SIN_DATO"
    const label = labels[key] ?? key.replaceAll("_", " ").toLowerCase()
    totals.set(label, (totals.get(label) ?? 0) + 1)
  })

  return Array.from(totals.entries()).map(([name, total]) => ({ name, total }))
}

function truncateLabel(value: string, maxLength = 16) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength).trim()}...`
}

function ChartTooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((item: any) => (
        <div key={`${item.name}-${item.value}`} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color ?? item.payload?.fill }}
          />
          <span className="text-muted-foreground">{item.name ?? "Total"}:</span>
          <span className="font-semibold text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

async function safeLoad<T>(enabled: boolean, loader: () => Promise<T>, fallback: T): Promise<LoadResult<T>> {
  if (!enabled) return { data: fallback, error: null }

  try {
    return { data: await loader(), error: null }
  } catch (error) {
    return {
      data: fallback,
      error: error instanceof Error ? error.message : "No se pudo cargar un modulo del dashboard",
    }
  }
}

async function safeOptionalLoad<T>(enabled: boolean, loader: () => Promise<T>): Promise<LoadResult<T | null>> {
  if (!enabled) return { data: null, error: null }

  try {
    return { data: await loader(), error: null }
  } catch {
    return { data: null, error: null }
  }
}

function DashboardSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function EmptyChart({ message = "No hay datos suficientes para graficar." }: { message?: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed border-border text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function DashboardBarChart({
  data,
  dataKey = "total",
  color = "var(--chart-1)",
  layout = "horizontal",
}: {
  data: Array<{ name: string; total: number }>
  dataKey?: string
  color?: string
  layout?: "horizontal" | "vertical"
}) {
  if (data.length === 0 || data.every((item) => item.total === 0)) return <EmptyChart />

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={layout === "vertical" ? { top: 8, right: 18, left: 8, bottom: 0 } : { top: 8, right: 12, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          {layout === "vertical" ? (
            <>
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => truncateLabel(String(value), 20)}
                width={124}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(value) => truncateLabel(String(value), 12)} interval={0} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={36} />
            </>
          )}
          <RechartsTooltip
            cursor={{ fill: "var(--muted)" }}
            content={<ChartTooltipBox />}
          />
          <Bar dataKey={dataKey} fill={color} radius={layout === "vertical" ? [0, 6, 6, 0] : [6, 6, 0, 0]} barSize={layout === "vertical" ? 18 : undefined}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DashboardPieChart({ data }: { data: Array<{ name: string; total: number }> }) {
  const visibleData = data.filter((item) => item.total > 0)
  if (visibleData.length === 0) return <EmptyChart />
  const total = visibleData.reduce((acc, item) => acc + item.total, 0)

  return (
    <div className="relative h-[280px] w-full min-w-0">
      <div className="pointer-events-none absolute left-1/2 top-[43%] z-10 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-2xl font-bold text-foreground">{total}</p>
        <p className="text-[11px] text-muted-foreground">Total</p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={visibleData}
            dataKey="total"
            nameKey="name"
            innerRadius={48}
            outerRadius={82}
            paddingAngle={3}
            stroke="var(--card)"
            strokeWidth={3}
          >
            {visibleData.map((entry, index) => (
              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <RechartsTooltip
            content={<ChartTooltipBox />}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 11, lineHeight: "18px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function DashboardPage() {
  const modules = useAuthStore((state) => state.modules)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [data, setData] = useState<DashboardData>(initialData)
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>(() => defaultDateRangeFilter())

  const moduleCodes = useMemo(() => flattenModuleCodes(modules), [modules])
  const hasModuleConfig = moduleCodes.size > 0
  const canUse = (codes: string[]) => !hasModuleConfig || codes.some((code) => moduleCodes.has(code))

  useEffect(() => {
    if (!hasHydrated) return

    let mounted = true

    const loadDashboard = async () => {
      setLoading(true)

      const [
        employeesResult,
        risksResult,
        measuresResult,
        trainingsResult,
        documentsResult,
        incidentsResult,
        responsibleResult,
      ] = await Promise.all([
        safeLoad(canUse(["EMPLOYEE", "EMPLOYEE_MANAGEMENT"]), listEmployees, []),
        safeLoad(canUse(["RISKS", "LABOR"]), async () => (await listRisks()).items, []),
        safeLoad(canUse(["RISKS", "PREVENTIVE_MEASURES"]), async () => (await listPreventiveMeasures()).items, []),
        safeLoad(canUse(["PLANNING", "TRAINING"]), async () => (await listTraining()).items, []),
        safeLoad(canUse(["GESTION_DOCUMENTAL", "DOCUMENTS"]), listManagedDocuments, []),
        safeLoad(canUse(["EMPLOYEE", "INCIDENTS"]), listIncidents, []),
        safeOptionalLoad(canUse(["EMPLOYEE", "EMPLOYEE_MANAGEMENT"]), getSgiResponsible),
      ])

      if (!mounted) return

      setData({
        employees: employeesResult.data,
        risks: risksResult.data,
        preventiveMeasures: measuresResult.data,
        trainings: trainingsResult.data,
        documents: documentsResult.data,
        incidents: incidentsResult.data,
        sgiResponsible: responsibleResult.data,
      })
      setErrors(
        [
          employeesResult.error,
          risksResult.error,
          measuresResult.error,
          trainingsResult.error,
          documentsResult.error,
          incidentsResult.error,
          responsibleResult.error,
        ].filter(Boolean) as string[],
      )
      setLoading(false)
    }

    void loadDashboard()

    return () => {
      mounted = false
    }
  }, [hasHydrated, moduleCodes])

  const range = useMemo(() => getRangeDates(dateFilter), [dateFilter])
  const filteredData = useMemo(() => {
    const filterByDate = (value?: string | null) => isWithinRange(value, range.startDate, range.endDate)

    return {
      ...data,
      incidents: data.incidents.filter((incident) => filterByDate(incident.date)),
      trainings: data.trainings.filter((training) => filterByDate(training.date)),
      preventiveMeasures: data.preventiveMeasures.filter((measure) =>
        filterByDate(measure.doneDate ?? measure.dueDate),
      ),
    }
  }, [data, range.endDate, range.startDate])

  const metrics = useMemo(() => {
    const activeEmployees = filteredData.employees.filter((employee) => employee.status).length
    const inactiveEmployees = filteredData.employees.length - activeEmployees
    const socialSecurityComplete = filteredData.employees.filter(
      (employee) => employee.epsId && employee.arlId && employee.pensionId && employee.compensationId,
    ).length

    const activeRisks = filteredData.risks.filter((risk) => risk.status === "ACTIVE").length
    const highRisks = filteredData.risks.filter(
      (risk) => ["I", "II"].includes(risk.riskLevelName) || Number(risk.riskLevel) >= 150,
    ).length

    const pendingMeasures = filteredData.preventiveMeasures.filter((measure) => measure.status === "PENDING").length
    const doneMeasures = filteredData.preventiveMeasures.filter((measure) => measure.status === "DONE").length
    const overdueMeasures = filteredData.preventiveMeasures.filter(
      (measure) => measure.status === "PENDING" && measure.type === "DATE" && isBeforeToday(measure.dueDate),
    ).length

    const activeTrainings = filteredData.trainings.filter((training) => training.status === "ACTIVE").length
    const finishedTrainings = filteredData.trainings.filter((training) => training.status === "FINALIZADA").length
    const upcomingTrainings = filteredData.trainings
      .filter((training) => training.status === "ACTIVE" && isTodayOrFuture(training.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)

    const activeDocuments = filteredData.documents.filter((document) => document.status === "ACTIVE").length
    const procedures = filteredData.documents.filter((document) => document.type === "PROCEDURE").length
    const policies = filteredData.documents.filter((document) => document.type === "POLICY").length

    const activeIncidents = filteredData.incidents.filter((incident) => incident.status === "ACTIVE").length
    const accidents = filteredData.incidents.filter((incident) => incident.type === "ACCIDENTE").length

    return {
      activeEmployees,
      inactiveEmployees,
      socialSecurityComplete,
      activeRisks,
      highRisks,
      pendingMeasures,
      doneMeasures,
      overdueMeasures,
      activeTrainings,
      finishedTrainings,
      upcomingTrainings,
      activeDocuments,
      procedures,
      policies,
      activeIncidents,
      accidents,
      employeeCoverage: percent(socialSecurityComplete, filteredData.employees.length),
      measureProgress: percent(doneMeasures, filteredData.preventiveMeasures.length),
      riskControl: percent(filteredData.risks.length - highRisks, filteredData.risks.length),
      documentActivity: percent(activeDocuments, filteredData.documents.length),
    }
  }, [filteredData])

  const recentRisks = useMemo(
    () =>
      [...filteredData.risks]
        .sort((a, b) => Number(b.riskLevel) - Number(a.riskLevel))
        .slice(0, 5),
    [filteredData.risks],
  )

  const overdueMeasures = useMemo(
    () =>
      filteredData.preventiveMeasures
        .filter((measure) => measure.status === "PENDING" && measure.type === "DATE" && isBeforeToday(measure.dueDate))
        .slice(0, 5),
    [filteredData.preventiveMeasures],
  )

  const moduleSummaryChartData = useMemo(
    () => [
      { name: "Funcionarios", total: filteredData.employees.length },
      { name: "Riesgos", total: filteredData.risks.length },
      { name: "Medidas", total: filteredData.preventiveMeasures.length },
      { name: "Capacitaciones", total: filteredData.trainings.length },
      { name: "Documentos", total: filteredData.documents.length },
      { name: "Novedades", total: filteredData.incidents.length },
    ],
    [
      filteredData.documents.length,
      filteredData.employees.length,
      filteredData.incidents.length,
      filteredData.preventiveMeasures.length,
      filteredData.risks.length,
      filteredData.trainings.length,
    ],
  )

  const riskStatusChartData = useMemo(
    () => countByLabel(filteredData.risks, (risk) => risk.status, riskStatusLabels),
    [filteredData.risks],
  )

  const measureStatusChartData = useMemo(
    () => [
      { name: "Pendientes", total: metrics.pendingMeasures },
      { name: "Finalizadas", total: metrics.doneMeasures },
      { name: "Vencidas", total: metrics.overdueMeasures },
    ],
    [metrics.doneMeasures, metrics.overdueMeasures, metrics.pendingMeasures],
  )

  const trainingStatusChartData = useMemo(
    () => countByLabel(filteredData.trainings, (training) => training.status, trainingStatusLabels),
    [filteredData.trainings],
  )

  const incidentTypeChartData = useMemo(
    () =>
      countByLabel(filteredData.incidents, (incident) => incident.type ?? "INCIDENTE", incidentTypeLabels)
        .sort((a, b) => b.total - a.total)
        .slice(0, 8),
    [filteredData.incidents],
  )

  function updateDateFilter(partial: Partial<DateRangeFilter>) {
    setDateFilter((current) => ({ ...current, ...partial }))
  }

  function handleDownloadDashboardReport() {
    if (!validateDateRange(dateFilter)) {
      toast.error("Selecciona una fecha inicial y final válidas")
      return
    }

    buildReportPdf({
      title: "Reporte Dashboard SGI",
      subtitle: `Periodo: ${range.label}`,
      filename: `dashboard-sgi-${new Date().toISOString().slice(0, 10)}.pdf`,
      summary: [
        ["Funcionarios", filteredData.employees.length],
        ["Riesgos laborales", filteredData.risks.length],
        ["Medidas preventivas", filteredData.preventiveMeasures.length],
        ["Capacitaciones", filteredData.trainings.length],
        ["Documentos SGI", filteredData.documents.length],
        ["Novedades laborales", filteredData.incidents.length],
        ["Medidas vencidas", metrics.overdueMeasures],
        ["Riesgos prioritarios", metrics.highRisks],
      ],
      rows: [
        { modulo: "Funcionarios", total: filteredData.employees.length, indicador: `${metrics.activeEmployees} activos` },
        { modulo: "Riesgos laborales", total: filteredData.risks.length, indicador: `${metrics.highRisks} prioritarios` },
        { modulo: "Medidas preventivas", total: filteredData.preventiveMeasures.length, indicador: `${metrics.measureProgress}% cerradas` },
        { modulo: "Capacitaciones", total: filteredData.trainings.length, indicador: `${metrics.activeTrainings} activas` },
        { modulo: "Documentos SGI", total: filteredData.documents.length, indicador: `${metrics.activeDocuments} activos` },
        { modulo: "Novedades laborales", total: filteredData.incidents.length, indicador: `${metrics.accidents} accidentes` },
      ],
      columns: [
        { header: "Modulo", value: (row) => row.modulo },
        { header: "Total", value: (row) => row.total },
        { header: "Indicador", value: (row) => row.indicador },
      ],
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando informacion del SGI...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Dashboard SGI</h1>
          <p className="text-sm text-muted-foreground">
            Resumen operativo de funcionarios, riesgos, capacitaciones y gestion documental.
          </p>
        </div>
        <div className="shrink-0 text-sm text-muted-foreground">
          Ultima actualizacion: {new Date().toLocaleDateString("es-CO")}
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[180px_160px_160px_160px_auto] xl:items-end">
          <div className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">Periodo</span>
            <Select value={dateFilter.mode} onValueChange={(value) => updateDateFilter({ mode: value as DateRangeMode })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="bimester">Bimestre</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="custom">Rango de fechas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">Año</span>
            <Input
              type="number"
              min="2020"
              max="2100"
              value={dateFilter.year}
              disabled={dateFilter.mode === "all" || dateFilter.mode === "custom"}
              onChange={(event) => updateDateFilter({ year: event.target.value })}
            />
          </div>
          {dateFilter.mode === "bimester" || dateFilter.mode === "quarter" ? (
            <div className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {dateFilter.mode === "bimester" ? "Bimestre" : "Trimestre"}
              </span>
              <Select value={dateFilter.period} onValueChange={(period) => updateDateFilter({ period })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: dateFilter.mode === "bimester" ? 6 : 4 }, (_, index) => (
                    <SelectItem key={index + 1} value={String(index + 1)}>
                      {index + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">Fecha inicial</span>
              <Input
                type="date"
                value={dateFilter.startDate}
                disabled={dateFilter.mode !== "custom"}
                onChange={(event) => updateDateFilter({ startDate: event.target.value })}
              />
            </div>
          )}
          <div className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">Fecha final</span>
            <Input
              type="date"
              value={dateFilter.endDate}
              disabled={dateFilter.mode !== "custom"}
              onChange={(event) => updateDateFilter({ endDate: event.target.value })}
            />
          </div>
          <Button type="button" className="gap-2" onClick={handleDownloadDashboardReport}>
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
          <div className="text-xs text-muted-foreground md:col-span-2 xl:col-span-5">
            <Filter className="mr-1 inline h-3.5 w-3.5" />
            Datos filtrados por: {range.label}
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Informacion parcial</AlertTitle>
          <AlertDescription>
            {errors.slice(0, 2).join(" | ")}
            {errors.length > 2 ? ` y ${errors.length - 2} modulos adicionales no respondieron.` : ""}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          title="Funcionarios"
          value={filteredData.employees.length}
          target={metrics.activeEmployees}
          targetLabel="Activos"
          trend="stable"
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          title="Riesgos laborales"
          value={filteredData.risks.length}
          target={metrics.highRisks}
          targetLabel="Prioritarios"
          trend={metrics.highRisks > 0 ? "down" : "stable"}
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <KpiCard
          title="Medidas preventivas"
          value={filteredData.preventiveMeasures.length}
          target={metrics.pendingMeasures}
          targetLabel="Pendientes"
          trend={metrics.overdueMeasures > 0 ? "down" : "stable"}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <KpiCard
          title="Capacitaciones"
          value={filteredData.trainings.length}
          target={metrics.activeTrainings}
          targetLabel="Activas"
          trend="stable"
          icon={<BookOpenCheck className="h-5 w-5" />}
        />
        <KpiCard
          title="Documentos SGI"
          value={filteredData.documents.length}
          target={metrics.activeDocuments}
          targetLabel="Activos"
          trend="stable"
          icon={<FileText className="h-5 w-5" />}
        />
        <KpiCard
          title="Novedades laborales"
          value={filteredData.incidents.length}
          target={metrics.activeIncidents}
          targetLabel="Activas"
          trend={metrics.accidents > 0 ? "down" : "stable"}
          icon={<HardHat className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardSection title="Resumen por modulo" description="Volumen de registros activos en el periodo filtrado.">
          <DashboardBarChart data={moduleSummaryChartData} />
        </DashboardSection>

        <DashboardSection title="Estados de riesgos" description="Distribucion del estado actual de la matriz de riesgos.">
          <DashboardPieChart data={riskStatusChartData} />
        </DashboardSection>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardSection title="Medidas preventivas" description="Seguimiento general de cumplimiento y vencimientos.">
          <DashboardPieChart data={measureStatusChartData} />
        </DashboardSection>

        <DashboardSection title="Capacitaciones por estado" description="Plan anual agrupado por estado de ejecucion.">
          <DashboardBarChart data={trainingStatusChartData} color="var(--chart-2)" />
        </DashboardSection>

        <DashboardSection title="Tipos de novedades" description="Principales novedades laborales reportadas.">
          <DashboardBarChart data={incidentTypeChartData} color="var(--chart-3)" layout="vertical" />
        </DashboardSection>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <DashboardSection title="Cobertura de seguridad social">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Funcionarios completos</span>
              <span className="font-medium">{metrics.employeeCoverage}%</span>
            </div>
            <Progress value={metrics.employeeCoverage} />
            <p className="text-xs text-muted-foreground">
              {metrics.socialSecurityComplete} de {filteredData.employees.length} funcionarios con EPS, ARL, pension y caja.
            </p>
          </div>
        </DashboardSection>

        <DashboardSection title="Avance de medidas">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Medidas cerradas</span>
              <span className="font-medium">{metrics.measureProgress}%</span>
            </div>
            <Progress value={metrics.measureProgress} />
            <p className="text-xs text-muted-foreground">
              {metrics.doneMeasures} finalizadas, {metrics.pendingMeasures} pendientes y {metrics.overdueMeasures} vencidas.
            </p>
          </div>
        </DashboardSection>

        <DashboardSection title="Control de riesgos">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Riesgos no prioritarios</span>
              <span className="font-medium">{metrics.riskControl}%</span>
            </div>
            <Progress value={metrics.riskControl} />
            <p className="text-xs text-muted-foreground">
              {metrics.activeRisks} activos y {metrics.highRisks} con nivel alto o prioritario.
            </p>
          </div>
        </DashboardSection>

        <DashboardSection title="Responsable SG-SST">
          <div className="space-y-2">
            {data.sgiResponsible ? (
              <>
                <p className="font-medium">
                  {data.sgiResponsible.employee.name} {data.sgiResponsible.employee.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Firma: {formatDate(data.sgiResponsible.signatureDate)}
                </p>
                <Badge variant="secondary" className="text-xs">
                  Designado
                </Badge>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Sin responsable designado</p>
                <Badge variant="outline" className="text-xs">
                  Pendiente
                </Badge>
              </>
            )}
          </div>
        </DashboardSection>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardSection title="Proximas capacitaciones">
          <div className="space-y-3">
            {metrics.upcomingTrainings.length > 0 ? (
              metrics.upcomingTrainings.map((training) => (
                <div key={training.id} className="flex min-w-0 items-start justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{training.topic?.name ?? "Capacitacion"}</p>
                    <p className="text-xs text-muted-foreground">{training.durationHours} horas</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {formatDate(training.date)}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay capacitaciones proximas activas.</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Finalizadas: {metrics.finishedTrainings}
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Riesgos prioritarios">
          <div className="space-y-3">
            {recentRisks.length > 0 ? (
              recentRisks.map((risk) => (
                <div key={risk.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">{risk.process}</p>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {risk.riskLevelName || "Sin nivel"}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {risk.activity} - {risk.task}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Estado: {riskStatusLabels[risk.status] ?? risk.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay riesgos laborales registrados.</p>
            )}
          </div>
        </DashboardSection>

        <DashboardSection title="Medidas vencidas">
          <div className="space-y-3">
            {overdueMeasures.length > 0 ? (
              overdueMeasures.map((measure) => (
                <div key={measure.id} className="rounded-md border border-destructive/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">{measure.title}</p>
                    <Badge variant="outline" className="shrink-0 text-xs text-destructive">
                      Vencida
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{measure.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Vence: {formatDate(measure.dueDate)}</p>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No hay medidas preventivas vencidas.
              </div>
            )}
          </div>
        </DashboardSection>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardSection title="Gestion documental">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Procedimientos</p>
              <p className="text-xl font-semibold">{metrics.procedures}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Politicas</p>
              <p className="text-xl font-semibold">{metrics.policies}</p>
            </div>
            <div className="col-span-2 rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Documentos activos</p>
              <p className="text-xl font-semibold">{metrics.documentActivity}%</p>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Funcionarios">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Activos</p>
              <p className="text-xl font-semibold">{metrics.activeEmployees}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Inactivos</p>
              <p className="text-xl font-semibold">{metrics.inactiveEmployees}</p>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Novedades laborales">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Accidentes</p>
              <p className="text-xl font-semibold">{metrics.accidents}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Activas</p>
              <p className="text-xl font-semibold">{metrics.activeIncidents}</p>
            </div>
          </div>
        </DashboardSection>
      </div>
    </div>
  )
}
