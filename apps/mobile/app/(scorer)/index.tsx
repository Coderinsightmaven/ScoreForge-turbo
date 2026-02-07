import { useQuery } from "convex/react";
import { api } from "@repo/convex";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Id } from "@repo/convex/dataModel";

import { useTempScorer } from "../../contexts/TempScorerContext";
import { StatusFilter, MatchStatus } from "../../components/matches/StatusFilter";

const matchStatusStyles: Record<MatchStatus, { bg: string; text: string; border: string }> = {
  pending: {
    bg: "bg-status-pending-bg",
    text: "text-status-pending-text",
    border: "border-status-pending-border/30",
  },
  scheduled: {
    bg: "bg-status-completed-bg",
    text: "text-status-completed-text",
    border: "border-status-completed-border/30",
  },
  live: {
    bg: "bg-status-live-bg",
    text: "text-status-live-text",
    border: "border-status-live-border/30",
  },
  completed: {
    bg: "bg-status-active-bg",
    text: "text-status-active-text",
    border: "border-status-active-border/30",
  },
  bye: {
    bg: "bg-status-pending-bg",
    text: "text-status-pending-text",
    border: "border-status-pending-border/30",
  },
};

export default function ScorerHomeScreen() {
  const { session, signOut } = useTempScorer();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "all">("all");
  const [refreshing, setRefreshing] = useState(false);

  const sessionValid = useQuery(
    api.temporaryScorers.verifySession,
    session?.token ? { token: session.token } : "skip"
  );

  useEffect(() => {
    if (session && sessionValid === null) {
      Alert.alert(
        "Session Ended",
        "Your scoring session has ended. This may be because the tournament has completed or your access was revoked.",
        [{ text: "OK", onPress: signOut }]
      );
    }
  }, [session, sessionValid, signOut]);

  const tournament = useQuery(api.tournaments.getTournament, {
    tournamentId: session?.tournamentId as Id<"tournaments">,
    tempScorerToken: session?.token,
  });

  const matches = useQuery(api.matches.listMatches, {
    tournamentId: session?.tournamentId as Id<"tournaments">,
    status: statusFilter === "all" ? undefined : statusFilter,
    tempScorerToken: session?.token,
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-[#141414]">
        <Text className="text-text-tertiary dark:text-[#9ca3af]">Session not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-[#141414]">
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="border-b border-slate-100 bg-white px-5 py-4 dark:border-[#2A2A2A] dark:bg-[#141414]">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="mb-1 flex-row items-center">
                <View className="mr-2 rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1">
                  <Text className="font-sans-bold text-[10px] uppercase tracking-wide text-brand">
                    TEMP SCORER
                  </Text>
                </View>
              </View>
              <Text className="font-display-bold text-lg text-slate-900 dark:text-[#F5F5F3]">
                {session.displayName}
              </Text>
              <Text className="font-sans text-xs uppercase tracking-wide text-text-tertiary dark:text-[#9ca3af]">
                {session.tournamentName}
              </Text>
            </View>
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-[#2A2A2A]"
              onPress={handleSignOut}>
              <Text className="text-lg text-text-secondary dark:text-[#d1d5db]">x</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Filter */}
        <View className="border-b border-slate-100 bg-white px-5 py-3 dark:border-[#2A2A2A] dark:bg-[#141414]">
          <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        </View>

        {/* Tournament Status Banner */}
        {tournament && tournament.status !== "active" && (
          <View className="border-b border-brand/20 bg-brand-light px-4 py-2">
            <Text className="text-center font-sans text-xs text-brand-text">
              Tournament is {tournament.status} - Scoring may be unavailable
            </Text>
          </View>
        )}

        {/* Matches List */}
        {matches === undefined ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#D4A017" />
          </View>
        ) : (
          <FlatList
            data={matches.filter((m) => m.status !== "bye")}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#D4A017"]}
                tintColor="#D4A017"
              />
            }
            contentContainerClassName="px-4 py-4"
            ItemSeparatorComponent={() => <View className="h-3" />}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-16">
                <Text className="font-display-bold text-sm uppercase tracking-widest text-slate-300 dark:text-[#9ca3af]">
                  No matches
                </Text>
                <View className="my-4 h-px w-16 bg-slate-200 dark:bg-[#2A2A2A]" />
                <Text className="text-center font-sans text-sm text-text-tertiary dark:text-[#9ca3af]">
                  No matches found for this filter
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isReady = item.participant1 && item.participant2 && item.status !== "completed";
              const isLive = item.status === "live";
              const isCompleted = item.status === "completed";
              const status =
                matchStatusStyles[item.status as MatchStatus] || matchStatusStyles.pending;
              return (
                <TouchableOpacity
                  className={`overflow-hidden rounded-2xl border bg-white shadow-lg shadow-slate-900/5 dark:bg-[#1E1E1E] ${
                    isLive
                      ? "border-status-live-border/40"
                      : "border-slate-100 dark:border-[#2A2A2A]"
                  }`}
                  onPress={() => router.push(`/(scorer)/match/${item._id}`)}
                  activeOpacity={0.7}>
                  {/* Top accent bar */}
                  <View
                    className={`h-1 ${
                      isLive
                        ? "bg-status-live-border"
                        : isCompleted
                          ? "bg-status-active-border"
                          : "bg-slate-100 dark:bg-[#2A2A2A]"
                    }`}
                  />

                  <View className="px-5 pb-5 pt-4">
                    {/* Row 1: Metadata + Status badge */}
                    <View className="mb-3 flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Text className="font-display-bold text-[10px] uppercase tracking-widest text-slate-400 dark:text-[#9ca3af]">
                          R{item.round}
                        </Text>
                        <View className="mx-2 h-3 w-px bg-slate-200 dark:bg-[#2A2A2A]" />
                        <Text className="font-display-bold text-[10px] uppercase tracking-widest text-slate-400 dark:text-[#9ca3af]">
                          Match {item.matchNumber}
                        </Text>
                      </View>

                      <View
                        className={`rounded-md border px-2.5 py-1 ${status.bg} ${status.border}`}>
                        <Text
                          className={`font-sans-medium text-[10px] uppercase tracking-wide ${status.text}`}>
                          {item.status === "live" ? "LIVE" : item.status}
                        </Text>
                      </View>
                    </View>

                    {/* Row 2: Participants matchup */}
                    <View className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-[#2A2A2A]">
                      {/* Player 1 */}
                      <View className="flex-row items-center">
                        <View className="flex-1">
                          <Text
                            className={`text-base ${
                              item.winnerId === item.participant1?._id
                                ? "font-display-semibold text-brand"
                                : "font-sans-medium text-slate-900 dark:text-[#F5F5F3]"
                            }`}
                            numberOfLines={1}>
                            {item.participant1?.displayName || "TBD"}
                          </Text>
                        </View>
                      </View>

                      {/* Divider */}
                      <View className="my-2.5 h-px bg-slate-200/70 dark:bg-[#1E1E1E]" />

                      {/* Player 2 */}
                      <View className="flex-row items-center">
                        <View className="flex-1">
                          <Text
                            className={`text-base ${
                              item.winnerId === item.participant2?._id
                                ? "font-display-semibold text-brand"
                                : "font-sans-medium text-slate-900 dark:text-[#F5F5F3]"
                            }`}
                            numberOfLines={1}>
                            {item.participant2?.displayName || "TBD"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Row 3: Court info + Tap to score */}
                    {(item.court || (isReady && !isLive)) && (
                      <View className="mt-3 flex-row items-center justify-between">
                        {item.court ? (
                          <Text className="font-sans text-xs text-text-tertiary dark:text-[#9ca3af]">
                            Court: {item.court}
                          </Text>
                        ) : (
                          <View />
                        )}

                        {isReady && !isLive && (
                          <View className="rounded-lg border border-brand/30 bg-brand/10 px-4 py-1.5">
                            <Text className="font-sans-medium text-xs text-brand">
                              Tap to score
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Session Expiry Warning */}
        {session.expiresAt && session.expiresAt - Date.now() < 2 * 60 * 60 * 1000 && (
          <View className="border-t border-brand/20 bg-brand-light px-4 py-2">
            <Text className="text-center font-sans text-xs text-brand-text">
              Session expires in {Math.round((session.expiresAt - Date.now()) / (60 * 60 * 1000))}{" "}
              hours
            </Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
