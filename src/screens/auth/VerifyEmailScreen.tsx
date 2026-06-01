import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSupabase } from '../../context/SupabaseContext';
import { useAuth } from '@clerk/clerk-expo';
import { colors, spacing, borderRadius, fonts } from '../../theme/colors';

const OTPVerifyScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session: supabaseSession, loading, refreshProfile } = useSupabase();
  const { isSignedIn, isLoaded, userId } = useAuth();
  const email = route.params?.email || '';
  const [resentMessage, setResentMessage] = useState('');
  const RESEND_COOLDOWN_BASE = 60;
  const RESEND_COOLDOWN_MAX = 600;
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_BASE);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && userId) {
      void refreshProfile();
      navigation.replace('Onboarding');
    }
  }, [isLoaded, isSignedIn, userId, refreshProfile, navigation]);

  const isRateLimited = (err: any) => {
    const msg = (err?.message || err?.error_description || err?.msg || '').toLowerCase();
    return msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('429');
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResentMessage('');
    try {
      Alert.alert('Verification email resent', 'Please check your inbox and tap the link in the email to verify your account.');
      setResendCooldown(RESEND_COOLDOWN_BASE);
    } catch {
      Alert.alert('Error', 'Failed to resend verification email. Please try again later.');
    }
  };

  const handleChangeEmail = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <View style={styles.content}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.description}>
          We've sent a verification link to
        </Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.instruction}>
          Tap the link in the email to verify your account and continue.
        </Text>

        {resentMessage ? <Text style={styles.successText}>{resentMessage}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleResend} disabled={resendCooldown > 0} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={handleChangeEmail} activeOpacity={0.7}>
          <Text style={styles.backText}>Change email</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl },
  title: { fontSize: fonts.sizes.hero, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  description: { fontSize: fonts.sizes.md, color: colors.textSecondary, marginBottom: spacing.xs, textAlign: 'center' },
  instruction: { fontSize: fonts.sizes.md, color: colors.textSecondary, marginBottom: spacing.xxl, textAlign: 'center', lineHeight: 22 },
  email: { fontSize: fonts.sizes.lg, fontWeight: '600', color: colors.primary, marginBottom: spacing.xxl, textAlign: 'center' },
  successText: { color: '#10b981', fontSize: fonts.sizes.md, marginBottom: spacing.lg, textAlign: 'center' },
  button: { width: '100%', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', minHeight: 56, marginTop: spacing.md },
  primaryButton: { backgroundColor: colors.primary },
  primaryButtonText: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.bgMain },
  backButton: { marginTop: spacing.lg, alignItems: 'center' },
  backText: { fontSize: fonts.sizes.md, color: colors.primary, fontWeight: '600' },
});

export default OTPVerifyScreen;