import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Shadows, Spacing, Radius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';

// Tennis point display helper
function getTennisPointDisplay(
  points: number[],
  playerIndex: 0 | 1,
  isAdScoring: boolean,
  isTiebreak: boolean
): string {
  if (isTiebreak) return (points[playerIndex] ?? 0).toString();

  const p1 = points[0] ?? 0;
  const p2 = points[1] ?? 0;

  // Deuce handling
  if (p1 >= 3 && p2 >= 3) {
    if (isAdScoring) {
      if (p1 === p2) return '40';
      const leading = p1 > p2 ? 0 : 1;
      if (playerIndex === leading) return 'Ad';
      return '40';
    } else {
      return '40';
    }
  }

  // Normal points
  const pointLabels = ['0', '15', '30', '40'];
  const myPoints = playerIndex === 0 ? p1 : p2;
  return pointLabels[Math.min(myPoints, 3)] ?? '40';
}

type Participant = {
  _id: string;
  displayName: string;
  seed?: number;
};

type TennisState = {
  sets: number[][];
  currentSetGames: number[];
  currentGamePoints: number[];
  servingParticipant: 1 | 2;
  isAdScoring: boolean;
  isTiebreak: boolean;
};

type VolleyballState = {
  sets: number[][];
  currentSetPoints: number[];
  servingTeam: 1 | 2;
};

export type MatchData = {
  _id: string;
  round: number;
  matchNumber: number;
  bracket?: string;
  court?: string;
  status: 'pending' | 'scheduled' | 'live' | 'completed' | 'bye';
  sport: string;
  participant1?: Participant | null;
  participant2?: Participant | null;
  participant1Score: number;
  participant2Score: number;
  winnerId?: string;
  tennisState?: TennisState;
  volleyballState?: VolleyballState;
  tournamentName?: string;
};

type MatchCardProps = {
  match: MatchData;
  onPress: () => void;
  showTournamentName?: boolean;
};

