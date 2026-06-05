import { apiFetch } from "@/lib/apiClient"
import type {
  ApiResponse,
  NotificationItem,
  NotificationsFilters,
  NotificationsPage,
  NotificationsReadAllResult,
  NotificationsUnreadCount,
} from "@/types/manager/notification"

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null

  if (!res.ok || !json?.ok) {
    throw new Error(json?.message ?? fallbackMsg)
  }

  return json.data
}

function buildQuery(filters: NotificationsFilters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value))
    }
  })

  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function listNotifications(filters?: NotificationsFilters): Promise<NotificationsPage> {
  const res = await apiFetch(`/api/notifications${buildQuery(filters)}`, { method: "GET" })
  return parseOrThrow<NotificationsPage>(res, "No se pudieron cargar las notificaciones")
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const res = await apiFetch("/api/notifications/unread-count", { method: "GET" })
  const data = await parseOrThrow<NotificationsUnreadCount>(
    res,
    "No se pudo cargar el contador de notificaciones",
  )
  return data.count
}

export async function markNotificationAsRead(id: string): Promise<NotificationItem> {
  const res = await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" })
  return parseOrThrow<NotificationItem>(res, "No se pudo marcar la notificacion como leida")
}

export async function markAllNotificationsAsRead(): Promise<NotificationsReadAllResult> {
  const res = await apiFetch("/api/notifications/read-all", { method: "PATCH" })
  return parseOrThrow<NotificationsReadAllResult>(res, "No se pudieron marcar las notificaciones como leidas")
}
