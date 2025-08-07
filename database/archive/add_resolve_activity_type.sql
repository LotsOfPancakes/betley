-- ============================================================================
-- Database Migration: Add 'resolve' to valid activity types
-- Purpose: Allow bet resolution tracking in user_activities table
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE user_activities 
DROP CONSTRAINT IF EXISTS valid_activity_type;

-- Add the updated constraint that includes 'resolve'
ALTER TABLE user_activities 
ADD CONSTRAINT valid_activity_type 
CHECK (activity_type IN ('create', 'bet', 'resolve'));

-- Verify the constraint was updated
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'valid_activity_type';