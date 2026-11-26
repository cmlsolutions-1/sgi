export const GB = 1_000_000_000
export const plans = {
  PLAN_1: { name: "Plan 1", standards: 7, employees: 50, storageGB: 3 },
  PLAN_2: { name: "Plan 2", standards: 21, employees: 100, storageGB: 6 },
  PLAN_3: { name: "Plan 3", standards: 60, employees: 250, storageGB: 15 },
} as const
export type PlanId = keyof typeof plans
export type SubscriptionCompany = { id: string; name: string; plan: PlanId | null; activeEmployees: number; inactiveEmployees: number; usedBytes: number }
export type Subscription = { id: string; ownerId: string; ownerName: string; email: string; quantities: Record<PlanId, number>; extraStorageGB: number; companies: SubscriptionCompany[] }
export type DemoState = { subscriptions: Subscription[]; bindings: Record<string, { subscriptionId: string; companyId: string }>; acknowledged: Record<string, string> }
export const planIds = Object.keys(plans) as PlanId[]
export function consumption(subscription: Subscription) {
  const contractedCompanies = planIds.reduce((n, id) => n + subscription.quantities[id], 0)
  const includedGB = planIds.reduce((n, id) => n + subscription.quantities[id] * plans[id].storageGB, 0)
  const capacityBytes = (includedGB + subscription.extraStorageGB) * GB
  const usedBytes = subscription.companies.reduce((n, company) => n + company.usedBytes, 0)
  const percentage = capacityBytes > 0 ? usedBytes / capacityBytes * 100 : usedBytes > 0 ? 100 : 0
  const threshold = percentage >= 100 ? 100 : percentage >= 90 ? 90 : percentage >= 80 ? 80 : 0
  return { contractedCompanies, includedGB, capacityBytes, usedBytes, percentage, threshold, availableBytes: Math.max(0, capacityBytes - usedBytes), excessBytes: Math.max(0, usedBytes - capacityBytes) }
}
export function subscriptionWarnings(subscription: Subscription) {
  const summary = consumption(subscription), warnings: string[] = []
  if (subscription.companies.length !== summary.contractedCompanies) warnings.push(`${subscription.companies.length} empresas registradas frente a ${summary.contractedCompanies} contratadas.`)
  for (const plan of planIds) {
    const assigned = subscription.companies.filter(company => company.plan === plan).length
    if (assigned !== subscription.quantities[plan]) warnings.push(`${plans[plan].name}: ${assigned} empresas asociadas y ${subscription.quantities[plan]} contratadas.`)
  }
  const missing = subscription.companies.filter(company => !company.plan).length
  if (missing) warnings.push(`${missing} empresas sin plan asociado.`)
  return warnings
}
export function validateSubscription(subscription: Subscription) {
  if (!subscription.ownerName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subscription.email)) return "Completa el cliente y un correo válido."
  if (planIds.some(id => !Number.isSafeInteger(subscription.quantities[id]) || subscription.quantities[id] < 0)) return "Las cantidades contratadas deben ser enteros no negativos."
  if (!Number.isFinite(subscription.extraStorageGB) || subscription.extraStorageGB < 0) return "Revisa el almacenamiento adicional."
  if (subscription.companies.some(company => !Number.isSafeInteger(company.activeEmployees) || company.activeEmployees < 0 || !Number.isSafeInteger(company.inactiveEmployees) || company.inactiveEmployees < 0 || !Number.isSafeInteger(company.usedBytes) || company.usedBytes < 0 || (company.plan !== null && !planIds.includes(company.plan)))) return "Revisa los empleados y el almacenamiento de las empresas."
  if (!Number.isSafeInteger(consumption(subscription).capacityBytes)) return "La capacidad contratada supera el rango admitido."
  return null
}
export function companyView(state: DemoState, realCompanyId: string) {
  const binding = state.bindings[realCompanyId]
  const subscription = state.subscriptions.find(item => item.id === binding?.subscriptionId)
  const company = subscription?.companies.find(item => item.id === binding?.companyId)
  return subscription && company ? { subscription, company } : null
}
export function companyPreview(state: DemoState, realCompanyId: string) {
  const assigned = companyView(state, realCompanyId)
  if (assigned) return { ...assigned, isExample: false }
  const subscription = state.subscriptions.find(item => item.companies.length > 0) ?? createDemoState().subscriptions[0]
  return { subscription, company: subscription.companies[0], isExample: true }
}
export function alertKey(realCompanyId: string, subscription: Subscription) {
  const summary = consumption(subscription)
  return `${realCompanyId}:${subscription.id}:${summary.capacityBytes}:${summary.threshold}`
}
export function formatStorage(bytes: number) { return `${(bytes / GB).toLocaleString("es-CO", { maximumFractionDigits: 2 })} GB` }
export function createDemoState(): DemoState {
  const company = (id: string, name: string, plan: PlanId, activeEmployees: number, usedGB: number): SubscriptionCompany => ({ id, name, plan, activeEmployees, inactiveEmployees: 8, usedBytes: Math.round(usedGB * GB) })
  return { bindings: {}, acknowledged: {}, subscriptions: [
    { id: "demo-client-1", ownerId: "demo-owner-1", ownerName: "Grupo Horizonte", email: "administracion@horizonte.example", quantities: { PLAN_1: 2, PLAN_2: 0, PLAN_3: 4 }, extraStorageGB: 0, companies: [
      company("demo-h1", "Horizonte Servicios", "PLAN_1", 38, 8.5), company("demo-h2", "Horizonte Comercial", "PLAN_1", 52, 2.12),
      company("demo-h3", "Horizonte Logística", "PLAN_3", 184, 20), company("demo-h4", "Horizonte Industrial", "PLAN_3", 216, 12),
      company("demo-h5", "Horizonte Salud", "PLAN_3", 94, 7), company("demo-h6", "Horizonte Operaciones", "PLAN_3", 122, 4.5),
    ] },
    { id: "demo-client-2", ownerId: "demo-owner-2", ownerName: "Grupo Andino", email: "administracion@andino.example", quantities: { PLAN_1: 0, PLAN_2: 2, PLAN_3: 0 }, extraStorageGB: 3, companies: [
      company("demo-a1", "Andino Norte", "PLAN_2", 86, 10), company("demo-a2", "Andino Sur", "PLAN_2", 104, 4.25),
    ] },
  ] }
}
