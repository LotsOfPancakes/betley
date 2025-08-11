// ============================================================================
// File: frontend/app/api/bets/sync-resolution/route.ts
// Sync bet resolution status from blockchain to database
// ============================================================================

import { NextRequest } from 'next/server'
import { createServerSupabaseClient, checkRateLimit } from '@/lib/supabase'

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) return forwarded.split(',')[0].trim()
  if (vercelIP) return vercelIP.split(',')[0].trim()
  
  return '127.0.0.1'
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIP(request)
    const rateLimitOk = await checkRateLimit(clientIp, 'sync-resolution', 10, 60)
    if (!rateLimitOk) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Parse request body
    const body = await request.json()
    const { numericId, resolved, winningOption, totalAmounts } = body

    // Validate inputs
    if (typeof numericId !== 'number' || numericId < 0) {
      return Response.json({ error: 'Invalid numeric ID' }, { status: 400 })
    }

    if (typeof resolved !== 'boolean') {
      return Response.json({ error: 'Invalid resolved status' }, { status: 400 })
    }

    if (resolved && (typeof winningOption !== 'number' || winningOption < 0)) {
      return Response.json({ error: 'Invalid winning option' }, { status: 400 })
    }

    if (!Array.isArray(totalAmounts)) {
      return Response.json({ error: 'Invalid total amounts' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Update the bet_mappings table with resolution data
    const updateData: Record<string, unknown> = {
      resolved,
      total_amounts: totalAmounts,
      updated_at: new Date().toISOString()
    }

    if (resolved) {
      updateData.winning_option = winningOption
    }

    const { error: updateError } = await supabase
      .from('bet_mappings')
      .update(updateData)
      .eq('numeric_id', numericId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return Response.json({ error: 'Failed to update database' }, { status: 500 })
    }

    return Response.json({ 
      success: true,
      message: `Bet ${numericId} resolution status synced to database`
    })

  } catch (error) {
    console.error('Sync resolution API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}