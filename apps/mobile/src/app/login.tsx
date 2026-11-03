/** Sign in with the same email/phone + password the website uses. POST /auth/login. */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
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

import { Button, Muted } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { C, R, S, column } from '@/theme';

export default function Login() {
  const router = useRouter();
  const { login, sendLoginOtp, loginWithOtp } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
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
    setCode('');
  }

  async function submit() {
    if (!identifier.trim() || !password) {
      setError('Enter your email or mobile number and your password.');
      return;
    }
    setBusy(true);
    setError(null);
    const failure = await login(identifier, password);
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
      <ScrollView
        contentContainerStyle={[column, s.page, { paddingBottom: S.xl + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.h1}>Welcome back</Text>
        <Muted>One account for ApplyFields on the web and on your phone.</Muted>

        <View style={s.field}>
          <Text style={s.label}>Email or mobile number</Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="you@example.com or 98765 43210"
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={usesEmail ? 'email-address' : 'default'}
            textContentType="username"
            editable={!(mode === 'otp' && otpSent)}
            style={s.input}
          />
        </View>

        {mode === 'password' ? (
          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={s.passwordWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={C.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="password"
                onSubmitEditing={submit}
                returnKeyType="go"
                style={[s.input, s.passwordInput]}
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
            <Text style={s.label}>6-digit code</Text>
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
            <Pressable onPress={sendCode} disabled={busy} hitSlop={8}>
              <Text style={[s.link, { textAlign: 'left', paddingVertical: 2 }]}>Resend code</Text>
            </Pressable>
          </View>
        ) : null}

        {error ? <Text style={s.error}>{error}</Text> : null}

        {mode === 'password' ? (
          <Button label={busy ? 'Signing in…' : 'Sign in'} disabled={busy} onPress={submit} />
        ) : otpSent ? (
          <Button
            label={busy ? 'Verifying…' : 'Verify & sign in'}
            disabled={busy}
            onPress={verifyCode}
          />
        ) : (
          <Button label={busy ? 'Sending…' : 'Send me a code'} disabled={busy} onPress={sendCode} />
        )}

        <Pressable onPress={() => switchMode(mode === 'password' ? 'otp' : 'password')}>
          <Text style={s.link}>
            {mode === 'password' ? 'Sign in with a one-time code instead' : 'Sign in with a password instead'}
          </Text>
        </Pressable>
        <Pressable onPress={() => WebBrowser.openBrowserAsync('https://applyfields.in/register')}>
          <Text style={s.link}>New here? Create an account</Text>
        </Pressable>
        {mode === 'password' ? (
          <Pressable onPress={() => WebBrowser.openBrowserAsync('https://applyfields.in/forgot')}>
            <Text style={s.link}>Forgot your password?</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { padding: S.xl, gap: S.md },
  h1: { color: C.navy, fontSize: 24, fontWeight: '800' },
  field: { gap: 6, marginTop: S.sm },
  label: { color: C.navy, fontSize: 12.5, fontWeight: '700' },
  input: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
    color: C.navy,
    fontSize: 15,
  },
  passwordWrap: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 44 },
  eye: { position: 'absolute', right: S.md },
  error: { color: C.bad, fontSize: 13, fontWeight: '600' },
  link: {
    color: C.blue,
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 6,
  },
});
