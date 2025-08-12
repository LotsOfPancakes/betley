// ============================================================================
// File: frontend/src/components/auth/AuthModal.tsx
// Authentication modal for wallet signature verification
// ============================================================================

'use client'

import React from 'react'
import { useAccount } from 'wagmi'
import { useWalletAuth } from '@/lib/auth/WalletAuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  title?: string
  description?: string
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  title = "Verify Wallet Ownership",
  description = "To view your personal data, please sign a message to prove you own this wallet address."
}: AuthModalProps) {
  const { address } = useAccount()
  const { authenticate, isAuthenticating, authError, clearAuth } = useWalletAuth()
  
  // Handle authentication
  const handleAuthenticate = async () => {
    const success = await authenticate()
    if (success) {
      onSuccess?.()
      onClose()
    }
  }
  
  // Handle modal close
  const handleClose = () => {
    clearAuth() // Clear any auth errors
    onClose()
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border border-green-500/30 rounded-3xl p-8 max-w-md w-full mx-auto relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          disabled={isAuthenticating}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <span className="text-2xl">🔐</span>
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          {title}
        </h2>
        
        {/* Description */}
        <p className="text-gray-300 mb-6 text-center leading-relaxed">
          {description}
        </p>
        
        {/* Address display */}
        {address && (
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-400 mb-1">Wallet Address:</p>
            <p className="text-green-400 font-mono text-sm break-all">
              {address}
            </p>
          </div>
        )}
        
        {/* Error message */}
        {authError && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-300 text-sm">{authError}</p>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isAuthenticating}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleAuthenticate}
            disabled={isAuthenticating || !address}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl shadow-green-500/30"
          >
            {isAuthenticating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing...
              </div>
            ) : (
              'Sign Message'
            )}
          </button>
        </div>
        
        {/* Info note */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 text-lg">ℹ️</span>
            <div>
              <p className="text-blue-300 text-sm font-medium mb-1">
                About this signature
              </p>
              <p className="text-blue-200/80 text-xs leading-relaxed">
                This signature is stored locally and expires in 24 hours. 
                It only grants read access to your personal betting data and cannot be used for transactions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for easy authentication modal usage
export function useAuthModal() {
  const [isOpen, setIsOpen] = React.useState(false)
  const { isAuthenticated, authenticate } = useWalletAuth()
  
  const requireAuth = React.useCallback(async (): Promise<boolean> => {
    if (isAuthenticated) {
      return true
    }
    
    // Try silent authentication first
    const success = await authenticate()
    if (success) {
      return true
    }
    
    // If silent auth fails, show modal
    return new Promise((resolve) => {
      setIsOpen(true)
      
      const handleSuccess = () => {
        setIsOpen(false)
        resolve(true)
      }
      
      const handleClose = () => {
        setIsOpen(false)
        resolve(false)
      }
      
      // Store handlers for modal
      ;(window as unknown as { __authModalHandlers?: { handleSuccess: () => void; handleClose: () => void } }).__authModalHandlers = { handleSuccess, handleClose }
    })
  }, [isAuthenticated, authenticate])
  
  const AuthModalComponent = React.useCallback(() => {
    const handlers = (window as unknown as { __authModalHandlers?: { handleSuccess: () => void; handleClose: () => void } }).__authModalHandlers
    
    return (
      <AuthModal
        isOpen={isOpen}
        onClose={handlers?.handleClose || (() => setIsOpen(false))}
        onSuccess={handlers?.handleSuccess || (() => setIsOpen(false))}
      />
    )
  }, [isOpen])
  
  return {
    requireAuth,
    AuthModal: AuthModalComponent,
    isModalOpen: isOpen,
    closeModal: () => setIsOpen(false)
  }
}