// ============================================================================
// File: frontend/src/lib/auth/verifySignature.ts
// Wallet signature verification utility for session-based authentication
// ============================================================================

import { verifyMessage } from 'viem'

// Authentication message template
export function createAuthMessage(address: string, timestamp: number, nonce: string): string {
  const expires = timestamp + (24 * 60 * 60 * 1000) // 24 hours from now
  
  return `Betley Authentication
Address: ${address}
Timestamp: ${timestamp}
Expires: ${expires}
Nonce: ${nonce}

This signature grants read access to your personal data for 24 hours.`
}

// Generate a random nonce for signature uniqueness
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

// Verify signature on the server side
export async function verifyWalletSignature(
  address: string,
  signature: string,
  timestamp: number,
  nonce: string
): Promise<boolean> {
  try {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    // Check if signature is expired
    if (now - timestamp > maxAge) {
      console.warn('Signature expired:', { timestamp, now, age: now - timestamp })
      return false
    }
    
    // Check if signature is too far in future (clock skew protection)
    if (timestamp > now + 5 * 60 * 1000) {
      console.warn('Signature timestamp too far in future:', { timestamp, now })
      return false
    }
    
    // Recreate the message that was signed
    const message = createAuthMessage(address, timestamp, nonce)
    
    // Verify the signature
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`
    })
    
    return isValid
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

// Parse authentication header
export interface AuthData {
  address: string
  signature: string
  timestamp: number
  nonce: string
}

export function parseAuthHeader(authHeader: string): AuthData | null {
  try {
    // Expected format: "Bearer address:signature:timestamp:nonce"
    if (!authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7) // Remove "Bearer "
    const parts = token.split(':')
    
    if (parts.length !== 4) {
      return null
    }
    
    const [address, signature, timestampStr, nonce] = parts
    const timestamp = parseInt(timestampStr, 10)
    
    if (isNaN(timestamp)) {
      return null
    }
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return null
    }
    
    return {
      address,
      signature,
      timestamp,
      nonce
    }
  } catch (error) {
    console.error('Auth header parsing error:', error)
    return null
  }
}

// Create authentication header for client requests
export function createAuthHeader(
  address: string,
  signature: string,
  timestamp: number,
  nonce: string
): string {
  return `Bearer ${address}:${signature}:${timestamp}:${nonce}`
}