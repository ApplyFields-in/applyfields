/** Staff sign-in, same as the admin website: password, then a 6-digit code to the account's email/phone. Every time. */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ErrorNote } from '@/components/ui';
import { useSession } from '@/lib/session';
import { C, R, S, column } from '@/theme';

const LOGO = require('../../assets/images/logo-mark.png');

export default function Login() {
  const session = useSession();
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [codeTo, setCodeTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    if (!identifier.trim() || !password) return setError('Enter your email or mobile number and your password.');
    setBusy(true);
    setError(null);
    const res = await session.startLogin(identifier, password);
    setBusy(false);
    if (res.error) setError(res.error);
    else {
      setCodeTo(res.sentTo ?? 'your email or phone');
      setCode('');
    }
  }

  async function verify() {
    if (code.trim().length !== 6) return setError('Enter the 6-digit code we sent you.');
    setBusy(true);
    setError(null);
    const failure = await session.verifyLogin(identifier, password, code);
    setBusy(false);
    // On success the session flips to staff and the router moves on.
    if (failure) setError(failure);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[column, s.page, { paddingTop: insets.top + S.lg, paddingBottom: S.xl + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.card}>
          <View style={s.brandRow}>
            <Image source={LOGO} style={s.logo} resizeMode="contain" />
            <Text style={s.wordmark}>
              Apply<Text style={{ color: C.blue }}>Fields</Text>
            </Text>
            <View style={s.tag}>
              <Text style={s.tagText}>STAFF</Text>
            </View>
          </View>

          <Text style={s.h1}>{codeTo ? 'Check your code' : 'Staff sign-in'}</Text>
          <Text style={s.sub}>
            {codeTo ? `We sent a 6-digit code to ${codeTo}.` : 'Password first, then a one-time code. Every sign-in.'}
          </Text>

          <ErrorNote text={error ?? session.error} />

          {!codeTo ? (
            <>
              <View style={s.field}>
                <Text style={s.label}>Email or mobile number</Text>
                <View style={s.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={C.muted} style={s.inputIcon} />
                  <TextInput
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="you@applyfields.com"
                    placeholderTextColor={C.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType={identifier.includes('@') ? 'email-address' : 'default'}
                    textContentType="username"
                    style={s.input}
                  />
                </View>
              </View>
              <View style={s.field}>
                <Text style={s.label}>Password</Text>
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
                    onSubmitEditing={sendCode}
                    returnKeyType="next"
                    style={[s.input, { paddingRight: 44 }]}
                  />
                  <Pressable
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={13}
                    style={s.eye}
                  >
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.muted} />
                  </Pressable>
                </View>
              </View>
              <Button label={busy ? 'Sending code…' : 'Continue'} icon="arrow-forward" disabled={busy} onPress={sendCode} style={s.primary} />
            </>
          ) : (
            <>
              <View style={s.field}>
                <View style={s.labelRow}>
                  <Text style={s.label}>6-digit code</Text>
                  <Pressable onPress={sendCode} disabled={busy} hitSlop={8}>
                    <Text style={s.link}>Resend code</Text>
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
                    onSubmitEditing={verify}
                    returnKeyType="go"
                    accessibilityLabel="6-digit code"
                    style={s.input}
                  />
                </View>
              </View>
              <Button label={busy ? 'Verifying…' : 'Verify & sign in'} disabled={busy} onPress={verify} style={s.primary} />
              <Pressable
                onPress={() => {
                  setCodeTo(null);
                  setCode('');
                  setError(null);
                }}
                hitSlop={8}
              >
                <Text style={[s.link, { textAlign: 'center' }]}>Change email, number or password</Text>
              </Pressable>
            </>
          )}
        </View>
        <Text style={s.disclaimer}>For ApplyFields staff only. Every sign-in is recorded in the audit log.</Text>
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
  tag: { paddingHorizontal: 10, height: 26, borderRadius: R.pill, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  tagText: { color: C.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  h1: { color: C.navy, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: C.muted, fontSize: 14 },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: C.navy, fontSize: 14, fontWeight: '600' },
  link: { color: C.blue, fontSize: 13, fontWeight: '600' },
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
  primary: { minHeight: 48, marginTop: S.xs },
  disclaimer: { color: C.muted, fontSize: 12, textAlign: 'center' },
});
