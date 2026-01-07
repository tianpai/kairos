/**
 * Color palette for Kairos
 *
 * Usage in components:
 * - Tailwind classes: bg-base, bg-surface, text-primary, border-default, etc.
 * - Dark mode is automatic via CSS prefers-color-scheme
 *
 * This file is the source of truth - CSS variables in styles.css mirror these values.
 */

export const colors = {
  light: {
    base: '#F5F5F5',
    surface: '#f3f4f6',
    hover: '#e5e7eb',
    active: '#d1d5db',
    default: '#d1d5db', // border
    primary: '#111827', // text
    secondary: '#4b5563',
    hint: '#9ca3af',
    disabled: '#d1d5db',
    error: '#ef4444',
    success: '#16a34a',
    warning: '#ca8a04',
  },
  dark: {
    base: '#1a1a1a',
    surface: '#2a2a2a',
    hover: '#374151',
    active: '#4b5563',
    default: '#4b5563',
    primary: '#f3f4f6',
    secondary: '#9ca3af',
    hint: '#6b7280',
    disabled: '#4b5563',
    error: '#f87171',
    success: '#4ade80',
    warning: '#facc15',
  },
} as const

export type ColorToken = keyof typeof colors.light
