import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSupabase } from '../../context/SupabaseContext';
import { colors, spacing, borderRadius, fonts } from '../../theme/colors';

const SignInScreen = () => {
  const navigation = useNavigation<any>();
  const { signIn } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password) { setError('Please enter both email and password'); return; }
    setLoading(true);
    setError('');
    const { error } = await signIn(email.trim().toLowerCase(), password);
    if (error) {
      setError(error.message || 'Sign in failed. Please check your credentials.');
      setLoading(false);
      return;
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue tracking your attendance</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={[styles.input, error ? styles.inputError : null]} placeholder="you@example.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput style={[styles.input, error ? styles.inputError : null]} placeholder="Enter your password" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.button, styles.primaryButton, loading ? styles.buttonDisabled : null]} onPress={handleSignIn} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={colors.bgMain} /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('SignUp')} activeOpacity={0.7}>
            <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
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

export default SignInScreen;
