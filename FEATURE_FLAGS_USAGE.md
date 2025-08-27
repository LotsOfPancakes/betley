# Feature Flags Implementation - Usage Guide

## 🎯 Purpose
Enable bet-specific feature testing on production without affecting existing live bets.

## 📋 Implementation Complete

### ✅ Files Updated:
1. **Database**: `database/add_feature_flags.sql` - Migration script
2. **API**: `frontend/app/api/bets/[randomId]/route.ts` - Added feature_flags to response
3. **Types**: `frontend/app/bets/[id]/hooks/useBetDataNew.ts` - Updated DatabaseBetDetails interface
4. **Utilities**: `frontend/src/lib/hooks/useFeatureFlag.ts` - Feature flag hooks
5. **Frontend**: `frontend/app/bets/[id]/BetPageClient.tsx` - Conditional rendering logic

## 🚀 How to Use

### Step 1: Run Database Migration
```bash
# Connect to your production database and run:
psql -d your_database -f database/add_feature_flags.sql
```

### Step 2: Deploy Code Changes
- Deploy the updated frontend code
- All existing bets will continue using UserActions (no changes)
- New feature flag system is ready but disabled by default

### Step 3: Enable BetOutcomes on Specific Test Bet

#### Option A: Via SQL (Direct database access)
```sql
-- Enable BetOutcomes on your test bet
UPDATE bet_mappings 
SET feature_flags = '{"betOutcomes": true}' 
WHERE random_id = 'your-test-bet-id';

-- Verify it worked
SELECT random_id, bet_name, feature_flags 
FROM bet_mappings 
WHERE random_id = 'your-test-bet-id';
```

#### Option B: Via Supabase Dashboard (UI)
1. Go to Supabase → Table Editor → bet_mappings
2. Find your test bet by random_id
3. Edit the `feature_flags` column
4. Set value to: `{"betOutcomes": true}`
5. Save changes

### Step 4: Test Your Bet
- Visit your test bet URL
- Should see the new BetOutcomes component instead of UserActions
- All other bets remain unchanged

## 🔧 Feature Flag Options

### Available Flags:
- `"betOutcomes": true` - Use new BetOutcomes component
- `"tooltipBreakdown": true` - Enable tooltip breakdowns (future feature)

### Multiple Features:
```sql
UPDATE bet_mappings 
SET feature_flags = '{"betOutcomes": true, "tooltipBreakdown": true}' 
WHERE random_id = 'your-test-bet-id';
```

## 🛡️ Safety Features

### Instant Rollback:
```sql
-- Disable all features immediately
UPDATE bet_mappings SET feature_flags = '{}' WHERE random_id = 'your-test-bet-id';

-- Or disable globally (emergency rollback)
UPDATE bet_mappings SET feature_flags = '{}' WHERE feature_flags IS NOT NULL;
```

### Default Behavior:
- All bets default to `feature_flags = {}`
- Missing or `null` feature_flags default to existing UserActions
- No breaking changes to existing functionality

## 🔍 Debugging

### Check Current Feature Flags:
```sql
-- See all bets with feature flags enabled
SELECT random_id, bet_name, feature_flags 
FROM bet_mappings 
WHERE feature_flags != '{}';
```

### Frontend Debugging:
```typescript
// Add to BetPageClient.tsx for debugging
console.log('Feature flags:', databaseBet?.featureFlags)
console.log('Should use BetOutcomes:', shouldUseBetOutcomes)
```

## 🎯 Testing Checklist

### Before Production:
- [ ] Database migration completed
- [ ] Code deployed successfully
- [ ] Existing bets still work (UserActions)
- [ ] Test bet shows BetOutcomes when flag enabled
- [ ] Rollback works (disable flag → shows UserActions)

### Feature Testing:
- [ ] Winnings display correctly
- [ ] Lost amounts show correctly  
- [ ] Creator fees work properly
- [ ] Refunds work on expired bets
- [ ] Breakdown details expand/collapse
- [ ] Claim buttons function properly
- [ ] Already claimed states display correctly

## 🚨 Emergency Procedures

### If Issues Occur:
1. **Immediate rollback**: `UPDATE bet_mappings SET feature_flags = '{}' WHERE feature_flags IS NOT NULL;`
2. **Revert code**: Deploy previous version if needed
3. **Monitor**: Check error logs and user reports

### Production Safety:
- Start with ONE test bet
- Monitor for 24 hours before expanding
- Keep database migration script handy for rollbacks
- Test all claim scenarios thoroughly

## 💡 Next Steps

Once BetOutcomes testing is successful:
- Can gradually enable on more bets
- Add tooltip breakdown feature
- Eventually remove UserActions component
- Clean up feature flag system

---

**Ready for production testing! 🚀**