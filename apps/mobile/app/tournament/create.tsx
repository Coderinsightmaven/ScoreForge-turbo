import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useMutation } from 'convex/react';
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

type Sport =
  | 'basketball'
  | 'soccer'
  | 'tennis'
  | 'football'
  | 'baseball'
  | 'volleyball'
  | 'hockey'
  | 'golf'
  | 'badminton'
  | 'table_tennis'
  | 'cricket'
  | 'rugby';

type Format = 'single_elimination' | 'double_elimination' | 'round_robin';
type ParticipantType = 'team' | 'individual';

const SPORTS: { id: Sport; name: string; icon: string }[] = [
  { id: 'basketball', name: 'Basketball', icon: 'basketball.fill' },
  { id: 'soccer', name: 'Soccer', icon: 'soccerball' },
  { id: 'tennis', name: 'Tennis', icon: 'tennisball.fill' },
  { id: 'football', name: 'Football', icon: 'football.fill' },
  { id: 'baseball', name: 'Baseball', icon: 'baseball.fill' },
  { id: 'volleyball', name: 'Volleyball', icon: 'volleyball.fill' },
  { id: 'hockey', name: 'Hockey', icon: 'hockey.puck.fill' },
  { id: 'golf', name: 'Golf', icon: 'figure.golf' },
  { id: 'badminton', name: 'Badminton', icon: 'figure.badminton' },
  { id: 'table_tennis', name: 'Table Tennis', icon: 'figure.table.tennis' },
  { id: 'cricket', name: 'Cricket', icon: 'cricket.ball.fill' },
  { id: 'rugby', name: 'Rugby', icon: 'figure.rugby' },
];

const FORMATS: { id: Format; name: string; description: string }[] = [
  {
    id: 'single_elimination',
    name: 'Single Elimination',
    description: 'Lose once and you\'re out. Fast and decisive.',
  },
  {
    id: 'double_elimination',
    name: 'Double Elimination',
    description: 'Two losses to be eliminated. Gives a second chance.',
  },
  {
    id: 'round_robin',
    name: 'Round Robin',
    description: 'Everyone plays everyone. Best for ranking.',
  },
];

