// ============================================================================
// File: frontend/app/api/bets/resolve/route.ts
// Real-time bet resolution tracking API
// ============================================================================

import { NextRequest } from 'next/server'
import { trackBetResolution } from '@/lib/analytics/activityTracker'

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) return forwarded.split(',')[0].trim()
  if (vercelIP) return vercelIP.split(',')[0].trim()
  
  return '127.0.0.1'
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for logging
    const clientIp = getClientIP(request)

    // Validate content type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return Response.json(
        { error: 'Invalid content type' }, 
        { status: 400 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { error: 'Invalid JSON payload' }, 
        { status: 400 }
      )
    }

    const { betId, resolverAddress, winningOption, txHash } = body

    console.log('Bet resolution tracking request:', { betId, resolverAddress, winningOption, txHash, clientIp })

    // Basic validation
    if (typeof betId !== 'number' || betId < 0) {
      return Response.json({ error: 'Invalid bet ID' }, { status: 400 })
    }

    if (!resolverAddress || typeof resolverAddress !== 'string') {
      return Response.json({ error: 'Invalid resolver address' }, { status: 400 })
    }

    if (typeof winningOption !== 'number' || winningOption < 0) {
      return Response.json({ error: 'Invalid winning option' }, { status: 400 })
    }

    if (!txHash || typeof txHash !== 'string') {
      return Response.json({ error: 'Invalid transaction hash' }, { status: 400 })
    }

    // Track bet resolution activity
    await trackBetResolution(resolverAddress, betId, winningOption, txHash)

    console.log(`Successfully tracked bet resolution: ${resolverAddress} resolved bet ${betId} with option ${winningOption}`)

    // Return success response
    return Response.json({ 
      success: true,
      message: 'Bet resolution tracked successfully'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('Bet resolution tracking error:', error)
    
    // Return error but don't expose internal details
    return Response.json(
      { error: 'Failed to track bet resolution' }, 
      { status: 500 }
    )
  }
}