import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Radius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';

export type TournamentTab = 'bracket' | 'matches' | 'standings';

type TournamentTabsProps = {
  activeTab: TournamentTab;
  onTabChange: (tab: TournamentTab) => void;
  showStandings?: boolean;
  liveMatchCount?: number;
};

type TabConfig = {
  id: TournamentTab;
  label: string;
  showBadge?: boolean;
};

function AnimatedTab({
  tab,
  isActive,
  onPress,
  colors,
  badge,
}: {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  badge?: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      style={styles.tabPressable}
    >
      <Animated.View
        style={[
          styles.tab,
          isActive
            ? { backgroundColor: colors.accent }
            : { backgroundColor: 'transparent' },
          animatedStyle,
        ]}
      >
        <ThemedText
          style={[
            styles.tabText,
            { color: isActive ? '#fff' : colors.textSecondary },
          ]}
        >
          {tab.label}
        </ThemedText>
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.success }]}>
            <ThemedText style={styles.badgeText}>{badge}</ThemedText>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function TournamentTabs({
  activeTab,
  onTabChange,
  showStandings = false,
  liveMatchCount = 0,
}: TournamentTabsProps) {
  const colors = useThemeColors();

  const tabs: TabConfig[] = [
    { id: 'bracket', label: 'Bracket' },
    { id: 'matches', label: 'Matches', showBadge: true },
  ];

  if (showStandings) {
    tabs.push({ id: 'standings', label: 'Standings' });
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(100)}
      style={[styles.container, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}
    >
      {tabs.map((tab) => (
        <AnimatedTab
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onPress={() => onTabChange(tab.id)}
          colors={colors}
          badge={tab.showBadge ? liveMatchCount : undefined}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    padding: 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  tabPressable: {
    flex: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});
