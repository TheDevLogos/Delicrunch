import React from 'react';
import { TextInput, StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDERS, SHADOWS, SPACING } from '../src/constants/theme';

// Este componente acepta todas las propiedades de un TextInput normal (como placeholder, onChangeText, etc.)
// y les añade nuestro estilo personalizado de Neobrutalism Pop.
const StyledTextInput = (props) => {
  return (
    <TextInput
      {...props} // Pasa todas las props al TextInput
      style={[styles.input, props.style]} // Combina nuestros estilos con cualquier estilo adicional que se le pase
      placeholderTextColor={COLORS.text} // Color del texto de ejemplo
    />
  );
};

const styles = StyleSheet.create({
  input: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.white,
    borderWidth: BORDERS.width,
    borderColor: COLORS.border,
    borderRadius: BORDERS.radius.small,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.body,
    color: COLORS.text,
    ...Platform.select({
      ios: {
        shadowColor: SHADOWS.hard.color,
        shadowOffset: {
          width: SHADOWS.hard.offset,
          height: SHADOWS.hard.offset,
        },
        shadowOpacity: SHADOWS.hard.opacity,
        shadowRadius: SHADOWS.hard.radius,
      },
      android: {
        elevation: SHADOWS.hard.elevation,
      },
    }),
  },
});

export default StyledTextInput;
