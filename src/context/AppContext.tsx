import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackupSchema, RestorePreview, createBackup as utilCreateBackup, finalizeBackup, saveBackupToFile as utilSaveBackupToFile, saveBackupToStorage, loadBackupFromStorage, loadBackupFromFile, validateBackup, previewRestore, computeRecordChecksum } from '../utils/backup';
import { Session, AppData } from '../types';

interface AppContextType {
  appData: AppData;
  loading: boolean;
  storageError: string | null;
  saveData: () => Promise<boolean>;
  loadData: () => Promise<void>;
  checkIn: () => Promise<void>;
  checkOut: (reason?: string) => Promise<void>;
  setEmployeeName: (name: string) => Promise<void>;
  setEmail: (email: string) => Promise<void>;
  setJobTitle: (jobTitle: string) => Promise<void>;
  setDepartment: (department: string) => Promise<void>;
  setHourRate: (rate: number) => Promise<void>;
  setAvatarUrl: (url: string) => Promise<void>;
  addSessions: (sessions: Session[]) => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
  updateOnboardingProgress: (step: number) => Promise<void>;
  resetOnboardingProgress: () => Promise<void>;
  clearStorageError: () => void;
  deleteSession: (sessionId: string) => Promise<boolean>;
  updateSessionReason: (sessionId: string, reason: string) => Promise<boolean>;
  createBackup: () => Promise<BackupSchema>;
  saveBackup: (backup: BackupSchema) => Promise<{ fileName: string; size: number } | null>;
  getStoredBackup: () => Promise<BackupSchema | null>;
  importBackupFromFile: () => Promise<BackupSchema | null>;
  previewImport: (backup: BackupSchema) => Promise<RestorePreview>;
  restoreBackup: (backup: BackupSchema, mode?: 'merge' | 'replace' | 'skip', dryRun?: boolean) => Promise<RestorePreview>;
}

