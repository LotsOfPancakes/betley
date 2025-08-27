-- ============================================================================
-- Add Feature Flags Support to bet_mappings table
-- Purpose: Enable bet-specific feature testing without affecting other bets
-- ============================================================================

-- Add feature_flags column with safe default
ALTER TABLE bet_mappings 
ADD COLUMN feature_flags JSONB DEFAULT '{}';

-- Add GIN index for efficient JSONB queries
CREATE INDEX CONCURRENTLY idx_bet_mappings_feature_flags 
ON bet_mappings USING GIN (feature_flags);

-- Add comment for documentation
COMMENT ON COLUMN bet_mappings.feature_flags IS 
'JSONB object containing feature flags for bet-specific testing. Example: {"betOutcomes": true, "tooltipBreakdown": false}';

-- ============================================================================
-- Example usage for enabling features on specific bets:
-- ============================================================================

-- Enable BetOutcomes component on a specific test bet:
-- UPDATE bet_mappings 
-- SET feature_flags = '{"betOutcomes": true}' 
-- WHERE random_id = 'your-test-bet-id';

-- Enable multiple features:
-- UPDATE bet_mappings 
-- SET feature_flags = '{"betOutcomes": true, "tooltipBreakdown": true}' 
-- WHERE random_id = 'your-test-bet-id';

-- Disable all features (rollback):
-- UPDATE bet_mappings 
-- SET feature_flags = '{}' 
-- WHERE feature_flags IS NOT NULL;

-- Check current feature flags:
-- SELECT random_id, bet_name, feature_flags 
-- FROM bet_mappings 
-- WHERE feature_flags != '{}';