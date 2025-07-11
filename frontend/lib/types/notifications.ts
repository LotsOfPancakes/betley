// frontend/lib/types/notifications.ts

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number // milliseconds, 0 = persistent
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export interface NotificationContextType {
  notifications: NotificationItem[]
  addNotification: (notification: Omit<NotificationItem, 'id'>) => string
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  showSuccess: (message: string, title?: string, duration?: number) => string
  showError: (message: string, title?: string, duration?: number) => string
  showWarning: (message: string, title?: string, duration?: number) => string
  showInfo: (message: string, title?: string, duration?: number) => string
}