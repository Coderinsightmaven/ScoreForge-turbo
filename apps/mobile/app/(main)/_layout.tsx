import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bgPrimary },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="tournament/[id]" />
      <Stack.Screen name="tournament/match/[matchId]" />
    </Stack>
  );
}
