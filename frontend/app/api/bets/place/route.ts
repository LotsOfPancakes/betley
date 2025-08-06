// ============================================================================
// File: frontend/app/api/bets/place/route.ts
// Real-time bet placement tracking API
// ============================================================================

import { NextRequest } from 'next/server'
import { trackBetPlacement } from '@/lib/analytics/activityTracker'

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

    const { betId, userAddress, amount, txHash } = body

    console.log('Bet placement tracking request:', { betId, userAddress, amount, txHash, clientIp })

    // Basic validation
    if (typeof betId !== 'number' || betId < 0) {
      return Response.json({ error: 'Invalid bet ID' }, { status: 400 })
    }

    if (!userAddress || typeof userAddress !== 'string') {
      return Response.json({ error: 'Invalid user address' }, { status: 400 })
    }

    if (!amount || typeof amount !== 'string' || amount === '0') {
      return Response.json({ error: 'Invalid bet amount' }, { status: 400 })
    }

    if (!txHash || typeof txHash !== 'string') {
      return Response.json({ error: 'Invalid transaction hash' }, { status: 400 })
    }

    // Track bet placement activity
    await trackBetPlacement(userAddress, betId, amount, txHash)

    console.log(`Successfully tracked bet placement: User ${userAddress} bet ${amount} on bet ${betId}`)

    // Return success response
    return Response.json({ 
      success: true,
      message: 'Bet placement tracked successfully'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('Bet placement tracking error:', error)
    
    // Return error but don't expose internal details
    return Response.json(
      { error: 'Failed to track bet placement' }, 
      { status: 500 }
    )
  }
}