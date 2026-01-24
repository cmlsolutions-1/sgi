// components/dashboard/navigation.tsx
import type React from "react"
import {
  LayoutDashboard,
  Users,
  FileText,
  TriangleAlert,
  UserCircle,
  ShieldCheck,
  BrickWallIcon,
  CalendarDays,
  Brain,
  IdCardIcon,
  ShieldPlus,
  UsersRound,
} from "lucide-react"

// Definir tipos para los subitems de navegación
export type SubNavigationItem = {
  name: string
  href: string
  icon?: React.ElementType
}

// Definir tipos para los ítems de navegación principales
export type NavigationItem =
  | {
      name: string
      href: string
      icon: React.ElementType
      subItems?: never
    }
  | {
      name: string
      icon: React.ElementType
      subItems: SubNavigationItem[]
      href?: never
    }

// Sidebar source of truth
export const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Usuarios",
    icon: UsersRound,
    subItems: [
      { name: "Gestión de Usuarios", href: "/dashboard/users", icon: Users },
      { name: "Roles", href: "/dashboard/roles", icon: ShieldPlus },
    ],
  },
  {
    name: "Empleados",
    icon: IdCardIcon,
    subItems: [{ name: "Funcionarios", href: "/dashboard/employees", icon: UserCircle }],
  },
  { name: "Gestión Documental", href: "/dashboard/documents", icon: FileText },
  {
    name: "Planificación",
    icon: CalendarDays,
    subItems: [{ name: "Capacitaciones", href: "/dashboard/trainingPlan", icon: Brain }],
  },
  {
    name: "Riesgos",
    icon: TriangleAlert,
    subItems: [
      { name: "Laborales", href: "/dashboard/occupational", icon: BrickWallIcon },
      { name: "Medidas de Prevención", href: "/dashboard/preventiveMeasures", icon: ShieldCheck },
    ],
  },
]
