/**
 * Exzibo Manager design tokens.
 *
 * Primary: indigo (#4F46E5) — professional, trustworthy, clean
 * Surfaces: near-white backgrounds with well-defined card elevation
 */

const colors = {
  light: {
    // Legacy aliases
    text: '#111827',
    tint: '#4F46E5',

    // Core surfaces
    background: '#F9FAFB',
    foreground: '#111827',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#111827',

    // Primary action color (buttons, links, active states)
    primary: '#4F46E5',
    primaryForeground: '#FFFFFF',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#EEF2FF',
    secondaryForeground: '#4338CA',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#F3F4F6',
    mutedForeground: '#6B7280',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#EEF2FF',
    accentForeground: '#4338CA',

    // Destructive actions (delete, error states)
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#E5E7EB',
    input: '#E5E7EB',
  },

  radius: 10,
};

export default colors;
