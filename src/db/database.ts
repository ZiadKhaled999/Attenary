import * as SQLite from 'expo-sqlite';
import { Profile, Session, SyncQueueItem } from '../types';

const dbPromise = SQLite.openDatabaseAsync('attenary.db');

const toNum = (v: number | null | undefined): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const rowToProfile = (row: any): Profile => ({
  id: row.id,
  email: row.email ?? '',
  full_name: row.full_name ?? '',
  job_title: row.job_title ?? '',
  department: row.department ?? '',
  avatar_url: row.avatar_url ?? '',
  onboarding_completed: Boolean(row.onboarding_completed),
  language: row.language ?? 'en',
  created_at: toNum(row.created_at) ?? 0,
  updated_at: toNum(row.updated_at) ?? 0,
});

const rowToSession = (row: any): Session => ({
  sessionId: row.id,
  checkInTime: row.check_in_time,
  checkOutTime: row.check_out_time ?? null,
  reason: row.reason ?? null,
  reasonEditedAt: row.reason_edited_at ?? null,
});

const rowToSync = (row: any): SyncQueueItem => ({
  id: row.id,
  user_id: row.user_id,
  entity_type: row.entity_type,
  entity_id: row.entity_id ?? '',
  operation: row.operation,
  payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
  file_path: row.file_path ?? '',
  retry_count: row.retry_count ?? 0,
  last_error: row.last_error ?? '',
  created_at: row.created_at,
  processed_at: row.processed_at,
});

const init = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      full_name TEXT,
      job_title TEXT,
      department TEXT,
      avatar_url TEXT,
      onboarding_completed INTEGER DEFAULT 0,
      language TEXT DEFAULT 'en',
      created_at INTEGER,
      updated_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      check_in_time INTEGER NOT NULL,
      check_out_time INTEGER,
      reason TEXT,
      reason_edited_at INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    );
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    file_path TEXT,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at INTEGER,
    processed_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    email TEXT,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS app_settings (
    user_id TEXT PRIMARY KEY,
    theme TEXT,
    notifications INTEGER,
    onboarding_completed INTEGER,
    onboarding_progress REAL,
    hour_rate REAL,
    currency TEXT,
    last_sync_token TEXT,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS backup_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sync_watermark (
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    last_synced_ts INTEGER NOT NULL,
    PRIMARY KEY (user_id, entity_type)
  );
  CREATE INDEX IF NOT EXISTS idx_sync_watermark_user ON sync_watermark(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(user_id, processed_at);
  `);
  try {
    await db.runAsync(`ALTER TABLE sessions ADD COLUMN reason_edited_at INTEGER`);
  } catch {
    // column already exists — ignore
  }
  try {
    const schemaRows = await db.getAllAsync<any>(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='sync_watermark'"
    );
    const createSql = schemaRows[0]?.sql || '';
    if (createSql.includes('entity_type TEXT PRIMARY KEY') && !createSql.includes('user_id, entity_type')) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_watermark_v2 (
          user_id TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          last_synced_ts INTEGER NOT NULL,
          PRIMARY KEY (user_id, entity_type)
        )
      `);
      await db.runAsync(`
        INSERT OR IGNORE INTO sync_watermark_v2 (user_id, entity_type, last_synced_ts)
        SELECT user_id, entity_type, last_synced_ts FROM sync_watermark
      `);
      await db.runAsync(`DROP TABLE sync_watermark`);
      await db.execAsync(`ALTER TABLE sync_watermark_v2 RENAME TO sync_watermark`);
    }
  } catch {
    // migration failed — table may already be in correct shape
  }
}

export interface Database {
  profiles: {
    get: (id: string) => Promise<Profile | undefined>;
    put: (profile: Profile) => Promise<void>;
    clear: () => Promise<any>;
  };
  sessions: {
    getById: (id: string) => Promise<Session | undefined>;
    put: (session: Session) => Promise<void>;
    clear: () => Promise<any>;
  };
  syncQueue: {
    insert: (item: Omit<SyncQueueItem, 'id'>) => Promise<any>;
    pending: () => Promise<SyncQueueItem[]>;
    markProcessed: (id: string) => Promise<any>;
    incrementRetry: (id: string) => Promise<any>;
    clear: () => Promise<any>;
  };
}

export { dbPromise };

export const openDb = async (): Promise<Database> => {
  const db = await dbPromise;
  await init(db);
  return {
    profiles: {
      get: async (id: string) => {
        const rows = await db.getAllAsync<{ id: string; email: string | null; full_name: string | null; job_title: string | null; department: string | null; avatar_url: string | null; onboarding_completed: number | null; language: string | null; created_at: number | null; updated_at: number | null }>('SELECT * FROM profiles WHERE id = ? LIMIT 1', [id]);
        return rows.length ? rowToProfile(rows[0]) : undefined;
      },
      put: async (profile: Profile) => {
        await db.runAsync(
          `INSERT INTO profiles (id, email, full_name, job_title, department, avatar_url, onboarding_completed, language, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             email = excluded.email,
             full_name = excluded.full_name,
             job_title = excluded.job_title,
             department = excluded.department,
             avatar_url = excluded.avatar_url,
             onboarding_completed = excluded.onboarding_completed,
             language = excluded.language,
             updated_at = excluded.updated_at`,
          [
            profile.id,
            profile.email,
            profile.full_name,
            profile.job_title,
            profile.department,
            profile.avatar_url,
            profile.onboarding_completed ? 1 : 0,
            profile.language,
            toNum(profile.created_at) ?? 0,
            toNum(profile.updated_at) ?? 0,
          ]
        );
      },
      clear: async () => db.runAsync('DELETE FROM profiles'),
    },
    sessions: {
      getById: async (id: string) => {
        const rows = await db.getAllAsync<any>('SELECT * FROM sessions WHERE id = ? LIMIT 1', [id]);
        return rows.length ? rowToSession(rows[0]) : undefined;
      },
      put: async (session: Session) => {
        await db.runAsync(
          `INSERT INTO sessions (id, user_id, check_in_time, check_out_time, reason, reason_edited_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             check_out_time = excluded.check_out_time,
             reason = excluded.reason,
             reason_edited_at = excluded.reason_edited_at,
             updated_at = excluded.updated_at`,
          [
            session.sessionId,
            '',
            session.checkInTime,
            session.checkOutTime,
            session.reason ?? null,
            session.reasonEditedAt ?? null,
            session.checkInTime,
            session.checkOutTime ?? session.checkInTime,
          ]
        );
      },
      clear: async () => db.runAsync('DELETE FROM sessions'),
    },
    syncQueue: {
      insert: async (item: Omit<SyncQueueItem, 'id'>) => {
        await db.runAsync(
          `INSERT INTO sync_queue (user_id, entity_type, entity_id, operation, payload, file_path, retry_count, last_error, created_at, processed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.user_id,
            item.entity_type,
            item.entity_id ?? '',
            item.operation,
            JSON.stringify(item.payload),
            item.file_path ?? '',
            item.retry_count ?? 0,
            item.last_error ?? '',
            Date.now(),
            null,
          ]
        );
      },
      pending: async () => {
        const rows = await db.getAllAsync<any>('SELECT * FROM sync_queue WHERE processed_at IS NULL ORDER BY created_at ASC');
        return rows.map(rowToSync);
      },
      markProcessed: async (id: string) => db.runAsync('UPDATE sync_queue SET processed_at = ? WHERE id = ?', [Date.now(), id]),
      incrementRetry: async (id: string) => db.runAsync('UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?', ['Sync failed', id]),
      clear: async () => db.runAsync('DELETE FROM sync_queue'),
    },
  };
};
