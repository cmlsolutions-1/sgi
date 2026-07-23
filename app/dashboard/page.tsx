"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  HardHat,
  Loader2,
  ShieldAlert,
  Users,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { KpiCard } from "@/components/dashboard/kpi-card"
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
  if (!value) return "Sin fecha"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
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
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const modules = useAuthStore((state) => state.modules)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [data, setData] = useState<DashboardData>(initialData)
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

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

  const metrics = useMemo(() => {
    const activeEmployees = data.employees.filter((employee) => employee.status).length
    const inactiveEmployees = data.employees.length - activeEmployees
    const socialSecurityComplete = data.employees.filter(
      (employee) => employee.epsId && employee.arlId && employee.pensionId && employee.compensationId,
    ).length

    const activeRisks = data.risks.filter((risk) => risk.status === "ACTIVE").length
    const highRisks = data.risks.filter(
      (risk) => ["I", "II"].includes(risk.riskLevelName) || Number(risk.riskLevel) >= 150,
    ).length

    const pendingMeasures = data.preventiveMeasures.filter((measure) => measure.status === "PENDING").length
    const doneMeasures = data.preventiveMeasures.filter((measure) => measure.status === "DONE").length
    const overdueMeasures = data.preventiveMeasures.filter(
      (measure) => measure.status === "PENDING" && measure.type === "DATE" && isBeforeToday(measure.dueDate),
    ).length

    const activeTrainings = data.trainings.filter((training) => training.status === "ACTIVE").length
    const finishedTrainings = data.trainings.filter((training) => training.status === "FINALIZADA").length
    const upcomingTrainings = data.trainings
      .filter((training) => training.status === "ACTIVE" && isTodayOrFuture(training.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)

    const activeDocuments = data.documents.filter((document) => document.status === "ACTIVE").length
    const procedures = data.documents.filter((document) => document.type === "PROCEDURE").length
    const policies = data.documents.filter((document) => document.type === "POLICY").length

    const activeIncidents = data.incidents.filter((incident) => incident.status === "ACTIVE").length
    const accidents = data.incidents.filter((incident) => incident.type === "ACCIDENTE").length

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
      employeeCoverage: percent(socialSecurityComplete, data.employees.length),
      measureProgress: percent(doneMeasures, data.preventiveMeasures.length),
      riskControl: percent(data.risks.length - highRisks, data.risks.length),
      documentActivity: percent(activeDocuments, data.documents.length),
    }
  }, [data])

  const recentRisks = useMemo(
    () =>
      [...data.risks]
        .sort((a, b) => Number(b.riskLevel) - Number(a.riskLevel))
        .slice(0, 5),
    [data.risks],
  )

  const overdueMeasures = useMemo(
    () =>
      data.preventiveMeasures
        .filter((measure) => measure.status === "PENDING" && measure.type === "DATE" && isBeforeToday(measure.dueDate))
        .slice(0, 5),
    [data.preventiveMeasures],
  )

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
          value={data.employees.length}
          target={metrics.activeEmployees}
          targetLabel="Activos"
          trend="stable"
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          title="Riesgos laborales"
          value={data.risks.length}
          target={metrics.highRisks}
          targetLabel="Prioritarios"
          trend={metrics.highRisks > 0 ? "down" : "stable"}
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <KpiCard
          title="Medidas preventivas"
          value={data.preventiveMeasures.length}
          target={metrics.pendingMeasures}
          targetLabel="Pendientes"
          trend={metrics.overdueMeasures > 0 ? "down" : "stable"}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <KpiCard
          title="Capacitaciones"
          value={data.trainings.length}
          target={metrics.activeTrainings}
          targetLabel="Activas"
          trend="stable"
          icon={<BookOpenCheck className="h-5 w-5" />}
        />
        <KpiCard
          title="Documentos SGI"
          value={data.documents.length}
          target={metrics.activeDocuments}
          targetLabel="Activos"
          trend="stable"
          icon={<FileText className="h-5 w-5" />}
        />
        <KpiCard
          title="Novedades laborales"
          value={data.incidents.length}
          target={metrics.activeIncidents}
          targetLabel="Activas"
          trend={metrics.accidents > 0 ? "down" : "stable"}
          icon={<HardHat className="h-5 w-5" />}
        />
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
              {metrics.socialSecurityComplete} de {data.employees.length} funcionarios con EPS, ARL, pension y caja.
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

        <DashboardSection title="Responsable SGI">
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
