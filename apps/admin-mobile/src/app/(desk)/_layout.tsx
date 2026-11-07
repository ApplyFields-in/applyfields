/**
 * Role-based tabs. Each tab exists only for roles the API would let through (TABS in lib/staff.ts mirrors
 * the @Roles on the endpoints it calls): admin → everything · reviewer/content_editor → Pulse, Review ·
 * support → Pulse, KYC. The API still checks every call; this only keeps 403 screens out of the bar.
 */
import type { Ionicons } from '@expo/vector-icons';

import { CapsuleTabs } from '@/components/capsule-tabs';
import { useSession } from '@/lib/session';
import { TABS, tabsForRoles, type TabName } from '@/lib/staff';

const ICON: Record<TabName, keyof typeof Ionicons.glyphMap> = {
  pulse: 'pulse-outline',
  kyc: 'shield-checkmark-outline',
  queue: 'document-text-outline',
  broadcast: 'megaphone-outline',
  account: 'person-circle-outline',
};

export default function DeskTabs() {
  const { staff } = useSession();
  const allowed = tabsForRoles(staff?.roles ?? []);
  return (
    <CapsuleTabs
      tabs={TABS.filter((t) => allowed.includes(t.name)).map((t) => ({ name: t.name, title: t.title, icon: ICON[t.name] }))}
      hidden={TABS.filter((t) => !allowed.includes(t.name)).map((t) => t.name)}
    />
  );
}
