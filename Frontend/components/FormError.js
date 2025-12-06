import React from 'react';
import { Text, StyleSheet } from 'react-native';

/**
 * Un componente simple para mostrar un mensaje de error en un formulario.
 * Solo se renderiza si la prop 'error' tiene un valor.
 * @param {{error: string | null}} props
 */
const FormError = ({ error }) => {
  if (!error) {
    return null;
  }
  return <Text style={styles.errorText}>{error}</Text>;
};

const styles = StyleSheet.create({
  errorText: { color: '#ff3b30', fontSize: 14, textAlign: 'center', marginBottom: 15, width: '100%' },
});

export default FormError;