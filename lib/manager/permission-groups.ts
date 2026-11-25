import type { Module } from "@/types/manager/module"
import type { Permission } from "@/types/manager/permission"
import legacyNames from "./legacy-permission-modules.json"

// The legacy endpoint exposes only id/name. These exact backend seed names are
// display metadata, never an authorization decision or a source of permission IDs.
const legacyModules = new Map(Object.entries(legacyNames))
export function groupCompanyPermissions(permissions: Permission[], catalog: Module[]) {
  const parents = catalog.filter(module => module.parentId === null).sort((a, b) => a.index - b.index)
  const children = parents.flatMap(parent => (parent.children ?? []).map(child => ({ parent, child })))
  const groups = parents.map(parent => ({ parent, children: (parent.children ?? []).map(child => ({ child, permissions: [] as Permission[] })).sort((a, b) => a.child.index - b.child.index) }))
  const unknown: Permission[] = []
  for (const permission of permissions) {
    const id = permission.moduleId ?? permission.module?.id
    const code = permission.moduleCode ?? permission.module?.code
    const legacyCode = legacyModules.get(permission.name)
    const target = id ? children.find(item => item.child.id === id) : children.find(item => item.child.code === (code ?? legacyCode))
    if (!target) { unknown.push(permission); continue }
    groups.find(group => group.parent.id === target.parent.id)!.children.find(group => group.child.id === target.child.id)!.permissions.push(permission)
  }
  const sort = (items: Permission[]) => items.sort((a, b) => a.name.localeCompare(b.name, "es"))
  groups.forEach(group => group.children.forEach(child => sort(child.permissions)))
  return { groups: groups.filter(group => group.children.some(child => child.permissions.length)), unknown: sort(unknown) }
}

export function selectedInactiveParentPermissions(permissions: Permission[], catalog: Module[], activeParentIds: string[], selectedIds: string[]): Permission[] {
  const selected = new Set(selectedIds), active = new Set(activeParentIds)
  return groupCompanyPermissions(permissions, catalog).groups
    .filter(group => !active.has(group.parent.id))
    .flatMap(group => group.children.flatMap(child => child.permissions))
    .filter(permission => selected.has(permission.id))
}
