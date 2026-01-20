import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDERS } from '../src/constants/theme';

const { width } = Dimensions.get('window');

const CouponModal = ({ coupon, visible, onClose, onUse, locked, levelRequired }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !coupon) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}> 
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.iconWrap, { backgroundColor: coupon.color || '#34C759' }]}> 
          <Ionicons name={coupon.icon || 'gift'} size={36} color="#fff" />
        </View>
        <Text style={styles.title}>{coupon.name}</Text>
        <Text style={styles.desc}>{coupon.description}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Requisito:</Text>
          <Text style={styles.metaValue}>Nivel {levelRequired}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Válido:</Text>
          <Text style={styles.metaValue}>{coupon.validDays || 30} días</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.useBtn, locked && styles.useBtnDisabled]}
            onPress={() => { if (!locked) onUse && onUse(coupon); }}
            disabled={locked}
          >
            <Text style={styles.useText}>{locked ? 'Bloqueado' : 'Usar cupón'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    width: width * 0.86,
    backgroundColor: COLORS.surface || '#fff',
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text || '#333',
    textAlign: 'center',
  },
  desc: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.textSecondary || '#666',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 6,
  },
  metaLabel: { color: '#777', fontSize: 13 },
  metaValue: { color: '#333', fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    width: '100%',
    justifyContent: 'space-between',
  },
  closeBtn: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
  },
  closeText: { color: '#333', fontWeight: '700' },
  useBtn: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F97316',
  },
  useBtnDisabled: {
    backgroundColor: '#D1D1D6',
  },
  useText: { color: '#fff', fontWeight: '700' },
});

export default CouponModal;
