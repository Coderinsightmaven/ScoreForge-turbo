import { View, Text, TouchableOpacity } from "react-native";

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

  return (
    <TouchableOpacity
      className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900"
      onPress={onPress}
      activeOpacity={0.7}>
      <View className="gap-4">
        <View className="gap-3">
          <View className="flex-row items-start justify-between gap-3">
            <Text
              className="flex-1 font-display-semibold text-xl leading-6 tracking-tight text-slate-900 dark:text-slate-100"
              numberOfLines={2}>
              {tournament.name}
            </Text>
            <View className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-950">
              <Text className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                {sportLabel}
              </Text>
            </View>
          </View>

          {tournament.description && (
            <Text
              className="text-sm leading-5 text-text-secondary dark:text-slate-300"
              numberOfLines={3}>
              {tournament.description}
            </Text>
          )}
        </View>

        <View className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className={`rounded-full border px-3 py-1.5 ${status.bg} ${status.border}`}>
              <Text className={`text-xs font-medium capitalize ${status.text}`}>
                {tournament.status}
              </Text>
            </View>
            {tournament.isOwner && (
              <View className="rounded-full border border-brand/30 bg-brand-light px-3 py-1.5">
                <Text className="text-xs font-medium text-brand-text">Owner</Text>
              </View>
            )}
            {tournament.liveMatchCount > 0 && (
              <View className="rounded-full bg-status-live-border px-3 py-1.5 shadow-lg shadow-red-500/30">
                <Text className="text-xs font-medium text-white">
                  {tournament.liveMatchCount} Live
                </Text>
              </View>
            )}
          </View>

          <View className="mt-3 flex-row items-end justify-between">
            <Text className="text-xs uppercase tracking-wide text-text-tertiary dark:text-slate-400">
              Participants
            </Text>
            <Text className="font-display-semibold text-base text-slate-900 dark:text-slate-100">
              {tournament.participantCount}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
