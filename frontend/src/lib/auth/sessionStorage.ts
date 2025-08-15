// ============================================================================
// File: frontend/src/lib/auth/sessionStorage.ts
// Session persistence utilities for 24-hour authentication
// ============================================================================

// Development-only debugging
const DEBUG = process.env.NODE_ENV === 'development'
const debugLog = (message: string, ...args: unknown[]) => {
  if (DEBUG) console.debug(message, ...args)
}
const debugWarn = (message: string, ...args: unknown[]) => {
  if (DEBUG) console.warn(message, ...args)
}

interface AuthSession {
  address: string
  signature: string
  timestamp: number
  nonce: string
  expiresAt: number
}

const STORAGE_KEY = 'betley_auth_session'

// Check if localStorage is available and writable
export function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false
    }
    
    // Test write/read to ensure localStorage is functional
    const testKey = '__betley_storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.getItem(testKey)
    localStorage.removeItem(testKey)
    
    return true
  } catch (error) {
    debugWarn('[SessionStorage] localStorage not available:', error)
    return false
  }
}

// Validate session object structure
function isValidSessionStructure(obj: unknown): obj is AuthSession {
  if (!obj || typeof obj !== 'object' || obj === null) {
    return false
  }
  
  const session = obj as Record<string, unknown>
  
  return (
    typeof session.address === 'string' &&
    typeof session.signature === 'string' &&
    typeof session.timestamp === 'number' &&
    typeof session.nonce === 'string' &&
    typeof session.expiresAt === 'number' &&
    // Validate address format
    /^0x[a-fA-F0-9]{40}$/.test(session.address) &&
    // Validate timestamp is reasonable (not too far in past/future)
    session.timestamp > Date.now() - (30 * 24 * 60 * 60 * 1000) && // Max 30 days old
    session.timestamp < Date.now() + (5 * 60 * 1000) && // Max 5 minutes in future
    // Validate expiry is after timestamp
    session.expiresAt > session.timestamp &&
    // Validate nonce format
    session.nonce.length > 0
  )
}

// Save session to localStorage
export function saveSessionToStorage(session: AuthSession): void {
  if (!isStorageAvailable()) {
    debugLog('[SessionStorage] Storage not available, skipping save')
    return
  }
  
  try {
    const serialized = JSON.stringify(session)
    localStorage.setItem(STORAGE_KEY, serialized)
    debugLog('[SessionStorage] Session saved successfully for:', session.address.slice(0, 8))
  } catch (error) {
    debugWarn('[SessionStorage] Failed to save session:', error)
  }
}

// Load session from localStorage
export function loadSessionFromStorage(): AuthSession | null {
  if (!isStorageAvailable()) {
    debugLog('[SessionStorage] Storage not available, returning null')
    return null
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      debugLog('[SessionStorage] No stored session found')
      return null
    }
    
    const parsed = JSON.parse(stored)
    
    // Validate session structure
    if (!isValidSessionStructure(parsed)) {
      debugWarn('[SessionStorage] Invalid session structure, clearing storage')
      clearSessionFromStorage()
      return null
    }
    
    // Check if session is expired
    const now = Date.now()
    if (now >= parsed.expiresAt) {
      debugLog('[SessionStorage] Session expired, clearing storage')
      clearSessionFromStorage()
      return null
    }
    
    debugLog('[SessionStorage] Valid session loaded for:', parsed.address.slice(0, 8), {
      expiresIn: Math.round((parsed.expiresAt - now) / (60 * 1000)) + ' minutes'
    })
    
    return parsed
  } catch (error) {
    debugWarn('[SessionStorage] Failed to load session, clearing storage:', error)
    clearSessionFromStorage()
    return null
  }
}

// Clear session from localStorage
export function clearSessionFromStorage(): void {
  if (!isStorageAvailable()) {
    debugLog('[SessionStorage] Storage not available, skipping clear')
    return
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    debugLog('[SessionStorage] Session cleared from storage')
  } catch (error) {
    debugWarn('[SessionStorage] Failed to clear session:', error)
  }
}

// Get time until session expires (in milliseconds)
export function getSessionTimeRemaining(): number {
  const session = loadSessionFromStorage()
  if (!session) return 0
  
  return Math.max(0, session.expiresAt - Date.now())
}

// Check if there's a valid session for a specific address
export function hasValidSessionFor(address: string): boolean {
  const session = loadSessionFromStorage()
  if (!session) return false
  
  return session.address.toLowerCase() === address.toLowerCase()
}

// Export the storage key for cross-tab listening
export { STORAGE_KEY }