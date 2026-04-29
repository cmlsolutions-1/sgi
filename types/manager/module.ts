// types/manager/module.ts
import type { ApiResponse } from "./company"

export type ModuleChild = {
  id: string
  code: string
  name: string
  route: string
  index: number
  parentId: string
}

export type Module = {
  id: string
  code: string
  name: string
  route: string
  index: number
  parentId: string | null
  children: ModuleChild[]
}

export type ModulesResponse = ApiResponse<Module[]>