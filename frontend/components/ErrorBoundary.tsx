// components/ErrorBoundary.tsx - Fixed TypeScript issues
'use client'

import React, { Component, ReactNode } from 'react'
import { devConfig } from '@/lib/config'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  level?: 'page' | 'component' | 'critical'
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error in development
    if (devConfig.enableConsoleLogging) {
      console.error('🚨 Error Boundary Caught:', error)
      console.error('Component Stack:', errorInfo.componentStack)
    }

    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback based on error level
      return <ErrorFallback 
        level={this.props.level || 'component'} 
        onRetry={this.handleRetry}
        error={this.state.error}
      />
    }

    return this.props.children
  }
}

// Error fallback UI components
interface ErrorFallbackProps {
  level: 'page' | 'component' | 'critical'
  onRetry: () => void
  error?: Error
}

function ErrorFallback({ level, onRetry, error }: ErrorFallbackProps) {
  const getErrorContent = () => {
    switch (level) {
      case 'critical':
        return {
          title: 'Application Error',
          message: 'A critical error occurred. Please refresh the page or contact support.',
          action: 'Refresh Page',
          onClick: () => window.location.reload()
        }
      
      case 'page':
        return {
          title: 'Page Error',
          message: 'Something went wrong loading this page. Try refreshing or going back.',
          action: 'Try Again',
          onClick: onRetry
        }
      
      case 'component':
      default:
        return {
          title: 'Component Error',
          message: 'A component failed to load properly.',
          action: 'Retry',
          onClick: onRetry
        }
    }
  }

  const { title, message, action, onClick } = getErrorContent()

  return (
    <div className={`bg-gray-800 border border-red-500/20 rounded-lg p-6 text-center ${
      level === 'critical' ? 'min-h-screen flex items-center justify-center' : ''
    }`}>
      <div className="max-w-md mx-auto">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        
        <button
          onClick={onClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          {action}
        </button>

        {devConfig.enableConsoleLogging && error && (
          <details className="mt-4 text-left">
            <summary className="text-gray-500 text-sm cursor-pointer">Error Details (Dev)</summary>
            <pre className="mt-2 p-3 bg-gray-900 rounded text-xs text-red-400 overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// Specialized error boundaries for different contexts
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="page">
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="component">
      {children}
    </ErrorBoundary>
  )
}

export function CriticalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="critical">
      {children}
    </ErrorBoundary>
  )
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    if (devConfig.enableConsoleLogging) {
      console.error('🚨 Manual Error Report:', error)
      if (errorInfo) console.error('Context:', errorInfo)
    }
    
    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { extra: { context: errorInfo } })
  }
}

// Type for async function
type AsyncFunction<T extends unknown[], R> = (...args: T) => Promise<R>

// Utility for wrapping async operations with error handling
export function withErrorHandling<T extends unknown[], R>(
  fn: AsyncFunction<T, R>,
  context?: string
): AsyncFunction<T, R> {
  return (async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (devConfig.enableConsoleLogging) {
        console.error(`🚨 Async Error in ${context || 'unknown'}:`, error)
      }
      
      // In production, send to error tracking service
      // Example: Sentry.captureException(error, { tags: { context } })
      
      throw error // Re-throw to maintain expected behavior
    }
  })
}