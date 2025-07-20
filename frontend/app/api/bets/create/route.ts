// frontend/app/api/bets/create/route.ts - Create bet mapping API
import { NextRequest } from 'next/server'
import { supabase, generateRandomId } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { numericId, creatorAddress, betName } = body

    // ✅ Essential input validation
    if (typeof numericId !== 'number' || numericId < 0) {
      return Response.json({ error: 'Invalid numeric ID' }, { status: 400 })
    }

    if (!creatorAddress || !creatorAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return Response.json({ error: 'Invalid creator address' }, { status: 400 })
    }

    if (!betName || typeof betName !== 'string' || betName.trim().length === 0) {
      return Response.json({ error: 'Invalid bet name' }, { status: 400 })
    }

    if (betName.length > 100) {
      return Response.json({ error: 'Bet name too long' }, { status: 400 })
    }

    // Check if mapping already exists for this numeric ID
    const { data: existing } = await supabase
      .from('bet_mappings')
      .select('random_id')
      .eq('numeric_id', numericId)
      .single()

    if (existing) {
      return Response.json({ randomId: existing.random_id })
    }

    // Generate unique random ID
    let randomId: string
    let attempts = 0
    do {
      randomId = generateRandomId()
      attempts++
      if (attempts > 10) {
        throw new Error('Unable to generate unique ID')
      }

      const { data: duplicate } = await supabase
        .from('bet_mappings')
        .select('id')
        .eq('random_id', randomId)
        .single()

      if (!duplicate) break
    } while (attempts < 10)

    // Insert new mapping
    const { error } = await supabase
      .from('bet_mappings')
      .insert({
        random_id: randomId,
        numeric_id: numericId,
        creator_address: creatorAddress,
        bet_name: betName.trim()
      })

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Failed to create mapping' }, { status: 500 })
    }

    return Response.json({ randomId })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}