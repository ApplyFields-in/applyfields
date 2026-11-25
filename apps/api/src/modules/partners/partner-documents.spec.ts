import * as shared from '@applyfields/types';
import {
  COLLEGE_PARTNER_TYPES,
  PARTNER_DOCUMENT_KINDS,
  PARTNER_DOCUMENT_MIME_TYPES,
  REQUIRED_CENTRE_DOCUMENTS,
  REQUIRED_COLLEGE_DOCUMENTS,
} from './partner-documents.js';

it('API copy of the KYC document lists matches @applyfields/types', () => {
  expect(PARTNER_DOCUMENT_KINDS).toEqual(shared.PARTNER_DOCUMENT_KINDS);
  expect(PARTNER_DOCUMENT_MIME_TYPES).toEqual(shared.PARTNER_DOCUMENT_MIME_TYPES);
  const required = (list: readonly shared.KycDocumentSpec[]) => list.filter((d) => !d.optional).map((d) => d.kind);
  expect(REQUIRED_CENTRE_DOCUMENTS).toEqual(required(shared.CENTRE_KYC_DOCUMENTS));
  expect(REQUIRED_COLLEGE_DOCUMENTS).toEqual(required(shared.COLLEGE_KYC_DOCUMENTS));
  expect([...COLLEGE_PARTNER_TYPES]).toEqual([...shared.COLLEGE_PARTNER_TYPES]);
});

it('kycSubmitted (partner apps open the dashboard): every required file in and not rejected', () => {
  const docs = (...kinds: string[]) => kinds.map((k) => ({ document_kind: k, status: 'pending' }));
  expect(shared.kycSubmitted({ type: 'meeseva', documents: docs('trade_license', 'kiosk_photo') })).toBe(false);
  expect(shared.kycSubmitted({ type: 'meeseva', documents: docs('trade_license', 'kiosk_photo', 'owner_id') })).toBe(true);
  expect(
    shared.kycSubmitted({
      type: 'meeseva',
      documents: [...docs('trade_license', 'kiosk_photo'), { document_kind: 'owner_id', status: 'rejected' }],
    }),
  ).toBe(false);
  // GST and NAAC are optional.
  expect(shared.kycSubmitted({ type: 'college', documents: docs('aicte_approval_letter', 'principal_authorization_letter') })).toBe(true);
  expect(shared.kycSubmitted({ type: 'college' })).toBe(false);
});