function AnimatedPressable({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={onPress}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

// Live match card with full scoreboard
export function LiveMatchCard({ match, onPress, showTournamentName }: MatchCardProps) {
  const colors = useThemeColors();

  const hasTennis = match.sport === 'tennis' && match.tennisState;
  const hasVolleyball = match.sport === 'volleyball' && match.volleyballState;
  const isServing1 = hasTennis
    ? match.tennisState?.servingParticipant === 1
    : hasVolleyball
      ? match.volleyballState?.servingTeam === 1
      : false;
  const isServing2 = hasTennis
    ? match.tennisState?.servingParticipant === 2
    : hasVolleyball
      ? match.volleyballState?.servingTeam === 2
      : false;

  const headerText = showTournamentName
    ? match.tournamentName
    : `${match.bracket ? `${match.bracket} ` : ''}Round ${match.round} • Match ${match.matchNumber}${match.court ? ` @ ${match.court}` : ''}`;

  return (
    <AnimatedPressable
      style={[styles.liveMatchCard, { backgroundColor: colors.bgCard, borderColor: colors.success + '50' }]}
      onPress={onPress}
    >
      {/* Header */}
      <View style={[styles.matchCardHeader, { backgroundColor: colors.bgTertiary, borderBottomColor: colors.border }]}>
        <ThemedText style={[styles.matchCardHeaderText, { color: colors.textMuted }]} numberOfLines={1}>
          {headerText}
        </ThemedText>
        <View style={styles.liveBadge}>
          <View style={[styles.liveDotSmall, { backgroundColor: colors.success }]} />
        </View>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        {/* Player 1 Row */}
        <View style={[styles.scoreboardRow, { borderBottomColor: colors.border + '50' }]}>
          <View style={styles.playerInfo}>
            {isServing1 && <View style={[styles.servingDot, { backgroundColor: colors.success }]} />}
            <ThemedText style={[styles.playerName, { color: colors.textPrimary }]} numberOfLines={1}>
              {match.participant1?.displayName || 'TBD'}
            </ThemedText>
          </View>
          <View style={styles.scoreSection}>
            {hasTennis && match.tennisState ? (
              <>
                {match.tennisState.sets.map((set, i) => (
                  <View key={i} style={[styles.setScore, { backgroundColor: colors.bgTertiary }]}>
                    <ThemedText style={[styles.setScoreText, { color: colors.textSecondary }]}>
                      {set[0] ?? 0}
                    </ThemedText>
                  </View>
                ))}
                <View style={[styles.setScore, styles.currentSet, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '40' }]}>
                  <ThemedText style={[styles.currentSetText, { color: colors.accent }]}>
                    {match.tennisState.currentSetGames[0] ?? 0}
                  </ThemedText>
                </View>
                <View style={[styles.gameScore, { backgroundColor: colors.success + '15' }]}>
                  <ThemedText style={[styles.gameScoreText, { color: colors.success }]}>
                    {getTennisPointDisplay(
                      match.tennisState.currentGamePoints,
                      0,
                      match.tennisState.isAdScoring,
                      match.tennisState.isTiebreak
                    )}
                  </ThemedText>
                </View>
              </>
            ) : hasVolleyball && match.volleyballState ? (
              <>
                {match.volleyballState.sets.map((set, i) => (
                  <View key={i} style={[styles.setScore, { backgroundColor: colors.bgTertiary }]}>
                    <ThemedText style={[styles.setScoreText, { color: colors.textSecondary }]}>
                      {set[0] ?? 0}
                    </ThemedText>
                  </View>
                ))}
                <View style={[styles.setScore, styles.currentSet, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '40' }]}>
                  <ThemedText style={[styles.currentSetText, { color: colors.accent }]}>
                    {match.volleyballState.currentSetPoints[0] ?? 0}
                  </ThemedText>
                </View>
              </>
            ) : (
              <View style={[styles.simpleScore, { backgroundColor: colors.accent + '20' }]}>
                <ThemedText style={[styles.simpleScoreText, { color: colors.accent }]}>
                  {match.participant1Score}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Player 2 Row */}
        <View style={[styles.scoreboardRow, styles.scoreboardRowBottom]}>
          <View style={styles.playerInfo}>
            {isServing2 && <View style={[styles.servingDot, { backgroundColor: colors.success }]} />}
            <ThemedText style={[styles.playerName, { color: colors.textPrimary }]} numberOfLines={1}>
              {match.participant2?.displayName || 'TBD'}
            </ThemedText>
          </View>
          <View style={styles.scoreSection}>
            {hasTennis && match.tennisState ? (
              <>
                {match.tennisState.sets.map((set, i) => (
                  <View key={i} style={[styles.setScore, { backgroundColor: colors.bgTertiary }]}>
                    <ThemedText style={[styles.setScoreText, { color: colors.textSecondary }]}>
                      {set[1] ?? 0}
                    </ThemedText>
                  </View>
                ))}
                <View style={[styles.setScore, styles.currentSet, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '40' }]}>
                  <ThemedText style={[styles.currentSetText, { color: colors.accent }]}>
                    {match.tennisState.currentSetGames[1] ?? 0}
                  </ThemedText>
                </View>
                <View style={[styles.gameScore, { backgroundColor: colors.success + '15' }]}>
                  <ThemedText style={[styles.gameScoreText, { color: colors.success }]}>
                    {getTennisPointDisplay(
                      match.tennisState.currentGamePoints,
                      1,
                      match.tennisState.isAdScoring,
                      match.tennisState.isTiebreak
                    )}
                  </ThemedText>
                </View>
              </>
            ) : hasVolleyball && match.volleyballState ? (
              <>
                {match.volleyballState.sets.map((set, i) => (
                  <View key={i} style={[styles.setScore, { backgroundColor: colors.bgTertiary }]}>
                    <ThemedText style={[styles.setScoreText, { color: colors.textSecondary }]}>
                      {set[1] ?? 0}
                    </ThemedText>
                  </View>
                ))}
                <View style={[styles.setScore, styles.currentSet, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '40' }]}>
                  <ThemedText style={[styles.currentSetText, { color: colors.accent }]}>
                    {match.volleyballState.currentSetPoints[1] ?? 0}
                  </ThemedText>
                </View>
              </>
            ) : (
              <View style={[styles.simpleScore, { backgroundColor: colors.accent + '20' }]}>
                <ThemedText style={[styles.simpleScoreText, { color: colors.accent }]}>
                  {match.participant2Score}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

// Pending/Scheduled match card
export function PendingMatchCard({ match, onPress }: MatchCardProps) {
  const colors = useThemeColors();

  return (
    <AnimatedPressable
      style={[styles.matchCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.matchHeader}>
        <ThemedText type="muted" style={styles.matchRound}>
          {match.bracket ? `${match.bracket} ` : ''}Round {match.round} • Match {match.matchNumber}
          {match.court ? ` @ ${match.court}` : ''}
        </ThemedText>
        <View style={[styles.matchStatusPill, { backgroundColor: colors.bgTertiary }]}>
          <ThemedText style={[styles.matchStatusPillText, { color: colors.textMuted }]}>
            {match.status.toUpperCase()}
          </ThemedText>
        </View>
      </View>
      <View style={styles.matchParticipants}>
        <View style={styles.matchParticipant}>
          <ThemedText style={styles.matchParticipantName} numberOfLines={1}>
            {match.participant1?.displayName || 'TBD'}
          </ThemedText>
        </View>
        <ThemedText type="muted" style={styles.matchVs}>
          vs
        </ThemedText>
        <View style={styles.matchParticipant}>
          <ThemedText style={styles.matchParticipantName} numberOfLines={1}>
            {match.participant2?.displayName || 'TBD'}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

// Completed match card
export function CompletedMatchCard({ match, onPress }: MatchCardProps) {
  const colors = useThemeColors();

  const hasTennis = match.sport === 'tennis' && match.tennisState;
  const hasVolleyball = match.sport === 'volleyball' && match.volleyballState;

  return (
    <AnimatedPressable
      style={[styles.matchCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.matchHeader}>
        <ThemedText type="muted" style={styles.matchRound}>
          {match.bracket ? `${match.bracket} ` : ''}Round {match.round} • Match {match.matchNumber}
          {match.court ? ` @ ${match.court}` : ''}
        </ThemedText>
        <View style={[styles.matchStatusPillCompleted, { backgroundColor: colors.accentGlow }]}>
          <ThemedText style={[styles.matchStatusPillTextCompleted, { color: colors.accent }]}>
            COMPLETED
          </ThemedText>
        </View>
      </View>
      <View style={styles.completedMatchContent}>
        <View style={styles.completedMatchRow}>
          <ThemedText
            style={[
              styles.completedMatchName,
              match.winnerId === match.participant1?._id && { color: colors.accent },
            ]}
            numberOfLines={1}
          >
            {match.participant1?.displayName || 'TBD'}
          </ThemedText>
          <View style={styles.completedMatchScores}>
            {hasTennis && match.tennisState ? (
              match.tennisState.sets.map((set, i) => (
                <View key={i} style={[styles.completedSetScore, { backgroundColor: colors.bgTertiary }]}>
                  <ThemedText
                    style={[
                      styles.completedSetScoreText,
                      (set[0] ?? 0) > (set[1] ?? 0) && { color: colors.accent },
                    ]}
                  >
                    {set[0] ?? 0}
                  </ThemedText>
                </View>
              ))
            ) : hasVolleyball && match.volleyballState ? (
              match.volleyballState.sets.map((set, i) => (
                <View key={i} style={[styles.completedSetScore, { backgroundColor: colors.bgTertiary }]}>
                  <ThemedText
                    style={[
                      styles.completedSetScoreText,
                      (set[0] ?? 0) > (set[1] ?? 0) && { color: colors.accent },
                    ]}
                  >
                    {set[0] ?? 0}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText
                style={[
                  styles.matchParticipantScore,
                  match.winnerId === match.participant1?._id && { color: colors.accent },
                ]}
              >
                {match.participant1Score}
              </ThemedText>
            )}
          </View>
        </View>
        <View style={styles.completedMatchRow}>
          <ThemedText
            style={[
              styles.completedMatchName,
              match.winnerId === match.participant2?._id && { color: colors.accent },
            ]}
            numberOfLines={1}
          >
            {match.participant2?.displayName || 'TBD'}
          </ThemedText>
          <View style={styles.completedMatchScores}>
            {hasTennis && match.tennisState ? (
              match.tennisState.sets.map((set, i) => (
                <View key={i} style={[styles.completedSetScore, { backgroundColor: colors.bgTertiary }]}>
                  <ThemedText
                    style={[
                      styles.completedSetScoreText,
                      (set[1] ?? 0) > (set[0] ?? 0) && { color: colors.accent },
                    ]}
                  >
                    {set[1] ?? 0}
                  </ThemedText>
                </View>
              ))
            ) : hasVolleyball && match.volleyballState ? (
              match.volleyballState.sets.map((set, i) => (
                <View key={i} style={[styles.completedSetScore, { backgroundColor: colors.bgTertiary }]}>
                  <ThemedText
                    style={[
                      styles.completedSetScoreText,
                      (set[1] ?? 0) > (set[0] ?? 0) && { color: colors.accent },
                    ]}
                  >
                    {set[1] ?? 0}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText
                style={[
                  styles.matchParticipantScore,
                  match.winnerId === match.participant2?._id && { color: colors.accent },
                ]}
              >
                {match.participant2Score}
              </ThemedText>
            )}
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  // Live match card styles
  liveMatchCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  matchCardHeaderText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scoreboard: {
    paddingHorizontal: Spacing.sm,
  },
  scoreboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  scoreboardRowBottom: {
    borderBottomWidth: 0,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  servingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  setScore: {
    width: 24,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  setScoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentSet: {
    borderWidth: 1,
  },
  currentSetText: {
    fontSize: 14,
    fontWeight: '700',
  },
  gameScore: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginLeft: 4,
  },
  gameScoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  simpleScore: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  simpleScoreText: {
    fontSize: 16,
    fontWeight: '800',
  },

  // Regular match card styles
  matchCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  matchRound: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  matchStatusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  matchStatusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  matchStatusPillCompleted: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  matchStatusPillTextCompleted: {
    fontSize: 10,
    fontWeight: '700',
  },
  matchParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  matchParticipant: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchParticipantName: {
    flex: 1,
    fontSize: 14,
  },
  matchParticipantScore: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  matchVs: {
    fontSize: 12,
  },

  // Completed match styles
  completedMatchContent: {
    gap: Spacing.xs,
  },
  completedMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedMatchName: {
    flex: 1,
    fontSize: 14,
  },
  completedMatchScores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedSetScore: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  completedSetScoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
