import React from "react";
import { View, Text, ViewProps } from "react-native";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "brand" | "muted";

interface BadgeProps extends ViewProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: "bg-surface-secondary dark:bg-[#2A2A2A]",
    text: "text-text-primary dark:text-[#F5F5F3]",
    border: "border-slate-200 dark:border-[#2A2A2A]",
  },
  success: {
    bg: "bg-status-active-bg",
    text: "text-status-active-text",
    border: "border-status-active-border/30",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300/30",
  },
  error: {
    bg: "bg-status-live-bg",
    text: "text-status-live-text",
    border: "border-status-live-border/30",
  },
  info: {
    bg: "bg-status-completed-bg",
    text: "text-status-completed-text",
    border: "border-status-completed-border/30",
  },
  brand: {
    bg: "bg-brand-light",
    text: "text-brand-text",
    border: "border-brand/30",
  },
  muted: {
    bg: "bg-surface-tertiary dark:bg-[#2A2A2A]",
    text: "text-text-tertiary dark:text-[#9ca3af]",
    border: "border-slate-200 dark:border-[#2A2A2A]",
  },
};

export function Badge({ label, variant = "default", className = "", ...props }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View
      className={`rounded-md border px-2.5 py-0.5 ${styles.bg} ${styles.border} ${className}`}
      {...props}>
      <Text className={`font-sans-medium text-xs uppercase tracking-wider ${styles.text}`}>
        {label}
      </Text>
    </View>
  );
}
