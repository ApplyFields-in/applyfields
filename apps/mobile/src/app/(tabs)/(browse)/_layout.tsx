import { Slot } from 'expo-router';
import { View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { TopNav } from '@/components/top-nav';
import { C } from '@/theme';

/** Header, then the Apply/Career/Services navbar, then whichever mode is open. */
export default function BrowseLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <AppHeader />
      <TopNav />
      <Slot />
    </View>
  );
}
