import type { ConversationListResponse } from '@applyfields/types';

import { CapsuleTabs } from '@/components/capsule-tabs';
import { useApi, usePoll } from '@/lib/use-api';

/** Centre workspace: the web partner portal's sidebar, cut to what runs on live data. */
export default function CentreTabs() {
  const { data, refresh } = useApi<ConversationListResponse>('/partners/me/conversations');
  usePoll(() => void refresh(), 30000); // keeps the Chat badge honest while on other tabs
  const unread = data?.threads.reduce((n, t) => n + t.unread_count, 0) ?? 0;

  return (
    <CapsuleTabs
      tabs={[
        { name: 'home', title: 'Home', icon: 'grid-outline' },
        { name: 'bookings', title: 'Bookings', icon: 'calendar-outline' },
        { name: 'messages', title: 'Chat', icon: 'chatbubbles-outline', badge: unread },
        { name: 'services', title: 'Services', icon: 'pricetags-outline' },
      ]}
    />
  );
}
