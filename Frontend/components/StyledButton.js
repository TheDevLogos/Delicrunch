import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS } from '../src/constants/theme';

const StyledButton = ({
  title,
  onPress,
  disabled,
  style,
  textStyle,
  variant = 'primary', // 'primary', 'secondary', 'success', 'danger'
  isLoading = false,
}) => {
  // Construimos los estilos dinámicamente
  const buttonStyles = [styles.button];
  const textStyles = [styles.buttonText];
  let spinnerColor = COLORS.white;

  // Aplicamos estilos basados en la variante
  if (variant === 'secondary') {
    buttonStyles.push(styles.secondaryButton);
    textStyles.push(styles.secondaryButtonText);
    spinnerColor = COLORS.primary;
  } else if (variant === 'success') {
    buttonStyles.push({ backgroundColor: COLORS.success });
  } else if (variant === 'danger') {
    buttonStyles.push({ backgroundColor: COLORS.error });
  } else {
    buttonStyles.push({ backgroundColor: COLORS.primary });
  }

  // Aplicamos estilo para el estado deshabilitado o de carga
  if (disabled || isLoading) {
    buttonStyles.push(styles.buttonDisabled);
    textStyles.push(styles.buttonDisabledText);
  }

  // Aplicamos estilos personalizados pasados por props
  buttonStyles.push(style);
  textStyles.push(textStyle);

  return (
    <TouchableOpacity 
      style={buttonStyles} 
      onPress={onPress} 
      disabled={disabled || isLoading}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || isLoading), busy: Boolean(isLoading) }}
    >
      {isLoading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { width: '100%', minHeight: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 16, paddingHorizontal: 18, marginTop: 10, ...SHADOWS.sm },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  buttonDisabled: {
    backgroundColor: '#E8DED5',
    borderColor: '#E8DED5',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabledText: {
    color: COLORS.textSecondary,
  },
});

export default StyledButton;
