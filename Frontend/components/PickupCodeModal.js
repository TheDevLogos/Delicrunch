/**
 * PickupCodeModal - Modal de Código de Recogida
 * Se muestra después de completar el pago con Mercado Pago
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDERS, SHADOWS, TYPOGRAPHY } from '../src/constants/theme';
import { formatPrice, formatNumber } from '../src/utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PickupCodeModal = ({ 
  visible, 
  onClose, 
  pickupCode, 
  storeName, 
  storeAddress,
  pickupStart,
  pickupEnd,
  productName,
  quantity,
  total,
  savings,
  co2Saved,
  onViewOrder,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Animaciones de entrada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Animación de pulso para el código
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Mi código de recogida Delicrunch!\n\n` +
                 `Código: ${pickupCode}\n` +
                 `Comercio: ${storeName}\n` +
                 `Horario: ${pickupStart} - ${pickupEnd}\n\n` +
                 `¡Salvando comida y el planeta! 🌱`,
        title: 'Mi código de recogida',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="dark" />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <View style={styles.successIconBg}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
            </View>
          </View>

          {/* Título */}
          <Text style={styles.title}>¡Pago Exitoso! 🎉</Text>
          <Text style={styles.subtitle}>Tu pedido está confirmado</Text>

          {/* Código de recogida prominente */}
          <Animated.View 
            style={[
              styles.codeCard,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <View style={styles.codeHeader}>
              <MaterialCommunityIcons name="qrcode" size={24} color={COLORS.primary} />
              <Text style={styles.codeLabel}>Código de Recogida</Text>
            </View>
            <Text style={styles.codeValue}>{pickupCode}</Text>
            <Text style={styles.codeNote}>Muestra este código al comercio</Text>
          </Animated.View>

          {/* Información del comercio */}
          <View style={styles.storeCard}>
            <View style={styles.storeHeader}>
              <Ionicons name="storefront" size={20} color={COLORS.primary} />
              <Text style={styles.storeName}>{storeName}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{storeAddress}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>
                Recoge entre {pickupStart} - {pickupEnd}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="food" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>
                {productName} × {quantity}
              </Text>
            </View>
          </View>

          {/* Resumen de impacto */}
          <View style={styles.impactCard}>
            <Text style={styles.impactTitle}>Tu Impacto</Text>
            <View style={styles.impactRow}>
              <View style={styles.impactItem}>
                <View style={[styles.impactBadge, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialCommunityIcons name="cash" size={20} color={COLORS.success} />
                </View>
                <Text style={styles.impactLabel}>Ahorraste</Text>
                <Text style={styles.impactValue}>${formatPrice(savings)}</Text>
              </View>
              
              <View style={styles.impactDivider} />
              
              <View style={styles.impactItem}>
                <View style={[styles.impactBadge, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialCommunityIcons name="leaf" size={20} color="#2196F3" />
                </View>
                <Text style={styles.impactLabel}>CO₂ evitado</Text>
                <Text style={styles.impactValue}>{formatNumber(co2Saved, 1)} kg</Text>
              </View>
            </View>
          </View>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Ionicons name="share-social" size={20} color={COLORS.primary} />
              <Text style={styles.shareButtonText}>Compartir</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={onViewOrder}
            >
              <Text style={styles.primaryButtonText}>Ver mi pedido</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: BORDERS.radiusXl,
    padding: SPACING.xl,
    ...SHADOWS.heavy,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  successIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  codeCard: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: BORDERS.radiusLg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 4,
    marginBottom: SPACING.xs,
  },
  codeNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  storeCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDERS.radiusMd,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  impactCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDERS.radiusMd,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  impactItem: {
    alignItems: 'center',
    flex: 1,
  },
  impactBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  impactLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  impactValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  impactDivider: {
    width: 1,
    height: 60,
    backgroundColor: COLORS.border,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: BORDERS.radiusMd,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radiusMd,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PickupCodeModal;
