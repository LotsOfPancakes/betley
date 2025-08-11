-- ============================================================================
-- Verify RLS Optimization - Check for Supabase Warning Resolution
-- ============================================================================

-- Check 1: Verify no multiple permissive policies exist
SELECT 
    '=== MULTIPLE PERMISSIVE POLICIES CHECK ===' as check_name;

SELECT 
    tablename,
    cmd,
    roles,
    count(*) as policy_count,
    CASE 
        WHEN count(*) = 1 THEN '✅ No overlaps'
        ELSE '❌ OVERLAP DETECTED'
    END as overlap_status,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
AND permissive = 'PERMISSIVE'
GROUP BY tablename, cmd, roles
HAVING count(*) > 1
ORDER BY tablename;

-- If no rows returned above, overlaps are resolved

-- Check 2: Verify current_setting() optimization
SELECT 
    '=== CURRENT_SETTING() OPTIMIZATION CHECK ===' as check_name;

SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%(SELECT current_setting(%' OR with_check LIKE '%(SELECT current_setting(%' THEN 
            '✅ Optimized (subquery pattern)'
        WHEN qual LIKE '%current_setting(%' OR with_check LIKE '%current_setting(%' THEN 
            '❌ NOT OPTIMIZED (re-evaluates per row)'
        ELSE 
            '✅ No current_setting() calls'
    END as optimization_status,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check 3: Policy count per table (should be 1 each)
SELECT 
    '=== POLICY COUNT PER TABLE ===' as check_name;

SELECT 
    tablename,
    count(*) as policy_count,
    CASE 
        WHEN count(*) = 1 THEN '✅ Optimal (single policy)'
        WHEN count(*) = 0 THEN '⚠️  No policies (check if RLS enabled)'
        ELSE '⚠️  Multiple policies (potential performance impact)'
    END as status,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check 4: RLS enabled status
SELECT 
    '=== RLS ENABLED STATUS ===' as check_name;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check 5: Test policy functionality
SELECT 
    '=== POLICY FUNCTIONALITY TEST ===' as check_name;

-- Test anon role
SET ROLE anon;

-- Test user_stats access (should work)
SELECT 'user_stats' as table_name, count(*) as accessible_rows FROM user_stats;

-- Test bet_mappings access (should only show public bets)
SELECT 'bet_mappings (public only)' as table_name, count(*) as accessible_rows 
FROM bet_mappings WHERE is_public = true;

-- Test user_activities access (should work)
SELECT 'user_activities' as table_name, count(*) as accessible_rows FROM user_activities;

-- Test rate_limits access (should fail or return 0 - anon shouldn't access this)
SELECT 'rate_limits (should be 0)' as table_name, 
       CASE 
           WHEN count(*) = 0 THEN '✅ Correctly blocked'
           ELSE '❌ Unexpected access'
       END as access_status
FROM rate_limits;

-- Reset role
RESET ROLE;

-- Check 6: Summary report
SELECT 
    '=== OPTIMIZATION SUMMARY ===' as summary;

-- Count tables with potential issues
WITH policy_analysis AS (
    SELECT 
        tablename,
        count(*) as policy_count,
        bool_or(qual LIKE '%current_setting(%' AND qual NOT LIKE '%(SELECT current_setting(%') as has_unoptimized_current_setting
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
),
overlap_analysis AS (
    SELECT 
        tablename,
        cmd,
        roles,
        count(*) as overlapping_policies
    FROM pg_policies
    WHERE schemaname = 'public'
    AND permissive = 'PERMISSIVE'
    GROUP BY tablename, cmd, roles
    HAVING count(*) > 1
)
SELECT 
    'Tables with multiple policies' as issue_type,
    count(*) as count
FROM policy_analysis
WHERE policy_count > 1

UNION ALL

SELECT 
    'Tables with unoptimized current_setting()' as issue_type,
    count(*) as count
FROM policy_analysis
WHERE has_unoptimized_current_setting = true

UNION ALL

SELECT 
    'Tables with overlapping policies' as issue_type,
    count(*) as count
FROM overlap_analysis;

-- Final status
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_policies p1, pg_policies p2 
            WHERE p1.schemaname = 'public' AND p2.schemaname = 'public'
            AND p1.tablename = p2.tablename 
            AND p1.cmd = p2.cmd 
            AND p1.roles = p2.roles
            AND p1.policyname != p2.policyname
            AND p1.permissive = 'PERMISSIVE' AND p2.permissive = 'PERMISSIVE'
        ) AND NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public'
            AND (qual LIKE '%current_setting(%' AND qual NOT LIKE '%(SELECT current_setting(%')
        ) THEN '🎉 ALL SUPABASE WARNINGS SHOULD BE RESOLVED!'
        ELSE '⚠️  Some issues may remain - check details above'
    END as final_status;