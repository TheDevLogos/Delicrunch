import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';

const GradientButton = ({ title, onPress, style, disabled, iconName }) => {
  const gradientColors = [COLORS.primary, '#0b7a6f'];

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8} style={style}>
      <LinearGradient colors={gradientColors} start={[0, 0]} end={[1, 0]} style={styles.gradient}>
        <View style={styles.inner}>
          {iconName && <Ionicons name={iconName} size={18} color="#fff" style={{ marginRight: 8 }} />}
          <Text style={styles.text}>{title}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});

export default GradientButton;
