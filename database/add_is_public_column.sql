-- ============================================================================
-- Add is_public column to bet_mappings table
-- This enables public bet discovery while maintaining privacy for private bets
-- ============================================================================

-- Add the is_public column with default false (all existing bets remain private)
ALTER TABLE bet_mappings 
ADD COLUMN is_public BOOLEAN DEFAULT false NOT NULL;

-- Add index for performance on public bet queries
CREATE INDEX idx_bet_mappings_is_public ON bet_mappings(is_public);

-- Add comment for documentation
COMMENT ON COLUMN bet_mappings.is_public IS 'Whether this bet should appear in public listings. Default false for privacy.';

-- ============================================================================
-- Optional: Make some existing bets public for testing
-- ============================================================================

-- Uncomment the following line to make all existing bets public for testing:
-- UPDATE bet_mappings SET is_public = true;

-- Or make only specific bets public:
-- UPDATE bet_mappings SET is_public = true WHERE random_id IN ('abc123', 'def456');

-- ============================================================================
-- Verification query
-- ============================================================================

-- Check that the column was added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bet_mappings' AND column_name = 'is_public';