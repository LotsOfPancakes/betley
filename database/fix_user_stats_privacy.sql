-- ============================================================================
-- Fix user_stats Privacy Vulnerability
-- SECURITY: Prevent anonymous users from reading all user statistics
-- ============================================================================

-- Current Problem: Anonymous users can read ALL user stats
-- This completely bypasses the authentication system we implemented

SELECT 'Fixing user_stats RLS policy to protect user privacy...' as status;

-- ============================================================================
-- STEP 1: Drop the vulnerable policy
-- ============================================================================

DROP POLICY IF EXISTS "user_stats_optimized_policy" ON user_stats;

-- ============================================================================
-- STEP 2: Create secure policy (no anonymous access to user_stats)
-- ============================================================================

CREATE POLICY "user_stats_secure_policy" ON user_stats
    FOR ALL
    TO anon, service_role
    USING (
        CASE 
            WHEN (SELECT current_setting('role')) = 'anon' THEN false  -- ✅ No anon access
            WHEN (SELECT current_setting('role')) = 'service_role' THEN true  -- Service role: full access
            ELSE false
        END
    )
    WITH CHECK (
        CASE 
            WHEN (SELECT current_setting('role')) = 'service_role' THEN true  -- Only service_role can modify
            ELSE false
        END
    );

-- ============================================================================
-- STEP 3: Update leaderboard endpoint to use service role
-- ============================================================================

-- NOTE: The /api/analytics/leaderboard endpoint will need to be updated
-- to use the service role client instead of the regular client to continue working.
-- This is the correct approach - leaderboard data should be served by the backend
-- with proper anonymization, not directly accessible to frontend clients.

COMMENT ON POLICY "user_stats_secure_policy" ON user_stats IS 
'Secure RLS policy: Anonymous users cannot read user stats. Only service role has access. This forces all user stats access through authenticated API endpoints.';

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

-- Check the policy is correctly applied
SELECT 
    tablename,
    policyname,
    roles,
    cmd,
    CASE 
        WHEN qual LIKE '%anon%THEN false%' THEN '✅ Secure (no anon access)'
        WHEN qual LIKE '%anon%THEN true%' THEN '❌ VULNERABLE (anon can read all)'
        ELSE '? Unknown pattern'
    END as security_status
FROM pg_policies
WHERE tablename = 'user_stats' AND schemaname = 'public';

-- Test anonymous access (should return 0 rows)
SET ROLE anon;
SELECT count(*) as should_be_zero FROM user_stats;
RESET ROLE;

SELECT '✅ user_stats privacy vulnerability has been fixed!' as completion_status;

-- ============================================================================
-- IMPORTANT: Code changes required after running this migration
-- ============================================================================

/*
After running this migration, you need to update:

1. /app/api/analytics/leaderboard/route.ts:
   - Change: import { supabase } from '@/lib/supabase'
   - To: import { supabaseAdmin } from '@/lib/supabase'
   - Change: const { data: leaders, error } = await supabase
   - To: const { data: leaders, error } = await supabaseAdmin

This ensures the leaderboard continues working by using service role access,
while preventing direct frontend access to user stats.
*/