/** Sign in with the same email/phone + password the website uses. POST /auth/login (+ /auth/login/verify on a first sign-in). */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { C, R, S, column } from '@/theme';

const LOGO = require('../../assets/images/logo-mark.png');

export default function Login() {
  const router = useRouter();
  const { startLogin, login, sendLoginOtp, loginWithOtp } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  // Set only on a first sign-in, when the account still has to confirm its email/phone once.
  const [codeTo, setCodeTo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'identifier' | 'password' | 'code' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // A field that takes an email or a phone number needs the plain keyboard, not
  // the email layout (which hides the number row).
  const usesEmail = identifier.includes('@');

  function switchMode(next: 'password' | 'otp') {
    setMode(next);
    setError(null);
    setOtpSent(false);
    setCodeTo(null);
    setCode('');
  }

  async function submit(resend = false) {
    if (!identifier.trim() || !password) {
      setError('Enter your email or mobile number and your password.');
      return;
    }
    if (codeTo && !resend && code.trim().length !== 6) {
      setError('Enter the 6-digit code we sent you.');
      return;
    }
    setBusy(true);
    setError(null);
    if (!codeTo || resend) {
      const res = await startLogin(identifier, password);
      setBusy(false);
      if (res.error) setError(res.error);
      else if (res.sentTo) {
        // First sign-in of an account that never confirmed its email/phone: one code, then never again.
        setCodeTo(res.sentTo);
        setCode('');
      } else {
        router.back();
      }
      return;
    }
    const failure = await login(identifier, password, code);
    setBusy(false);
    if (failure) setError(failure);
    else router.back();
  }

  async function sendCode() {
    if (!identifier.trim()) {
      setError('Enter your email or mobile number first.');
      return;
    }
    setBusy(true);
    setError(null);
    const failure = await sendLoginOtp(identifier);
    setBusy(false);
    if (failure) setError(failure);
    else setOtpSent(true);
  }

  async function verifyCode() {
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code we sent you.');
      return;
    }
    setBusy(true);
    setError(null);
    const failure = await loginWithOtp(identifier, code);
    setBusy(false);
    if (failure) setError(failure);
    else router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Transparent top bar with back arrow */}
      <View style={[s.topBar, { paddingTop: insets.top + S.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          hitSlop={12}
          style={s.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={C.navy} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          column,
          s.page,
          { paddingBottom: S.xl + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.card}>
          {/* Centered official ApplyFields logo above Welcome back */}
          <View style={s.logoWrap}>
            <Image source={LOGO} style={s.logo} resizeMode="contain" />
          </View>

          <Text style={s.h1}>Welcome back</Text>
          <Text style={s.sub}>Log in to explore opportunities tailored for you.</Text>

          <View style={s.tabs} accessibilityRole="tablist">
            {(['password', 'otp'] as const).map((m) => (
              <Pressable
                key={m}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === m }}
                onPress={() => switchMode(m)}
                style={[s.tab, mode === m && s.tabActive]}
              >
                <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                  {m === 'password' ? 'Password' : 'One-time code'}
                </Text>
              </Pressable>
            ))}
          </View>

          {error ? (
            <View style={s.error}>
              <Ionicons name="alert-circle-outline" size={16} color={C.bad} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={s.field}>
            <Text style={s.label}>Email or mobile number</Text>
            <View
              style={[
                s.inputWrap,
                focusedField === 'identifier' && s.inputWrapFocused,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={focusedField === 'identifier' ? C.blue : C.muted}
                style={s.inputIcon}
              />
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                onFocus={() => setFocusedField('identifier')}
                onBlur={() => setFocusedField(null)}
                placeholder="you@example.com or 98765 43210"
                placeholderTextColor={C.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={usesEmail ? 'email-address' : 'default'}
                textContentType="username"
                editable={!(mode === 'otp' && otpSent) && !codeTo}
                style={s.input}
              />
            </View>
          </View>

          {mode === 'password' ? (
            <View style={s.field}>
              <View style={s.labelRow}>
                <Text style={s.label}>Password</Text>
                <Pressable
                  onPress={() => WebBrowser.openBrowserAsync('https://applyfields.in/forgot')}
                  hitSlop={8}
                >
                  <Text style={s.smallLink}>Forgot password?</Text>
                </Pressable>
              </View>
              <View
                style={[
                  s.inputWrap,
                  focusedField === 'password' && s.inputWrapFocused,
                ]}
              >
                <Ionicons
                  name="key-outline"
                  size={18}
                  color={focusedField === 'password' ? C.blue : C.muted}
                  style={s.inputIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Your password"
                  placeholderTextColor={C.muted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  textContentType="password"
                  editable={!codeTo}
                  onSubmitEditing={() => submit()}
                  returnKeyType="go"
                  style={[s.input, { paddingRight: 44 }]}
                />
                <Pressable
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={13}
                  style={s.eye}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={focusedField === 'password' ? C.blue : C.muted}
                  />
                </Pressable>
              </View>
            </View>
          ) : otpSent ? (
            <View style={s.field}>
              <View style={s.labelRow}>
                <Text style={s.label}>6-digit code</Text>
                <Pressable onPress={sendCode} disabled={busy} hitSlop={8}>
                  <Text style={s.smallLink}>Resend code</Text>
                </Pressable>
              </View>
              <View
                style={[
                  s.inputWrap,
                  focusedField === 'code' && s.inputWrapFocused,
                ]}
              >
                <Ionicons
                  name="keypad-outline"
                  size={18}
                  color={focusedField === 'code' ? C.blue : C.muted}
                  style={s.inputIcon}
                />
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  onFocus={() => setFocusedField('code')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="● ● ● ● ● ●"
                  placeholderTextColor={C.muted}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  onSubmitEditing={verifyCode}
                  returnKeyType="go"
                  style={s.input}
                />
              </View>
            </View>
          ) : null}

          {mode === 'password' && codeTo ? (
            <View style={s.field}>
              <View style={s.labelRow}>
                <Text style={[s.label, { flex: 1 }]}>First sign-in: code sent to {codeTo}</Text>
                <Pressable onPress={() => submit(true)} disabled={busy} hitSlop={8}>
                  <Text style={s.smallLink}>Resend code</Text>
                </Pressable>
              </View>
              <View style={s.inputWrap}>
                <Ionicons name="keypad-outline" size={18} color={C.muted} style={s.inputIcon} />
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="● ● ● ● ● ●"
                  placeholderTextColor={C.muted}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  onSubmitEditing={() => submit()}
                  returnKeyType="go"
                  accessibilityLabel="6-digit code"
                  style={s.input}
                />
              </View>
              <Pressable
                onPress={() => {
                  setCodeTo(null);
                  setCode('');
                }}
                hitSlop={8}
              >
                <Text style={s.smallLink}>Change email, number or password</Text>
              </Pressable>
            </View>
          ) : null}

          {mode === 'password' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => submit()}
              style={[s.primaryBtn, busy && s.btnDisabled]}
            >
              <Text style={s.primaryBtnText}>
                {busy ? 'Signing in…' : codeTo ? 'Verify & log in' : 'Sign in'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={C.white} />
            </Pressable>
          ) : otpSent ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={verifyCode}
              style={[s.primaryBtn, busy && s.btnDisabled]}
            >
              <Text style={s.primaryBtnText}>{busy ? 'Verifying…' : 'Verify & Sign in'}</Text>
              <Ionicons name="arrow-forward" size={18} color={C.white} />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={sendCode}
              style={[s.primaryBtn, busy && s.btnDisabled]}
            >
              <Text style={s.primaryBtnText}>{busy ? 'Sending…' : 'Send me a code'}</Text>
              <Ionicons name="arrow-forward" size={18} color={C.white} />
            </Pressable>
          )}

          <View style={s.signupRow}>
            <Text style={s.sub}>Don&apos;t have an account? </Text>
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync('https://applyfields.in/register')}
              hitSlop={8}
            >
              <Text style={s.smallLink}>Sign up</Text>
            </Pressable>
          </View>
        </View>

        <Text style={s.disclaimer}>
          ApplyFields is not a government website. Always apply through the official link.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: 'center', padding: S.md, gap: S.md },
  topBar: {
    paddingHorizontal: S.lg,
    paddingBottom: S.xs,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: R.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: C.navy,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: S.xl,
    gap: S.md,
    borderWidth: 1,
    borderColor: 'rgba(8, 32, 70, 0.08)',
    shadowColor: C.navy,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logo: { width: 56, height: 42 },
  h1: {
    color: C.navy,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sub: { color: C.muted, fontSize: 14, textAlign: 'center' },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: R.pill,
    backgroundColor: '#EDF2F8',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tab: { flex: 1, height: 38, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  tabActive: {
    backgroundColor: C.white,
    shadowColor: C.navy,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: { color: '#435775', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: C.blue, fontWeight: '700' },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: C.navy, fontSize: 14, fontWeight: '600' },
  smallLink: { color: C.blue, fontSize: 13, fontWeight: '600' },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: '#CAD7E7',
    borderRadius: 14,
  },
  inputWrapFocused: {
    borderColor: C.blue,
    borderWidth: 1.5,
  },
  inputIcon: { position: 'absolute', left: S.md, zIndex: 1 },
  input: {
    height: 48,
    paddingLeft: 42,
    paddingRight: S.md,
    color: C.navy,
    fontSize: 15,
  },
  eye: { position: 'absolute', right: S.md },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.sm,
    padding: S.md,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: `${C.bad}33`,
    backgroundColor: `${C.bad}0d`,
  },
  errorText: { flex: 1, color: C.bad, fontSize: 13, fontWeight: '600' },
  primaryBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: C.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.xs,
    marginTop: S.sm,
    shadowColor: C.blue,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  primaryBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  signupRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: S.xs },
  disclaimer: { color: C.muted, fontSize: 12, textAlign: 'center', paddingHorizontal: S.lg },
});
