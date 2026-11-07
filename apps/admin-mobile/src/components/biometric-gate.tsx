/**
 * Face ID / fingerprint lock over the whole staff desk.
 * - Opening the app with a saved session → locked until the phone's biometrics (or its PIN) say yes.
 * - Back from the background after LOCK_AFTER_MS → locked again.
 * - A phone with no screen lock at all can't open the desk: staff data never sits on an unprotected phone.
 * ponytail: gates the UI only; the tokens stay in SecureStore (OS-encrypted, app-private). Bind the refresh
 * token to biometrics with SecureStore `requireAuthentication` if a rooted/debugged phone is in scope.
 */
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Image, Platform, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorNote, Loading, Muted } from '@/components/ui';
import { shouldLock } from '@/lib/staff';
import { C, S, column } from '@/theme';

const LOGO = require('../../assets/images/logo-mark.png');
const { AuthenticationType: T, SecurityLevel } = LocalAuthentication;

/** What the unlock button should say on this phone. */
function unlockLabel(types: LocalAuthentication.AuthenticationType[], level: LocalAuthentication.SecurityLevel): string {
  if (level === SecurityLevel.SECRET) return Platform.OS === 'ios' ? 'passcode' : 'screen lock';
  if (types.includes(T.FACIAL_RECOGNITION)) return Platform.OS === 'ios' ? 'Face ID' : 'face unlock';
  if (types.includes(T.FINGERPRINT)) return Platform.OS === 'ios' ? 'Touch ID' : 'fingerprint';
  if (types.includes(T.IRIS)) return 'iris';
  return 'screen lock';
}

export function BiometricGate({
  startUnlocked,
  onSignOut,
  children,
}: {
  startUnlocked: boolean;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const [level, setLevel] = useState<LocalAuthentication.SecurityLevel | null>(null);
  const [label, setLabel] = useState('screen lock');
  const [locked, setLocked] = useState(!startUnlocked);
  const [error, setError] = useState<string | null>(null);
  const backgroundAt = useRef<number | null>(null);
  // The Face ID sheet itself sends the app to "inactive" on iOS; don't treat that as leaving the app.
  const prompting = useRef(false);

  const checkDevice = useCallback(async () => {
    const [lvl, types] = await Promise.all([
      LocalAuthentication.getEnrolledLevelAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    setLevel(lvl);
    setLabel(unlockLabel(types, lvl));
  }, []);

  const unlock = useCallback(async () => {
    if (prompting.current) return;
    prompting.current = true;
    setError(null);
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock ApplyFields Admin',
      cancelLabel: 'Cancel',
    }).finally(() => {
      prompting.current = false;
    });
    if (res.success) {
      backgroundAt.current = null;
      setLocked(false);
    } else if (!['user_cancel', 'system_cancel', 'app_cancel'].includes(res.error)) {
      setError(
        res.error === 'lockout'
          ? 'Too many tries. Unlock your phone with its PIN first, then try again.'
          : 'That didn’t match. Try again.',
      );
    }
  }, []);

  useEffect(() => {
    void checkDevice();
  }, [checkDevice]);

  // Ask straight away whenever the desk is locked on a phone that can unlock it.
  useEffect(() => {
    if (locked && level !== null && level !== SecurityLevel.NONE) void unlock();
  }, [locked, level, unlock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (prompting.current) return;
      if (state === 'background') backgroundAt.current = Date.now();
      else if (state === 'active') {
        if (shouldLock(backgroundAt.current, Date.now())) setLocked(true);
        backgroundAt.current = null;
        void checkDevice(); // they may have just turned a screen lock on (or off)
      }
    });
    return () => sub.remove();
  }, [checkDevice]);

  if (level === null) return <Loading label="Checking this phone…" />;

  if (level === SecurityLevel.NONE) {
    return (
      <Screen icon="lock-open-outline" title="Set a screen lock first">
        <Muted style={s.center}>
          The admin desk only opens on a phone protected by a PIN, fingerprint or Face ID. Turn one on in your
          phone’s Settings, then come back.
        </Muted>
        <Button label="I’ve set it, check again" icon="refresh" onPress={() => void checkDevice()} />
        <Button label="Sign out" variant="secondary" onPress={onSignOut} />
      </Screen>
    );
  }

  if (locked) {
    return (
      <Screen icon={label === 'Face ID' || label === 'face unlock' ? 'scan-outline' : 'finger-print'} title="Desk locked">
        <Muted style={s.center}>Unlock with your {label} to continue.</Muted>
        <ErrorNote text={error} />
        <Button label={`Unlock with ${label}`} icon="lock-open-outline" onPress={() => void unlock()} />
        <Button label="Sign out" variant="secondary" onPress={onSignOut} />
      </Screen>
    );
  }

  return children;
}

function Screen({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.page}>
      <View style={[column, s.body]}>
        <Image source={LOGO} style={s.logo} resizeMode="contain" />
        <Ionicons name={icon} size={56} color={C.blue} style={s.icon} />
        <Text style={s.title}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.canvas, justifyContent: 'center' },
  body: { padding: S.xl, gap: S.md },
  logo: { width: 56, height: 40, alignSelf: 'center' },
  icon: { alignSelf: 'center', marginTop: S.lg },
  title: { color: C.navy, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  center: { textAlign: 'center', fontSize: 14 },
});
