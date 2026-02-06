/**
 * PaymentScreen - Pantalla de Pago con Mercado Pago Checkout Pro
 * Diseño inspirado en Too Good To Go
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Alert, 
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import api from '../services/api';
import logger from '../services/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS, SHADOWS } from '../src/constants/theme';
import { formatPrice, formatNumber } from '../src/utils/format';
import { COUPON_CATEGORIES } from '../src/constants/gamification';
import { createPaymentPreference } from '../services/mercadoPagoService';
import PickupCodeModal from '../components/PickupCodeModal';
import XPRewardsModal from '../components/XPRewardsModal';
import { calculateCO2Saved } from '../src/constants/co2Factors';
import { useGamification } from '../contexts/GamificationContext';

const PaymentScreen = ({ route, navigation }) => {
  const { product, quantity = 1 } = route.params;
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para cupones
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  
  // Estados para modales de confirmación y recompensas
  const [showPickupCodeModal, setShowPickupCodeModal] = useState(false);
  const [showXPModal, setShowXPModal] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [xpRewardData, setXPRewardData] = useState(null);
  
  // Gamificación
  const { recordPurchase, userProfile } = useGamification();

  if (!product) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.textTertiary} />
          <Text style={styles.errorText}>No se ha podido cargar la información del producto.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const subtotal = Number(product.precio_descuento || 0) * Number(quantity || 1);
  const originalTotal = Number(product.precio_original || 0) * Number(quantity || 1);
  const rawSavings = Math.max(0, originalTotal - subtotal);
  const savings = formatPrice(rawSavings);
  const discount = originalTotal > 0 ? Math.round((rawSavings / originalTotal) * 100) : 0;
  
  console.log('💰 PaymentScreen - Precios:', { 
    precioOriginal: product.precio_original, 
    precioDescuento: product.precio_descuento, 
    quantity,
    subtotal, 
    originalTotal, 
    rawSavings, 
    discount 
  });
  
  // Calcular total con cupón aplicado
  const totalAfterCoupon = Math.max(0, subtotal - couponDiscount);
  const platformFee = formatPrice(totalAfterCoupon * 0.25);
  const merchantAmount = formatPrice(totalAfterCoupon * 0.75);

  // Cargar cupones disponibles
  useEffect(() => {
    const loadCoupons = async () => {
      setLoadingCoupons(true);
      try {
        const res = await api.get('/coupons/available', {
          params: {
            total: subtotal,
            category: product.categoria || 'ALL'
          }
        });
        if (res.data.success) {
          let merged = res.data.coupons || [];
          // Merge local coupons from AsyncStorage
          try {
            const local = await AsyncStorage.getItem('@delicrunch_coupons');
            if (local) {
              const parsed = JSON.parse(local);
              const localActive = (parsed.active || []).map(c => {
                const potential_discount = (() => {
                  const t = subtotal;
                  switch(c.type) {
                    case 'percentage': return Math.min(t * (c.value/100), c.maxDiscount || c.max_discount || Infinity);
                    case 'fixed': return Math.min(c.value, c.maxDiscount || c.max_discount || Infinity, t);
                    case '2x1': return t/2;
                    case 'free_item': return t;
                    default: return 0;
                  }
                })();

                return {
                  id: c.id,
                  name: c.name,
                  description: c.description,
                  type: c.type,
                  value: c.value,
                  category: c.category || 'ALL',
                  min_purchase: c.minPurchase || c.min_purchase || 0,
                  max_discount: c.maxDiscount || c.max_discount || 0,
                  icon: c.icon,
                  color: c.color,
                  potential_discount,
                  _local: true,
                  expires_at: c.expires_at,
                };
              });

              localActive.forEach(lc => {
                if (!merged.some(m => m.id === lc.id)) merged.unshift(lc);
              });
            }
          } catch (e) {
            console.log('Error merging local coupons', e.message);
          }

          setAvailableCoupons(merged);
        }
      } catch (error) {
        console.log('Cupones no disponibles:', error.message);
      } finally {
        setLoadingCoupons(false);
      }
    };
    loadCoupons();
  }, [subtotal, product.categoria]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  // Calcular descuento cuando se selecciona un cupón
  const selectCoupon = (coupon) => {
    if (!coupon) {
      setSelectedCoupon(null);
      setCouponDiscount(0);
      return;
    }

    let discountAmount = 0;
    switch(coupon.type) {
      case 'percentage':
        discountAmount = Math.min(subtotal * (coupon.value / 100), coupon.max_discount || Infinity);
        break;
      case 'fixed':
        discountAmount = Math.min(coupon.value, coupon.max_discount || Infinity, subtotal);
        break;
      case '2x1':
        discountAmount = subtotal / 2;
        break;
      case 'free_item':
        discountAmount = subtotal;
        break;
    }

    setSelectedCoupon(coupon);
    setCouponDiscount(Math.round(discountAmount * 100) / 100);
    setShowCouponModal(false);
  };

  const removeCoupon = () => {
    setSelectedCoupon(null);
    setCouponDiscount(0);
  };

  /**
   * Iniciar el proceso de pago con Mercado Pago Checkout Pro
   */
  const initializePayment = async () => {
    setIsPurchasing(true);
    try {
      console.log('💳 Iniciando pago con Mercado Pago...');

      // 1. Crear preferencia de pago en el backend
      const preference = await createPaymentPreference({
        productId: product.id,
        cantidad: quantity,
        coupon_discount: couponDiscount,
      });

      console.log('✅ Preferencia creada:', preference.preferenceId);

      // 2. Abrir Checkout Pro de Mercado Pago en el navegador
      // Usamos sandboxInitPoint para pruebas, initPoint para producción
      const checkoutUrl = preference.sandboxInitPoint || preference.initPoint;
      
      if (!checkoutUrl) {
        throw new Error('No se pudo obtener la URL de checkout');
      }

      console.log('🌐 Abriendo Checkout Pro:', checkoutUrl);

      // Abrir en navegador externo (WebBrowser)
      const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
        showTitle: true,
        enableBarCollapsing: true,
      });

      console.log('📱 Resultado del navegador:', result.type);

      // Después de cerrar el navegador, verificar el estado del pago
      if (result.type === 'cancel' || result.type === 'dismiss') {
        // El usuario cerró el navegador - verificar si hay orden pendiente
        Alert.alert(
          'Pago no completado',
          '¿Deseas continuar con el pago o cancelar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Reintentar', 
              onPress: () => initializePayment() 
            },
          ]
        );
      } else {
        // Simular orden creada (en producción, el webhook crea la orden)
        // Esperar un momento para que el webhook procese
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Calcular datos de la orden
        const savedAmount = rawSavings + couponDiscount;
        const productCategory = product.categoria || 'otros';
        const co2Amount = calculateCO2Saved(productCategory, quantity);
        
        const mockOrder = {
          id: Date.now(),
          codigo_recogida: generatePickupCode(),
          nombre_comercio: product.nombre_comercio,
          direccion_comercio: product.direccion,
          hora_recogida_inicio: product.hora_recogida_inicio || '14:00',
          hora_recogida_fin: product.hora_recogida_fin || '18:00',
          nombre_producto: product.nombre,
          cantidad: quantity,
          total: totalAfterCoupon,
          ahorro: savedAmount,
          co2_ahorrado: co2Amount,
          categoria: productCategory,
        };
        
        setOrderData(mockOrder);
        
        // Registrar compra para XP y obtener recompensas
        const xpResult = await recordPurchase(quantity, savedAmount, co2Amount);
        
        const currentXP = userProfile?.xp || 0;
        const currentLevel = userProfile?.nivel || 1;
        const nextLevelXP = currentLevel * 100; // Simplificado, ajustar según tu lógica
        const progressToNext = Math.min(100, (currentXP / nextLevelXP) * 100);
        
        setXPRewardData({
          xpEarned: xpResult?.xpGained || 0,
          levelUp: xpResult?.levelUp || false,
          newLevel: xpResult?.newLevel || currentLevel,
          newBadges: xpResult?.newBadges || [],
          newCoupons: xpResult?.newCoupons || [],
          progressToNext,
          currentXP,
          nextLevelXP,
        });
        
        // Mostrar modal de código de recogida primero
        setShowPickupCodeModal(true);
      }

    } catch (error) {
      console.error('❌ Error en initializePayment:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'No se pudo procesar tu solicitud.';
      Alert.alert(
        'Error en la Compra',
        errorMessage,
        [{ text: 'Entendido' }]
      );
    } finally {
      setIsPurchasing(false);
    }
  };
  
  // Generar código de recogida aleatorio
  const generatePickupCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    return `${letters[Math.floor(Math.random() * letters.length)]}${letters[Math.floor(Math.random() * letters.length)]}-${numbers[Math.floor(Math.random() * numbers.length)]}${numbers[Math.floor(Math.random() * numbers.length)]}${numbers[Math.floor(Math.random() * numbers.length)]}`;
  };
  
  // Handler para cerrar el modal de código y mostrar el de XP
  const handlePickupCodeClose = () => {
    setShowPickupCodeModal(false);
    if (xpRewardData && xpRewardData.xpEarned > 0) {
      // Pequeño delay para transición suave
      setTimeout(() => {
        setShowXPModal(true);
      }, 300);
    } else {
      // Si no hay XP, ir directamente a Mis Pedidos
      navigation.navigate('MyOrders');
    }
  };
  
  // Handler para cerrar el modal de XP
  const handleXPModalClose = () => {
    setShowXPModal(false);
    navigation.navigate('MyOrders');
  };
  
  // Handler para ver el pedido
  const handleViewOrder = () => {
    setShowPickupCodeModal(false);
    navigation.navigate('MyOrders');
  };

  // Modal de selección de cupones
  const CouponModal = () => (
    <Modal
      visible={showCouponModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCouponModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecciona un cupón</Text>
            <TouchableOpacity onPress={() => setShowCouponModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {loadingCoupons ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 40 }} />
          ) : availableCoupons.length === 0 ? (
            <View style={styles.noCoupons}>
              <Ionicons name="ticket-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.noCouponsText}>No tienes cupones disponibles para esta compra</Text>
              <Text style={styles.noCouponsSubtext}>¡Sube de nivel para ganar cupones!</Text>
            </View>
          ) : (
            <ScrollView style={styles.couponsList} showsVerticalScrollIndicator={false}>
              {availableCoupons.map(coupon => {
                const categoryInfo = COUPON_CATEGORIES?.[coupon.category] || { name: 'General', icon: 'gift', color: '#34C759' };
                const isSelected = selectedCoupon?.id === coupon.id;
                
                return (
                  <TouchableOpacity
                    key={coupon.id}
                    style={[styles.couponOption, isSelected && styles.couponOptionSelected]}
                    onPress={() => selectCoupon(coupon)}
                  >
                    <View style={[styles.couponOptionLeft, { backgroundColor: coupon.color || categoryInfo.color }]}>
                      <Text style={styles.couponOptionValue}>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : 
                         coupon.type === '2x1' ? '2x1' : `$${formatPrice(coupon.value)}`}
                      </Text>
                      <Ionicons name={coupon.icon || categoryInfo.icon} size={18} color="#FFF" />
                    </View>
                    <View style={styles.couponOptionInfo}>
                      <Text style={styles.couponOptionName}>{coupon.name}</Text>
                      <Text style={styles.couponOptionMeta}>
                        {categoryInfo.name} · Max ${formatPrice(coupon.max_discount)}
                      </Text>
                      <Text style={styles.couponOptionSavings}>
                        Ahorras: ${formatPrice(coupon.potential_discount || 0)}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {selectedCoupon && (
            <TouchableOpacity style={styles.removeCouponBtn} onPress={() => selectCoupon(null)}>
              <Text style={styles.removeCouponText}>Quitar cupón</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmar pedido</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Product Summary Card */}
        <View style={styles.card}>
          <View style={styles.productRow}>
            <Image 
              source={{ uri: product.imagen_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }} 
              style={styles.productImage} 
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>{product.nombre}</Text>
              <Text style={styles.storeName}>{product.nombre_comercio}</Text>
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>Cantidad: {quantity}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pickup Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles de recogida</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Horario</Text>
              <Text style={styles.detailValue}>
                Hoy, {product.hora_recogida_inicio || '14:00'} - {product.hora_recogida_fin || '18:00'}
              </Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Dirección</Text>
              <Text style={styles.detailValue}>{product.direccion || 'Ver en la app'}</Text>
            </View>
          </View>
        </View>

        {/* Impact Card */}
        <View style={styles.impactCard}>
          <MaterialCommunityIcons name="leaf" size={24} color={COLORS.primary} />
          <View style={styles.impactContent}>
            <Text style={styles.impactTitle}>Tu impacto positivo</Text>
            <Text style={styles.impactText}>
              Ahorras ${savings} MXN y evitas ~{formatNumber(2.5 * quantity, 1)} kg de CO₂
            </Text>
          </View>
        </View>

        {/* Coupon Section */}
        <View style={styles.card}>
          <View style={styles.couponHeader}>
            <View style={styles.couponHeaderLeft}>
              <Ionicons name="ticket" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Cupón de descuento</Text>
            </View>
            {availableCoupons.length > 0 && (
              <View style={styles.couponBadge}>
                <Text style={styles.couponBadgeText}>{availableCoupons.length}</Text>
              </View>
            )}
          </View>

          {selectedCoupon ? (
            <View style={styles.selectedCoupon}>
              <View style={[styles.selectedCouponLeft, { backgroundColor: selectedCoupon.color || '#34C759' }]}>
                <Text style={styles.selectedCouponValue}>
                  {selectedCoupon.type === 'percentage' ? `${selectedCoupon.value}%` : 
                   selectedCoupon.type === '2x1' ? '2x1' : `$${formatPrice(selectedCoupon.value)}`}
                </Text>
              </View>
              <View style={styles.selectedCouponInfo}>
                <Text style={styles.selectedCouponName}>{selectedCoupon.name}</Text>
                <Text style={styles.selectedCouponDiscount}>-${formatPrice(couponDiscount)}</Text>
              </View>
              <TouchableOpacity onPress={removeCoupon} style={styles.removeCouponIcon}>
                <Ionicons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addCouponBtn} 
              onPress={() => setShowCouponModal(true)}
              disabled={loadingCoupons}
            >
              {loadingCoupons ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.addCouponText}>
                    {availableCoupons.length > 0 
                      ? `Aplicar cupón (${availableCoupons.length} disponibles)`
                      : 'No tienes cupones disponibles'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen de pago</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Precio original ({quantity}x)</Text>
            <Text style={styles.priceValueStrike}>${formatPrice(originalTotal)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Descuento Delicrunch ({discount}%)</Text>
            <Text style={styles.discountValue}>-${savings}</Text>
          </View>

          {couponDiscount > 0 && (
            <View style={styles.priceRow}>
              <View style={styles.couponDiscountLabel}>
                <Ionicons name="ticket" size={14} color={COLORS.primary} />
                <Text style={[styles.priceLabel, { color: COLORS.primary, marginLeft: 4 }]}>
                  Cupón aplicado
                </Text>
              </View>
              <Text style={styles.couponDiscountValue}>-${formatPrice(couponDiscount)}</Text>
            </View>
          )}

          <View style={styles.priceDivider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <View style={styles.totalWithSavings}>
              {couponDiscount > 0 && (
                <Text style={styles.totalValueStrike}>${formatPrice(subtotal)}</Text>
              )}
              <Text style={styles.totalValue}>${formatPrice(totalAfterCoupon)} MXN</Text>
            </View>
          </View>
          
          {couponDiscount > 0 && (
            <View style={styles.totalSavingsBadge}>
              <Ionicons name="sparkles" size={14} color={COLORS.success} />
              <Text style={styles.totalSavingsText}>
                ¡Ahorro total: ${formatPrice(rawSavings + couponDiscount)}!
              </Text>
            </View>
          )}
        </View>

        {/* Payment Distribution Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            Tu pago se divide: ${merchantAmount} para el comercio y ${platformFee} para gastos operativos de Delicrunch.
          </Text>
        </View>

        {/* Mercado Pago Info */}
        <View style={styles.card}>
          <View style={styles.paymentMethodHeader}>
            <MaterialCommunityIcons name="credit-card-check" size={24} color="#009EE3" />
            <Text style={styles.cardTitle}>Pago seguro con Mercado Pago</Text>
          </View>
          
          <View style={styles.mercadoPagoInfo}>
            <View style={styles.mpFeature}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
              <Text style={styles.mpFeatureText}>Pago 100% seguro</Text>
            </View>
            <View style={styles.mpFeature}>
              <Ionicons name="card" size={20} color={COLORS.success} />
              <Text style={styles.mpFeatureText}>Tarjeta, débito, OXXO y más</Text>
            </View>
            <View style={styles.mpFeature}>
              <Ionicons name="lock-closed" size={20} color={COLORS.success} />
              <Text style={styles.mpFeatureText}>Protección al comprador</Text>
            </View>
          </View>
        </View>

        {/* Spacer for button */}
        <View style={{ height: 100 }} />

        {/* Coupon Modal */}
        <CouponModal />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.purchaseBtn, isPurchasing && styles.purchaseBtnDisabled]}
          onPress={initializePayment}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="credit-card-check" size={24} color="#FFF" />
              <Text style={styles.purchaseBtnText}>
                Pagar ${formatPrice(totalAfterCoupon)} MXN
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modales de confirmación */}
      {orderData && (
        <PickupCodeModal
          visible={showPickupCodeModal}
          onClose={handlePickupCodeClose}
          pickupCode={orderData.codigo_recogida}
          storeName={orderData.nombre_comercio}
          storeAddress={orderData.direccion_comercio}
          pickupStart={orderData.hora_recogida_inicio}
          pickupEnd={orderData.hora_recogida_fin}
          productName={orderData.nombre_producto}
          quantity={orderData.cantidad}
          total={orderData.total}
          savings={orderData.ahorro}
          co2Saved={orderData.co2_ahorrado}
          onViewOrder={handleViewOrder}
        />
      )}
      
      {xpRewardData && (
        <XPRewardsModal
          visible={showXPModal}
          onClose={handleXPModalClose}
          xpEarned={xpRewardData.xpEarned}
          levelUp={xpRewardData.levelUp}
          newLevel={xpRewardData.newLevel}
          newBadges={xpRewardData.newBadges}
          newCoupons={xpRewardData.newCoupons}
          progressToNext={xpRewardData.progressToNext}
          currentXP={xpRewardData.currentXP}
          nextLevelXP={xpRewardData.nextLevelXP}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDERS.radiusMd,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  productRow: {
    flexDirection: 'row',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: BORDERS.radiusSm,
    backgroundColor: COLORS.border,
  },
  productInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  storeName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  quantityBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDERS.radiusSm,
    alignSelf: 'flex-start',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  impactCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDERS.radiusMd,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  impactText: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 2,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  couponHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  couponBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  couponBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  addCouponBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: BORDERS.radiusSm,
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  addCouponText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  selectedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDERS.radiusSm,
    padding: SPACING.sm,
  },
  selectedCouponLeft: {
    width: 50,
    height: 50,
    borderRadius: BORDERS.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCouponValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  selectedCouponInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  selectedCouponName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedCouponDiscount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  removeCouponIcon: {
    padding: SPACING.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  priceValueStrike: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.success,
  },
  couponDiscountLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponDiscountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalWithSavings: {
    alignItems: 'flex-end',
  },
  totalValueStrike: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  totalSavingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDERS.radiusSm,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    gap: 4,
  },
  totalSavingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDERS.radiusSm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  mercadoPagoInfo: {
    gap: SPACING.xs,
  },
  mpFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  mpFeatureText: {
    fontSize: 14,
    color: COLORS.text,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md,
    ...SHADOWS.medium,
  },
  purchaseBtn: {
    flexDirection: 'row',
    backgroundColor: '#009EE3', // Mercado Pago blue
    borderRadius: BORDERS.radiusMd,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  purchaseBtnDisabled: {
    opacity: 0.7,
  },
  purchaseBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDERS.radiusLg,
    borderTopRightRadius: BORDERS.radiusLg,
    padding: SPACING.md,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  noCoupons: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noCouponsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  noCouponsSubtext: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  couponsList: {
    maxHeight: 300,
  },
  couponOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDERS.radiusSm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  couponOptionSelected: {
    borderColor: COLORS.primary,
  },
  couponOptionLeft: {
    width: 60,
    height: 60,
    borderRadius: BORDERS.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponOptionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  couponOptionInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  couponOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  couponOptionMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  couponOptionSavings: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.success,
    marginTop: 2,
  },
  removeCouponBtn: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  removeCouponText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '500',
  },
});

export default PaymentScreen;
