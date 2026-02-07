import { View, Text, TouchableOpacity } from "react-native";

type MatchStatus = "pending" | "scheduled" | "live" | "completed" | "bye";

const statusStyles: Record<MatchStatus, { bg: string; text: string; border: string }> = {
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

function getScoreDisplay(match: MatchItem) {
  if (match.sport === "tennis" && match.tennisState) {
    const sets = match.tennisState.sets || [];
    if (sets.length === 0 && !match.tennisState.isMatchComplete) {
      return `${match.tennisState.currentSetGames?.[0] || 0}-${match.tennisState.currentSetGames?.[1] || 0}`;
    }
    return sets.map((s) => `${s[0]}-${s[1]}`).join(", ");
  }
  return `${match.participant1Score}-${match.participant2Score}`;
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MatchCard({ match, onPress }: Props) {
  const status = statusStyles[match.status as MatchStatus] || statusStyles.pending;

  return (
    <TouchableOpacity
      className="mb-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-900/5"
      onPress={onPress}
      activeOpacity={0.7}
      disabled={match.status === "bye"}>
      {/* Match Header */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs font-medium text-text-tertiary">
          Round {match.round} • Match {match.matchNumber}
          {match.court ? ` • ${match.court}` : ""}
        </Text>
        <View className={`rounded-lg border px-3 py-1 ${status.bg} ${status.border}`}>
          <Text className={`text-xs font-medium capitalize ${status.text}`}>{match.status}</Text>
        </View>
      </View>

      {/* Participants */}
      <View>
        <View className="flex-row items-center justify-between py-1">
          <Text
            className={`flex-1 text-base ${
              match.winnerId === match.participant1?._id
                ? "font-bold text-slate-900"
                : "text-text-secondary"
            }`}
            numberOfLines={1}>
            {match.participant1?.displayName || "TBD"}
          </Text>
          {match.status !== "pending" && match.status !== "bye" && (
            <Text
              className={`ml-2 text-lg ${
                match.winnerId === match.participant1?._id
                  ? "font-bold text-slate-900"
                  : "text-text-secondary"
              }`}>
              {match.participant1Score}
            </Text>
          )}
        </View>
        <View className="my-1 h-px bg-slate-100" />
        <View className="flex-row items-center justify-between py-1">
          <Text
            className={`flex-1 text-base ${
              match.winnerId === match.participant2?._id
                ? "font-bold text-slate-900"
                : "text-text-secondary"
            }`}
            numberOfLines={1}>
            {match.participant2?.displayName || "TBD"}
          </Text>
          {match.status !== "pending" && match.status !== "bye" && (
            <Text
              className={`ml-2 text-lg ${
                match.winnerId === match.participant2?._id
                  ? "font-bold text-slate-900"
                  : "text-text-secondary"
              }`}>
              {match.participant2Score}
            </Text>
          )}
        </View>
      </View>

      {/* Scheduled Time */}
      {match.scheduledTime && (
        <Text className="mt-2 text-xs text-text-tertiary">{formatTime(match.scheduledTime)}</Text>
      )}

      {/* Live indicator */}
      {match.status === "live" && (
        <View className="mt-3 flex-row items-center rounded-lg bg-status-live-bg p-2">
          <View className="mr-2 h-2 w-2 rounded-full bg-status-live-border" />
          <Text className="text-sm font-medium text-status-live-text">
            {getScoreDisplay(match)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
