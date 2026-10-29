"use client"

import { listPesv, pesvResources } from "@/services/pesvService"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CircleHelp, Info, Search, ShieldCheck } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  isPesvModuleAllowed,
  pesvGroups,
  pesvModuleCatalog,
  type PesvModuleCatalogItem,
} from "@/lib/pesv/module-catalog"
import { useAuthStore, type ModuleNode } from "@/store/auth.store"

type ModuleState = "empty" | "records" | "demo" | "unavailable"

function collectCodes(modules: ModuleNode[]) {
  const codes = new Set<string>()

  const visit = (items: ModuleNode[]) => {
    items.forEach((item) => {
      codes.add(item.code)
      if (item.children?.length) visit(item.children)
    })
  }

  visit(modules)
  return codes
}

const moduleEndpoints: Record<string, string> = {
  PESV_RESPONSIBLE: pesvResources.responsible, PESV_COMMITTEE: pesvResources.committee,
  PESV_POLICY: pesvResources.policies, PESV_LEADERSHIP: pesvResources.leadership,
  PESV_DIAGNOSIS: pesvResources.diagnoses, PESV_OBJECTIVES: pesvResources.objectives,
}
const stateLabel: Record<ModuleState, string> = {
  unavailable: "No disponible",
  empty: "Sin registros",
  records: "Con información",
  demo: "Información de demostración",
}

const stateClassName: Record<ModuleState, string> = {
  unavailable: "border-red-200 bg-red-50 text-red-700",
  empty: "border-slate-200 bg-slate-50 text-slate-600",
  records: "border-emerald-200 bg-emerald-50 text-emerald-700",
  demo: "border-amber-200 bg-amber-50 text-amber-800",
}

export default function PesvPage() {
  const modules = useAuthStore((state) => state.modules)
  const [query, setQuery] = useState("")
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>({})
  const allowedCodes = useMemo(() => collectCodes(modules), [modules])
  const allowedModules = useMemo(
    () => pesvModuleCatalog.filter((module) => isPesvModuleAllowed(module.code, allowedCodes)),
    [allowedCodes],
  )

  useEffect(() => {
    let active = true
    Promise.all(allowedModules.map(async module => {
      try { const records = await listPesv<{ id: string }>(moduleEndpoints[module.code]); return [module.code, records.length ? "records" : "empty"] as const }
      catch { return [module.code, "unavailable"] as const }
    })).then(states => { if (active) setModuleStates(Object.fromEntries(states)) })
    return () => { active = false }
  }, [allowedModules])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredModules = allowedModules.filter((module) =>
    `${module.name} ${module.description}`
      .toLowerCase()
      .includes(normalizedQuery),
  )
  const hasDemoInformation = allowedModules.some((module) => moduleStates[module.code] === "demo")
  const hasAnyInformation = allowedModules.some((module) => moduleStates[module.code] !== "empty")
  const gettingStarted = allowedModules.filter((module) => module.steps[0] <= 4)

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/dashboard">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>PESV</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">Plan Estratégico de Seguridad Vial</h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Organiza la planificación, operación, verificación y mejora del PESV desde un único punto de acceso.
              </p>
            </div>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar módulo PESV"
              aria-label="Buscar módulos PESV"
              className="pl-9"
            />
          </div>
        </div>
      </header>

      {hasDemoInformation ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p><strong>Información de demostración identificada.</strong> Los módulos señalados contienen datos de ejemplo y no deben interpretarse como información real de la empresa.</p>
        </div>
      ) : null}

      {!hasAnyInformation && gettingStarted.length > 0 ? (
        <section className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5">
          <div className="flex items-start gap-3">
            <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-950">¿Por dónde comenzar?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Completa primero la estructura de gobierno y dirección para establecer la base del plan.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {gettingStarted.map((module) => (
                  <Link key={module.code} href={module.href} className="flex items-center gap-3 rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:border-sky-300 hover:text-sky-700">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                    <span className="min-w-0 truncate">{module.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {filteredModules.length > 0 ? (
        <div className="space-y-7">
          {pesvGroups.map((group) => {
            const groupModules = filteredModules.filter((module) => module.group === group.id)
            if (!groupModules.length) return null

            return (
              <section key={group.id} aria-labelledby={`pesv-group-${group.id}`}>
                <div className="mb-3">
                  <h2 id={`pesv-group-${group.id}`} className="text-base font-semibold text-slate-950">{group.name}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{group.description}</p>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {groupModules.map((module) => {
                    const Icon = module.icon
                    const state = moduleStates[module.code] ?? "empty"
                    return (
                      <Link
                        key={module.code}
                        href={module.href}
                        className="group flex min-w-0 items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Badge variant="outline" className={stateClassName[state]}>{stateLabel[state]}</Badge>
                          <h3 className="mt-2 font-semibold text-slate-950 group-hover:text-sky-700">{module.name}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{module.description}</p>
                        </div>
                        <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-700" />
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <Empty className="border border-slate-200 bg-white py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Search /></EmptyMedia>
            <EmptyTitle>No encontramos módulos</EmptyTitle>
            <EmptyDescription>Prueba con otro nombre o propósito dentro del PESV.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
