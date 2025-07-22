import { NextRequest } from 'next/server'
import { supabase, checkRateLimit } from '@/lib/supabase'

// Get IP helper function
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) return forwarded.split(',')[0].trim()
  if (vercelIP) return vercelIP.split(',')[0].trim()
  
  return '127.0.0.1'
}

export async function POST(request: NextRequest) {

  try {
    // ✅ SECURITY: Get client IP with proper fallbacks
    const clientIp = getClientIP(request)

    // ✅ SECURITY: Rate limit batch operations more strictly
    const rateLimitOk = await checkRateLimit(clientIp, 'batch-lookup', 20, 60)
    if (!rateLimitOk) {
      return Response.json(
        { error: 'Rate limit exceeded' }, 
        { status: 429 }
      )
    }

    // ✅ SECURITY: Validate content type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return Response.json(
        { error: 'Invalid content type' }, 
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { error: 'Invalid JSON payload' }, 
        { status: 400 }
      )
    }

    const { address, maxBetId } = body

    // ✅ SECURITY: Validate inputs
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json(
        { error: 'Invalid address format' }, 
        { status: 400 }
      )
    }

    if (typeof maxBetId !== 'number' || maxBetId < 0 || maxBetId > 10000) {
      return Response.json(
        { error: 'Invalid maxBetId range' }, 
        { status: 400 }
      )
    }

    // ✅ SECURITY: Use read-only client with specific filters
    const { data, error } = await supabase
      .from('bet_mappings')
      .select('numeric_id, random_id')
      .eq('creator_address', address.toLowerCase()) // Only user's own bets
      .lte('numeric_id', maxBetId)
      .order('numeric_id')
      .limit(100) // Prevent excessive data extraction

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Database query failed' }, 
        { status: 500 }
      )
    }

    // ✅ SECURITY: Convert to lookup object
    const mappings: Record<number, string> = {}
    
    if (data) {
      for (const mapping of data) {
        mappings[mapping.numeric_id] = mapping.random_id
      }
    }

    return Response.json({ 
      mappings,
      count: Object.keys(mappings).length
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60', // 1 min cache
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}