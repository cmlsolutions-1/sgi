// services/permissionService.ts
import { apiFetch } from "@/lib/apiClient"
import type { Permission, PermissionsResponse } from "@/types/manager/permission"

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as PermissionsResponse | null

  if (!res.ok || !json?.ok) {
    const msg = json?.message ?? fallbackMsg
    throw new Error(msg)
  }

  return json.data as T
}

/**
 * Listar todos los permisos
 * GET /api/permissions
 */
export async function listPermissions(): Promise<Permission[]> {
  const res = await apiFetch("/api/permissions", { method: "GET" })
  return parseOrThrow<Permission[]>(res, "No se pudo listar los permisos")
}

/**
 * Listar permisos del usuario de la compañía
 * GET /api/permissions/get_by_company_user
 */
export async function getPermissionsByCompanyUser(): Promise<Permission[]> {
  const res = await apiFetch("/api/permissions/get_by_company_user", { method: "GET" })
  return parseOrThrow<Permission[]>(res, "No se pudo cargar los permisos")
}