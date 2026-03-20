/**
 * CouponModal - Tarjeta de información de cupones por nivel
 * Diseño profesional con header coloreado, estado, secciones y barra de progreso
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, LAYOUT } from '../src/constants/theme';
import { COUPON_CATEGORIES, LEVELS, LEVEL_TIERS } from '../src/constants/gamification';

const { width } = Dimensions.get('window');

const CouponModal = ({ coupon, visible, onClose, onUse, locked, levelRequired, currentXP = 0 }) => {
  const slideAnim = useRef(new Animated.Value(320)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 90, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 320, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!coupon) return null;

  const categoryInfo = COUPON_CATEGORIES[coupon.category] || COUPON_CATEGORIES.ALL;
  const accentColor = coupon.color || categoryInfo.color || COLORS.primary;
  const requiredLevelData = LEVELS.find(l => l.level === levelRequired);
  const requiredXP = requiredLevelData?.xpRequired || 0;
  const tierInfo = requiredLevelData
    ? (LEVEL_TIERS[requiredLevelData.tier] || LEVEL_TIERS.BRONZE)
    : LEVEL_TIERS.BRONZE;

  const progressPercent = locked && requiredXP > 0
    ? Math.min(100, Math.floor((currentXP / requiredXP) * 100))
    : 100;
  const xpRemaining = locked ? Math.max(0, requiredXP - currentXP) : 0;

  const getDiscountLabel = () => {
    switch (coupon.type) {
      case 'percentage': return `${coupon.value}% OFF`;
      case 'fixed': return `$${coupon.value} OFF`;
      case '2x1': return '2 × 1';
      case 'free_item': return 'GRATIS';
      default: return 'Descuento';
    }
  };

  const getDiscountSublabel = () => {
    switch (coupon.type) {
      case 'percentage': return `Descuento del ${coupon.value}% en tu pedido`;
      case 'fixed': return `Ahorra $${coupon.value} pesos fijos`;
      case '2x1': return 'Lleva 2 productos, paga 1';
      case 'free_item': return 'Un producto gratis con tu pedido';
      default: return 'Descuento especial';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        {/* Fondo táctil para cerrar */}
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>

          {/* ══════════ HEADER COLOREADO ══════════ */}
          <View style={[styles.cardHeader, { backgroundColor: accentColor }]}>
            {/* Ícono decorativo de fondo */}
            <View style={styles.headerBgIcon} pointerEvents="none">
              <Ionicons name={coupon.icon || 'ticket'} size={96} color="rgba(255,255,255,0.15)" />
            </View>

            {/* Valor del descuento */}
            <View style={styles.discountBlock}>
              <Text style={styles.discountValue}>{getDiscountLabel()}</Text>
              <Text style={styles.discountSub}>{getDiscountSublabel()}</Text>
            </View>

            {/* Botón cerrar */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ══════════ CUERPO ══════════ */}
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bodyScroll}
          >
            {/* Nombre y categoría */}
            <Text style={styles.couponName}>{coupon.name}</Text>

            <View style={[styles.categoryPill, { backgroundColor: accentColor + '20' }]}>
              <Ionicons name={categoryInfo.icon || 'grid'} size={12} color={accentColor} />
              <Text style={[styles.categoryLabel, { color: accentColor }]}>{categoryInfo.name}</Text>
            </View>

            {/* Badge de estado */}
            <View style={styles.statusRow}>
              {locked ? (
                <View style={[styles.statusBadge, { backgroundColor: '#FF950020' }]}>
                  <Ionicons name="lock-closed" size={13} color="#FF9500" />
                  <Text style={[styles.statusText, { color: '#FF9500' }]}>
                    Bloqueado · Requiere Nivel {levelRequired}
                  </Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: '#34C75920' }]}>
                  <Ionicons name="checkmark-circle" size={13} color="#34C759" />
                  <Text style={[styles.statusText, { color: '#34C759' }]}>
                    Desbloqueado · ¡Disponible!
                  </Text>
                </View>
              )}
            </View>

            {/* Descripción */}
            {!!coupon.description && (
              <Text style={styles.description}>{coupon.description}</Text>
            )}

            {/* ── Sección Detalles ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detalles</Text>
              <View style={styles.detailsGrid}>

                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: accentColor + '15' }]}>
                    <Ionicons name="calendar-outline" size={18} color={accentColor} />
                  </View>
                  <Text style={styles.detailLabel}>Vigencia</Text>
                  <Text style={styles.detailValue}>{coupon.validDays || 30} días</Text>
                </View>

                {(coupon.minPurchase > 0) && (
                  <View style={styles.detailItem}>
                    <View style={[styles.detailIcon, { backgroundColor: '#007AFF15' }]}>
                      <Ionicons name="cart-outline" size={18} color="#007AFF" />
                    </View>
                    <Text style={styles.detailLabel}>Compra mín.</Text>
                    <Text style={styles.detailValue}>${coupon.minPurchase} MXN</Text>
                  </View>
                )}

                {(coupon.maxDiscount > 0 && coupon.type === 'percentage') && (
                  <View style={styles.detailItem}>
                    <View style={[styles.detailIcon, { backgroundColor: '#FF950015' }]}>
                      <Ionicons name="pricetag-outline" size={18} color="#FF9500" />
                    </View>
                    <Text style={styles.detailLabel}>Máx. ahorro</Text>
                    <Text style={styles.detailValue}>${coupon.maxDiscount} MXN</Text>
                  </View>
                )}

                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: (tierInfo.color || COLORS.primary) + '20' }]}>
                    <Ionicons name={tierInfo.icon || 'shield'} size={18} color={tierInfo.color || COLORS.primary} />
                  </View>
                  <Text style={styles.detailLabel}>Nivel req.</Text>
                  <Text style={[styles.detailValue, { color: tierInfo.color }]}>
                    {requiredLevelData?.title || `Nivel ${levelRequired}`}
                  </Text>
                </View>

              </View>
            </View>

            {/* ── Sección Progreso (solo si bloqueado) ── */}
            {locked && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tu progreso</Text>
                <View style={styles.progressInfoRow}>
                  <Text style={styles.progressXP}>
                    {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
                  </Text>
                  <Text style={[styles.progressPercent, { color: tierInfo.color || accentColor }]}>
                    {progressPercent}%
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercent}%`, backgroundColor: accentColor },
                    ]}
                  />
                </View>
                <View style={styles.xpRemainingRow}>
                  <Ionicons name="information-circle-outline" size={14} color={COLORS.textTertiary} />
                  <Text style={styles.xpRemainingText}>
                    Faltan {xpRemaining.toLocaleString()} XP para desbloquear este cupón
                  </Text>
                </View>
              </View>
            )}

            {/* ── Tips para ganar XP (solo si bloqueado) ── */}
            {locked && (
              <View style={styles.tipsSection}>
                <Text style={styles.sectionTitle}>¿Cómo ganar XP rápido?</Text>
                <View style={styles.tipsRow}>
                  <View style={styles.tipItem}>
                    <View style={[styles.tipIcon, { backgroundColor: '#34C75920' }]}>
                      <Ionicons name="bag-check" size={16} color="#34C759" />
                    </View>
                    <Text style={styles.tipLabel}>Compra packs</Text>
                    <Text style={styles.tipDesc}>+32 XP c/u</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <View style={[styles.tipIcon, { backgroundColor: '#FF950020' }]}>
                      <Ionicons name="flash" size={16} color="#FF9500" />
                    </View>
                    <Text style={styles.tipLabel}>Flash Deals</Text>
                    <Text style={styles.tipDesc}>+75% XP</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <View style={[styles.tipIcon, { backgroundColor: '#FF3B3020' }]}>
                      <Ionicons name="flame" size={16} color="#FF3B30" />
                    </View>
                    <Text style={styles.tipLabel}>Mantén racha</Text>
                    <Text style={styles.tipDesc}>Bonus diario</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* ══════════ BOTONES DE ACCIÓN ══════════ */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                locked ? styles.actionBtnLocked : { backgroundColor: accentColor },
              ]}
              onPress={() => !locked && onUse?.(coupon)}
              disabled={locked}
            >
              {locked ? (
                <>
                  <Ionicons name="lock-closed" size={16} color="#8E8E93" />
                  <Text style={styles.actionTextLocked}>Bloqueado</Text>
                </>
              ) : (
                <>
                  <Ionicons name="gift" size={16} color="#fff" />
                  <Text style={styles.actionText}>Obtener cupón</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: COLORS.surface || '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '88%',
    ...SHADOWS.heavy,
  },

  // ── Header ──
  cardHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.mld,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerBgIcon: {
    position: 'absolute',
    right: -10,
    bottom: -12,
  },
  discountBlock: {
    flex: 1,
  },
  discountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  discountSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },

  // ── Body ──
  bodyScroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  couponName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text || '#111',
    marginBottom: SPACING.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: SPACING.smd,
    gap: 5,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusRow: {
    marginBottom: SPACING.smd,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary || '#666',
    lineHeight: 20,
    marginBottom: SPACING.smd,
  },

  // ── Sección ──
  section: {
    backgroundColor: COLORS.background || '#F8F9FA',
    borderRadius: 16,
    padding: SPACING.smd,
    marginBottom: SPACING.sm,
  },
  tipsSection: {
    backgroundColor: COLORS.background || '#F8F9FA',
    borderRadius: 16,
    padding: SPACING.smd,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textTertiary || '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },

  // ── Detalles grid ──
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  detailItem: {
    alignItems: 'center',
    minWidth: (width - 72) / 4,
    flex: 1,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 10,
    color: COLORS.textTertiary || '#8E8E93',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text || '#111',
    textAlign: 'center',
  },

  // ── Progreso ──
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressXP: {
    fontSize: 13,
    color: COLORS.textSecondary || '#666',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpRemainingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  xpRemainingText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textTertiary || '#8E8E93',
    lineHeight: 17,
  },

  // ── Tips ──
  tipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tipItem: {
    alignItems: 'center',
    flex: 1,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text || '#333',
    textAlign: 'center',
  },
  tipDesc: {
    fontSize: 10,
    color: COLORS.textTertiary || '#8E8E93',
    textAlign: 'center',
    marginTop: 2,
  },

  // ── Acciones ──
  actionsRow: {
    flexDirection: 'row',
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
    backgroundColor: COLORS.surface || '#fff',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text || '#333',
  },
  actionBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  actionBtnLocked: {
    backgroundColor: '#E5E5EA',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  actionTextLocked: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8E8E93',
  },
});

export default CouponModal;
