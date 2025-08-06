-- ============================================================================
-- SQL Function: calculate_user_stats()
-- Recalculates all user statistics from user_activities table
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_user_stats()
RETURNS TABLE(wallet_address text, stats_updated boolean) AS $$
BEGIN
  -- Clear existing stats
  DELETE FROM user_stats;
  
  -- Calculate and insert new stats
  INSERT INTO user_stats (
    wallet_address,
    bets_created,
    total_volume_bet,
    total_volume_created,
    unique_wallets_attracted,
    last_updated
  )
  SELECT 
    a.wallet_address,
    -- Count bets created by this user
    COUNT(*) FILTER (WHERE a.activity_type = 'create') as bets_created,
    
    -- Sum amount bet by this user
    COALESCE(SUM(a.amount::bigint) FILTER (WHERE a.activity_type = 'bet'), 0) as total_volume_bet,
    
    -- Calculate volume created: sum of all bets placed on this user's bets by others
    COALESCE((
      SELECT SUM(b.amount::bigint) 
      FROM user_activities b 
      WHERE b.bet_id IN (
        SELECT bet_id FROM user_activities 
        WHERE wallet_address = a.wallet_address AND activity_type = 'create'
      ) 
      AND b.activity_type = 'bet' 
      AND b.wallet_address != a.wallet_address
    ), 0) as total_volume_created,
    
    -- Count unique wallets attracted: distinct wallets that bet on this user's bets
    COALESCE((
      SELECT COUNT(DISTINCT b.wallet_address)
      FROM user_activities b 
      WHERE b.bet_id IN (
        SELECT bet_id FROM user_activities 
        WHERE wallet_address = a.wallet_address AND activity_type = 'create'
      ) 
      AND b.activity_type = 'bet' 
      AND b.wallet_address != a.wallet_address
    ), 0) as unique_wallets_attracted,
    
    NOW() as last_updated
    
  FROM user_activities a
  GROUP BY a.wallet_address
  HAVING COUNT(*) > 0; -- Only include users with activities
  
  -- Return summary of processed users
  RETURN QUERY
  SELECT us.wallet_address, true as stats_updated
  FROM user_stats us;
  
END;
$$ LANGUAGE plpgsql;