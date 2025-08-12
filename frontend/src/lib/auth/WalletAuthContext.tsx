// ============================================================================
// File: frontend/src/lib/auth/WalletAuthContext.tsx
// Session-based wallet authentication context and provider
// ============================================================================

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { createAuthMessage, generateNonce, createAuthHeader } from './verifySignature'

// Authentication state interface
interface AuthSession {
  address: string
  signature: string
  timestamp: number
  nonce: string
  expiresAt: number
}

interface WalletAuthContextType {
  // State
  session: AuthSession | null
  isAuthenticated: boolean
  isAuthenticating: boolean
  authError: string | null
  
  // Actions
  authenticate: () => Promise<boolean>
  clearAuth: () => void
  getAuthHeader: () => string | null
  
  // Utilities
  isSessionValid: () => boolean
  timeUntilExpiry: () => number
}

const WalletAuthContext = createContext<WalletAuthContextType | null>(null)

// Custom hook to use wallet authentication
export function useWalletAuth(): WalletAuthContextType {
  const context = useContext(WalletAuthContext)
  if (!context) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider')
  }
  return context
}

// Authentication provider component
export function WalletAuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  
  // Authentication state
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  
  // Check if current session is valid
  const isSessionValid = useCallback((): boolean => {
    if (!session || !address) return false
    
    // Check if session is for current address
    if (session.address.toLowerCase() !== address.toLowerCase()) return false
    
    // Check if session is expired
    const now = Date.now()
    if (now > session.expiresAt) return false
    
    return true
  }, [session, address])
  
  // Calculate time until session expiry
  const timeUntilExpiry = useCallback((): number => {
    if (!session) return 0
    return Math.max(0, session.expiresAt - Date.now())
  }, [session])
  
  // Check if user is authenticated
  const isAuthenticated = isSessionValid()
  
  // Clear authentication session
  const clearAuth = useCallback(() => {
    setSession(null)
    setAuthError(null)
  }, [])
  
  // Get authorization header for API requests
  const getAuthHeader = useCallback((): string | null => {
    if (!isSessionValid()) return null
    
    return createAuthHeader(
      session!.address,
      session!.signature,
      session!.timestamp,
      session!.nonce
    )
  }, [session, isSessionValid])
  
  // Authenticate user with wallet signature
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!address || !isConnected) {
      setAuthError('Wallet not connected')
      return false
    }
    
    // If already authenticated for this address, return true
    if (isSessionValid()) {
      return true
    }
    
    setIsAuthenticating(true)
    setAuthError(null)
    
    try {
      // Generate authentication data
      const timestamp = Date.now()
      const nonce = generateNonce()
      const message = createAuthMessage(address, timestamp, nonce)
      
      // Request signature from user
      const signature = await signMessageAsync({ message })
      
      // Create session
      const newSession: AuthSession = {
        address: address.toLowerCase(),
        signature,
        timestamp,
        nonce,
        expiresAt: timestamp + (24 * 60 * 60 * 1000) // 24 hours
      }
      
      setSession(newSession)
      setIsAuthenticating(false)
      return true
      
    } catch (error) {
      console.error('Authentication failed:', error)
      
      // Handle user rejection gracefully
      if (error instanceof Error) {
        if (error.message.includes('rejected') || error.message.includes('denied')) {
          setAuthError('Authentication cancelled. You can try again anytime.')
        } else {
          setAuthError('Authentication failed. Please try again.')
        }
      } else {
        setAuthError('Authentication failed. Please try again.')
      }
      
      setIsAuthenticating(false)
      return false
    }
  }, [address, isConnected, signMessageAsync, isSessionValid])
  
  // Clear auth when wallet disconnects or address changes
  useEffect(() => {
    if (!isConnected || !address) {
      clearAuth()
    } else if (session && session.address.toLowerCase() !== address.toLowerCase()) {
      // Address changed, clear old session
      clearAuth()
    }
  }, [isConnected, address, session, clearAuth])
  
  // Auto-clear expired sessions
  useEffect(() => {
    if (!session) return
    
    const timeLeft = timeUntilExpiry()
    if (timeLeft <= 0) {
      clearAuth()
      return
    }
    
    // Set timeout to clear session when it expires
    const timeout = setTimeout(() => {
      clearAuth()
    }, timeLeft)
    
    return () => clearTimeout(timeout)
  }, [session, timeUntilExpiry, clearAuth])
  
  const contextValue: WalletAuthContextType = {
    // State
    session,
    isAuthenticated,
    isAuthenticating,
    authError,
    
    // Actions
    authenticate,
    clearAuth,
    getAuthHeader,
    
    // Utilities
    isSessionValid,
    timeUntilExpiry
  }
  
  return (
    <WalletAuthContext.Provider value={contextValue}>
      {children}
    </WalletAuthContext.Provider>
  )
}