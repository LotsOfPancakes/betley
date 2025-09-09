// File: frontend/src/lib/utils/request.ts
// Shared request utilities for API routes
// ============================================================================

import { NextRequest } from 'next/server'

/**
 * Extract client IP address from request headers
 * Handles Vercel's forwarded headers and fallbacks
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) return forwarded.split(',')[0].trim()
  if (vercelIP) return vercelIP.split(',')[0].trim()
  
  return '127.0.0.1'
}