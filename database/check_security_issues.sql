-- ============================================================================
-- Security Audit Script - Check for SECURITY DEFINER Issues
-- ============================================================================

-- Check all views for security settings
SELECT 
    schemaname,
    viewname,
    viewowner,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ SECURITY DEFINER (needs fix)'
        WHEN definition LIKE '%security_invoker%' OR definition LIKE '%SECURITY INVOKER%' THEN '✅ SECURITY INVOKER (good)'
        ELSE '⚠️  Default (check needed)'
    END as security_status,
    definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Check all functions for security settings
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_userbyid(p.proowner) as owner,
    CASE p.prosecdef
        WHEN true THEN '❌ SECURITY DEFINER (needs review)'
        WHEN false THEN '✅ SECURITY INVOKER (good)'
    END as security_status,
    CASE 
        WHEN p.proconfig IS NULL THEN '⚠️  No search_path set (potential risk)'
        WHEN array_to_string(p.proconfig, ', ') LIKE '%search_path=%' THEN 
            '✅ search_path configured: ' || array_to_string(p.proconfig, ', ')
        ELSE '⚠️  Other config: ' || array_to_string(p.proconfig, ', ')
    END as search_path_status,
    p.prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'  -- Only functions, not procedures
ORDER BY p.proname;

-- Check for any RLS policies
SELECT 
    schemaname,
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

-- Check table RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '⚠️  RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- Summary Report
-- ============================================================================
SELECT '=== SECURITY AUDIT SUMMARY ===' as report_section;

SELECT 
    'Views with SECURITY DEFINER issues' as issue_type,
    count(*) as count
FROM pg_views 
WHERE schemaname = 'public' 
AND definition LIKE '%SECURITY DEFINER%';

SELECT 
    'Functions with SECURITY DEFINER' as issue_type,
    count(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true
AND p.prokind = 'f';

SELECT 
    'Functions with search_path issues' as issue_type,
    count(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
AND (p.proconfig IS NULL OR NOT array_to_string(p.proconfig, ', ') LIKE '%search_path=%');

SELECT 
    'Tables without RLS' as issue_type,
    count(*) as count
FROM pg_tables 
WHERE schemaname = 'public'
AND NOT rowsecurity;

-- Check for overlapping RLS policies (performance issue)
SELECT 
    'Tables with overlapping RLS policies' as issue_type,
    count(*) as count
FROM (
    SELECT tablename
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd, string_to_array(roles::text, ',')
    HAVING count(*) > 1
) AS overlap_check;

-- Detailed overlap analysis
SELECT 
    '=== RLS POLICY OVERLAP ANALYSIS ===' as analysis_section;

SELECT 
    tablename,
    cmd as command,
    roles,
    count(*) as policy_count,
    CASE 
        WHEN count(*) > 1 THEN '⚠️  OVERLAP DETECTED'
        ELSE '✅ No overlap'
    END as overlap_status,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd, roles
ORDER BY tablename, cmd;