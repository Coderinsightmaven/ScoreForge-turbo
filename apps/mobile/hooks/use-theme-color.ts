/**
 * ScoreForge theme color hook
 * Returns colors based on current theme setting
 */

import { useMemo } from 'react';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { isDark } = useTheme();
  const theme = isDark ? 'dark' : 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

/**
 * Get the current theme colors object
 * Returns a memoized object that changes reference when theme changes
 */
export function useThemeColors() {
  const { isDark } = useTheme();

  // Create a new object reference when isDark changes
  // This ensures React detects the change and re-renders components
  return useMemo(() => {
    const baseColors = isDark ? Colors.dark : Colors.light;
    return { ...baseColors };
  }, [isDark]);
}
