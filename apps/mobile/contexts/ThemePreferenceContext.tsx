import { createContext, use } from "react";

export type ThemePreference = "system" | "light" | "dark";

export interface ThemePreferenceContextType {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
}

export const ThemePreferenceContext = createContext<ThemePreferenceContextType | null>(null);

export function useThemePreference() {
  const context = use(ThemePreferenceContext);
  if (!context) {
    throw new Error("useThemePreference must be used within ThemePreferenceContext");
  }
  return context;
}
