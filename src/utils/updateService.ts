import { canOpenURL, openURL } from 'expo-linking';

export interface UpdateInfo {
  version: string;
  releaseNotes: string;
  downloadUrl: string;
  mandatory: boolean;
}

const UPDATE_CONFIG = {
  checkUrl: 'https://raw.githubusercontent.com/orynos/attenary/main/update.json',
  currentVersion: '3.23.7',
};

export const checkForUpdate = async (): Promise<UpdateInfo | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(UPDATE_CONFIG.checkUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const updateData: UpdateInfo = await response.json();
    
    const currentVersion = UPDATE_CONFIG.currentVersion;
    const latestVersion = updateData.version;

    if (isNewVersionAvailable(currentVersion, latestVersion)) {
      return updateData;
    }

    return null;
  } catch (error) {
    console.log('Update check skipped (non-critical):', error?.message || error);
    return null;
  }
};

const isNewVersionAvailable = (current: string, latest: string): boolean => {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) {
      return true;
    }
    if (latestPart < currentPart) {
      return false;
    }
  }

  return false;
};

export const downloadAndInstallUpdate = async (downloadUrl: string): Promise<boolean> => {
  try {
    const canOpen = await canOpenURL(downloadUrl);
    
    if (canOpen) {
      await openURL(downloadUrl);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log('Error opening download URL:', error);
    return false;
  }
};

export const getCurrentVersion = (): string => {
  return UPDATE_CONFIG.currentVersion;
};