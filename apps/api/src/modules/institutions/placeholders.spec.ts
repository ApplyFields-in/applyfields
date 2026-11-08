import { describe, expect, it } from 'vitest';

import { cleanDescription, cleanText, withoutPlaceholders } from './placeholders.js';

describe('college placeholders', () => {
  it('drops placeholder text and keeps real parts', () => {
    expect(cleanText('Data not given')).toBeNull();
    expect(cleanText('AICTE Approved · Data not given')).toBe('AICTE Approved');
    expect(cleanText('INR 8 L')).toBe('INR 8 L');
    expect(cleanText('Annual Tuition Fee: Data not given / Concessions for SC/ST/EWS as per Govt norms')).toBeNull();
    expect(cleanText('Not available')).toBe('Not available'); // only the import's own phrases are dropped
  });

  it('removes the import phrase from descriptions', () => {
    expect(
      cleanDescription('Technical and professional education institution in Pune, Not provided in source. Recognized by AICTE.'),
    ).toBe('Technical and professional education institution in Pune. Recognized by AICTE.');
    expect(cleanDescription('Not provided in source.')).toBeNull();
  });

  it('cleans a whole row: JSON fields, empty arrays, course fees', () => {
    const row = withoutPlaceholders({
      fees_text: 'Data not given',
      accreditation: { nba: 'Data not given', aicte: 'Approved', nirf: 'Data not given' },
      placement_stats: { avg_package: 'Data not given', top_recruiters: [], highest_package: 'Data not given' },
      courses: [{ name: 'B.Tech', fees_text: 'Data not given' }],
    });
    expect(row).toEqual({
      fees_text: null,
      accreditation: { aicte: 'Approved' },
      placement_stats: {},
      courses: [{ name: 'B.Tech', fees_text: null }],
    });
  });
});
