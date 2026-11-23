import * as shared from '@applyfields/types';
import {
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
});
