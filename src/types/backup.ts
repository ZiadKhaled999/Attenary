export const BACKUP_SCHEMA_VERSION = '1.0.0';
export const BACKUP_STORAGE_KEY = 'ATTENARY_BACKUP_LATEST';

export interface BackupHeader {
  schemaVersion: string;
  appVersion: string;
  createdAt: string;
  checksum: string;
}

export interface BackupData {
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
  hourRate: number;
}

export interface BackupSchema {
  header: BackupHeader;
  data: BackupData;
}

export type RestoreMode = 'merge' | 'replace' | 'skip';

export interface RestoreOptions {
  mode: RestoreMode;
  dryRun: boolean;
}

export interface RecordComparison {
  new: number;
  duplicate: number;
  conflicting: number;
}

export interface RestorePreview {
  valid: boolean;
  schemaVersion: string;
  appVersion: string;
  recordCounts: {
    sessions: RecordComparison;
    employeeName: boolean;
    email: boolean;
    jobTitle: boolean;
    department: boolean;
    hourRate: boolean;
    onboardingProgress: boolean;
    appSettings: boolean;
  };
  totalNewRecords: number;
  totalDuplicate: number;
  totalConflicting: number;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  imported: {
    sessions: number;
    employeeName: boolean;
    email: boolean;
    jobTitle: boolean;
    department: boolean;
    onboardingProgress: boolean;
    appSettings: boolean;
  };
  skipped: {
    sessions: number;
  };
  error?: string;
}