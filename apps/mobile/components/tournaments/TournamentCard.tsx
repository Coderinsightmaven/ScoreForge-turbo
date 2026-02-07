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

const sportEmoji: Record<string, string> = {
  tennis: "🎾",
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

  return (
    <TouchableOpacity
      className="mb-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-900/5"
      onPress={onPress}
      activeOpacity={0.7}>
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1">
          <View className="mb-1 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <Text className="text-xl">{sportEmoji[tournament.sport]}</Text>
            </View>
            <Text
              className="flex-1 font-display-semibold text-xl tracking-tight text-slate-900"
              numberOfLines={1}>
              {tournament.name}
            </Text>
          </View>
          {tournament.description && (
            <Text className="ml-13 text-sm text-text-secondary" numberOfLines={2}>
              {tournament.description}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-2">
          <View className={`rounded-lg border px-3 py-1.5 ${status.bg} ${status.border}`}>
            <Text className={`text-xs font-medium capitalize ${status.text}`}>
              {tournament.status}
            </Text>
          </View>
          {tournament.isOwner && (
            <View className="rounded-lg border border-brand/30 bg-brand-light px-3 py-1.5">
              <Text className="text-xs font-medium text-brand-text">Owner</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center space-x-3">
          <View className="flex-row items-center">
            <Text className="mr-1 text-xs text-slate-400">👥</Text>
            <Text className="text-sm text-text-secondary">{tournament.participantCount}</Text>
          </View>
          {tournament.liveMatchCount > 0 && (
            <View className="flex-row items-center rounded-lg bg-status-live-border px-2.5 py-1 shadow-lg shadow-red-500/30">
              <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white" />
              <Text className="text-xs font-medium text-white">
                {tournament.liveMatchCount} Live
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
