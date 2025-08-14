-- ============================================================================
-- Database Function: update_bet_totals()
-- Efficiently calculates and updates bet_mappings.total_amounts from user_activities
-- This function ensures real-time pool totals after bet placement
-- ============================================================================

CREATE OR REPLACE FUNCTION update_bet_totals(bet_id_param INTEGER)
RETURNS void AS $$
DECLARE
    bet_option_count INTEGER;
BEGIN
    -- Get the option count for this bet
    SELECT option_count INTO bet_option_count
    FROM bet_mappings 
    WHERE numeric_id = bet_id_param;
    
    -- If bet doesn't exist, exit early
    IF bet_option_count IS NULL THEN
        RAISE NOTICE 'Bet with ID % not found', bet_id_param;
        RETURN;
    END IF;
    
    -- Update total_amounts by calculating sums for each option
    UPDATE bet_mappings 
    SET 
        total_amounts = (
            SELECT json_agg(COALESCE(option_total, '0') ORDER BY option_idx)
            FROM generate_series(0, bet_option_count - 1) AS option_idx
            LEFT JOIN (
                SELECT 
                    option_index, 
                    SUM(amount)::text as option_total
                FROM user_activities 
                WHERE bet_id = bet_id_param 
                  AND activity_type = 'bet'
                  AND option_index IS NOT NULL
                GROUP BY option_index
            ) totals ON option_idx = totals.option_index
        ),
        updated_at = NOW()
    WHERE numeric_id = bet_id_param;
    
    RAISE NOTICE 'Updated totals for bet %', bet_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION update_bet_totals(INTEGER) TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION update_bet_totals(INTEGER) IS 
'Updates bet_mappings.total_amounts by calculating sums from user_activities. 
Called after bet placement to ensure real-time pool totals.';