import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, COLORS } from '../../src/constants/theme';

const PromoCard = ({ title = 'Rescata Packs Deliciosos', subtitle = 'Salva comida de primera, gana puntos y ahorra dinero', exp = '+50' }) => {
  return (
    <View style={styles.promoCard}>
      <Text style={styles.promoTitle}>{title}</Text>
      <Text style={styles.promoSubtitle}>{subtitle}</Text>
      <View style={styles.promoRow}>
        <Text style={styles.expValue}>{exp}</Text>
        <View style={styles.expLabelCol}>
          <Text style={styles.expLabel}>EXP POR ORDEN</Text>
          <Text style={styles.heroLabel}>SÉ HÉROE</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  promoCard: {
    backgroundColor: '#f6fffa',
    borderRadius: 14,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#e6f6ee',
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#b85b12',
    textAlign: 'center',
    marginBottom: 6,
  },
  promoSubtitle: {
    fontSize: 13,
    color: '#556',
    textAlign: 'center',
    marginBottom: 8,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  expValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#d95b1f',
    marginRight: 8,
  },
  expLabelCol: {
    alignItems: 'flex-start',
  },
  expLabel: {
    fontSize: 11,
    color: '#444',
    fontWeight: '700',
  },
  heroLabel: {
    fontSize: 11,
    color: '#444',
    fontWeight: '600',
  },
});

export default PromoCard;
