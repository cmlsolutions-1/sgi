// services/modulesService.ts
import { apiFetch } from "@/lib/apiClient"
import type { Module, ModulesResponse } from "@/types/manager/module"

// Tipo para módulos del usuario (login)
export type ModuleNode = {
  id: string
  code: string
  name: string
  route: string
  index: number
  parentId: string | null
  children?: ModuleNode[]
}

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as ModulesResponse | null

  if (!res.ok || !json?.ok) {
    const msg = json?.message ?? fallbackMsg
    throw new Error(msg)
  }

  return json.data as T
}

/**
 * Obtener módulos del usuario autenticado
 * GET /api/modules/me
 * ✅ Usado en login/page.tsx
 */
export async function getMyModules(): Promise<ModuleNode[]> {
  const res = await apiFetch("/api/modules/me", { method: "GET" })
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(json?.message ?? "No se pudo cargar módulos")
  }

  return (json?.data ?? []) as ModuleNode[]
}

/**
 * Listar todos los módulos disponibles (admin)
 * GET /api/admin/modules
 */
export async function listModules(): Promise<Module[]> {
  const res = await apiFetch("/api/admin/modules", { method: "GET" })
  return parseOrThrow<Module[]>(res, "No se pudo listar los módulos")
}

/**
 * Obtener módulos activos de una empresa
 * GET /api/modules/modules_by_company/{companyId}
 */
export async function getModulesByCompany(companyId: string): Promise<Module[]> {
  const res = await apiFetch(`/api/modules/modules_by_company/${companyId}`, { method: "GET" })
  return parseOrThrow<Module[]>(res, "No se pudo cargar los módulos de la empresa")
}

/**
 * Activar módulo para una empresa
 * PUT /api/companies/{companyId}/modules/{moduleId}/activate
 */
export async function activateModule(companyId: string, moduleId: string): Promise<void> {
  const res = await apiFetch(`/api/companies/${companyId}/modules/${moduleId}/activate`, {
    method: "PUT",
  })
  await parseOrThrow<Record<string, never>>(res, "No se pudo activar el módulo")
}

/**
 * Desactivar módulo para una empresa
 * PUT /api/companies/{companyId}/modules/{moduleId}/deactivate
 */
export async function deactivateModule(companyId: string, moduleId: string): Promise<void> {
  const res = await apiFetch(`/api/companies/${companyId}/modules/${moduleId}/deactivate`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "Desactivado desde el panel de super administrador" }),
  })
  await parseOrThrow<Record<string, never>>(res, "No se pudo desactivar el módulo")
}

type BulkModulesResponse = {
  companyId: string
  activeModuleIds: string[]
}

/**
 * Reemplazar los mÃ³dulos activos de una empresa
 * PUT /api/companies/{companyId}/modules/bulk
 */
export async function updateCompanyModules(
  companyId: string,
  moduleIds: string[],
  deactivationReason = "Actualizado desde el panel de super administrador"
): Promise<string[]> {
  console.log("Actualizando modulos de empresa:", { companyId, moduleIds })

  const res = await apiFetch(`/api/companies/${companyId}/modules/bulk`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      moduleIds,
      deactivationReason,
    }),
  })

  const data = await parseOrThrow<BulkModulesResponse>(res, "No se pudo actualizar los mÃ³dulos")
  console.log("Modulos actualizados por backend:", data.activeModuleIds)
  return data.activeModuleIds ?? moduleIds
}

/**
 * Sincronizar permisos del rol ADMIN_COMPANY con los módulos activos de la empresa
 * POST /api/admin/companies/{companyId}/admin-company/sync-permissions
 */
export async function syncAdminCompanyPermissions(companyId: string): Promise<void> {
  const res = await apiFetch(`/api/admin/companies/${companyId}/admin-company/sync-permissions`, {
    method: "POST",
  })

  await parseOrThrow<Record<string, never>>(res, "No se pudieron sincronizar los permisos de ADMIN_COMPANY")
}
