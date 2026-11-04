/**
 * The ApplyFields palette, same tokens as packages/ui/src/theme.css.
 * Dark Teal #082046 · Azure Blue #0E7BF4 · Sky #38BDF8 · Ice #E0EDFB
 */
export const C = {
  navy: '#082046',
  blue: '#0E7BF4',
  blueDark: '#0c6fdc',
  sky: '#38BDF8',
  ice: '#E0EDFB',
  white: '#ffffff',
  canvas: '#F4F7FB',
  line: '#E2E8F0',
  lineBorder: 'rgba(8, 32, 70, 0.08)',
  subtleLine: 'rgba(8, 32, 70, 0.06)',
  muted: '#5B6B82',
  mutedNavy: '#435775',
  slate: '#64748B',
  inputBg: '#EDF3F9',
  inputBorder: '#CAD7E7',
  pillTrack: '#EDF2F8',
  good: '#0f9d58',
  warn: '#b45309',
  bad: '#c0392b',
} as const;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const R = { sm: 8, md: 12, lg: 16, card: 20, pill: 999 } as const;

/** Apple/Google minimum touch target. Smaller visuals reach it with hitSlop. */
export const TAP = 44;

/**
 * Content column: full width on phones, capped and centred on tablets so cards
 * and lines of text don't stretch across a 1024pt iPad.
 */
export const column = { width: '100%', maxWidth: 720, alignSelf: 'center' } as const;

/**
 * Ceiling for system font scaling on UI chrome (tabs, buttons, chips, badges).
 * Body text is left uncapped so large-text users still get large text.
 */
export const CHROME_FONT_SCALE = 1.35;

/**
 * The website's floating capsule: clean light surface, subtle line border,
 * soft airy drop shadow.
 */
export const capsule = {
  backgroundColor: C.white,
  borderRadius: R.pill,
  borderWidth: 1,
  borderColor: 'rgba(8, 32, 70, 0.08)',
  shadowColor: C.navy,
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

/** Soft claymorphic / neumorphic card shadow that reads the same on both platforms. */
export const card = {
  backgroundColor: C.white,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: 'rgba(8, 32, 70, 0.08)',
  shadowColor: C.navy,
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;
