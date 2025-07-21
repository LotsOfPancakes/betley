// frontend/app/api/bets/user-mappings/route.ts - NEW: Batch API for user bet mappings
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, maxBetId } = body

    // Validate inputs
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return Response.json({ error: 'Invalid address' }, { status: 400 })
    }

    if (typeof maxBetId !== 'number' || maxBetId < 0 || maxBetId > 10000) {
      return Response.json({ error: 'Invalid maxBetId' }, { status: 400 })
    }

    // ✅ OPTIMIZATION: Single query to get all user's bet mappings
    const { data, error } = await supabase
      .from('bet_mappings')
      .select('numeric_id, random_id')
      .lte('numeric_id', maxBetId)
      .or(`creator_address.eq.${address}`) // Only bets this user created or can access
      .order('numeric_id')

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Database query failed' }, { status: 500 })
    }

    // ✅ Convert to lookup object: { numericId: randomId }
    const mappings: Record<number, string> = {}
    
    if (data) {
      for (const mapping of data) {
        mappings[mapping.numeric_id] = mapping.random_id
      }
    }

    return Response.json({ 
      mappings,
      count: Object.keys(mappings).length
    })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ✅ Alternative: If you want ALL mappings (not user-specific)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const maxBetId = parseInt(url.searchParams.get('maxBetId') || '100')

    if (maxBetId < 0 || maxBetId > 10000) {
      return Response.json({ error: 'Invalid maxBetId' }, { status: 400 })
    }

    // Get all mappings up to maxBetId
    const { data, error } = await supabase
      .from('bet_mappings')
      .select('numeric_id, random_id')
      .lte('numeric_id', maxBetId)
      .order('numeric_id')

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Database query failed' }, { status: 500 })
    }

    // Convert to lookup object
    const mappings: Record<number, string> = {}
    
    if (data) {
      for (const mapping of data) {
        mappings[mapping.numeric_id] = mapping.random_id
      }
    }

    return Response.json({ 
      mappings,
      count: Object.keys(mappings).length
    })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}