import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@repo/convex";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser);

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
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#D4A017" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="bg-white px-5 py-5 shadow-sm shadow-slate-900/5">
          <Text className="font-display-bold text-2xl tracking-tight text-slate-900">Profile</Text>
          <Text className="font-sans text-sm text-text-tertiary">Manage your account</Text>
        </View>

        <View className="flex-1 bg-slate-50 p-4">
          {/* User Info Card */}
          <View className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-900/5">
            <View className="mb-6 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/30">
                <Text className="font-display-bold text-3xl text-white">
                  {user?.name?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <Text className="font-display-semibold text-xl text-slate-900">
                {user?.name ?? "User"}
              </Text>
              {user?.email && (
                <Text className="mt-1 font-sans text-sm text-text-tertiary">{user.email}</Text>
              )}
            </View>

            {/* Account Details */}
            <View className="mb-6 rounded-xl bg-slate-50 p-4">
              <Text className="mb-3 font-display-semibold text-xs uppercase text-text-tertiary">
                Account Details
              </Text>
              <View className="mb-2 flex-row justify-between">
                <Text className="text-sm text-text-secondary">Name</Text>
                <Text className="text-sm font-medium text-slate-900">{user?.name ?? "—"}</Text>
              </View>
              {user?.email && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-text-secondary">Email</Text>
                  <Text className="text-sm font-medium text-slate-900">{user.email}</Text>
                </View>
              )}
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              className="items-center rounded-xl border-2 border-red-200 bg-red-50 py-4"
              onPress={handleSignOut}
              activeOpacity={0.7}>
              <Text className="text-base font-semibold text-red-600">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
