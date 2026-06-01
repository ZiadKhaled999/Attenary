import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { openDb } from '../db/database';
import NetInfo from '@react-native-community/netinfo';
import { Profile, Session } from '../types';
import { Database } from '../db/database';

export interface SupabaseContextValue {
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  isOnline: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any | null }>;
  uploadAvatar: (fileUri: string) => Promise<{ url: string | null; error: any | null }>;
  refreshProfile: () => Promise<void>;
  fetchSessions: () => Promise<Session[]>;
  checkIn: () => Promise<{ session: Session | null; error: any | null }>;
  checkOut: (sessionId: string, reason?: string) => Promise<{ error: any | null }>;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export const useSupabase = () => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within a SupabaseProvider');
  return ctx;
};

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [db, setDb] = useState<Database | null>(null);
  const dbPromiseRef = useRef<Promise<Database> | null>(null);

  const getDb = useCallback(async () => {
    if (!dbPromiseRef.current) {
      dbPromiseRef.current = openDb().then(database => {
        setDb(database);
        return database;
      });
    }
    return dbPromiseRef.current;
  }, []);

  const updateOnlineStatus = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      setIsOnline(state.isConnected ?? false);
    } catch (e) {
      console.log('NetInfo fetch error:', e);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (res.error) throw res.error;
      const p = res.data as Profile;
      setProfile(p);
      const currentDb = await getDb();
      try { await currentDb.profiles.put(p); } catch (e) { console.log('Local profile cache error (non-critical):', e); }
    } catch (e) {
      console.log('refreshProfile error (non-critical):', e);
    }
  }, [session?.user?.id, getDb]);

  useEffect(() => {
    let unsubscribeNetInfo: (() => void) | undefined;
    const init = async () => {
      try {
        await getDb();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sessionState) => {
          setSession(sessionState);
          if (sessionState?.user?.id) await refreshProfile();
          else setProfile(null);
          setLoading(false);
        });

        const { data: { session: initial } } = await supabase.auth.getSession();
        setSession(initial);
        if (initial?.user?.id) await refreshProfile();
        setLoading(false);

        await updateOnlineStatus();
        unsubscribeNetInfo = NetInfo.addEventListener(state => setIsOnline(state.isConnected ?? false));

        return () => {
          subscription.unsubscribe();
          if (unsubscribeNetInfo) unsubscribeNetInfo();
        };
      } catch (e) {
        console.log('Supabase init error (non-critical):', e);
        setLoading(false);
      }
    };
    init();
  }, [refreshProfile, updateOnlineStatus, getDb]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    try {
      const currentDb = await getDb();
      await currentDb.syncQueue.insert({ user_id: email, entity_type: 'profile', entity_id: '', operation: 'upsert', payload: { email }, file_path: '', retry_count: 0 });
    } catch (e) {
      console.log('syncQueue insert error (non-critical):', e);
    }
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch {}
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!session?.user?.id) return { error: 'Not authenticated' };
    const profilePayload = { ...updates, id: session.user.id, updated_at: Date.now() } as any;
    const { error } = await supabase.from('profiles').update(profilePayload).eq('id', session.user.id);
    if (error) {
      try {
        const currentDb = await getDb();
        await currentDb.syncQueue.insert({ user_id: session.user.id, entity_type: 'profile', entity_id: session.user.id, operation: 'upsert', payload: profilePayload, file_path: '', retry_count: 0 });
      } catch (e) {
        console.log('syncQueue insert error (non-critical):', e);
      }
      return { error };
    }
    setProfile(p => (p ? { ...p, ...profilePayload } : p));
    return { error: null };
  };

  const uploadAvatar = async (fileUri: string) => {
    if (!session?.user?.id) return { url: null, error: 'Not authenticated' };
    const path = `avatars/${session.user.id}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, {
      uri: fileUri,
      type: 'image/jpeg',
    } as any, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'image/jpeg',
    });
    if (error) {
      try {
        const currentDb = await getDb();
        await currentDb.syncQueue.insert({ user_id: session.user.id, entity_type: 'avatar', entity_id: session.user.id, operation: 'upload', payload: { path }, file_path: fileUri, retry_count: 0 });
      } catch (e) {
        console.log('syncQueue insert error (non-critical):', e);
      }
      return { url: null, error };
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await updateProfile({ avatar_url: data.publicUrl });
    return { url: data.publicUrl, error: null };
  };

  const fetchSessions = async () => {
    if (!session?.user?.id) return [];
    const { data, error } = await supabase.from('sessions').select('*').eq('user_id', session.user.id).order('check_in_time', { ascending: false });
    if (error) return [];
    return (data as any[]).map((s: any) => ({
      sessionId: s.id,
      checkInTime: new Date(s.check_in_time).getTime(),
      checkOutTime: s.check_out_time ? new Date(s.check_out_time).getTime() : null,
      reason: s.reason,
    })) as Session[];
  };

  const checkIn = async () => {
    if (!session?.user?.id) return { session: null, error: 'Not authenticated' };
    const { data, error } = await supabase.from('sessions').insert({ user_id: session.user.id, check_in_time: new Date().toISOString() }).select().single();
    if (error) {
      try {
        const currentDb = await getDb();
        await currentDb.syncQueue.insert({ user_id: session.user.id, entity_type: 'session', entity_id: '', operation: 'upsert', payload: { user_id: session.user.id, check_in_time: new Date().toISOString() }, file_path: '', retry_count: 0 });
      } catch (e) {
        console.log('syncQueue insert error (non-critical):', e);
      }
      return { session: null, error };
    }
    if (!data) return { session: null, error: 'No data returned' };
    const newSession: Session = { sessionId: data.id, checkInTime: new Date(data.check_in_time).getTime(), checkOutTime: null, reason: null };
    try {
      const currentDb = await getDb();
      await currentDb.sessions.put({ ...newSession, checkInTime: newSession.checkInTime, checkOutTime: null, reason: null });
    } catch (e) {
      console.log('Local session cache error (non-critical):', e);
    }
    return { session: newSession, error: null };
  };

  const checkOut = async (sessionId: string, reason?: string) => {
    if (!session?.user?.id) return { error: 'Not authenticated' };
    const { error } = await supabase.from('sessions').update({ check_out_time: new Date().toISOString(), reason: reason ?? null }).eq('id', sessionId).eq('user_id', session.user.id);
    if (error) {
      try {
        const currentDb = await getDb();
        await currentDb.syncQueue.insert({ user_id: session.user.id, entity_type: 'session', entity_id: sessionId, operation: 'upsert', payload: { check_out_time: new Date().toISOString(), reason }, file_path: '', retry_count: 0 });
      } catch (e) {
        console.log('syncQueue insert error (non-critical):', e);
      }
    }
    return { error };
  };

  return (
    <SupabaseContext.Provider value={{ session, profile, loading, isOnline, signUp, verifyOtp, signIn, signOut, updateProfile, uploadAvatar, refreshProfile, fetchSessions, checkIn, checkOut }}>
      {children}
    </SupabaseContext.Provider>
  );
};
