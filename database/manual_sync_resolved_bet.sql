-- Manual sync for resolved bet
-- Update the resolved bet in the database to match blockchain state

-- First, let's see which bets are resolved on blockchain but not in database
SELECT numeric_id, bet_name, resolved, winning_option 
FROM bet_mappings 
WHERE resolved = false;

-- Manually update the resolved bet (replace with your actual bet ID)
-- UPDATE bet_mappings 
-- SET resolved = true, winning_option = 0, updated_at = NOW()
-- WHERE numeric_id = 5;  -- Replace 5 with your actual bet ID

-- Verify the update
-- SELECT numeric_id, bet_name, resolved, winning_option, updated_at 
-- FROM bet_mappings 
-- WHERE numeric_id = 5;