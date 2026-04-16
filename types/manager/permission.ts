// types/manager/permission.ts
import type { ApiResponse } from "./company"

export type Permission = {
  id: string
  name: string
  key?: string
  description?: string
}

export type PermissionsResponse = ApiResponse<Permission[]>