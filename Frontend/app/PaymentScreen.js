/**
 * PaymentScreen - Pantalla de Pago
 * Diseño inspirado en Too Good To Go con Stripe Connect y Sistema de Cupones
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import api from '../services/api';
import logger from '../services/logger';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS, SHADOWS } from '../src/constants/theme';
import { formatPrice, formatNumber } from '../src/utils/format';
import { COUPON_CATEGORIES } from '../src/constants/gamification';
import { createCustomerSession, getStripeCustomerCards } from '../services/stripeCustomerService';

const isExpoGo = Constants.appOwnership === 'expo';

const PaymentScreen = ({ route, navigation }) => {
  const { product, quantity = 1 } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [walletCards, setWalletCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para tarjetas guardadas en Stripe
  const [stripeSavedCards, setStripeSavedCards] = useState([]);
  const [selectedStripeCardId, setSelectedStripeCardId] = useState(null);
  const [loadingStripeCards, setLoadingStripeCards] = useState(false);
  
  // Estado para cupones
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  
  // Estado para indicador de tarjetas guardadas
  const [hasSavedCards, setHasSavedCards] = useState(false);
  const [loadingCustomerInfo, setLoadingCustomerInfo] = useState(false);

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
  
  // Calcular total con cupón aplicado
  const totalAfterCoupon = Math.max(0, subtotal - couponDiscount);
  const platformFee = formatPrice(totalAfterCoupon * 0.25);
  const merchantAmount = formatPrice(totalAfterCoupon * 0.75);

  // Cargar tarjetas de la billetera (metadatos) para flujos sin Stripe (Expo Go)
  useEffect(() => {
    if (!isExpoGo) {
      // En Development Build, verificar si tiene tarjetas guardadas
      checkSavedCards();
      return;
    }
    const loadCards = async () => {
      setLoadingCards(true);
      try {
        const res = await api.get('/payments/methods');
        const cards = res.data || [];
        setWalletCards(cards);
        const preferred = cards.find(c => c.is_default) || cards[0];
        setSelectedCardId(preferred?.id || null);
      } catch (error) {
        logger.error(error, 'loadWalletCards');
      } finally {
        setLoadingCards(false);
      }
    };
    loadCards();
  }, []);

  // Verificar si el usuario tiene tarjetas guardadas en Stripe
  const checkSavedCards = async () => {
    setLoadingCustomerInfo(true);
    setLoadingStripeCards(true);
    try {
      console.log('🔍 Verificando tarjetas guardadas...');
      const { customerId } = await createCustomerSession();
      
      // Obtener payment methods del customer usando el servicio
      const cards = await getStripeCustomerCards(customerId);
      
      setStripeSavedCards(cards);
      setHasSavedCards(cards.length > 0);
      
      // Seleccionar la primera tarjeta por defecto
      if (cards.length > 0 && !selectedStripeCardId) {
        setSelectedStripeCardId(cards[0].id);
      }
      
      console.log(`✅ Usuario tiene ${cards.length} tarjetas guardadas en Stripe`);
      
    } catch (error) {
      console.log('ℹ️ No se pudo verificar tarjetas guardadas:', error.message);
      setStripeSavedCards([]);
      setHasSavedCards(false);
      // No mostrar error al usuario, es solo informativo
    } finally {
      setLoadingCustomerInfo(false);
      setLoadingStripeCards(false);
    }
  };

  // Función para refrescar tarjetas guardadas
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (!isExpoGo) {
      await checkSavedCards();
    }
    setRefreshing(false);
  }, [isExpoGo]);

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
          // Merge local coupons from AsyncStorage (created by RewardsScreen fallback)
          try {
            const local = await AsyncStorage.getItem('@delicrunch_coupons');
            if (local) {
              const parsed = JSON.parse(local);
              const localActive = (parsed.active || []).map(c => {
                // Normalize shape to match backend response used in this screen
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
                  // local flag so we can treat it specially
                  _local: true,
                  expires_at: c.expires_at,
                };
              });

              // Prepend local coupons but avoid duplicates
              localActive.forEach(lc => {
                if (!merged.some(m => m.id === lc.id)) merged.unshift(lc);
              });
            }
          } catch (e) {
            console.log('Error merging local coupons in PaymentScreen', e.message);
          }

          setAvailableCoupons(merged);
        }
      } catch (error) {
        // Si no hay API de cupones, no mostrar error
        console.log('Cupones no disponibles:', error.message);
      } finally {
        setLoadingCoupons(false);
      }
    };
    loadCoupons();
  }, [subtotal, product.categoria]);

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

  const initializePayment = async () => {
    if (isExpoGo) {
      // En Expo Go usamos la billetera demo guardada (metadatos) y creamos la orden sin Stripe
      return handleWalletPayment();
    }

    setIsPurchasing(true);
    try {
      // 1. Obtener Customer Session (ephemeral key + setup intent)
      console.log('🔐 Obteniendo Customer Session...');
      const { customerId, ephemeralKeySecret, setupIntentClientSecret } = 
        await createCustomerSession();

      console.log('✅ Customer Session obtenida:', { customerId });

      // 2. Crear Payment Intent en el backend
      console.log('💳 Creando Payment Intent...');
      const response = await api.post('/payments/create-payment-intent', {
        productId: product.id,
        cantidad: quantity,
        coupon_id: selectedCoupon?.id || null,
        coupon_discount: couponDiscount,
      });
      const { clientSecret, paymentIntentId } = response.data;

      console.log('✅ Payment Intent creado:', paymentIntentId);

      // 3. Preparar configuración del Payment Sheet
      const paymentSheetConfig = {
        merchantDisplayName: "Delicrunch",
        customerId: customerId,
        customerEphemeralKeySecret: ephemeralKeySecret,
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        returnURL: 'delicrunch://payment-result',
        defaultBillingDetails: {
          name: 'Cliente Delicrunch',
        },
      };

      // Si hay una tarjeta seleccionada, configurar para que sea la predeterminada
      if (selectedStripeCardId && stripeSavedCards.length > 0) {
        console.log('💳 Usando tarjeta guardada:', selectedStripeCardId);
        // Stripe mostrará las tarjetas guardadas automáticamente
        // y el usuario puede seleccionar la que desee
      }

      // 4. Inicializar Payment Sheet con Customer
      const { error: initError } = await initPaymentSheet(paymentSheetConfig);

      if (initError) {
        console.error('❌ Error al inicializar Payment Sheet:', initError);
        Alert.alert(
          'Error de Inicialización',
          'No se pudo inicializar el sistema de pago. Por favor, intenta de nuevo.\n\nDetalle: ' + initError.message,
          [{ text: 'OK' }]
        );
        setIsPurchasing(false);
        return;
      }

      console.log('✅ Payment Sheet inicializado correctamente');

      // 5. Presentar Payment Sheet al usuario
      console.log('📱 Mostrando Payment Sheet al usuario...');
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          console.log('ℹ️ Usuario canceló el pago');
        } else {
          console.error('❌ Error en Payment Sheet:', paymentError);
          Alert.alert(
            'Error de Pago',
            'Hubo un problema al procesar tu pago. Por favor, verifica tu información e intenta nuevamente.\n\nDetalle: ' + paymentError.message,
            [{ text: 'OK' }]
          );
        }
        setIsPurchasing(false);
        return;
      }

      console.log('✅ Pago completado exitosamente');
      
      // Recargar tarjetas guardadas por si se agregó una nueva
      checkSavedCards();
      
      await onPaymentSuccess();

    } catch (error) {
      console.error('❌ Error en initializePayment:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'No se pudo procesar tu solicitud.';
      Alert.alert(
        'Error en la Compra',
        errorMessage,
        [{ text: 'Entendido' }]
      );
      setIsPurchasing(false);
    }
  };

  const onPaymentSuccess = async () => {
    try {
      const orderResponse = await api.post('/orders', { 
        productId: product.id,
        cantidad: quantity,
        coupon_id: selectedCoupon?.id || null,
        coupon_discount: couponDiscount,
      });
      const newOrder = orderResponse.data;

      // Marcar cupón como usado
      if (selectedCoupon?.id && newOrder?.id) {
        try {
          await api.post('/coupons/use', {
            couponId: selectedCoupon.id,
            orderId: newOrder.id
          });
        } catch (error) {
          console.log('Error marking coupon as used:', error.message);
        }
      }

      navigation.replace('OrderConfirmation', { order: newOrder, product });
    } catch (error) {
      logger.error(error, 'onPaymentSuccess - Creating Order');
      Alert.alert('Error', 'Tu pago fue exitoso, pero hubo un problema al crear tu pedido. Contacta a soporte.');
    }
  };

  // Pago usando la billetera demo (sin Stripe) — solo crea la orden
  const handleWalletPayment = async () => {
    if (!selectedCardId) {
      Alert.alert(
        'Agrega una tarjeta',
        'No tienes tarjetas guardadas. Ve a Métodos de Pago y añade una.',
        [
          { text: 'Cancelar' },
          { text: 'Métodos de Pago', onPress: () => navigation.navigate('PaymentMethods') },
        ]
      );
      return;
    }

    setIsPurchasing(true);
    try {
      const orderResponse = await api.post('/orders', { 
        productId: product.id,
        cantidad: quantity,
        payment_method_id: selectedCardId,
        coupon_id: selectedCoupon?.id || null,
        coupon_discount: couponDiscount,
      });
      const newOrder = orderResponse.data;

      // Marcar cupón como usado
      if (selectedCoupon?.id && newOrder?.id) {
        try {
          await api.post('/coupons/use', {
            couponId: selectedCoupon.id,
            orderId: newOrder.id
          });
        } catch (error) {
          console.log('Error marking coupon as used:', error.message);
        }
      }

      navigation.replace('OrderConfirmation', { order: newOrder, product });
    } catch (error) {
      logger.error(error, 'handleWalletPayment');
      Alert.alert('Error', error.response?.data?.msg || 'No se pudo crear el pedido.');
      setIsPurchasing(false);
    }
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

        {/* Payment Distribution Info (optional - for transparency) */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            Tu pago se divide: ${merchantAmount} para el comercio y ${platformFee} para gastos operativos de Delicrunch.
          </Text>
        </View>

        {/* Wallet (billetera) */}
        {isExpoGo && (
          <View style={styles.card}>
            <View style={styles.walletHeader}>
              <Text style={styles.cardTitle}>Tu billetera</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PaymentMethods')}>
                <Text style={styles.linkText}>Gestionar</Text>
              </TouchableOpacity>
            </View>

            {loadingCards ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : walletCards.length === 0 ? (
              <Text style={styles.infoText}>Agrega una tarjeta en Métodos de Pago.</Text>
            ) : (
              walletCards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={[styles.cardRow, selectedCardId === card.id && styles.cardRowActive]}
                  onPress={() => setSelectedCardId(card.id)}
                >
                  <View style={styles.cardRowLeft}>
                    <Ionicons name="card" size={20} color={COLORS.primary} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.cardRowTitle}>{card.brand || 'Tarjeta'}</Text>
                      <Text style={styles.cardRowMeta}>•••• {card.last4} · exp {String(card.exp_month).padStart(2,'0')}/{card.exp_year}</Text>
                    </View>
                  </View>
                  {card.is_default && <Text style={styles.badge}>Default</Text>}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Expo Go Warning */}
        {isExpoGo && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color={COLORS.warning} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Modo Demo</Text>
              <Text style={styles.warningText}>
                Stripe no está disponible en Expo Go. Usa el botón de demo para probar el flujo.
              </Text>
            </View>
          </View>
        )}

        {/* Payment Method Info (Development Build) */}
        {!isExpoGo && (
          <View style={styles.card}>
            <View style={styles.paymentMethodHeader}>
              <Ionicons name="card" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Método de pago</Text>
              {stripeSavedCards.length > 0 && (
                <View style={styles.cardCountBadge}>
                  <Text style={styles.cardCountText}>{stripeSavedCards.length}</Text>
                </View>
              )}
            </View>
            
            {loadingStripeCards ? (
              <View style={{ paddingVertical: SPACING.md }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={[styles.infoText, { textAlign: 'center', marginTop: SPACING.sm }]}>
                  Cargando tarjetas guardadas...
                </Text>
              </View>
            ) : stripeSavedCards.length > 0 ? (
              <>
                <View style={styles.savedCardsInfo}>
                  <View style={styles.savedCardsLeft}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.savedCardsTitle}>Tarjetas guardadas</Text>
                      <Text style={styles.savedCardsSubtext}>
                        Selecciona una tarjeta para pagar más rápido
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Lista de tarjetas guardadas */}
                <View style={styles.savedCardsList}>
                  {stripeSavedCards.map((card) => {
                    const isSelected = selectedStripeCardId === card.id;
                    return (
                      <TouchableOpacity
                        key={card.id}
                        style={[styles.savedCardItem, isSelected && styles.savedCardItemSelected]}
                        onPress={() => setSelectedStripeCardId(card.id)}
                      >
                        <View style={styles.savedCardLeft}>
                          <Ionicons 
                            name="card" 
                            size={24} 
                            color={isSelected ? COLORS.primary : COLORS.textSecondary} 
                          />
                          <View style={{ marginLeft: 10 }}>
                            <Text style={[styles.savedCardBrand, isSelected && styles.savedCardBrandSelected]}>
                              {card.brand?.toUpperCase() || 'TARJETA'}
                            </Text>
                            <Text style={styles.savedCardNumber}>•••• {card.last4}</Text>
                            <Text style={styles.savedCardExpiry}>
                              Vence: {String(card.exp_month).padStart(2, '0')}/{card.exp_year}
                            </Text>
                          </View>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.noCardsInfo}>
                <Ionicons name="information-circle" size={20} color={COLORS.textSecondary} />
                <Text style={styles.noCardsText}>
                  Agrega una tarjeta y guárdala para futuras compras
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.manageCardsBtn}
              onPress={() => {
                navigation.navigate('SaveCard');
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.manageCardsBtnText}>Agregar nueva tarjeta</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Coupon Selection Modal */}
      <CouponModal />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Total</Text>
          <View style={styles.footerPriceRow}>
            {couponDiscount > 0 && (
              <Text style={styles.footerPriceStrike}>${formatPrice(subtotal)}</Text>
            )}
            <Text style={styles.footerPriceValue}>${formatPrice(totalAfterCoupon)}</Text>
          </View>
        </View>
        
        {isExpoGo ? (
          <TouchableOpacity 
            style={styles.demoButton}
            onPress={handleWalletPayment}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Pagar con billetera</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.payButton}
            onPress={initializePayment}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="card" size={20} color={COLORS.white} />
                <Text style={styles.buttonText}>Pagar ahora</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 120 },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.surface },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  
  // Error
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  errorText: { marginTop: SPACING.md, fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textSecondary, textAlign: 'center' },
  
  // Cards
  card: { backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginTop: SPACING.md, padding: SPACING.md, borderRadius: BORDERS.radius.lg, ...SHADOWS.sm },
  cardTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text, marginBottom: SPACING.md },
  
  // Product row
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productImage: { width: 80, height: 80, borderRadius: BORDERS.radius.md },
  productInfo: { flex: 1, marginLeft: SPACING.md },
  productName: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text },
  storeName: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, marginTop: 2 },
  quantityBadge: { backgroundColor: COLORS.primarySoft, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDERS.radius.sm, alignSelf: 'flex-start', marginTop: SPACING.xs },
  quantityText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.medium },
  
  // Detail rows
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primarySoft, justifyContent: 'center', alignItems: 'center' },
  detailContent: { flex: 1, marginLeft: SPACING.sm },
  detailLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textTertiary },
  detailValue: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.text, marginTop: 2 },
  detailDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md, marginLeft: 48 },
  
  // Impact card
  impactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primarySoft, marginHorizontal: SPACING.md, marginTop: SPACING.md, padding: SPACING.md, borderRadius: BORDERS.radius.lg },
  impactContent: { flex: 1, marginLeft: SPACING.sm },
  impactTitle: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.primary },
  impactText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.primaryDark, marginTop: 2 },
  
  // Price rows
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  priceLabel: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textSecondary },
  priceValueStrike: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textTertiary, textDecorationLine: 'line-through' },
  discountValue: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.success, fontWeight: TYPOGRAPHY.fontWeight.medium },
  priceDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  totalLabel: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  totalValue: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary },
  
  // Info card
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: SPACING.md, marginTop: SPACING.md, padding: SPACING.sm },
  infoText: { flex: 1, marginLeft: SPACING.sm, fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, lineHeight: 18 },
  
  // Warning card
  warningCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.warningLight, marginHorizontal: SPACING.md, marginTop: SPACING.md, padding: SPACING.md, borderRadius: BORDERS.radius.md },
  warningContent: { flex: 1, marginLeft: SPACING.sm },
  warningTitle: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.warning },
  warningText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, marginTop: 2 },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cardRowLeft: { flexDirection: 'row', alignItems: 'center' },
  cardRowTitle: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text },
  cardRowMeta: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  cardRowActive: { backgroundColor: COLORS.primarySoft, paddingHorizontal: 6, borderRadius: 10 },
  badge: { backgroundColor: COLORS.primary, color: COLORS.white, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: TYPOGRAPHY.fontSize.xs },
  
  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOWS.lg },
  footerPrice: { marginRight: SPACING.md },
  footerPriceLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  footerPriceValue: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  footerPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerPriceStrike: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textTertiary, textDecorationLine: 'line-through' },
  payButton: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: BORDERS.radius.md, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  demoButton: { flex: 1, backgroundColor: COLORS.warning, paddingVertical: SPACING.md, borderRadius: BORDERS.radius.md, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold },
  
  // Coupon Section Styles
  couponHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  couponHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  couponBadge: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  couponBadgeText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold },
  addCouponBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.primary, borderRadius: BORDERS.radius.md, borderStyle: 'dashed', gap: 8 },
  addCouponText: { color: COLORS.primary, fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.medium },
  selectedCoupon: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primarySoft, padding: SPACING.sm, borderRadius: BORDERS.radius.md },
  selectedCouponLeft: { width: 50, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  selectedCouponValue: { color: COLORS.white, fontWeight: TYPOGRAPHY.fontWeight.bold, fontSize: TYPOGRAPHY.fontSize.sm },
  selectedCouponInfo: { flex: 1, marginLeft: SPACING.sm },
  selectedCouponName: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text },
  selectedCouponDiscount: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.success, fontWeight: TYPOGRAPHY.fontWeight.bold },
  removeCouponIcon: { padding: 4 },
  couponDiscountLabel: { flexDirection: 'row', alignItems: 'center' },
  couponDiscountValue: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.bold },
  totalWithSavings: { alignItems: 'flex-end' },
  totalValueStrike: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textTertiary, textDecorationLine: 'line-through' },
  totalSavingsBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.successLight, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginTop: SPACING.sm, gap: 4 },
  totalSavingsText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.success, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  
  // Coupon Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  couponsList: { padding: SPACING.md },
  noCoupons: { alignItems: 'center', padding: SPACING.xl },
  noCouponsText: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textSecondary, marginTop: SPACING.md, textAlign: 'center' },
  noCouponsSubtext: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textTertiary, marginTop: 4 },
  couponOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.sm, borderRadius: BORDERS.radius.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  couponOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  couponOptionLeft: { width: 60, height: 60, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  couponOptionValue: { color: COLORS.white, fontWeight: TYPOGRAPHY.fontWeight.bold, fontSize: TYPOGRAPHY.fontSize.sm },
  couponOptionInfo: { flex: 1, marginLeft: SPACING.sm },
  couponOptionName: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text },
  couponOptionMeta: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, marginTop: 2 },
  couponOptionSavings: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.success, fontWeight: TYPOGRAPHY.fontWeight.medium, marginTop: 2 },
  removeCouponBtn: { margin: SPACING.md, padding: SPACING.sm, alignItems: 'center' },
  removeCouponText: { color: COLORS.error, fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.medium },
  
  // Payment Method Styles (Development Build)
  paymentMethodHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  cardCountBadge: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 'auto' },
  cardCountText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold },
  savedCardsInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.successLight, padding: SPACING.sm, borderRadius: BORDERS.radius.md, marginBottom: SPACING.sm },
  savedCardsLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  savedCardsTitle: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text },
  savedCardsSubtext: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, marginTop: 2 },
  
  // Lista de tarjetas guardadas
  savedCardsList: { marginVertical: SPACING.sm },
  savedCardItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: SPACING.sm, 
    backgroundColor: COLORS.background,
    borderRadius: BORDERS.radius.md, 
    marginBottom: SPACING.xs,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  savedCardItemSelected: { 
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  savedCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  savedCardBrand: { 
    fontSize: TYPOGRAPHY.fontSize.base, 
    fontWeight: TYPOGRAPHY.fontWeight.bold, 
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  savedCardBrandSelected: { color: COLORS.primary },
  savedCardNumber: { 
    fontSize: TYPOGRAPHY.fontSize.sm, 
    color: COLORS.textSecondary, 
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  savedCardExpiry: { 
    fontSize: TYPOGRAPHY.fontSize.xs, 
    color: COLORS.textTertiary, 
    marginTop: 2 
  },
  
  noCardsInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.sm, borderRadius: BORDERS.radius.md, marginBottom: SPACING.sm, gap: 8 },
  noCardsText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  manageCardsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.primary, borderRadius: BORDERS.radius.md, gap: 6, marginTop: SPACING.xs },
  manageCardsBtnText: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.medium },
});

export default PaymentScreen;
