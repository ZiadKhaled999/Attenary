import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import { Provider } from './src/context/AppContext';
import Navigation from './src/navigation/Navigation';
import { ThemeProvider } from './src/theme/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { colors } from './src/theme/colors';
import Svg, { Path, Polygon, Line } from 'react-native-svg';

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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    const errorMessage = Platform.OS === 'web' 
      ? `An error occurred: ${error?.message || 'Unknown error'}`
      : 'An error occurred. The app will attempt to restart.';
    
    if (Platform.OS !== 'web') {
      setTimeout(() => {
        Alert.alert(
          'Error',
          errorMessage,
          [{ text: 'OK', onPress: () => this.setState({ hasError: false, error: null }) }]
        );
      }, 100);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={styles.errorContainer} contentContainerStyle={styles.errorContent}>
          <WarningIcon color={colors.danger} size={48} style={{ marginBottom: 16 }} />
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

export default function App() {
  const Container = Platform.OS === 'web' ? View : GestureHandlerRootView;
  return (
    <ErrorBoundary>
      <Container style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <LanguageProvider>
              <Provider>
                <StatusBar style="light" backgroundColor="#0f172a" />
                <Navigation />
              </Provider>
            </LanguageProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </Container>
    </ErrorBoundary>
  );
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
