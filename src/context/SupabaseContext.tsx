import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, Feedback } from '../types';
import { Platform } from 'react-native';

const GUEST_USER_ID = 'guest-user-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

const Storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    try { return await AsyncStorage.getItem(key); } catch { return null; }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
    } else {
      try { await AsyncStorage.setItem(key, value); } catch {}
    }
  },
};

export interface SupabaseContextValue {
  profile: Profile | null;
  loading: boolean;
  isOnline: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any | null }>;
  uploadAvatar: (fileUri: string) => Promise<{ url: string | null; error: any | null }>;
  refreshProfile: () => Promise<void>;
  createFeedback: (feedback: { type: Feedback['type']; email?: string; content: string; metadata?: Record<string, any>; }) => Promise<{ error: any | null }>;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export const useSupabase = () => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within a SupabaseProvider');
  return ctx;
};

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const updateOnlineStatus = useCallback(async () => {
    try {
      const NetInfo = (await import('@react-native-community/netinfo')).default;
      const state = await NetInfo.fetch();
      setIsOnline(state.isConnected ?? false);
    } catch (e) {
      console.log('NetInfo fetch error:', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        let currentProfile: Profile | null = null;
        
        const storedProfile = await Storage.getItem('attenary-profile');
        if (storedProfile) {
          try {
            currentProfile = JSON.parse(storedProfile) as Profile;
          } catch {}
        }
        
        if (!currentProfile) {
          currentProfile = {
            id: GUEST_USER_ID,
            email: '',
            full_name: '',
            job_title: '',
            department: '',
            avatar_url: '',
            onboarding_completed: false,
            language: 'en',
            created_at: Date.now(),
            updated_at: Date.now(),
          };
          await Storage.setItem('attenary-profile', JSON.stringify(currentProfile));
        }
        
        setProfile(currentProfile);
        setLoading(false);
        await updateOnlineStatus();
      } catch (e) {
        console.log('Init error (non-critical):', e);
        setLoading(false);
      }
    };
    init();
  }, [updateOnlineStatus]);

  const refreshProfile = useCallback(async () => {
    try {
      const storedProfile = await Storage.getItem('attenary-profile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile) as Profile;
        setProfile(parsed);
      }
    } catch (e) {
      console.log('refreshProfile error (non-critical):', e);
    }
  }, []);

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const updatedProfile = { ...profile, ...updates, updated_at: Date.now() } as Profile;
      await Storage.setItem('attenary-profile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);

      if (isOnline && supabase) {
        const profilePayload = {
          ...updates,
          id: updatedProfile.id,
          updated_at: updatedProfile.updated_at,
          onboarding_completed: updatedProfile.onboarding_completed,
          full_name: updatedProfile.full_name,
          email: updatedProfile.email,
          job_title: updatedProfile.job_title,
          department: updatedProfile.department,
        };
        const { error } = await supabase
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'id' });
        if (error) {
          console.log('Supabase profile sync error (non-critical):', error);
        }
      }
      return { error: null };
    } catch (e) {
      console.log('updateProfile error:', e);
      return { error: e || 'Update failed' };
    }
  };

  const uploadAvatar = async (fileUri: string) => {
    try {
      if (!profile) return { url: null, error: 'No profile' };

      if (!isOnline) {
        const avatarUrl = `local-avatar-${Date.now()}`;
        await updateProfile({ avatar_url: fileUri || avatarUrl });
        return { url: fileUri || avatarUrl, error: null };
      }

      const path = `avatars/${profile.id}.jpg`;
      let blob: Blob;
      
      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        blob = await response.blob();
      } else {
        const response = await fetch(fileUri);
        blob = await response.blob();
      }
      
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, blob, {
          cacheControl: '3600',
          upsert: true,
        });
      
      if (error) {
        console.log('Avatar upload error (non-critical):', error);
        return { url: null, error };
      }
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile({ avatar_url: data.publicUrl });
      return { url: data.publicUrl, error: null };
    } catch (e) {
      console.log('uploadAvatar error:', e);
      if (profile) {
        await updateProfile({ avatar_url: fileUri });
        return { url: fileUri, error: null };
      }
      return { url: null, error: e };
    }
  };

  const createFeedback = async (
    feedback: {
      type: Feedback['type'];
      email?: string;
      content: string;
      metadata?: Record<string, any>;
    },
  ) => {
    try {
      const payload = {
        user_id: profile?.id || GUEST_USER_ID,
        type: feedback.type,
        email: feedback.email ?? null,
        content: feedback.content,
        metadata: feedback.metadata ?? null,
      };
      const { error } = await supabase.from('feedbacks').insert(payload);
      return { error };
    } catch (e) {
      console.log('createFeedback error:', e);
      return { error: e };
    }
  };

  return (
    <SupabaseContext.Provider
      value={{
        profile,
        loading,
        isOnline,
        updateProfile,
        uploadAvatar,
        refreshProfile,
        createFeedback,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};
