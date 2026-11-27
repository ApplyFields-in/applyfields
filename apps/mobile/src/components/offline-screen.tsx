/**
 * Full-screen "No internet" overlay with a looping Lottie. Shows when the phone loses its
 * connection and hides by itself when it's back. "Saved files" closes it and opens Documents,
 * where offline copies (admit cards, certificates) still work — exam centres often jam data.
 */
import { getNetworkStateAsync, useNetworkState } from 'expo-network';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, R, S, TAP } from '@/theme';

const NO_INTERNET = require('../../assets/lottie/no-internet.json');
const BACKGROUND = '#f1f1f1'; // the animation's own backdrop, so the letterbox doesn't show

export function OfflineScreen() {
  const net = useNetworkState();
  const router = useRouter();
  const offline = net.isConnected === false || net.isInternetReachable === false;
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  // Each new drop shows the screen again, even if the last one was dismissed.
  useEffect(() => {
    if (!offline) setDismissed(false);
  }, [offline]);

  if (!offline || dismissed) return null;

  const retry = async () => {
    setChecking(true);
    // useNetworkState updates on its own when the state changes; this just gives the tap feedback.
    await getNetworkStateAsync().catch(() => null);
    setChecking(false);
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} accessibilityViewIsModal>
      <SafeAreaView style={styles.safe}>
        <LottieView source={NO_INTERNET} autoPlay loop resizeMode="contain" style={styles.anim} />
        <View style={styles.copy}>
          <Text style={styles.title} accessibilityRole="header">
            No internet connection
          </Text>
          <Text style={styles.body}>Check your mobile data or Wi-Fi. Files you saved on this phone still open.</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, styles.primary]}
            onPress={retry}
            disabled={checking}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>{checking ? 'Checking…' : 'Try again'}</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.secondary]}
            onPress={() => {
              setDismissed(true);
              router.push('/documents');
            }}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>Saved files</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: BACKGROUND, zIndex: 90 }, // under the launch intro (100)
  safe: { flex: 1, justifyContent: 'center', padding: S.xl },
  anim: { width: '100%', aspectRatio: 16 / 9 },
  copy: { alignItems: 'center', marginTop: S.lg, gap: S.sm },
  title: { fontSize: 22, fontWeight: '800', color: C.navy, textAlign: 'center' },
  body: { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 21 },
  actions: { marginTop: S.xl, gap: S.md },
  btn: { minHeight: TAP + 4, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: C.blue },
  primaryText: { color: C.white, fontWeight: '800', fontSize: 16 },
  secondary: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  secondaryText: { color: C.navy, fontWeight: '700', fontSize: 16 },
});
