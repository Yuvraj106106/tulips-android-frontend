export const COLORS = {
  background: '#0a0a1a',
  primary: '#FFBF00', // Golden accent
  secondary: '#111111',
  surface: '#1a1a2e',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#222222',
  error: '#FF3B30',
  success: '#4CD964',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  body: {
    fontSize: 16,
    color: COLORS.text,
  },
  caption: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
};
