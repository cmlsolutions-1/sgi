"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  BellRing,
  CheckCheck,
  ChevronRight,
  GraduationCap,
  Inbox,
  Loader2,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  UserCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { doLogout } from "@/lib/auth/logout"
import { decodeJwt, tokenHasRole } from "@/lib/jwt"
import { useAuthStore } from "@/store/auth.store"
import {
  getUnreadNotificationsCount,
  listAllNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notificationService"
import { getUserById } from "@/services/userService"
import type { NotificationItem, NotificationReferenceType, NotificationType } from "@/types/manager/notification"
import { MobileSidebar } from "@/components/dashboard/sidebar"

const NOTIFICATION_REFRESH_INTERVAL_MS = 15_000

const notificationTypeLabels: Record<NotificationType, string> = {
  TRAINING_CREATED: "Capacitación creada",
  TRAINING_REMINDER: "Recordatorio de capacitación",
  PREVENTIVE_MEASURE_REMINDER: "Medida de prevención",
}

const referenceTypeLabels: Record<NotificationReferenceType, string> = {
  TRAINING: "Capacitaciones",
  PREVENTIVE_MEASURE: "Medidas de prevención",
}

const referenceRoutes: Record<NotificationReferenceType, string> = {
  TRAINING: "/dashboard/trainingPlan",
  PREVENTIVE_MEASURE: "/dashboard/preventiveMeasures",
}

function formatNotificationDate(value: string | null) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(date)
}

function NotificationTypeIcon({ type }: { type: NotificationType }) {
  if (type === "PREVENTIVE_MEASURE_REMINDER") {
    return <ShieldCheck className="h-4 w-4" />
  }

  return <GraduationCap className="h-4 w-4" />
}

function notificationTone(type: NotificationType) {
  return type === "PREVENTIVE_MEASURE_REMINDER"
    ? "bg-amber-50 text-amber-700 ring-amber-100"
    : "bg-blue-50 text-blue-700 ring-blue-100"
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US"
  )
}

