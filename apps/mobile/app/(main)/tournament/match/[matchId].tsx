import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View, Alert } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@repo/convex';
import type { Id } from '@repo/convex/dataModel';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows, Spacing, Radius } from '@/constants/theme';

function AnimatedPressable({
  children,
  style,
  onPress,
  disabled,
}: {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}>
      <Animated.View style={[style, animatedStyle, disabled && { opacity: 0.6 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.textMuted,
  scheduled: Colors.info,
  live: Colors.success,
  completed: Colors.accent,
  bye: Colors.textMuted,
};

export default function MatchScoreScreen() {
  const insets = useSafeAreaInsets();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const id = matchId as Id<'matches'>;

  const match = useQuery(api.matches.getMatch, { matchId: id });

  const [score1, setScore1] = useState<number | null>(null);
  const [score2, setScore2] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateScore = useMutation(api.matches.updateScore);
  const startMatch = useMutation(api.matches.startMatch);
  const completeMatch = useMutation(api.matches.completeMatch);

  // Initialize scores from match data
  if (match && score1 === null && score2 === null) {
    setScore1(match.participant1Score);
    setScore2(match.participant2Score);
  }

  const currentScore1 = score1 ?? match?.participant1Score ?? 0;
  const currentScore2 = score2 ?? match?.participant2Score ?? 0;

  const canEdit = match?.status === 'live' || match?.status === 'scheduled' || match?.status === 'pending';
  const canStart = match?.status === 'pending' || match?.status === 'scheduled';
  const canComplete = match?.status === 'live';

  const handleScoreChange = async (participant: 1 | 2, delta: number) => {
    if (!match || !canEdit) return;

    const newScore1 = participant === 1 ? Math.max(0, currentScore1 + delta) : currentScore1;
    const newScore2 = participant === 2 ? Math.max(0, currentScore2 + delta) : currentScore2;

    if (participant === 1) setScore1(newScore1);
    else setScore2(newScore2);

    try {
      await updateScore({
        matchId: id,
        participant1Score: newScore1,
        participant2Score: newScore2,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update score');
      // Revert
      if (participant === 1) setScore1(currentScore1);
      else setScore2(currentScore2);
    }
  };

  const handleStartMatch = async () => {
    if (!match) return;

    setIsUpdating(true);
    try {
      await startMatch({ matchId: id });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start match');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteMatch = () => {
    if (!match) return;

    if (currentScore1 === currentScore2) {
      Alert.alert(
        'Tied Score',
        'The match is tied. Please update the score to determine a winner.',
        [{ text: 'OK' }]
      );
      return;
    }

    const winner =
      currentScore1 > currentScore2
        ? match.participant1?.displayName
        : match.participant2?.displayName;

    Alert.alert(
      'Complete Match',
      `Are you sure you want to complete this match? ${winner} will be declared the winner.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await completeMatch({ matchId: id });
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete match');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (!match) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top + Spacing.xl }]}>
          <ThemedText type="muted">Loading match...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + Spacing.md }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText type="muted" style={styles.matchInfo}>
              {match.bracket ? `${match.bracket} ` : ''}Round {match.round}
            </ThemedText>
            <ThemedText type="subtitle">Match {match.matchNumber}</ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Status */}
        <Animated.View entering={FadeInDown.duration(600).delay(150)} style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[match.status] + '20' },
            ]}>
            <View
              style={[styles.statusDot, { backgroundColor: STATUS_COLORS[match.status] }]}
            />
            <ThemedText
              style={[styles.statusText, { color: STATUS_COLORS[match.status] }]}>
              {match.status === 'live' ? 'LIVE' : match.status.toUpperCase()}
            </ThemedText>
          </View>
        </Animated.View>

        {/* Score Display */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.scoreCard}>
          {/* Participant 1 */}
          <View style={styles.participantSection}>
            <View style={styles.participantInfo}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>
                  {match.participant1?.displayName?.charAt(0).toUpperCase() || '?'}
                </ThemedText>
              </View>
              <View style={styles.participantDetails}>
                <ThemedText style={styles.participantName} numberOfLines={1}>
                  {match.participant1?.displayName || 'TBD'}
                </ThemedText>
                {match.participant1 && (
                  <ThemedText type="muted" style={styles.participantRecord}>
                    {match.participant1.wins}W - {match.participant1.losses}L
                  </ThemedText>
                )}
              </View>
            </View>
            <View style={styles.scoreSection}>
              {canEdit && (
                <AnimatedPressable
                  style={styles.scoreButton}
                  onPress={() => handleScoreChange(1, -1)}
                  disabled={currentScore1 <= 0}>
                  <IconSymbol name="minus" size={20} color={Colors.textPrimary} />
                </AnimatedPressable>
              )}
              <View style={styles.scoreDisplay}>
                <ThemedText style={styles.scoreText}>{currentScore1}</ThemedText>
              </View>
              {canEdit && (
                <AnimatedPressable
                  style={styles.scoreButton}
                  onPress={() => handleScoreChange(1, 1)}>
                  <IconSymbol name="plus" size={20} color={Colors.textPrimary} />
                </AnimatedPressable>
              )}
            </View>
          </View>

          {/* VS Divider */}
          <View style={styles.vsDivider}>
            <View style={styles.vsLine} />
            <View style={styles.vsCircle}>
              <ThemedText style={styles.vsText}>VS</ThemedText>
            </View>
            <View style={styles.vsLine} />
          </View>

          {/* Participant 2 */}
          <View style={styles.participantSection}>
            <View style={styles.participantInfo}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>
                  {match.participant2?.displayName?.charAt(0).toUpperCase() || '?'}
                </ThemedText>
              </View>
              <View style={styles.participantDetails}>
                <ThemedText style={styles.participantName} numberOfLines={1}>
                  {match.participant2?.displayName || 'TBD'}
                </ThemedText>
                {match.participant2 && (
                  <ThemedText type="muted" style={styles.participantRecord}>
                    {match.participant2.wins}W - {match.participant2.losses}L
                  </ThemedText>
                )}
              </View>
            </View>
            <View style={styles.scoreSection}>
              {canEdit && (
                <AnimatedPressable
                  style={styles.scoreButton}
                  onPress={() => handleScoreChange(2, -1)}
                  disabled={currentScore2 <= 0}>
                  <IconSymbol name="minus" size={20} color={Colors.textPrimary} />
                </AnimatedPressable>
              )}
              <View style={styles.scoreDisplay}>
                <ThemedText style={styles.scoreText}>{currentScore2}</ThemedText>
              </View>
              {canEdit && (
                <AnimatedPressable
                  style={styles.scoreButton}
                  onPress={() => handleScoreChange(2, 1)}>
                  <IconSymbol name="plus" size={20} color={Colors.textPrimary} />
                </AnimatedPressable>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Winner Banner (if completed) */}
        {match.status === 'completed' && match.winnerId && (
          <Animated.View entering={FadeInDown.duration(600).delay(250)} style={styles.winnerBanner}>
            <IconSymbol name="trophy.fill" size={24} color={Colors.accent} />
            <ThemedText style={styles.winnerText}>
              {match.winnerId === match.participant1?._id
                ? match.participant1?.displayName
                : match.participant2?.displayName}{' '}
              wins!
            </ThemedText>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.actions}>
          {canStart && match.participant1 && match.participant2 && (
            <AnimatedPressable
              style={styles.startButton}
              onPress={handleStartMatch}
              disabled={isUpdating}>
              <IconSymbol name="play.fill" size={20} color={Colors.bgPrimary} />
              <ThemedText style={styles.startButtonText}>
                {isUpdating ? 'Starting...' : 'Start Match'}
              </ThemedText>
            </AnimatedPressable>
          )}

          {canComplete && (
            <AnimatedPressable
              style={styles.completeButton}
              onPress={handleCompleteMatch}
              disabled={isUpdating}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={Colors.bgPrimary} />
              <ThemedText style={styles.completeButtonText}>
                {isUpdating ? 'Completing...' : 'Complete Match'}
              </ThemedText>
            </AnimatedPressable>
          )}
        </Animated.View>

        {/* Role Info */}
        <Animated.View entering={FadeInDown.duration(600).delay(350)} style={styles.roleInfo}>
          <ThemedText type="muted" style={styles.roleText}>
            You are a {match.myRole}. {canEdit ? 'You can edit scores.' : 'Match is not editable.'}
          </ThemedText>
        </Animated.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCenter: {
    alignItems: 'center',
  },
  matchInfo: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  statusRow: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  participantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: Colors.bgTertiary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  participantRecord: {
    fontSize: 12,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.bgTertiary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreDisplay: {
    width: 60,
    height: 60,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.accent,
  },
  vsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  vsCircle: {
    width: 36,
    height: 36,
    backgroundColor: Colors.bgTertiary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.accentGlow,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  winnerText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.accent,
  },
  actions: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.success,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    ...Shadows.sm,
  },
  startButtonText: {
    color: Colors.bgPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    ...Shadows.accent,
  },
  completeButtonText: {
    color: Colors.bgPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  roleInfo: {
    alignItems: 'center',
  },
  roleText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
