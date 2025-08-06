# Batch System Archive

## Files Replaced by Real-Time Analytics System

The following files were part of the old batch processing system and can be archived/removed:

### Batch Processing Files:
- `frontend/app/api/analytics/daily-update/route.ts` - Daily cron job endpoint
- `frontend/lib/analytics/eventProcessor.ts` - Blockchain event processing
- `frontend/lib/analytics/statsCalculator.ts` - Batch stats calculation
- `frontend/vercel.json` - Contains cron job configuration

### Scripts:
- `scripts/manual-backfill.js` - Manual backfill script
- `scripts/package.json` - Script dependencies
- `scripts/README.md` - Script documentation
- `test-cron.js` - Cron testing script
- `debug-verification.js` - Debug utilities

## New Real-Time System Files:

### Core Files:
- `frontend/lib/analytics/userStats.ts` - Real-time user stats management
- `frontend/app/api/bets/place/route.ts` - Bet placement tracking API

### Updated Files:
- `frontend/app/api/bets/create/route.ts` - Added real-time analytics
- `frontend/app/bets/[id]/hooks/useBetActions.ts` - Added API call after bet placement

## Migration Date:
August 6, 2025

## Rollback Instructions:
If needed, the batch system can be restored by:
1. Removing the new real-time files
2. Restoring the batch processing files
3. Restoring the vercel.json cron configuration
4. Removing the analytics calls from the API endpoints

## Old Test and Manual Scripts (Archived)

### test-cron.js
Test script for debugging the old batch cron job system.

### scripts/
Directory containing manual backfill scripts for processing large blockchain gaps that exceeded serverless timeouts. Included:
- manual-backfill.js: Main backfill script with chunked processing
- README.md: Detailed documentation for manual backfill process
- package.json: Dependencies for backfill scripts

These scripts are no longer needed with the new real-time analytics system.
