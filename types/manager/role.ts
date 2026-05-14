// types/manager/role.ts
import type { ApiResponse } from "./company"

export type RoleStatus = "ACTIVE" | "INACTIVE"

export type Role = {
  id: string
  name: string
  description?: string
  status: RoleStatus
  permissions: Array<string | { id?: string; name?: string }>
}

export type CreateRoleDto = {
  name: string
  description: string
  permissionIds: string[]
}

export type UpdateRoleDto = Partial<CreateRoleDto>

export type RoleResponse = ApiResponse<Role>
export type RolesResponse = ApiResponse<Role[]>
