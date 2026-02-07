import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="tournament/[id]" />
      <Stack.Screen name="match/[id]" />
      <Stack.Screen
        name="scoring/[id]"
        options={{
          gestureEnabled: false,
          animation: "fade",
        }}
      />
    </Stack>
  );
}
