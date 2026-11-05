// Runtime copy of packages/types/src/partner-documents.ts. The API can't import values from
// @applyfields/types at runtime (Node can't resolve its `./x.js` → .ts imports); types are fine.
// partner-documents.spec.ts fails if this drifts from the shared list.
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
