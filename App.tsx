import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import { Provider } from './src/context/AppContext';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexIdentityProvider } from './src/context/ConvexIdentityProvider';
import { ConvexSyncProvider } from './src/context/ConvexContext';
import Navigation from './src/navigation/Navigation';
import { ThemeProvider } from './src/theme/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { colors } from './src/theme/colors';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import { checkForUpdate, downloadAndInstallUpdate, UpdateInfo } from './src/utils/updateService';
import { UpdateBottomSheet } from './src/components/UpdateBottomSheet';
import { shouldShowUpdate, setDismissedAt } from './src/utils/updateStorage';

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || 'https://beloved-hare-121.convex.cloud';
const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});

// Global error handlers to prevent Android crashes
if (Platform.OS !== 'web') {
  // Handle unhandled promise rejections
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError.apply(console, args);

    // Check if this is a critical error that could crash the app
    const errorMessage = args.join(' ');
    if (errorMessage.includes('Invariant Violation') ||
        errorMessage.includes('TypeError: Cannot read property') ||
        errorMessage.includes('ReferenceError')) {
      console.warn('Critical error detected, but app will continue');
      // Don't crash - just log and continue
    }
  };

  // Set up global handlers for web environment
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Don't crash the app - just log the error
    });

    window.addEventListener('error', (event) => {
      console.error('Unhandled error:', event.error);
      // Prevent the default error handling which could crash the app
      event.preventDefault();
    });
  }
}

const WarningIcon = ({ color = colors.textMuted, size = 48 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon 
      points="12,2 22,12 12,22 2,12" 
      stroke={color} 
      strokeWidth="2"
      fill="none"
    />
    <Line 
      x1="12" 
      y1="8" 
      x2="12" 
      y2="12" 
      stroke={color} 
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Circle 
      cx="12" 
      cy="16" 
      r="1" 
      fill={color}
    />
  </Svg>
);

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log error details for debugging
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      platform: Platform.OS,
      version: require('./package.json').version
    });

    const errorMessage = Platform.OS === 'web'
      ? `An error occurred: ${error?.message || 'Unknown error'}`
      : 'An error occurred. Please restart the app.';

    if (Platform.OS !== 'web') {
      setTimeout(() => {
        Alert.alert(
          'App Error',
          errorMessage,
          [
            {
              text: 'Restart App',
              onPress: () => {
                // Force app restart by clearing state and reloading
                this.setState({ hasError: false, error: null });
                // For Android, we can't force restart, so just reset state
              }
            }
          ]
        );
      }, 100);
    } else {
      // For web, show error in console
      console.warn('Web app error - check browser console for details');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={styles.errorContainer} contentContainerStyle={styles.errorContent}>
          <View style={{ marginBottom: 16 }}>
            <WarningIcon color={colors.danger} size={48} />
          </View>
          <Text style={styles.errorTitle}>App Crashed</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          {this.state.error?.stack && (
            <Text style={styles.errorStack}>
              {this.state.error.stack}
            </Text>
          )}
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

// Additional error boundary for context providers
const ContextErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    {children}
  </ErrorBoundary>
);

export default function App() {
  const Container = Platform.OS === 'web' ? View : GestureHandlerRootView;
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const runCheck = async () => {
      try {
        const info = await checkForUpdate();
        console.log('[App] checkForUpdate result:', info ? `v${info.version}` : 'null');

        if (!info) return;

        console.log('[App] calling shouldShowUpdate for version:', info.version);
        const show = await shouldShowUpdate(info.version);
        console.log('[App] shouldShowUpdate:', show);

        if (!cancelled && show) {
          console.log('[App] showing update sheet');
          setUpdateInfo(info);
          setSheetVisible(true);
        } else {
          console.log('[App] update suppressed by shouldShowUpdate');
        }
      } catch (err) {
        console.warn('[App] update check failed:', err);
      }
    };

    const timer = setTimeout(runCheck, 800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const handleUpdateNow = async () => {
    setSheetVisible(false);
    if (updateInfo) {
      await downloadAndInstallUpdate(updateInfo.downloadUrl);
    }
  };

  const handleRemindLater = async () => {
    if (updateInfo) {
      await setDismissedAt(updateInfo.version);
    }
    setSheetVisible(false);
  };

  try {
    return (
      <ErrorBoundary>
        <Container style={{ flex: 1 }}>
          <SafeAreaProvider>
            <ContextErrorBoundary>
              <ThemeProvider>
                <ContextErrorBoundary>
                  <LanguageProvider>
                    <ContextErrorBoundary>
                      <ConvexProvider client={convex}>
                        <ConvexIdentityProvider>
                          <ConvexSyncProvider>
                            <Provider>
                              <StatusBar style="light" backgroundColor="#0f172a" />
                              <Navigation />
                            </Provider>
                          </ConvexSyncProvider>
                        </ConvexIdentityProvider>
                      </ConvexProvider>
                    </ContextErrorBoundary>
                  </LanguageProvider>
                </ContextErrorBoundary>
              </ThemeProvider>
            </ContextErrorBoundary>
          </SafeAreaProvider>
        </Container>
        {updateInfo && (
          <UpdateBottomSheet
            visible={sheetVisible}
            updateInfo={updateInfo}
            onUpdateNow={handleUpdateNow}
            onRemindLater={handleRemindLater}
            isMandatory={updateInfo.mandatory}
          />
        )}
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Critical app rendering error:', error);
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 18 }}>App failed to load</Text>
        <Text style={{ color: '#666', fontSize: 14, marginTop: 10 }}>Please restart the application</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  errorContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 100,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorHint: {
    fontSize: 12,
    color: '#64748b',
  },
  errorStack: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});