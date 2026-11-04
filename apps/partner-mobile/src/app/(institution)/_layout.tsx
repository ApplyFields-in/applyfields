import type { InstitutionEnquiryListResponse } from '@applyfields/types';

import { CapsuleTabs } from '@/components/capsule-tabs';
import { useApi } from '@/lib/use-api';

/** Institution workspace: the web /institution sidebar, on live data only. */
export default function InstitutionTabs() {
  const { data } = useApi<InstitutionEnquiryListResponse>('/career/colleges/partner/enquiries?status=new');

  return (
    <CapsuleTabs
      tabs={[
        { name: 'desk', title: 'Desk', icon: 'grid-outline' },
        { name: 'enquiries', title: 'Enquiries', icon: 'mail-outline', badge: data?.total },
        { name: 'campus', title: 'Campus', icon: 'school-outline' },
      ]}
    />
  );
}
