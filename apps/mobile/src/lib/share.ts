/**
 * Share links point at the website. A phone with the app installed opens them in the app
 * (Android App Links / iOS Universal Links, see app.json + apps/web/public/.well-known);
 * anyone else lands on the web page, which offers the app download.
 */
import type { OpportunityType } from '@applyfields/types';
import { Platform, Share } from 'react-native';

export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://applyfields.com').replace(/\/$/, '');

const OPPORTUNITY_PATH: Record<OpportunityType, string> = {
  govt_job: '/jobs',
  exam: '/exams',
  scholarship: '/scholarships',
  admission: '/admissions',
};

export const opportunityUrl = (type: OpportunityType, slug: string) => `${WEB_URL}${OPPORTUNITY_PATH[type]}/${slug}`;
export const collegeUrl = (slug: string) => `${WEB_URL}/career/colleges/${slug}`;

export function shareLink(title: string, url: string) {
  // iOS shows `url` as a rich link; Android only reads `message`.
  const content = Platform.OS === 'ios' ? { message: title, url } : { message: `${title}\n${url}` };
  return Share.share(content, { dialogTitle: 'Share' }).catch(() => undefined);
}
