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
          className={`mr-2 rounded-md border px-4 py-2 ${
            value === item.value
              ? "border-brand bg-brand"
              : "border-slate-200 bg-white dark:border-[#2A2A2A] dark:bg-[#1E1E1E]"
          }`}
          onPress={() => onChange(item.value)}>
          <Text
            className={`font-sans-medium text-xs uppercase tracking-wide ${
              value === item.value ? "text-white" : "text-text-secondary dark:text-[#d1d5db]"
            }`}>
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

export type { MatchStatus };
