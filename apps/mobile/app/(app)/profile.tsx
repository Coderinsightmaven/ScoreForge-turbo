import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@repo/convex";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemePreference, useThemePreference } from "../../contexts/ThemePreferenceContext";

const themeOptions: { label: string; value: ThemePreference; description: string }[] = [
  { label: "System", value: "system", description: "Follow phone appearance settings" },
  { label: "Light", value: "light", description: "Always use light mode" },
  { label: "Dark", value: "dark", description: "Always use dark mode" },
];

export default function ProfileScreen() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser);
  const { themePreference, setThemePreference } = useThemePreference();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  if (user === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#D4A017" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="border-b border-slate-100 bg-white px-5 py-5 dark:border-slate-800 dark:bg-slate-900">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-display-bold text-2xl tracking-tight text-slate-900 dark:text-slate-100">
                Profile
              </Text>
              <Text className="mt-1 font-sans text-sm text-text-tertiary dark:text-slate-400">
                Account, access, and security
              </Text>
            </View>
            <TouchableOpacity
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900"
              onPress={() => router.replace("/(app)")}
              activeOpacity={0.7}>
              <Text className="font-sans-medium text-sm text-slate-900 dark:text-slate-100">
                Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <Text className="font-display-semibold text-xl text-slate-900 dark:text-slate-100">
              {user?.name ?? "User"}
            </Text>
            {user?.email && (
              <Text className="mt-1 text-sm text-text-tertiary dark:text-slate-400">
                {user.email}
              </Text>
            )}
          </View>

          <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <Text className="font-display-semibold text-sm uppercase tracking-wide text-text-tertiary dark:text-slate-400">
              Account
            </Text>
            <View className="mt-3 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-text-secondary dark:text-slate-300">Full Name</Text>
                <Text className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user?.name ?? "Not set"}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-text-secondary dark:text-slate-300">Email</Text>
                <Text className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user?.email ?? "Not set"}
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <Text className="font-display-semibold text-sm uppercase tracking-wide text-text-tertiary dark:text-slate-400">
              Access
            </Text>
            <Text className="mt-3 text-sm text-text-secondary dark:text-slate-300">
              You are signed in with your ScoreForge account. Tournament permissions are managed by
              organization admins.
            </Text>
          </View>

          <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <Text className="font-display-semibold text-sm uppercase tracking-wide text-text-tertiary dark:text-slate-400">
              Theme
            </Text>
            <Text className="mt-3 text-sm text-text-secondary dark:text-slate-300">
              Choose how ScoreForge should look on this device.
            </Text>
            <View className="mt-4 gap-2">
              {themeOptions.map((option) => {
                const isSelected = themePreference === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    className={`rounded-xl border px-4 py-3 ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 dark:border-slate-100 dark:bg-slate-100"
                        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                    }`}
                    onPress={() => void setThemePreference(option.value)}
                    activeOpacity={0.8}>
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected
                          ? "text-white dark:text-slate-900"
                          : "text-slate-900 dark:text-slate-100"
                      }`}>
                      {option.label}
                    </Text>
                    <Text
                      className={`mt-1 text-xs ${
                        isSelected
                          ? "text-slate-200 dark:text-slate-700"
                          : "text-text-tertiary dark:text-slate-400"
                      }`}>
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <Text className="font-display-semibold text-sm uppercase tracking-wide text-text-tertiary dark:text-slate-400">
              Security
            </Text>
            <Text className="mt-3 text-sm text-text-secondary dark:text-slate-300">
              Sign out on this device if you are using a shared phone or tablet.
            </Text>
            <TouchableOpacity
              className="mt-4 items-center rounded-xl border-2 border-red-200 bg-red-50 py-4"
              onPress={handleSignOut}
              activeOpacity={0.7}>
              <Text className="text-base font-semibold text-red-600">Sign Out</Text>
            </TouchableOpacity>
          </View>

          <View className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <Text className="font-display-semibold text-sm uppercase tracking-wide text-text-tertiary dark:text-slate-400">
              Support
            </Text>
            <Text className="mt-3 text-sm text-text-secondary dark:text-slate-300">
              Need help with account access or scorer permissions? Contact your tournament
              organizer.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
