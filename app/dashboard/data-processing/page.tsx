"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileClock,
  History,
  Link2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  buildPublicConsentUrl,
  dataAuthorizationStatusLabels,
  dataAuthorizationStatusOptions,
  downloadConsentCertificate,
  generateDataConsentLink,
  getDataConsentSummary,
  invalidateDataConsentLink,
  listDataConsentAuthorizations,
  regenerateDataConsentLink,
  requestDataConsentReacceptance,
} from "@/services/dataProcessingService"
import type { DataAuthorizationStatus, DataConsentSummary, EmployeeDataConsent } from "@/types/manager/data-processing"
import { cn } from "@/lib/utils"

const statusStyles: Record<DataAuthorizationStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  SENT: "border-blue-200 bg-blue-50 text-blue-700",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  REVOKED: "border-slate-300 bg-slate-100 text-slate-700",
  REQUIRES_REACCEPTANCE: "border-purple-200 bg-purple-50 text-purple-700",
  EXPIRED: "border-orange-200 bg-orange-50 text-orange-700",
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return new Date(value).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function formatDateTime(value?: string | null) {
  if (!value) return "No registrada"
  return new Date(value).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusBadge({ status }: { status: DataAuthorizationStatus }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", statusStyles[status])}>
      {dataAuthorizationStatusLabels[status]}
    </Badge>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: number
  icon: typeof ShieldCheck
}) {
  return (
    <Card className="rounded-lg">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DataProcessingPage() {
  const [authorizations, setAuthorizations] = useState<EmployeeDataConsent[]>([])
  const [summary, setSummary] = useState<DataConsentSummary>({
    totalEmployees: 0,
    accepted: 0,
    pending: 0,
    expired: 0,
    requiresReacceptance: 0,
  })
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<DataAuthorizationStatus | "ALL">("ALL")
  const [selected, setSelected] = useState<EmployeeDataConsent | null>(null)

  async function loadData() {
    const [records, metrics] = await Promise.all([listDataConsentAuthorizations(), getDataConsentSummary()])
    setAuthorizations(records)
    setSummary(metrics)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredAuthorizations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return authorizations.filter((authorization) => {
      const matchesStatus = status === "ALL" || authorization.status === status
      const employeeName = `${authorization.employee.name} ${authorization.employee.lastName}`.toLowerCase()
      const matchesQuery =
        !normalizedQuery ||
        employeeName.includes(normalizedQuery) ||
        authorization.employee.documentNumberMasked.includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [authorizations, query, status])

  async function refreshSelected(consentId?: string) {
    const records = await listDataConsentAuthorizations()
    setAuthorizations(records)
    setSummary(await getDataConsentSummary())
    if (consentId) {
      setSelected(records.find((record) => record.id === consentId) ?? null)
    }
  }

  async function handleGenerate(consent: EmployeeDataConsent) {
    const updated = await generateDataConsentLink(consent.id)
    await refreshSelected(consent.id)
    const url = buildPublicConsentUrl(updated?.publicUrl)
    if (url) {
      await navigator.clipboard?.writeText(url)
      toast.success("Autorización generada y enlace copiado")
    } else {
      toast.success("Autorización generada")
    }
  }

  async function handleCopy(consent: EmployeeDataConsent) {
    const url = buildPublicConsentUrl(consent.publicUrl)
    if (!url) {
      toast.error("Primero genera un enlace de autorización")
      return
    }
    await navigator.clipboard?.writeText(url)
    toast.success("Enlace copiado")
  }

  async function handleRegenerate(consent: EmployeeDataConsent) {
    await regenerateDataConsentLink(consent.id)
    await refreshSelected(consent.id)
    toast.success("Enlace regenerado")
  }

  async function handleInvalidate(consent: EmployeeDataConsent) {
    await invalidateDataConsentLink(consent.id)
    await refreshSelected(consent.id)
    toast.success("Enlace invalidado")
  }

  async function handleReacceptance(consent: EmployeeDataConsent) {
    await requestDataConsentReacceptance(consent.id)
    await refreshSelected(consent.id)
    toast.success("Nueva aceptación solicitada")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tratamiento de Datos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona autorizaciones, enlaces, constancias y trazabilidad del tratamiento de datos personales.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total empleados" value={summary.totalEmployees} icon={ShieldCheck} />
        <MetricCard title="Autorizaciones aceptadas" value={summary.accepted} icon={CheckCircle2} />
        <MetricCard title="Pendientes" value={summary.pending} icon={FileClock} />
        <MetricCard title="Vencidas" value={summary.expired} icon={AlertTriangle} />
        <MetricCard title="Requieren nueva aceptación" value={summary.requiresReacceptance} icon={RefreshCw} />
      </div>

      <Card className="rounded-lg">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Autorizaciones</CardTitle>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px] lg:w-[560px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por empleado o documento"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Select value={status} onValueChange={(value) => setStatus(value as DataAuthorizationStatus | "ALL")}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {dataAuthorizationStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Versión</th>
                  <th className="px-4 py-3">Envío</th>
                  <th className="px-4 py-3">Aceptación</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAuthorizations.map((authorization) => (
                  <tr key={authorization.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {authorization.employee.name} {authorization.employee.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{authorization.employee.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {authorization.employee.documentType} {authorization.documentNumberMasked}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={authorization.status} />
                    </td>
                    <td className="px-4 py-3">{authorization.templateVersion}</td>
                    <td className="px-4 py-3">{formatDate(authorization.sentAt)}</td>
                    <td className="px-4 py-3">{formatDate(authorization.acceptedAt)}</td>
                    <td className="px-4 py-3">{formatDate(authorization.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" size="sm" className="gap-2" onClick={() => handleGenerate(authorization)}>
                          <Link2 className="h-4 w-4" />
                          Generar
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => handleCopy(authorization)}>
                          <Copy className="h-4 w-4" />
                          Copiar
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setSelected(authorization)}>
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAuthorizations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No hay autorizaciones con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle de autorización</DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {selected.employee.name} {selected.employee.lastName}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {selected.employee.documentType} {selected.documentNumberMasked} · {selected.employee.companyName}
                      </p>
                    </div>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <p>
                      <span className="font-medium">Versión:</span> {selected.templateVersion}
                    </p>
                    <p>
                      <span className="font-medium">Enviado:</span> {formatDateTime(selected.sentAt)}
                    </p>
                    <p>
                      <span className="font-medium">Aceptado:</span> {formatDateTime(selected.acceptedAt)}
                    </p>
                    <p>
                      <span className="font-medium">Vence:</span> {formatDateTime(selected.expiresAt)}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="font-medium">Hash evidencia:</span>{" "}
                      <span className="break-all">{selected.evidenceHash ?? "Pendiente"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" className="gap-2" onClick={() => handleRegenerate(selected)}>
                    <RefreshCw className="h-4 w-4" />
                    Regenerar enlace
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={() => handleInvalidate(selected)}>
                    <Ban className="h-4 w-4" />
                    Invalidar enlace
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={() => handleReacceptance(selected)}>
                    <History className="h-4 w-4" />
                    Solicitar nueva aceptación
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={() => downloadConsentCertificate(selected)}>
                    <Download className="h-4 w-4" />
                    Descargar constancia PDF
                  </Button>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-slate-900">Documento aceptado</h3>
                  <p className="mt-2 max-h-44 overflow-y-auto whitespace-pre-wrap text-sm text-slate-600">
                    {selected.template.content}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-semibold text-slate-900">Historial de auditoría</h3>
                  <div className="space-y-2">
                    {selected.auditLogs.map((log) => (
                      <div key={log.id} className="rounded-md bg-slate-50 p-3 text-sm">
                        <p className="font-medium">{log.event}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(log.timestamp)} · {log.actor}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
