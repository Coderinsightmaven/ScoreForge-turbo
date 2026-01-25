import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-color';

export default function MainLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="tournament/[id]" />
      <Stack.Screen name="tournament/match/[matchId]" />
    </Stack>
  );
}
