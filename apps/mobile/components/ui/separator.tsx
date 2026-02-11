import * as React from "react";
import { View, type ViewProps } from "react-native";

import { cn } from "../../utils/cn";

export function Separator({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View className={cn("h-px w-full bg-border/60 dark:bg-border-dark/60", className)} {...props} />
  );
}
