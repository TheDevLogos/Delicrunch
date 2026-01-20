/**
 * OrderConfirmationScreen - Pantalla de Confirmación de Pedido
 * Diseño inspirado en Too Good To Go con código de recogida prominente
 */
import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  Platform,
  Animated,
  Share,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS, SHADOWS } from '../src/constants/theme';
import { formatPrice, formatNumber } from '../src/utils/format';
import { calculateCO2Saved } from '../src/constants/co2Factors';
import { useGamification } from '../contexts/GamificationContext';
import BadgeNotification from '../components/BadgeNotification';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { order, product } = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Gamificación
  const { recordPurchase, recordShare, currentNotificationBadge, showBadgeNotification, dismissBadgeNotification } = useGamification();
  const [xpEarned, setXpEarned] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const xpAnimValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada del código de recogida
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Registrar compra en sistema de gamificación
    registerPurchaseXP();
  }, []);
  
  const registerPurchaseXP = async () => {
    const qty = order?.cantidad || 1;
    const savedAmount = order?.ahorro || ((product?.precio_original - product?.precio_descuento) * qty);
    
    // Calcular CO2 basado en categoría del producto
    const productCategory = product?.categoria || order?.categoria || 'otros';
    const co2Amount = order?.co2_ahorrado || calculateCO2Saved(productCategory, qty);
    
    const result = await recordPurchase(qty, savedAmount, co2Amount);
    const xp = result?.xpGained || 0;
    if (xp > 0) {
      setXpEarned(xp);
      setShowXpPopup(true);
      
      // Animar XP popup
      Animated.sequence([
        Animated.spring(xpAnimValue, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(xpAnimValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowXpPopup(false));
    }

    // Si recibimos un cupón por subir de nivel, notificar al usuario
    const newCoupon = result?.newCoupon;
    if (newCoupon) {
      Alert.alert(
        '¡Has ganado un cupón! 🎁',
        `${newCoupon.name}\n${newCoupon.description || ''}`,
        [
          { text: 'Ver Recompensas', onPress: () => navigation.navigate('Rewards', { screen: 'coupons' }) },
          { text: 'Cerrar', style: 'cancel' }
        ]
      );
    }
  };

  const pickupCode = order?.codigo_recogida || 'AB-123';
  const storeName = order?.nombre_comercio || product?.nombre_comercio || 'Comercio';
  const productName = order?.nombre_producto || product?.nombre || 'Producto';
  const storeAddress = order?.direccion_comercio || product?.direccion || 'Dirección no disponible';
  const quantity = order?.cantidad || 1;
  const total = order?.total || (product?.precio_descuento * quantity);
  const savings = order?.ahorro || ((product?.precio_original - product?.precio_descuento) * quantity);
  
  // Calcular CO2 basado en categoría del producto
  const productCategory = product?.categoria || order?.categoria || 'otros';
  const co2Saved = order?.co2_ahorrado || calculateCO2Saved(productCategory, quantity);

  const pickupStart = order?.hora_recogida_inicio || product?.hora_recogida_inicio || '14:00';
  const pickupEnd = order?.hora_recogida_fin || product?.hora_recogida_fin || '18:00';

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: '¡Acabo de salvar comida con Delicrunch! 🌱\n' +
                 'Mi código de recogida: ' + pickupCode + '\n' +
                 'Ahorré $' + formatPrice(savings) + ' y evité ' + formatNumber(co2Saved,1) + ' kg de CO₂.\n\n' +
                 'Descarga Delicrunch y únete al movimiento contra el desperdicio de alimentos.',
        title: 'Mi pedido en Delicrunch',
      });
      
      // Registrar compartir para XP extra
      if (result.action === Share.sharedAction) {
        await recordShare();
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const goHome = () => {
    // Navegar al tab de inicio (Discover) reseteando el stack
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'MainTabs',
        state: {
          routes: [{ name: 'Descubre' }],
          index: 0,
        }
      }],
    });
  };

  const goToOrders = () => {
    navigation.navigate('MyOrders');
  };

  // Cupones aplicables post-pedido (posible aplicación retroactiva)
  const [applyCouponModal, setApplyCouponModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const openApplyCoupon = async () => {
    setLoadingCoupons(true);
    try {
      const total = Number(order?.total || 0);
      let merged = [];
      try {
        const res = await api.get('/coupons/available', { params: { total, category: product.categoria || 'ALL' } });
        if (res.data && res.data.success) merged = res.data.coupons || [];
      } catch (e) {
        console.log('No API coupons on apply:', e.message);
      }

      // Merge local
      try {
        const local = await AsyncStorage.getItem('@delicrunch_coupons');
        if (local) {
          const parsed = JSON.parse(local);
          const localActive = (parsed.active || []).map(c => ({
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
            _local: true,
            expires_at: c.expires_at,
            potential_discount: 0,
          }));
          localActive.forEach(lc => { if (!merged.some(m => m.id === lc.id)) merged.unshift(lc); });
        }
      } catch (e) { console.log('Error reading local coupons', e.message); }

      setAvailableCoupons(merged);
      setApplyCouponModal(true);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const applyCouponToOrder = async (coupon) => {
    // Validate then use coupon on order
    try {
      const total = Number(order?.total || 0);
      // If local-only coupon, we can mark it used locally and associate with order by saving metadata
      if (coupon._local) {
        // Mark local coupon as used
        const stored = await AsyncStorage.getItem('@delicrunch_coupons');
        const existing = stored ? JSON.parse(stored) : { active: [], used: [], expired: [] };
        const idx = (existing.active || []).findIndex(c => c.id === coupon.id);
        if (idx >= 0) {
          const used = existing.active.splice(idx, 1)[0];
          used.status = 'used';
          used.used_at = new Date().toISOString();
          used.used_in_order_id = order.id;
          existing.used = [used, ...(existing.used || [])];
          await AsyncStorage.setItem('@delicrunch_coupons', JSON.stringify(existing));
          Alert.alert('Cupón aplicado', 'Tu cupón local ha sido marcado como usado para este pedido.');
          setApplyCouponModal(false);
          return;
        }
      }

      // Backend coupon flow: validate then use
      const validate = await api.post('/coupons/validate', { couponId: coupon.id, total, category: product.categoria || 'ALL' });
      if (!validate.data || !validate.data.valid) {
        Alert.alert('No válido', validate.data?.error || 'El cupón no es válido para este pedido');
        return;
      }

      // Use coupon
      const useResp = await api.post('/coupons/use', { couponId: coupon.id, orderId: order.id });
      if (useResp.data && useResp.data.success) {
        Alert.alert('Cupón aplicado', useResp.data.message || 'Cupón usado en este pedido.');
        setApplyCouponModal(false);
      } else {
        Alert.alert('Error', 'No se pudo aplicar el cupón.');
      }
    } catch (e) {
      console.log('Error applying coupon to order', e.message);
      Alert.alert('Error', 'No se pudo aplicar el cupón.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* XP Popup */}
      {showXpPopup && (
        <Animated.View 
          style={[
            styles.xpPopup,
            {
              opacity: xpAnimValue,
              transform: [
                { scale: xpAnimValue },
                { translateY: xpAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                })},
              ],
            },
          ]}
        >
          <Text style={styles.xpPopupText}>+{xpEarned} XP</Text>
        </Animated.View>
      )}
      
      {/* Badge Notification Modal */}
      <BadgeNotification
        visible={showBadgeNotification}
        badge={currentNotificationBadge}
        onDismiss={dismissBadgeNotification}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Coupon apply CTA */}
        {order?.id && (
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <TouchableOpacity style={styles.applyCouponBtn} onPress={openApplyCoupon}>
              <Ionicons name="ticket" size={18} color="#fff" />
              <Text style={styles.applyCouponText}>Aplicar cupón a este pedido</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.successTitle}>¡Pedido confirmado!</Text>
          <Text style={styles.successSubtitle}>
            Muestra este código al recoger tu comida
          </Text>
        </View>

        {/* Pickup Code Card */}
        <Animated.View 
          style={[
            styles.codeCard, 
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={styles.codeLabel}>Tu código de recogida</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{pickupCode}</Text>
          </View>
          <View style={styles.codeInstructions}>
            <Ionicons name="information-circle" size={16} color={COLORS.textSecondary} />
            <Text style={styles.instructionText}>
              El comercio te pedirá este código al momento de la entrega
            </Text>
          </View>
        </Animated.View>

        {/* Store & Pickup Details */}
        <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
          <View style={styles.storeRow}>
            <Image 
              source={{ uri: product?.imagen_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }} 
              style={styles.storeImage}
            />
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{storeName}</Text>
              <Text style={styles.productName}>{productName} x{quantity}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Pickup Time */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Horario de recogida</Text>
              <Text style={styles.detailValue}>Hoy, {pickupStart} - {pickupEnd}</Text>
            </View>
          </View>

          {/* Pickup Address */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Dirección</Text>
              <Text style={styles.detailValue}>{storeAddress}</Text>
            </View>
          </View>

          {/* Open Maps Button */}
          <TouchableOpacity style={styles.mapButton}>
            <Ionicons name="navigate" size={18} color={COLORS.primary} />
            <Text style={styles.mapButtonText}>Abrir en Mapas</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Impact Summary */}
        <Animated.View style={[styles.impactCard, { opacity: fadeAnim }]}>
          <Text style={styles.impactTitle}>¡Gracias por salvar comida! 🌱</Text>
          
          <View style={styles.impactRow}>
            <View style={styles.impactItem}>
              <MaterialCommunityIcons name="cash" size={28} color={COLORS.primary} />
              <Text style={styles.impactValue}>${formatPrice(savings)}</Text>
              <Text style={styles.impactLabel}>Ahorraste</Text>
            </View>
            
            <View style={styles.impactDivider} />
            
            <View style={styles.impactItem}>
              <MaterialCommunityIcons name="leaf" size={28} color={COLORS.primary} />
              <Text style={styles.impactValue}>{formatNumber(co2Saved,1)} kg</Text>
              <Text style={styles.impactLabel}>CO₂ evitado</Text>
            </View>
            
            <View style={styles.impactDivider} />
            
            <View style={styles.impactItem}>
              <MaterialCommunityIcons name="food-apple" size={28} color={COLORS.primary} />
              <Text style={styles.impactValue}>{quantity}</Text>
              <Text style={styles.impactLabel}>Comida salvada</Text>
            </View>
          </View>
        </Animated.View>

        {/* Apply Coupon Modal */}
        <Modal visible={applyCouponModal} animationType="slide" transparent onRequestClose={() => setApplyCouponModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentWide}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Selecciona un cupón para este pedido</Text>
                <TouchableOpacity onPress={() => setApplyCouponModal(false)}>
                  <Ionicons name="close" size={22} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              {loadingCoupons ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 24 }} />
              ) : availableCoupons.length === 0 ? (
                <View style={{ padding: 20 }}>
                  <Text style={{ color: COLORS.textSecondary }}>No hay cupones aplicables para este pedido.</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 320 }}>
                  {availableCoupons.map(c => (
                    <TouchableOpacity key={c.id} style={styles.couponOption} onPress={() => applyCouponToOrder(c)}>
                      <View style={[styles.couponOptionLeft, { backgroundColor: c.color || '#34C759' }] }>
                        <Text style={styles.couponOptionValue}>{c.type === 'percentage' ? `${c.value}%` : `$${formatPrice(c.value)}`}</Text>
                      </View>
                      <View style={styles.couponOptionInfo}>
                        <Text style={styles.couponOptionName}>{c.name}</Text>
                        <Text style={styles.couponOptionMeta}>{c.description}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Resumen del pedido</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pedido #</Text>
            <Text style={styles.summaryValue}>{order?.id || '---'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cantidad</Text>
            <Text style={styles.summaryValue}>{quantity}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total pagado</Text>
            <Text style={styles.totalValue}>${formatPrice(total)} MXN</Text>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color={COLORS.primary} />
          <Text style={styles.shareButtonText}>Compartir mi impacto</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={goToOrders}>
          <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
          <Text style={styles.secondaryButtonText}>Ver pedidos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={goHome}>
          <Ionicons name="home" size={20} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>Ir al inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 120 },
  
  // Success Header
  successHeader: { alignItems: 'center', paddingVertical: SPACING.xl, backgroundColor: COLORS.primary },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  successTitle: { fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.white, marginBottom: SPACING.xs },
  successSubtitle: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.white, opacity: 0.9 },
  
  // Code Card
  codeCard: { backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginTop: -24, borderRadius: BORDERS.radius.xl, padding: SPACING.lg, alignItems: 'center', ...SHADOWS.lg },
  codeLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  codeContainer: { backgroundColor: COLORS.primarySoft, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: BORDERS.radius.lg, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed' },
  codeText: { fontSize: 48, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary, letterSpacing: 4 },
  codeInstructions: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  instructionText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, marginLeft: SPACING.xs },
  
  // Details Card
  detailsCard: { backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: BORDERS.radius.lg, padding: SPACING.md, ...SHADOWS.sm },
  storeRow: { flexDirection: 'row', alignItems: 'center' },
  storeImage: { width: 60, height: 60, borderRadius: BORDERS.radius.md },
  storeInfo: { flex: 1, marginLeft: SPACING.md },
  storeName: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  productName: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  detailIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primarySoft, justifyContent: 'center', alignItems: 'center' },
  detailContent: { flex: 1, marginLeft: SPACING.sm },
  detailLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textTertiary },
  detailValue: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.text, marginTop: 2 },
  
  mapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, backgroundColor: COLORS.primarySoft, borderRadius: BORDERS.radius.md, marginTop: SPACING.sm },
  mapButtonText: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.medium, marginLeft: SPACING.xs },
  applyCouponBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  applyCouponText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContentWide: { width: '90%', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, maxHeight: '80%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  
  // Impact Card
  impactCard: { backgroundColor: COLORS.primarySoft, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: BORDERS.radius.lg, padding: SPACING.lg },
  impactTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary, textAlign: 'center', marginBottom: SPACING.md },
  impactRow: { flexDirection: 'row', justifyContent: 'space-around' },
  impactItem: { alignItems: 'center', flex: 1 },
  impactValue: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary, marginTop: SPACING.xs },
  impactLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.primaryDark, marginTop: 2 },
  impactDivider: { width: 1, backgroundColor: COLORS.primary, opacity: 0.2 },
  
  // Summary Card
  summaryCard: { backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: BORDERS.radius.lg, padding: SPACING.md, ...SHADOWS.sm },
  cardTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text, marginBottom: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryLabel: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textSecondary },
  summaryValue: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.text },
  totalValue: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary },
  
  // Share Button
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: SPACING.md, marginTop: SPACING.md, paddingVertical: SPACING.md, borderWidth: 1, borderColor: COLORS.primary, borderRadius: BORDERS.radius.md },
  shareButtonText: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.medium, marginLeft: SPACING.sm },
  
  // XP Popup
  xpPopup: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 60 : 40, 
    alignSelf: 'center', 
    backgroundColor: '#FFD700', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 30, 
    zIndex: 1000,
    ...SHADOWS.lg,
  },
  xpPopupText: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  
  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: SPACING.sm, backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOWS.lg },
  secondaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderWidth: 1, borderColor: COLORS.primary, borderRadius: BORDERS.radius.md, gap: SPACING.xs },
  secondaryButtonText: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  primaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, backgroundColor: COLORS.primary, borderRadius: BORDERS.radius.md, gap: SPACING.xs },
  primaryButtonText: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.white, fontWeight: TYPOGRAPHY.fontWeight.bold },
});

export default OrderConfirmationScreen;
