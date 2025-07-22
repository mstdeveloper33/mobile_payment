import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  
  // Common shadows
  shadows: {
    sm: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: colors.shadowDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

export { colors, typography, spacing, borderRadius }; 