import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fonts, shadows } from '../../theme/colors';

const AuthGateScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoGlow} />
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>⏱️</Text>
          </View>
        </View>

        <Text style={styles.title}>Attenary</Text>
        <Text style={styles.subtitle}>Time Tracking Made Simple</Text>
        <Text style={styles.description}>Sign in or create an account to continue tracking your attendance.</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('SignIn')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxl },
  logoContainer: { marginBottom: spacing.xxl, alignItems: 'center' },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryGlow,
    opacity: 0.25,
    top: -20,
    left: -20,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.neonGlowSubtle,
  },
  logoEmoji: { fontSize: 56 },
  title: { fontSize: fonts.sizes.hero, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs, letterSpacing: -0.5 },
  subtitle: { fontSize: fonts.sizes.lg, color: colors.textSecondary, marginBottom: spacing.lg },
  description: { fontSize: fonts.sizes.md, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xxxl, paddingHorizontal: spacing.md, lineHeight: 22 },
  buttonContainer: { width: '100%', gap: spacing.md },
  button: { width: '100%', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  primaryButton: { backgroundColor: colors.primary },
  primaryButtonText: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.bgMain },
  secondaryButton: { backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.border },
  secondaryButtonText: { fontSize: fonts.sizes.lg, fontWeight: '600', color: colors.textPrimary },
});

export default AuthGateScreen;
