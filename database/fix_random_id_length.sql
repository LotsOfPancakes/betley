-- Fix random_id constraint to use 8 characters instead of 12
-- This reverts the constraint to the original working length

ALTER TABLE bet_mappings 
DROP CONSTRAINT IF EXISTS bet_mappings_random_id_format;

ALTER TABLE bet_mappings 
ADD CONSTRAINT bet_mappings_random_id_format 
CHECK (LENGTH(random_id) = 8 AND random_id ~ '^[a-zA-Z0-9]+$');