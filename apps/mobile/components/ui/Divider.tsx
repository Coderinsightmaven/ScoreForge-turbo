import React from "react";
import { View, ViewProps } from "react-native";

export function Divider({ className = "", ...props }: ViewProps) {
  return <View className={`h-px bg-slate-100 dark:bg-[#2A2A2A] ${className}`} {...props} />;
}
