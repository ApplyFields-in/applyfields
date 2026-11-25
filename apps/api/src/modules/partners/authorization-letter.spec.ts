import { PDFDocument } from 'pdf-lib';
import { buildAuthorizationLetter, letterRef } from './authorization-letter.js';

it('builds a one-page PDF with the account reference, even for non-Latin names', async () => {
  const bytes = await buildAuthorizationLetter({
    partnerId: '3f2a9c1e-0000-4000-8000-000000000001',
    collegeName: 'JNTU Gurajada Vizianagaram (జేఎన్టీయూ)',
    address: 'Dwarapudi, Vizianagaram, 535003',
    representative: 'R. Kumar (Admissions Officer)',
    email: 'admissions@example.edu',
    phone: '+919848012345',
  });
  expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe('%PDF-');
  const doc = await PDFDocument.load(bytes);
  expect(doc.getPageCount()).toBe(1);
  expect(letterRef('3f2a9c1e-0000-4000-8000-000000000001')).toBe('AF-INST-3F2A9C1E');
});
