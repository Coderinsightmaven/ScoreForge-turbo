import type { ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useNavSheet } from "./NavSheet";
import { cn } from "../../utils/cn";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: ReactNode;
  className?: string;
};

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightSlot,
  className,
}: AppHeaderProps) {
  const router = useRouter();
  const { open } = useNavSheet();

  return (
    <View
      className={cn(
        "border-b border-border bg-bg-secondary dark:border-border-dark dark:bg-bg-secondary-dark",
        className
      )}>
      <SafeAreaView edges={["top"]}>
        <View className="px-5 pb-4 pt-3">
          <View className="flex-row items-center justify-between">
            {showBack ? (
              <TouchableOpacity
                onPress={onBack ?? (() => router.back())}
                accessibilityLabel="Go back"
                className="h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-secondary dark:border-border-dark dark:bg-bg-secondary-dark">
                <View className="relative h-4 w-4 items-center justify-center">
                  <View className="absolute h-0.5 w-4 -rotate-45 rounded-sm bg-text-primary dark:bg-text-primary-dark" />
                  <View className="absolute h-0.5 w-4 rotate-45 rounded-sm bg-text-primary dark:bg-text-primary-dark" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={open}
                accessibilityLabel="Open navigation"
                className="h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-secondary dark:border-border-dark dark:bg-bg-secondary-dark">
                <View className="gap-1">
                  <View className="h-0.5 w-5 rounded-sm bg-text-primary dark:bg-text-primary-dark" />
                  <View className="h-0.5 w-5 rounded-sm bg-text-primary dark:bg-text-primary-dark" />
                  <View className="h-0.5 w-5 rounded-sm bg-text-primary dark:bg-text-primary-dark" />
                </View>
              </TouchableOpacity>
            )}

            <View className="flex-1 px-3">
              <Text
                className="text-center font-display-semibold text-lg text-text-primary dark:text-text-primary-dark"
                numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text
                  className="mt-1 text-center text-xs uppercase tracking-[0.18em] text-text-muted dark:text-text-muted-dark"
                  numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <View className="min-w-[64px] items-end">{rightSlot ?? <View />}</View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
