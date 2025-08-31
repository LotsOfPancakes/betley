-- ============================================================================
-- Add Telegram Auto-Delete Support to Betley Database
-- Purpose: Store Telegram message IDs for auto-deletion after bet creation
-- ============================================================================

-- Add telegram_setup_message_id column to bet_mappings table
ALTER TABLE bet_mappings ADD COLUMN IF NOT EXISTS telegram_setup_message_id TEXT;

-- Add index for efficient lookups during deletion
CREATE INDEX IF NOT EXISTS idx_bet_mappings_telegram_message_id ON bet_mappings(telegram_setup_message_id) WHERE telegram_setup_message_id IS NOT NULL;

-- Add documentation comments
COMMENT ON COLUMN bet_mappings.telegram_setup_message_id IS 'Telegram message ID of the setup message to be deleted after successful bet creation';

-- ============================================================================
-- Verification queries (uncomment to test after running)
-- ============================================================================

-- Check if column was added successfully
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'bet_mappings' 
-- AND column_name = 'telegram_setup_message_id';

-- Check if index was created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'bet_mappings' 
-- AND indexname = 'idx_bet_mappings_telegram_message_id';

-- ============================================================================
-- Migration complete
-- ============================================================================