import * as React from "react";
import { Text, View, type TextProps, type ViewProps } from "react-native";

import { cn } from "../../utils/cn";

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border/80 bg-card py-6 text-card-foreground shadow-lg shadow-black/10 dark:border-border-dark/80 dark:bg-card-dark dark:text-card-foreground-dark",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("gap-2.5 px-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: TextProps & { className?: string }) {
  return (
    <Text
      className={cn(
        "font-display-semibold text-base tracking-[0.04em] text-text-primary dark:text-text-primary-dark",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: TextProps & { className?: string }) {
  return (
    <Text
      className={cn("text-sm text-muted-foreground dark:text-muted-foreground-dark", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("px-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("flex-row items-center px-6", className)} {...props} />;
}

export function CardAction({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("self-start", className)} {...props} />;
}
