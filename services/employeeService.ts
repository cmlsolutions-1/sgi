import { apiFetch } from "@/lib/apiClient"
import type {
  CreateEmployeeDto,
  Employee,
  EmployeeCatalogOption,
  EmployeeCatalogResponse,
  EmployeeResponse,
  EmployeesResponse,
  UpdateEmployeeDto,
  UpdateEmployeeSocialSecurityDto,
} from "@/types/manager/employee"

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | EmployeeResponse
    | EmployeesResponse
    | EmployeeCatalogResponse
    | null

  if (!res.ok || !json?.ok) {
    throw new Error(json?.message ?? fallbackMsg)
  }

  return json.data as T
}

export async function createEmployee(dto: CreateEmployeeDto): Promise<Employee> {
  const res = await apiFetch("/api/employee", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Employee>(res, "No se pudo crear el funcionario")
}

export async function listEmployees(): Promise<Employee[]> {
  const res = await apiFetch("/api/employee", { method: "GET" })
  return parseOrThrow<Employee[]>(res, "No se pudo listar los funcionarios")
}

export async function getEmployeeById(id: string): Promise<Employee> {
  const res = await apiFetch(`/api/employee/${id}`, { method: "GET" })
  return parseOrThrow<Employee>(res, "No se pudo cargar el funcionario")
}

export async function updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
  const res = await apiFetch(`/api/employee/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Employee>(res, "No se pudo actualizar el funcionario")
}

export async function deleteEmployee(id: string): Promise<void> {
  const res = await apiFetch(`/api/employee/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el funcionario")
}

export async function updateEmployeeSocialSecurity(
  id: string,
  dto: UpdateEmployeeSocialSecurityDto,
): Promise<Employee> {
  const res = await apiFetch(`/api/employee/${id}/social-security`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Employee>(res, "No se pudo actualizar la seguridad social")
}

export async function activateEmployee(id: string): Promise<void> {
  const res = await apiFetch(`/api/employee/active/${id}`, { method: "PUT" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo activar el funcionario")
}

export async function listEpsCatalog(): Promise<EmployeeCatalogOption[]> {
  const res = await apiFetch("/api/employees/catalogs/eps", { method: "GET" })
  return parseOrThrow<EmployeeCatalogOption[]>(res, "No se pudo cargar el catalogo de EPS")
}

export async function listArlCatalog(): Promise<EmployeeCatalogOption[]> {
  const res = await apiFetch("/api/employees/catalogs/arl", { method: "GET" })
  return parseOrThrow<EmployeeCatalogOption[]>(res, "No se pudo cargar el catalogo de ARL")
}

export async function listPensionCatalog(): Promise<EmployeeCatalogOption[]> {
  const res = await apiFetch("/api/employees/catalogs/pensions", { method: "GET" })
  return parseOrThrow<EmployeeCatalogOption[]>(res, "No se pudo cargar el catalogo de pensiones")
}

export async function listCompensationCatalog(): Promise<EmployeeCatalogOption[]> {
  const res = await apiFetch("/api/employees/catalogs/compensations", { method: "GET" })
  return parseOrThrow<EmployeeCatalogOption[]>(res, "No se pudo cargar el catalogo de cajas de compensacion")
}
