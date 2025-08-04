// Temporary endpoint to see all bets in database for debugging
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get all bet mappings to see what's in the database
    const { data: allBets, error } = await supabase
      .from('bet_mappings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      bets: allBets || [],
      count: allBets?.length || 0,
      publicBets: allBets?.filter(bet => bet.is_public) || [],
      publicCount: allBets?.filter(bet => bet.is_public).length || 0
    })

  } catch (error) {
    console.error('All bets API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}