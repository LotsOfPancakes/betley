-- Remove bet_description field from bet_mappings table
-- This field was not part of the original specifications

ALTER TABLE bet_mappings 
DROP COLUMN IF EXISTS bet_description;