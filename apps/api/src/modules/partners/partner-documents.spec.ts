import * as shared from '@applyfields/types';
import { PARTNER_DOCUMENT_KINDS, PARTNER_DOCUMENT_MIME_TYPES } from './partner-documents.js';

it('API copy of the KYC document lists matches @applyfields/types', () => {
  expect(PARTNER_DOCUMENT_KINDS).toEqual(shared.PARTNER_DOCUMENT_KINDS);
  expect(PARTNER_DOCUMENT_MIME_TYPES).toEqual(shared.PARTNER_DOCUMENT_MIME_TYPES);
});
