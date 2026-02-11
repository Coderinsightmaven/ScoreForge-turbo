import * as React from "react";
import { Text, type TextProps } from "react-native";

import { cn } from "../../utils/cn";

export function Label({ className, ...props }: TextProps & { className?: string }) {
  return (
    <Text
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.16em] text-text-muted dark:text-text-muted-dark",
        className
      )}
      {...props}
    />
  );
}
