/**
 * PaymentScreen - Pantalla de Pago con Mercado Pago Checkout Pro
 * Diseño moderno inspirado en Too Good To Go
 * Con autenticación OAuth de MercadoPago persistente
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
import { LinearGradient } from 'expo-linear-gradient';
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

// Colores estilo TGTG
const TGTG_COLORS = {
  primary: '#00AB84',
  primaryDark: '#008768',
  primaryLight: '#E6F7F3',
  secondary: '#FF6B6B',
  accent: '#FFD93D',
  success: '#34C759',
  warning: '#FF9500',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  error: '#EF4444',
};

const PaymentScreen = ({ route, navigation }) => {
  const { product, quantity = 1 } = route.params;
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLinkedMercadoPago, setHasLinkedMercadoPago] = useState(false);
  const [checkingMercadoPago, setCheckingMercadoPago] = useState(true);
  
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

  // Verificar si el usuario tiene MercadoPago vinculado
  useEffect(() => {
    checkMercadoPagoStatus();
  }, []);

  const checkMercadoPagoStatus = async () => {
    try {
      setCheckingMercadoPago(true);
      
      // Verificar en el backend si hay pagos completados
      const response = await api.get('/payments/user-status');
      if (response.data.success) {
        const serverStatus = response.data.data;
        setHasLinkedMercadoPago(serverStatus.hasCompletedPayment);
        
        // Guardar en AsyncStorage para futuras referencias
        if (serverStatus.hasCompletedPayment) {
          await AsyncStorage.setItem('@mercadopago_user_status', JSON.stringify({
            hasCompletedPayment: true,
            totalPayments: serverStatus.totalPayments,
            lastPayment: serverStatus.lastPayment,
          }));
        }
      } else {
        // Fallback a AsyncStorage si el backend falla
        const mpStatus = await AsyncStorage.getItem('@mercadopago_user_status');
        if (mpStatus) {
          const parsed = JSON.parse(mpStatus);
          setHasLinkedMercadoPago(parsed.hasCompletedPayment || false);
        } else {
          setHasLinkedMercadoPago(false);
        }
      }
    } catch (error) {
      // Silenciar error si el endpoint no existe aún (puede estar desplegando)
      console.log('⚠️ No se pudo verificar estado de MercadoPago (endpoint no disponible - deploy en progreso)');
      
      // Fallback a AsyncStorage
      try {
        const mpStatus = await AsyncStorage.getItem('@mercadopago_user_status');
        if (mpStatus) {
          const parsed = JSON.parse(mpStatus);
          setHasLinkedMercadoPago(parsed.hasCompletedPayment || false);
        } else {
          // Asumir que no tiene cuenta vinculada para permitir primera compra
          setHasLinkedMercadoPago(false);
        }
      } catch (e) {
        setHasLinkedMercadoPago(false);
      }
    } finally {
      setCheckingMercadoPago(false);
    }
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={TGTG_COLORS.textTertiary} />
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
        console.log('Cupones no disponibles (esperado si la tabla no existe):', error.message);
        // No mostrar error al usuario, simplemente no hay cupones disponibles
        setAvailableCoupons([]);
      } finally {
        setLoadingCoupons(false);
      }
    };
    loadCoupons();
  }, [subtotal, product.categoria]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkMercadoPagoStatus();
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
   * El usuario puede pagar sin necesidad de tener cuenta vinculada previamente
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
      // En producción (Google Play): usar initPoint (pagos reales)
      // En desarrollo: usar sandboxInitPoint para pruebas
      const checkoutUrl = __DEV__ 
        ? (preference.sandboxInitPoint || preference.initPoint)
        : preference.initPoint;
      
      if (!checkoutUrl) {
        throw new Error('No se pudo obtener la URL de checkout');
      }

      console.log('🌐 Abriendo Checkout Pro:', checkoutUrl);

      // Abrir en navegador externo (WebBrowser)
      const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
        showTitle: true,
        enableBarCollapsing: true,
        toolbarColor: TGTG_COLORS.primary,
        controlsColor: '#FFFFFF',
        showInRecents: true,
      });

      console.log('📱 Resultado del navegador:', result.type);

      // Después de cerrar el navegador, verificar el estado del pago
      if (result.type === 'cancel' || result.type === 'dismiss') {
        // El usuario cerró el navegador - ofrecer reintentar
        Alert.alert(
          'Pago interrumpido',
          '¿Ya completaste el pago? Si cerraste la ventana por error, puedes reintentar.',
          [
            { 
              text: 'Ya pagué', 
              onPress: async () => {
                // Actualizar estado de MercadoPago y verificar orden
                await checkMercadoPagoStatus();
                Alert.alert(
                  '✅ Verificando...',
                  'Estamos verificando tu pago. En breve recibirás la confirmación.',
                  [{ text: 'Ver Pedidos', onPress: () => navigation.navigate('MyOrders') }]
                );
              }
            },
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Reintentar pago', 
              onPress: () => initializePayment() 
            },
          ]
        );
      } else {
        // Navegador cerrado normalmente - posible pago exitoso
        // Esperar un momento para que el webhook procese
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Actualizar estado de MercadoPago
        await checkMercadoPagoStatus();
        
        // Calcular datos de la orden (simulados hasta que llegue el webhook)
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
        try {
          const xpResult = await recordPurchase(quantity, savedAmount, co2Amount);
          
          const currentXP = userProfile?.xp || 0;
          const currentLevel = userProfile?.nivel || 1;
          const nextLevelXP = currentLevel * 100;
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
        } catch (xpError) {
          console.warn('⚠️ No se pudieron registrar los XP:', xpError.message);
        }
        
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
      setTimeout(() => {
        setShowXPModal(true);
      }, 300);
    } else {
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

  // Modal de selección de cupones (REDISEÑADO)
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
            <View>
              <Text style={styles.modalTitle}>Tus cupones</Text>
              <Text style={styles.modalSubtitle}>
                {availableCoupons.length} {availableCoupons.length === 1 ? 'cupón disponible' : 'cupones disponibles'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowCouponModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={TGTG_COLORS.text} />
            </TouchableOpacity>
          </View>

          {loadingCoupons ? (
            <ActivityIndicator size="large" color={TGTG_COLORS.primary} style={{ marginVertical: 40 }} />
          ) : availableCoupons.length === 0 ? (
            <View style={styles.noCoupons}>
              <View style={styles.noCouponsIcon}>
                <Ionicons name="ticket-outline" size={48} color={TGTG_COLORS.textTertiary} />
              </View>
              <Text style={styles.noCouponsText}>No tienes cupones disponibles</Text>
              <Text style={styles.noCouponsSubtext}>¡Sube de nivel para ganar más cupones!</Text>
            </View>
          ) : (
            <ScrollView style={styles.couponsList} showsVerticalScrollIndicator={false}>
              {availableCoupons.map(coupon => {
                const categoryInfo = COUPON_CATEGORIES?.[coupon.category] || { name: 'General', icon: 'gift', color: TGTG_COLORS.primary };
                const isSelected = selectedCoupon?.id === coupon.id;
                
                return (
                  <TouchableOpacity
                    key={coupon.id}
                    style={[styles.couponOption, isSelected && styles.couponOptionSelected]}
                    onPress={() => selectCoupon(coupon)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={isSelected 
                        ? [TGTG_COLORS.primary, TGTG_COLORS.primaryDark]
                        : [coupon.color || categoryInfo.color, coupon.color || categoryInfo.color]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.couponOptionLeft}
                    >
                      <Text style={styles.couponOptionValue}>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : 
                         coupon.type === '2x1' ? '2x1' : `$${formatPrice(coupon.value)}`}
                      </Text>
                      <Ionicons name={coupon.icon || categoryInfo.icon} size={20} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.couponOptionInfo}>
                      <Text style={styles.couponOptionName}>{coupon.name}</Text>
                      <Text style={styles.couponOptionMeta}>
                        {categoryInfo.name} · Hasta ${formatPrice(coupon.max_discount)}
                      </Text>
                      <View style={styles.couponSavingsBadge}>
                        <Text style={styles.couponSavingsText}>
                          Ahorras: ${formatPrice(coupon.potential_discount || 0)}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.checkmarkCircle}>
                        <Ionicons name="checkmark" size={20} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {selectedCoupon && (
            <TouchableOpacity style={styles.removeCouponBtn} onPress={() => selectCoupon(null)}>
              <Text style={styles.removeCouponText}>Quitar cupón seleccionado</Text>
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
            tintColor={TGTG_COLORS.primary}
            colors={[TGTG_COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={TGTG_COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmar pedido</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Product Summary Card (REDISEÑADA) */}
        <View style={styles.card}>
          <View style={styles.productRow}>
            <Image 
              source={{ uri: product.imagen_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }} 
              style={styles.productImage} 
            />
            <View style={styles.productInfo}>
              <View style={styles.savingsBadge}>
                <Ionicons name="trending-down" size={14} color="#FFF" />
                <Text style={styles.savingsBadgeText}>{discount}% OFF</Text>
              </View>
              <Text style={styles.productName} numberOfLines={2}>{product.nombre}</Text>
              <View style={styles.storeRow}>
                <Ionicons name="storefront" size={14} color={TGTG_COLORS.textSecondary} />
                <Text style={styles.storeName}>{product.nombre_comercio}</Text>
              </View>
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Cantidad:</Text>
                <Text style={styles.quantityValue}>{quantity}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pickup Details Card (REDISEÑADA) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={20} color={TGTG_COLORS.primary} />
            <Text style={styles.cardTitle}>Recoge tu pedido</Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time" size={20} color={TGTG_COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Horario de recogida</Text>
              <Text style={styles.detailValue}>
                Hoy, {product.hora_recogida_inicio || '14:00'} - {product.hora_recogida_fin || '18:00'}
              </Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="location" size={20} color={TGTG_COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Dirección</Text>
              <Text style={styles.detailValue}>{product.direccion || 'Ver en la app'}</Text>
            </View>
          </View>
        </View>

        {/* Impact Card (REDISEÑADA CON GRADIENTE) */}
        <LinearGradient
          colors={[TGTG_COLORS.primaryLight, '#C8F5E9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.impactCard}
        >
          <View style={styles.impactIcon}>
            <MaterialCommunityIcons name="leaf" size={28} color={TGTG_COLORS.primary} />
          </View>
          <View style={styles.impactContent}>
            <Text style={styles.impactTitle}>🌍 Tu impacto positivo</Text>
            <Text style={styles.impactText}>
              Ahorras ${savings} MXN y evitas ~{formatNumber(2.5 * quantity, 1)} kg de CO₂
            </Text>
          </View>
        </LinearGradient>

        {/* Coupon Section (COMPLETAMENTE REDISEÑADA - MÁS VISIBLE) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="ticket" size={20} color={TGTG_COLORS.accent} />
            <Text style={styles.cardTitle}>Cupones de descuento</Text>
            {availableCoupons.length > 0 && (
              <View style={styles.couponCountBadge}>
                <Text style={styles.couponCountText}>{availableCoupons.length}</Text>
              </View>
            )}
          </View>

          {selectedCoupon ? (
            <View style={styles.selectedCouponContainer}>
              <LinearGradient
                colors={[selectedCoupon.color || TGTG_COLORS.primary, selectedCoupon.color || TGTG_COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.selectedCoupon}
              >
                <View style={styles.selectedCouponLeft}>
                  <Text style={styles.selectedCouponValue}>
                    {selectedCoupon.type === 'percentage' ? `${selectedCoupon.value}%` : 
                     selectedCoupon.type === '2x1' ? '2x1' : `$${formatPrice(selectedCoupon.value)}`}
                  </Text>
                  <Text style={styles.selectedCouponLabel}>DESCUENTO</Text>
                </View>
                <View style={styles.selectedCouponInfo}>
                  <Text style={styles.selectedCouponName}>{selectedCoupon.name}</Text>
                  <Text style={styles.selectedCouponDiscount}>-${formatPrice(couponDiscount)} MXN</Text>
                </View>
                <TouchableOpacity onPress={removeCoupon} style={styles.removeCouponIconBtn}>
                  <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>
              </LinearGradient>
              <TouchableOpacity 
                style={styles.changeCouponBtn} 
                onPress={() => setShowCouponModal(true)}
              >
                <Text style={styles.changeCouponText}>Cambiar cupón</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addCouponBtnNew} 
              onPress={() => setShowCouponModal(true)}
              disabled={loadingCoupons}
              activeOpacity={0.7}
            >
              {loadingCoupons ? (
                <ActivityIndicator size="small" color={TGTG_COLORS.primary} />
              ) : (
                <>
                  <View style={styles.addCouponIconCircle}>
                    <Ionicons name="add" size={24} color={TGTG_COLORS.primary} />
                  </View>
                  <View style={styles.addCouponTextContainer}>
                    <Text style={styles.addCouponTitle}>
                      {availableCoupons.length > 0 
                        ? `Aplicar cupón` 
                        : 'Sin cupones disponibles'}
                    </Text>
                    {availableCoupons.length > 0 && (
                      <Text style={styles.addCouponSubtitle}>
                        {availableCoupons.length} {availableCoupons.length === 1 ? 'cupón disponible' : 'cupones disponibles'}
                      </Text>
                    )}
                  </View>
                  {availableCoupons.length > 0 && (
                    <Ionicons name="chevron-forward" size={20} color={TGTG_COLORS.textSecondary} />
                  )}
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Summary Card (REDISEÑADA) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt" size={20} color={TGTG_COLORS.primary} />
            <Text style={styles.cardTitle}>Resumen de pago</Text>
          </View>
          
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
                <Ionicons name="ticket" size={14} color={TGTG_COLORS.accent} />
                <Text style={[styles.priceLabel, { color: TGTG_COLORS.accent, marginLeft: 4, fontWeight: '600' }]}>
                  Cupón aplicado
                </Text>
              </View>
              <Text style={styles.couponDiscountValue}>-${formatPrice(couponDiscount)}</Text>
            </View>
          )}

          <View style={styles.priceDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <View style={styles.totalPriceContainer}>
              {couponDiscount > 0 && (
                <Text style={styles.totalValueStrike}>${formatPrice(subtotal)}</Text>
              )}
              <Text style={styles.totalValue}>${formatPrice(totalAfterCoupon)}</Text>
              <Text style={styles.totalCurrency}>MXN</Text>
            </View>
          </View>
          
          {(rawSavings + couponDiscount) > 0 && (
            <View style={styles.totalSavingsBadge}>
              <Ionicons name="sparkles" size={16} color={TGTG_COLORS.success} />
              <Text style={styles.totalSavingsText}>
                ¡Has ahorrado ${formatPrice(rawSavings + couponDiscount)} en total!
              </Text>
            </View>
          )}
        </View>

        {/* MercadoPago Status Card */}
        {!hasLinkedMercadoPago && !checkingMercadoPago && (
          <View style={styles.warningCard}>
            <View style={styles.warningIcon}>
              <Ionicons name="alert-circle" size={24} color={TGTG_COLORS.warning} />
            </View>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Cuenta de pago no vinculada</Text>
              <Text style={styles.warningText}>
                Necesitas vincular tu cuenta de MercadoPago para poder realizar compras
              </Text>
            </View>
          </View>
        )}

        {/* Mercado Pago Info */}
        <View style={styles.mpInfoCard}>
          <View style={styles.mpHeader}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#009EE3" />
            <Text style={styles.mpTitle}>Pago seguro con Mercado Pago</Text>
          </View>
          
          <View style={styles.mpFeatures}>
            <View style={styles.mpFeature}>
              <Ionicons name="checkmark-circle" size={18} color={TGTG_COLORS.success} />
              <Text style={styles.mpFeatureText}>Pago 100% seguro</Text>
            </View>
            <View style={styles.mpFeature}>
              <Ionicons name="checkmark-circle" size={18} color={TGTG_COLORS.success} />
              <Text style={styles.mpFeatureText}>Múltiples medios de pago</Text>
            </View>
            <View style={styles.mpFeature}>
              <Ionicons name="checkmark-circle" size={18} color={TGTG_COLORS.success} />
              <Text style={styles.mpFeatureText}>Protección al comprador</Text>
            </View>
          </View>
        </View>

        {/* Spacer for button */}
        <View style={{ height: 120 }} />

        {/* Coupon Modal */}
        <CouponModal />
      </ScrollView>

      {/* Fixed Bottom Button (REDISEÑADO CON GRADIENTE) */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.purchaseBtn, (isPurchasing || checkingMercadoPago) && styles.purchaseBtnDisabled]}
          onPress={initializePayment}
          disabled={isPurchasing || checkingMercadoPago}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#009EE3', '#0077B5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.purchaseBtnGradient}
          >
            {isPurchasing || checkingMercadoPago ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="credit-card-check" size={24} color="#FFF" />
                <View style={styles.purchaseBtnTextContainer}>
                  <Text style={styles.purchaseBtnText}>
                    Pagar ${formatPrice(totalAfterCoupon)} MXN
                  </Text>
                  {couponDiscount > 0 && (
                    <Text style={styles.purchaseBtnSubtext}>
                      Ahorro aplicado: ${formatPrice(couponDiscount)}
                    </Text>
                  )}
                  {!hasLinkedMercadoPago && (
                    <Text style={[styles.purchaseBtnSubtext, { fontSize: 11 }]}>
                      Primera compra • Pago seguro con MercadoPago
                    </Text>
                  )}
                </View>
              </>
            )}
          </LinearGradient>
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
    backgroundColor: TGTG_COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120, // Aumentado para dar espacio al bottomContainer fijo
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: TGTG_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TGTG_COLORS.text,
  },
  card: {
    backgroundColor: TGTG_COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TGTG_COLORS.text,
    flex: 1,
  },
  productRow: {
    flexDirection: 'row',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: TGTG_COLORS.border,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TGTG_COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: TGTG_COLORS.text,
    marginTop: 4,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  storeName: {
    fontSize: 14,
    color: TGTG_COLORS.textSecondary,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  quantityLabel: {
    fontSize: 14,
    color: TGTG_COLORS.textSecondary,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TGTG_COLORS.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TGTG_COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: TGTG_COLORS.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TGTG_COLORS.text,
  },
  detailDivider: {
    height: 1,
    backgroundColor: TGTG_COLORS.border,
    marginVertical: 12,
  },
  impactCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  impactIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactContent: {
    flex: 1,
    marginLeft: 12,
  },
  impactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TGTG_COLORS.text,
    marginBottom: 2,
  },
  impactText: {
    fontSize: 13,
    color: TGTG_COLORS.text,
    fontWeight: '500',
  },
  // Coupon styles (NUEVOS ESTILOS MÁS VISIBLES)
  couponCountBadge: {
    backgroundColor: TGTG_COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  couponCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: TGTG_COLORS.text,
  },
  addCouponBtnNew: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 2,
    borderColor: TGTG_COLORS.primary,
    borderRadius: 12,
    backgroundColor: TGTG_COLORS.primaryLight,
    borderStyle: 'solid',
  },
  addCouponIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCouponTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  addCouponTitle: {
    fontSize: 15,
    color: TGTG_COLORS.primary,
    fontWeight: '700',
  },
  addCouponSubtitle: {
    fontSize: 12,
    color: TGTG_COLORS.primaryDark,
    marginTop: 2,
    fontWeight: '500',
  },
  selectedCouponContainer: {
    gap: 8,
  },
  selectedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
  },
  selectedCouponLeft: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.3)',
    paddingRight: 16,
  },
  selectedCouponValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  selectedCouponLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  selectedCouponInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedCouponName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  selectedCouponDiscount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  removeCouponIconBtn: {
    padding: 4,
  },
  changeCouponBtn: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: TGTG_COLORS.background,
    borderRadius: 8,
  },
  changeCouponText: {
    fontSize: 14,
    color: TGTG_COLORS.primary,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: TGTG_COLORS.textSecondary,
  },
  priceValueStrike: {
    fontSize: 14,
    color: TGTG_COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TGTG_COLORS.success,
  },
  couponDiscountLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponDiscountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TGTG_COLORS.accent,
  },
  priceDivider: {
    height: 1,
    backgroundColor: TGTG_COLORS.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: TGTG_COLORS.text,
  },
  totalPriceContainer: {
    alignItems: 'flex-end',
  },
  totalValueStrike: {
    fontSize: 12,
    color: TGTG_COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: TGTG_COLORS.primary,
  },
  totalCurrency: {
    fontSize: 12,
    fontWeight: '600',
    color: TGTG_COLORS.textSecondary,
    marginTop: 2,
  },
  totalSavingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  totalSavingsText: {
    fontSize: 13,
    fontWeight: '700',
    color: TGTG_COLORS.success,
  },
  warningCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TGTG_COLORS.warning,
  },
  warningIcon: {
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TGTG_COLORS.text,
    marginBottom: 2,
  },
  warningText: {
    fontSize: 13,
    color: TGTG_COLORS.textSecondary,
  },
  mpInfoCard: {
    backgroundColor: '#E6F5FC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  mpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  mpTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TGTG_COLORS.text,
  },
  mpFeatures: {
    gap: 8,
  },
  mpFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mpFeatureText: {
    fontSize: 14,
    color: TGTG_COLORS.text,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: TGTG_COLORS.card,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24, // Aumentado para Android
    ...SHADOWS.medium,
  },
  purchaseBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  purchaseBtnDisabled: {
    opacity: 0.7,
  },
  purchaseBtnGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  purchaseBtnTextContainer: {
    alignItems: 'center',
  },
  purchaseBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  purchaseBtnSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: TGTG_COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: TGTG_COLORS.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: TGTG_COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    backgroundColor: TGTG_COLORS.background,
    borderRadius: 20,
  },
  noCoupons: {
    alignItems: 'center',
    padding: 40,
  },
  noCouponsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: TGTG_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noCouponsText: {
    fontSize: 18,
    color: TGTG_COLORS.text,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 8,
  },
  noCouponsSubtext: {
    fontSize: 14,
    color: TGTG_COLORS.textSecondary,
    textAlign: 'center',
  },
  couponsList: {
    maxHeight: 400,
  },
  couponOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TGTG_COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  couponOptionSelected: {
    borderColor: TGTG_COLORS.primary,
    backgroundColor: TGTG_COLORS.primaryLight,
  },
  couponOptionLeft: {
    width: 70,
    height: 70,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  couponOptionValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  couponOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  couponOptionName: {
    fontSize: 15,
    fontWeight: '700',
    color: TGTG_COLORS.text,
    marginBottom: 2,
  },
  couponOptionMeta: {
    fontSize: 12,
    color: TGTG_COLORS.textSecondary,
    marginBottom: 6,
  },
  couponSavingsBadge: {
    backgroundColor: '#E6F7F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  couponSavingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: TGTG_COLORS.success,
  },
  checkmarkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TGTG_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeCouponBtn: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: TGTG_COLORS.background,
    borderRadius: 12,
    marginTop: 8,
  },
  removeCouponText: {
    fontSize: 15,
    color: TGTG_COLORS.error,
    fontWeight: '700',
  },
});

export default PaymentScreen;
