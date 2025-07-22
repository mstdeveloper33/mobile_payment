import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const buttonStyles = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    (disabled || loading) && styles.disabledButton,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    (disabled || loading) && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.white : colors.primary}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
  },
  
  // Variants
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  smButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 32,
  },
  mdButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  lgButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 52,
  },
  
  // Disabled state
  disabledButton: {
    opacity: 0.5,
  },
  
  // Text styles
  text: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  
  // Text variants
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.primary,
  },
  
  // Text sizes
  smText: {
    fontSize: typography.fontSize.sm,
  },
  mdText: {
    fontSize: typography.fontSize.base,
  },
  lgText: {
    fontSize: typography.fontSize.lg,
  },
  
  disabledText: {
    opacity: 0.7,
  },
});

export default Button; 