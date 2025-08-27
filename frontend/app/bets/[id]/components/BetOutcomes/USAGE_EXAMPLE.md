# BetOutcomes Usage Example

## Import
```typescript
import { BetOutcomes } from './components/BetOutcomes'
```

## Replace UserActions in BetPageClient.tsx

### Before (UserActions):
```tsx
<UserActions
  address={address}
  resolved={resolved || false}
  winningOption={winningOption}
  userBets={userBets as readonly bigint[] || []}
  totalAmounts={totalAmounts as readonly bigint[] || []}
  resolutionDeadlinePassed={resolutionDeadlinePassed}
  hasClaimed={Boolean(hasClaimed)}
  hasClaimedCreatorFees={Boolean(hasClaimedCreatorFees)}
  decimals={Number(decimals) || 18}
  isPending={isPending}
  handleClaimWinnings={handleClaimWinnings}
  handleClaimRefund={handleClaimRefund}
  handleClaimCreatorFees={handleClaimCreatorFees}
  betId={numericBetId?.toString() || '0'}
  isNativeBet={isNativeBet || false}
  tokenAddress={typedBetDetails?.[7]}
  creator={creator || ''}
/>
```

### After (BetOutcomes):
```tsx
<BetOutcomes
  address={address}
  resolved={resolved || false}
  winningOption={winningOption}
  userBets={userBets as readonly bigint[] || []}
  totalAmounts={totalAmounts as readonly bigint[] || []}
  resolutionDeadlinePassed={resolutionDeadlinePassed}
  hasClaimed={Boolean(hasClaimed)}
  hasClaimedCreatorFees={Boolean(hasClaimedCreatorFees)}
  creator={creator || ''}
  handleClaimWinnings={handleClaimWinnings}
  handleClaimRefund={handleClaimRefund}
  handleClaimCreatorFees={handleClaimCreatorFees}
  decimals={Number(decimals) || 18}
  isPending={isPending}
  betId={numericBetId?.toString() || '0'}
  isNativeBet={isNativeBet || false}
/>
```

## Key Differences:
1. **Removed props**: `tokenAddress` (not needed, component gets data from useBetFeeData hook)
2. **Same interface**: All essential props remain the same
3. **Same handlers**: All claim handlers work identically
4. **Simplified display**: Shows outcome-based lines instead of complex status messages

## What Users Will See:

### Resolved Bet - User Won:
```
Your Outcomes
💰 Winnings: 1.25 ETH [Claim]
    ▶ Show breakdown
```

### Resolved Bet - User Lost:
```
Your Outcomes  
💸 Lost: 0.5 ETH
```

### Resolved Bet - Creator:
```
Your Outcomes
💸 Lost: 0.3 ETH
🏆 Creator Fees: 0.1 ETH [Claim]
    ▶ Show breakdown
```

### Expired Bet:
```
Your Outcomes
↩️ Refund: 0.5 ETH [Claim]
```