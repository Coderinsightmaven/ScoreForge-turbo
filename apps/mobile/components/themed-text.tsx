import { Text, type TextProps, StyleSheet } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'headline'
    | 'subtitle'
    | 'defaultSemiBold'
    | 'link'
    | 'stat'
    | 'label'
    | 'muted';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  const colors = useThemeColors();

  const colorForType = {
    default: colors.textSecondary,
    title: colors.textPrimary,
    headline: colors.textPrimary,
    subtitle: colors.textPrimary,
    defaultSemiBold: colors.textPrimary,
    link: colors.accent,
    stat: colors.accent,
    label: colors.textMuted,
    muted: colors.textMuted,
  };

  return (
    <Text
      style={[
        styles.base,
        { color: colors.textPrimary },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'headline' && styles.headline,
        type === 'subtitle' && styles.subtitle,
        type === 'defaultSemiBold' && styles.defaultSemiBold,
        type === 'link' && styles.link,
        type === 'stat' && styles.stat,
        type === 'label' && styles.label,
        type === 'muted' && styles.muted,
        { color: colorForType[type] },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.body,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.body,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.bodySemiBold,
  },
  title: {
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: -1,
    textTransform: 'uppercase',
    fontFamily: Fonts.display,
  },
  headline: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: Fonts.display,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.3,
    fontFamily: Fonts.bodyBold,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.bodySemiBold,
  },
  stat: {
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: 1,
    fontFamily: Fonts.mono,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: Fonts.bodySemiBold,
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
});
