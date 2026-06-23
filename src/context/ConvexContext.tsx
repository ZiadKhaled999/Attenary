import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { Platform, AppState } from 'react-native';
import { useConvex } from 'convex/react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrCreateDeviceId } from '../utils/deviceId';
import { api } from '../../convex/_generated/api';

// ─── Debug log (safe on all platforms) ────────────────────────────────────────
const debugLog: Array<Record<string, any>> = [];
function pushDebug(entry: Record<string, any>) {
  debugLog.push({ ...entry, ts: Date.now() });
  if (debugLog.length > 200) debugLog.shift();
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    (window as any).__convexDebug = debugLog;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ConvexContextType {
  deviceId: string | null;
  isOnline: boolean;
  isSyncing: boolean;
  queueMutation: (
    entityType: string,
    entityId: string,
    operation: 'upsert' | 'delete',
    payload: any,
  ) => Promise<void>;
  forceSync: () => Promise<void>;
}

type QueueItem = {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  operation: 'upsert' | 'delete';
  /** Always stored as a JSON string */
  payload: string;
  created_at: number;
  retry_count: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const SYNC_INTERVAL_MS = 10_000;
const MAX_RETRIES = 5;
const QUEUE_STORAGE_KEY = '@convex_sync_queue_v2';
const WATERMARK_STORAGE_KEY = '@convex_sync_watermarks_v2';

// ─── Durable queue helpers (AsyncStorage on Android, localStorage on web) ─────

async function loadQueue(): Promise<QueueItem[]> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueueItem[]): Promise<void> {
  try {
    const serialized = JSON.stringify(queue.slice(0, 500));
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(QUEUE_STORAGE_KEY, serialized);
    } else {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, serialized);
    }
  } catch (e) {
    console.warn('[Convex] saveQueue failed:', e);
  }
}

// ─── Durable watermark helpers ────────────────────────────────────────────────

async function loadWatermarks(): Promise<Record<string, number>> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(WATERMARK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    }
    const raw = await AsyncStorage.getItem(WATERMARK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveWatermarks(wm: Record<string, number>): Promise<void> {
  try {
    const serialized = JSON.stringify(wm);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(WATERMARK_STORAGE_KEY, serialized);
    } else {
      await AsyncStorage.setItem(WATERMARK_STORAGE_KEY, serialized);
    }
  } catch (e) {
    console.warn('[Convex] saveWatermarks failed:', e);
  }
}

// ─── Unique id (no crypto dependency) ────────────────────────────────────────
function makeId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Payload normaliser ───────────────────────────────────────────────────────
function toJsonString(payload: any): string {
  if (typeof payload === 'string') {
    try { JSON.parse(payload); return payload; } catch {}
  }
  return JSON.stringify(payload);
}

function parsePayload(raw: string): any {
  try { return JSON.parse(raw); } catch { return {}; }
}

