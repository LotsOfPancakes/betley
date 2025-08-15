// ============================================================================
// File: frontend/src/lib/auth/WalletAuthContext.tsx
// Session-based wallet authentication context and provider
// ============================================================================

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { createAuthMessage, generateNonce, createAuthHeader } from './verifySignature'
import { 
  saveSessionToStorage, 
  loadSessionFromStorage, 
  clearSessionFromStorage,
  STORAGE_KEY
} from './sessionStorage'

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
  isInitialized: boolean
  authError: string | null
  hasUserDeniedSignature: boolean
  
  // Actions
  authenticate: () => Promise<boolean>
  clearAuth: () => void
  getAuthHeader: () => string | null
  resetDenialState: () => void
  
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
  const [isInitialized, setIsInitialized] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [hasUserDeniedSignature, setHasUserDeniedSignature] = useState(false)
  
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
    setHasUserDeniedSignature(false)
    clearSessionFromStorage()  // NEW: Clear from localStorage
    console.debug('[WalletAuth] Session cleared from memory and storage')
  }, [])

  // Reset signature denial state (for manual retry)
  const resetDenialState = useCallback(() => {
    setHasUserDeniedSignature(false)
    setAuthError(null)
    console.debug('[WalletAuth] Signature denial state reset')
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
    
    // Don't auto-retry if user has denied signature
    if (hasUserDeniedSignature) {
      console.debug('[WalletAuth] Skipping authentication - user has denied signature')
      return false
    }
    
    setIsAuthenticating(true)
    setAuthError(null)
    
    try {
      // Generate authentication data
      const timestamp = Date.now()
      const nonce = generateNonce()
      // Use lowercase address for consistency with session storage
      const normalizedAddress = address.toLowerCase()
      const message = createAuthMessage(normalizedAddress, timestamp, nonce)
      
      console.debug('[WalletAuth] Signing message:', {
        originalAddress: address,
        normalizedAddress,
        timestamp,
        nonce,
        messageLength: message.length,
        messagePreview: message.substring(0, 100) + '...',
        fullMessage: message
      })
      
      // Request signature from user
      const signature = await signMessageAsync({ message })
      
      console.debug('[WalletAuth] Signature received:', {
        signatureLength: signature.length,
        signaturePreview: signature.substring(0, 20) + '...'
      })
      
      // Create session
      const newSession: AuthSession = {
        address: normalizedAddress,
        signature,
        timestamp,
        nonce,
        expiresAt: timestamp + (24 * 60 * 60 * 1000) // 24 hours
      }
      
      console.debug('[WalletAuth] Session created:', {
        address: newSession.address,
        timestamp: newSession.timestamp,
        nonce: newSession.nonce,
        expiresAt: newSession.expiresAt
      })
      
      setSession(newSession)
      saveSessionToStorage(newSession)  // NEW: Save to localStorage
      setIsAuthenticating(false)
      console.debug('[WalletAuth] Authentication successful for:', address.slice(0, 8))
      return true
      
    } catch (error) {
      console.error('[WalletAuth] Authentication failed:', error)
      
      // Handle user rejection gracefully
      if (error instanceof Error) {
        if (error.message.includes('rejected') || error.message.includes('denied')) {
          setAuthError('Signature request denied')
          setHasUserDeniedSignature(true)
          console.debug('[WalletAuth] User denied signature request')
        } else {
          setAuthError('Authentication failed. Please try again.')
        }
      } else {
        setAuthError('Authentication failed. Please try again.')
      }
      
      setIsAuthenticating(false)
      return false
    }
  }, [address, isConnected, signMessageAsync, isSessionValid, hasUserDeniedSignature])
  
  // Initialize context and handle wallet changes
  useEffect(() => {
    console.debug('[WalletAuth] Wallet state changed:', { isConnected, address: address?.slice(0, 8) })
    
    if (!isConnected || !address) {
      clearAuth()
      setIsInitialized(true)
    } else if (session && session.address.toLowerCase() !== address.toLowerCase()) {
      // Address changed, clear old session and denial state
      console.debug('[WalletAuth] Address changed, clearing session and denial state')
      clearAuth()
      setIsInitialized(true)
    } else if (!session && address) {
      // NEW: Try to load existing session from localStorage
      const savedSession = loadSessionFromStorage()
      if (savedSession && savedSession.address.toLowerCase() === address.toLowerCase()) {
        console.debug('[WalletAuth] Restored session from localStorage for:', address.slice(0, 8))
        setSession(savedSession)
      }
      setIsInitialized(true)
    } else {
      // Wallet connected and address matches (or no session yet)
      setIsInitialized(true)
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

  // NEW: Cross-tab session synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only react to changes to our session storage key
      if (e.key !== STORAGE_KEY) return
      
      console.debug('[WalletAuth] Storage change detected:', { 
        key: e.key, 
        newValue: e.newValue ? 'session exists' : 'session cleared',
        currentAddress: address?.slice(0, 8)
      })
      
      if (e.newValue === null) {
        // Session was cleared in another tab
        console.debug('[WalletAuth] Session cleared in another tab, syncing...')
        setSession(null)
        setAuthError(null)
      } else if (address) {
        // Session was updated in another tab, check if it's for current address
        try {
          const newSession = JSON.parse(e.newValue)
          if (newSession.address.toLowerCase() === address.toLowerCase()) {
            console.debug('[WalletAuth] Session updated in another tab, syncing...')
            setSession(newSession)
            setAuthError(null)
          }
        } catch (error) {
          console.warn('[WalletAuth] Failed to parse session from storage change:', error)
        }
      }
    }
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [address])
  
  const contextValue: WalletAuthContextType = {
    // State
    session,
    isAuthenticated,
    isAuthenticating,
    isInitialized,
    authError,
    hasUserDeniedSignature,
    
    // Actions
    authenticate,
    clearAuth,
    getAuthHeader,
    resetDenialState,
    
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