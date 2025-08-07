# Database Migration Archive

This directory contains database migration files that have been executed and are no longer needed for regular operations.

## Archived Files:

### `add_resolve_activity_type.sql`
- **Purpose**: Added 'resolve' to valid activity types constraint
- **Status**: ✅ Executed - constraint updated
- **Date Archived**: 2025-08-07

### `extend_bet_mappings_schema.sql`
- **Purpose**: Extended bet_mappings table with bet details for Phase 2 implementation
- **Status**: ✅ Executed - schema updated with columns: bet_options, end_time, total_amounts, resolved, winning_option, cached_at
- **Date Archived**: 2025-08-07

## Active Files:

### `../calculate_user_stats.sql`
- **Purpose**: Recalculates user statistics from user_activities table
- **Status**: 🔄 Active - runs daily via Vercel cron job
- **Schedule**: Daily at 6 AM UTC via `/api/analytics/daily-stats`
- **Manual Trigger**: `POST /api/analytics/daily-stats` with auth header

## Notes:
- Migration files are kept for documentation and potential rollback scenarios
- Only `calculate_user_stats.sql` requires regular execution
- Real-time activities update immediately via API calls