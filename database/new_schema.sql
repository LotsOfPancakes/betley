-- ============================================================================
-- New Privacy-Focused Database Schema for Betley
-- This schema supports the new architecture where sensitive data is stored
-- in the database rather than on the blockchain
-- ============================================================================

-- Drop existing tables to start fresh (since all data is test data)
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS bet_mappings CASCADE;
DROP TABLE IF EXISTS bet_participants CASCADE;

-- ============================================================================
-- Core bet_mappings table - stores ALL bet details
-- ============================================================================
CREATE TABLE bet_mappings (
    id SERIAL PRIMARY KEY,
    
    -- URL mapping (the core privacy mechanism)
    random_id TEXT UNIQUE NOT NULL,        -- Secret key like "abc123xyz"
    numeric_id INTEGER UNIQUE NOT NULL,    -- Blockchain bet ID (0, 1, 2, ...)
    
    -- Sensitive data (stored here, NOT on blockchain)
    bet_name TEXT NOT NULL,                -- "Will Bitcoin hit $100k by end of year?"
    bet_description TEXT,                  -- Detailed explanation, criteria, etc.
    bet_options JSONB NOT NULL,            -- ["Yes", "No"] or ["Option A", "Option B", "Option C"]
    
    -- Creator information
    creator_address TEXT NOT NULL,         -- Wallet address of bet creator
    
    -- Bet configuration
    option_count INTEGER NOT NULL,         -- 2, 3, or 4 (matches blockchain)
    token_address TEXT NOT NULL,           -- Token used for betting
    
    -- Timing
    end_time BIGINT NOT NULL,              -- When betting ends (Unix timestamp)
    created_at TIMESTAMP DEFAULT NOW(),    -- When bet was created
    
    -- Cached blockchain data (for performance - updated by sync process)
    resolved BOOLEAN DEFAULT false,        -- Whether bet is resolved
    winning_option INTEGER,                -- Index of winning option (if resolved)
    total_amounts JSONB,                   -- [amount1, amount2, ...] - cached from blockchain
    resolution_deadline BIGINT,            -- Cached from blockchain
    updated_at TIMESTAMP DEFAULT NOW(),    -- Last cache update
    
    -- Constraints
    CONSTRAINT bet_mappings_option_count_check CHECK (option_count >= 2 AND option_count <= 4),
    CONSTRAINT bet_mappings_bet_name_length CHECK (LENGTH(bet_name) > 0 AND LENGTH(bet_name) <= 200),
    CONSTRAINT bet_mappings_random_id_format CHECK (LENGTH(random_id) = 12 AND random_id ~ '^[a-zA-Z0-9]+$')
);

-- Indexes for performance
CREATE INDEX idx_bet_mappings_random_id ON bet_mappings(random_id);
CREATE INDEX idx_bet_mappings_numeric_id ON bet_mappings(numeric_id);
CREATE INDEX idx_bet_mappings_creator ON bet_mappings(creator_address);
CREATE INDEX idx_bet_mappings_end_time ON bet_mappings(end_time);
CREATE INDEX idx_bet_mappings_resolved ON bet_mappings(resolved);

-- ============================================================================
-- User activities table - tracks all betting actions
-- ============================================================================
CREATE TABLE user_activities (
    id SERIAL PRIMARY KEY,
    
    -- User identification
    wallet_address TEXT NOT NULL,          -- User's wallet address
    
    -- Activity details
    activity_type TEXT NOT NULL,           -- 'create', 'bet', 'resolve', 'claim'
    bet_id INTEGER NOT NULL,               -- References bet_mappings.numeric_id
    
    -- Betting specific data
    option_index INTEGER,                  -- Which option they bet on (for 'bet' activities)
    amount BIGINT,                         -- Amount in wei (for 'bet' activities)
    
    -- Metadata
    transaction_hash TEXT,                 -- Blockchain transaction hash
    block_number BIGINT,                   -- Block number
    created_at TIMESTAMP DEFAULT NOW(),    -- When activity occurred
    
    -- Constraints
    CONSTRAINT user_activities_activity_type_check CHECK (activity_type IN ('create', 'bet', 'resolve', 'claim')),
    CONSTRAINT user_activities_bet_amount_check CHECK (
        (activity_type = 'bet' AND amount > 0) OR 
        (activity_type != 'bet')
    )
);

