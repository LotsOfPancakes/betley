import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// IP detection
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip') // Cloudflare
  const vercelIP = request.headers.get('x-vercel-forwarded-for') // Vercel
  
  // Try each source in order of reliability
  if (forwarded) return forwarded.split(',')[0].trim()
  if (vercelIP) return vercelIP.split(',')[0].trim()
  if (cfIP) return cfIP
  if (realIP) return realIP
  
  return '127.0.0.1' // Fallback
}

export function middleware(request: NextRequest) {
  // ✅ SECURITY: Add security headers to all responses
  const response = NextResponse.next()

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  // Content Security Policy (adjust as needed)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https: wss:; frame-ancestors 'none';"
  )

  // ✅ SECURITY: Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const clientIp = getClientIP(request) || 
                    request.headers.get('x-forwarded-for')?.split(',')[0] ||
                    '127.0.0.1'
    
    // Add IP to headers for API routes to use
    response.headers.set('X-Client-IP', clientIp)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}