import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { Platform, AppState } from 'react-native';
import { useConvex } from 'convex/react';
import NetInfo from '@react-native-community/netinfo';
import { getOrCreateDeviceId } from '../utils/deviceId';
import { api } from '../../convex/_generated/api';

window.__convexDebug = window.__convexDebug || [];

interface ConvexContextType {
  deviceId: string | null;
  isOnline: boolean;
  isSyncing: boolean;
  queueMutation: (entityType: string, entityId: string, operation: 'upsert' | 'delete', payload: any) => Promise<void>;
  forceSync: () => Promise<void>;
}

const ConvexContext = createContext<ConvexContextType | null>(null);

const SYNC_INTERVAL_MS = 10000;
const MAX_RETRIES = 5;

type QueueItem = {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  operation: 'upsert' | 'delete';
  payload: any;
  created_at: number;
};

const QUEUE_STORAGE_KEY = 'convex_sync_queue';

const loadWebQueue = (): QueueItem[] => {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.filter((item: QueueItem) => {
      const p = item.payload;
      if (p === '[object Object]') return false;
      if (typeof p !== 'string') return true;
      try {
        JSON.parse(p);
        return true;
      } catch {
        return false;
      }
    });
  } catch {
    try { localStorage.removeItem(QUEUE_STORAGE_KEY); } catch {}
    return [];
  }
};

const saveWebQueue = (queue: QueueItem[]) => {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue.slice(0, 500)));
  } catch { /* quota exceeded */ }
};

