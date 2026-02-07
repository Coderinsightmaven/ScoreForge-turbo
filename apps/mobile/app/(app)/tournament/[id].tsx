import { useQuery } from "convex/react";
import { api } from "@repo/convex";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Id } from "@repo/convex/dataModel";

import { MatchCard } from "../../../components/matches/MatchCard";
import { StatusFilter, MatchStatus } from "../../../components/matches/StatusFilter";

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tournamentId = id as Id<"tournaments">;

  const tournament = useQuery(api.tournaments.getTournament, { tournamentId });
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "all">("all");
  const [refreshing, setRefreshing] = useState(false);

  const matches = useQuery(api.matches.listMatches, {
    tournamentId,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (tournament === undefined || matches === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-[#141414]">
        <ActivityIndicator size="large" color="#D4A017" />
      </View>
    );
  }

  if (tournament === null) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-[#141414]">
        <SafeAreaView className="flex-1" edges={["top"]}>
          <View className="flex-1 items-center justify-center px-6">
            <Text className="font-display-bold text-sm uppercase tracking-widest text-slate-300 dark:text-[#9ca3af]">
              Not Found
            </Text>
            <View className="my-4 h-px w-16 bg-slate-200 dark:bg-[#2A2A2A]" />
            <Text className="font-sans text-sm leading-5 text-text-tertiary dark:text-[#9ca3af]">
              This tournament could not be found.
            </Text>
            <TouchableOpacity className="mt-4" onPress={() => router.back()}>
              <Text className="font-sans-medium text-sm text-brand">Go back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-[#141414]">
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="border-b border-slate-100 bg-white px-5 pb-4 pt-3 dark:border-[#2A2A2A] dark:bg-[#141414]">
          <View className="mb-3 flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#2A2A2A]">
              <Text className="text-xl text-text-primary dark:text-[#F5F5F3]">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text
                className="font-display-bold text-xl tracking-tight text-slate-900 dark:text-[#F5F5F3]"
                numberOfLines={1}>
                {tournament.name}
              </Text>
              <Text className="font-sans text-xs uppercase tracking-wide text-text-tertiary dark:text-[#9ca3af]">
                {tournament.sport} • {tournament.format.replace("_", " ")}
              </Text>
            </View>
          </View>

          {/* Status Filters */}
          <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        </View>

        {/* Matches List */}
        {matches.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="font-display-bold text-sm uppercase tracking-widest text-slate-300 dark:text-[#9ca3af]">
              No Matches
            </Text>
            <View className="my-4 h-px w-16 bg-slate-200 dark:bg-[#2A2A2A]" />
            <Text className="text-center font-sans text-sm leading-5 text-text-tertiary dark:text-[#9ca3af]">
              {statusFilter === "all"
                ? "This tournament has no matches yet."
                : `No ${statusFilter} matches.`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />
            }
            renderItem={({ item }) => (
              <MatchCard match={item} onPress={() => router.push(`/(app)/match/${item._id}`)} />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
