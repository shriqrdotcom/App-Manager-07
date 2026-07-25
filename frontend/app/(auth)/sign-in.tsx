import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useApp } from '@/src/providers/AppProvider';
import colors from '@/src/constants/colors';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { login, register, state } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authed = state !== 'signed-out' && state !== 'auth-in-progress' && state !== 'session-loading';
  if (authed) return <Redirect href="/" />;

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);
    if (!email.trim() || !password) { setError('Enter email and password'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Enter your name'); return; }
    setLoading(true);
    try {
      if (mode === 'signin') await login(email.trim(), password);
      else await register(email.trim(), password, name.trim());
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Feather name="grid" size={28} color={colors.background} />
          </View>
          <Text style={styles.appName}>Exzibo Manager</Text>
          <Text style={styles.tagline}>Restaurant management, simplified.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
          <Text style={styles.welcomeSubtitle}>
            {mode === 'signin' ? 'Sign in to manage your restaurant' : 'Sign up to try Exzibo Manager'}
          </Text>

          {error && (
            <View style={styles.errorBox} testID="signin-error">
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {mode === 'signup' && (
            <Field label="Name">
              <TextInput
                testID="signin-name-input"
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </Field>
          )}

          <Field label="Email">
            <TextInput
              testID="signin-email-input"
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </Field>

          <Field label="Password">
            <TextInput
              testID="signin-password-input"
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </Field>

          <TouchableOpacity
            testID="signin-submit-button"
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.primaryBtnText}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="signin-toggle-mode"
            style={styles.linkBtn}
            onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Access is granted by your restaurant administrator.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, gap: 22, justifyContent: 'center' },
  header: { alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: colors.foreground,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  appName: { fontSize: 26, fontWeight: '800', color: colors.foreground, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center' },
  card: {
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: colors.border, padding: 22, gap: 14,
  },
  welcomeTitle: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  welcomeSubtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: -8 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#7F1D1D', backgroundColor: '#3B1D1D',
  },
  errorText: { fontSize: 13, color: '#F87171', flex: 1 },
  field: { gap: 6 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.mutedForeground, letterSpacing: 0.4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 15, color: colors.foreground, backgroundColor: '#0F1010',
  },
  primaryBtn: {
    backgroundColor: colors.foreground, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  primaryBtnText: { color: colors.background, fontSize: 15, fontWeight: '700' },
  linkBtn: { alignItems: 'center', paddingVertical: 6 },
  linkText: { color: colors.foreground, fontSize: 13.5, fontWeight: '500' },
  footer: { fontSize: 12, color: colors.mutedForeground, textAlign: 'center', lineHeight: 18 },
});
