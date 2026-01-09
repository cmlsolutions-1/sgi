//src/components/dashboard/sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  TriangleAlert,
  UserCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ChevronDown,
  ShieldCheck,
  BrickWallIcon,
  CalendarDays,
  Brain,
  IdCardIcon,
  ShieldPlus,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";

// Definir tipos para los subitems de navegación
type SubNavigationItem = {
  name: string;
  href: string;
  icon?: React.ElementType; // El ícono es opcional para subitems
};

// Definir tipos para los ítems de navegación principales
type NavigationItem =
  | {
      name: string;
      href: string; // Obligatorio para ítems normales
      icon: React.ElementType; // Obligatorio para ítems normales
      subItems?: never; // No tiene subItems
    }
  | {
      name: string;
      icon: React.ElementType; // Obligatorio para ítems con subItems
      subItems: SubNavigationItem[]; // Ahora es de tipo SubNavigationItem[]
      href?: never; // No tiene href
    };

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Usuarios",
    icon: UsersRound,
    subItems: [
      { name: "Gestión de Usuarios", href: "/dashboard/users", icon: Users },
      { name: "Roles", href: "/dashboard/roles", icon: ShieldPlus},
    ],
  },
  {
    name: "Empleados",
    icon: IdCardIcon,
    subItems: [
      { name: "Funcionarios", href: "/dashboard/employees", icon: UserCircle }, 
    ],
  },

  // { name: "Roles", href: "/dashboard/roles", icon: Shield }, // Puedes mover esta línea a subItems si lo deseas
  { name: "Gestión Documental", href: "/dashboard/documents", icon: FileText },
  //{ name: "Cargar Archivos", href: "/dashboard/upload", icon: Upload },
  //{ name: "Funcionarios", href: "/dashboard/employees", icon: UserCircle },
  //{ name: "Auditorías", href: "/dashboard/audits", icon: ClipboardCheck },
  {
    name: "Planificación",
    icon: CalendarDays,
    subItems: [
      { name: "Capacitaciones", href: "/dashboard/trainingPlan", icon: Brain }, 
      { name: "Plan de Trabajo", href: "/dashboard/workingPlan", icon: ClipboardCheck },
    ],
  },
  {
    name: "Riesgos",
    icon: TriangleAlert,
    subItems: [
      { name: "Laborales", href: "/dashboard/ocupational", icon: BrickWallIcon },
      { name: "Medidas de Prevención", href: "/dashboard/preventiveMeasures", icon: ShieldCheck },
    ],
  },

  
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                SGC
              </span>
            </div>
            <span className="font-semibold text-sidebar-foreground">
              SafeCloud
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navigation.map((item) => {
          // Comprobar si el ítem tiene subItems (menú desplegable)
          if (item.subItems) {
            return (
              <div key={item.name}>
                <button
                  onClick={() => !collapsed && toggleDropdown(item.name)}
                  className={cn(
                    "flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    openDropdown === item.name
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        openDropdown === item.name ? "rotate-180" : ""
                      )}
                    />
                  )}
                </button>

                {!collapsed && openDropdown === item.name && (
                  <div className="ml-8 mt-1 space-y-1 pl-2 border-l border-sidebar-border">
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", // Ajusté el padding horizontal
                            isSubActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          {/* Renderizado condicional del ícono del subitem */}
                          {subItem.icon && (
                            <subItem.icon className="h-4 w-4 shrink-0" /> // Tamaño un poco más pequeño
                          )}
                          {!collapsed && <span>{subItem.name}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Si no tiene subItems, es un ítem normal con href
          // TypeScript ahora sabe que item.href existe gracias a la verificación anterior
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Configuración</span>}
        </Link>
      </div>
    </aside>
  );
}
