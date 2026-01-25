import { Theme, ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { ConvexProvider } from "@/providers/ConvexProvider";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { Colors } from "@/constants/theme";

function createNavigationTheme(isDark: boolean): Theme {
  const colors = isDark ? Colors.dark : Colors.light;
  return {
    dark: isDark,
    colors: {
      primary: colors.tint,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.tint,
    },
    fonts: {
      regular: {
        fontFamily: "System",
        fontWeight: "400",
      },
      medium: {
        fontFamily: "System",
        fontWeight: "500",
      },
      bold: {
        fontFamily: "System",
        fontWeight: "700",
      },
      heavy: {
        fontFamily: "System",
        fontWeight: "800",
      },
    },
  };
}

function AppContent() {
  const { isDark } = useTheme();
  const navigationTheme = createNavigationTheme(isDark);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Slot />
      <StatusBar style={isDark ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ConvexProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ConvexProvider>
  );
}
