/**
 * One-tap starter services, the same list as the website's rate-card presets
 * (apps/partner/src/app/(dashboard)/services/page.tsx). Prices are the partner's
 * own fee and only a starting point — they edit them after adding.
 */
export interface ServicePreset {
  group: string;
  name: string;
  description: string;
  rupees: number;
  time: string;
}

export const SERVICE_PRESETS: ServicePreset[] = [
  { group: 'Xerox & print', name: 'Black & White Xerox / Printout', description: 'High-speed laser printing on 75 GSM paper (single or double sided).', rupees: 3, time: 'Instant (2-5m)' },
  { group: 'Xerox & print', name: 'Full Color Printout / Photostat', description: 'High-resolution colour printing for admit cards, certificates and project reports.', rupees: 15, time: 'Instant (2-5m)' },
  { group: 'Xerox & print', name: 'Document Scanning & PDF Compression', description: 'Scanning up to 600 DPI and compressing to portal limits (under 200 KB).', rupees: 10, time: 'Instant (5-10m)' },
  { group: 'Xerox & print', name: 'Spiral Binding & Document Lamination', description: 'Clear-cover spiral binding up to 200 pages and heat lamination.', rupees: 40, time: '15-20 Mins' },
  { group: 'Aadhaar', name: 'High-Quality Aadhaar PVC Smart Card', description: 'Pocket PVC card with holographic overlay and readable QR code.', rupees: 50, time: '15 Mins' },
  { group: 'Aadhaar', name: 'Aadhaar Demographic Update Assistance', description: 'Guidance and document check for updating name, address, gender or date of birth.', rupees: 50, time: 'Same Day' },
  { group: 'PAN', name: 'Instant e-PAN Card Application', description: 'Paperless instant digital PAN allotment linked to Aadhaar.', rupees: 80, time: '1-2 Hours' },
  { group: 'PAN', name: 'New Physical NSDL / UTI PAN Card', description: 'Full application with signature upload, tracking ID and card delivery.', rupees: 150, time: 'Same Day Filing' },
  { group: 'PAN', name: 'PAN Card Correction & Minor-to-Major Update', description: 'Corrections to name, father’s name or DOB, or updating a minor photo.', rupees: 120, time: 'Same Day Filing' },
  { group: 'MeeSeva / CSC', name: 'Caste / Community Certificate Filing', description: 'Online application for OBC-NCL, SC, ST or BC certificates with MeeSeva acknowledgment.', rupees: 100, time: 'Same Day Filing' },
  { group: 'MeeSeva / CSC', name: 'Integrated Income Certificate Application', description: 'Income certificate filing for scholarships, fee reimbursement and housing.', rupees: 100, time: 'Same Day Filing' },
  { group: 'MeeSeva / CSC', name: 'Residence / Domicile / Nativity Certificate', description: 'Domicile certificate filing for state quota admissions.', rupees: 100, time: 'Same Day Filing' },
  { group: 'MeeSeva / CSC', name: 'EWS (Economically Weaker Section) Certificate', description: 'EWS reservation certificate application with verification tracking.', rupees: 150, time: 'Same Day Filing' },
  { group: 'Exam & job forms', name: 'SSC Form Filing Assistance (CGL, CHSL, MTS, GD)', description: 'OTR profile, live photo capture, fee payment and hall ticket confirmation.', rupees: 150, time: 'Same Day' },
  { group: 'Exam & job forms', name: 'UPSC Civil Services / NDA / CDS Application Filing', description: 'OTR registration, centre selection, dated photo and preview check.', rupees: 200, time: 'Same Day' },
  { group: 'Exam & job forms', name: 'Railway RRB (NTPC, Group D, ALP) Form Filing', description: 'Portal submission, zone preference, post priority and payment check.', rupees: 150, time: 'Same Day' },
  { group: 'Exam & job forms', name: 'State Police Constable & Sub-Inspector Filing', description: 'Physical standards checklist, exam booking and quota tagging.', rupees: 150, time: 'Same Day' },
];

/** Chat quick replies, same phrases as the website's Communication Desk. */
export const QUICK_REPLIES = [
  'Please bring your original physical Aadhaar Card for biometric verification.',
  'Your photo resolution is too low for the official portal. Please upload a clear photo.',
  'Yes, you can arrive 10–15 minutes early; your slot is reserved with zero wait.',
  'Your application has been filed! Uploading your official acknowledgment slip now.',
  'Please bring 2 recent passport-size photographs with white background.',
];

/** Accreditation choices on the college join form (website: institution/onboard). */
export const ACCREDITATIONS = [
  { value: 'naac', label: 'NAAC' },
  { value: 'aicte', label: 'AICTE' },
  { value: 'ugc', label: 'UGC university' },
  { value: 'autonomous', label: 'UGC autonomous' },
  { value: 'other', label: 'National importance (IIT/NIT/AIIMS)' },
] as const;
