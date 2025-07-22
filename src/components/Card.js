import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

const Card = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  const cardStyles = [
    styles.card,
    styles[`${variant}Card`],
    styles[`${padding}Padding`],
    style,
  ];

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Variants
  defaultCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  elevatedCard: {
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  
  flatCard: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  
  // Padding variants
  nonePadding: {
    padding: 0,
  },
  
  smPadding: {
    padding: spacing.sm,
  },
  
  mdPadding: {
    padding: spacing.lg,
  },
  
  lgPadding: {
    padding: spacing.xl,
  },
});

export default Card; 