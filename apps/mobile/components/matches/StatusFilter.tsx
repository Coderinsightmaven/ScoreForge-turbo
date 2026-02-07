import { Text, TouchableOpacity, FlatList } from "react-native";

type MatchStatus = "pending" | "scheduled" | "live" | "completed" | "bye";

const statusFilters: { label: string; value: MatchStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Live", value: "live" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
];

type Props = {
  value: MatchStatus | "all";
  onChange: (value: MatchStatus | "all") => void;
};

export function StatusFilter({ value, onChange }: Props) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={statusFilters}
      keyExtractor={(item) => item.value}
      renderItem={({ item }) => (
        <TouchableOpacity
          className={`mr-2 rounded-lg border-2 px-5 py-2.5 ${
            value === item.value
              ? "border-brand bg-brand shadow-lg shadow-brand/20"
              : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
          }`}
          onPress={() => onChange(item.value)}>
          <Text
            className={`text-sm font-medium ${
              value === item.value ? "text-white" : "text-text-secondary dark:text-slate-300"
            }`}>
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

export type { MatchStatus };
