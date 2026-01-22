import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, Alert, TextInput } from 'react-native';
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
import { Colors, Spacing, Radius } from '@/constants/theme';

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

export default function AddParticipantScreen() {
  const insets = useSafeAreaInsets();
  const { tournamentId, participantType } = useLocalSearchParams<{
    tournamentId: string;
    participantType: string;
  }>();
  const id = tournamentId as Id<'tournaments'>;
  const isTeamTournament = participantType === 'team';

  const [displayName, setDisplayName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<Id<'teams'> | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const tournament = useQuery(api.tournaments.getTournament, { tournamentId: id });
  const teams = useQuery(
    api.teams.listByOrganization,
    tournament ? { organizationId: tournament.organizationId } : 'skip'
  );

  const registerParticipant = useMutation(api.tournamentParticipants.registerParticipant);

  const handleAddIndividual = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    setIsAdding(true);
    try {
      await registerParticipant({
        tournamentId: id,
        displayName: displayName.trim(),
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add participant');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddTeam = async () => {
    if (!selectedTeamId) {
      Alert.alert('Error', 'Please select a team');
      return;
    }

    setIsAdding(true);
    try {
      await registerParticipant({
        tournamentId: id,
        teamId: selectedTeamId,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add team');
    } finally {
      setIsAdding(false);
    }
  };

  if (!tournament) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top + Spacing.xl }]}>
          <ThemedText type="muted">Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="xmark" size={20} color={Colors.textPrimary} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Add {isTeamTournament ? 'Team' : 'Participant'}
          </ThemedText>
          <View style={{ width: 40 }} />
        </Animated.View>

        {isTeamTournament ? (
          // Team Selection
          <Animated.View entering={FadeInDown.duration(600).delay(150)} style={styles.section}>
            <ThemedText type="label" style={styles.sectionLabel}>
              SELECT TEAM
            </ThemedText>

            {!teams || teams.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="person.3" size={48} color={Colors.textMuted} />
                <ThemedText type="muted" style={styles.emptyText}>
                  No teams available. Create a team first.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.teamsList}>
                {teams.map((team, index) => (
                  <Animated.View
                    key={team._id}
                    entering={FadeInRight.duration(400).delay(index * 50)}>
                    <Pressable
                      style={[
                        styles.teamCard,
                        selectedTeamId === team._id && styles.teamCardSelected,
                      ]}
                      onPress={() => setSelectedTeamId(team._id)}>
                      <View style={styles.teamInfo}>
                        <View style={styles.teamAvatar}>
                          <ThemedText style={styles.teamAvatarText}>
                            {team.name.charAt(0).toUpperCase()}
                          </ThemedText>
                        </View>
                        <View style={styles.teamDetails}>
                          <ThemedText type="subtitle" style={styles.teamName}>
                            {team.name}
                          </ThemedText>
                          <ThemedText type="muted" style={styles.teamMeta}>
                            {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                          </ThemedText>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          selectedTeamId === team._id && styles.radioOuterSelected,
                        ]}>
                        {selectedTeamId === team._id && <View style={styles.radioInner} />}
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}

            {teams && teams.length > 0 && (
              <AnimatedPressable
                style={[styles.addButton, !selectedTeamId && styles.addButtonDisabled]}
                onPress={handleAddTeam}>
                <ThemedText style={styles.addButtonText}>
                  {isAdding ? 'Adding...' : 'Add Team'}
                </ThemedText>
              </AnimatedPressable>
            )}
          </Animated.View>
        ) : (
          // Individual Registration
          <Animated.View entering={FadeInDown.duration(600).delay(150)} style={styles.section}>
            <ThemedText type="label" style={styles.sectionLabel}>
              DISPLAY NAME
            </ThemedText>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter participant name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <ThemedText type="muted" style={styles.helperText}>
              This name will be displayed in brackets and standings.
            </ThemedText>

            <AnimatedPressable
              style={[styles.addButton, !displayName.trim() && styles.addButtonDisabled]}
              onPress={handleAddIndividual}>
              <ThemedText style={styles.addButtonText}>
                {isAdding ? 'Adding...' : 'Add Participant'}
              </ThemedText>
            </AnimatedPressable>
          </Animated.View>
        )}

        <View style={{ height: insets.bottom + Spacing['2xl'] }} />
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
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
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
  headerTitle: {
    fontSize: 18,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  helperText: {
    fontSize: 12,
    marginBottom: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
  },
  teamsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  teamCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentGlow,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  teamAvatar: {
    width: 44,
    height: 44,
    backgroundColor: Colors.bgTertiary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    marginBottom: 2,
  },
  teamMeta: {
    fontSize: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
  },
  addButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: Colors.bgPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
});
