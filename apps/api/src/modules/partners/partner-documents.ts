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

/** Partner types that run a college desk (the rest are service centres). */
export const COLLEGE_PARTNER_TYPES = ['college', 'university', 'training_institute'] as const;

/** Documents staff must approve before the partner can be approved (the non-optional ones in the shared lists). */
export const REQUIRED_CENTRE_DOCUMENTS = ['trade_license', 'kiosk_photo', 'owner_id'] as const;
export const REQUIRED_COLLEGE_DOCUMENTS = ['aicte_approval_letter', 'principal_authorization_letter'] as const;

export const PARTNER_DOCUMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
