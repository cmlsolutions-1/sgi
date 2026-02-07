// lib/modules.ts
import type { NavigationItem } from "@/components/dashboard/navigation"
import { navigation } from "@/components/dashboard/navigation"

// aaquí icon NO es ReactNode, es el componente (ElementType)
export type Module = {
  id: string
  name: string
  icon: NavigationItem["icon"]
  description: string
}

const MODULE_ID_BY_NAME: Record<string, string> = {
  Dashboard: "dashboard",
  Usuarios: "usuarios",
  Empleados: "empleados",
  "Gestión Documental": "gestion-documental",
  Planificación: "planificacion",
  Riesgos: "riesgos",
}

const MODULE_DESCRIPTION_BY_ID: Record<string, string> = {
  dashboard: "Vista general y métricas",
  usuarios: "Gestión de usuarios, roles y permisos",
  empleados: "Control de empleados y funcionarios",
  "gestion-documental": "Almacenamiento y organización de documentos",
  planificacion: "Planificación de capacitaciones y tareas",
  riesgos: "Gestión de riesgos y medidas preventivas",
}

// ✅ EXPORTA la función
export function getModulesFromSidebar(): Module[] {
  const TOP_LEVEL = navigation.filter((n) => n.name !== "Dashboard")

  return TOP_LEVEL.map((item) => {
    const id = MODULE_ID_BY_NAME[item.name]
    if (!id) throw new Error(`Falta mapear MODULE_ID_BY_NAME para el módulo: ${item.name}`)

    return {
      id,
      name: item.name,
      icon: item.icon, // 👈 guardamos el componente, no JSX
      description: MODULE_DESCRIPTION_BY_ID[id] ?? "Módulo del sistema",
    }
  })
}
