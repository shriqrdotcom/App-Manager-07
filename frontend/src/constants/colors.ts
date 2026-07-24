/**
 * Exzibo Manager — dark theme tokens.
 */
export const colors = {
  // Legacy aliases (still used by loading/error screens)
  text: '#F5F5F5',
  tint: '#F5F5F5',

  // Core surfaces
  background: '#121313',
  foreground: '#F5F5F5',

  // Cards
  card: '#1B1C1C',
  cardElevated: '#242526',
  cardForeground: '#F5F5F5',

  // Primary (used for focus rings, active tabs)
  primary: '#F5F5F5',
  primaryForeground: '#121313',

  // Secondary
  secondary: '#242526',
  secondaryForeground: '#F5F5F5',

  // Muted
  muted: '#1F2021',
  mutedForeground: '#8A8A8E',

  // Accent
  accent: '#2B2C2D',
  accentForeground: '#F5F5F5',

  // Destructive
  destructive: '#EF4444',
  destructiveForeground: '#F5F5F5',

  // Borders / inputs
  border: '#26272A',
  input: '#1F2021',

  // Header
  headerBg: '#121313',

  // Status/semantic
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };
export const typography = {
  h1: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '500' as const },
  small: { fontSize: 12, fontWeight: '500' as const },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
};

export default colors;
