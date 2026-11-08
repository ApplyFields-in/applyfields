import { Slot, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { FieldyMascot } from '@/components/fieldy-mascot';
import { TopNav } from '@/components/top-nav';
import { C, R } from '@/theme';

/**
 * Header, then the Apply/Career/Services navbar, then whichever mode is open.
 * Fieldy floats bottom-right on these three screens, like the chat on the website's
 * apply and career pages.
 */
export default function BrowseLayout() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <AppHeader />
      <TopNav />
      <Slot />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ask Fieldy, the AI advisor"
        onPress={() => router.push('/assistant')}
        style={({ pressed }) => [s.fab, pressed && { transform: [{ scale: 0.94 }] }]}
      >
        <FieldyMascot mood="idle" size={56} radius={R.pill} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    padding: 3,
    borderRadius: R.pill,
    backgroundColor: C.blue,
    shadowColor: C.navy,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
