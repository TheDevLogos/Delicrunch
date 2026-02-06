/**
 * XPRewardsModal - Modal de Recompensas y Gamificación
 * Se muestra después del modal de código de recogida
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
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDERS, SHADOWS } from '../src/constants/theme';
import { formatNumber } from '../src/utils/format';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const XPRewardsModal = ({ 
  visible, 
  onClose, 
  xpEarned = 0,
  levelUp = false,
  newLevel = 1,
  newBadges = [],
  newCoupons = [],
  progressToNext = 0, // Porcentaje de progreso al siguiente nivel (0-100)
  currentXP = 0,
  nextLevelXP = 100,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const xpCountAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const badgeScales = useRef(newBadges.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada principal
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();

      // Animación del contador de XP
      Animated.timing(xpCountAnim, {
        toValue: xpEarned,
        duration: 1500,
        useNativeDriver: true,
      }).start();

      // Animación de confeti si hay level up
      if (levelUp) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(confettiAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(confettiAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Animar badges uno por uno
      newBadges.forEach((_, index) => {
        Animated.sequence([
          Animated.delay(500 + index * 200),
          Animated.spring(badgeScales[index], {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0);
      xpCountAnim.setValue(0);
      confettiAnim.setValue(0);
      badgeScales.forEach(scale => scale.setValue(0));
    }
  }, [visible, levelUp, newBadges.length]);

  const interpolatedXP = xpCountAnim.interpolate({
    inputRange: [0, xpEarned],
    outputRange: [0, xpEarned],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={95} style={StyleSheet.absoluteFill} tint="dark" />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Level Up Banner */}
            {levelUp && (
              <View style={styles.levelUpBanner}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF6347']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.levelUpGradient}
                >
                  <Animated.View 
                    style={[
                      styles.confettiIcon,
                      {
                        opacity: confettiAnim,
                        transform: [
                          {
                            rotate: confettiAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <MaterialCommunityIcons name="party-popper" size={40} color="#FFF" />
                  </Animated.View>
                  <Text style={styles.levelUpText}>¡SUBISTE DE NIVEL!</Text>
                  <Text style={styles.newLevelText}>Nivel {newLevel}</Text>
                </LinearGradient>
              </View>
            )}

            {/* XP Card */}
            <View style={styles.xpCard}>
              <View style={styles.xpIconContainer}>
                <LinearGradient
                  colors={[COLORS.primary, '#00BFA5']}
                  style={styles.xpIconGradient}
                >
                  <MaterialCommunityIcons name="star-four-points" size={40} color="#FFF" />
                </LinearGradient>
              </View>
              
              <Text style={styles.xpTitle}>¡Ganaste XP!</Text>
              <Animated.Text style={styles.xpValue}>
                +{Math.round(interpolatedXP._value)} XP
              </Animated.Text>

              {/* Barra de progreso */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressToNext}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {currentXP} / {nextLevelXP} XP para nivel {newLevel + (levelUp ? 0 : 1)}
                </Text>
              </View>
            </View>

            {/* Nuevas insignias */}
            {newBadges.length > 0 && (
              <View style={styles.badgesSection}>
                <Text style={styles.sectionTitle}>
                  🏆 Nuevas Insignias Desbloqueadas
                </Text>
                <View style={styles.badgesGrid}>
                  {newBadges.map((badge, index) => (
                    <Animated.View
                      key={badge.id || index}
                      style={[
                        styles.badgeCard,
                        {
                          transform: [{ scale: badgeScales[index] || 0 }],
                        },
                      ]}
                    >
                      <View style={[styles.badgeIcon, { backgroundColor: badge.color || COLORS.primary }]}>
                        <Text style={styles.badgeEmoji}>{badge.icon || '🏅'}</Text>
                      </View>
                      <Text style={styles.badgeName}>{badge.name}</Text>
                      <Text style={styles.badgeDescription}>{badge.description}</Text>
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}

            {/* Nuevos cupones */}
            {newCoupons.length > 0 && (
              <View style={styles.couponsSection}>
                <Text style={styles.sectionTitle}>
                  🎁 Nuevos Cupones Ganados
                </Text>
                {newCoupons.map((coupon, index) => (
                  <View key={coupon.id || index} style={styles.couponCard}>
                    <View style={[styles.couponBadge, { backgroundColor: coupon.color || COLORS.primary }]}>
                      <Text style={styles.couponValue}>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                      </Text>
                      <Text style={styles.couponType}>OFF</Text>
                    </View>
                    <View style={styles.couponInfo}>
                      <Text style={styles.couponName}>{coupon.name}</Text>
                      <Text style={styles.couponDescription}>
                        {coupon.description || 'Usa este cupón en tu próxima compra'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </View>
                ))}
              </View>
            )}

            {/* Motivational message */}
            <View style={styles.motivationCard}>
              <MaterialCommunityIcons name="heart-outline" size={24} color={COLORS.error} />
              <Text style={styles.motivationText}>
                {levelUp 
                  ? '¡Increíble! Sigue salvando comida y el planeta.' 
                  : '¡Cada compra cuenta! Sigue acumulando XP.'}
              </Text>
            </View>

            {/* Botones */}
            <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryButtonText}>¡Genial!</Text>
            </TouchableOpacity>
          </ScrollView>

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
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.92,
    maxWidth: 440,
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: COLORS.card,
    borderRadius: BORDERS.radiusXl,
    overflow: 'hidden',
    ...SHADOWS.heavy,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  levelUpBanner: {
    marginBottom: SPACING.lg,
    borderRadius: BORDERS.radiusLg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  levelUpGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiIcon: {
    marginBottom: SPACING.sm,
  },
  levelUpText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  newLevelText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
    marginTop: SPACING.xs,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  xpCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDERS.radiusLg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  xpIconContainer: {
    marginBottom: SPACING.md,
  },
  xpIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  xpValue: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  progressContainer: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  badgesSection: {
    marginBottom: SPACING.lg,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: BORDERS.radiusMd,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badgeEmoji: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  couponsSection: {
    marginBottom: SPACING.lg,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDERS.radiusMd,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  couponBadge: {
    width: 60,
    height: 60,
    borderRadius: BORDERS.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  couponValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  couponType: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  couponInfo: {
    flex: 1,
  },
  couponName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  couponDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDERS.radiusMd,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radiusMd,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
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
    zIndex: 10,
  },
});

export default XPRewardsModal;
