"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, Loader2, LogOut, Search, Settings, UserCircle } from "lucide-react"
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

const NOTIFICATION_REFRESH_INTERVAL_MS = 15_000

const notificationTypeLabels: Record<NotificationType, string> = {
  TRAINING_CREATED: "Capacitacion creada",
  TRAINING_REMINDER: "Recordatorio de capacitacion",
  PREVENTIVE_MEASURE_REMINDER: "Recordatorio de medida",
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
  }).format(date)
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
  const [profileOpen, setProfileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ name: string; email?: string; roleLabel: string }>({
    name: "Usuario",
    roleLabel: "Usuario",
  })

  const hasUnread = unreadCount > 0
  const unreadLabel = useMemo(() => (unreadCount > 99 ? "99+" : String(unreadCount)), [unreadCount])

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
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar documentos, usuarios..." className="pl-10" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
              <Bell className="h-5 w-5" />
              {hasUnread ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                  {unreadLabel}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(92vw,380px)] p-0">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 px-2 text-xs"
                onClick={handleMarkAllAsRead}
                disabled={!hasUnread || isMarkingAll}
              >
                {isMarkingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Marcar leidas
              </Button>
            </div>
            <DropdownMenuSeparator />

            {error ? <p className="px-4 py-3 text-sm text-destructive">{error}</p> : null}

            {isLoading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando notificaciones
              </div>
            ) : null}

            {!isLoading && items.length === 0 && !error ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No tienes notificaciones</p>
            ) : null}

            {items.length > 0 ? (
              <ScrollArea className="max-h-[420px]">
                <div className="py-1">
                  {items.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="block cursor-pointer rounded-none px-4 py-3 focus:bg-secondary"
                      onSelect={(event) => {
                        event.preventDefault()
                        handleNotificationClick(notification)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                            notification.isRead ? "bg-muted" : "bg-primary",
                          )}
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-medium leading-snug">{notification.title}</p>
                            {readingId === notification.id ? (
                              <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                            ) : null}
                          </div>
                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {notification.message}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                              {notificationTypeLabels[notification.type]}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {formatNotificationDate(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </ScrollArea>
            ) : null}
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
                Configuracion
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
