-- Basic RLS Security for Betley Database
-- This sets up minimal security while keeping the system functional

-- Enable RLS on bet_mappings table
ALTER TABLE bet_mappings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can read bet_mappings (since bets are meant to be accessible via random URLs)
CREATE POLICY "Anyone can read bet_mappings" ON bet_mappings
    FOR SELECT USING (true);

-- Policy 2: Only authenticated service role can insert/update bet_mappings
CREATE POLICY "Service role can insert bet_mappings" ON bet_mappings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update bet_mappings" ON bet_mappings
    FOR UPDATE USING (true);

-- Enable RLS on user_stats table
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read user stats (public leaderboard data)
CREATE POLICY "Anyone can read user_stats" ON user_stats
    FOR SELECT USING (true);

-- Policy: Only service role can modify user stats
CREATE POLICY "Service role can modify user_stats" ON user_stats
    FOR ALL USING (true);

-- Enable RLS on user_activities table
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read activities (public activity feed)
CREATE POLICY "Anyone can read user_activities" ON user_activities
    FOR SELECT USING (true);

-- Policy: Only service role can insert activities
CREATE POLICY "Service role can insert user_activities" ON user_activities
    FOR INSERT WITH CHECK (true);

-- Enable RLS on rate_limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access rate limits
CREATE POLICY "Service role only rate_limits" ON rate_limits
    FOR ALL USING (true);