// services/userService.ts
import { apiFetch } from "@/lib/apiClient";
import type {
  User,
  CreateCompanyAdminDto,
  CreateUserDto,
  UpdateUserDto,
  UserResponse,
  UsersResponse,
  CreateCompanyAdminApiResponse,
  CreateCompanyAdminResponse,
} from "@/types/manager/user";

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as UserResponse | UsersResponse | CreateCompanyAdminApiResponse | null;

  if (!res.ok || !json?.ok) {
    const msg = json?.message ?? fallbackMsg;
    throw new Error(msg);
  }

  return json.data as T;
}

/**
 * Listar usuarios (opcionalmente filtrar por companyId)
 * GET /api/user?companyId={id}
 */
export async function listUsers(companyId?: string): Promise<User[]> {
  const url = companyId ? `/api/user?companyId=${companyId}` : "/api/user"
  const res = await apiFetch(url, { method: "GET" })
  return parseOrThrow<User[]>(res, "No se pudo listar los usuarios")
}


/**
 * Obtener usuario por ID
 */
export async function getUserById(id: string): Promise<User> {
  const res = await apiFetch(`/api/user/${id}`, { method: "GET" });
  return parseOrThrow<User>(res, "No se pudo cargar el usuario");
}

/**
 * Crear nuevo usuario
 */
export async function createUser(dto: CreateUserDto): Promise<User> {
  const res = await apiFetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseOrThrow<User>(res, "No se pudo crear el usuario");
}

/**
 * Crear usuario administrador de empresa
 * POST /api/admin/companies/{companyId}/company-admin
 */
export async function createCompanyAdmin(
  companyId: string,
    dto: CreateCompanyAdminDto
  ): Promise<CreateCompanyAdminResponse> {
    const res = await apiFetch(`/api/admin/companies/${companyId}/company-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    })
    return parseOrThrow<CreateCompanyAdminResponse>(res, "No se pudo crear el usuario")
  }

/**
 * Actualizar usuario por ID
 */
export async function updateUser(id: string, dto: UpdateUserDto): Promise<void> {
  const res = await apiFetch(`/api/user/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  await parseOrThrow<Record<string, never>>(res, "No se pudo actualizar el usuario");
}

/**
 * Eliminar usuario por ID
 */
export async function deleteUser(id: string): Promise<void> {
  const res = await apiFetch(`/api/user/${id}`, { method: "DELETE" });
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el usuario");
}