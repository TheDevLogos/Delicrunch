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
  noShadow = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const getButtonColor = () => {
    switch (variant) {
      case 'primary':
        return COLORS.primary;
      case 'secondary':
        return COLORS.white;
      case 'accent':
        return COLORS.accent;
      default:
        return COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#666666';
    switch (variant) {
      case 'secondary':
        return COLORS.primary;
      default:
        return COLORS.white;
    }
  };

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const shadowOffset = isPressed ? 0 : SHADOWS.hard.offset;

  const isDisabled = disabled;
  const buttonBackgroundColor = isDisabled ? '#CCCCCC' : getButtonColor();
  const textColor = getTextColor();

  return (
    <View style={styles.container}>
      {/* Hard Shadow */}
      {!isDisabled && !noShadow && (
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
      )}

      {/* Button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: buttonBackgroundColor,
            borderColor: isDisabled ? '#999999' : COLORS.primary,
            borderWidth: BORDERS.width,
            borderRadius: BORDERS.radius.small,
            marginTop: !isDisabled && isPressed ? shadowOffset : 0,
            marginLeft: !isDisabled && isPressed ? shadowOffset : 0,
            opacity: isDisabled ? 0.6 : 1,
          },
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={isDisabled ? 0.6 : 1}
      >
        <Text
          style={[
            styles.text,
            {
              color: textColor,
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