const STORAGE_KEY = 'PHARMACY_ATTENDANCE_DATA_V2';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const Provider = ({ children }: AppProviderProps) => {
  const [appData, setAppData] = useState<AppData>({
    sessions: [],
    employeeName: '',
    email: '',
    jobTitle: '',
    department: '',
    avatarUrl: '',
    onboardingCompleted: false,
    onboardingProgress: {
      currentStep: 0,
      completedSteps: [],
      lastVisited: Date.now(),
    },
    appSettings: {
      theme: 'dark',
      notifications: true,
    },
    hourRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const appDataRef = useRef<AppData>(appData);
  appDataRef.current = appData;

  const getStorageItem = async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    try { return await AsyncStorage.getItem(key); } catch { return null; }
  };

  const setStorageItem = async (key: string, value: string): Promise<boolean> => {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); return true; } catch { return false; }
    }
    try { await AsyncStorage.setItem(key, value); return true; } catch { return false; }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setStorageError(null);
      const dataString = await getStorageItem(STORAGE_KEY);
      if (dataString) {
        try {
          const parsed = JSON.parse(dataString);
          let sessions = parsed.sessions || [];
          
          // Close any orphaned active sessions from previous app sessions
          // (prevents auto-starting a session on app open from stored data)
          const hasActive = sessions.some((s: any) => s.checkOutTime === null);
          if (hasActive) {
            const now = Date.now();
            sessions = sessions.map((s: any) =>
              s.checkOutTime === null ? { ...s, checkOutTime: now } : s,
            );
          }
          
          const correctedData: AppData = {
            sessions,
            employeeName: parsed.employeeName || '',
            email: parsed.email || '',
            jobTitle: parsed.jobTitle || '',
            department: parsed.department || '',
            avatarUrl: parsed.avatarUrl || '',
            onboardingCompleted: parsed.onboardingCompleted || false,
            onboardingProgress: parsed.onboardingProgress || { currentStep: 0, completedSteps: [], lastVisited: Date.now() },
            appSettings: parsed.appSettings || { theme: 'dark', notifications: true },
            hourRate: parsed.hourRate ?? 0,
          };
          
          setAppData(correctedData);
          
          // Persist the corrected sessions immediately
          const dataStringToSave = JSON.stringify(correctedData);
          await setStorageItem(STORAGE_KEY, dataStringToSave);
        } catch {
          setStorageError('Using default settings.');
        }
      }
    } catch (error) {
      console.log('Data load error (non-critical):', error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (): Promise<boolean> => {
    try {
      const dataString = JSON.stringify(appDataRef.current);
      return await setStorageItem(STORAGE_KEY, dataString);
    } catch (error) {
      console.log('Data save error (non-critical):', error instanceof Error ? error.message : error);
      return false;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setEmployeeName = async (name: string) => {
    setAppData((prev) => ({ ...prev, employeeName: name }));
    await saveData();
  };

  const setEmail = async (email: string) => {
    setAppData((prev) => ({ ...prev, email }));
    await saveData();
  };

  const setJobTitle = async (jobTitle: string) => {
    setAppData((prev) => ({ ...prev, jobTitle }));
    await saveData();
  };

  const setDepartment = async (department: string) => {
    setAppData((prev) => ({ ...prev, department }));
    await saveData();
  };

  const setAvatarUrl = async (url: string) => {
    setAppData((prev) => ({ ...prev, avatarUrl: url }));
    await saveData();
  };

  const setHourRate = async (rate: number) => {
    setAppData((prev) => ({ ...prev, hourRate: rate }));
    await saveData();
  };

  const checkIn = async () => {
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
    const session: Session = { sessionId, checkInTime: Date.now(), checkOutTime: null, reason: null, reasonEditedAt: null };
    setAppData((prev) => ({ ...prev, sessions: [...prev.sessions, session] }));
    await saveData();
  };

  const checkOut = async (reason?: string) => {
    const activeId = appData.sessions.find((s) => s.checkOutTime === null)?.sessionId;
    if (!activeId) return;
    setAppData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.sessionId === activeId ? { ...s, checkOutTime: Date.now(), reason: reason || null } : s,
      ),
    }));
    await saveData();
  };

  const addSessions = async (newSessions: Session[]): Promise<boolean> => {
    const existingCheckInTimes = new Set(appData.sessions.map((s) => s.checkInTime));
    const filteredSessions = newSessions.filter((session) => !existingCheckInTimes.has(session.checkInTime));
    if (filteredSessions.length === 0) return false;
    setAppData((prev) => ({ ...prev, sessions: [...prev.sessions, ...filteredSessions] }));
    await saveData();
    return true;
  };

  const completeOnboarding = async () => {
    setAppData((prev) => ({ ...prev, onboardingCompleted: true }));
    await saveData();
  };

  const updateOnboardingProgress = async (step: number) => {
    setAppData((prev) => ({
      ...prev,
      onboardingProgress: {
        currentStep: step,
        completedSteps: prev.onboardingProgress.completedSteps.includes(step) ? prev.onboardingProgress.completedSteps : [...prev.onboardingProgress.completedSteps, step],
        lastVisited: Date.now(),
      },
    }));
    await saveData();
  };

  const resetOnboardingProgress = async () => {
    setAppData((prev) => ({
      ...prev,
      onboardingCompleted: false,
      onboardingProgress: { currentStep: 0, completedSteps: [], lastVisited: Date.now() },
    }));
    await saveData();
  };

  const clearStorageError = () => setStorageError(null);

  const deleteSession = async (sessionId: string): Promise<boolean> => {
    const sessionToDelete = appData.sessions.find((s) => s.sessionId === sessionId);
    if (!sessionToDelete) return false;
    if (!sessionToDelete.checkOutTime) {
      Alert.alert('Cannot Delete Active Session', 'Please check out first before deleting this session.', [{ text: 'OK' }]);
      return false;
    }
    setAppData((prev) => ({ ...prev, sessions: prev.sessions.filter((s) => s.sessionId !== sessionId) }));
    const success = await saveData();
    if (success) {
      Alert.alert('Success', 'Session deleted successfully.');
      return true;
    }
    setAppData((prev) => ({ ...prev, sessions: [...prev.sessions, sessionToDelete] }));
    Alert.alert('Error', 'Failed to save changes. Session not deleted.');
    return false;
  };

  const updateSessionReason = async (sessionId: string, reason: string): Promise<boolean> => {
    const session = appData.sessions.find((s) => s.sessionId === sessionId);
    if (!session) return false;
    // Do not allow editing reason for an active session
    if (session.checkOutTime === null) {
      Alert.alert('Cannot Edit Active Session', 'Self assessment cannot be edited while the session is active.');
      return false;
    }
    const alreadyEdited = (session as any).reasonEditedAt != null;
    if (alreadyEdited) return false;
    const now = Date.now();
    setAppData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.sessionId === sessionId ? { ...s, reason, reasonEditedAt: now } : s,
      ),
    }));
    const success = await saveData();
    if (!success) {
      setAppData((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.sessionId === sessionId
            ? { ...s, reason: session.reason ?? null, reasonEditedAt: (session as any).reasonEditedAt ?? null }
            : s,
        ),
      }));
      Alert.alert('Error', 'Failed to save changes.');
      return false;
    }
    return true;
  };

  const createBackup = async (): Promise<BackupSchema> => {
    const backup = utilCreateBackup(appData);
    return finalizeBackup(backup);
  };

  const saveBackup = async (backup: BackupSchema): Promise<{ fileName: string; size: number } | null> => {
    const saved = await utilSaveBackupToFile(backup);
    const stored = await saveBackupToStorage(backup);
    if (stored && saved) {
      return saved;
    }
    return null;
  };

  const getStoredBackup = async (): Promise<BackupSchema | null> => {
    return loadBackupFromStorage();
  };

  const importBackupFromFile = async (): Promise<BackupSchema | null> => {
    return loadBackupFromFile();
  };

  const previewImport = async (backup: BackupSchema): Promise<RestorePreview> => {
    const validation = await validateBackup(backup);
    if (!validation.valid) {
      return {
        valid: false,
        schemaVersion: backup?.header?.schemaVersion || 'unknown',
        appVersion: backup?.header?.appVersion || 'unknown',
        recordCounts: {
          sessions: { new: 0, duplicate: 0, conflicting: 0 },
          employeeName: false,
          email: false,
          jobTitle: false,
          department: false,
          hourRate: false,
          onboardingProgress: false,
          appSettings: false,
        },
        totalNewRecords: 0,
        totalDuplicate: 0,
        totalConflicting: 0,
        error: validation.error,
      };
    }
    const preview = await previewRestore(backup, appDataRef.current);
    return preview;
  };

  const restoreBackup = async (
    backup: BackupSchema,
    mode: 'merge' | 'replace' | 'skip' = 'skip',
    dryRun: boolean = false
  ): Promise<RestorePreview> => {
    const validation = await validateBackup(backup);
    if (!validation.valid) {
      return {
        valid: false,
        schemaVersion: backup?.header?.schemaVersion || 'unknown',
        appVersion: backup?.header?.appVersion || 'unknown',
        recordCounts: {
          sessions: { new: 0, duplicate: 0, conflicting: 0 },
          employeeName: false,
          email: false,
          jobTitle: false,
          department: false,
          hourRate: false,
          onboardingProgress: false,
          appSettings: false,
        },
        totalNewRecords: 0,
        totalDuplicate: 0,
        totalConflicting: 0,
        error: validation.error,
      };
    }

    const mergedSessions: Session[] = [...appData.sessions];
    let importedSessions = 0;
    let skippedSessions = 0;

    for (const session of backup.data.sessions) {
      const existingIndex = mergedSessions.findIndex(s => s.sessionId === session.sessionId);
      if (existingIndex === -1) {
        mergedSessions.push(session);
        importedSessions++;
      } else {
        const existingChecksum = computeRecordChecksum(mergedSessions[existingIndex]);
        const incomingChecksum = computeRecordChecksum(session);
        if (existingChecksum !== incomingChecksum) {
          if (mode === 'replace') {
            mergedSessions[existingIndex] = session;
            importedSessions++;
          } else {
            skippedSessions++;
          }
        } else {
          skippedSessions++;
        }
      }
    }

    if (dryRun) {
      return {
        valid: true,
        schemaVersion: backup.header.schemaVersion,
        appVersion: backup.header.appVersion,
        recordCounts: {
          sessions: { new: importedSessions, duplicate: skippedSessions, conflicting: 0 },
          employeeName: false,
          email: false,
          jobTitle: false,
          department: false,
          hourRate: false,
          onboardingProgress: false,
          appSettings: false,
        },
        totalNewRecords: importedSessions,
        totalDuplicate: skippedSessions,
        totalConflicting: 0,
      };
    }

    const previousData = appDataRef.current;

    try {
      setAppData(prev => ({
        ...prev,
        sessions: mergedSessions,
        employeeName: backup.data.employeeName || prev.employeeName,
        email: backup.data.email || prev.email,
        jobTitle: backup.data.jobTitle || prev.jobTitle,
        department: backup.data.department || prev.department,
        hourRate: backup.data.hourRate ?? prev.hourRate,
        onboardingCompleted: backup.data.onboardingCompleted ?? prev.onboardingCompleted,
        onboardingProgress: backup.data.onboardingProgress || prev.onboardingProgress,
        appSettings: backup.data.appSettings || prev.appSettings,
      }));

      const saved = await saveData();
      if (!saved) throw new Error('Failed to save restored data');

    return {
      valid: true,
      schemaVersion: backup.header.schemaVersion,
      appVersion: backup.header.appVersion,
      recordCounts: {
        sessions: { new: importedSessions, duplicate: skippedSessions, conflicting: 0 },
        employeeName: !!backup.data.employeeName,
        email: !!backup.data.email,
        jobTitle: !!backup.data.jobTitle,
        department: !!backup.data.department,
        hourRate: backup.data.hourRate > 0,
        onboardingProgress: !!backup.data.onboardingProgress,
        appSettings: !!backup.data.appSettings,
      },
      totalNewRecords: importedSessions,
      totalDuplicate: skippedSessions,
      totalConflicting: 0,
    };
    } catch (error) {
      setAppData(previousData);
    return {
      valid: false,
      schemaVersion: backup?.header?.schemaVersion || 'unknown',
      appVersion: backup?.header?.appVersion || 'unknown',
      recordCounts: {
        sessions: { new: 0, duplicate: 0, conflicting: 0 },
        employeeName: false,
        email: false,
        jobTitle: false,
        department: false,
        hourRate: false,
        onboardingProgress: false,
        appSettings: false,
      },
      totalNewRecords: 0,
      totalDuplicate: 0,
      totalConflicting: 0,
      error: validation.error,
    };
    }
  };

  const value = {
    appData, loading, storageError,
    saveData, loadData, checkIn, checkOut,
    setEmployeeName, setEmail, setJobTitle, setDepartment, setHourRate, setAvatarUrl,
    addSessions, completeOnboarding, updateOnboardingProgress, resetOnboardingProgress,
    clearStorageError, deleteSession, updateSessionReason,
    createBackup, saveBackup, getStoredBackup,
    importBackupFromFile, previewImport, restoreBackup,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};