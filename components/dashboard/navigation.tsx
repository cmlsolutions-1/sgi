// components/dashboard/navigation.tsx
import type React from "react"
import {
  LayoutDashboard,
  Users,
  FileText,
  FileCheck2,
  FileStack,
  FileSearch,
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
  ClipboardCheck,
  Fingerprint,
  PackageCheck,
  SprayCan,
  Bug,
  FlameKindling,
  GraduationCap,
  Target,
  ClipboardList,
  BarChart3,
  Archive,
  Droplets,
  Recycle,
  FlaskConical,
  HeartPulse,
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
      { code: "WORKAREA", name: "Áreas de trabajo", href: "/dashboard/work-areas", icon: Users },
      { code: "JOBS", name: "Cargos", href: "/dashboard/jobs", icon: BriefcaseBusiness },
      { code: "EMPLOYEE_MANAGEMENT", name: "Gestión Empleados", href: "/dashboard/employees", icon: UserCircle },
      { code: "INCIDENTS", name: "Novedades Laborales", href: "/dashboard/incidents", icon: TriangleAlert },
      //{ code: "EMPLOYEE_ANALYTICS", name: "Estadísticas y Análisis", href: "/dashboard/employee-analytics", icon: BarChart3 },
      //{ code: "CUSTODY", name: "Custodia", href: "/dashboard/custody", icon: Archive },
      //{ code: "INVESTIGATIONS", name: "Investigaciones", href: "/dashboard/investigations", icon: FileSearch },
      //{ code: "SPECIAL_RISK", name: "Riesgo Especial", href: "/dashboard/special-risk", icon: FlameKindling },
      { code: "DATA_AUTHORIZATIONS", name: "Tratamiento de Datos", href: "/dashboard/data-processing", icon: Fingerprint},
    ],
  },
  {
    code: "SG_SST",
    name: "Gestion del SG-SST",
    icon: ClipboardCheck,
    subItems: [
      {
        code: "SGI_RESPONSIBLE",
        name: "Responsable SG-SST",
        href: "/dashboard/sgi-responsible",
        icon: ShieldCheck,
      },
      {
        code: "ACPM",
        name: "ACPM",
        href: "/dashboard/acpm",
        icon: FileCheck2,
      },
      /* {
        code: "SST_INDICATORS",
        name: "Indicadores SST",
        href: "/dashboard/sst-indicators",
        icon: BarChart3,
      }, */
      /* {
        code: "SST_AUDITS",
        name: "Auditorías SST",
        href: "/dashboard/audits",
        icon: FileSearch,
      }, */
      /* {
        code: "SST_COMMUNICATIONS",
        name: "Comunicaciones SST",
        href: "/dashboard/sst-communications",
        icon: MessageSquare,
      }, */
      /* {
        code: "SST_TRAINING_CERTIFICATIONS",
        name: "Formación y Certificaciones",
        href: "/dashboard/sst-training-certifications",
        icon: GraduationCap,
      }, */
      /* {
        code: "SST_OBJECTIVES",
        name: "Objetivos SST",
        href: "/dashboard/sst-objectives",
        icon: Target,
      }, */
      /* {
        code: "INITIAL_EVALUATION",
        name: "Evaluación Inicial",
        href: "/dashboard/initial-evaluation",
        icon: ClipboardList,
      },
      {
        code: "ACCOUNTABILITY",
        name: "Rendición de Cuentas",
        href: "/dashboard/accountability",
        icon: BarChart3,
      }, */
    ],
  },
  {
    code: "PLANNING",
    name: "Planificacion",
    icon: CalendarDays,
    subItems: [
      { code: "TRAINING", name: "Capacitaciones", href: "/dashboard/trainingPlan", icon: Brain },
      //{ code: "WORK_PLAN", name: "Plan de Trabajo", href: "/dashboard/work-plan", icon: ClipboardCheck },
      //{ code: "HEALTHY_LIFESTYLES", name: "Estilos de Vida Saludable", href: "/dashboard/healthy-lifestyles", icon: HeartPulse },
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
      {
        code: "PREVENTIVE_MAINTENANCE",
        name: "Mantenimiento Preventivo",
        href: "/dashboard/preventive-maintenance",
        icon: ClipboardCheck,
      },
      /* {
        code: "HAZARDOUS_SUBSTANCES",
        name: "Sustancias Peligrosas",
        href: "/dashboard/hazardous-substances",
        icon: FlaskConical,
      }, */
      /* {
        code: "ENVIRONMENTAL_MEASUREMENTS",
        name: "Mediciones Ambientales",
        href: "/dashboard/environmental-measurements",
        icon: BarChart3,
      }, */
      /* {
        code: "INSPECTIONS",
        name: "Inspecciones",
        href: "/dashboard/inspections",
        icon: ClipboardCheck,
      }, */
      /* {
        code: "LEGAL_MATRIX",
        name: "Matriz Legal",
        href: "/dashboard/legal-matrix",
        icon: ScrollText,
      }, */
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
  {
    code: "COMMITTEE",
    name: "Comités",
    icon: UsersRound,
    subItems: [
      {
        code: "COMMITTEE_MANAGEMENT",
        name: "Gestión de Comités",
        href: "/dashboard/committee-management",
        icon: ClipboardCheck,
      },
      {
        code: "MEETINGS",
        name: "Reuniones",
        href: "/dashboard/meetings",
        icon: CalendarDays,
      },
    ],
  },
  {
    code: "EMERGENCY_PLAN",
    name: "Plan Emergencias",
    icon: TriangleAlert,
    subItems: [
      {
        code: "EMERGENCY_MANAGEMENT",
        name: "Gestión de Emergencias",
        href: "/dashboard/emergency-management",
        icon: ClipboardCheck,
      },
      {
        code: "EMERGENCY_BRIGADE",
        name: "Brigada de Emergencias",
        href: "/dashboard/emergency-brigades",
        icon: UsersRound,
      },
    ],
  },
  {
    code: "SANITARY_MANAGEMENT",
    name: "Gestión Sanitaria",
    icon: SprayCan,
    subItems: [
      {
        code: "HYGIENE_SUPPLIES",
        name: "Insumos de higiene",
        href: "/dashboard/hygiene-supplies",
        icon: PackageCheck,
      },
      /* {
        code: "HYGIENE_SERVICES",
        name: "Servicios de Higiene",
        href: "/dashboard/hygiene-services",
        icon: Droplets,
      }, */
      /* {
        code: "WASTE_MANAGEMENT",
        name: "Manejo de Residuos",
        href: "/dashboard/waste-management",
        icon: Recycle,
      }, */
      {
        code: "SANITATION",
        name: "Saneamiento",
        href: "/dashboard/sanitation",
        icon: SprayCan,
      },
      {
        code: "PEST_CONTROL",
        name: "Control de plagas",
        href: "/dashboard/pest-control",
        icon: Bug,
      },
    ],
  },
  /* {
    code: "DATA_PROCESSING",
    name: "Tratamiento de Datos",
    icon: Fingerprint,
    subItems: [
      {
        code: "DATA_AUTHORIZATIONS",
        name: "Autorizaciones",
        href: "/dashboard/data-processing",
        icon: Fingerprint,
      },
    ],
  }, */
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

const alwaysVisibleCodes = new Set<string>(["DATA_PROCESSING", "DATA_AUTHORIZATIONS"])

const moduleCodeAliases: Record<string, string[]> = {
  DOCUMENTS: ["DOCUMENTS", "DOCUMENT", "DOCUMENT_MANAGEMENT", "DOCUMENTAL_MANAGEMENT"],
  INCIDENTS: ["INCIDENTS", "LABOR"],
  DATA_PROCESSING: ["DATA_PROCESSING", "DATA_CONSENT", "PERSONAL_DATA", "PERSONAL_DATA_PROCESSING"],
  DATA_AUTHORIZATIONS: [
    "DATA_AUTHORIZATIONS",
    "DATA_PROCESSING",
    "DATA_CONSENT",
    "PERSONAL_DATA",
    "PERSONAL_DATA_AUTHORIZATIONS",
  ],
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
  if (subItem.code === "INVESTIGATIONS" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "SPECIAL_RISK" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "CUSTODY" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "EMPLOYEE_ANALYTICS" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "SST_TRAINING_CERTIFICATIONS" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "SST_OBJECTIVES" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "SST_INDICATORS" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "SST_AUDITS" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "INITIAL_EVALUATION" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "ACCOUNTABILITY" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "LEGAL_MATRIX" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "SST_COMMUNICATIONS" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "HEALTHY_LIFESTYLES" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "HYGIENE_SERVICES" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "WASTE_MANAGEMENT" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "HAZARDOUS_SUBSTANCES" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "ENVIRONMENTAL_MEASUREMENTS" && isCodeAllowed(parentCode, allowedCodes)) return true
  if (subItem.code === "INSPECTIONS" && isCodeAllowed(parentCode, allowedCodes)) return true

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
