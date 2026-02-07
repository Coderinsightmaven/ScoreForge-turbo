import { Stack } from "expo-router";

export default function ScorerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
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
