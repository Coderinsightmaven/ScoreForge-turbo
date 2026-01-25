import { useAuthActions } from "@convex-dev/auth/react";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing, Radius, Shadows } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useTheme } from "@/contexts/ThemeContext";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuthActions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const colors = useThemeColors();
  const { isDark } = useTheme();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("flow", "signUp");
      if (name) {
        formData.append("name", name);
      }

      await signIn("password", formData);
      router.replace("/(main)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={[styles.logoIcon, { backgroundColor: colors.accent }]}>
                <IconSymbol name="bolt.fill" size={28} color={isDark ? colors.bgPrimary : "#ffffff"} />
              </View>
            </View>
            <ThemedText type="headline" style={styles.title}>
              CREATE ACCOUNT
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>Join ScoreForge and start competing</ThemedText>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <ThemedText type="label" style={[styles.inputLabel, { color: colors.textSecondary }]}>
                FULL NAME (OPTIONAL)
              </ThemedText>
              <View style={[styles.inputContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <IconSymbol name="person.fill" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  textContentType="name"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <ThemedText type="label" style={[styles.inputLabel, { color: colors.textSecondary }]}>
                EMAIL ADDRESS
              </ThemedText>
              <View style={[styles.inputContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <IconSymbol name="envelope.fill" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <ThemedText type="label" style={[styles.inputLabel, { color: colors.textSecondary }]}>
                PASSWORD
              </ThemedText>
              <View style={[styles.inputContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <IconSymbol name="lock.fill" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Min 8 characters"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <IconSymbol
                    name={showPassword ? "eye.slash.fill" : "eye.fill"}
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <ThemedText type="label" style={[styles.inputLabel, { color: colors.textSecondary }]}>
                CONFIRM PASSWORD
              </ThemedText>
              <View style={[styles.inputContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <IconSymbol name="lock.fill" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Repeat password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <Animated.View entering={FadeInDown.duration(300)} style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
                <IconSymbol name="exclamationmark.circle.fill" size={16} color={colors.error} />
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
              </Animated.View>
            )}

            {/* Sign Up Button */}
            <Pressable
              style={({ pressed }) => [styles.signUpButton, { backgroundColor: colors.accent }, pressed && styles.buttonPressed]}
              onPress={handleSignUp}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={isDark ? colors.bgPrimary : "#ffffff"} />
              ) : (
                <>
                  <ThemedText style={[styles.signUpButtonText, { color: isDark ? colors.bgPrimary : "#ffffff" }]}>CREATE ACCOUNT</ThemedText>
                  <IconSymbol name="arrow.right" size={18} color={isDark ? colors.bgPrimary : "#ffffff"} />
                </>
              )}
            </Pressable>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account?</ThemedText>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <ThemedText style={[styles.footerLink, { color: colors.accent }]}>Sign In</ThemedText>
              </Pressable>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.accent,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 15,
  },
  form: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  inputLabel: {},
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  signUpButton: {
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    ...Shadows.accent,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  signUpButtonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
