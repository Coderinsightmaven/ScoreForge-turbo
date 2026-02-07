import { useQuery } from "convex/react";
import { api } from "@repo/convex";
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { TournamentCard } from "../../../components/tournaments/TournamentCard";

export default function TournamentsScreen() {
  const user = useQuery(api.users.currentUser);
  const tournaments = useQuery(api.tournaments.listMyTournaments, {});
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (tournaments === undefined || user === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#D4A017" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between bg-white px-5 py-5 shadow-sm shadow-slate-900/5">
          <View>
            <Text className="font-display-bold text-2xl tracking-tight text-slate-900">
              {user?.name ? `Hi, ${user.name.split(" ")[0]}` : "Tournaments"}
            </Text>
            <Text className="font-sans text-sm text-text-tertiary">ScoreForge Mobile</Text>
          </View>
        </View>

        {/* Tournaments List */}
        <View className="flex-1 bg-slate-50">
          {tournaments.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-slate-100">
                <Text className="text-4xl">🏆</Text>
              </View>
              <Text className="mb-2 font-display-semibold text-2xl text-slate-900">
                No Tournaments
              </Text>
              <Text className="text-center text-text-tertiary">
                {
                  "You don't have access to any tournaments yet. Ask a tournament organizer to add you as a scorer."
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={tournaments}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={5}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />
              }
              renderItem={({ item }) => (
                <TournamentCard
                  tournament={item}
                  onPress={() => router.push(`/(app)/tournament/${item._id}`)}
                />
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
