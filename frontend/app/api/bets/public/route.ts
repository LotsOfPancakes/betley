// ============================================================================
// File: frontend/app/api/bets/public/route.ts
// Database-first public bets API
// Purpose: Fast, reliable public bet listings without blockchain dependencies
// ============================================================================

import { NextRequest } from 'next/server'
import { createServerSupabaseClient, checkRateLimit } from '@/lib/supabase'
import { getClientIP } from '@/lib/utils/request'

// Helper function to format time remaining (removed - not used in unified format)

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Rate limiting for public endpoint
    const clientIp = getClientIP(request)
    const rateLimitOk = await checkRateLimit(clientIp, 'public-bets', 100, 60)
    if (!rateLimitOk) {
      return Response.json(
        { error: 'Rate limit exceeded. Please try again later.' }, 
        { status: 429 }
      )
    }

    // ✅ Parse query parameters for pagination
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100) // Max 100
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)

    const supabase = createServerSupabaseClient()

    // ✅ DATABASE-FIRST: Query only public bets with all needed data
    const { data: publicBets, error } = await supabase
      .from('bet_mappings')
      .select(`
        random_id,
        bet_name,
        bet_options,
        creator_address,
        created_at,
        is_public,
        end_time,
        resolved,
        winning_option,
        total_amounts
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to fetch public bets' }, 
        { status: 500 }
      )
    }

    // ✅ Transform data to match private bets format (unified component compatibility)
    const transformedBets = (publicBets || []).map(bet => {
      return {
        // ✅ SECURITY: NO numeric_id for public bets (prevent enumeration)
        randomId: bet.random_id,
        name: bet.bet_name,
        options: bet.bet_options || [],
        creator: bet.creator_address, // ✅ Full address (no hiding needed per requirements)
        endTime: bet.end_time || 0, // ✅ Unix timestamp as number (matches private format)
        resolved: bet.resolved || false,
        winningOption: bet.winning_option || 0,
        totalAmounts: bet.total_amounts || [],
        // ✅ Public bet specific fields
        userRole: null, // ✅ No user role for public view
        userTotalBet: 0, // ✅ No user data for public view
        isPublic: true, // ✅ Always true for public bets
        createdAt: bet.created_at // ✅ Additional metadata
      }
    })

    // ✅ Filter to show only active bets (not ended) 
    const now = Math.floor(Date.now() / 1000) // Convert to Unix timestamp
    const activeBets = transformedBets.filter(bet => {
      return bet.endTime > now
    })

    return Response.json(
      { 
        bets: activeBets,
        count: activeBets.length,
        hasMore: activeBets.length === limit,
        source: 'database' // Indicates this is database-only (vs blockchain hybrid)
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=120', // Can cache public data
          'X-Content-Type-Options': 'nosniff'
        }
      }
    )

  } catch (error) {
    console.error('Public bets API error:', error)
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}