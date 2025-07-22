// ============================================================================
// frontend/app/api/bets/[randomId]/route.ts - Fixed bet lookup
// ============================================================================

import { NextRequest } from 'next/server'
import { supabase, checkRateLimit, validateRandomId } from '@/lib/supabase'

// Get IP Helper function
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) return forwarded.split(',')[0].trim()
  if (vercelIP) return vercelIP.split(',')[0].trim()
  
  return '127.0.0.1'
}

interface RouteParams {
  params: Promise<{ randomId: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // ✅ SECURITY: Get client IP with proper fallbacks
    const clientIp = getClientIP(request)

    // ✅ SECURITY: Rate limit (100 lookups per hour)
    const rateLimitOk = await checkRateLimit(clientIp, 'lookup-bet', 100, 60)
    if (!rateLimitOk) {
      return Response.json(
        { error: 'Rate limit exceeded' }, 
        { status: 429 }
      )
    }

    // Await the params in Next.js 15
    const { randomId } = await context.params

    // ✅ SECURITY: Validate input format
    if (!validateRandomId(randomId)) {
      return Response.json(
        { error: 'Invalid random ID format' }, 
        { status: 400 }
      )
    }

    // ✅ SECURITY: Use read-only client for lookup
    const { data, error } = await supabase
      .from('bet_mappings')
      .select('numeric_id')
      .eq('random_id', randomId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Database error:', error)
      return Response.json(
        { error: 'Database query failed' }, 
        { status: 500 }
      )
    }

    // ✅ SECURITY: Return null for not found (don't reveal existence)
    return Response.json(
      { numericId: data?.numeric_id || null },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 min cache
          'X-Content-Type-Options': 'nosniff'
        }
      }
    )

  } catch (error) {
    console.error('API lookup error:', error)
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}