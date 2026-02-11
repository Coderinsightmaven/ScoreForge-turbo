import { useQuery } from "convex/react";
import { api } from "@repo/convex";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import { AppHeader } from "../../components/navigation/AppHeader";

type Tab = "users" | "admins" | "settings";

export default function AdminScreen() {
  const isSiteAdmin = useQuery(api.siteAdmin.checkIsSiteAdmin);
  const usersData = useQuery(api.siteAdmin.listUsers, isSiteAdmin ? { limit: 20 } : "skip");
  const admins = useQuery(api.siteAdmin.listSiteAdmins, isSiteAdmin ? {} : "skip");
  const settings = useQuery(api.siteAdmin.getSystemSettings, isSiteAdmin ? {} : "skip");
  const [activeTab, setActiveTab] = useState<Tab>("users");

  if (isSiteAdmin === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-page dark:bg-bg-page-dark">
        <ActivityIndicator size="large" color="#70AC15" />
      </View>
    );
  }

  if (!isSiteAdmin) {
    return (
      <View className="flex-1 bg-bg-page dark:bg-bg-page-dark">
        <AppHeader title="Admin" subtitle="Site administration" showBack />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-text-secondary dark:text-text-secondary-dark">
            You do not have access to site administration.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-page dark:bg-bg-page-dark">
      <AppHeader title="Admin" subtitle="Site administration" />
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="pt-4">
          <View className="rounded-3xl border border-border bg-bg-card p-4 shadow-sm shadow-black/5 dark:border-border-dark dark:bg-bg-card-dark">
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark">
              Sections
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {(
                [
                  { id: "users" as Tab, label: "Users" },
                  { id: "admins" as Tab, label: "Admins" },
                  { id: "settings" as Tab, label: "Settings" },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    className={`rounded-full border px-4 py-2 ${
                      isActive
                        ? "border-brand/40 bg-brand/10"
                        : "border-border bg-bg-secondary dark:border-border-dark dark:bg-bg-secondary-dark"
                    }`}>
                    <Text
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                        isActive
                          ? "text-brand"
                          : "text-text-secondary dark:text-text-secondary-dark"
                      }`}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {activeTab === "users" && (
          <View className="mt-4 rounded-3xl border border-border bg-bg-card p-5 shadow-sm shadow-black/5 dark:border-border-dark dark:bg-bg-card-dark">
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark">
              Recent users
            </Text>
            <View className="mt-4 gap-3">
              {usersData?.users?.length ? (
                usersData.users.map((user) => (
                  <View
                    key={user._id}
                    className="rounded-2xl border border-border/70 bg-bg-secondary p-4 dark:border-border-dark dark:bg-bg-secondary-dark">
                    <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                      {user.name ?? user.email ?? "Unnamed user"}
                    </Text>
                    {user.email ? (
                      <Text className="mt-1 text-xs text-text-muted dark:text-text-muted-dark">
                        {user.email}
                      </Text>
                    ) : null}
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      {user.isSiteAdmin ? (
                        <View className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1">
                          <Text className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
                            Admin
                          </Text>
                        </View>
                      ) : null}
                      <View className="rounded-full border border-border/70 bg-bg-card px-3 py-1 dark:border-border-dark dark:bg-bg-card-dark">
                        <Text className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted dark:text-text-muted-dark">
                          {user.tournamentCount} tournaments
                        </Text>
                      </View>
                      <View className="rounded-full border border-border/70 bg-bg-card px-3 py-1 dark:border-border-dark dark:bg-bg-card-dark">
                        <Text className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted dark:text-text-muted-dark">
                          Logs {user.scoringLogsEnabled ? "on" : "off"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  No users found.
                </Text>
              )}
            </View>
          </View>
        )}

        {activeTab === "admins" && (
          <View className="mt-4 rounded-3xl border border-border bg-bg-card p-5 shadow-sm shadow-black/5 dark:border-border-dark dark:bg-bg-card-dark">
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark">
              Site admins
            </Text>
            <View className="mt-4 gap-3">
              {admins?.length ? (
                admins.map((admin) => (
                  <View
                    key={admin._id}
                    className="rounded-2xl border border-border/70 bg-bg-secondary p-4 dark:border-border-dark dark:bg-bg-secondary-dark">
                    <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                      {admin.userName ?? admin.userEmail ?? "Admin"}
                    </Text>
                    {admin.userEmail ? (
                      <Text className="mt-1 text-xs text-text-muted dark:text-text-muted-dark">
                        {admin.userEmail}
                      </Text>
                    ) : null}
                    <Text className="mt-2 text-xs text-text-muted dark:text-text-muted-dark">
                      Granted {new Date(admin.grantedAt).toLocaleDateString("en-US")}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  No admins found.
                </Text>
              )}
            </View>
          </View>
        )}

        {activeTab === "settings" && (
          <View className="mt-4 rounded-3xl border border-border bg-bg-card p-5 shadow-sm shadow-black/5 dark:border-border-dark dark:bg-bg-card-dark">
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark">
              System settings
            </Text>
            {settings ? (
              <View className="mt-4 gap-3">
                <SettingRow
                  label="Max tournaments per user"
                  value={String(settings.maxTournamentsPerUser)}
                />
                <SettingRow
                  label="Public registration"
                  value={settings.allowPublicRegistration ? "Enabled" : "Disabled"}
                />
                <SettingRow
                  label="Maintenance mode"
                  value={settings.maintenanceMode ? "Enabled" : "Disabled"}
                />
                {settings.maintenanceMessage ? (
                  <View className="rounded-2xl border border-border/70 bg-bg-secondary p-4 dark:border-border-dark dark:bg-bg-secondary-dark">
                    <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted dark:text-text-muted-dark">
                      Message
                    </Text>
                    <Text className="mt-2 text-sm text-text-secondary dark:text-text-secondary-dark">
                      {settings.maintenanceMessage}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text className="mt-4 text-sm text-text-secondary dark:text-text-secondary-dark">
                No system settings found.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-2xl border border-border/70 bg-bg-secondary p-4 dark:border-border-dark dark:bg-bg-secondary-dark">
      <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted dark:text-text-muted-dark">
        {label}
      </Text>
      <Text className="mt-2 text-sm font-semibold text-text-primary dark:text-text-primary-dark">
        {value}
      </Text>
    </View>
  );
}
