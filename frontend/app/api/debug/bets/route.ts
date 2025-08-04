// Temporary debug endpoint to check database content
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get all bet mappings to see what's in the database
    const { data: allBets, error } = await supabase
      .from('bet_mappings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Also check specifically for public bets
    const { data: publicBets, error: publicError } = await supabase
      .from('bet_mappings')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (publicError) {
      return Response.json({ error: publicError.message }, { status: 500 })
    }

    return Response.json({
      allBets: allBets || [],
      publicBets: publicBets || [],
      totalCount: allBets?.length || 0,
      publicCount: publicBets?.length || 0
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}