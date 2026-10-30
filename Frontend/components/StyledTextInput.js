import React, { useState, useRef } from 'react';
import { TextInput, StyleSheet, Platform, View, Text, TouchableWithoutFeedback } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDERS, SHADOWS, SPACING } from '../src/constants/theme';

// StyledTextInput ahora muestra un helper overlay (placeholder estilizado)
// El overlay es más pequeño y semi-transparente, y desaparece cuando el input tiene valor o está en foco.
const StyledTextInput = (props) => {
  const { style, value, onFocus: onFocusProp, onBlur: onBlurProp, placeholder } = props;
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const handleFocus = (e) => {
    setFocused(true);
    if (onFocusProp) onFocusProp(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    if (onBlurProp) onBlurProp(e);
  };

  const showHelper = !focused && (!value || value === '') && placeholder;

  return (
    <View style={[styles.container, props.containerStyle]}>
      <TextInput
        ref={inputRef}
        {...props}
        placeholder={''} // ocultamos placeholder nativo para usar el overlay estilizado
        style={[
          styles.input,
          style,
          // Forzar color negro al recibir foco para asegurar visibilidad al escribir
          { color: focused ? COLORS.black : (style && style.color) || COLORS.text },
        ]}
        placeholderTextColor={COLORS.textTertiary}
        cursorColor={COLORS.primary}
        selectionColor={COLORS.primary}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      {showHelper && (
        <TouchableWithoutFeedback onPress={() => { inputRef.current && inputRef.current.focus(); }}>
          <Text style={styles.helperText}>{placeholder}</Text>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.text,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.04,
        shadowRadius: 5,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  helperText: {
    position: 'absolute',
    left: SPACING.md + 2,
    top: 14,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: 'rgba(0,0,0,0.45)',
    fontWeight: '600',
    pointerEvents: 'none',
  },
});

export default StyledTextInput;
