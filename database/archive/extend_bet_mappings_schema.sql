-- ============================================================================
-- Database Migration: Extend bet_mappings table for Phase 2 implementation
-- Purpose: Add bet details to eliminate RPC rate limiting on /bets page
-- ============================================================================

-- Add columns for bet details (from blockchain data)
ALTER TABLE bet_mappings 
ADD COLUMN IF NOT EXISTS bet_options TEXT[], -- Array of betting options
ADD COLUMN IF NOT EXISTS end_time BIGINT, -- Unix timestamp for bet end time
ADD COLUMN IF NOT EXISTS total_amounts BIGINT[], -- Array of total amounts per option
ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE, -- Whether bet is resolved
ADD COLUMN IF NOT EXISTS winning_option INTEGER, -- Index of winning option (null if unresolved)
ADD COLUMN IF NOT EXISTS cached_at TIMESTAMP DEFAULT NOW(); -- When data was last cached

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bet_mappings_creator_address ON bet_mappings(creator_address);
CREATE INDEX IF NOT EXISTS idx_bet_mappings_end_time ON bet_mappings(end_time);
CREATE INDEX IF NOT EXISTS idx_bet_mappings_resolved ON bet_mappings(resolved);
CREATE INDEX IF NOT EXISTS idx_bet_mappings_cached_at ON bet_mappings(cached_at);

-- Add comments for documentation
COMMENT ON COLUMN bet_mappings.bet_options IS 'Array of betting option names from blockchain';
COMMENT ON COLUMN bet_mappings.end_time IS 'Unix timestamp when bet ends (from blockchain)';
COMMENT ON COLUMN bet_mappings.total_amounts IS 'Array of total bet amounts per option (from blockchain)';
COMMENT ON COLUMN bet_mappings.resolved IS 'Whether the bet has been resolved';
COMMENT ON COLUMN bet_mappings.winning_option IS 'Index of winning option (0-based, null if unresolved)';
COMMENT ON COLUMN bet_mappings.cached_at IS 'Timestamp when blockchain data was last synced';

-- Verify the schema changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bet_mappings' 
ORDER BY ordinal_position;