import React, { useEffect, useState } from 'react';
import { useConvex } from 'convex/react';
import { getOrCreateDeviceId } from '../utils/deviceId';
import { api } from '../../convex/_generated/api';

export function ConvexIdentityProvider({ children }: { children: React.ReactNode }) {
  const convex = useConvex();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    if (!deviceId || !convex) return;
    // Initialize profile with device ID on first run
    convex.mutation(api.profiles.upsert, {
      user_id: deviceId,
      email: null,
      full_name: null,
      job_title: null,
      department: null,
      avatar_url: null,
      language: null,
      onboarding_completed: false,
      updated_at: Date.now(),
    }).catch((e) => {
      console.warn('[ConvexIdentityProvider] Profile initialization failed:', e);
    });
  }, [convex, deviceId]);

  return <>{children}</>;
}
