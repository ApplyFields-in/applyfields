import type { ReactNode } from 'react';
import { SiteShell } from '@/components/site-shell';

/** Every page inside (main) gets the sidebar, top bar and footer. */
export default function MainLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
