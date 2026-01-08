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
    // semantic colors
    error: '#ef4444',
    'error-subtle': '#fef2f2',
    success: '#16a34a',
    'success-subtle': '#f0fdf4',
    warning: '#ca8a04',
    'warning-subtle': '#fefce8',
    info: '#2563eb',
    'info-subtle': '#eff6ff',
    // interactive
    link: '#2563eb',
    'link-hover': '#1d4ed8',
    selected: '#0ea5e9',
    'selected-subtle': '#e0f2fe',
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
    // semantic colors
    error: '#f87171',
    'error-subtle': '#450a0a',
    success: '#4ade80',
    'success-subtle': '#052e16',
    warning: '#facc15',
    'warning-subtle': '#422006',
    info: '#60a5fa',
    'info-subtle': '#172554',
    // interactive
    link: '#60a5fa',
    'link-hover': '#93c5fd',
    selected: '#38bdf8',
    'selected-subtle': '#0c4a6e',
  },
} as const

export type ColorToken = keyof typeof colors.light
