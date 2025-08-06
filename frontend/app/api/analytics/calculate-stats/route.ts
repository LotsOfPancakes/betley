import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: activities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('*');

    if (activitiesError) {
      throw activitiesError;
    }

    const userStats = new Map();

    for (const activity of activities) {
      if (!userStats.has(activity.user_address)) {
        userStats.set(activity.user_address, {
          user_address: activity.user_address,
          bets_created: 0,
          total_amount_bet: 0,
          total_volume_generated: 0,
          wallets_attracted: new Set()
        });
      }

      const stats = userStats.get(activity.user_address);

      if (activity.activity_type === 'bet_created') {
        stats.bets_created += 1;
        stats.total_volume_generated += activity.amount || 0;
      } else if (activity.activity_type === 'bet_placed') {
        stats.total_amount_bet += activity.amount || 0;
        stats.wallets_attracted.add(activity.user_address);
      }
    }

    const statsToUpsert = Array.from(userStats.values()).map(stats => ({
      ...stats,
      wallets_attracted: stats.wallets_attracted.size,
      last_updated: new Date().toISOString()
    }));

    const { error: upsertError } = await supabase
      .from('user_stats')
      .upsert(statsToUpsert, { onConflict: 'user_address' });

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ 
      success: true, 
      processed: statsToUpsert.length,
      message: 'User stats calculated successfully' 
    });

  } catch (error) {
    console.error('Error calculating user stats:', error);
    return NextResponse.json(
      { error: 'Failed to calculate user stats' },
      { status: 500 }
    );
  }
}