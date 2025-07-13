// app/components/ui/NotificationToast.tsx - Fixed toast layout
'use client'

import React from 'react'
import { useNotification } from '@/lib/hooks/useNotification'
import { NotificationItem } from '@/lib/types/notifications'

function ToastIcon({ type }: { type: NotificationItem['type'] }) {
  switch (type) {
    case 'success':
      return (
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      )
    case 'error':
      return (
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
      )
    case 'warning':
      return (
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      )
    case 'info':
      return (
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
      )
  }
}

function SingleToast({ notification }: { notification: NotificationItem }) {
  const { removeNotification } = useNotification()

  const bgColorClass = {
    success: 'bg-green-900/90 border-green-600',
    error: 'bg-red-900/90 border-red-600',
    warning: 'bg-yellow-900/90 border-yellow-600',
    info: 'bg-blue-900/90 border-blue-600'
  }

  const textColorClass = {
    success: 'text-green-200',
    error: 'text-red-200', 
    warning: 'text-yellow-200',
    info: 'text-blue-200'
  }

  return (
    <div className={`max-w-sm w-full ${bgColorClass[notification.type]} shadow-lg rounded-lg pointer-events-auto border backdrop-blur-sm`}>
      <div className="p-4">
        <div className="flex items-start">
          <ToastIcon type={notification.type} />
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-white">
              {notification.title}
            </p>
            <p className={`mt-1 text-sm ${textColorClass[notification.type]} break-words`}>
              {notification.message}
            </p>
            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`text-sm font-medium rounded-md px-3 py-2 transition-colors ${
                      action.variant === 'primary' 
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : `bg-transparent ${textColorClass[notification.type]} hover:bg-white hover:bg-opacity-10 border border-current`
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`inline-flex ${textColorClass[notification.type]} hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 rounded-md p-1.5`}
              onClick={() => removeNotification(notification.id)}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationToast() {
  const { notifications } = useNotification()

  if (notifications.length === 0) {
    return null
  }

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="transform ease-out duration-300 transition-all translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2 w-full"
            style={{
              animation: 'slideIn 0.3s ease-out forwards',
            }}
          >
            <SingleToast notification={notification} />
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateY(0) translateX(0);
          }
        }
      `}</style>
    </div>
  )
}