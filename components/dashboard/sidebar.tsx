//components/dashboard/sidebar.tsx
"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { doLogout } from "@/lib/auth/logout";
import { filterNavigationByModules, navigation } from "./navigation"
import { getMyModules } from "@/services/modulesService";
import { useAuthStore } from "@/store/auth.store";


import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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


export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const modules = useAuthStore((s) => s.modules);
  const setModules = useAuthStore((s) => s.setModules);
  const visibleNavigation = useMemo(() => filterNavigationByModules(navigation, modules), [modules]);

  useEffect(() => {
    if (!accessToken || loggingOut) return;
    if (modules.length > 0) return;

    getMyModules()
      .then(setModules)
      .catch((error) => {
        console.warn("No se pudieron cargar los modulos del usuario:", error);
      });
  }, [accessToken, loggingOut, modules.length, setModules]);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const expandCollapsedSidebar = (dropdownName?: string) => {
    if (!collapsed) return false;
    setCollapsed(false);
    if (dropdownName) setOpenDropdown(dropdownName);
    return true;
  };

  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await doLogout();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-svh min-h-svh shrink-0 flex-col overflow-hidden bg-sidebar border-r border-sidebar-border transition-all duration-300",
        "hidden md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        <div className={cn("flex items-center gap-2", collapsed && "sr-only")}>
          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/5 shadow-sm">
            <Image src="/icono3sinfondo.png" alt="SafeCloud" fill priority className="object-cover" sizes="40px" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground">
              SafeCloud
            </span>
          )}
        </div>
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

      <nav className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1">
        {visibleNavigation.map((item) => {
          // Comprobar si el ítem tiene subItems (menú desplegable)
          if (item.subItems) {
            return (
              <div key={item.name}>
                <button
                  onClick={() => {
                    if (expandCollapsedSidebar(item.name)) return;
                    toggleDropdown(item.name);
                  }}
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
              onClick={(event) => {
                if (!expandCollapsedSidebar()) return;
                event.preventDefault();
              }}
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

      <div className="shrink-0 p-2 border-t border-sidebar-border space-y-1">
        {collapsed ? (
          <button
            type="button"
            onClick={() => expandCollapsedSidebar()}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            aria-label="Mostrar ajustes"
          >
            <Settings className="h-5 w-5 shrink-0" />
          </button>
        ) : (
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span>Ajustes</span>
          </Link>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            "flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "text-sidebar-foreground hover:bg-red-500 hover:text-sidebar-accent-foreground",
            loggingOut && "pointer-events-none opacity-60"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{loggingOut ? "Cerrando..." : "Cerrar sesión"}</span>}
        </button>
      </div>


    </aside>
  );
}

export function MobileSidebar({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const modules = useAuthStore((s) => s.modules);
  const setModules = useAuthStore((s) => s.setModules);
  const visibleNavigation = useMemo(() => filterNavigationByModules(navigation, modules), [modules]);

  useEffect(() => {
    if (!accessToken) return;
    if (modules.length > 0) return;

    getMyModules()
      .then(setModules)
      .catch((error) => {
        console.warn("No se pudieron cargar los modulos del usuario:", error);
      });
  }, [accessToken, modules.length, setModules]);

  const closeMenu = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(86vw,20rem)] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="border-b border-sidebar-border px-4 py-4 text-left">
          <SheetTitle className="flex items-center gap-3 text-sidebar-foreground">
            <span className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/5 shadow-sm">
              <Image src="/icono4sinfondo.png" alt="SafeCloud" fill priority className="object-cover" sizes="40px" />
            </span>
            <span>SafeCloud</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {visibleNavigation.map((item) => {
              if (item.subItems) {
                const isOpen = openDropdown === item.name;

                return (
                  <div key={item.name}>
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(isOpen ? null : item.name)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors",
                        isOpen
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
                    </button>

                    {isOpen && (
                      <div className="ml-5 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                        {item.subItems.map((subItem) => {
                          const isSubActive = pathname === subItem.href;

                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={closeMenu}
                              className={cn(
                                "flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isSubActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              {subItem.icon && <subItem.icon className="h-4 w-4 shrink-0" />}
                              <span className="truncate">{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex min-w-0 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/dashboard/settings"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span>Ajustes</span>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
