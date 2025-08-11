-- ============================================================================
-- Fix Database Views Security Settings
-- Changes SECURITY DEFINER to SECURITY INVOKER for proper RLS enforcement
-- ============================================================================

-- Drop existing views first
DROP VIEW IF EXISTS active_bets CASCADE;
DROP VIEW IF EXISTS resolved_bets CASCADE;

-- ============================================================================
-- Recreate active_bets view with SECURITY INVOKER
-- ============================================================================
CREATE VIEW active_bets 
WITH (security_invoker = true)
AS
SELECT 
    random_id,
    bet_name,
    bet_options,
    creator_address,
    option_count,
    end_time,
    total_amounts,
    (end_time > EXTRACT(EPOCH FROM NOW())) AS is_active
FROM bet_mappings 
WHERE resolved = false 
AND end_time > EXTRACT(EPOCH FROM NOW());

-- ============================================================================
-- Recreate resolved_bets view with SECURITY INVOKER
-- ============================================================================
CREATE VIEW resolved_bets 
WITH (security_invoker = true)
AS
SELECT 
    random_id,
    bet_name,
    bet_options,
    creator_address,
    winning_option,
    total_amounts,
    end_time
FROM bet_mappings 
WHERE resolved = true;

-- ============================================================================
-- Add comments for documentation
-- ============================================================================
COMMENT ON VIEW active_bets IS 'View of active bets (not yet ended). Uses SECURITY INVOKER for proper RLS enforcement.';
COMMENT ON VIEW resolved_bets IS 'View of resolved bets. Uses SECURITY INVOKER for proper RLS enforcement.';

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Check that views were created with correct security settings
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views 
WHERE viewname IN ('active_bets', 'resolved_bets');

-- Test the views work correctly
SELECT 'active_bets' as view_name, count(*) as row_count FROM active_bets
UNION ALL
SELECT 'resolved_bets' as view_name, count(*) as row_count FROM resolved_bets;

-- ============================================================================
-- Security Notes
-- ============================================================================

/*
SECURITY INVOKER vs SECURITY DEFINER:

- SECURITY DEFINER (problematic): 
  * View executes with permissions of the view creator
  * Bypasses RLS policies of the querying user
  * Security risk - users can access data they shouldn't see

- SECURITY INVOKER (correct):
  * View executes with permissions of the querying user
  * Respects RLS policies and user permissions
  * Secure - users only see data they're authorized to access

The `WITH (security_invoker = true)` option ensures views respect
Row Level Security policies and user permissions.
*/