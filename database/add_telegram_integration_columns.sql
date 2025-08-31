-- ============================================================================
-- Add Telegram Integration Support to Betley Database
-- Purpose: Track bet source (web/telegram) and store Telegram metadata
-- ============================================================================

-- Add source tracking columns to bet_mappings table
ALTER TABLE bet_mappings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';
ALTER TABLE bet_mappings ADD COLUMN IF NOT EXISTS source_metadata JSONB;

-- Add index for source-based queries (for analytics and filtering)
CREATE INDEX IF NOT EXISTS idx_bet_mappings_source ON bet_mappings(source);

-- Add constraint to validate source values (with proper error handling)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bet_mappings_source_check' 
        AND table_name = 'bet_mappings'
    ) THEN
        ALTER TABLE bet_mappings ADD CONSTRAINT bet_mappings_source_check 
        CHECK (source IN ('web', 'telegram'));
    END IF;
END $$;

-- Update existing rows to have default source (all existing bets are from web)
UPDATE bet_mappings SET source = 'web' WHERE source IS NULL;

-- Add documentation comments
COMMENT ON COLUMN bet_mappings.source IS 'Source of bet creation: web (direct website) or telegram (via bot)';
COMMENT ON COLUMN bet_mappings.source_metadata IS 'JSON metadata specific to source - for telegram: {telegram_group_id, telegram_user_id}';

-- Example of source_metadata structure for Telegram bets:
-- {
--   "telegram_group_id": "-1001716557078",
--   "telegram_user_id": "781086902"
-- }

-- ============================================================================
-- Verification queries (uncomment to test after running)
-- ============================================================================

-- Check if columns were added successfully
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'bet_mappings' 
-- AND column_name IN ('source', 'source_metadata');

-- Check if index was created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'bet_mappings' 
-- AND indexname = 'idx_bet_mappings_source';

-- Check if constraint was added
-- SELECT constraint_name, constraint_type, check_clause
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
-- WHERE tc.table_name = 'bet_mappings' 
-- AND tc.constraint_name = 'bet_mappings_source_check';

-- ============================================================================
-- Migration complete
-- ============================================================================