import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const value = {
    appData, loading, storageError,
    saveData, loadData, checkIn, checkOut,
    setEmployeeName, setEmail, setJobTitle, setDepartment,
    addSessions, completeOnboarding, updateOnboardingProgress, resetOnboardingProgress,
    clearStorageError, deleteSession,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};