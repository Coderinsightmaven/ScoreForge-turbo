import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@repo/convex";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { getDisplayMessage } from "../../utils/errors";
import { useTempScorer } from "../../contexts/TempScorerContext";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LoginType = "regular" | "scorer";

export default function SignInScreen() {
  const { signIn } = useAuthActions();
  const { setSession } = useTempScorer();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [loginType, setLoginType] = useState<LoginType>("regular");

  // Regular login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Scorer login state
  const [tournamentCode, setTournamentCode] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signInTempScorer = useMutation(api.temporaryScorers.signIn);

  const tournamentInfo = useQuery(
    api.temporaryScorers.getTournamentByCode,
    tournamentCode.length === 6 ? { code: tournamentCode } : "skip"
  );

  const placeholderColor = isDark ? "#6b7280" : "#94A3B8";

  const handleRegularSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signIn("password", { email, password, flow: "signIn" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (
        message.includes("InvalidSecret") ||
        message.toLowerCase().includes("invalid") ||
        message.toLowerCase().includes("incorrect") ||
        message.toLowerCase().includes("credentials") ||
        message.toLowerCase().includes("password")
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (
        message.includes("InvalidAccountId") ||
        message.toLowerCase().includes("not found") ||
        message.toLowerCase().includes("no user") ||
        message.toLowerCase().includes("does not exist")
      ) {
        setError("No account found with this email address.");
      } else if (
        message.toLowerCase().includes("too many") ||
        message.toLowerCase().includes("rate limit")
      ) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError("Unable to sign in. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScorerSubmit = async () => {
    if (!tournamentCode || !username || !pin) {
      setError("Please fill in all fields");
      return;
    }

    if (tournamentCode.length !== 6) {
      setError("Tournament code must be 6 characters");
      return;
    }

    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await signInTempScorer({
        code: tournamentCode,
        username: username,
        pin: pin,
      });

      if (!result) {
        setError("Invalid credentials. Please check your code, username, and PIN.");
        return;
      }

      await setSession({
        token: result.token,
        scorerId: result.scorerId,
        tournamentId: result.tournamentId,
        displayName: result.displayName,
        tournamentName: result.tournamentName,
        sport: result.sport,
        expiresAt: result.expiresAt,
      });

      router.replace("/(scorer)");
    } catch (err) {
      setError(getDisplayMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-[#141414]">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1">
          <ScrollView
            contentContainerClassName="flex-grow justify-center px-6 py-8"
            keyboardShouldPersistTaps="always">
            {/* Logo & Branding */}
            <View className="mb-8 items-center">
              <View className="mb-4 h-24 w-24 items-center justify-center rounded-3xl bg-brand shadow-2xl shadow-brand/30">
                <Text className="font-display-bold text-4xl text-white">S</Text>
              </View>
              <Text className="mb-1 font-display-semibold text-2xl text-text-primary dark:text-[#F5F5F3]">
                Welcome to ScoreForge
              </Text>
              <Text className="font-sans text-xs uppercase tracking-wide text-text-tertiary dark:text-[#9ca3af]">
                Tournament Scoring Made Simple
              </Text>
            </View>

            {/* Login Type Tabs */}
            <View className="mb-6 flex-row rounded-lg bg-slate-100 p-1 dark:bg-[#1E1E1E]">
              <Pressable
                className={
                  loginType === "regular"
                    ? "flex-1 items-center rounded-md bg-white py-3 shadow-sm shadow-slate-900/10 dark:bg-[#2A2A2A]"
                    : "flex-1 items-center rounded-md py-3"
                }
                onPress={() => {
                  setLoginType("regular");
                  setError(null);
                }}>
                <Text
                  className={
                    loginType === "regular"
                      ? "font-sans-semibold text-xs uppercase tracking-wide text-slate-900 dark:text-[#F5F5F3]"
                      : "font-sans-medium text-xs uppercase tracking-wide text-slate-400 dark:text-[#9ca3af]"
                  }>
                  Account Login
                </Text>
              </Pressable>
              <Pressable
                className={
                  loginType === "scorer"
                    ? "flex-1 items-center rounded-md bg-white py-3 shadow-sm shadow-slate-900/10 dark:bg-[#2A2A2A]"
                    : "flex-1 items-center rounded-md py-3"
                }
                onPress={() => {
                  setLoginType("scorer");
                  setError(null);
                }}>
                <Text
                  className={
                    loginType === "scorer"
                      ? "font-sans-semibold text-xs uppercase tracking-wide text-slate-900 dark:text-[#F5F5F3]"
                      : "font-sans-medium text-xs uppercase tracking-wide text-slate-400 dark:text-[#9ca3af]"
                  }>
                  Scorer Login
                </Text>
              </Pressable>
            </View>

            {/* Login Card */}
            <View className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-900/5 dark:bg-[#1E1E1E]">
              {/* Brand accent bar */}
              <View className="h-1 bg-brand" />

              <View className="px-6 pb-6 pt-5">
                {loginType === "regular" ? (
                  <>
                    <Text className="mb-1 text-center font-display-bold text-lg text-slate-900 dark:text-[#F5F5F3]">
                      Welcome Back
                    </Text>
                    <Text className="mb-6 text-center font-sans text-xs text-text-tertiary dark:text-[#9ca3af]">
                      Sign in with your account
                    </Text>

                    <View className="space-y-4">
                      <View>
                        <Text className="mb-2 font-display-bold text-[10px] uppercase tracking-widest text-slate-400 dark:text-[#9ca3af]">
                          Email Address
                        </Text>
                        <TextInput
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3.5 font-sans text-base text-slate-900 dark:border-[#2A2A2A] dark:bg-[#2A2A2A] dark:text-[#F5F5F3]"
                          placeholder="you@example.com"
                          placeholderTextColor={placeholderColor}
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                        />
                      </View>

                      <View>
                        <Text className="mb-2 font-display-bold text-[10px] uppercase tracking-widest text-slate-400 dark:text-[#9ca3af]">
                          Password
                        </Text>
                        <TextInput
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3.5 font-sans text-base text-slate-900 dark:border-[#2A2A2A] dark:bg-[#2A2A2A] dark:text-[#F5F5F3]"
                          placeholder="Enter your password"
                          placeholderTextColor={placeholderColor}
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry
                          autoComplete="password"
                        />
                      </View>

                      {error && (
                        <View className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <Text className="text-center font-sans text-xs text-red-600">
                            {error}
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        className="mt-2 w-full items-center rounded-xl bg-brand py-4 shadow-lg shadow-brand/30"
                        onPress={handleRegularSubmit}
                        disabled={loading}
                        activeOpacity={0.8}>
                        {loading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="font-sans-bold text-sm text-white">Sign In</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text className="mb-1 text-center font-display-bold text-lg text-slate-900 dark:text-[#F5F5F3]">
                      Scorer Login
                    </Text>
                    <Text className="mb-6 text-center font-sans text-xs text-text-tertiary dark:text-[#9ca3af]">
                      Sign in with your tournament credentials
                    </Text>

                    <View className="space-y-4">
                      <View>
                        <Text className="mb-2 font-display-bold text-[10px] uppercase tracking-widest text-slate-400 dark:text-[#9ca3af]">
                          Tournament Code
                        </Text>
                        <TextInput
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-center font-sans text-lg font-bold tracking-widest text-slate-900 dark:border-[#2A2A2A] dark:bg-[#2A2A2A] dark:text-[#F5F5F3]"
                          placeholder="ABC123"
                          placeholderTextColor={placeholderColor}
                          value={tournamentCode}
                          onChangeText={(text) => setTournamentCode(text.toUpperCase().slice(0, 6))}
                          autoCapitalize="characters"
                          maxLength={6}
                        />
                        {tournamentInfo && (
                          <View className="mt-2 rounded-lg border border-status-active-border/30 bg-status-active-bg p-2">
                            <Text className="text-center font-sans text-xs text-status-active-text">
                              {tournamentInfo.name}
                            </Text>
                          </View>
                        )}
                        {tournamentCode.length === 6 && tournamentInfo === null && (
                          <View className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2">
                            <Text className="text-center font-sans text-xs text-red-600">
                              Tournament not found
                            </Text>
                          </View>
                        )}
                      </View>

                      <View>
                        <Text className="mb-2 font-display-bold text-[10px] uppercase tracking-widest text-slate-400 dark:text-[#9ca3af]">
                          Username
                        </Text>
                        <TextInput
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3.5 font-sans text-base text-slate-900 dark:border-[#2A2A2A] dark:bg-[#2A2A2A] dark:text-[#F5F5F3]"
                          placeholder="Your username"
                          placeholderTextColor={placeholderColor}
                          value={username}
                          onChangeText={(text) => setUsername(text.toLowerCase())}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>

                      <View>
                        <Text className="mb-2 font-display-bold text-[10px] uppercase tracking-widest text-slate-400 dark:text-[#9ca3af]">
                          PIN
                        </Text>
                        <TextInput
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-center font-sans text-lg font-bold tracking-widest text-slate-900 dark:border-[#2A2A2A] dark:bg-[#2A2A2A] dark:text-[#F5F5F3]"
                          placeholder="1234"
                          placeholderTextColor={placeholderColor}
                          value={pin}
                          onChangeText={(text) => setPin(text.replace(/[^0-9]/g, "").slice(0, 6))}
                          keyboardType="number-pad"
                          maxLength={6}
                          secureTextEntry
                        />
                      </View>

                      {error && (
                        <View className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <Text className="text-center font-sans text-xs text-red-600">
                            {error}
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        className="mt-2 w-full items-center rounded-xl bg-brand py-4 shadow-lg shadow-brand/30"
                        onPress={handleScorerSubmit}
                        disabled={loading}
                        activeOpacity={0.8}>
                        {loading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="font-sans-bold text-sm text-white">Start Scoring</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Footer */}
            <View className="mt-6 items-center">
              <Text className="text-center font-sans text-[10px] uppercase tracking-wide text-text-tertiary dark:text-[#9ca3af]">
                {loginType === "regular"
                  ? "Scorer access only. Contact your tournament organizer for credentials."
                  : "Get your code, username, and PIN from the tournament organizer."}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