export function ConvexSyncProvider({ children }: { children: React.ReactNode }) {
  const convex = useConvex();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webQueueRef = useRef<QueueItem[]>(loadWebQueue());

  useEffect(() => {
    window.__convexDebug.push({ type: 'init', convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL, ts: Date.now() });
    console.log('[Convex] convexUrl:', process.env.EXPO_PUBLIC_CONVEX_URL);
    console.log('[Convex] client ready (via useConvex)');
  }, []);

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });
    return unsub;
  }, []);

  useEffect(() => {
    async function checkHealth() {
      if (!convex) return;
      try {
        const result = await convex.query(api.profiles.listAll, {} as never);
        window.__convexDebug.push({ type: 'health-check', profiles: result?.length ?? 0, ts: Date.now() });
        console.log('[Convex] health-check OK: listAll returned', result?.length ?? 0, 'profiles');
      } catch (e) {
        window.__convexDebug.push({ type: 'health-check-failed', error: e instanceof Error ? e.message : String(e), ts: Date.now() });
        console.error('[Convex] health-check FAILED:', e instanceof Error ? e.message : e);
      }
    }
    checkHealth();
  }, [convex]);

  const enqueueWeb = useCallback((item: Omit<QueueItem, 'id' | 'created_at'>) => {
    webQueueRef.current.push({
      ...item,
      payload: typeof item.payload === 'string' ? item.payload : JSON.stringify(item.payload),
      id: `web_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      created_at: Date.now(),
    });
    saveWebQueue(webQueueRef.current);
  }, []);

  const flushWebQueue = useCallback(async () => {
    console.log('[Convex] flushWebQueue start: convex=', !!convex, 'isOnline=', isOnline, 'isSyncing=', isSyncing, 'queueSize=', webQueueRef.current.length);
    if (!convex || isSyncing || !isOnline) {
      console.log('[Convex] flushWebQueue skipped: convex=', !!convex, 'isSyncing=', isSyncing, 'isOnline=', isOnline);
      return;
    }
    const queue = webQueueRef.current;
    if (queue.length === 0) return;

    setIsSyncing(true);
    const batch = queue.splice(0, 50);
    const failed: QueueItem[] = [];

    try {
      const byType = new Map<string, QueueItem[]>();
      for (const item of batch) {
        const list = byType.get(item.entity_type) || [];
        list.push(item);
        byType.set(item.entity_type, list);
      }

      for (const [entityType, items] of byType) {
        for (const item of items) {
          if (item.operation !== 'upsert') {
            failed.push(item);
            continue;
          }
          try {
            let payload: any;
            try {
              payload = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
            } catch (parseErr) {
              console.error('[Convex] Payload parse failed, skipping item:', entityType, item.entity_id, parseErr);
              failed.push(item);
              continue;
            }
            if (entityType === 'profiles') {
              console.log('[Convex] Calling profiles.upsert with:', {
                user_id: item.user_id,
                email: payload.email ?? null,
                full_name: payload.full_name ?? null,
              });
              await convex.mutation(api.profiles.upsert, {
                user_id: item.user_id,
                email: payload.email ?? null,
                full_name: payload.full_name ?? null,
                job_title: payload.job_title ?? null,
                department: payload.department ?? null,
                avatar_url: payload.avatar_url ?? null,
                language: payload.language ?? null,
                onboarding_completed: payload.onboarding_completed ?? false,
                updated_at: payload.updated_at ?? Date.now(),
              });
              console.log('[Convex] profiles.upsert completed');
            } else if (entityType === 'feedbacks') {
              await convex.mutation(api.feedbacks.insert, {
                user_id: item.user_id,
                type: payload.type,
                email: payload.email ?? null,
                content: payload.content,
                metadata: typeof payload.metadata === 'string' ? payload.metadata : (payload.metadata ? JSON.stringify(payload.metadata) : null),
                created_at: payload.created_at ?? Date.now(),
              });
            } else if (entityType === 'app_settings') {
              await convex.mutation(api.settings.upsert, {
                user_id: item.user_id,
                theme: payload.theme ?? null,
                notifications: payload.notifications ?? null,
                onboarding_completed: payload.onboarding_completed ?? null,
                onboarding_progress: payload.onboarding_progress ?? null,
                hour_rate: payload.hour_rate ?? null,
                currency: payload.currency ?? null,
                last_sync_token: payload.last_sync_token ?? null,
              });
            } else if (entityType === 'sessions') {
              const row = payload.items && Array.isArray(payload.items) ? payload.items[0] : payload;
              await convex.mutation(api.sessions.bulkUpsert, {
                items: [{
                  user_id: item.user_id,
                  check_in_time: row.check_in_time ?? row.checkInTime,
                  check_out_time: row.check_out_time ?? row.checkOutTime,
                  reason: row.reason ?? null,
                  reason_edited_at: row.reason_edited_at ?? row.reasonEditedAt ?? null,
                  updated_at: row.updated_at ?? Date.now(),
                }],
              });
            } else {
              failed.push(item);
            }
          } catch (err) {
            console.error('[Convex] web item failed:', entityType, item.entity_id, err);
            failed.push(item);
          }
        }
      }
    } catch (err) {
      console.error('Web sync flush fatal error:', err);
      failed.unshift(...batch);
    } finally {
      if (failed.length > 0) {
        webQueueRef.current.unshift(...failed);
        saveWebQueue(webQueueRef.current);
      }
      if (webQueueRef.current.length === 0) {
        try { localStorage.removeItem(QUEUE_STORAGE_KEY); } catch {}
      }
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, convex]);

  const drainQueue = useCallback(async () => {
    const uid = deviceId || await getOrCreateDeviceId();
    if (!uid) {
      console.warn('[Convex] drainQueue skipped: deviceId still null');
      return;
    }
    if (!isOnline || isSyncing) return;

    if (Platform.OS === 'web' || !convex) {
      await flushWebQueue();
      return;
    }

    setIsSyncing(true);
    let pending: any[] = [];
    try {
      const database = await import('../db/database').then(m => m.dbPromise).catch(() => null);
      if (!database) {
        await flushWebQueue();
        setIsSyncing(false);
        return;
      }

      const watermarks = await database.getAllAsync<{ entity_type: string; last_synced_ts: number }>(
        `SELECT * FROM sync_watermark WHERE user_id = ?`,
        [uid]
      );
      const watermarkMap = new Map(watermarks.map((w) => [w.entity_type, w.last_synced_ts]));

      for (const entityType of ['profiles', 'sessions', 'app_settings', 'feedbacks']) {
        const wm = watermarkMap.get(entityType) || 0;
        let backfillRows: any[] = [];
        if (entityType === 'sessions') {
          backfillRows = await database.getAllAsync(
            `SELECT * FROM sessions WHERE user_id = ? AND updated_at > ?`,
            [uid, wm]
          );
        } else if (entityType === 'profiles') {
          backfillRows = await database.getAllAsync(
            `SELECT * FROM profiles WHERE id = ? AND updated_at > ?`,
            [uid, wm]
          );
        } else if (entityType === 'app_settings') {
          backfillRows = await database.getAllAsync(
            `SELECT * FROM app_settings WHERE user_id = ? AND updated_at > ?`,
            [uid, wm]
          );
        } else if (entityType === 'feedbacks') {
          backfillRows = await database.getAllAsync(
            `SELECT * FROM feedbacks WHERE user_id = ? AND created_at > ?`,
            [uid, wm]
          );
        }

        for (const row of backfillRows) {
          const entityId = entityType === 'sessions' ? String(row.id) : uid;
          const alreadyQueued = await database.getFirstAsync(
            `SELECT 1 FROM sync_queue WHERE entity_id = ? AND operation = 'upsert' AND processed_at IS NULL`,
            [entityId]
          );
          if (!alreadyQueued) {
            await database.runAsync(
              `INSERT INTO sync_queue (user_id, entity_type, entity_id, operation, payload, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [uid, entityType, entityId, 'upsert', JSON.stringify(row), Date.now()]
            );
          }
        }
      }

      pending = await database.getAllAsync<any>(
        `SELECT * FROM sync_queue
         WHERE user_id = ? AND processed_at IS NULL AND retry_count < ?
         ORDER BY created_at ASC
         LIMIT 50`,
        [uid, MAX_RETRIES]
      );

      if (pending.length === 0) {
        setIsSyncing(false);
        return;
      }

      if (!convex) {
        setIsSyncing(false);
        return;
      }

      const result = await convex.action(api.sync.processQueue, {
        user_id: uid,
        items: pending.map((p) => ({
          entity_type: p.entity_type,
          entity_id: p.entity_id,
          operation: p.operation,
          payload: p.payload,
          created_at: p.created_at,
        })),
      });

      const now = Date.now();
      for (const item of pending) {
        await database.runAsync(
          `UPDATE sync_queue SET processed_at = ? WHERE id = ?`,
          [now, item.id]
        );
      }

      const watermarksResult = result.watermarks as Record<string, number>;
      for (const [entityType, ts] of Object.entries(watermarksResult)) {
        await database.runAsync(
          `INSERT INTO sync_watermark (user_id, entity_type, last_synced_ts)
           VALUES (?, ?, ?)
           ON CONFLICT(user_id, entity_type) DO UPDATE SET last_synced_ts = excluded.last_synced_ts`,
          [uid, entityType, ts]
        );
      }

    } catch (err) {
      console.error('[Convex] drainQueue fatal error:', err);
      const lastErr = err instanceof Error ? err.message : String(err);
      try {
        await import('../db/database')
          .then(m => m.dbPromise)
          .then(db => db.runAsync(`CREATE TABLE IF NOT EXISTS _convex_debug (key TEXT PRIMARY KEY, value TEXT)`))
          .then(() => import('../db/database').then(m => m.dbPromise).then(db => db.runAsync(`INSERT OR REPLACE INTO _convex_debug (key, value) VALUES (?, ?)`, ['last_sync_error', lastErr])))
          .catch(() => {});
      } catch { }
      if (pending.length > 0) {
        const database = await import('../db/database').then(m => m.dbPromise).catch(() => null);
        if (database) {
          for (const item of pending) {
            await database.runAsync(
              `UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?`,
              [lastErr.slice(0, 200), item.id]
            );
          }
        }
      }
    } finally {
      setIsSyncing(false);
    }
  }, [deviceId, isOnline, isSyncing, flushWebQueue, convex]);

  const queueMutation = useCallback(async (
    entityType: string,
    entityId: string,
    operation: 'upsert' | 'delete',
    payload: any
  ) => {
    const uid = deviceId || await getOrCreateDeviceId();
    if (!uid) {
      console.error('[Convex] queueMutation ABORTED: deviceId is null/empty. Mutation cannot be assigned a user_id. Payload:', entityType, entityId);
      return;
    }
    console.log('[Convex] queueMutation:', entityType, entityId, 'web=', Platform.OS === 'web', 'convex=', !!convex, 'uid=', uid.slice(0, 12));

    if (Platform.OS === 'web' || !convex) {
      enqueueWeb({ user_id: uid, entity_type: entityType, entity_id: entityId, operation, payload });
      console.log('[Convex] enqueued to webQueue, size=', webQueueRef.current.length);
      if (convex && isOnline && !isSyncing) {
        setTimeout(() => flushWebQueue(), 100);
      }
      return;
    }

    try {
      const database = await import('../db/database').then(m => m.dbPromise).catch(() => null);
      if (!database) {
        enqueueWeb({ user_id: uid, entity_type: entityType, entity_id: entityId, operation, payload });
        return;
      }
      await database.then(db => db.runAsync(
        `INSERT INTO sync_queue (user_id, entity_type, entity_id, operation, payload, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uid, entityType, entityId, operation, JSON.stringify(payload), Date.now()]
      ));
    } catch {
      enqueueWeb({ user_id: uid, entity_type: entityType, entity_id: entityId, operation, payload });
    }
  }, [deviceId, enqueueWeb, flushWebQueue, isOnline, isSyncing, convex]);

  useEffect(() => {
    let initialSkipped = false;
    const onChange = (nextState: string) => {
      if (!initialSkipped) {
        initialSkipped = true;
        return;
      }
      if (nextState === 'active') {
        setTimeout(() => drainQueue(), 300);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => {
      sub.remove();
    };
  }, [drainQueue]);

  useEffect(() => {
    if (!deviceId) return;

    drainQueue();

    syncTimerRef.current = setInterval(drainQueue, SYNC_INTERVAL_MS);
    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [deviceId, drainQueue]);

  const forceSync = useCallback(async () => {
    await drainQueue();
  }, [drainQueue]);

  return (
    <ConvexContext.Provider value={{ deviceId, isOnline, isSyncing, queueMutation, forceSync }}>
      {children}
    </ConvexContext.Provider>
  );
}

export const useConvexSync = () => {
  const ctx = useContext(ConvexContext);
  if (!ctx) throw new Error('useConvexSync must be inside ConvexSyncProvider');
  return ctx;
};

export function getConvexDebugState() {
  return {
    convexUrl: (globalThis as any).process?.env?.EXPO_PUBLIC_CONVEX_URL || '',
    convexDebugLog: (globalThis as any).window?.__convexDebug || [],
  };
}
