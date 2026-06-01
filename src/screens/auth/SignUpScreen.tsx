import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSupabase } from '../../context/SupabaseContext';
import { colors, spacing, borderRadius, fonts } from '../../theme/colors';

const SignUpScreen = () => {
  const navigation = useNavigation<any>();
  const { signUp } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim() || !password || !confirm) { setError('All fields are required'); return false; }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) { setError('Please enter a valid email address'); return false; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return false; }
    if (password !== confirm) { setError('Passwords do not match'); return false; }
    return true;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const { error } = await signUp(email.trim().toLowerCase(), password);
      if (error) {
        setError(error.message || 'Sign up failed. Please try again.');
        return;
      }
      setLoading(false);
      navigation.navigate('OTPVerify', { email: email.trim().toLowerCase() } as never);
    } catch {
      setError('Sign up failed. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to start tracking your attendance</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={[styles.input, error ? styles.inputError : null]} placeholder="you@example.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput style={[styles.input, error ? styles.inputError : null]} placeholder="At least 6 characters" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput style={[styles.input, error ? styles.inputError : null]} placeholder="Re-enter your password" placeholderTextColor={colors.textMuted} value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.button, styles.primaryButton, loading ? styles.buttonDisabled : null]} onPress={handleSignUp} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={colors.bgMain} /> : <Text style={styles.primaryButtonText}>Sign Up</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl },
  title: { fontSize: fonts.sizes.hero, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { fontSize: fonts.sizes.md, color: colors.textSecondary, marginBottom: spacing.xxl, lineHeight: 22 },
  form: { width: '100%' },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: fonts.sizes.lg, color: colors.textPrimary, borderWidth: 1.5, borderColor: colors.border },
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: fonts.sizes.sm, marginBottom: spacing.md, marginLeft: spacing.sm },
  button: { width: '100%', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', minHeight: 56, marginTop: spacing.md },
  primaryButton: { backgroundColor: colors.primary },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.bgMain },
  linkButton: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { fontSize: fonts.sizes.md, color: colors.primary, fontWeight: '600' },
});

export default SignUpScreen;
