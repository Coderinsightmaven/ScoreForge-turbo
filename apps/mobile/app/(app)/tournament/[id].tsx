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
import { Id } from "@repo/convex/dataModel";

import { MatchCard } from "../../../components/matches/MatchCard";
import { StatusFilter, MatchStatus } from "../../../components/matches/StatusFilter";
import { AppHeader } from "../../../components/navigation/AppHeader";
import { formatTournamentName } from "../../../utils/format";

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

  // Convex provides real-time updates; brief visual confirmation only
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 300);
  };

  if (tournament === undefined || matches === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-page dark:bg-bg-page-dark">
        <ActivityIndicator size="large" color="#70AC15" />
      </View>
    );
  }

  if (tournament === null) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-page px-6 dark:bg-bg-page-dark">
        <Text className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
          Tournament not found
        </Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-brand">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
    draft: {
      bg: "bg-status-pending-bg",
      text: "text-status-pending-text",
      border: "border-status-pending-border/30",
    },
    active: {
      bg: "bg-status-active-bg",
      text: "text-status-active-text",
      border: "border-status-active-border/30",
    },
    completed: {
      bg: "bg-status-completed-bg",
      text: "text-status-completed-text",
      border: "border-status-completed-border/30",
    },
    cancelled: {
      bg: "bg-status-live-bg",
      text: "text-status-live-text",
      border: "border-status-live-border/30",
    },
  };

  const status = statusStyles[tournament.status] || statusStyles.draft;
  const formatLabel = tournament.format.replace(/_/g, " ");

  return (
    <View className="flex-1 bg-bg-page dark:bg-bg-page-dark">
      <AppHeader title="Tournament" subtitle="Match center" showBack />

      <View className="px-4 pt-4">
        <View className="rounded-3xl border border-border bg-bg-card p-6 shadow-sm shadow-black/5 dark:border-border-dark dark:bg-bg-card-dark">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className={`rounded-full border px-3 py-1 ${status.bg} ${status.border}`}>
              <Text
                className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${status.text}`}>
                {tournament.status}
              </Text>
            </View>
            <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted dark:text-text-muted-dark">
              {formatLabel}
            </Text>
          </View>
          <Text className="mt-3 font-display-bold text-2xl text-text-primary dark:text-text-primary-dark">
            {formatTournamentName(tournament.name)}
          </Text>
          {tournament.description ? (
            <Text className="mt-2 text-sm text-text-secondary dark:text-text-secondary-dark">
              {tournament.description}
            </Text>
          ) : null}
          <View className="mt-4">
            <Text className="text-xs uppercase tracking-[0.16em] text-text-muted dark:text-text-muted-dark">
              Participants
            </Text>
            <Text className="mt-1 font-display-semibold text-lg text-text-primary dark:text-text-primary-dark">
              {tournament.participantCount}
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4 pt-4">
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
      </View>

      {matches.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
            No matches found
          </Text>
          <Text className="mt-1 text-center text-text-secondary dark:text-text-secondary-dark">
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#70AC15" />
          }
          renderItem={({ item }) => (
            <MatchCard match={item} onPress={() => router.push(`/(app)/match/${item._id}`)} />
          )}
        />
      )}
    </View>
  );
}
