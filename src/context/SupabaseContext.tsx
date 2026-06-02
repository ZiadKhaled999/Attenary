import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { openDb } from '../db/database';
import NetInfo from '@react-native-community/netinfo';
import { Profile, Session, Feedback } from '../types';
import { Database } from '../db/database';
import { createSupabaseClient } from '../config/supabase';

export interface SupabaseContextValue {
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  isOnline: boolean;
  signUp: (email: string, password: string) => Promise<{ error: { code?: string; message: string } | null }>;
  resendOtp: (email: string) => Promise<{ error: { code?: string; message: string } | null }>;
  checkEmailRegistered: (email: string) => Promise<{ registered: boolean; error: { code?: string; message: string } | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: { code?: string; message: string } | null }>;
  signIn: (email: string, password: string) => Promise<{ error: { code?: string; message: string } | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any | null }>;
  uploadAvatar: (fileUri: string) => Promise<{ url: string | null; error: any | null }>;
  refreshProfile: () => Promise<void>;
  fetchSessions: () => Promise<Session[]>;
  checkIn: () => Promise<{ session: Session | null; error: any | null }>;
  checkOut: (sessionId: string, reason?: string) => Promise<{ error: any | null }>;
  createFeedback: (feedback: { type: Feedback['type']; email?: string; content: string; metadata?: Record<string, any>; }) => Promise<{ error: any | null }>;
}

interface AuthError {
  code?: string;
  message: string;
}

const authError = (code = 'unknown', message = 'An unknown error occurred'): AuthError => ({ code, message });

