import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fonts } from '../theme/colors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ComponentErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('ComponentErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Component temporarily unavailable</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default ComponentErrorBoundary;