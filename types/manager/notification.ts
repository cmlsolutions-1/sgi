export type NotificationType =
  | "TRAINING_CREATED"
  | "TRAINING_REMINDER"
  | "PREVENTIVE_MEASURE_REMINDER"

export type NotificationReferenceType = "TRAINING" | "PREVENTIVE_MEASURE"

export type NotificationItem = {
  id: string
  companyId: string
  userId: string
  title: string
  message: string
  type: NotificationType
  referenceType: NotificationReferenceType
  referenceId: string
  isRead: boolean
  readAt: string | null
  scheduledFor: string | null
  sentAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export type NotificationsFilters = {
  page?: number
  limit?: number
  type?: NotificationType
  referenceType?: NotificationReferenceType
  isRead?: boolean
}

export type NotificationsPage = {
  items: NotificationItem[]
  total: number
  page: number
  limit: number
}

export type NotificationsUnreadCount = {
  count: number
}

export type NotificationsReadAllResult = {
  updated: number
}

export type ApiResponse<T> = {
  ok: boolean
  message: string
  data: T
  errors: unknown
  meta?: {
    path: string
    method: string
    timestamp: string
    statusCode: number
  }
}
