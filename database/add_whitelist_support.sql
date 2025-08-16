-- Add whitelist support to Betley database
-- This adds optional convenience storage for whitelist data
-- The contract remains the source of truth for whitelist enforcement

-- Add has_whitelist column to bet_mappings table
ALTER TABLE bet_mappings 
ADD COLUMN has_whitelist BOOLEAN DEFAULT FALSE;

-- Create bet_whitelist table for storing whitelisted addresses
CREATE TABLE bet_whitelist (
    id SERIAL PRIMARY KEY,
    bet_id INTEGER NOT NULL,
    participant_address TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by TEXT, -- Address of who added this participant
    
    -- Foreign key constraint
    CONSTRAINT fk_bet_whitelist_bet_id 
    FOREIGN KEY (bet_id) 
    REFERENCES bet_mappings(id) 
    ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate entries
    CONSTRAINT unique_bet_participant 
    UNIQUE (bet_id, participant_address)
);

-- Create indexes for performance
CREATE INDEX idx_bet_whitelist_bet_id ON bet_whitelist(bet_id);
CREATE INDEX idx_bet_whitelist_participant ON bet_whitelist(participant_address);
CREATE INDEX idx_bet_whitelist_added_at ON bet_whitelist(added_at);

-- Add RLS (Row Level Security) policies for bet_whitelist table
ALTER TABLE bet_whitelist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access for all authenticated users
CREATE POLICY "bet_whitelist_read_policy" ON bet_whitelist
    FOR SELECT
    USING (true);

-- Policy: Allow insert/update/delete for service role only
CREATE POLICY "bet_whitelist_write_policy" ON bet_whitelist
    FOR ALL
    USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE bet_whitelist IS 'Convenience storage for bet whitelist participants. Contract is source of truth.';
COMMENT ON COLUMN bet_whitelist.bet_id IS 'References bet_mappings.id (internal bet ID)';
COMMENT ON COLUMN bet_whitelist.participant_address IS 'Ethereum address of whitelisted participant';
COMMENT ON COLUMN bet_whitelist.added_by IS 'Address of who added this participant (usually bet creator)';

-- Add comment to new column
COMMENT ON COLUMN bet_mappings.has_whitelist IS 'Convenience flag - true if bet has whitelist enabled';