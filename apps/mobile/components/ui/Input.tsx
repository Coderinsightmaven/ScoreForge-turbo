import React from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";
import { useColorScheme } from "nativewind";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View>
      {label && (
        <Text className="mb-1.5 font-sans-semibold text-sm tracking-wide text-text-secondary dark:text-[#d1d5db]">
          {label}
        </Text>
      )}
      <TextInput
        className={`rounded-xl border-2 border-slate-200 bg-white px-5 py-4 font-sans text-base text-text-primary dark:border-[#2A2A2A] dark:bg-[#1E1E1E] dark:text-[#F5F5F3] ${
          error ? "border-red-500" : "focus:border-brand"
        } ${className}`}
        placeholderTextColor={isDark ? "#6b7280" : "#94A3B8"}
        {...props}
      />
      {error && <Text className="mt-1 font-sans text-sm text-red-500">{error}</Text>}
    </View>
  );
}
