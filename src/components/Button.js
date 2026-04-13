import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS, FONTS, SPACING } from '../constants/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary', // primary | secondary | outline | danger
  size = 'md', // sm | md | lg
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) {
  const bgColor = {
    primary: COLORS.primary,
    secondary: COLORS.accent,
    outline: 'transparent',
    danger: COLORS.danger,
  }[variant];

  const txtColor = variant === 'outline' ? COLORS.primary : COLORS.white;
  const borderColor = variant === 'outline' ? COLORS.primary : 'transparent';

  const paddingV = { sm: 8, md: 14, lg: 18 }[size];
  const fontSize = { sm: FONTS.sizes.sm, md: FONTS.sizes.lg, lg: FONTS.sizes.xl }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? COLORS.disabled : bgColor,
          paddingVertical: paddingV,
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={txtColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: txtColor, fontSize }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  text: {
    fontWeight: '600',
  },
});
