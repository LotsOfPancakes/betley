// frontend/lib/contexts/NotificationContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { NotificationType, NotificationItem, NotificationContextType } from '../types/notifications'

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id'>) => {
    const id = Date.now().toString()
    const newNotification: NotificationItem = {
      ...notification,
      id,
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove notification after duration
    const duration = notification.duration || 5000
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Convenience methods for different types
  const showSuccess = useCallback((message: string, title?: string, duration?: number) => {
    return addNotification({
      type: 'success',
      title: title || 'Success',
      message,
      duration: duration || 4000,
    })
  }, [addNotification])

  const showError = useCallback((message: string, title?: string, duration?: number) => {
    return addNotification({
      type: 'error',
      title: title || 'Error',
      message,
      duration: duration || 6000,
    })
  }, [addNotification])

  const showWarning = useCallback((message: string, title?: string, duration?: number) => {
    return addNotification({
      type: 'warning',
      title: title || 'Warning',
      message,
      duration: duration || 5000,
    })
  }, [addNotification])

  const showInfo = useCallback((message: string, title?: string, duration?: number) => {
    return addNotification({
      type: 'info',
      title: title || 'Info',
      message,
      duration: duration || 4000,
    })
  }, [addNotification])

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}