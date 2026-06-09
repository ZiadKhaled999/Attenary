import { Platform } from 'react-native';

let webDeviceId: string | null = null;

async function getWebDeviceId(): Promise<string> {
  if (webDeviceId) return webDeviceId;
  try {
    const stored = localStorage.getItem('device_anon_id');
    if (stored) {
      webDeviceId = stored;
      return stored;
    }
  } catch {
    // ignore
  }
  const id = `anon_${crypto.randomUUID()}`;
  try {
    localStorage.setItem('device_anon_id', id);
    webDeviceId = id;
  } catch {
    // ignore
  }
  return id;
}

export async function getOrCreateDeviceId(): Promise<string> {
  if (Platform.OS === 'web') {
    return getWebDeviceId();
  }
  const SecureStore = await import('expo-secure-store');
  const DEVICE_ID_KEY = 'device_anon_id';
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = `anon_${crypto.randomUUID()}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}
