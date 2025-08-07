-- ============================================================================
-- DEPRECATED: SQL Function approach replaced with JavaScript API
-- The stats calculation is now handled by /api/analytics/calculate-stats
-- This file is kept for reference but the function should be removed from database
-- ============================================================================

-- To remove the function from your database, run:
-- DROP FUNCTION IF EXISTS calculate_user_stats();

-- The stats calculation is now handled in JavaScript at:
-- /api/analytics/calculate-stats

-- This approach is better because:
-- - Easier to debug and maintain
-- - Better error handling
-- - Version controlled in the codebase
-- - No PostgreSQL function syntax issues