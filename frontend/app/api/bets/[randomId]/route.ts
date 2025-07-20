// frontend/app/api/bets/[randomId]/route.ts - Look up bet mapping API
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ randomId: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // Await the params in Next.js 15
    const { randomId } = await context.params

    // ✅ Essential input validation
    if (!randomId || !randomId.match(/^[A-Za-z0-9]{8}$/)) {
      return Response.json({ error: 'Invalid random ID format' }, { status: 400 })
    }

    // Look up mapping
    const { data, error } = await supabase
      .from('bet_mappings')
      .select('numeric_id')
      .eq('random_id', randomId)
      .single()

    if (error || !data) {
      return Response.json({ numericId: null }, { status: 200 })
    }

    return Response.json({ numericId: data.numeric_id })

  } catch (error) {
    console.error('API lookup error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}