import type { Module } from "@/types/manager/module"

export function activeParentModuleIds(assigned: Module[], catalog: Module[]): string[] {
  const parents = new Set(catalog.filter(module => module.parentId === null).map(module => module.id))
  return [...new Set(assigned.filter(module => parents.has(module.id)).map(module => module.id))]
}
