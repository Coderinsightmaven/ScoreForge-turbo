import * as React from "react";
import { Text, View, type ViewProps } from "react-native";

import { cn } from "../../utils/cn";

type BadgeVariant =
  | "default"
  | "brand"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "live"
  | "gold";

const badgeVariants: Record<BadgeVariant, string> = {
  default:
    "border-border/60 bg-bg-secondary text-text-muted dark:border-border-dark/60 dark:bg-bg-secondary-dark dark:text-text-muted-dark",
  brand:
    "border-brand/40 bg-brand/10 text-brand dark:border-brand-dark/40 dark:bg-brand-dark/15 dark:text-brand-dark",
  success:
    "border-success/40 bg-success/10 text-success dark:border-success-dark/40 dark:bg-success-dark/15 dark:text-success-dark",
  warning:
    "border-warning/40 bg-warning/10 text-warning dark:border-warning-dark/40 dark:bg-warning-dark/15 dark:text-warning-dark",
  destructive:
    "border-error/40 bg-error/10 text-error dark:border-error-dark/40 dark:bg-error-dark/15 dark:text-error-dark",
  info: "border-info/40 bg-info/10 text-info dark:border-info-dark/40 dark:bg-info-dark/15 dark:text-info-dark",
  live: "border-live/40 bg-live/10 text-live dark:border-live-dark/40 dark:bg-live-dark/15 dark:text-live-dark",
  gold: "border-gold/40 bg-gold/10 text-gold dark:border-gold-dark/40 dark:bg-gold-dark/15 dark:text-gold-dark",
};

export type BadgeProps = ViewProps & {
  variant?: BadgeVariant;
  className?: string;
  textClassName?: string;
  children: React.ReactNode;
};

export function Badge({
  variant = "default",
  className,
  textClassName,
  children,
  ...props
}: BadgeProps) {
  const badgeTextClassName = cn(
    "text-[11px] font-semibold uppercase tracking-[0.18em]",
    textClassName
  );
  const content = React.Children.map(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      return <Text className={badgeTextClassName}>{child}</Text>;
    }
    return child;
  });

  return (
    <View
      className={cn(
        "flex-row items-center rounded-full border px-3 py-1",
        badgeVariants[variant],
        className
      )}
      {...props}>
      {content}
    </View>
  );
}
