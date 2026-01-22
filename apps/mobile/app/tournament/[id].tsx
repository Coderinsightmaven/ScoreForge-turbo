import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, Alert } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
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
      onPress={onPress}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

const SPORT_ICONS: Record<string, string> = {
  basketball: 'basketball.fill',
  soccer: 'soccerball',
  tennis: 'tennisball.fill',
  football: 'football.fill',
  baseball: 'baseball.fill',
  volleyball: 'volleyball.fill',
  hockey: 'hockey.puck.fill',
  golf: 'figure.golf',
  badminton: 'figure.badminton',
  table_tennis: 'figure.table.tennis',
  cricket: 'cricket.ball.fill',
  rugby: 'figure.rugby',
};

const STATUS_COLORS: Record<string, string> = {
  draft: Colors.textMuted,
  registration: Colors.info,
  active: Colors.success,
  completed: Colors.accent,
  cancelled: Colors.error,
};

function getStatusBadgeStyle(status: string) {
  const color = STATUS_COLORS[status] || Colors.textMuted;
  return {
    backgroundColor: color + '20',
    borderColor: color + '40',
  };
}

export default function TournamentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournamentId = id as Id<'tournaments'>;

  const [activeTab, setActiveTab] = useState<'bracket' | 'matches' | 'participants' | 'settings'>(
    'bracket'
  );

  const tournament = useQuery(api.tournaments.getTournament, { tournamentId });
  const bracket = useQuery(api.tournaments.getBracket, { tournamentId });
  const standings = useQuery(api.tournaments.getStandings, { tournamentId });
  const participants = useQuery(api.tournamentParticipants.listParticipants, { tournamentId });
  const matches = useQuery(api.matches.listMatches, { tournamentId });

  const startTournament = useMutation(api.tournaments.startTournament);
  const openRegistration = useMutation(api.tournaments.openRegistration);
  const cancelTournament = useMutation(api.tournaments.cancelTournament);
  const deleteTournament = useMutation(api.tournaments.deleteTournament);

  const canManage = tournament?.myRole === 'owner' || tournament?.myRole === 'admin';
  const isOwner = tournament?.myRole === 'owner';

  const handleOpenRegistration = async () => {
    try {
      await openRegistration({ tournamentId });
      Alert.alert('Success', 'Registration is now open');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open registration');
    }
  };

  const handleStartTournament = () => {
    Alert.alert(
      'Start Tournament',
      'This will generate the bracket and matches. You cannot add or remove participants after starting.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              await startTournament({ tournamentId });
              Alert.alert('Success', 'Tournament has started!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to start tournament');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Tournament',
      'Are you sure you want to cancel this tournament?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelTournament({ tournamentId });
              Alert.alert('Success', 'Tournament has been cancelled');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel tournament');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Tournament',
      'This action cannot be undone. All matches and participant data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTournament({ tournamentId });
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete tournament');
            }
          },
        },
      ]
    );
  };

  if (!tournament) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top + Spacing.xl }]}>
          <ThemedText type="muted">Loading tournament...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const formatName = tournament.format
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const sportName = tournament.sport
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.headerContent}>
            <View style={styles.sportIcon}>
              <IconSymbol
                name={SPORT_ICONS[tournament.sport] || 'sportscourt'}
                size={24}
                color={Colors.accent}
              />
            </View>
            <View style={styles.titleContainer}>
              <ThemedText type="subtitle" style={styles.title}>
                {tournament.name}
              </ThemedText>
              <View style={styles.metaRow}>
                <ThemedText type="muted" style={styles.metaText}>
                  {sportName} • {formatName}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Status Badge */}
        <Animated.View entering={FadeInDown.duration(600).delay(150)} style={styles.statusRow}>
          <View style={[styles.statusBadge, getStatusBadgeStyle(tournament.status)]}>
            <ThemedText
              style={[styles.statusText, { color: STATUS_COLORS[tournament.status] }]}>
              {tournament.status.toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText type="muted">
            {tournament.participantCount}/{tournament.maxParticipants} participants
          </ThemedText>
        </Animated.View>

        {/* Description */}
        {tournament.description && (
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.descriptionCard}>
            <ThemedText type="muted">{tournament.description}</ThemedText>
          </Animated.View>
        )}

        {/* Action Buttons (for admins) */}
        {canManage && (tournament.status === 'draft' || tournament.status === 'registration') && (
          <Animated.View entering={FadeInDown.duration(600).delay(250)} style={styles.actionRow}>
            {tournament.status === 'draft' && (
              <AnimatedPressable style={styles.primaryButton} onPress={handleOpenRegistration}>
                <ThemedText style={styles.primaryButtonText}>Open Registration</ThemedText>
              </AnimatedPressable>
            )}
            {tournament.status === 'registration' && (
              <AnimatedPressable style={styles.primaryButton} onPress={handleStartTournament}>
                <ThemedText style={styles.primaryButtonText}>Start Tournament</ThemedText>
              </AnimatedPressable>
            )}
          </Animated.View>
        )}

        {/* Tabs */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'bracket' && styles.tabActive]}
            onPress={() => setActiveTab('bracket')}>
            <ThemedText style={[styles.tabText, activeTab === 'bracket' && styles.tabTextActive]}>
              {tournament.format === 'round_robin' ? 'Standings' : 'Bracket'}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'matches' && styles.tabActive]}
            onPress={() => setActiveTab('matches')}>
            <ThemedText style={[styles.tabText, activeTab === 'matches' && styles.tabTextActive]}>
              Matches
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'participants' && styles.tabActive]}
            onPress={() => setActiveTab('participants')}>
            <ThemedText
              style={[styles.tabText, activeTab === 'participants' && styles.tabTextActive]}>
              Players
            </ThemedText>
          </Pressable>
          {canManage && (
            <Pressable
              style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
              onPress={() => setActiveTab('settings')}>
              <ThemedText
                style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
                Settings
              </ThemedText>
            </Pressable>
          )}
        </Animated.View>

        {/* Tab Content */}
        {activeTab === 'bracket' && (
          <Animated.View entering={FadeInDown.duration(600).delay(350)} style={styles.tabContent}>
            {tournament.status === 'draft' || tournament.status === 'registration' ? (
              <View style={styles.emptyState}>
                <IconSymbol name="rectangle.on.rectangle.slash" size={48} color={Colors.textMuted} />
                <ThemedText type="muted" style={styles.emptyText}>
                  {tournament.format === 'round_robin' ? 'Standings' : 'Bracket'} will be available
                  after the tournament starts
                </ThemedText>
              </View>
            ) : tournament.format === 'round_robin' ? (
              // Round Robin Standings
              <View style={styles.standingsContainer}>
                <View style={styles.standingsHeader}>
                  <ThemedText style={styles.standingsHeaderCell}>Rank</ThemedText>
                  <ThemedText style={[styles.standingsHeaderCell, styles.standingsName]}>
                    Name
                  </ThemedText>
                  <ThemedText style={styles.standingsHeaderCell}>W</ThemedText>
                  <ThemedText style={styles.standingsHeaderCell}>L</ThemedText>
                  <ThemedText style={styles.standingsHeaderCell}>D</ThemedText>
                  <ThemedText style={styles.standingsHeaderCell}>Pts</ThemedText>
                </View>
                {standings?.map((participant, index) => (
                  <Animated.View
                    key={participant._id}
                    entering={FadeInRight.duration(400).delay(index * 50)}
                    style={styles.standingsRow}>
                    <ThemedText style={styles.standingsCell}>{index + 1}</ThemedText>
                    <ThemedText style={[styles.standingsCell, styles.standingsName]} numberOfLines={1}>
                      {participant.displayName}
                    </ThemedText>
                    <ThemedText style={styles.standingsCell}>{participant.wins}</ThemedText>
                    <ThemedText style={styles.standingsCell}>{participant.losses}</ThemedText>
                    <ThemedText style={styles.standingsCell}>{participant.draws}</ThemedText>
                    <ThemedText style={[styles.standingsCell, styles.standingsPoints]}>
                      {participant.points}
                    </ThemedText>
                  </Animated.View>
                ))}
              </View>
            ) : (
              // Elimination Bracket
              <View style={styles.bracketContainer}>
                {bracket?.matches
                  .filter((m) => m.bracket === 'winners' || !m.bracket)
                  .reduce(
                    (rounds, match) => {
                      if (!rounds[match.round]) rounds[match.round] = [];
                      rounds[match.round].push(match);
                      return rounds;
                    },
                    {} as Record<number, typeof bracket.matches>
                  ) &&
                  Object.entries(
                    bracket?.matches
                      .filter((m) => m.bracket === 'winners' || !m.bracket)
                      .reduce(
                        (rounds, match) => {
                          if (!rounds[match.round]) rounds[match.round] = [];
                          rounds[match.round].push(match);
                          return rounds;
                        },
                        {} as Record<number, typeof bracket.matches>
                      ) || {}
                  ).map(([round, roundMatches]) => (
                    <View key={round} style={styles.bracketRound}>
                      <ThemedText style={styles.roundLabel}>Round {round}</ThemedText>
                      {roundMatches.map((match, index) => (
                        <Animated.View
                          key={match._id}
                          entering={FadeInRight.duration(400).delay(index * 50)}>
                          <Pressable
                            style={styles.bracketMatch}
                            onPress={() => router.push(`/tournament/match/${match._id}`)}>
                            <View
                              style={[
                                styles.bracketParticipant,
                                match.winnerId === match.participant1?._id && styles.bracketWinner,
                              ]}>
                              <ThemedText
                                style={styles.bracketName}
                                numberOfLines={1}>
                                {match.participant1?.displayName || 'TBD'}
                              </ThemedText>
                              <ThemedText style={styles.bracketScore}>
                                {match.participant1Score}
                              </ThemedText>
                            </View>
                            <View style={styles.bracketDivider} />
                            <View
                              style={[
                                styles.bracketParticipant,
                                match.winnerId === match.participant2?._id && styles.bracketWinner,
                              ]}>
                              <ThemedText
                                style={styles.bracketName}
                                numberOfLines={1}>
                                {match.participant2?.displayName || 'TBD'}
                              </ThemedText>
                              <ThemedText style={styles.bracketScore}>
                                {match.participant2Score}
                              </ThemedText>
                            </View>
                            {match.status !== 'completed' && match.status !== 'bye' && (
                              <View style={styles.matchStatusBadge}>
                                <ThemedText style={styles.matchStatusText}>
                                  {match.status === 'live' ? 'LIVE' : match.status.toUpperCase()}
                                </ThemedText>
                              </View>
                            )}
                          </Pressable>
                        </Animated.View>
                      ))}
                    </View>
                  ))}
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === 'matches' && (
          <Animated.View entering={FadeInDown.duration(600).delay(350)} style={styles.tabContent}>
            {!matches || matches.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="sportscourt" size={48} color={Colors.textMuted} />
                <ThemedText type="muted" style={styles.emptyText}>
                  No matches yet. Start the tournament to generate matches.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.matchesList}>
                {matches.map((match, index) => (
                  <Animated.View
                    key={match._id}
                    entering={FadeInRight.duration(400).delay(index * 30)}>
                    <Pressable
                      style={styles.matchCard}
                      onPress={() => router.push(`/tournament/match/${match._id}`)}>
                      <View style={styles.matchHeader}>
                        <ThemedText type="muted" style={styles.matchRound}>
                          {match.bracket ? `${match.bracket} ` : ''}Round {match.round} • Match{' '}
                          {match.matchNumber}
                        </ThemedText>
                        <View
                          style={[
                            styles.matchStatusPill,
                            match.status === 'live' && styles.matchStatusLive,
                            match.status === 'completed' && styles.matchStatusCompleted,
                          ]}>
                          <ThemedText
                            style={[
                              styles.matchStatusPillText,
                              match.status === 'live' && { color: Colors.success },
                              match.status === 'completed' && { color: Colors.accent },
                            ]}>
                            {match.status === 'live' ? 'LIVE' : match.status.toUpperCase()}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.matchParticipants}>
                        <View style={styles.matchParticipant}>
                          <ThemedText
                            style={[
                              styles.matchParticipantName,
                              match.winnerId === match.participant1?._id && styles.winnerName,
                            ]}
                            numberOfLines={1}>
                            {match.participant1?.displayName || 'TBD'}
                          </ThemedText>
                          <ThemedText
                            style={[
                              styles.matchParticipantScore,
                              match.winnerId === match.participant1?._id && styles.winnerScore,
                            ]}>
                            {match.participant1Score}
                          </ThemedText>
                        </View>
                        <ThemedText type="muted" style={styles.matchVs}>
                          vs
                        </ThemedText>
                        <View style={styles.matchParticipant}>
                          <ThemedText
                            style={[
                              styles.matchParticipantName,
                              match.winnerId === match.participant2?._id && styles.winnerName,
                            ]}
                            numberOfLines={1}>
                            {match.participant2?.displayName || 'TBD'}
                          </ThemedText>
                          <ThemedText
                            style={[
                              styles.matchParticipantScore,
                              match.winnerId === match.participant2?._id && styles.winnerScore,
                            ]}>
                            {match.participant2Score}
                          </ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === 'participants' && (
          <Animated.View entering={FadeInDown.duration(600).delay(350)} style={styles.tabContent}>
            {canManage &&
              (tournament.status === 'draft' || tournament.status === 'registration') && (
                <AnimatedPressable
                  style={styles.addParticipantButton}
                  onPress={() =>
                    router.push(
                      `/tournament/participants/add?tournamentId=${tournamentId}&participantType=${tournament.participantType}`
                    )
                  }>
                  <IconSymbol name="plus" size={20} color={Colors.accent} />
                  <ThemedText style={styles.addParticipantText}>Add Participant</ThemedText>
                </AnimatedPressable>
              )}

            {!participants || participants.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="person.2" size={48} color={Colors.textMuted} />
                <ThemedText type="muted" style={styles.emptyText}>
                  No participants registered yet
                </ThemedText>
              </View>
            ) : (
              <View style={styles.participantsList}>
                {participants.map((participant, index) => (
                  <Animated.View
                    key={participant._id}
                    entering={FadeInRight.duration(400).delay(index * 30)}>
                    <View style={styles.participantCard}>
                      <View style={styles.participantInfo}>
                        {participant.seed && (
                          <View style={styles.seedBadge}>
                            <ThemedText style={styles.seedText}>#{participant.seed}</ThemedText>
                          </View>
                        )}
                        <View style={styles.participantAvatar}>
                          <ThemedText style={styles.participantAvatarText}>
                            {participant.displayName.charAt(0).toUpperCase()}
                          </ThemedText>
                        </View>
                        <View style={styles.participantDetails}>
                          <ThemedText type="subtitle" style={styles.participantName}>
                            {participant.displayName}
                          </ThemedText>
                          {tournament.status === 'active' || tournament.status === 'completed' ? (
                            <ThemedText type="muted" style={styles.participantStats}>
                              {participant.wins}W - {participant.losses}L - {participant.draws}D
                            </ThemedText>
                          ) : (
                            <ThemedText type="muted" style={styles.participantStats}>
                              Registered
                            </ThemedText>
                          )}
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === 'settings' && canManage && (
          <Animated.View entering={FadeInDown.duration(600).delay(350)} style={styles.tabContent}>
            <View style={styles.settingsSection}>
              <ThemedText type="label" style={styles.settingsLabel}>
                TOURNAMENT INFO
              </ThemedText>
              <View style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <ThemedText type="muted">Sport</ThemedText>
                  <ThemedText>{sportName}</ThemedText>
                </View>
                <View style={styles.settingsRow}>
                  <ThemedText type="muted">Format</ThemedText>
                  <ThemedText>{formatName}</ThemedText>
                </View>
                <View style={styles.settingsRow}>
                  <ThemedText type="muted">Participant Type</ThemedText>
                  <ThemedText>
                    {tournament.participantType === 'team' ? 'Teams' : 'Individuals'}
                  </ThemedText>
                </View>
                <View style={styles.settingsRow}>
                  <ThemedText type="muted">Max Participants</ThemedText>
                  <ThemedText>{tournament.maxParticipants}</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <ThemedText type="label" style={styles.settingsLabel}>
                ACTIONS
              </ThemedText>

              {isOwner && tournament.status !== 'completed' && tournament.status !== 'cancelled' && (
                <AnimatedPressable style={styles.dangerButton} onPress={handleCancel}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={Colors.warning} />
                  <ThemedText style={[styles.dangerButtonText, { color: Colors.warning }]}>
                    Cancel Tournament
                  </ThemedText>
                </AnimatedPressable>
              )}

              {isOwner && (
                <AnimatedPressable style={styles.deleteButton} onPress={handleDelete}>
                  <IconSymbol name="trash.fill" size={20} color={Colors.error} />
                  <ThemedText style={[styles.dangerButtonText, { color: Colors.error }]}>
                    Delete Tournament
                  </ThemedText>
                </AnimatedPressable>
              )}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
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
    marginBottom: Spacing.md,
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
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  sportIcon: {
    width: 44,
    height: 44,
    backgroundColor: Colors.accentGlow,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  descriptionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actionRow: {
    marginBottom: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.accent,
  },
  primaryButtonText: {
    color: Colors.bgPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.bgPrimary,
  },
  tabContent: {
    minHeight: 200,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 250,
  },
  // Standings styles
  standingsContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  standingsHeader: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.bgTertiary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  standingsHeaderCell: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  standingsRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  standingsCell: {
    width: 40,
    fontSize: 14,
    textAlign: 'center',
  },
  standingsName: {
    flex: 1,
    textAlign: 'left',
  },
  standingsPoints: {
    fontWeight: '700',
    color: Colors.accent,
  },
  // Bracket styles
  bracketContainer: {
    gap: Spacing.lg,
  },
  bracketRound: {
    gap: Spacing.sm,
  },
  roundLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bracketMatch: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  bracketParticipant: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bracketWinner: {
    backgroundColor: Colors.accentGlow,
  },
  bracketName: {
    flex: 1,
    fontSize: 14,
  },
  bracketScore: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: Spacing.md,
  },
  bracketDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  matchStatusBadge: {
    position: 'absolute',
    right: Spacing.sm,
    top: '50%',
    transform: [{ translateY: -10 }],
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  matchStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
  // Matches list styles
  matchesList: {
    gap: Spacing.sm,
  },
  matchCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.bgTertiary,
  },
  matchStatusLive: {
    backgroundColor: Colors.success + '20',
  },
  matchStatusCompleted: {
    backgroundColor: Colors.accentGlow,
  },
  matchStatusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
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
  winnerName: {
    color: Colors.accent,
  },
  winnerScore: {
    color: Colors.accent,
  },
  matchVs: {
    fontSize: 12,
  },
  // Participants list styles
  addParticipantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    borderStyle: 'dashed',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  addParticipantText: {
    color: Colors.accent,
    fontWeight: '600',
  },
  participantsList: {
    gap: Spacing.sm,
  },
  participantCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  seedBadge: {
    width: 28,
    height: 28,
    backgroundColor: Colors.accentGlow,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  seedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    backgroundColor: Colors.bgTertiary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    marginBottom: 2,
  },
  participantStats: {
    fontSize: 12,
  },
  // Settings styles
  settingsSection: {
    marginBottom: Spacing.xl,
  },
  settingsLabel: {
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  settingsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.error + '10',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    padding: Spacing.lg,
  },
  dangerButtonText: {
    fontWeight: '600',
  },
});