// ─── Dispatch a single item to Convex ─────────────────────────────────────────
async function dispatchItem(
  convex: ReturnType<typeof useConvex>,
  item: QueueItem,
): Promise<void> {
  const payload = parsePayload(item.payload);

  switch (item.entity_type) {
    case 'profiles':
      if (item.operation === 'upsert') {
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
      }
      break;

    case 'sessions':
      if (item.operation === 'upsert') {
        await convex.mutation(api.sessions.bulkUpsert, {
          items: [{
            user_id: item.user_id,
            check_in_time: payload.check_in_time ?? payload.checkInTime,
            check_out_time: payload.check_out_time ?? payload.checkOutTime ?? undefined,
            reason: payload.reason ?? undefined,
            reason_edited_at: payload.reason_edited_at ?? payload.reasonEditedAt ?? undefined,
            updated_at: payload.updated_at ?? Date.now(),
          }],
        });
      }
      break;

    case 'feedbacks':
      if (item.operation === 'upsert') {
        await convex.mutation(api.feedbacks.insert, {
          user_id: item.user_id,
          type: payload.type,
          email: payload.email ?? undefined,
          content: payload.content,
          metadata:
            typeof payload.metadata === 'string'
              ? payload.metadata
              : payload.metadata
              ? JSON.stringify(payload.metadata)
              : undefined,
          created_at: payload.created_at ?? Date.now(),
        });
      }
      break;

    case 'app_settings':
      if (item.operation === 'upsert') {
        await convex.mutation(api.settings.upsert, {
          user_id: item.user_id,
          theme: payload.theme ?? undefined,
          notifications: payload.notifications ?? undefined,
          onboarding_completed: payload.onboarding_completed ?? undefined,
          onboarding_progress: payload.onboarding_progress ?? undefined,
          hour_rate: payload.hour_rate ?? undefined,
          currency: payload.currency ?? undefined,
          last_sync_token: payload.last_sync_token ?? undefined,
        });
      }
      break;

    default:
      console.warn('[Convex] Unknown entity_type, skipping:', item.entity_type);
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ConvexContext = createContext<ConvexContextType | null>(null);

export function ConvexSyncProvider({ children }: { children: React.ReactNode }) {
  const convex = useConvex();

  const [deviceId, setDeviceId]   = useState<string | null>(null);
  const [isOnline, setIsOnline]   = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const queueRef      = useRef<QueueItem[]>([]);
  const watermarksRef = useRef<Record<string, number>>({});
  const queueReady    = useRef(false);
  const isSyncingRef  = useRef(false);
  const syncTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load durable queue + watermarks from storage on mount ─────────────────
  useEffect(() => {
    Promise.all([loadQueue(), loadWatermarks()]).then(([q, wm]) => {
      queueRef.current      = q;
      watermarksRef.current = wm;
      queueReady.current    = true;
      console.log(
        `[Convex] Loaded ${q.length} queued items,`,
        Object.keys(wm).length, 'watermarks',
      );
    });
  }, []);

  // ── Device ID ──────────────────────────────────────────────────────────────
  useEffect(() => {
    getOrCreateDeviceId().then((id) => {
      setDeviceId(id);
      console.log('[Convex] deviceId:', id?.slice(0, 12));
    });
  }, []);

  // ── Network state ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable));
    });
    return unsub;
  }, []);

  // ── Health-check ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!convex || !deviceId) return;
    convex
      .query(api.profiles.listAll, {} as never)
      .then((r: any[]) =>
        console.log('[Convex] health-check OK, profiles:', r?.length ?? 0),
      )
      .catch((e: any) =>
        console.error('[Convex] health-check FAILED:', e?.message ?? e),
      );
  }, [convex, deviceId]);

  // ── Core flush ────────────────────────────────────────────────────────────
  const flushQueue = useCallback(async () => {
    if (!convex || !isOnline || isSyncingRef.current) return;
    if (!queueReady.current) return;
    if (queueRef.current.length === 0) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    const batch = queueRef.current.splice(0, 50);
    const failed: QueueItem[] = [];
    const succeededByType: Record<string, number> = {};

    for (const item of batch) {
      try {
        await dispatchItem(convex, item);
        pushDebug({ type: 'synced', entity: item.entity_type, id: item.entity_id });

        const prev = succeededByType[item.entity_type] ?? 0;
        succeededByType[item.entity_type] = Math.max(prev, item.created_at);
      } catch (err: any) {
        console.error(
          '[Convex] dispatch failed:',
          item.entity_type,
          err?.message ?? err,
        );
        const retried = { ...item, retry_count: item.retry_count + 1 };
        if (retried.retry_count < MAX_RETRIES) {
          failed.push(retried);
        } else {
          console.warn(
            '[Convex] dropping after max retries:',
            item.entity_type,
            item.entity_id,
          );
        }
      }
    }

    if (failed.length > 0) {
      queueRef.current.unshift(...failed);
    }

    if (Object.keys(succeededByType).length > 0) {
      for (const [entityType, ts] of Object.entries(succeededByType)) {
        watermarksRef.current[entityType] = Math.max(
          watermarksRef.current[entityType] ?? 0,
          ts,
        );
      }
      await saveWatermarks(watermarksRef.current);

      const uid = deviceId || (await getOrCreateDeviceId());
      if (uid) {
        for (const [entityType, ts] of Object.entries(succeededByType)) {
          try {
            await convex.mutation(api.sync.updateWatermark, {
              user_id: uid,
              entity_type: entityType,
              last_synced_ts: ts,
            });
          } catch (e: any) {
            console.warn('[Convex] watermark update failed:', e?.message ?? e);
          }
        }
      }
    }

    await saveQueue(queueRef.current);

    isSyncingRef.current = false;
    setIsSyncing(false);
  }, [convex, isOnline, deviceId]);

  // ── Enqueue a mutation ────────────────────────────────────────────────────
  const queueMutation = useCallback(
    async (
      entityType: string,
      entityId: string,
      operation: 'upsert' | 'delete',
      payload: any,
    ) => {
      const uid = deviceId || (await getOrCreateDeviceId());
      if (!uid) {
        console.error('[Convex] queueMutation aborted: no deviceId');
        return;
      }

      if (operation === 'upsert') {
        const existingIdx = queueRef.current.findIndex(
          (i) => i.entity_id === entityId && i.entity_type === entityType && i.operation === 'upsert',
        );
        if (existingIdx !== -1) {
          queueRef.current[existingIdx] = {
            ...queueRef.current[existingIdx],
            payload: toJsonString(payload),
            created_at: Date.now(),
            retry_count: 0,
          };
          await saveQueue(queueRef.current);
          console.log(`[Convex] updated existing queued item ${entityType}/${entityId}`);
          if (convex && isOnline && !isSyncingRef.current) {
            setTimeout(() => flushQueue(), 50);
          }
          return;
        }
      }

      const item: QueueItem = {
        id: makeId(),
        user_id: uid,
        entity_type: entityType,
        entity_id: entityId,
        operation,
        payload: toJsonString(payload),
        created_at: Date.now(),
        retry_count: 0,
      };

      queueRef.current.push(item);
      await saveQueue(queueRef.current);

      console.log(
        `[Convex] queued ${entityType}/${entityId} op=${operation}, queueSize=${queueRef.current.length}`,
      );

      if (convex && isOnline && !isSyncingRef.current) {
        setTimeout(() => flushQueue(), 50);
      }
    },
    [deviceId, convex, isOnline, flushQueue],
  );

  // ── Periodic sync + AppState resume ───────────────────────────────────────
  useEffect(() => {
    if (!deviceId) return;

    const initTimer = setTimeout(() => flushQueue(), 1500);
    syncTimerRef.current = setInterval(flushQueue, SYNC_INTERVAL_MS);

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') setTimeout(() => flushQueue(), 500);
    });

    return () => {
      clearTimeout(initTimer);
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      appStateSub.remove();
    };
  }, [deviceId, flushQueue]);

  const forceSync = useCallback(async () => {
    await flushQueue();
  }, [flushQueue]);

  return (
    <ConvexContext.Provider
      value={{ deviceId, isOnline, isSyncing, queueMutation, forceSync }}
    >
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
  return { debugLog, watermarks: {} };
}
