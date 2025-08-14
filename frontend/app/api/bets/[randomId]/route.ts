// ============================================================================
// File: frontend/app/api/bets/[randomId]/route.ts
// New Privacy-Focused Bet Details API
// Purpose: Provide bet details to anyone with the random URL (link-based access)
// ============================================================================

import { NextRequest } from 'next/server'
import { createServerSupabaseClient, checkRateLimit, validateRandomId } from '@/lib/supabase'

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

    // ✅ SECURITY: Rate limit (200 lookups per hour - generous for legitimate use)
    const rateLimitOk = await checkRateLimit(clientIp, 'bet-details', 200, 60)
    if (!rateLimitOk) {
      return Response.json(
        { error: 'Rate limit exceeded. Please try again later.' }, 
        { status: 429 }
      )
    }

    // Await the params in Next.js 15
    const { randomId } = await context.params

    // ✅ SECURITY: Validate input format
    if (!validateRandomId(randomId)) {
      return Response.json(
        { error: 'Invalid bet URL format' }, 
        { status: 400 }
      )
    }

    // ✅ DATABASE: Get bet details from database (this is the new approach)
    const supabase = createServerSupabaseClient()
    const { data: bet, error } = await supabase
      .from('bet_mappings')
      .select(`
        numeric_id,
        bet_name,
        bet_options,
        creator_address,
        option_count,
        token_address,
        end_time,
        resolved,
        winning_option,
        total_amounts,
        resolution_deadline,
        created_at,
        updated_at,
        is_public
      `)
      .eq('random_id', randomId)
      .single()

    // ✅ NOT FOUND: Return 404 for both "not found" errors and missing data
    if (error?.code === 'PGRST116' || !bet) {
      return Response.json(
        { error: 'Bet not found' }, 
        { status: 404 }
      )
    }

    // ✅ DATABASE ERROR: Return 500 for actual database errors
    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Database query failed' }, 
        { status: 500 }
      )
    }

    // ✅ SUCCESS: Return ALL bet details to anyone with the link
    // This is the core of our privacy model: the random URL IS the access control
    return Response.json(
      {
        // Core bet information
        numericId: bet.numeric_id, // ✅ KEEP: Needed for blockchain operations on individual bet page
        name: bet.bet_name,
        options: bet.bet_options,
        
        // Creator and configuration
        creator: bet.creator_address,
        optionCount: bet.option_count,
        tokenAddress: bet.token_address,
        
        // Timing
        endTime: bet.end_time,
        createdAt: bet.created_at,
        
        // Resolution status (cached from blockchain)
        resolved: bet.resolved,
        winningOption: bet.winning_option,
        resolutionDeadline: bet.resolution_deadline,
        
        // Betting amounts (cached from blockchain, may be slightly stale)
        totalAmounts: bet.total_amounts,
        
        // Metadata
        lastUpdated: bet.updated_at,
        isPublic: bet.is_public,
        
        // Status flags for frontend
        canAccess: true, // Anyone with the link can access
        isActive: bet.end_time > Math.floor(Date.now() / 1000) && !bet.resolved,
        hasEnded: bet.end_time <= Math.floor(Date.now() / 1000),
      },
      {
        headers: {
          // Cache for 30 seconds to reduce database load
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          'X-Content-Type-Options': 'nosniff',
          // Add CORS headers if needed
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        }
      }
    )

  } catch (error) {
    console.error('API error:', error)
    
    // ✅ SECURITY: Don't leak internal error details
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// ============================================================================
// Optional: Handle OPTIONS for CORS preflight
// ============================================================================
export async function OPTIONS() {
  return Response.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}