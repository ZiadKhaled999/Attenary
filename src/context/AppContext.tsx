import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackupSchema, RestorePreview, createBackup as utilCreateBackup, finalizeBackup, saveBackupToFile as utilSaveBackupToFile, saveBackupToStorage, loadBackupFromStorage, loadBackupFromFile, validateBackup, performRestore } from '../utils/backup';
import { Session } from '../types';

export interface AppData {
  sessions: Session[];
  employeeName: string;
  email: string;
  jobTitle: string;
  department: string;
  onboardingCompleted: boolean;
  onboardingProgress: {
    currentStep: number;
    completedSteps: number[];
    lastVisited: number;
  };
  appSettings: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export interface Session {
  sessionId: string;
  checkInTime: number;
  checkOutTime: number | null;
  reason: string | null;
}

interface AppContextType {
  appData: AppData;
  loading: boolean;
  saveData: () => Promise<boolean>;
  loadData: () => Promise<void>;
  checkIn: () => Promise<void>;
  checkOut: (reason?: string) => Promise<void>;
  setEmployeeName: (name: string) => Promise<void>;
  setEmail: (email: string) => Promise<void>;
  setJobTitle: (jobTitle: string) => Promise<void>;
  setDepartment: (department: string) => Promise<void>;
  addSessions: (sessions: Session[]) => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
  updateOnboardingProgress: (step: number) => Promise<void>;
  resetOnboardingProgress: () => Promise<void>;
  storageError: string | null;
  clearStorageError: () => void;
  deleteSession: (sessionId: string) => Promise<boolean>;
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
          setAppData({
            sessions: parsed.sessions || [],
            employeeName: parsed.employeeName || '',
            email: parsed.email || '',
            jobTitle: parsed.jobTitle || '',
            department: parsed.department || '',
            onboardingCompleted: parsed.onboardingCompleted || false,
            onboardingProgress: parsed.onboardingProgress || { currentStep: 0, completedSteps: [], lastVisited: Date.now() },
            appSettings: parsed.appSettings || { theme: 'dark', notifications: true },
          });
        } catch {
          setStorageError('Using default settings.');
          setAppData({
            sessions: [], employeeName: '', email: '', jobTitle: '', department: '',
            onboardingCompleted: false,
            onboardingProgress: { currentStep: 0, completedSteps: [], lastVisited: Date.now() },
            appSettings: { theme: 'dark', notifications: true },
          });
        }
      }
    } catch (error) {
      console.log('Data load error (non-critical):', error instanceof Error ? error.message : error);
      setStorageError('Using default settings.');
      setAppData({
        sessions: [], employeeName: '', email: '', jobTitle: '', department: '',
        onboardingCompleted: false,
        onboardingProgress: { currentStep: 0, completedSteps: [], lastVisited: Date.now() },
        appSettings: { theme: 'dark', notifications: true },
      });
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
    setAppData((prev: AppData) => ({ ...prev, employeeName: name }));
    await saveData();
  };

  const setEmail = async (email: string) => {
    setAppData((prev: AppData) => ({ ...prev, email }));
    await saveData();
  };

  const setJobTitle = async (jobTitle: string) => {
    setAppData((prev: AppData) => ({ ...prev, jobTitle }));
    await saveData();
  };

  const setDepartment = async (department: string) => {
    setAppData((prev: AppData) => ({ ...prev, department }));
    await saveData();
  };

  const checkIn = async () => {
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
    const session: Session = { sessionId, checkInTime: Date.now(), checkOutTime: null, reason: null };
    setAppData((prev: AppData) => ({ ...prev, sessions: [...prev.sessions, session] }));
    await saveData();
  };

  const checkOut = async (reason?: string) => {
    const activeId = appData.sessions.find((s) => s.checkOutTime === null)?.sessionId;
    if (!activeId) return;
    setAppData((prev: AppData) => ({
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
    setAppData((prev: AppData) => ({ ...prev, sessions: [...prev.sessions, ...filteredSessions] }));
    await saveData();
    return true;
  };

  const completeOnboarding = async () => {
    setAppData((prev: AppData) => ({ ...prev, onboardingCompleted: true }));
    await saveData();
  };

  const updateOnboardingProgress = async (step: number) => {
    setAppData((prev: AppData) => ({
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
    setAppData((prev: AppData) => ({
      ...prev,
      onboardingCompleted: false,
      onboardingProgress: { currentStep: 0, completedSteps: [], lastVisited: Date.now() },
    }));
    await saveData();
  };

  const clearStorageError = () => setStorageError(null);

  const deleteSession = async (sessionId: string): Promise<boolean> => {
    const sessionToDelete = appData.sessions.find((s: Session) => s.sessionId === sessionId);
    if (!sessionToDelete) return false;
    if (!sessionToDelete.checkOutTime) {
      Alert.alert('Cannot Delete Active Session', 'Please check out first before deleting this session.', [{ text: 'OK' }]);
      return false;
    }
    setAppData((prev: AppData) => ({ ...prev, sessions: prev.sessions.filter((s) => s.sessionId !== sessionId) }));
    const success = await saveData();
    if (success) {
      Alert.alert('Success', 'Session deleted successfully.');
      return true;
    }
    setAppData((prev: AppData) => ({ ...prev, sessions: [...prev.sessions, sessionToDelete] }));
    Alert.alert('Error', 'Failed to save changes. Session not deleted.');
    return false;
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
          onboardingProgress: false,
          appSettings: false,
        },
        totalNewRecords: 0,
        totalDuplicate: 0,
        totalConflicting: 0,
        error: validation.error,
      };
    }
    return {
      valid: true,
      schemaVersion: backup.header.schemaVersion,
      appVersion: backup.header.appVersion,
      recordCounts: {
        sessions: { new: 0, duplicate: 0, conflicting: 0 },
        employeeName: false,
        email: false,
        jobTitle: false,
        department: false,
        onboardingProgress: false,
        appSettings: false,
      },
      totalNewRecords: 0,
      totalDuplicate: 0,
      totalConflicting: 0,
    };
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
          onboardingProgress: false,
          appSettings: false,
        },
        totalNewRecords: 0,
        totalDuplicate: 0,
        totalConflicting: 0,
        error: validation.error,
      };
    }

    const preview = await performRestore(backup, appData, { mode, dryRun });

    if (!dryRun && preview.success) {
      const existingSessionChecksums = new Map(
        appData.sessions.map(s => [s.sessionId, s])
      );

      const sessionsToKeep = [...appData.sessions];
      let newSessionsAdded = 0;
      let duplicateSessionsSkipped = 0;

      for (const session of backup.data.sessions) {
        const existing = existingSessionChecksums.get(session.sessionId);
        if (!existing) {
          sessionsToKeep.push(session);
          newSessionsAdded++;
        } else if (mode === 'replace' || mode === 'merge') {
          const index = sessionsToKeep.findIndex(s => s.sessionId === session.sessionId);
          if (index >= 0) {
            sessionsToKeep[index] = session;
          }
        } else {
          duplicateSessionsSkipped++;
        }
      }

      const newData = {
        ...appData,
        sessions: sessionsToKeep,
        employeeName: backup.data.employeeName || appData.employeeName,
        email: backup.data.email || appData.email,
        jobTitle: backup.data.jobTitle || appData.jobTitle,
        department: backup.data.department || appData.department,
        onboardingCompleted: backup.data.onboardingCompleted ?? appData.onboardingCompleted,
        onboardingProgress: backup.data.onboardingProgress || appData.onboardingProgress,
        appSettings: backup.data.appSettings || appData.appSettings,
      };

      const previousData = appDataRef.current;
      appDataRef.current = newData;
      setAppData(newData);

      try {
        await saveData();
      } catch (error) {
        console.error('Restore failed, rolling back:', error);
        appDataRef.current = previousData;
        setAppData(previousData);
        await saveData();
        return {
          valid: false,
          schemaVersion: backup.header.schemaVersion,
          appVersion: backup.header.appVersion,
          recordCounts: {
            sessions: { new: 0, duplicate: 0, conflicting: 0 },
            employeeName: false,
            email: false,
            jobTitle: false,
            department: false,
            onboardingProgress: false,
            appSettings: false,
          },
          totalNewRecords: 0,
          totalDuplicate: 0,
          totalConflicting: 0,
          error: 'Restore failed - rolled back to previous state',
        };
      }
    }

    return {
      valid: true,
      schemaVersion: backup.header.schemaVersion,
      appVersion: backup.header.appVersion,
      recordCounts: {
        sessions: {
          new: preview.imported.sessions,
          duplicate: preview.skipped.sessions,
          conflicting: 0,
        },
        employeeName: !!backup.data.employeeName,
        email: !!backup.data.email,
        jobTitle: !!backup.data.jobTitle,
        department: !!backup.data.department,
        onboardingProgress: !!backup.data.onboardingProgress,
        appSettings: !!backup.data.appSettings,
      },
      totalNewRecords: preview.imported.sessions,
      totalDuplicate: preview.skipped.sessions,
      totalConflicting: 0,
    };
  };

  const value = {
    appData, loading, storageError,
    saveData, loadData, checkIn, checkOut,
    setEmployeeName, setEmail, setJobTitle, setDepartment,
    addSessions, completeOnboarding, updateOnboardingProgress, resetOnboardingProgress,
    clearStorageError, deleteSession,
    createBackup, saveBackup, getStoredBackup,
    importBackupFromFile, previewImport, restoreBackup,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};