export function Header() {
  const router = useRouter()
  const accessToken = useAuthStore((state) => state.accessToken)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [readingId, setReadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notificationFilter, setNotificationFilter] = useState<"all" | "unread">("all")
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ name: string; email?: string; roleLabel: string }>({
    name: "Usuario",
    roleLabel: "Usuario",
  })

  const hasUnread = unreadCount > 0
  const unreadLabel = useMemo(() => (unreadCount > 99 ? "99+" : String(unreadCount)), [unreadCount])
  const visibleNotifications = useMemo(
    () => notificationFilter === "unread" ? items.filter((item) => !item.isRead) : items,
    [items, notificationFilter],
  )

  useEffect(() => {
    if (!hasHydrated || !accessToken) return

    let mounted = true
    const payload = decodeJwt(accessToken)
    const userId = typeof payload?.sub === "string" ? payload.sub : null
    const roleLabel = tokenHasRole(accessToken, "ADMIN") ? "Administrador" : "Administrador empresa"

    setCurrentUser((current) => ({ ...current, roleLabel }))

    if (!userId) return

    getUserById(userId)
      .then((user) => {
        if (!mounted) return

        setCurrentUser({
          name: user.name || user.email || userId,
          email: user.email,
          roleLabel,
        })
      })
      .catch(() => {
        if (!mounted) return

        setCurrentUser({
          name: roleLabel,
          roleLabel,
        })
      })

    return () => {
      mounted = false
    }
  }, [accessToken, hasHydrated])

  const refreshNotifications = useCallback(async (showLoading = true) => {
    if (!hasHydrated || !accessToken) return

    if (showLoading) {
      setIsLoading(true)
      setError(null)
    }

    try {
      const [notifications, count] = await Promise.all([
        listAllNotifications(),
        getUnreadNotificationsCount(),
      ])
      setItems(notifications)
      setUnreadCount(count)
    } catch (err) {
      if (showLoading) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar las notificaciones")
      }
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [accessToken, hasHydrated])

  useEffect(() => {
    void refreshNotifications()
  }, [refreshNotifications])

  useEffect(() => {
    if (!hasHydrated || !accessToken) return

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshNotifications(false)
      }
    }, NOTIFICATION_REFRESH_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [accessToken, hasHydrated, refreshNotifications])

  useEffect(() => {
    if (!hasHydrated || !accessToken) return

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshNotifications(false)
      }
    }

    window.addEventListener("focus", refreshWhenVisible)
    window.addEventListener("notifications:refresh", refreshWhenVisible)
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      window.removeEventListener("focus", refreshWhenVisible)
      window.removeEventListener("notifications:refresh", refreshWhenVisible)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [accessToken, hasHydrated, refreshNotifications])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      void refreshNotifications()
    }
  }

  const getNotificationRoute = (notification: NotificationItem) => {
    const baseRoute = referenceRoutes[notification.referenceType]
    return notification.referenceId ? `${baseRoute}/${notification.referenceId}` : baseRoute
  }

  const handleNotificationClick = async (notification: NotificationItem) => {
    setReadingId(notification.id)
    setError(null)

    try {
      if (!notification.isRead) {
        const updated = await markNotificationAsRead(notification.id)
        setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)))
        setUnreadCount((current) => Math.max(current - 1, 0))
      }

      setOpen(false)
      router.push(getNotificationRoute(notification))
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo marcar la notificacion como leida")
    } finally {
      setReadingId(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true)
    setError(null)

    try {
      await markAllNotificationsAsRead()
      setItems((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      )
      setUnreadCount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron marcar las notificaciones como leidas")
    } finally {
      setIsMarkingAll(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await doLogout()
    } finally {
      router.replace("/login")
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 sm:px-4 lg:px-6">
      <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative hidden w-full max-w-md sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar documentos, usuarios..." className="pl-10" />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-3 lg:gap-4">
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full border border-transparent transition-colors hover:border-blue-200 hover:bg-blue-50"
              aria-label={hasUnread ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"}
            >
              <Bell className={cn("h-5 w-5", hasUnread && "text-blue-700")} />
              {hasUnread ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/85 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
                  {unreadLabel}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="w-[calc(100vw-1.5rem)] max-w-[420px] overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl"
          >
            <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 ring-1 ring-blue-200">
                    <BellRing className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <DropdownMenuLabel className="p-0 text-base font-semibold text-slate-900">Notificaciones</DropdownMenuLabel>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {hasUnread ? `${unreadCount} ${unreadCount === 1 ? "pendiente por revisar" : "pendientes por revisar"}` : "Estás al día con tus novedades"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full text-slate-500 hover:bg-white hover:text-blue-700"
                  onClick={() => void refreshNotifications()}
                  disabled={isLoading}
                  aria-label="Actualizar notificaciones"
                  title="Actualizar"
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="inline-flex rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setNotificationFilter("all")}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition",
                      notificationFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800",
                    )}
                    aria-pressed={notificationFilter === "all"}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationFilter("unread")}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition",
                      notificationFilter === "unread" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800",
                    )}
                    aria-pressed={notificationFilter === "unread"}
                  >
                    Sin leer {hasUnread ? `(${unreadLabel})` : ""}
                  </button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2 text-xs text-blue-700 hover:bg-blue-100/70 hover:text-blue-800"
                  onClick={handleMarkAllAsRead}
                  disabled={!hasUnread || isMarkingAll}
                >
                  {isMarkingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                  <span className="hidden min-[390px]:inline">Marcar todas</span>
                </Button>
              </div>
            </div>

            {error ? (
              <div className="m-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {isLoading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-sm text-slate-500">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                Consultando tus notificaciones...
              </div>
            ) : null}

            {!isLoading && visibleNotifications.length === 0 && !error ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Inbox className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {notificationFilter === "unread" ? "No tienes notificaciones pendientes" : "No tienes notificaciones"}
                </p>
                <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-slate-500">
                  {notificationFilter === "unread" ? "Todo está revisado. Las nuevas alertas aparecerán aquí." : "Cuando SafeCloud detecte una novedad importante, la verás en este espacio."}
                </p>
              </div>
            ) : null}

            {visibleNotifications.length > 0 ? (
              <ScrollArea className="h-[min(56dvh,460px)]">
                <div className="space-y-2 p-2.5">
                  {visibleNotifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "group block cursor-pointer rounded-xl border px-3 py-3 outline-none transition-colors",
                        notification.isRead
                          ? "border-slate-200 bg-white focus:bg-slate-50"
                          : "border-blue-200 bg-blue-50/60 focus:bg-blue-50",
                      )}
                      onSelect={(event) => {
                        event.preventDefault()
                        handleNotificationClick(notification)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1", notificationTone(notification.type))}>
                          <NotificationTypeIcon type={notification.type} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn("line-clamp-2 text-sm leading-snug text-slate-900", notification.isRead ? "font-medium" : "font-semibold")}>
                                  {notification.title}
                                </p>
                                {!notification.isRead ? <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Sin leer" /> : null}
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{notification.message}</p>
                            </div>
                            {readingId === notification.id ? (
                              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-blue-600" />
                            ) : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-transform group-focus:translate-x-0.5 group-focus:text-blue-600" />}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Badge variant="outline" className="border-slate-200 bg-white px-1.5 py-0 text-[10px] font-medium text-slate-600">
                              {notificationTypeLabels[notification.type]}
                            </Badge>
                            <span className="text-[10px] text-slate-400">{referenceTypeLabels[notification.referenceType]}</span>
                            <span className="ml-auto text-[10px] text-slate-400">{formatNotificationDate(notification.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </ScrollArea>
            ) : null}

            <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-center text-[10px] text-slate-400">
              SafeCloud actualiza este panel automáticamente
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.roleLabel}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="space-y-1">
                  <p>Mi Cuenta</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {currentUser.email || currentUser.roleLabel}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setProfileOpen(true)} className="gap-2">
                <UserCircle className="h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push("/dashboard/settings")} className="gap-2">
                <Settings className="h-4 w-4" />
                Ajustes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  void handleLogout()
                }}
                disabled={loggingOut}
                className="gap-2 text-destructive focus:text-destructive"
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {loggingOut ? "Cerrando..." : "Cerrar Sesion"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Perfil de usuario</DialogTitle>
              <DialogDescription>Informacion basica de la sesion actual.</DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-4 rounded-lg border border-border p-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-medium">{currentUser.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Correo</p>
                  <p className="break-all text-sm">{currentUser.email || "No registrado"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rol</p>
                  <p className="text-sm">{currentUser.roleLabel}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
