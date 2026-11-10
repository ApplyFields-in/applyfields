import { describe, expect, it } from 'vitest';
import { relatedLinks } from './opportunities.service.js';

/** opportunities.related_links comes from the scraper; only clean https links reach the page. */
describe('relatedLinks', () => {
  it('keeps titled https links and defaults the category', () => {
    expect(
      relatedLinks([
        { title: ' Corrigendum 1 ', url: 'https://www.isro.gov.in/c1.pdf', category: 'corrigendum' },
        { title: 'Form', url: 'https://www.isro.gov.in/form.pdf' },
      ]),
    ).toEqual([
      { title: 'Corrigendum 1', url: 'https://www.isro.gov.in/c1.pdf', category: 'corrigendum' },
      { title: 'Form', url: 'https://www.isro.gov.in/form.pdf', category: 'supporting_document' },
    ]);
  });

  it('drops non-https, javascript:, malformed and untitled entries', () => {
    expect(
      relatedLinks([
        { title: 'http', url: 'http://example.gov.in/a.pdf' },
        { title: 'xss', url: 'javascript:alert(1)' },
        { title: 'bad', url: 'not a url' },
        { title: '  ', url: 'https://example.gov.in/a.pdf' },
        null,
        'string',
      ]),
    ).toEqual([]);
    expect(relatedLinks(null)).toEqual([]);
    expect(relatedLinks({})).toEqual([]);
  });
});
