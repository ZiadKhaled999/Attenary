-- =============================================================================
-- Migration: 20250602_fix_schema_consistency
-- Description:
--   Fixes schema type mismatches that caused session insert failures and
--   adds missing sync_queue indexes.
--
--   Changes:
--     - sessions.id:        uuid  -> text (app generates base36 IDs)
--     - sync_queue.id:      uuid  -> text (consistency)
--     - sync_queue.entity_id: uuid -> text (can reference text session IDs)
--     - feedbacks.id:       uuid  -> text (consistency with other tables)
--     - Missing sync_queue user_id and pending indexes
--
--   Safe to re-run (idempotent). Wrapped in a transaction.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. sessions.id: uuid -> text
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema  = 'public'
      AND table_name    = 'sessions'
      AND column_name   = 'id'
      AND data_type     = 'uuid'
  ) THEN
    ALTER TABLE public.sessions
      ALTER COLUMN id TYPE text
      USING id::text;

    ALTER TABLE public.sessions
      ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. sync_queue.id: uuid -> text
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema  = 'public'
      AND table_name    = 'sync_queue'
      AND column_name   = 'id'
      AND data_type     = 'uuid'
  ) THEN
    ALTER TABLE public.sync_queue
      ALTER COLUMN id TYPE text
      USING id::text;

    ALTER TABLE public.sync_queue
      ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. sync_queue.entity_id: uuid -> text
--    (entity_id can reference either uuid user_id or text session IDs)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema  = 'public'
      AND table_name    = 'sync_queue'
      AND column_name   = 'entity_id'
      AND data_type     = 'uuid'
  ) THEN
    ALTER TABLE public.sync_queue
      ALTER COLUMN entity_id TYPE text
      USING entity_id::text;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. feedbacks.id: uuid -> text
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema  = 'public'
      AND table_name    = 'feedbacks'
      AND column_name   = 'id'
      AND data_type     = 'uuid'
  ) THEN
    ALTER TABLE public.feedbacks
      ALTER COLUMN id TYPE text
      USING id::text;

    ALTER TABLE public.feedbacks
      ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Add missing indexes (idempotent, IF NOT EXISTS)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id
  ON public.sync_queue (user_id);

CREATE INDEX IF NOT EXISTS idx_sync_queue_pending
  ON public.sync_queue (user_id, processed_at)
  WHERE processed_at IS NULL;

COMMIT;
