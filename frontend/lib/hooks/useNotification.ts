// frontend/lib/hooks/useNotification.ts
import { useNotificationContext } from '../contexts/NotificationContext'

/**
 * Custom hook for easy access to notification functions
 * 
 * Usage:
 * const { showError, showSuccess } = useNotification()
 * showError('Something went wrong', 'Transaction Failed')
 * showSuccess('Bet placed successfully!')
 */
export function useNotification() {
  const context = useNotificationContext()
  
  return {
    // Convenience methods
    showSuccess: context.showSuccess,
    showError: context.showError,
    showWarning: context.showWarning,
    showInfo: context.showInfo,
    
    // Advanced methods for custom notifications
    addNotification: context.addNotification,
    removeNotification: context.removeNotification,
    clearAllNotifications: context.clearAllNotifications,
    
    // Access to current notifications (for custom UI)
    notifications: context.notifications,
  }
}