// ============================================================================
// File: frontend/app/api/bets/[randomId]/whitelist/route.ts
// Whitelist Management API
// Purpose: CRUD operations for bet whitelist addresses
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { isAddress } from 'viem'

interface RouteParams {
  params: Promise<{ randomId: string }>
}

// ============================================================================
// GET /api/bets/[randomId]/whitelist
// Purpose: Fetch all whitelisted addresses for a specific bet
// ============================================================================
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { randomId } = await context.params

    // 1. Get bet_id from random_id
    const { data: betMapping, error: betError } = await supabase
      .from('bet_mappings')
      .select('id, has_whitelist')
      .eq('random_id', randomId)
      .single()

    if (betError || !betMapping) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    // 2. Fetch whitelist addresses
    const { data: addresses, error: addressError } = await supabase
      .from('bet_whitelist')
      .select('participant_address, added_at, added_by')
      .eq('bet_id', betMapping.id)
      .order('added_at', { ascending: false })

    if (addressError) {
      console.error('Error fetching whitelist addresses:', addressError)
      return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 })
    }

    // 3. Return response
    return NextResponse.json({
      success: true,
      data: {
        hasWhitelist: betMapping.has_whitelist,
        addresses: addresses || []
      }
    })
  } catch (error) {
    console.error('Error in GET /api/bets/[randomId]/whitelist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST /api/bets/[randomId]/whitelist
// Purpose: Add new address(es) to existing bet whitelist
// ============================================================================
export async function POST(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { randomId } = await context.params
    const { addresses, addedBy } = await request.json()

    // 1. Validate inputs
    if (!addresses || !Array.isArray(addresses) || !addedBy) {
      return NextResponse.json({ error: 'Invalid input: addresses array and addedBy required' }, { status: 400 })
    }

    // Validate Ethereum addresses
    for (const addr of addresses) {
      if (!isAddress(addr)) {
        return NextResponse.json({ error: `Invalid Ethereum address: ${addr}` }, { status: 400 })
      }
    }

    if (!isAddress(addedBy)) {
      return NextResponse.json({ error: 'Invalid addedBy address' }, { status: 400 })
    }

    // 2. Get bet_id and verify creator
    const { data: betMapping, error: betError } = await supabase
      .from('bet_mappings')
      .select('id, creator_address')
      .eq('random_id', randomId)
      .single()

    if (betError || !betMapping) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    // 3. Verify caller is creator
    if (betMapping.creator_address.toLowerCase() !== addedBy.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized: Only bet creator can manage whitelist' }, { status: 403 })
    }

    // 4. Prepare whitelist data
    const whitelistData = addresses.map(addr => ({
      bet_id: betMapping.id,
      participant_address: addr.toLowerCase(),
      added_by: addedBy.toLowerCase()
    }))

    // 5. Insert addresses (ignore duplicates using upsert)
    const { data, error: insertError } = await supabase
      .from('bet_whitelist')
      .upsert(whitelistData, { 
        onConflict: 'bet_id,participant_address',
        ignoreDuplicates: true 
      })
      .select()

    if (insertError) {
      console.error('Error inserting whitelist addresses:', insertError)
      return NextResponse.json({ error: 'Failed to add addresses' }, { status: 500 })
    }

    // 6. Update has_whitelist flag
    const { error: updateError } = await supabase
      .from('bet_mappings')
      .update({ has_whitelist: true })
      .eq('id', betMapping.id)

    if (updateError) {
      console.error('Error updating has_whitelist flag:', updateError)
      // Don't fail the request for this, just log it
    }

    return NextResponse.json({ 
      success: true, 
      data: data || [],
      message: `Added ${addresses.length} address(es) to whitelist`
    })
  } catch (error) {
    console.error('Error in POST /api/bets/[randomId]/whitelist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// DELETE /api/bets/[randomId]/whitelist
// Purpose: Remove address from bet whitelist
// ============================================================================
export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { randomId } = await context.params
    const { address, removedBy } = await request.json()

    // 1. Validate inputs
    if (!address || !removedBy) {
      return NextResponse.json({ error: 'Invalid input: address and removedBy required' }, { status: 400 })
    }

    if (!isAddress(address) || !isAddress(removedBy)) {
      return NextResponse.json({ error: 'Invalid Ethereum address format' }, { status: 400 })
    }

    // 2. Get bet_id and verify creator
    const { data: betMapping, error: betError } = await supabase
      .from('bet_mappings')
      .select('id, creator_address')
      .eq('random_id', randomId)
      .single()

    if (betError || !betMapping) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    // 3. Verify caller is creator
    if (betMapping.creator_address.toLowerCase() !== removedBy.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized: Only bet creator can manage whitelist' }, { status: 403 })
    }

    // 4. Remove address from whitelist
    const { error: deleteError } = await supabase
      .from('bet_whitelist')
      .delete()
      .eq('bet_id', betMapping.id)
      .eq('participant_address', address.toLowerCase())

    if (deleteError) {
      console.error('Error removing from whitelist:', deleteError)
      return NextResponse.json({ error: 'Failed to remove address' }, { status: 500 })
    }

    // 5. Check if any addresses remain
    const { data: remainingAddresses, error: countError } = await supabase
      .from('bet_whitelist')
      .select('id')
      .eq('bet_id', betMapping.id)
      .limit(1)

    if (countError) {
      console.error('Error checking remaining addresses:', countError)
      // Don't fail the request, just log it
    }

    // 6. Update has_whitelist flag if no addresses remain
    if (!remainingAddresses || remainingAddresses.length === 0) {
      const { error: updateError } = await supabase
        .from('bet_mappings')
        .update({ has_whitelist: false })
        .eq('id', betMapping.id)

      if (updateError) {
        console.error('Error updating has_whitelist flag:', updateError)
        // Don't fail the request, just log it
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Address removed from whitelist'
    })
  } catch (error) {
    console.error('Error in DELETE /api/bets/[randomId]/whitelist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}