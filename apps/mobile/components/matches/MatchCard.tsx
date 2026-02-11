import { View, Text, TouchableOpacity } from "react-native";

import { statusStyles } from "../../utils/styles";
import { formatTimeShort, getScoreDisplayCompact } from "../../utils/format";

type MatchStatus = "pending" | "scheduled" | "live" | "completed" | "bye";

type MatchItem = {
  _id: string;
  round: number;
  matchNumber: number;
  court?: string;
  status: string;
  participant1?: { _id: string; displayName: string } | null;
  participant2?: { _id: string; displayName: string } | null;
  participant1Score: number;
  participant2Score: number;
  winnerId?: string | null;
  scheduledTime?: number;
  sport: string;
  tennisState?: {
    sets?: number[][];
    currentSetGames?: number[];
    isMatchComplete?: boolean;
  } | null;
};

type Props = {
  match: MatchItem;
  onPress: () => void;
};

export function MatchCard({ match, onPress }: Props) {
  const status = statusStyles[match.status as MatchStatus] || statusStyles.pending;

  return (
    <TouchableOpacity
      className="relative mb-3 overflow-hidden rounded-2xl border border-border bg-bg-card p-5 shadow-lg shadow-black/10 dark:border-border-dark dark:bg-bg-card-dark"
      onPress={onPress}
      activeOpacity={0.7}
      disabled={match.status === "bye"}>
      <View className="absolute left-5 right-5 top-3 h-px bg-brand/30" />
      {/* Match Header */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs font-medium text-text-tertiary dark:text-text-tertiary-dark">
          Round {match.round} • Match {match.matchNumber}
          {match.court ? ` • ${match.court}` : ""}
        </Text>
        <View className={`rounded-full border px-3 py-1 ${status.bg} ${status.border}`}>
          <Text className={`text-[10px] font-semibold uppercase ${status.text}`}>
            {match.status}
          </Text>
        </View>
      </View>

      {/* Participants */}
      <View>
        <View className="flex-row items-center justify-between py-1">
          <Text
            className={`flex-1 text-base ${
              match.winnerId === match.participant1?._id
                ? "font-bold text-text-primary dark:text-text-primary-dark"
                : "text-text-secondary dark:text-text-secondary-dark"
            }`}
            numberOfLines={1}>
            {match.participant1?.displayName || "TBD"}
          </Text>
          {match.status !== "pending" && match.status !== "bye" && (
            <Text
              className={`ml-2 text-lg ${
                match.winnerId === match.participant1?._id
                  ? "font-bold text-text-primary dark:text-text-primary-dark"
                  : "text-text-secondary dark:text-text-secondary-dark"
              }`}>
              {match.participant1Score}
            </Text>
          )}
        </View>
        <View className="my-1 h-px bg-border/60 dark:bg-border-dark/60" />
        <View className="flex-row items-center justify-between py-1">
          <Text
            className={`flex-1 text-base ${
              match.winnerId === match.participant2?._id
                ? "font-bold text-text-primary dark:text-text-primary-dark"
                : "text-text-secondary dark:text-text-secondary-dark"
            }`}
            numberOfLines={1}>
            {match.participant2?.displayName || "TBD"}
          </Text>
          {match.status !== "pending" && match.status !== "bye" && (
            <Text
              className={`ml-2 text-lg ${
                match.winnerId === match.participant2?._id
                  ? "font-bold text-text-primary dark:text-text-primary-dark"
                  : "text-text-secondary dark:text-text-secondary-dark"
              }`}>
              {match.participant2Score}
            </Text>
          )}
        </View>
      </View>

      {/* Scheduled Time */}
      {match.scheduledTime && (
        <Text className="mt-2 text-xs text-text-tertiary dark:text-text-tertiary-dark">
          {formatTimeShort(match.scheduledTime)}
        </Text>
      )}

      {/* Live indicator */}
      {match.status === "live" && (
        <View className="mt-3 flex-row items-center rounded-lg bg-status-live-bg p-2">
          <View className="mr-2 h-2 w-2 rounded-full bg-status-live-border" />
          <Text className="text-sm font-medium text-status-live-text">
            {getScoreDisplayCompact(match)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
