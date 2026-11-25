import type { PartnerDetail } from '@applyfields/types';
import { AlertCircle } from 'lucide-react';

/** Rejected partners see staff's reason; uploading a fixed document below sends them back for review. */
export function RejectedNotice({ partner }: { partner: PartnerDetail }) {
  if (partner.verification_status !== 'rejected') return null;
  return (
    <div role="alert" className="mb-6 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
      <AlertCircle className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-bold">Your application was not approved</p>
        <p className="mt-1">{partner.verification_note || 'Our team could not verify your documents.'}</p>
        <p className="mt-2 text-xs text-rose-800">
          Upload the corrected document below and we will review your application again.
        </p>
      </div>
    </div>
  );
}
