import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-color';

export default function TournamentLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
        animation: 'slide_from_right',
      }}
    />
  );
}
