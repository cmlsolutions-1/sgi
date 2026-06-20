// components/dashboard/navigation.tsx
import type React from "react"
import {
  LayoutDashboard,
  Users,
  FileText,
  FileStack,
  TriangleAlert,
  UserCircle,
  ShieldCheck,
  BrickWallIcon,
  CalendarDays,
  Brain,
  BriefcaseBusiness,
  IdCardIcon,
  ShieldPlus,
  UsersRound,
} from "lucide-react"
import type { ModuleNode } from "@/store/auth.store"

export type SubNavigationItem = {
  code?: string
  name: string
  href: string
  icon?: React.ElementType
}

export type NavigationLinkItem = {
  code?: string
  name: string
  href: string
  icon: React.ElementType
  subItems?: never
}

export type NavigationGroupItem = {
  code?: string
  name: string
  icon: React.ElementType
  subItems: SubNavigationItem[]
  href?: never
}

export type NavigationItem = NavigationLinkItem | NavigationGroupItem

function hasSubItems(item: NavigationItem): item is NavigationGroupItem {
  return Array.isArray(item.subItems)
}

export const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    code: "USERS",
    name: "Usuarios",
    icon: UsersRound,
    subItems: [
      { code: "USER_MANAGEMENT", name: "Gestión de Usuarios", href: "/dashboard/users", icon: Users },
      { code: "ROLES", name: "Roles", href: "/dashboard/roles", icon: ShieldPlus },
    ],
  },
  {
    code: "EMPLOYEE",
    name: "Empleados",
    icon: IdCardIcon,
    subItems: [
      { code: "EMPLOYEE_MANAGEMENT", name: "Gestión Empleados", href: "/dashboard/employees", icon: UserCircle },
      { code: "WORKAREA", name: "Áreas de trabajo", href: "/dashboard/work-areas", icon: Users },
      { code: "JOBS", name: "Puestos de trabajo", href: "/dashboard/jobs", icon: BriefcaseBusiness },
      { code: "INCIDENTS", name: "Novedades Laborales", href: "/dashboard/incidents", icon: TriangleAlert },
    ],
  },
  
  {
    code: "PLANNING",
    name: "Planificacion",
    icon: CalendarDays,
    subItems: [
      { code: "TRAINING", name: "Capacitaciones", href: "/dashboard/trainingPlan", icon: Brain },
    ],
  },
  {
    code: "RISKS",
    name: "Riesgos",
    icon: TriangleAlert,
    subItems: [
      { code: "LABOR", name: "Laborales", href: "/dashboard/occupational", icon: BrickWallIcon },
      {
        code: "PREVENTIVE_MEASURES",
        name: "Medidas de Prevencion",
        href: "/dashboard/preventiveMeasures",
        icon: ShieldCheck,
      },
    ],
  },
  { 
    code: "GESTION_DOCUMENTAL", 
    name: "Gestion Documental", 
    icon: FileStack,
    subItems: [
      {
        code: "DOCUMENTS",
        name: "Documentos",
        href: "/dashboard/documents",
        icon: FileText,
      },
    ],
    },
]

function collectModuleCodes(modules: ModuleNode[]): Set<string> {
  const codes = new Set<string>()

  for (const module of modules) {
    codes.add(module.code)

    if (module.children?.length) {
      for (const childCode of collectModuleCodes(module.children)) {
        codes.add(childCode)
      }
    }
  }

  return codes
}

const alwaysVisibleCodes = new Set<string>()

const moduleCodeAliases: Record<string, string[]> = {
  DOCUMENTS: ["DOCUMENTS", "DOCUMENT", "DOCUMENT_MANAGEMENT", "DOCUMENTAL_MANAGEMENT"],
  INCIDENTS: ["INCIDENTS", "LABOR"],
}

function isCodeAllowed(code: string, allowedCodes: Set<string>) {
  if (alwaysVisibleCodes.has(code)) return true

  const aliases = moduleCodeAliases[code] ?? [code]
  return aliases.some((alias) => allowedCodes.has(alias))
}

function findModulesByCode(modules: ModuleNode[], code: string): ModuleNode[] {
  const matches: ModuleNode[] = []
  const aliases = moduleCodeAliases[code] ?? [code]

  for (const module of modules) {
    if (aliases.includes(module.code)) {
      matches.push(module)
    }

    if (module.children?.length) {
      matches.push(...findModulesByCode(module.children, code))
    }
  }

  return matches
}

function getDirectChildCodesByParentCode(modules: ModuleNode[], parentCode: string): Set<string> {
  const codes = new Set<string>()
  const parents = findModulesByCode(modules, parentCode)

  parents.forEach((parent) => {
    parent.children?.forEach((child) => codes.add(child.code))
  })

  return codes
}

function isSubItemAllowed(
  parentCode: string | undefined,
  subItem: SubNavigationItem,
  modules: ModuleNode[],
  allowedCodes: Set<string>,
) {
  if (!subItem.code) return true
  if (alwaysVisibleCodes.has(subItem.code)) return true
  if (!parentCode) return isCodeAllowed(subItem.code, allowedCodes)

  const parentChildCodes = getDirectChildCodesByParentCode(modules, parentCode)

  if (parentChildCodes.size === 0) {
    return isCodeAllowed(subItem.code, allowedCodes)
  }

  const aliases = moduleCodeAliases[subItem.code] ?? [subItem.code]
  return aliases.some((alias) => parentChildCodes.has(alias))
}

export function filterNavigationByModules(items: NavigationItem[], modules: ModuleNode[]): NavigationItem[] {
  const allowedCodes = collectModuleCodes(modules)

  return items.reduce<NavigationItem[]>((filteredItems, item) => {
    if (!item.code) {
      filteredItems.push(item)
      return filteredItems
    }

    if (hasSubItems(item)) {
      const subItems = item.subItems.filter((subItem) => isSubItemAllowed(item.code, subItem, modules, allowedCodes))

      if (subItems.length > 0) {
        filteredItems.push({ ...item, subItems })
      }

      return filteredItems
    }

    if (isCodeAllowed(item.code, allowedCodes)) {
      filteredItems.push(item)
    }

    return filteredItems
  }, [])
}

export function getFirstAllowedNavigationHref(modules: ModuleNode[]): string {
  const [firstItem] = filterNavigationByModules(navigation, modules)

  if (!firstItem) return "/dashboard"
  if (!hasSubItems(firstItem)) return firstItem.href

  return firstItem.subItems[0]?.href ?? "/dashboard"
}

export function isDashboardPathAllowed(pathname: string, modules: ModuleNode[]): boolean {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/settings")) {
    return true
  }

  const items = filterNavigationByModules(navigation, modules)

  return items.some((item) => {
    if (!hasSubItems(item)) {
      return pathname === item.href || pathname.startsWith(`${item.href}/`)
    }

    return item.subItems.some((subItem) => pathname === subItem.href || pathname.startsWith(`${subItem.href}/`))
  })
}
