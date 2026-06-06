# Plan: Supabase → Convex Migration + Silent Sync Queue

## 1. High-Level Architecture

Replace Supabase entirely with Convex. Add a silent, non-blocking sync queue that batches DOM mutations and pushes them to Convex in the background using `setInterval`. Track per-day sync state to avoid gaps when the user comes back online mid-window.

## 2. Schema Migration (`convex/schema.ts`)

New tables:
- `profiles` — id, email, full_name, job_title, department, avatar_url, onboarding_completed, language, created_at, updated_at
- `sessions` — id, user_id, check_in_time, check_out_time, reason, reason_edited_at, created_at, updated_at
- `feedbacks` — id, user_id, type, email, content, metadata, created_at
- `app_settings` — user_id (PK), theme, notifications, onboarding_completed, onboarding_progress, hour_rate, last_sync_token
- `sync_watermark` — user_id, entity_type, last_synced_ts (per-entity "high-water mark")
- `sync_queue` — id, user_id, entity_type, entity_id, operation, payload, retry_count, created_at, processed_at

Indexes on all `user_id` columns.

## 3. Remove Supabase Files
- Delete `src/config/supabase.ts`
- Delete `src/context/SupabaseContext.tsx`
- Remove `@supabase/supabase-js` from `package.json`
- Remove `SupabaseProvider` from `App.tsx`

## 4. New Convex Context (`src/context/ConvexContext.tsx`)

Rename `SupabaseProvider` concept to `ConvexProvider`, but refactor the internals:
- Keep local SQLite as the single source of truth (already exists in `src/db/database.ts`)
- Every mutation (checkIn, checkOut, updateProfile, setHourRate, setCurrency, etc.) writes to local SQLite first, then appends a row to local `sync_queue`
- A background `setInterval` (5–30s) drains `sync_queue` to Convex via mutations/actions
- `isOnline` comes from `@react-native-community/netinfo`
- If a Convex push succeeds, mark the queued item as `processed_at`
- If failed, increment `retry_count` and retry later (max 5)

## 5. Day-Boundary Sync Tracking

Append a `synced_until` timestamp to `AppData` (or separate local table). Logic:
- On each local save, store `local_updated_at`
- Before draining the queue, read `sync_watermark[entity_type]`
- Push all rows where entity local update time > watermark
- After successful batch, advance watermark to max pushed timestamp
- If app opens mid-month and pushes were missed, the first sync backfills from watermark; no gaps

## 6. Cover Every Entity in the App

### 6.1 Profile / Onboarding
- `src/screens/OnboardingScreen.tsx` — replace `updateProfile`, `completeOnboarding`, `uploadAvatar` with Convex calls that persist locally + queue
- `src/screens/ProfileScreen.tsx` — replace `useSupabase` with `ConvexContext`

### 6.2 Sessions / TimeClock
- `src/screens/TimeClockScreen.tsx` — replace `profile` read with Convex reads; session CRUD already local, just add to sync queue
- Session checkIn/checkOut already writes locally; append to queue

### 6.3 Daily Log / Monthly Report / Analytics / History
All these read from `AppData` (AppContext). No Supabase calls today, but they must be included in the sync queue so that when push happens, the same entities are sent.

### 6.4 BossExport
Reads profile and sessions; no writes. After upload, store a local `last_export_ts` to include in sync metadata.

### 6.5 Feedbacks
- `src/screens/FeedbacksScreen.tsx` — replace `createFeedback` (Supabase insert) with local SQLite insert into `feedbacks` table + sync queue

### 6.6 HourRate / Currency
- `src/screens/HourRateScreen.tsx` — these update `AppData.hourRate` via `AppContext.setHourRate`; already local. Add a `user_settings` sync queue entry after save.

### 6.7 Backup metadata
- In `src/utils/backup.ts`, when a backup is created or restored, insert a row in a new local `backup_events` table and queue it:
  - `last_backup_ts` (timestamp only — NO actual JSON file storage in Convex)
  - `last_restore_ts`
  - `backup_schema_version`
  - `last_restore_schema_version`

### 6.8 App settings
- theme, notifications, onboarding progress — all from `AppData.appSettings` and `onboardingProgress`; queue on change.

## 7. Local Database Extensions (`src/db/database.ts`)

Add tables:
- `feedbacks` (id PK, user_id, type, content, metadata, created_at)
- `app_settings` (user_id PK, settings JSON blobs or individual cols)
- `backup_events` (id, user_id, event_type, schema_version, created_at)
- `sync_watermark` (entity_type PK, user_id, last_synced_ts)

## 8. Convex Backend Functions (new `convex/` directory)

Define queries/mutations/actions for every table:
- `convex/schema.ts` — all tables + indexes
- `convex/profiles.ts` — insert/update/get profile
- `convex/sessions.ts` — bulk upsert sessions for a user
- `convex/feedbacks.ts` — insert feedback
- `convex/settings.ts` — upsert app settings, update watermarks
- `convex/sync.ts` — `processQueue` action that:
  1. Reads pending queue items
  2. Batches by entity type
  3. Upserts to respective tables
  4. Updates watermarks
  5. Returns list of itemIds to mark as processed

Frontend calls `processQueue` actions on every successful interval tick.

## 9. Convex Client Integration

- Install `convex` package
- Replace `SupabaseProvider` in `App.tsx` with `ConvexProvider` from `convex/react`
- Remove all `useSupabase` imports from screens, replace with `useConvex()`
- Env var: `EXPO_PUBLIC_CONVEX_URL`

## 10. Migration Steps (implementation order)

1. Add `convex` npm package + create `convex/schema.ts`
2. Create all backend functions
3. Extend local `database.ts` with new tables
4. Build `src/context/ConvexContext.tsx` (mirrors SupabaseContext API but local+queue)
5. Replace `useSupabase` usages (6 files + 1 nav)
6. Delete supabase config + context
7. Update `App.tsx` provider chain
8. Add day-boundary watermark logic
9. Add backup metadata table + queue
10. Test offline flow, then online flow

## 11. Key Open Questions for User Confirmation

- Should we keep the existing SQLite `sync_queue` table or rebuild it with the new entity types?
- Do you want Convex Auth, anonymous auth, or email-only for onboarding?
- Any targeted regions for Convex deployment (US/EU/Asia)?
