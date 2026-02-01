import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useQuery } from 'convex/react';
import { api } from '@repo/convex';
import type { Id } from '@repo/convex/dataModel';
import { useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Radius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';

type BracketStatus = 'draft' | 'active' | 'completed';

type BracketSelectorProps = {
  tournamentId: Id<'tournaments'>;
  selectedBracketId: Id<'tournamentBrackets'> | null;
  onSelectBracket: (bracketId: Id<'tournamentBrackets'> | null) => void;
};

function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.statusDot, { backgroundColor: color }, animatedStyle]}
    />
  );
}

function StatusIndicator({ status, colors }: { status: BracketStatus; colors: ReturnType<typeof useThemeColors> }) {
  switch (status) {
    case 'active':
      return <PulsingDot color={colors.success} />;
    case 'completed':
      return <View style={[styles.statusDot, { backgroundColor: colors.accent }]} />;
    default:
      return null;
  }
}

export function BracketSelector({
  tournamentId,
  selectedBracketId,
  onSelectBracket,
}: BracketSelectorProps) {
  const colors = useThemeColors();

  const brackets = useQuery(api.tournamentBrackets.listBrackets, {
    tournamentId,
  });

  if (brackets === undefined) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
        <View style={[styles.skeleton, { backgroundColor: colors.bgTertiary }]} />
        <View style={[styles.skeleton, { backgroundColor: colors.bgTertiary }]} />
      </View>
    );
  }

  // Don't show bracket selector if only one bracket exists
  if (brackets.length <= 1) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.container, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Brackets option */}
        <Pressable
          onPress={() => onSelectBracket(null)}
          style={[
            styles.tab,
            selectedBracketId === null
              ? { backgroundColor: colors.accentGlow, borderColor: colors.accent + '50' }
              : { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: selectedBracketId === null ? colors.accent : colors.textSecondary },
            ]}
          >
            All Brackets
          </ThemedText>
          <ThemedText style={[styles.tabCount, { color: colors.textMuted }]}>
            ({brackets.length})
          </ThemedText>
        </Pressable>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Individual bracket tabs */}
        {brackets.map((bracket) => (
          <Pressable
            key={bracket._id}
            onPress={() => onSelectBracket(bracket._id)}
            style={[
              styles.tab,
              selectedBracketId === bracket._id
                ? { backgroundColor: colors.accentGlow, borderColor: colors.accent + '50' }
                : { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <StatusIndicator status={bracket.status} colors={colors} />
            <ThemedText
              style={[
                styles.tabText,
                { color: selectedBracketId === bracket._id ? colors.accent : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {bracket.name}
            </ThemedText>
            <ThemedText style={[styles.tabCount, { color: colors.textMuted }]}>
              ({bracket.participantCount})
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeleton: {
    height: 32,
    width: 80,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tabCount: {
    fontSize: 11,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: Spacing.xs,
  },
});
