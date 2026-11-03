/**
 * The ApplyFields palette, same tokens as packages/ui/src/theme.css.
 * Dark Teal #082046 · Azure Blue #0E7BF4 · Sky #38BDF8 · Ice #E0EDFB
 */
export const C = {
  navy: '#082046',
  blue: '#0e7bf4',
  blueDark: '#0c6fdc',
  sky: '#38bdf8',
  ice: '#e0edfb',
  white: '#ffffff',
  canvas: '#f0f4f8',
  line: '#dbe5f1',
  muted: '#5b6b82',
  good: '#0f9d58',
  warn: '#b45309',
  bad: '#c0392b',
} as const;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const R = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

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
 * The website's floating capsule (floating-capsule-navbar.tsx): canvas fill,
 * white rim, soft navy drop shadow.
 */
export const capsule = {
  backgroundColor: C.canvas,
  borderRadius: R.pill,
  borderWidth: 1,
  borderColor: C.white,
  shadowColor: C.navy,
  shadowOpacity: 0.16,
  shadowRadius: 16,
  shadowOffset: { width: 6, height: 10 },
  elevation: 6,
} as const;

/** Soft card shadow that reads the same on both platforms. */
export const card = {
  backgroundColor: C.white,
  borderRadius: R.lg,
  borderWidth: 1,
  borderColor: C.line,
  shadowColor: C.navy,
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;
