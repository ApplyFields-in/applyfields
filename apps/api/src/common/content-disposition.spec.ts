import { validateHeaderValue } from 'node:http';
import { contentDisposition } from './content-disposition.js';

it('builds a valid header for Telugu, quotes and plain names', () => {
  for (const name of ['ఆధార్.pdf', 'my "pan".png', 'resume.pdf']) {
    const h = contentDisposition('inline', name);
    expect(() => validateHeaderValue('Content-Disposition', h)).not.toThrow();
    expect(h).toContain(`filename*=UTF-8''${encodeURIComponent(name)}`);
  }
});
