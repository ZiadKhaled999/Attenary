export interface Session {
  sessionId: string;
  checkInTime: number;
  checkOutTime: number | null;
  reason: string | null;
  reasonEditedAt: number | null | undefined;
}

export interface AppData {
  sessions: Session[];
  employeeName: string;
  email: string;
  jobTitle: string;
  department: string;
  avatarUrl: string;
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

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  job_title: string;
  department: string;
  avatar_url: string;
  onboarding_completed: boolean;
  language: string;
  created_at: number;
  updated_at: number;
}

export interface SyncQueueItem {
  id?: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  operation: 'upsert' | 'delete';
  payload: any;
  file_path?: string;
  retry_count: number;
  last_error?: string;
  created_at?: number;
  processed_at?: number;
}

export interface Feedback {
  id?: string;
  user_id: string;
  type: 'general' | 'bug' | 'feature';
  email?: string;
  content: string;
  metadata?: Record<string, any>;
  created_at?: number;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
}

export interface TimeStats {
  totalHours: number;
  activeCount: number;
  sessionCount: number;
}

export interface MonthlyStats {
  totalHours: number;
  totalSessions: number;
  activeEmployees: number;
  employeeStats: {
    [employeeName: string]: {
      totalSeconds: number;
      sessionCount: number;
      daysWorked: number;
      avgPerDay: number;
    };
  };
}

export interface DailyStats {
  totalHours: number;
  sessions: Session[];
}

export interface CompareStats {
  name: string;
  totalHours: number;
  totalSeconds: number;
  sessions: number;
  daysWorked: number;
  avgPerDay: number;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  bgMain: string;
  bgCard: string;
  bgCardHover: string;
  bgMainLight: string;
  bgCardLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textPrimaryLight: string;
  textSecondaryLight: string;
  border: string;
  borderLight: string;
  shadow: string;
  transparent: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface BorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  full: number;
}

export interface FontSizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface FontWeights {
  light: string;
  normal: string;
  medium: string;
  semibold: string;
  bold: string;
  extrabold: string;
}
