import * as React from "react";
import { Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";

import { cn } from "../../utils/cn";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "brand"
  | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "border-border bg-foreground text-background dark:border-border-dark dark:bg-foreground-dark dark:text-background-dark",
  secondary:
    "border-border bg-secondary text-secondary-foreground dark:border-border-dark dark:bg-secondary-dark dark:text-secondary-foreground-dark",
  outline:
    "border-border bg-transparent text-foreground dark:border-border-dark dark:text-foreground-dark",
  ghost: "border-transparent bg-transparent text-muted-foreground dark:text-muted-foreground-dark",
  destructive:
    "border-error bg-error text-text-inverse dark:border-error-dark dark:bg-error-dark dark:text-text-inverse-dark",
  brand:
    "border-brand/60 bg-brand text-text-inverse shadow-lg shadow-brand/20 dark:border-brand-dark/60 dark:bg-brand-dark dark:text-text-inverse-dark",
  link: "border-transparent bg-transparent text-foreground underline",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-5",
  sm: "h-9 px-4",
  lg: "h-12 px-6",
  icon: "h-10 w-10",
};

const textClasses: Record<ButtonVariant, string> = {
  default: "text-background dark:text-background-dark",
  secondary: "text-secondary-foreground dark:text-secondary-foreground-dark",
  outline: "text-foreground dark:text-foreground-dark",
  ghost: "text-muted-foreground dark:text-muted-foreground-dark",
  destructive: "text-text-inverse dark:text-text-inverse-dark",
  brand: "text-text-inverse dark:text-text-inverse-dark",
  link: "text-foreground dark:text-foreground-dark",
};

const textSizeClasses: Record<ButtonSize, string> = {
  default: "text-sm",
  sm: "text-xs",
  lg: "text-base",
  icon: "text-sm",
};

export type ButtonProps = TouchableOpacityProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  textClassName?: string;
};

export function Button({
  variant = "default",
  size = "default",
  className,
  textClassName,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const buttonTextClassName = cn(
    "font-semibold tracking-[0.06em]",
    textSizeClasses[size],
    textClasses[variant],
    textClassName
  );
  const content = React.Children.map(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      return <Text className={buttonTextClassName}>{child}</Text>;
    }
    return child;
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-xl border",
        sizeClasses[size],
        variantClasses[variant],
        disabled && "opacity-40",
        className
      )}
      {...props}>
      {content}
    </TouchableOpacity>
  );
}
