-- ============================================================================
-- Fix Overlapping RLS Policies
-- Consolidates multiple permissive policies to avoid performance issues
-- ============================================================================

-- First, let's see what policies currently exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- Fix user_stats table policies
-- ============================================================================

-- Drop existing overlapping policies on user_stats
DROP POLICY IF EXISTS "Anyone can read user_stats" ON user_stats;
DROP POLICY IF EXISTS "Service role can modify user_stats" ON user_stats;

-- Create a single, comprehensive policy for user_stats
-- This policy allows:
-- - anon role: SELECT only (public read access)
-- - service_role: ALL operations (full access for API operations)
CREATE POLICY "user_stats_access_policy" ON user_stats
    FOR ALL
    TO anon, service_role
    USING (
        CASE 
            WHEN current_setting('role') = 'anon' THEN true  -- anon can read all
            WHEN current_setting('role') = 'service_role' THEN true  -- service_role can do everything
            ELSE false
        END
    )
    WITH CHECK (
        CASE 
            WHEN current_setting('role') = 'service_role' THEN true  -- service_role can modify
            ELSE false  -- anon cannot modify
        END
    );

-- ============================================================================
-- Review and fix other tables with potential policy conflicts
-- ============================================================================

-- Check bet_mappings policies
SELECT 'bet_mappings policies:' as info;
SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'bet_mappings';

-- Check rate_limits policies  
SELECT 'rate_limits policies:' as info;
SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'rate_limits';

-- Check user_activities policies
SELECT 'user_activities policies:' as info;
SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'user_activities';

-- ============================================================================
-- Consolidate bet_mappings policies if needed
-- ============================================================================

-- Drop any overlapping policies on bet_mappings (if they exist)
DROP POLICY IF EXISTS "Anyone can read public bets" ON bet_mappings;
DROP POLICY IF EXISTS "Service role full access" ON bet_mappings;
DROP POLICY IF EXISTS "Public read access" ON bet_mappings;

-- Create single comprehensive policy for bet_mappings
CREATE POLICY "bet_mappings_access_policy" ON bet_mappings
    FOR ALL
    TO anon, service_role
    USING (
        CASE 
            WHEN current_setting('role') = 'anon' THEN 
                -- anon can only read public bets
                is_public = true
            WHEN current_setting('role') = 'service_role' THEN 
                -- service_role can access all bets
                true  
            ELSE false
        END
    )
    WITH CHECK (
        CASE 
            WHEN current_setting('role') = 'service_role' THEN true  -- service_role can modify
            ELSE false  -- anon cannot modify
        END
    );

-- ============================================================================
-- Consolidate rate_limits policies if needed
-- ============================================================================

-- Drop any overlapping policies on rate_limits
DROP POLICY IF EXISTS "Service role rate limits access" ON rate_limits;
DROP POLICY IF EXISTS "Rate limits service access" ON rate_limits;

-- Create single policy for rate_limits (service_role only)
CREATE POLICY "rate_limits_service_policy" ON rate_limits
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Consolidate user_activities policies if needed
-- ============================================================================

-- Drop any overlapping policies on user_activities
DROP POLICY IF EXISTS "Public read user activities" ON user_activities;
DROP POLICY IF EXISTS "Service role user activities" ON user_activities;

-- Create single policy for user_activities
CREATE POLICY "user_activities_access_policy" ON user_activities
    FOR ALL
    TO anon, service_role
    USING (
        CASE 
            WHEN current_setting('role') = 'anon' THEN true  -- anon can read activities
            WHEN current_setting('role') = 'service_role' THEN true  -- service_role full access
            ELSE false
        END
    )
    WITH CHECK (
        CASE 
            WHEN current_setting('role') = 'service_role' THEN true  -- service_role can modify
            ELSE false  -- anon cannot modify
        END
    );

-- ============================================================================
-- Verification - Check final policy state
-- ============================================================================

SELECT 
    '=== FINAL RLS POLICY STATE ===' as report_section;

SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN cmd = 'ALL' THEN '✅ Comprehensive policy'
        ELSE '⚠️  Specific action policy'
    END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table to identify any remaining overlaps
SELECT 
    tablename,
    count(*) as policy_count,
    CASE 
        WHEN count(*) = 1 THEN '✅ Single policy (good)'
        WHEN count(*) > 1 THEN '⚠️  Multiple policies (check for overlaps)'
        ELSE '❌ No policies'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- Test policies work correctly
-- ============================================================================

-- Test that anon can read public data
SET ROLE anon;
SELECT 'Testing anon role access...' as test_info;

-- This should work (reading user_stats)
SELECT count(*) as user_stats_count FROM user_stats;

-- This should work (reading public bets)
SELECT count(*) as public_bets_count FROM bet_mappings WHERE is_public = true;

-- Reset role
RESET ROLE;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON POLICY "user_stats_access_policy" ON user_stats IS 
'Consolidated RLS policy: anon can read all user stats, service_role has full access';

COMMENT ON POLICY "bet_mappings_access_policy" ON bet_mappings IS 
'Consolidated RLS policy: anon can read public bets only, service_role has full access';

COMMENT ON POLICY "rate_limits_service_policy" ON rate_limits IS 
'Service role only policy for rate limiting functionality';

COMMENT ON POLICY "user_activities_access_policy" ON user_activities IS 
'Consolidated RLS policy: anon can read activities, service_role has full access';

-- ============================================================================
-- Performance Notes
-- ============================================================================

/*
RLS Policy Performance Best Practices:

1. SINGLE POLICY PER TABLE: Avoid multiple permissive policies for same role/action
2. COMPREHENSIVE POLICIES: Use FOR ALL with USING/WITH CHECK instead of separate policies
3. EFFICIENT CONDITIONS: Use simple, indexed conditions in policy expressions
4. ROLE-BASED LOGIC: Use current_setting('role') for role-specific access

This consolidation eliminates policy overlaps and improves query performance.
*/