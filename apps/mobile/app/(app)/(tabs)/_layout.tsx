import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#D4A017",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#F1F5F9",
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontFamily: "DMSans-Medium",
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Tournaments",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏆</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
