import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

// Definimos nuestra paleta de colores para los botones
const COLORS = {
  primary: '#0A84FF',
  success: '#30D158',
  danger: '#ff3b30',
  white: '#fff',
  lightGray: '#E5E5EA', // Un gris claro para el estado deshabilitado
};

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

  // Aplicamos estilos basados en la variante
  if (variant === 'secondary') {
    buttonStyles.push(styles.secondaryButton);
    textStyles.push(styles.secondaryButtonText);
  } else if (variant === 'success') {
    buttonStyles.push({ backgroundColor: COLORS.success });
  } else if (variant === 'danger') {
    buttonStyles.push({ backgroundColor: COLORS.danger });
  } else {
    buttonStyles.push({ backgroundColor: COLORS.primary });
  }

  // Aplicamos estilo para el estado deshabilitado o de carga
  if (disabled || isLoading) {
    buttonStyles.push(styles.buttonDisabled);
  }

  // Aplicamos estilos personalizados pasados por props
  buttonStyles.push(style);
  textStyles.push(textStyle);

  return (
    <TouchableOpacity 
      style={buttonStyles} 
      onPress={onPress} 
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'secondary' ? COLORS.primary : COLORS.white} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { width: '100%', height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginTop: 10 },
  buttonText: { color: COLORS.white, fontSize: 17, fontWeight: '600' },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  buttonDisabled: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.lightGray,
  },
});

export default StyledButton;