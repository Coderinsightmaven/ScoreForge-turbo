import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing, Shadows } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useTheme } from "@/contexts/ThemeContext";

export default function Index() {
  const colors = useThemeColors();
  const { isDark } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <AuthLoading>
        <View style={styles.loadingContainer}>
          <View style={[styles.logoIcon, { backgroundColor: colors.accent }]}>
            <IconSymbol name="bolt.fill" size={32} color={isDark ? colors.bgPrimary : "#ffffff"} />
          </View>
          <ThemedText type="headline" style={styles.logoText}>
            SCOREFORGE
          </ThemedText>
          <ActivityIndicator color={colors.accent} size="large" style={styles.spinner} />
        </View>
      </AuthLoading>

      <Authenticated>
        <Redirect href="/(main)" />
      </Authenticated>

      <Unauthenticated>
        <Redirect href="/(auth)/sign-in" />
      </Unauthenticated>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    ...Shadows.accent,
  },
  logoText: {
    marginBottom: Spacing.xl,
  },
  spinner: {
    marginTop: Spacing.md,
  },
});
