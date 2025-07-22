import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const containerStyles = [
    styles.container,
    style,
  ];

  const inputContainerStyles = [
    styles.inputContainer,
    isFocused && styles.focusedInputContainer,
    error && styles.errorInputContainer,
    !editable && styles.disabledInputContainer,
  ];

  const textInputStyles = [
    styles.input,
    inputStyle,
    multiline && styles.multilineInput,
  ];

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={containerStyles}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={inputContainerStyles}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={textInputStyles}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={togglePasswordVisibility}
          >
            <Text style={styles.eyeIcon}>
              {isPasswordVisible ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  
  focusedInputContainer: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  
  errorInputContainer: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  
  disabledInputContainer: {
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.6,
  },
  
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  
  iconContainer: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  eyeIcon: {
    fontSize: 16,
  },
  
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default Input; 