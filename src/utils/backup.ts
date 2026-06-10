import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Session } from '../types';
import { BackupSchema, BackupData, BACKUP_SCHEMA_VERSION, BACKUP_STORAGE_KEY, RestorePreview, RestoreResult, RestoreOptions } from '../types/backup';

export { BackupSchema, RestorePreview, computeRecordChecksum };

const APP_VERSION = '3.23.7';

async function calculateChecksum(data: string): Promise<string> {
  if (Platform.OS === 'web') {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    const { CryptoDigestAlgorithm, CryptoEncoding } = await import('expo-crypto');
    const { digestStringAsync } = await import('expo-crypto');
    return digestStringAsync(
      CryptoDigestAlgorithm.SHA256,
      data,
      { encoding: CryptoEncoding.HEX }
    );
  }
}

function computeRecordChecksum(session: Session): string {
  const normalized = {
    sessionId: session.sessionId,
    checkInTime: session.checkInTime,
    checkOutTime: session.checkOutTime,
    reason: session.reason,
  };
  return JSON.stringify(normalized);
}

export function createBackup(appData: AppData): BackupSchema {
  const data: BackupData = {
    sessions: appData.sessions,
    employeeName: appData.employeeName,
    email: appData.email,
    jobTitle: appData.jobTitle,
    department: appData.department,
    onboardingCompleted: appData.onboardingCompleted,
    onboardingProgress: appData.onboardingProgress,
    appSettings: appData.appSettings,
    hourRate: appData.hourRate,
  };

  const _dataString = JSON.stringify(data);
  
  return {
    header: {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      createdAt: new Date().toISOString(),
      checksum: '',
    },
    data,
  };
}

export async function finalizeBackup(backup: BackupSchema): Promise<BackupSchema> {
  const dataString = JSON.stringify(backup.data);
  const checksum = await calculateChecksum(dataString);
  return {
    ...backup,
    header: {
      ...backup.header,
      checksum,
    },
  };
}

export async function saveBackupToFile(backup: BackupSchema): Promise<{ fileName: string; size: number }> {
  const fileName = `attenary-backup-${Date.now()}.json`;
  const backupString = JSON.stringify(backup, null, 2);
  
  if (Platform.OS === 'web') {
    const blob = new Blob([backupString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return { fileName, size: backupString.length };
  } else {
    const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
    const filePath = cacheDir + fileName;
    await (FileSystem as any).writeAsStringAsync(filePath, backupString, {
      encoding: (FileSystem as any).EncodingType.UTF8,
    });
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Backup Attenary Data',
    });
    return { fileName, size: backupString.length };
  }
}

export async function saveBackupToStorage(backup: BackupSchema): Promise<boolean> {
  try {
    const backupString = JSON.stringify(backup);
    if (Platform.OS === 'web') {
      localStorage.setItem(BACKUP_STORAGE_KEY, backupString);
    } else {
      await AsyncStorage.setItem(BACKUP_STORAGE_KEY, backupString);
    }
    return true;
  } catch (error) {
    console.error('Failed to save backup to storage:', error);
    return false;
  }
}

export async function loadBackupFromStorage(): Promise<BackupSchema | null> {
  try {
    let backupString: string | null = null;
    if (Platform.OS === 'web') {
      backupString = localStorage.getItem(BACKUP_STORAGE_KEY);
    } else {
      backupString = await AsyncStorage.getItem(BACKUP_STORAGE_KEY);
    }
    
    if (!backupString) return null;
    return JSON.parse(backupString) as BackupSchema;
  } catch (error) {
    console.error('Failed to load backup from storage:', error);
    return null;
  }
}

export async function loadBackupFromFile(): Promise<BackupSchema | null> {
  try {
    const result = await (DocumentPicker as any).getDocumentAsync({
      type: ['application/json'],
    });

    if ((result as any).canceled || (result as any).type === 'cancel') {
      return null;
    }

    const uri = (result as any).uri || (result as any).assets?.[0]?.uri;
    if (!uri) return null;

    const fileContent = await (FileSystem as any).readAsStringAsync(uri, {
      encoding: (FileSystem as any).EncodingType.UTF8,
    });

    const backup = JSON.parse(fileContent) as BackupSchema;
    return backup;
  } catch (error) {
    console.error('Failed to load backup from file:', error);
    return null;
  }
}

