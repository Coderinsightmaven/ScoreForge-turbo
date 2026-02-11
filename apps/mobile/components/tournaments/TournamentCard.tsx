import { View, Text, TouchableOpacity } from "react-native";

import { formatTournamentName } from "../../utils/format";

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

type TournamentItem = {
  _id: string;
  name: string;
  description?: string;
  sport: string;
  status: string;
  isOwner: boolean;
  participantCount: number;
  liveMatchCount: number;
};

type Props = {
  tournament: TournamentItem;
  onPress: () => void;
};

export function TournamentCard({ tournament, onPress }: Props) {
  const status = statusStyles[tournament.status] || statusStyles.draft;
  const sportLabel = tournament.sport ? tournament.sport.toUpperCase() : "SPORT";
  const liveLabel = `${tournament.liveMatchCount} Live Matches`;
  const roleLabel = tournament.isOwner ? "Owner" : "Scorer";
  const roleClasses = tournament.isOwner
    ? "border-brand/30 bg-brand-light"
    : "border-border bg-bg-secondary dark:border-border-dark dark:bg-bg-secondary-dark";
  const roleTextClasses = tournament.isOwner
    ? "text-brand-text"
    : "text-text-secondary dark:text-text-secondary-dark";

  return (
    <TouchableOpacity
      className="mb-4 rounded-3xl border border-border bg-bg-card p-5 shadow-lg shadow-black/5 dark:border-border-dark dark:bg-bg-card-dark"
      onPress={onPress}
      activeOpacity={0.7}>
      <View className="gap-4">
        <View className="gap-3">
          <View className="flex-row items-start justify-between gap-3">
            <Text
              className="flex-1 font-display-semibold text-xl leading-6 tracking-tight text-text-primary dark:text-text-primary-dark"
              numberOfLines={2}>
              {formatTournamentName(tournament.name)}
            </Text>
            {tournament.liveMatchCount > 0 ? (
              <View className="rounded-full bg-live px-3 py-1.5 shadow-lg shadow-black/10">
                <Text className="text-xs font-semibold tracking-wide text-text-inverse">
                  {liveLabel}
                </Text>
              </View>
            ) : (
              <View className="rounded-full border border-border bg-bg-secondary px-3 py-1.5 dark:border-border-dark dark:bg-bg-secondary-dark">
                <Text className="text-xs font-semibold tracking-wide text-text-secondary dark:text-text-secondary-dark">
                  {sportLabel}
                </Text>
              </View>
            )}
          </View>

          {tournament.description && (
            <Text
              className="text-sm leading-5 text-text-secondary dark:text-text-secondary-dark"
              numberOfLines={3}>
              {tournament.description}
            </Text>
          )}
        </View>

        <View className="border-t border-border pt-4 dark:border-border-dark">
          <View className="flex-row items-center justify-between">
            <View className="flex-row flex-wrap items-center gap-2">
              <View className={`rounded-full border px-3 py-1.5 ${status.bg} ${status.border}`}>
                <Text className={`text-xs font-medium capitalize ${status.text}`}>
                  {tournament.status}
                </Text>
              </View>
            </View>
            <View className={`rounded-full border px-3 py-1.5 ${roleClasses}`}>
              <Text className={`text-xs font-medium uppercase tracking-wide ${roleTextClasses}`}>
                {roleLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
