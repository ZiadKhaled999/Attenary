import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSupabase } from '../../context/SupabaseContext';
import { colors, spacing, borderRadius, fonts } from '../../theme/colors';
import { supabase } from '../../config/supabase';

const OTPVerifyScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { verifyOtp } = useSupabase();
  const email = route.params?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleVerify = async () => {
    const code = otp.trim();
    if (!code || code.length !== 6) { setError('Please enter the 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      const { error } = await verifyOtp(email, code);
      if (error) {
        setError(error.message || 'Invalid or expired code. Please try again.');
        return;
      }
      navigation.replace('Onboarding');
    } catch {
      setError('Verification failed. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendCooldown(30);
    const { error } = await supabase.auth.resend({ email, type: 'signup' });
    if (error) {
      setError(error.message || 'Failed to resend code. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to</Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="123456"
              placeholderTextColor={colors.textMuted}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              autoFocus
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity style={[styles.button, styles.primaryButton, loading ? styles.buttonDisabled : null]} onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={colors.bgMain} /> : <Text style={styles.primaryButtonText}>Verify & Continue</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={resendCooldown > 0} activeOpacity={0.7}>
            <Text style={[styles.resendText, resendCooldown > 0 ? styles.resendDisabled : null]}>
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl },
  title: { fontSize: fonts.sizes.hero, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  subtitle: { fontSize: fonts.sizes.md, color: colors.textSecondary, marginBottom: spacing.xs },
  email: { fontSize: fonts.sizes.lg, fontWeight: '600', color: colors.primary, marginBottom: spacing.xxl },
  form: { width: '100%' },
  inputGroup: { marginBottom: spacing.lg },
  input: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: fonts.sizes.xxl, letterSpacing: 8, color: colors.textPrimary, borderWidth: 1.5, borderColor: colors.border, textAlign: 'center' },
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: fonts.sizes.sm, marginBottom: spacing.md, marginLeft: spacing.sm, textAlign: 'center' },
  button: { width: '100%', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', minHeight: 56, marginTop: spacing.md },
  primaryButton: { backgroundColor: colors.primary },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.bgMain },
  resendButton: { marginTop: spacing.lg, alignItems: 'center', paddingVertical: spacing.sm },
  resendText: { fontSize: fonts.sizes.md, color: colors.primary, fontWeight: '600' },
  resendDisabled: { color: colors.textMuted },
  backButton: { marginTop: spacing.lg, alignItems: 'center' },
  backText: { fontSize: fonts.sizes.md, color: colors.textSecondary, fontWeight: '500' },
});

export default OTPVerifyScreen;
