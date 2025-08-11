-- Safe way to fix resolved bet - check structure first

-- Step 1: Check what columns exist in bet_mappings
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bet_mappings';

-- Step 2: Check current data
SELECT numeric_id, bet_name, resolved, winning_option, updated_at 
FROM bet_mappings 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 3: Update the resolved bet (run this after checking the data above)
-- Replace 'YOUR_BET_ID' with the actual numeric_id from step 2
/*
UPDATE bet_mappings 
SET 
  resolved = true,
  winning_option = 0,
  updated_at = CURRENT_TIMESTAMP
WHERE numeric_id = YOUR_BET_ID;
*/