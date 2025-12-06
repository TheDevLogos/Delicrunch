import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDERS, SHADOWS, SPACING } from '../src/constants/theme';

const NeoButton = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const getButtonColor = () => {
    switch (variant) {
      case 'primary':
        return COLORS.primary;
      case 'secondary':
        return COLORS.secondary;
      case 'accent':
        return COLORS.accent;
      default:
        return COLORS.primary;
    }
  };

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const shadowOffset = isPressed ? 0 : SHADOWS.hard.offset;

  return (
    <View style={styles.container}>
      {/* Hard Shadow */}
      <View
        style={[
          styles.shadow,
          {
            backgroundColor: SHADOWS.hard.color,
            top: shadowOffset,
            left: shadowOffset,
          },
        ]}
      />

      {/* Button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: getButtonColor(),
            borderColor: COLORS.border,
            borderWidth: BORDERS.width,
            borderRadius: BORDERS.radius.small,
            marginTop: isPressed ? shadowOffset : 0,
            marginLeft: isPressed ? shadowOffset : 0,
          },
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <Text
          style={[
            styles.text,
            {
              color: COLORS.text,
              fontSize: TYPOGRAPHY.fontSize.button,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              textTransform: TYPOGRAPHY.textTransform.uppercase,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: BORDERS.radius.small,
  },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
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
    }),
  },
  text: {
    textAlign: 'center',
  },
});

export default NeoButton;