export const mirrorCreateAccount = async (email: string, password: string): Promise<{ error: { code?: string; message: string } | null }> => {
  try {
    const supabase = createSupabaseClient(null);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      const errCode = 'supabase_mirror_failed';
      const errMessage = error.message || 'Failed to create account in Supabase Auth.';
      return { error: authError(errCode, errMessage) };
    }
    return { error: null };
  } catch (e: any) {
    return { error: authError('supabase_mirror_failed', e?.message || 'Failed to create account in Supabase Auth.') };
  }
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export const useSupabase = () => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within a SupabaseProvider');
  return ctx;
};

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken, signOut: clerkSignOut, isLoaded, isSignedIn, userId } = useAuth();
  const { signIn: signInResource } = useSignIn();
  const { signUp: signUpResource } = useSignUp();

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
    if (!userId) return;
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createSupabaseClient(token);
      const res = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (res.error) throw res.error;
      const p = res.data as Profile;
      setProfile(p);
      void getDb().then(currentDb => currentDb.profiles.put(p).catch((e) => console.log('Local profile cache error (non-critical):', e))).catch((e) => console.log('getDb error (non-critical):', e));
    } catch (e) {
      console.log('refreshProfile error (non-critical):', e);
    }
  }, [userId, getToken, getDb]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && userId) {
      setSession({ user: { id: userId } });
      void refreshProfile();
    } else {
      setSession(null);
      setProfile(null);
    }
    setLoading(false);
  }, [isLoaded, isSignedIn, userId, refreshProfile]);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => setIsOnline(state.isConnected ?? false));
    void updateOnlineStatus();
    return () => {
      unsubscribeNetInfo();
    };
  }, [updateOnlineStatus]);

  const signUp = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await signUpResource.create({
        emailAddress: normalizedEmail,
        password,
      });
      if (result.status === 'complete') {
        return { error: null };
      }
      return { error: authError('sign_up_incomplete', 'Sign up could not be completed.') };
    } catch (e: any) {
      const status = e?.status;
      const message = e?.message || '';
      const errorCode = status || 'sign_up_failed';
      if (message.toLowerCase().includes('disabled')) {
        return { error: authError('sign_up_disabled', 'Sign ups are currently disabled. Please contact support or try again later.') };
      }
      const friendlyMessage =
        errorCode === 'verification_required'
          ? 'Confirm your email to activate the account.'
          : errorCode === 'user_exists'
          ? 'An account already exists for this email. Use Sign In.'
          : 'Sign up failed. Please try again.';
      return { error: authError(errorCode, friendlyMessage) };
    }
  };

  const checkEmailRegistered = async (email: string) => {
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createSupabaseClient(token);
      const { data, error } = await supabase.from('profiles').select('id').eq('email', email.toLowerCase().trim()).limit(1);
      if (error) return { registered: false, error: authError('profile_lookup_failed', error.message || 'Profile lookup failed.') };
      if (data && data.length > 0) return { registered: true, error: null };
      return { registered: false, error: null };
    } catch (e: any) {
      return { registered: false, error: authError('profile_lookup_failed', e?.message || 'Profile lookup failed.') };
    }
  };

  const resendOtp = async (email: string) => {
    return { error: authError('verification_unsupported', 'Clerk handles email verification automatically via magic link.') };
  };

  const verifyOtp = async (email: string, token: string) => {
    return { error: authError('verification_unsupported', 'Clerk handles email verification automatically via magic link.') };
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInResource.create({
        identifier: email.trim().toLowerCase(),
        password,
      });
      if (result.status === 'complete') {
        return { error: null };
      }
      return { error: authError('sign_in_incomplete', 'Sign in could not be completed.') };
    } catch (e: any) {
      const status = e?.status;
      const errorCode = status || 'sign_in_not_found';
      const message =
        errorCode === 'not_found' || errorCode === 'sign_in_not_found'
          ? "Couldn't find your account. Create an account first or verify your email if you just signed up."
          : 'Sign in failed. Please check your credentials and try again.';
      return { error: authError(errorCode, message) };
    }
  };

  const handleSignOut = async () => {
    try {
      await clerkSignOut();
    } catch {}
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return { error: authError('not_authenticated', 'Not authenticated.') };
    const profilePayload = { ...updates, id: userId, updated_at: Date.now() } as any;
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createSupabaseClient(token);
      const { error } = await supabase.from('profiles').update(profilePayload).eq('id', userId);
      if (error) {
        try {
          const currentDb = await getDb();
          await currentDb.syncQueue.insert({ user_id: userId, entity_type: 'profile', entity_id: userId, operation: 'upsert', payload: profilePayload, file_path: '', retry_count: 0 });
        } catch (e) {
          console.log('syncQueue insert error (non-critical):', e);
        }
        return { error: authError('update_profile_failed', error.message || 'Profile update failed.') };
      }
      setProfile(p => (p ? { ...p, ...profilePayload } : p));
      return { error: null };
    } catch (e: any) {
      return { error: authError('update_profile_failed', e?.message || 'Update failed.') };
    }
  };

  const uploadAvatar = async (fileUri: string) => {
    if (!userId) return { url: null, error: authError('not_authenticated', 'Not authenticated.') };
    const path = `avatars/${userId}.jpg`;
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createSupabaseClient(token);
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
          await currentDb.syncQueue.insert({ user_id: userId, entity_type: 'avatar', entity_id: userId, operation: 'upload', payload: { path }, file_path: fileUri, retry_count: 0 });
        } catch (e) {
          console.log('syncQueue insert error (non-critical):', e);
        }
        return { url: null, error };
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      void updateProfile({ avatar_url: data.publicUrl });
      return { url: data.publicUrl, error: null };
    } catch (e) {
      console.log('uploadAvatar error:', e);
      return { url: null, error: e || 'Upload failed' };
    }
  };

  const fetchSessions = async () => {
    if (!userId) return [];
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createSupabaseClient(token);
      const { data, error } = await supabase.from('sessions').select('*').eq('user_id', userId).order('check_in_time', { ascending: false });
      if (error) return [];
      return (data as any[]).map((s: any) => ({
        sessionId: s.id,
        checkInTime: new Date(s.check_in_time).getTime(),
        checkOutTime: s.check_out_time ? new Date(s.check_out_time).getTime() : null,
        reason: s.reason,
      })) as Session[];
    } catch (e) {
      console.log('fetchSessions error:', e);
      return [];
    }
  };

  const checkIn = async () => {
    if (!userId) return { session: null, error: 'Not authenticated' };
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createSupabaseClient(token);
      const { data, error } = await supabase.from('sessions').insert({ user_id: userId, check_in_time: new Date().toISOString() }).select().single();
      if (error) {
        try {
          const currentDb = await getDb();
          await currentDb.syncQueue.insert({ user_id: userId, entity_type: 'session', entity_id: '', operation: 'upsert', payload: { user_id: userId, check_in_time: new Date().toISOString() }, file_path: '', retry_count: 0 });
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
    } catch (e) {
      console.log('checkIn error:', e);
      return { session: null, error: e };
    }
  };

  const checkOut = async (sessionId: string, reason?: string) => {
    if (!userId) return { error: 'Not authenticated' };
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createSupabaseClient(token);
      const { error } = await supabase.from('sessions').update({ check_out_time: new Date().toISOString(), reason: reason ?? null }).eq('id', sessionId).eq('user_id', userId);
      if (error) {
        try {
          const currentDb = await getDb();
          await currentDb.syncQueue.insert({ user_id: userId, entity_type: 'session', entity_id: sessionId, operation: 'upsert', payload: { check_out_time: new Date().toISOString(), reason }, file_path: '', retry_count: 0 });
        } catch (e) {
          console.log('syncQueue insert error (non-critical):', e);
        }
        return { error };
      }
      return { error: null };
    } catch (e) {
      console.log('checkOut error:', e);
      return { error: e };
    }
  };

  const createFeedback = async (feedback: { type: Feedback['type']; email?: string; content: string; metadata?: Record<string, any> }) => {
    if (!userId) return { error: 'Not authenticated' };
    const payload = {
      user_id: userId,
      type: feedback.type,
      email: feedback.email ?? null,
      content: feedback.content,
      metadata: feedback.metadata ?? null,
    };
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createSupabaseClient(token);
      const { error } = await supabase.from('feedbacks').insert(payload);
      return { error };
    } catch (e) {
      console.log('createFeedback error:', e);
      return { error: e };
    }
  };

  return (
    <SupabaseContext.Provider value={{
      session,
      profile,
      loading,
      isOnline,
      signUp,
      resendOtp,
      checkEmailRegistered,
      verifyOtp,
      signIn,
      signOut: handleSignOut,
      updateProfile,
      uploadAvatar,
      refreshProfile,
      fetchSessions,
      checkIn,
      checkOut,
      createFeedback,
    }}>
      {children}
    </SupabaseContext.Provider>
  );
};
