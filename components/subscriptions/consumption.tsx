"use client"

import { AlertTriangle, Bell, CheckCheck, HardDrive, MessageCircle, Users } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth.store"
import { tokenHasRole } from "@/lib/jwt"
import { useSubscriptionDemo } from "@/hooks/useSubscriptionDemo"
import { alertKey, companyPreview, consumption, formatStorage, plans, type Subscription } from "@/lib/subscriptions/model"

export function StorageConsumption({ subscription }: { subscription: Subscription }) {
  const usage = consumption(subscription)
  const color = usage.threshold >= 100 ? "bg-red-600" : usage.threshold >= 80 ? "bg-amber-500" : "bg-blue-600"
  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-medium"><HardDrive className="h-4 w-4 text-blue-600" />Almacenamiento compartido</h3><strong className={usage.threshold >= 100 ? "text-red-700" : "text-foreground"}>{usage.percentage.toLocaleString("es-CO", { maximumFractionDigits: 1 })}%</strong></div>
    <div role="progressbar" aria-label="Almacenamiento utilizado" aria-valuenow={Math.min(100, usage.percentage)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${formatStorage(usage.usedBytes)} de ${formatStorage(usage.capacityBytes)}`} className="h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full ${color}`} style={{ width: `${Math.min(100, usage.percentage)}%` }} /></div>
    <div className="flex flex-wrap justify-between gap-2 text-sm"><span><strong>{formatStorage(usage.usedBytes)}</strong> utilizados de {formatStorage(usage.capacityBytes)}</span><span className="text-muted-foreground">{formatStorage(usage.availableBytes)} disponibles</span></div>
    <p className="text-xs text-muted-foreground">Incluidos: {usage.includedGB} GB · Adicionales: {subscription.extraStorageGB} GB</p>
    {usage.threshold > 0 && <p role="status" className={`flex items-start gap-2 text-sm ${usage.threshold >= 100 ? "text-red-700" : "text-amber-700"}`}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{usage.excessBytes > 0 ? `Consumo excedido en ${formatStorage(usage.excessBytes)}.` : usage.threshold === 100 ? "Capacidad contratada alcanzada." : "El espacio compartido está próximo a agotarse."}</p>}
  </div>
}

export function CompanySubscriptionConsumption() {
  const company = useAuthStore(state => state.company)
  const token = useAuthStore(state => state.accessToken)
  const { data, ready, error, update } = useSubscriptionDemo()
  if (!ready || !company || !tokenHasRole(token, "ADMIN_COMPANY")) return null
  const view = companyPreview(data, company.id)
  const usage = view && consumption(view.subscription)
  const noticeKey = view && alertKey(company.id, view.subscription)
  const acknowledged = noticeKey && data.acknowledged[company.id] === noticeKey
  return <section aria-labelledby="subscription-title" className="space-y-5 border-y border-border py-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="subscription-title" className="text-lg font-semibold">Plan y consumo</h2><Badge variant="outline">Prototipo · datos simulados</Badge></div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <>
      {view.isExample && <p className="text-sm text-muted-foreground">Ejemplo de consumo. Las cifras no corresponden a los empleados ni archivos reales de esta empresa.</p>}
      <div className="grid min-w-0 gap-6 md:grid-cols-2">
        <div className="space-y-3 md:border-r md:pr-6"><h3 className="break-words font-medium">{company.name}</h3><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{view.company.plan ? plans[view.company.plan].name : "Plan pendiente de registrar"}</Badge>{view.company.plan && <span className="text-xs text-muted-foreground">{plans[view.company.plan].standards} estándares</span>}</div>
          <p className="flex flex-wrap items-center gap-2 text-sm"><Users className="h-4 w-4 text-blue-600" />Empleados activos: <strong className={view.company.plan && view.company.activeEmployees > plans[view.company.plan].employees ? "text-red-700" : "text-green-700"}>{view.company.activeEmployees}{view.company.plan && ` de ${plans[view.company.plan].employees}`}</strong></p>
          <p className="text-xs text-muted-foreground">{view.company.inactiveEmployees} inactivos conservados en el histórico; no cuentan en el límite.</p>
          {view.company.plan && view.company.activeEmployees > plans[view.company.plan].employees && <p className="text-sm text-red-700">La empresa supera la cantidad de empleados contratada.</p>}
        </div>
        <StorageConsumption subscription={view.subscription} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><span className="text-xs text-muted-foreground">Bolsa común de la suscripción · 1 GB = 1.000.000.000 bytes</span><Button asChild variant="outline" className="gap-2"><a href={`https://wa.me/573218900642?text=${encodeURIComponent(`Hola, quisiera ampliar el almacenamiento de SafeCloud para ${company.name}.`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />Solicitar más almacenamiento</a></Button></div>
      {usage && usage.threshold > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-amber-500 bg-amber-50 p-3 text-sm text-amber-950" role="status"><span className="flex min-w-0 items-center gap-2"><Bell className="h-4 w-4 shrink-0" />Aviso de consumo compartido: umbral del {usage.threshold}%{acknowledged ? " · Leído" : " · Nuevo"}</span><Button size="sm" variant="ghost" disabled={!!acknowledged} onClick={() => { try { update(current => ({ ...current, acknowledged: { ...current.acknowledged, [company.id]: noticeKey! } })) } catch { toast.error("No se pudo guardar la lectura del aviso de prueba") } }}><CheckCheck className="mr-2 h-4 w-4" />Marcar como leído</Button></div>}
    </>}
  </section>
}
