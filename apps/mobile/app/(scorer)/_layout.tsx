import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";

export default function ScorerLayout() {
  const { colorScheme } = useColorScheme();
  const stackBackground = colorScheme === "dark" ? "#0D172A" : "#F4F7FF";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: stackBackground },
      }}>
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
