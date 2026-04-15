// services/roleService.ts
import { apiFetch } from "@/lib/apiClient"
import type {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponse,
  RolesResponse,
} from "@/types/manager/role"

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as RoleResponse | RolesResponse | null

  if (!res.ok || !json?.ok) {
    const msg = json?.message ?? fallbackMsg
    throw new Error(msg)
  }

  return json.data as T
}

/**
 * Listar todos los roles
 * GET /api/role
 */
export async function listRoles(): Promise<Role[]> {
  const res = await apiFetch("/api/role", { method: "GET" })
  return parseOrThrow<Role[]>(res, "No se pudo listar los roles")
}

/**
 * Obtener rol por ID
 * GET /api/role/{id}
 */
export async function getRoleById(id: string): Promise<Role> {
  const res = await apiFetch(`/api/role/${id}`, { method: "GET" })
  return parseOrThrow<Role>(res, "No se pudo cargar el rol")
}

/**
 * Crear nuevo rol
 * POST /api/role
 */
export async function createRole(dto: CreateRoleDto): Promise<Role> {
  const res = await apiFetch("/api/role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Role>(res, "No se pudo crear el rol")
}

/**
 * Actualizar rol por ID
 * PUT /api/role/{id}
 */
export async function updateRole(id: string, dto: UpdateRoleDto): Promise<void> {
  const res = await apiFetch(`/api/role/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  await parseOrThrow<Record<string, never>>(res, "No se pudo actualizar el rol")
}

/**
 * Eliminar rol por ID
 * DELETE /api/role/{id}
 */
export async function deleteRole(id: string): Promise<void> {
  const res = await apiFetch(`/api/role/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el rol")
}