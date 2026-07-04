/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Semantic color tokens for the CarDiag app surfaces (dark navy theme).
 * Use these instead of hard-coding hex values so the front-door (auth) and the
 * in-app screens stay visually identical. Contrast checked against {@link Palette.bg}:
 * `textSecondary`/`textMuted` clear WCAG AA (~5.3:1) for body text.
 */
export const Palette = {
  bg: '#0a0e27', // app background, deep navy
  surface: '#141a36', // cards, inputs
  surfaceAlt: '#10162e', // tab bar, subtle panels
  surfaceStrong: '#142a52', // emphasized hero surface
  border: '#222a4d', // card / panel borders
  inputBorder: '#2a3358', // input field borders (slightly brighter, reads interactive)
  primary: '#00AAFF',
  onPrimary: '#ffffff',
  textPrimary: '#ffffff',
  textSecondary: '#c5cae0',
  textMuted: '#8A8F98',
  placeholder: '#8A8F98', // same as muted to keep placeholders ≥4.5:1
  danger: '#FF4444',
  dangerSurface: '#1a1226',
  dangerBorder: '#3a1530',
  success: '#44D17A',
} as const;

/** Corner-radius scale. Cards top out at lg; pill is for tags/avatars. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
