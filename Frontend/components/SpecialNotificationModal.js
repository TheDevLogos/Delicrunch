/**
 * SpecialNotificationModal - Notificaciones emergentes para compradores
 * Muestra productos destacados: recién subidos, hot sale, por cerrar, bien calificados
 * Estilo Neo Brutalism con preguntas atractivas sobre ayudar al planeta
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';
import { formatPrice, formatNumber } from '../src/utils/format';
import { calculateXP } from '../src/constants/gamification';

const { width, height } = Dimensions.get('window');

// Helper para formatear calificación de forma segura
const formatRating = (rating) => {
  if (rating === null || rating === undefined || isNaN(rating)) return '4.5';
  return formatNumber(rating, 1);
};

// Preguntas atractivas para cada tipo de notificación
const NOTIFICATION_HOOKS = {
  new: [
    '🌱 ¿Sabías que acabamos de rescatar comida deliciosa?',
    '✨ ¡Algo nuevo llegó! ¿Listo para salvarlo?',
    '🍽️ ¿Y si hoy rescatas algo recién salido?',
    '🌍 ¡Nueva oportunidad de ser héroe del planeta!',
  ],
  hot_sale: [
    '🔥 ¿Buscas el mejor precio para ayudar al planeta?',
    '💰 ¿Qué tal ahorrar Y salvar comida?',
    '🏷️ ¡Oferta que no puedes dejar pasar!',
    '⚡ ¿Listo para una súper oferta verde?',
  ],
  closing_soon: [
    '⏰ ¡Últimas horas! ¿Lo rescatas?',
    '🏃 ¡Corre! Esta comida te necesita AHORA',
    '⌛ ¿Llegas a tiempo para salvarla?',
    '🚨 ¡Alerta! Está por cerrarse...',
  ],
  top_rated: [
    '⭐ ¿Por qué todos lo aman? Descúbrelo',
    '👑 Los mejores lo recomiendan, ¿tú qué esperas?',
    '💯 ¡El favorito de la comunidad!',
    '🏆 ¿Quieres probar lo mejor calificado?',
  ],
  favorite_store: [
    '💚 ¡Tu tienda favorita tiene algo nuevo!',
    '🎉 ¿Adivina quién tiene pack disponible?',
    '✨ ¡Tu favorito está listo para ti!',
  ],
  nearby: [
    '📍 ¡Mira lo que hay cerca de ti!',
    '🗺️ A pocos pasos puedes hacer la diferencia',
    '🚶 ¡Tan cerca que casi puedes olerlo!',
  ],
};

// Mensajes de impacto ambiental
const ECO_MESSAGES = [
  '🌍 Cada pack salvado = menos CO₂',
  '🌱 Juntos reducimos el desperdicio',
  '💚 Tu compra hace la diferencia',
  '♻️ Salvando comida, salvando el planeta',
  '🌿 Pequeñas acciones, gran impacto',
];

const SpecialNotificationModal = ({ 
  visible, 
  onClose, 
  product, 
  notificationType = 'new',
  navigation,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Entrada animada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulso en el botón
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      scaleAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  if (!product) return null;

  const hooks = NOTIFICATION_HOOKS[notificationType] || NOTIFICATION_HOOKS.new;
  const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
  const ecoMessage = ECO_MESSAGES[Math.floor(Math.random() * ECO_MESSAGES.length)];

  const discount = product.precio_original && product.precio_descuento
    ? Math.round((1 - product.precio_descuento / product.precio_original) * 100)
    : 0;

  // Calcular bonus EXP: 50% más que la XP regular por rescatar este pack
  const savingsAmount = product.precio_original && product.precio_descuento
    ? Math.max(0, (product.precio_original - product.precio_descuento))
    : 0;
  const co2Saved = product.co2_ahorrado || product.co2_saved || 2.5; // fallback razonable
  const regularXP = calculateXP(1, savingsAmount, co2Saved);
  const bonusExp = Math.max(10, Math.round(regularXP * 1.5)); // +50%

  const getTypeConfig = () => {
    switch (notificationType) {
      case 'hot_sale':
        return { icon: 'flame', color: '#FF6B35', label: '🔥 HOT SALE' };
      case 'closing_soon':
        return { icon: 'timer-outline', color: '#FF3B30', label: '⏰ CIERRA PRONTO' };
      case 'top_rated':
        return { icon: 'star', color: '#FFD700', label: '⭐ TOP RATED' };
      case 'favorite_store':
        return { icon: 'heart', color: '#FF2D55', label: '💚 TU FAVORITO' };
      case 'nearby':
        return { icon: 'location', color: '#007AFF', label: '📍 CERCA DE TI' };
      default:
        return { icon: 'sparkles', color: '#34C759', label: '✨ NUEVO' };
    }
  };

  const typeConfig = getTypeConfig();

  const handlePress = () => {
    onClose();
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleDismiss = async () => {
    // Guardar que se vio esta notificación para no repetirla hoy
    const today = new Date().toDateString();
    const key = `@notif_seen_${product.id}_${today}`;
    await AsyncStorage.setItem(key, 'true');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.dismissArea} 
          activeOpacity={1} 
          onPress={handleDismiss}
        />
        
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
          {/* Badge de tipo */}
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
            <Text style={styles.typeBadgeText}>{typeConfig.label}</Text>
          </View>

          {/* Botón cerrar */}
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {/* Pregunta hook */}
          <Text style={styles.hookText}>{randomHook}</Text>


          {/* Card del producto (tappable) */}
          <TouchableOpacity
            style={styles.productCard}
            onPress={handlePress}
            activeOpacity={0.95}
          >
            {/* Imagen grande */}
            <View style={styles.imageContainerLarge}>
              {product.imagen_url ? (
                <Image
                  source={{ uri: product.imagen_url }}
                  style={styles.productImageLarge}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholderLarge}>
                  <MaterialCommunityIcons name="food" size={64} color="#ccc" />
                </View>
              )}

              {/* Badge descuento prominente */}
              {discount > 0 && (
                <View style={styles.discountBadgeLarge}>
                  <Text style={styles.discountTextLarge}>-{discount}%</Text>
                </View>
              )}
            </View>

            {/* Info del producto */}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.nombre}
              </Text>
              
              {product.nombre_comercio && (
                <View style={styles.storeRow}>
                  <Ionicons name="storefront-outline" size={14} color={COLORS.textLight} />
                  <Text style={styles.storeName} numberOfLines={1}>
                    {product.nombre_comercio}
                  </Text>
                </View>
              )}

              {/* Rating si existe */}
              {product.calificacion_promedio > 0 && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {formatRating(product.calificacion_promedio)}
                  </Text>
                </View>
              )}

              {/* Precios */}
              <View style={styles.priceContainer}>
                <View style={styles.priceLeft}>
                  <Text style={styles.priceLabel}>Precio original</Text>
                  <Text style={styles.originalPrice}>
                    ${formatPrice(product.precio_original)}
                  </Text>
                </View>
                <View style={styles.priceRight}>
                  <Text style={styles.priceLabel}>Con Delicrunch</Text>
                  <Text style={styles.discountPrice}>
                    ${formatPrice(product.precio_descuento)}
                  </Text>
                </View>
              </View>

              {/* Hora de recogida */}
              {product.hora_recogida_inicio && (
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.timeText}>
                    Recoge: {product.hora_recogida_inicio} - {product.hora_recogida_fin}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Mensaje eco y bonus EXP */}
          <View style={styles.metaRow}>
            <View style={styles.ecoContainer}>
              <Text style={styles.ecoText}>{ecoMessage}</Text>
            </View>
            <View style={styles.bonusContainer}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={styles.bonusText}> +{bonusExp} EXP</Text>
            </View>
          </View>

          {/* Botón CTA */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={handlePress}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaText}>¡Quiero salvarlo! 🌍</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          {/* Texto secundario */}
          <Text style={styles.secondaryText}>
            Toca para ver más detalles y reservar
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    // Neo Brutalism shadow
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  imageContainerLarge: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  productImageLarge: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholderLarge: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadgeLarge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF3B30',
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  discountTextLarge: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 22,
    lineHeight: 24,
  },
  typeBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  typeBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hookText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 26,
  },
  productCard: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  discountText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  storeName: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 6,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  priceLeft: {
    alignItems: 'flex-start',
  },
  priceRight: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  ecoContainer: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5C26B',
  },
  bonusText: {
    fontWeight: '800',
    color: '#B36B00',
    marginLeft: 6,
  },
  ecoText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1a1a1a',
    gap: 8,
    // Neo Brutalism
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
  },
  secondaryText: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default SpecialNotificationModal;
