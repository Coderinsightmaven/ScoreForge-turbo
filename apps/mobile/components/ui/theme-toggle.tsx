/**
 * Theme toggle button for switching between light, dark, and system themes.
 */

import { Pressable, StyleSheet } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";
import { useThemeColors } from "@/hooks/use-theme-color";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/themed-text";
import { Spacing, Radius } from "@/constants/theme";

export function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();
  const colors = useThemeColors();

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme(isDark ? "light" : "dark");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  return (
    <Pressable
      onPress={cycleTheme}
      style={[
        styles.button,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
      ]}
    >
      <IconSymbol
        name={isDark ? "sun.max.fill" : "moon.fill"}
        size={18}
        color={colors.accent}
      />
    </Pressable>
  );
}

export function ThemeToggleWithLabel() {
  const { theme, setTheme, isDark } = useTheme();
  const colors = useThemeColors();

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme(isDark ? "light" : "dark");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  const themeLabel =
    theme === "system" ? "System" : theme === "light" ? "Light" : "Dark";

  return (
    <Pressable
      onPress={cycleTheme}
      style={[
        styles.buttonWithLabel,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
      ]}
    >
      <IconSymbol
        name={isDark ? "sun.max.fill" : "moon.fill"}
        size={18}
        color={colors.accent}
      />
      <ThemedText style={styles.label}>{themeLabel}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  buttonWithLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
});