export default function CreateTournamentScreen() {
  const insets = useSafeAreaInsets();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId as Id<'organizations'>;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sport, setSport] = useState<Sport | null>(null);
  const [format, setFormat] = useState<Format>('single_elimination');
  const [participantType, setParticipantType] = useState<ParticipantType>('individual');
  const [maxParticipants, setMaxParticipants] = useState('16');
  const [isCreating, setIsCreating] = useState(false);

  const createTournament = useMutation(api.tournaments.createTournament);

  const isValid = name.trim() && sport && parseInt(maxParticipants) >= 2;

  const handleCreate = async () => {
    if (!isValid || !sport) return;

    setIsCreating(true);
    try {
      const tournamentId = await createTournament({
        organizationId: orgId,
        name: name.trim(),
        description: description.trim() || undefined,
        sport,
        format,
        participantType,
        maxParticipants: parseInt(maxParticipants),
      });
      router.replace(`/tournament/${tournamentId}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create tournament');
      setIsCreating(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="xmark" size={20} color={Colors.textPrimary} />
            </Pressable>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              Create Tournament
            </ThemedText>
            <View style={{ width: 40 }} />
          </Animated.View>

          {/* Name Input */}
          <Animated.View entering={FadeInDown.duration(600).delay(150)} style={styles.section}>
            <ThemedText type="label" style={styles.sectionLabel}>
              TOURNAMENT NAME
            </ThemedText>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter tournament name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
          </Animated.View>

          {/* Description Input */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.section}>
            <ThemedText type="label" style={styles.sectionLabel}>
              DESCRIPTION (OPTIONAL)
            </ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </Animated.View>

          {/* Sport Selection */}
          <Animated.View entering={FadeInDown.duration(600).delay(250)} style={styles.section}>
            <ThemedText type="label" style={styles.sectionLabel}>
              SELECT SPORT
            </ThemedText>
            <View style={styles.sportGrid}>
              {SPORTS.map((s) => (
                <Pressable
                  key={s.id}
                  style={[styles.sportCard, sport === s.id && styles.sportCardActive]}
                  onPress={() => setSport(s.id)}>
                  <IconSymbol
                    name={s.icon}
                    size={24}
                    color={sport === s.id ? Colors.accent : Colors.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.sportName,
                      sport === s.id && styles.sportNameActive,
                    ]}>
                    {s.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Format Selection */}
          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.section}>
            <ThemedText type="label" style={styles.sectionLabel}>
              TOURNAMENT FORMAT
            </ThemedText>
            <View style={styles.formatList}>
              {FORMATS.map((f) => (
                <Pressable
                  key={f.id}
                  style={[styles.formatCard, format === f.id && styles.formatCardActive]}
                  onPress={() => setFormat(f.id)}>
                  <View style={styles.formatRadio}>
                    {format === f.id && <View style={styles.formatRadioInner} />}
                  </View>
                  <View style={styles.formatInfo}>
                    <ThemedText
                      style={[styles.formatName, format === f.id && styles.formatNameActive]}>
                      {f.name}
                    </ThemedText>
                    <ThemedText type="muted" style={styles.formatDescription}>
                      {f.description}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Participant Type */}
          <Animated.View entering={FadeInDown.duration(600).delay(350)} style={styles.section}>
            <ThemedText type="label" style={styles.sectionLabel}>
              PARTICIPANT TYPE
            </ThemedText>
            <View style={styles.typeSelector}>
              <Pressable
                style={[
                  styles.typeOption,
                  participantType === 'individual' && styles.typeOptionActive,
                ]}
                onPress={() => setParticipantType('individual')}>
                <IconSymbol
                  name="person.fill"
                  size={20}
                  color={participantType === 'individual' ? Colors.bgPrimary : Colors.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.typeText,
                    participantType === 'individual' && styles.typeTextActive,
                  ]}>
                  Individuals
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.typeOption, participantType === 'team' && styles.typeOptionActive]}
                onPress={() => setParticipantType('team')}>
                <IconSymbol
                  name="person.3.fill"
                  size={20}
                  color={participantType === 'team' ? Colors.bgPrimary : Colors.textSecondary}
                />
                <ThemedText
                  style={[styles.typeText, participantType === 'team' && styles.typeTextActive]}>
                  Teams
                </ThemedText>
              </Pressable>
            </View>
          </Animated.View>

          {/* Max Participants */}
          <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.section}>
            <ThemedText type="label" style={styles.sectionLabel}>
              MAX PARTICIPANTS
            </ThemedText>
            <View style={styles.participantsRow}>
              {['4', '8', '16', '32', '64'].map((num) => (
                <Pressable
                  key={num}
                  style={[
                    styles.participantOption,
                    maxParticipants === num && styles.participantOptionActive,
                  ]}
                  onPress={() => setMaxParticipants(num)}>
                  <ThemedText
                    style={[
                      styles.participantOptionText,
                      maxParticipants === num && styles.participantOptionTextActive,
                    ]}>
                    {num}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Create Button */}
          <Animated.View entering={FadeInDown.duration(600).delay(450)} style={styles.buttonSection}>
            <AnimatedPressable
              style={styles.createButton}
              onPress={handleCreate}
              disabled={!isValid || isCreating}>
              <ThemedText style={styles.createButtonText}>
                {isCreating ? 'Creating...' : 'Create Tournament'}
              </ThemedText>
            </AnimatedPressable>
          </Animated.View>

          <View style={{ height: insets.bottom + Spacing['2xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
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
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sportCard: {
    width: '31%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sportCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentGlow,
  },
  sportName: {
    fontSize: 11,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  sportNameActive: {
    color: Colors.accent,
    fontWeight: '600',
  },
  formatList: {
    gap: Spacing.sm,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  formatCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentGlow,
  },
  formatRadio: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  formatRadioInner: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
  },
  formatInfo: {
    flex: 1,
  },
  formatName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  formatNameActive: {
    color: Colors.accent,
  },
  formatDescription: {
    fontSize: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  typeOptionActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeTextActive: {
    color: Colors.bgPrimary,
  },
  participantsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  participantOption: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  participantOptionActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  participantOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  participantOptionTextActive: {
    color: Colors.bgPrimary,
  },
  buttonSection: {
    marginTop: Spacing.md,
  },
  createButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    ...Shadows.accent,
  },
  createButtonText: {
    color: Colors.bgPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
});
