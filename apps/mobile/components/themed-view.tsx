import { View, type ViewProps } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'card';
};

export function ThemedView({ style, variant = 'primary', ...otherProps }: ThemedViewProps) {
  const colors = useThemeColors();

  const backgroundColor =
    variant === 'primary'
      ? colors.bgPrimary
      : variant === 'secondary'
        ? colors.bgSecondary
        : variant === 'tertiary'
          ? colors.bgTertiary
          : colors.bgCard;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
