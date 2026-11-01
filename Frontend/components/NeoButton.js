import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../src/constants/theme';

const NeoButton = ({ title, onPress, variant = 'primary', disabled = false, style, textStyle }) => {
  const secondary = variant === 'secondary';
  return (
    <TouchableOpacity
      style={[styles.button, secondary && styles.secondary, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.84}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.text, secondary && styles.secondaryText, disabled && styles.disabledText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { minHeight: 52, backgroundColor: COLORS.primary, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  secondary: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, shadowOpacity: 0, elevation: 0 },
  disabled: { backgroundColor: '#E8DED5', borderWidth: 1, borderColor: '#E8DED5', shadowOpacity: 0, elevation: 0 },
  text: { color: COLORS.white, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryText: { color: COLORS.primaryDark },
  disabledText: { color: COLORS.textSecondary },
});

export default NeoButton;
