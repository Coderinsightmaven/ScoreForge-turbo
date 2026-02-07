import React from "react";
import { Text as RNText, TextProps } from "react-native";

type TextVariant =
  | "display"
  | "hero"
  | "title"
  | "heading"
  | "subheading"
  | "body-lg"
  | "body"
  | "small"
  | "caption"
  | "label";

interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
}

const variantClasses: Record<TextVariant, string> = {
  display: "font-display-bold text-5xl tracking-tighter text-text-primary dark:text-[#F5F5F3]",
  hero: "font-display-bold text-4xl tracking-tight text-text-primary dark:text-[#F5F5F3]",
  title: "font-display-semibold text-3xl tracking-tight text-text-primary dark:text-[#F5F5F3]",
  heading: "font-display-semibold text-2xl text-text-primary dark:text-[#F5F5F3]",
  subheading: "font-display-semibold text-xl text-text-primary dark:text-[#F5F5F3]",
  "body-lg": "font-sans text-xl text-text-primary dark:text-[#F5F5F3]",
  body: "font-sans text-lg text-text-primary dark:text-[#F5F5F3]",
  small: "font-sans text-base text-text-secondary dark:text-[#d1d5db]",
  caption:
    "font-sans-medium text-sm uppercase tracking-widest text-text-tertiary dark:text-[#9ca3af]",
  label: "font-sans-semibold text-base tracking-wide text-text-secondary dark:text-[#d1d5db]",
};

export function ThemedText({ variant = "body", className = "", ...props }: ThemedTextProps) {
  return <RNText className={`${variantClasses[variant]} ${className}`} {...props} />;
}
