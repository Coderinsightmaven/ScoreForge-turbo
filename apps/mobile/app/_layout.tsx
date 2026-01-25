import { Theme, ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  DMSerifDisplay_400Regular,
} from "@expo-google-fonts/dm-serif-display";
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import { useEffect } from "react";
import "react-native-reanimated";

import { ConvexProvider } from "@/providers/ConvexProvider";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { Colors, Fonts } from "@/constants/theme";

// Prevent splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

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
        fontFamily: Fonts.body,
        fontWeight: "400",
      },
      medium: {
        fontFamily: Fonts.bodyMedium,
        fontWeight: "500",
      },
      bold: {
        fontFamily: Fonts.bodyBold,
        fontWeight: "700",
      },
      heavy: {
        fontFamily: Fonts.bodyBold,
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
  const [fontsLoaded, fontError] = useFonts({
    DMSerifDisplay_400Regular,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Wait for fonts to load before rendering
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ConvexProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ConvexProvider>
  );
}
