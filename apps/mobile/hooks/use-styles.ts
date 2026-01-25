/**
 * Hook to create dynamic styles based on the current theme.
 * Use this for screens that need themed StyleSheet styles.
 */

import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useThemeColors } from "./use-theme-color";

/**
 * Creates memoized styles that update when the theme changes.
 *
 * @example
 * function MyScreen() {
 *   const styles = useStyles((colors) => StyleSheet.create({
 *     container: { backgroundColor: colors.bgPrimary },
 *     text: { color: colors.textPrimary },
 *   }));
 *   return <View style={styles.container}><Text style={styles.text}>Hello</Text></View>;
 * }
 */
export function useStyles<T extends StyleSheet.NamedStyles<T>>(
  createStyles: (colors: ReturnType<typeof useThemeColors>) => T
): T {
  const colors = useThemeColors();
  return useMemo(() => createStyles(colors), [colors, createStyles]);
}

/**
 * Type helper for style creators
 */
export type StyleCreator<T extends StyleSheet.NamedStyles<T>> = (
  colors: ReturnType<typeof useThemeColors>
) => T;
