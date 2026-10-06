import { describe, expect, it } from 'vitest';
import { publishBlockers } from './review.service.js';

const ready = {
  title: 'SSC CGL 2026',
  notification_pdf_url: 'https://ssc.gov.in/cgl.pdf',
  official_page_url: null,
  source_url: 'https://ssc.gov.in/notices',
  application_end: new Date('2026-10-31'),
  field_status: {},
};

describe('publishBlockers (job-format §5)', () => {
  it('passes a complete draft', () => {
    expect(publishBlockers(ready)).toEqual([]);
  });

  it('accepts the official page instead of the PDF', () => {
    expect(
      publishBlockers({
        ...ready,
        notification_pdf_url: null,
        official_page_url: 'https://ssc.gov.in/cgl',
      }),
    ).toEqual([]);
  });

  it('needs an official link, a source URL and a title', () => {
    expect(
      publishBlockers({
        ...ready,
        title: '  ',
        notification_pdf_url: null,
        source_url: null,
      }),
    ).toEqual([
      'Title',
      'Official link (notification PDF or official page)',
      'Source URL',
    ]);
  });

  it('needs a last date unless dates are marked "not in source"', () => {
    expect(publishBlockers({ ...ready, application_end: null })).toEqual([
      'Last date (or mark dates "not in source")',
    ]);
    expect(
      publishBlockers({
        ...ready,
        application_end: null,
        field_status: { dates: 'not_in_source' },
      }),
    ).toEqual([]);
    expect(
      publishBlockers({
        ...ready,
        application_end: null,
        field_status: { dates: 'pending' },
      }),
    ).toHaveLength(1);
  });
});
