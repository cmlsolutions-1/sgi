import { apiFetch } from "@/lib/apiClient"
import { listWorkAreas } from "@/services/workAreaService"
import type { JobsPage } from "@/types/manager/job"
import type { EmployeeImportCatalogs, EmployeeImportResult, EmployeeImportRow } from "@/types/manager/employee-import"

async function readData<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.ok || !body.data) throw new Error(body?.message ?? "No se pudo procesar la importación")
  return body.data as T
}

export async function loadEmployeeImportCatalogs(): Promise<EmployeeImportCatalogs> {
  const areas = (await listWorkAreas()).filter(area => area.status === "ACTIVE")
  const jobs: EmployeeImportCatalogs["jobs"] = []
  const seen = new Set<string>()
  for (let page = 1; ; page++) {
    const data = await readData<JobsPage>(await apiFetch(`/api/jobs?page=${page}&limit=100`, { method: "GET" }))
    if (!Array.isArray(data.items) || !Number.isFinite(data.total)) throw new Error("No se pudo leer el catálogo completo de cargos")
    for (const job of data.items) {
      if (seen.has(job.id)) throw new Error("No se pudo paginar el catálogo de cargos")
      seen.add(job.id)
      if (job.status === "ACTIVE" && areas.some(area => area.id === job.workAreaId)) jobs.push(job)
    }
    if (seen.size >= data.total) break
    if (!data.items.length || page >= 100) throw new Error("No se pudo cargar el catálogo completo de cargos")
  }
  if (!areas.length || !jobs.length) throw new Error("Crea primero las áreas y los cargos activos de la empresa")
  return { areas, jobs }
}

export async function importEmployees(rows: EmployeeImportRow[], dryRun: boolean): Promise<EmployeeImportResult> {
  return readData<EmployeeImportResult>(await apiFetch("/api/employee/import", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dryRun, rows }),
  }))
}
