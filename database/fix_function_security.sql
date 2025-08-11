-- ============================================================================
-- Fix Function Security - search_path Issue
-- Fixes the update_updated_at_column function to have a secure search_path
-- ============================================================================

-- Drop and recreate the function with secure search_path
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- Secure version of update_updated_at_column function
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER  -- Use invoker's permissions, not definer's
SET search_path = ''  -- Empty search_path prevents injection attacks
AS $$
BEGIN
    -- Use fully qualified function name to avoid search_path issues
    NEW.updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- Recreate triggers that use this function
-- ============================================================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_bet_mappings_updated_at ON bet_mappings;
DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON rate_limits;

-- Recreate triggers with the secure function
CREATE TRIGGER update_bet_mappings_updated_at 
    BEFORE UPDATE ON bet_mappings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at 
    BEFORE UPDATE ON rate_limits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Add function documentation
-- ============================================================================
COMMENT ON FUNCTION update_updated_at_column() IS 
'Secure trigger function to update updated_at timestamp. Uses empty search_path and SECURITY INVOKER for security.';

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Check function security settings
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_userbyid(p.proowner) as owner,
    CASE p.prosecdef
        WHEN true THEN '❌ SECURITY DEFINER'
        WHEN false THEN '✅ SECURITY INVOKER'
    END as security_mode,
    p.proconfig as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'update_updated_at_column';

-- Check that triggers are working
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND action_statement LIKE '%update_updated_at_column%'
ORDER BY event_object_table;

-- Test the function works by updating a record (if any exist)
-- This will show if the trigger fires correctly
DO $$
DECLARE
    test_record_id INTEGER;
BEGIN
    -- Find a test record to update
    SELECT id INTO test_record_id FROM bet_mappings LIMIT 1;
    
    IF test_record_id IS NOT NULL THEN
        -- Update a non-critical field to trigger the updated_at change
        UPDATE bet_mappings 
        SET bet_name = bet_name  -- No-op update to trigger the function
        WHERE id = test_record_id;
        
        RAISE NOTICE 'Test update completed for record ID: %', test_record_id;
    ELSE
        RAISE NOTICE 'No records found to test with';
    END IF;
END $$;

-- ============================================================================
-- Security Notes
-- ============================================================================

/*
Search Path Security Issue:

PROBLEM:
- Functions with mutable search_path can be exploited
- Attackers can manipulate search_path to redirect function calls
- This can lead to privilege escalation or data manipulation

SOLUTION:
- SET search_path = '' creates an empty, secure search_path
- Use fully qualified names (pg_catalog.now()) instead of unqualified names
- SECURITY INVOKER ensures function runs with caller's permissions
- This prevents search_path injection attacks

The function is now secure against search_path manipulation attacks.
*/