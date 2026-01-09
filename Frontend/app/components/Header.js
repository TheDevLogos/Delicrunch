import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../src/constants/theme';

const Header = ({ title = 'DELICRUNCH', subtitle = 'RESCATA • COME • AHORRA', large = false }) => {
  return (
    <View style={styles.headerTop}>
      <Image
        source={require('../../assets/Crunchy.png')}
        style={[styles.topLogo, large ? styles.topLogoLarge : null]}
        resizeMode="contain"
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerTop: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  topLogo: {
    width: 110,
    height: 110,
    marginBottom: SPACING.sm,
  },
  topLogoLarge: {
    width: 165,
    height: 165,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '700',
  },
});

export default Header;
