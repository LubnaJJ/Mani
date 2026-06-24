export const colors = {
  bg: '#FAF8F5',
  ink: '#1C1C1A',
  ink2: '#6B6760',
  ink3: '#A8A49F',
  accent: '#D4A5A5',
  accentDark: '#B08080',
  sage: '#8FA68E',
  surface: '#F0EDE8',
  border: '#E2DDD8',
} as const;

export const fonts = {
  display: "'Shippori Mincho', serif",
  body: "'Inter', sans-serif",
} as const;

export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const spacing = {
  xs: '0.5rem',
  sm: '1rem',
  md: '2rem',
  lg: '4rem',
  xl: '8rem',
  '2xl': '12rem',
} as const;

export const transitions = {
  default: 'all 0.3s ease',
  opacity: 'opacity 0.3s ease',
} as const;

export const borderRadius = {
  none: '0px',
} as const;

const theme = { colors, fonts, fontWeights, spacing, transitions, borderRadius } as const;

export default theme;
