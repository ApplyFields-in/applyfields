/** Partner sign-in: the same ApplyFields account the partner website uses. POST /auth/login (+ /auth/login/verify on a first sign-in). */
import { Ionicons } from '@expo/vector-icons';
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

import { Button } from '@/components/ui';
import { useSession } from '@/lib/session';
import { C, R, S, column } from '@/theme';

const LOGO = require('../../assets/images/logo-mark.png');

export default function Login() {
  const { startLogin, login, sendLoginOtp, loginWithOtp } = useSession();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  // Set only on a first sign-in, when the account still has to confirm its email/phone once.
  const [codeTo, setCodeTo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
        // Signed in: the session flips and the router moves on by itself.
      }
      return;
    }
    const failure = await login(identifier, password, code);
    setBusy(false);
    // On success the session flips and the router moves on by itself.
    if (failure) setError(failure);
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
    // On success the session flips and the router moves on by itself.
    if (failure) setError(failure);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          column,
          s.page,
          { paddingTop: insets.top + S.lg, paddingBottom: S.xl + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Same card as the website's /login: logo, heading, mode switcher, form. */}
        <View style={s.card}>
          <View style={s.brandRow}>
            <Image source={LOGO} style={s.logo} resizeMode="contain" />
            <Text style={s.wordmark}>
              Apply<Text style={{ color: C.blue }}>Fields</Text>
            </Text>
            <View style={s.close}>
              <Text style={s.partnerTag}>PARTNER</Text>
            </View>
          </View>

          <Text style={s.h1}>Partner desk</Text>
          <Text style={s.sub}>Sign in to run your centre or admissions desk.</Text>

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
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={C.muted} style={s.inputIcon} />
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
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
                  onPress={() => WebBrowser.openBrowserAsync('https://applyfields.com/forgot')}
                  hitSlop={8}
                >
                  <Text style={s.smallLink}>Forgot password?</Text>
                </Pressable>
              </View>
              <View style={s.inputWrap}>
                <Ionicons name="key-outline" size={18} color={C.muted} style={s.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
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
                    color={C.muted}
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
              <View style={s.inputWrap}>
                <Ionicons name="keypad-outline" size={18} color={C.muted} style={s.inputIcon} />
                <TextInput
                  value={code}
                  onChangeText={setCode}
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
            <Button
              label={busy ? 'Signing in…' : codeTo ? 'Verify & log in' : 'Log in'}
              icon="arrow-forward"
              disabled={busy}
              onPress={() => submit()}
              style={s.primary}
            />
          ) : otpSent ? (
            <Button
              label={busy ? 'Verifying…' : 'Verify & log in'}
              disabled={busy}
              onPress={verifyCode}
              style={s.primary}
            />
          ) : (
            <Button
              label={busy ? 'Sending…' : 'Send me a code'}
              disabled={busy}
              onPress={sendCode}
              style={s.primary}
            />
          )}

          <View style={s.signupRow}>
            <Text style={s.sub}>New partner? Create your account, then sign in here. </Text>
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync('https://applyfields.com/register')}
              hitSlop={8}
            >
              <Text style={s.smallLink}>Create account</Text>
            </Pressable>
          </View>
        </View>

        <Text style={s.disclaimer}>
          MeeSeva, CSC, xerox and browsing centres, consultants, colleges and universities.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: 'center', padding: S.md, gap: S.md },
  card: {
    backgroundColor: C.white,
    borderRadius: 32,
    padding: S.xl,
    gap: S.md,
    shadowColor: C.navy,
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
    elevation: 8,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  logo: { width: 44, height: 32 },
  wordmark: { flex: 1, color: C.navy, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  partnerTag: { color: C.blue, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  close: {
    paddingHorizontal: 10,
    height: 26,
    borderRadius: R.pill,
    backgroundColor: C.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: { color: C.navy, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: C.muted, fontSize: 14 },
  // The website's Password / One-time code switcher.
  tabs: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    marginTop: S.sm,
    borderRadius: R.md,
    backgroundColor: C.canvas,
  },
  tab: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabActive: {
    backgroundColor: C.white,
    shadowColor: C.navy,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: { color: C.muted, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: C.navy },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: C.navy, fontSize: 14, fontWeight: '600' },
  smallLink: { color: C.blue, fontSize: 13, fontWeight: '600' },
  inputWrap: { justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: S.lg, zIndex: 1 },
  input: {
    height: 48,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingLeft: 44,
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
  primary: {
    minHeight: 48,
    marginTop: S.sm,
    shadowColor: C.blue,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  signupRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: S.xs },
  disclaimer: { color: C.muted, fontSize: 12, textAlign: 'center', paddingHorizontal: S.lg },
});
