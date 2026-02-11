import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { AppHeader } from "../../components/navigation/AppHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  generateBlankBracketStructure,
  updateParticipantName,
  type BlankMatch,
  type BlankParticipant,
} from "../../utils/bracketUtils";

type BracketFormat = "single_elimination" | "double_elimination";

const sizeOptions = [4, 8, 16, 32, 64];

const formatLabels: Record<BracketFormat, string> = {
  single_elimination: "Single Elimination",
  double_elimination: "Double Elimination",
};

export default function QuickBracketScreen() {
  const [size, setSize] = useState<number>(8);
  const [format, setFormat] = useState<BracketFormat>("single_elimination");
  const [matches, setMatches] = useState<BlankMatch[] | null>(null);
  const [title, setTitle] = useState("Tournament Bracket");
  const [editingParticipant, setEditingParticipant] = useState<BlankParticipant | null>(null);
  const [editValue, setEditValue] = useState("");

  const rounds = useMemo(() => {
    if (!matches) return null;

    const winners = matches.filter((match) => match.bracket === "winners");
    const losers = matches.filter((match) => match.bracket === "losers");
    const grandFinal = matches.filter((match) => match.bracket === "grand_final");

    const groupByRound = (list: BlankMatch[]) => {
      const grouped = new Map<number, BlankMatch[]>();
      list.forEach((match) => {
        const current = grouped.get(match.round) ?? [];
        grouped.set(match.round, [...current, match]);
      });
      return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);
    };

    return {
      winners: groupByRound(winners),
      losers: groupByRound(losers),
      grandFinal,
    };
  }, [matches]);

  const handleGenerate = () => {
    setMatches(generateBlankBracketStructure(size, format));
  };

  const handleSlotPress = (participant?: BlankParticipant) => {
    if (!participant) return;
    setEditingParticipant(participant);
    setEditValue(participant.isPlaceholder ? "" : participant.displayName);
  };

  const handleSaveName = () => {
    if (!editingParticipant || !matches) {
      setEditingParticipant(null);
      return;
    }

    if (editValue.trim()) {
      setMatches(updateParticipantName(matches, editingParticipant.id, editValue.trim()));
    }
    setEditingParticipant(null);
  };

  return (
    <View className="flex-1 bg-bg-page dark:bg-bg-page-dark">
      <AppHeader title="Quick Bracket" subtitle="Instant bracket builder" />
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {!matches ? (
          <View className="mt-4 rounded-3xl border border-border bg-bg-card p-6 shadow-sm shadow-black/5 dark:border-border-dark dark:bg-bg-card-dark">
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark">
              Configure bracket
            </Text>
            <Text className="mt-2 text-sm text-text-secondary dark:text-text-secondary-dark">
              Create a printable bracket without saving data.
            </Text>

            <View className="mt-5 gap-4">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark">
                  Bracket title
                </Text>
                <Input value={title} onChangeText={setTitle} className="mt-2" />
              </View>

              <View>
                <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark">
                  Bracket size
                </Text>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {sizeOptions.map((option) => {
                    const isSelected = option === size;
                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => setSize(option)}
                        className={`rounded-full border px-4 py-2 ${
                          isSelected
                            ? "border-brand/40 bg-brand/10"
                            : "border-border bg-bg-secondary dark:border-border-dark dark:bg-bg-secondary-dark"
                        }`}>
                        <Text
                          className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                            isSelected
                              ? "text-brand"
                              : "text-text-secondary dark:text-text-secondary-dark"
                          }`}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark">
                  Format
                </Text>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {(Object.keys(formatLabels) as BracketFormat[]).map((option) => {
                    const isSelected = option === format;
                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => setFormat(option)}
                        className={`rounded-full border px-4 py-2 ${
                          isSelected
                            ? "border-brand/40 bg-brand/10"
                            : "border-border bg-bg-secondary dark:border-border-dark dark:bg-bg-secondary-dark"
                        }`}>
                        <Text
                          className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                            isSelected
                              ? "text-brand"
                              : "text-text-secondary dark:text-text-secondary-dark"
                          }`}>
                          {formatLabels[option]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Button variant="brand" size="lg" onPress={handleGenerate}>
                Generate bracket
              </Button>
            </View>
          </View>
        ) : (
          <View className="mt-4 gap-4">
            <View className="rounded-3xl border border-border bg-bg-card p-6 shadow-sm shadow-black/5 dark:border-border-dark dark:bg-bg-card-dark">
              <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark">
                Bracket title
              </Text>
              <Input value={title} onChangeText={setTitle} className="mt-2" />
              <View className="mt-4 flex-row gap-3">
                <Button variant="outline" onPress={() => setMatches(null)}>
                  Start Over
                </Button>
              </View>
            </View>

            <View className="gap-4">
              {rounds?.winners.map(([round, roundMatches]) => (
                <RoundSection
                  key={`winners-${round}`}
                  title={`Winners Round ${round}`}
                  matches={roundMatches}
                  onSlotPress={handleSlotPress}
                />
              ))}
              {format === "double_elimination" &&
                rounds?.losers.map(([round, roundMatches]) => (
                  <RoundSection
                    key={`losers-${round}`}
                    title={`Losers Round ${round}`}
                    matches={roundMatches}
                    onSlotPress={handleSlotPress}
                  />
                ))}
              {rounds?.grandFinal.length ? (
                <RoundSection
                  title="Grand Final"
                  matches={rounds.grandFinal}
                  onSlotPress={handleSlotPress}
                />
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal transparent visible={Boolean(editingParticipant)} animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-6"
          onPress={() => setEditingParticipant(null)}>
          <Pressable
            className="w-full rounded-3xl border border-border bg-bg-card p-6 shadow-lg shadow-black/20 dark:border-border-dark dark:bg-bg-card-dark"
            onPress={() => null}>
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark">
              Edit participant
            </Text>
            <Input
              value={editValue}
              onChangeText={setEditValue}
              placeholder="Enter participant name"
              className="mt-3"
            />
            <View className="mt-4 flex-row justify-end gap-2">
              <Button variant="outline" onPress={() => setEditingParticipant(null)}>
                Cancel
              </Button>
              <Button variant="brand" onPress={handleSaveName}>
                Save
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function RoundSection({
  title,
  matches,
  onSlotPress,
}: {
  title: string;
  matches: BlankMatch[];
  onSlotPress: (participant?: BlankParticipant) => void;
}) {
  return (
    <View className="rounded-3xl border border-border bg-bg-card p-5 shadow-sm shadow-black/5 dark:border-border-dark dark:bg-bg-card-dark">
      <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark">
        {title}
      </Text>
      <View className="mt-4 gap-3">
        {matches.map((match) => (
          <View
            key={match.id}
            className="rounded-2xl border border-border/70 dark:border-border-dark">
            <ParticipantSlot participant={match.participant1} onPress={onSlotPress} />
            <View className="h-px bg-border/60 dark:bg-border-dark/60" />
            <ParticipantSlot participant={match.participant2} onPress={onSlotPress} />
          </View>
        ))}
      </View>
    </View>
  );
}

function ParticipantSlot({
  participant,
  onPress,
}: {
  participant?: BlankParticipant;
  onPress: (participant?: BlankParticipant) => void;
}) {
  const label = participant?.isPlaceholder ? "TBD" : participant?.displayName;
  const seed = participant?.seed ?? "-";

  return (
    <TouchableOpacity
      onPress={() => onPress(participant)}
      disabled={!participant}
      className="flex-row items-center gap-3 px-4 py-3">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-bg-secondary dark:bg-bg-secondary-dark">
        <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
          {seed}
        </Text>
      </View>
      <Text
        className={`flex-1 text-sm font-semibold ${
          participant?.isPlaceholder
            ? "text-text-muted dark:text-text-muted-dark"
            : "text-text-primary dark:text-text-primary-dark"
        }`}
        numberOfLines={1}>
        {label || "TBD"}
      </Text>
      {participant ? (
        <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Edit</Text>
      ) : null}
    </TouchableOpacity>
  );
}