export async function validateBackup(backup: BackupSchema): Promise<{ valid: boolean; error?: string }> {
  if (!backup.header || !backup.data) {
    return { valid: false, error: 'Invalid backup format: missing header or data' };
  }

  if (!backup.header.schemaVersion || !backup.header.checksum) {
    return { valid: false, error: 'Invalid backup format: missing required header fields' };
  }

  const dataString = JSON.stringify(backup.data);
  const calculatedChecksum = await calculateChecksum(dataString);
  
  if (calculatedChecksum !== backup.header.checksum) {
    return { valid: false, error: 'Backup integrity check failed: checksum mismatch' };
  }

  const currentVersion = BACKUP_SCHEMA_VERSION;
  const backupVersion = backup.header.schemaVersion;
  
  const backupMajor = parseInt(backupVersion.split('.')[0], 10);

  if (backupMajor > parseInt(currentVersion.split('.')[0], 10)) {
    return { valid: false, error: `Incompatible backup version: ${backupVersion}. App version: ${currentVersion}` };
  }

  return { valid: true };
}

export async function previewRestore(
  backup: BackupSchema,
  currentData: AppData
): Promise<RestorePreview> {
  const existingSessionChecksums = new Map(
    currentData.sessions.map(s => [s.sessionId, computeRecordChecksum(s)])
  );

  const sessionAnalysis = { new: 0, duplicate: 0, conflicting: 0 };

  for (const session of backup.data.sessions) {
    const existingChecksum = existingSessionChecksums.get(session.sessionId);
    const newChecksum = computeRecordChecksum(session);

    if (!existingChecksum) {
      sessionAnalysis.new++;
    } else if (existingChecksum === newChecksum) {
      sessionAnalysis.duplicate++;
    } else {
      sessionAnalysis.conflicting++;
    }
  }

  return {
    valid: true,
    schemaVersion: backup.header.schemaVersion,
    appVersion: backup.header.appVersion,
    recordCounts: {
      sessions: sessionAnalysis,
      employeeName: !!backup.data.employeeName,
      email: !!backup.data.email,
      jobTitle: !!backup.data.jobTitle,
      department: !!backup.data.department,
      hourRate: !!backup.data.hourRate,
      onboardingProgress: !!backup.data.onboardingProgress,
      appSettings: !!backup.data.appSettings,
    },
    totalNewRecords: sessionAnalysis.new,
    totalDuplicate: sessionAnalysis.duplicate,
    totalConflicting: sessionAnalysis.conflicting,
  };
}

export async function performRestore(
  backup: BackupSchema,
  currentData: AppData,
  options: RestoreOptions = { mode: 'skip', dryRun: false }
): Promise<RestoreResult> {
  const preview = await previewRestore(backup, currentData);
  
    if (!preview.valid) {
    return { success: false, error: preview.error, imported: { sessions: 0, employeeName: false, email: false, jobTitle: false, department: false, hourRate: false, onboardingProgress: false, appSettings: false }, skipped: { sessions: 0 } };
  }

  if (options.dryRun) {
    return {
      success: true,
      imported: {
        sessions: preview.totalNewRecords,
        employeeName: false,
        email: false,
        jobTitle: false,
        department: false,
        hourRate: false,
        onboardingProgress: false,
        appSettings: false,
      },
      skipped: {
        sessions: preview.totalDuplicate,
      },
    };
  }

  let sessionsToAdd: Session[] = [];
  let skippedCount = 0;

  for (const session of backup.data.sessions) {
    const existingSession = currentData.sessions.find(s => s.sessionId === session.sessionId);
    const newChecksum = computeRecordChecksum(session);
    
    if (!existingSession) {
      sessionsToAdd.push(session);
    } else {
      const existingChecksum = computeRecordChecksum(existingSession);
      if (existingChecksum !== newChecksum) {
        if (options.mode === 'replace') {
          sessionsToAdd.push(session);
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }
  }

    return {
      success: true,
      imported: {
        sessions: sessionsToAdd.length,
        employeeName: false,
        email: false,
        jobTitle: false,
        department: false,
        hourRate: backup.data.hourRate > 0,
        onboardingProgress: false,
        appSettings: false,
      },
    skipped: {
      sessions: skippedCount,
    },
  };
}

function _logImportEvent(backup: BackupSchema, result: RestoreResult): void {
  const logEntry = {
    date: new Date().toISOString(),
    fileName: backup.header.appVersion,
    recordCounts: result.imported,
    conflicts: result.skipped.sessions,
  };
  if (Platform.OS === 'web') {
    try {
      const existing = localStorage.getItem('ATTENARY_IMPORT_LOG');
      const logs = existing ? JSON.parse(existing) : [];
      logs.push(logEntry);
      localStorage.setItem('ATTENARY_IMPORT_LOG', JSON.stringify(logs.slice(-100)));
    } catch {
      // Silently fail for logging
    }
  }
}