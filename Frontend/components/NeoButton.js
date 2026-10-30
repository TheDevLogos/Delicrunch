import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../src/constants/theme';

const NeoButton = ({ title, onPress, variant = 'primary', disabled = false, style, textStyle }) => {
  const secondary = variant === 'secondary';
  return (
    <TouchableOpacity
      style={[styles.button, secondary && styles.secondary, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <Text style={[styles.text, secondary && styles.secondaryText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { minHeight: 52, backgroundColor: COLORS.primary, borderRadius: 15, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  disabled: { opacity: 0.55 },
  text: { color: COLORS.white, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  secondaryText: { color: COLORS.primaryDark },
});

export default NeoButton;