-- Indexes for performance
CREATE INDEX idx_user_activities_wallet ON user_activities(wallet_address);
CREATE INDEX idx_user_activities_bet_id ON user_activities(bet_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

-- ============================================================================
-- User stats table - aggregated statistics
-- ============================================================================
CREATE TABLE user_stats (
    id SERIAL PRIMARY KEY,
    
    -- User identification
    wallet_address TEXT UNIQUE NOT NULL,   -- User's wallet address
    
    -- Statistics
    bets_created INTEGER DEFAULT 0,        -- Number of bets created
    total_volume_bet BIGINT DEFAULT 0,      -- Total amount bet by user (in wei)
    total_volume_created BIGINT DEFAULT 0, -- Total volume on bets they created
    unique_wallets_attracted INTEGER DEFAULT 0, -- Unique participants on their bets
    
    -- Metadata
    first_activity_at TIMESTAMP,           -- When user first used the platform
    last_activity_at TIMESTAMP,            -- Most recent activity
    last_updated TIMESTAMP DEFAULT NOW(),  -- When stats were last calculated
    
    -- Constraints
    CONSTRAINT user_stats_non_negative CHECK (
        bets_created >= 0 AND 
        total_volume_bet >= 0 AND 
        total_volume_created >= 0 AND 
        unique_wallets_attracted >= 0
    )
);

-- Index for performance
CREATE INDEX idx_user_stats_wallet ON user_stats(wallet_address);

-- ============================================================================
-- Rate limiting table - for API protection
-- ============================================================================
CREATE TABLE rate_limits (
    id SERIAL PRIMARY KEY,
    
    -- Rate limiting key (IP address or user identifier)
    key_hash TEXT NOT NULL,               -- Hashed key for privacy
    action_type TEXT NOT NULL,            -- 'create-bet', 'lookup-bet', etc.
    
    -- Rate limiting data
    request_count INTEGER DEFAULT 1,      -- Number of requests in current window
    window_start TIMESTAMP DEFAULT NOW(), -- Start of current rate limit window
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(key_hash, action_type)
);

-- Index for performance
CREATE INDEX idx_rate_limits_key_action ON rate_limits(key_hash, action_type);
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);

-- ============================================================================
-- Functions and triggers
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on bet_mappings
CREATE TRIGGER update_bet_mappings_updated_at 
    BEFORE UPDATE ON bet_mappings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at on rate_limits
CREATE TRIGGER update_rate_limits_updated_at 
    BEFORE UPDATE ON rate_limits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Sample data for testing (optional)
-- ============================================================================

-- Insert a sample bet for testing
-- INSERT INTO bet_mappings (
--     random_id, numeric_id, bet_name, bet_description, bet_options,
--     creator_address, option_count, token_address, end_time
-- ) VALUES (
--     'abc123xyz789', 0, 'Will Bitcoin hit $100k by end of 2024?',
--     'This bet resolves to YES if Bitcoin (BTC) reaches $100,000 USD on any major exchange by December 31, 2024.',
--     '["Yes", "No"]', '0x1234567890123456789012345678901234567890',
--     2, '0x0000000000000000000000000000000000000000',
--     EXTRACT(EPOCH FROM NOW() + INTERVAL '7 days')::BIGINT
-- );

-- ============================================================================
-- Views for common queries
-- ============================================================================

-- View for active bets (not yet ended)
CREATE VIEW active_bets AS
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

-- View for resolved bets
CREATE VIEW resolved_bets AS
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
-- Permissions (adjust based on your setup)
-- ============================================================================

-- Grant permissions to your application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE bet_mappings IS 'Core table storing all bet details. The random_id is the secret key that provides access to bet information.';
COMMENT ON COLUMN bet_mappings.random_id IS 'Secret 12-character key used in URLs. This is the primary privacy mechanism.';
COMMENT ON COLUMN bet_mappings.numeric_id IS 'Sequential bet ID used on the blockchain. Maps to contract bet IDs.';
COMMENT ON COLUMN bet_mappings.bet_name IS 'Human-readable bet title. Stored here for privacy, not on blockchain.';
COMMENT ON COLUMN bet_mappings.bet_options IS 'JSON array of betting options like ["Yes", "No"]. Stored here for privacy.';

COMMENT ON TABLE user_activities IS 'Tracks all user actions for analytics and statistics calculation.';
COMMENT ON TABLE user_stats IS 'Aggregated user statistics calculated from user_activities.';
COMMENT ON TABLE rate_limits IS 'Rate limiting data to prevent API abuse.';

-- ============================================================================
-- Schema complete
-- ============================================================================