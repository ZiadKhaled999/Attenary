# Fix: Save feedbacks and onboarding data to Convex on Android

## Problem Summary
On Android (and all native builds), feedback submissions and onboarding completion never reach Convex. Web works correctly.

**Root Cause:** The Android app uses `EXPO_PUBLIC_CONVEX_URL=https://amicable-ladybug-72.convex.cloud` (from `.env`). That deployment predates the feedbacks/settings tables and related mutations. The web client uses `convexUrl` from `app.json` (`beloved-hare-121.convex.cloud`) which has the schema with `feedbacks`, `app_settings` (`onboarding_completed`/`onboarding_progress`), `sessions.bulkUpsert`, and `sync.processQueue`. The web `flushWebQueue` sends directly to that deployment and works. On native, `drainQueue` calls `api.sync.processQueue` against the `.env` URL — but that deployment's schema doesn't have `feedbacks` or `app_settings` tables, nor the sync tables, so mutations silently fail at the schema level.

Secondary issue: the Convex client has no auth provider set up, so even if the schema were correct, anonymous writes could fail depending on deployment auth rules. The existing anonymous device ID generation is fine — we just need it wired through Convex's identity system.

## Plan

### 1. Update `.env` to use the correct Convex deployment
Change `EXPO_PUBLIC_CONVEX_URL` to `https://beloved-hare-121.convex.cloud` (same as `app.json`).

### 2. Create a Convex identity provider component
New file `src/context/ConvexIdentityProvider.tsx`:
- Import `ConvexProvider` from `convex/react` and our custom `ConvexProvider`.
- Read the existing `deviceId` from `getOrCreateDeviceId()`.
- Set Convex identity via `useConvex().setName({ name: deviceId })` using the standard Convex client.
- This must wrap the app inside the standard `ConvexProvider` so that `ctx.userId` / `ctx.auth.getUserIdentity()` is populated in all Convex mutations. (Current code never sets identity, so `ctx.userId` is undefined on authenticated deployments; anonymous identity carries no identifier without `setName` or `setAuthentication`.)

### 3. Simplify `App.tsx` provider nesting
Replace the hand-rolled `<ConvexProvider>` (in `src/context/ConvexContext.tsx`) so that the **standard** `<ConvexProvider>` from `convex/react` is the root Convex wrapper, and our custom sync provider becomes a child (renamed to `ConvexSyncProvider` or kept as-is but nested inside). The current custom provider uses the raw client directly without setting identity on it — identity must flow through the standard `ConvexProvider` context.

### 4. Update `src/context/ConvexContext.tsx` (the sync provider)
- Rename export to `ConvexSyncProvider` (from `ConvexProvider`) to avoid conflict with `convex/react`.
- Use `useConvex()` hook (from `convex/react`) instead of the raw `convex` client instance to run mutations/queries within that identity context: `const convex = useConvex();`.
- Keep all queue/flush/sync logic the same; just replace `convex.mutation(api.xxx, ...)` with the local `convex` from `useConvex()`.

### 5. Verify schema parity for `.env` deployment (`beloved-hare-121`)
No code change needed once `.env` points there — that deployment already has `feedbacks`, `app_settings`, `sync_queue`, `sync_watermark`, and `api.sync.processQueue`.

### 6. Verify onboarding sync paths still work
No changes needed to `OnboardingScreen.tsx`, `ProfileScreen.tsx`, or `FeedbacksScreen.tsx` — they already queue via `queueMutation`. Just ensure the queue is now reachable by the fix in steps 1–4.

### 7. Rebuild and validate
- Deploy to Android (TestFlight / EAS build) for final confirmation.
- Confirm Convex dashboard shows records in `profiles`, `feedbacks`, and `app_settings` for the anonymous device user.

## Files to modify
1. `.env` — update `EXPO_PUBLIC_CONVEX_URL`
2. `src/context/ConvexIdentityProvider.tsx` — new
3. `src/context/ConvexContext.tsx` — rename exported component to `ConvexSyncProvider`, use `useConvex()` hook
4. `App.tsx` — restructure nesting: `<ConvexProvider>` wraps `<ConvexIdentityProvider>` wraps `<ConvexSyncProvider>` wraps `<Navigation>`
