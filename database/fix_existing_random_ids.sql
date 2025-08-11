-- Fix existing random IDs that are 12 characters long
-- First, let's see what we have
SELECT random_id, LENGTH(random_id) as id_length FROM bet_mappings;

-- Update any 12-character IDs to 8-character IDs
-- We'll truncate them to 8 characters for now
UPDATE bet_mappings 
SET random_id = LEFT(random_id, 8)
WHERE LENGTH(random_id) = 12;

-- Now apply the constraint
ALTER TABLE bet_mappings 
DROP CONSTRAINT IF EXISTS bet_mappings_random_id_format;

ALTER TABLE bet_mappings 
ADD CONSTRAINT bet_mappings_random_id_format 
CHECK (LENGTH(random_id) = 8 AND random_id ~ '^[a-zA-Z0-9]+$');