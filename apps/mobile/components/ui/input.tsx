import * as React from "react";
import { TextInput, type TextInputProps } from "react-native";
import { useColorScheme } from "nativewind";

import { cn } from "../../utils/cn";
import { getPlaceholderColor } from "../../utils/theme";

export type InputProps = TextInputProps & {
  className?: string;
};

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, placeholderTextColor, editable = true, ...props }, ref) => {
    const { colorScheme } = useColorScheme();
    const resolvedPlaceholder = placeholderTextColor ?? getPlaceholderColor(colorScheme);

    return (
      <TextInput
        ref={ref}
        editable={editable}
        placeholderTextColor={resolvedPlaceholder}
        className={cn(
          "h-12 rounded-xl border border-border/80 bg-bg-secondary px-4 text-base text-text-primary dark:border-border-dark/80 dark:bg-bg-secondary-dark dark:text-text-primary-dark",
          !editable && "opacity-60",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
