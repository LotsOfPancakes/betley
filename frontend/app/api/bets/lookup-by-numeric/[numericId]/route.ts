// frontend/app/api/bets/lookup-by-numeric/[numericId]/route.ts - Reverse lookup for bets list
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ numericId: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // Await the params in Next.js 15
    const { numericId } = await context.params

    // Validate numeric ID
    const numId = parseInt(numericId)
    if (isNaN(numId) || numId < 0) {
      return Response.json({ error: 'Invalid numeric ID' }, { status: 400 })
    }

    // Look up random ID by numeric ID
    const { data, error } = await supabase
      .from('bet_mappings')
      .select('random_id')
      .eq('numeric_id', numId)
      .single()

    if (error || !data) {
      return Response.json({ randomId: null }, { status: 200 })
    }

    return Response.json({ randomId: data.random_id })

  } catch (error) {
    console.error('API reverse lookup error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}