-- ============================================================================
-- Fix RLS Performance Issues - Complete Solution
-- Addresses both current_setting() re-evaluation and overlapping policies
-- ============================================================================

-- First, let's see all current policies to understand what needs to be cleaned up
SELECT 
    '=== CURRENT RLS POLICIES ===' as info;

SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 1: Clean up ALL existing policies completely
-- ============================================================================

-- Drop ALL existing policies on all tables
DROP POLICY IF EXISTS "user_stats_access_policy" ON user_stats;
DROP POLICY IF EXISTS "Anyone can read user_stats" ON user_stats;
DROP POLICY IF EXISTS "Service role can modify user_stats" ON user_stats;

DROP POLICY IF EXISTS "bet_mappings_access_policy" ON bet_mappings;
DROP POLICY IF EXISTS "Anyone can read bet_mappings" ON bet_mappings;
DROP POLICY IF EXISTS "Service role can insert bet_mappings" ON bet_mappings;
DROP POLICY IF EXISTS "Service role can update bet_mappings" ON bet_mappings;
DROP POLICY IF EXISTS "Service role can delete bet_mappings" ON bet_mappings;
DROP POLICY IF EXISTS "Public read access" ON bet_mappings;

DROP POLICY IF EXISTS "user_activities_access_policy" ON user_activities;
DROP POLICY IF EXISTS "Anyone can read user_activities" ON user_activities;
DROP POLICY IF EXISTS "Service role can insert user_activities" ON user_activities;
DROP POLICY IF EXISTS "Service role can update user_activities" ON user_activities;
DROP POLICY IF EXISTS "Service role can delete user_activities" ON user_activities;

DROP POLICY IF EXISTS "rate_limits_service_policy" ON rate_limits;
DROP POLICY IF EXISTS "Service role rate limits access" ON rate_limits;
DROP POLICY IF EXISTS "Rate limits service access" ON rate_limits;

-- ============================================================================
-- STEP 2: Create optimized policies with subquery pattern
-- ============================================================================

-- user_stats: Optimized single policy
CREATE POLICY "user_stats_optimized_policy" ON user_stats
    FOR ALL
    TO anon, service_role
    USING (
        CASE 
            WHEN (SELECT current_setting('role')) = 'anon' THEN true  -- anon: read all
            WHEN (SELECT current_setting('role')) = 'service_role' THEN true  -- service_role: full access
            ELSE false
        END
    )
    WITH CHECK (
        CASE 
            WHEN (SELECT current_setting('role')) = 'service_role' THEN true  -- only service_role can modify
            ELSE false
        END
    );

-- bet_mappings: Optimized single policy
CREATE POLICY "bet_mappings_optimized_policy" ON bet_mappings
    FOR ALL
    TO anon, service_role
    USING (
        CASE 
            WHEN (SELECT current_setting('role')) = 'anon' THEN 
                -- anon can only read public bets
                is_public = true
            WHEN (SELECT current_setting('role')) = 'service_role' THEN 
                -- service_role can access all bets
                true  
            ELSE false
        END
    )
    WITH CHECK (
        CASE 
            WHEN (SELECT current_setting('role')) = 'service_role' THEN true  -- service_role can modify
            ELSE false  -- anon cannot modify
        END
    );

-- user_activities: Optimized single policy
CREATE POLICY "user_activities_optimized_policy" ON user_activities
    FOR ALL
    TO anon, service_role
    USING (
        CASE 
            WHEN (SELECT current_setting('role')) = 'anon' THEN true  -- anon can read activities
            WHEN (SELECT current_setting('role')) = 'service_role' THEN true  -- service_role full access
            ELSE false
        END
    )
    WITH CHECK (
        CASE 
            WHEN (SELECT current_setting('role')) = 'service_role' THEN true  -- service_role can modify
            ELSE false  -- anon cannot modify
        END
    );

-- rate_limits: Service role only (no anon access needed)
CREATE POLICY "rate_limits_optimized_policy" ON rate_limits
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- STEP 3: Add policy documentation
-- ============================================================================

COMMENT ON POLICY "user_stats_optimized_policy" ON user_stats IS 
'Optimized RLS policy using subquery pattern to prevent current_setting() re-evaluation per row';

COMMENT ON POLICY "bet_mappings_optimized_policy" ON bet_mappings IS 
'Optimized RLS policy: anon reads public bets only, service_role has full access';

COMMENT ON POLICY "user_activities_optimized_policy" ON user_activities IS 
'Optimized RLS policy: anon reads all activities, service_role has full access';

COMMENT ON POLICY "rate_limits_optimized_policy" ON rate_limits IS 
'Service role only policy for rate limiting functionality';

-- ============================================================================
-- STEP 4: Verification - Check final state
-- ============================================================================

SELECT 
    '=== FINAL OPTIMIZED RLS POLICIES ===' as info;

-- Show all policies after cleanup
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual LIKE '%(SELECT current_setting(%' THEN '✅ Optimized (subquery)'
        WHEN qual LIKE '%current_setting(%' THEN '⚠️  Not optimized'
        ELSE '✅ Simple condition'
    END as performance_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table (should be 1 each)
SELECT 
    tablename,
    count(*) as policy_count,
    CASE 
        WHEN count(*) = 1 THEN '✅ Single policy (optimal)'
        WHEN count(*) > 1 THEN '❌ Multiple policies (performance issue)'
        ELSE '❌ No policies'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- STEP 5: Test the optimized policies
-- ============================================================================

-- Test anon role access
SET ROLE anon;
SELECT 'Testing optimized anon role access...' as test_info;

-- These should work
SELECT count(*) as user_stats_count FROM user_stats;
SELECT count(*) as public_bets_count FROM bet_mappings WHERE is_public = true;
SELECT count(*) as activities_count FROM user_activities;

-- Reset role
RESET ROLE;

SELECT 'All RLS policies have been optimized for performance!' as completion_status;

-- ============================================================================
-- Performance Optimization Notes
-- ============================================================================

/*
Key Performance Optimizations Applied:

1. SUBQUERY PATTERN: 
   - Changed: current_setting('role') 
   - To: (SELECT current_setting('role'))
   - Benefit: Evaluated once per query instead of once per row

2. SINGLE POLICY PER TABLE:
   - Eliminated all overlapping policies
   - One comprehensive policy handles all operations
   - Reduces policy evaluation overhead

3. ROLE-SPECIFIC LOGIC:
   - Clear separation between anon and service_role permissions
   - Efficient CASE statements for role-based access

4. MINIMAL POLICY COUNT:
   - Each table has exactly one policy
   - No redundant or conflicting policies

These changes should eliminate all Supabase performance warnings.
*/