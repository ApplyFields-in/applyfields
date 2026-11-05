// KYC documents a partner uploads for staff review (POST /partners/me/documents).
// One list for the API (validation), partner web and partner-mobile (upload screens).

export interface KycDocumentSpec {
  kind: string;
  label: string;
  hint: string;
  optional?: boolean;
}

export const CENTRE_KYC_DOCUMENTS: readonly KycDocumentSpec[] = [
  { kind: 'trade_license', label: 'Trade licence', hint: 'Municipal trade / shop licence' },
  { kind: 'kiosk_photo', label: 'Shop front', hint: 'Front of the centre with the board visible' },
  { kind: 'owner_id', label: 'Owner Aadhaar or PAN', hint: 'Mask the first 8 Aadhaar digits' },
  { kind: 'gst_certificate', label: 'GST certificate', hint: 'Only if registered', optional: true },
];

export const COLLEGE_KYC_DOCUMENTS: readonly KycDocumentSpec[] = [
  { kind: 'aicte_approval_letter', label: 'AICTE / UGC approval', hint: 'Latest approval letter' },
  { kind: 'naac_accreditation_certificate', label: 'NAAC certificate', hint: 'Only if accredited', optional: true },
  { kind: 'principal_authorization_letter', label: 'Principal authorisation', hint: 'On letterhead, signed and sealed' },
];

export const PARTNER_DOCUMENT_KINDS = [
  'trade_license',
  'kiosk_photo',
  'owner_id',
  'gst_certificate',
  'aicte_approval_letter',
  'naac_accreditation_certificate',
  'principal_authorization_letter',
] as const;

export const PARTNER_DOCUMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export type PartnerDocumentMimeType = (typeof PARTNER_DOCUMENT_MIME_TYPES)[number];
