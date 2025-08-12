import { NextRequest } from 'next/server'
import { supabase, checkRateLimit } from '@/lib/supabase'
import { parseAuthHeader, verifyWalletSignature } from '@/lib/auth/verifySignature'

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) return forwarded.split(',')[0].trim()
  if (vercelIP) return vercelIP.split(',')[0].trim()
  
  return '127.0.0.1'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    // ✅ SECURITY: Rate limiting
    const clientIp = getClientIP(request)
    const rateLimitOk = await checkRateLimit(clientIp, 'user-stats', 100, 60)
    if (!rateLimitOk) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Await the params promise (Next.js 15+ requirement)
    const { address } = await params
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return Response.json({ error: 'Invalid address format' }, { status: 400 })
    }
    
    const normalizedAddress = address.toLowerCase()

    // ✅ SECURITY: Verify wallet signature authentication
    const authHeader = request.headers.get('authorization')
    console.debug('[UserStats API] Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.debug('[UserStats API] No auth header provided')
      return Response.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    const authData = parseAuthHeader(authHeader)
    console.debug('[UserStats API] Auth data parsed:', !!authData, authData ? { address: authData.address.slice(0, 8), timestamp: authData.timestamp } : null)
    
    if (!authData) {
      console.debug('[UserStats API] Failed to parse auth header')
      return Response.json({ 
        error: 'Invalid authentication format',
        code: 'AUTH_INVALID_FORMAT'
      }, { status: 401 })
    }

    // Verify the signature matches the requested address
    if (authData.address.toLowerCase() !== normalizedAddress) {
      console.debug('[UserStats API] Address mismatch:', { authAddress: authData.address.slice(0, 8), requestedAddress: normalizedAddress.slice(0, 8) })
      return Response.json({ 
        error: 'Authentication address mismatch',
        code: 'AUTH_ADDRESS_MISMATCH'
      }, { status: 403 })
    }

    // Verify the signature is valid
    console.debug('[UserStats API] Verifying signature for:', authData.address.slice(0, 8))
    const isValidSignature = await verifyWalletSignature(
      authData.address,
      authData.signature,
      authData.timestamp,
      authData.nonce
    )

    console.debug('[UserStats API] Signature verification result:', isValidSignature)
    if (!isValidSignature) {
      return Response.json({ 
        error: 'Invalid or expired signature',
        code: 'AUTH_SIGNATURE_INVALID'
      }, { status: 401 })
    }
    
    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('wallet_address', normalizedAddress)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error
    }
    
    // Return stats or defaults if user not found
    return Response.json({
      wallet_address: normalizedAddress,
      bets_created: stats?.bets_created || 0,
      total_volume_created: stats?.total_volume_created || '0',
      total_volume_bet: stats?.total_volume_bet || '0',
      unique_wallets_attracted: stats?.unique_wallets_attracted || 0,
      last_updated: stats?.last_updated || null
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 minutes cache for authenticated data
        'X-Content-Type-Options': 'nosniff'
      }
    })
    
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return Response.json({ 
      error: 'Failed to fetch user stats' 
    }, { status: 500 })
  }
}