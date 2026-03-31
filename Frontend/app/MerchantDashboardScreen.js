/**
 * MerchantDashboardScreen - Panel Principal para Comercios
 * Muestra métricas, pedidos pendientes, ganancias y acciones rápidas
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../src/constants/theme';
import { formatPrice, formatNumber } from '../src/utils/format';
import MerchantTipsModal from '../components/MerchantTipsModal';
import UploadCoverModal from '../components/UploadCoverModal';
import { getCategoryBackground } from '../src/constants/categories';

const { width } = Dimensions.get('window');

// Imágenes de fondo por defecto para comercios
const DEFAULT_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
];

const MerchantDashboardScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);
  const [mercadoPagoStatus, setMercadoPagoStatus] = useState(null);
  const [metrics, setMetrics] = useState({
    totalVentas: 0,
    ventasHoy: 0,
    pedidosPendientes: 0,
    pedidosHoy: 0,
    pedidosCompletados: 0,
    productosActivos: 0,
    productosBajoStock: 0,
    calificacionPromedio: 0,
    totalReseñas: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    checkShowTips();
  }, []);

  // Auto-refresh cada 30 segundos para mantener datos actualizados
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!isLoading && !refreshing) {
        loadDashboardData();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(intervalId);
  }, [isLoading, refreshing]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const checkShowTips = async () => {
    try {
      const lastShown = await AsyncStorage.getItem('@merchant_tips_shown');
      const today = new Date().toDateString();
      
      // Mostrar tips si no se han mostrado hoy
      if (lastShown !== today) {
        setShowTips(true);
        await AsyncStorage.setItem('@merchant_tips_shown', today);
      }
    } catch (e) {
      setShowTips(true);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar info de tienda
      const profileRes = await api.get('/profiles/me');
      setStoreInfo(profileRes.data);

      // Cargar estado de Mercado Pago
      try {
        const mpRes = await api.get('/payments/merchant-status');
        setMercadoPagoStatus(mpRes.data);
      } catch (e) {
        console.log('Error loading Mercado Pago status:', e);
      }

      // Cargar 
      // Cargar métricas de productos
      try {
        const productsRes = await api.get('/products/mystore');
        const products = productsRes.data || [];
        const activeProducts = products.filter(p => p.activo);
        const lowStock = products.filter(p => p.cantidad_disponible <= 3);
        
        setMetrics(prev => ({
          ...prev,
          productosActivos: activeProducts.length,
          productosBajoStock: lowStock.length,
        }));
      } catch (e) {
        // Silenciar error 403 (usuario sin permisos de comercio)
        if (e.response?.status === 403) {
          console.log('Usuario no tiene permisos de comercio');
        } else {
          console.log('Error loading products:', e);
        }
      }

      // Cargar pedidos
      try {
        const ordersRes = await api.get('/orders/mystoreorders');
        const orders = ordersRes.data || [];
        
        const today = new Date().toDateString();
        const todayOrders = orders.filter(o => 
          new Date(o.fecha_pedido).toDateString() === today
        );
        const pending = orders.filter(o => 
          ['pendiente', 'confirmado'].includes(o.estado)
        );
        const completed = orders.filter(o => o.estado === 'recogido');
        
        // Calcular ventas
        const totalVentas = completed.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
        const ventasHoy = todayOrders
          .filter(o => o.estado === 'recogido')
          .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
        
        setMetrics(prev => ({
          ...prev,
          totalVentas,
          ventasHoy,
          pedidosPendientes: pending.length,
          pedidosHoy: todayOrders.length,
          pedidosCompletados: completed.length,
        }));
        
        setRecentOrders(pending.slice(0, 5));
      } catch (e) {
        // Silenciar error 403 (usuario sin permisos de comercio)
        if (e.response?.status === 403) {
          console.log('Usuario no tiene permisos de comercio');
        } else {
          console.log('Error loading orders:', e);
        }
      }

      // Cargar estadísticas de reseñas
      try {
        const statsRes = await api.get('/products/mystore/stats');
        if (statsRes.data) {
          setMetrics(prev => ({
            ...prev,
            calificacionPromedio: statsRes.data.calificacion_promedio || 0,
            totalReseñas: statsRes.data.total_resenas || 0,
          }));
        }
      } catch (e) {
        // Silenciar error 403 (usuario sin permisos de comercio)
        if (e.response?.status === 403) {
          console.log('Usuario no tiene permisos de comercio');
        } else {
          console.log('Error loading stats:', e);
        }
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente': return COLORS.warning;
      case 'confirmado': return COLORS.info;
      case 'recogido': return COLORS.success;
      default: return COLORS.textTertiary;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tu panel...</Text>
      </SafeAreaView>
    );
  }

  // Obtener imagen de fondo basada en categoría del comercio
  const backgroundImage = storeInfo?.categoria 
    ? getCategoryBackground(storeInfo.categoria)
    : DEFAULT_BACKGROUNDS[0]; // Fallback si no hay categoría
    
  // Logo del comercio
  const storeLogo = storeInfo?.foto_perfil;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Modal de Tips */}
      <MerchantTipsModal 
        visible={showTips} 
        onClose={() => setShowTips(false)} 
      />

      {/* Modal para editar portada */}
      <UploadCoverModal
        visible={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        onSuccess={() => {
          loadDashboardData();
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.white}
          />
        }
      >
        {/* Hero Header con imagen de fondo */}
        <View style={styles.heroContainer}>
          <ImageBackground 
            source={{ uri: backgroundImage }}
            style={styles.heroBackground}
            imageStyle={styles.heroBackgroundImage}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(3,107,82,0.85)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                {/* Logo del comercio */}
                <View style={styles.logoContainer}>
                  {storeLogo ? (
                    <Image source={{ uri: storeLogo }} style={styles.storeLogo} />
                  ) : (
                    <View style={styles.storeInitials}>
                      <Text style={styles.storeInitialsText}>
                        {(storeInfo?.nombre_comercio || 'MT').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroGreeting}>¡Bienvenido! 👋</Text>
                  <Text style={styles.heroStoreName}>{storeInfo?.nombre_comercio || 'Mi Tienda'}</Text>
                  <View style={styles.heroRatingRow}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.heroRating}>
                      {formatNumber(metrics.calificacionPromedio, 1)} • {metrics.totalReseñas} reseñas
                    </Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.heroTipsButton}
                  onPress={() => setShowTips(true)}
                >
                  <Ionicons name="bulb" size={22} color="#FFD700" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.heroCoverButton}
                  onPress={() => setShowCoverModal(true)}
                >
                  <Ionicons name="camera" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Resumen rápido */}
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>${formatPrice(metrics.ventasHoy)}</Text>
                  <Text style={styles.heroStatLabel}>Ventas hoy</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{metrics.pedidosPendientes}</Text>
                  <Text style={styles.heroStatLabel}>Pendientes</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{metrics.pedidosHoy}</Text>
                  <Text style={styles.heroStatLabel}>Pedidos hoy</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Warning de Mercado Pago - Si no está configurado */}
        {mercadoPagoStatus && !mercadoPagoStatus.chargesEnabled && (
          <View style={styles.stripeWarningContainer}>
            <TouchableOpacity
              style={styles.stripeWarning}
              onPress={() => navigation.navigate('MerchantPaymentSettings')}
            >
              <View style={styles.stripeWarningIcon}>
                <Ionicons name="warning" size={24} color="#FF9500" />
              </View>
              <View style={styles.stripeWarningContent}>
                <Text style={styles.stripeWarningTitle}>
                  {mercadoPagoStatus.hasMercadoPagoAccount 
                    ? 'Completa tu configuración de pagos'
                    : 'Configura tu cuenta para recibir pagos'}
                </Text>
                <Text style={styles.stripeWarningText}>
                  {mercadoPagoStatus.hasMercadoPagoAccount 
                    ? 'Falta información para activar tu cuenta'
                    : 'Vincula tu cuenta de Mercado Pago'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Métricas Principales */}
        <View style={styles.metricsContainer}>
          <Text style={styles.metricsTitle}>Métricas de Rendimiento</Text>
          
          {/* Fila 1: Métricas financieras principales */}
          <View style={styles.metricsRowPrimary}>
            <View style={[styles.metricCard, styles.metricCardRevenue]}>
              <View style={styles.metricHeader}>
                <View style={[styles.metricIcon, { backgroundColor: COLORS.success + '20' }]}>
                  <MaterialCommunityIcons name="cash-multiple" size={32} color={COLORS.success} />
                </View>
                <View style={styles.metricBadge}>
                  <Text style={styles.metricBadgeText}>+{Math.round((metrics.ventasHoy / Math.max(metrics.totalVentas / 30, 1)) * 100)}%</Text>
                </View>
              </View>
              <Text style={styles.metricValueLarge}>${formatPrice(metrics.totalVentas)}</Text>
              <Text style={styles.metricLabel}>Ingresos Totales</Text>
              <View style={styles.metricSubRow}>
                <Text style={styles.metricSubGreen}>Hoy: ${formatPrice(metrics.ventasHoy)}</Text>
                <Text style={styles.metricSubGray}>Meta: 75% lograda</Text>
              </View>
            </View>

            <View style={[styles.metricCard, styles.metricCardOrders]}>
              <View style={styles.metricHeader}>
                <View style={[styles.metricIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons name="receipt" size={28} color={COLORS.primary} />
                </View>
                <View style={[styles.metricBadge, { backgroundColor: metrics.pedidosPendientes > 0 ? COLORS.warning + '20' : COLORS.success + '20' }]}>
                  <Text style={[styles.metricBadgeText, { color: metrics.pedidosPendientes > 0 ? COLORS.warning : COLORS.success }]}>                    {metrics.pedidosPendientes > 0 ? 'ACTIVO' : 'OK'}
                  </Text>
                </View>
              </View>
              <Text style={styles.metricValueLarge}>{metrics.pedidosCompletados}</Text>
              <Text style={styles.metricLabel}>Pedidos Completados</Text>
              <View style={styles.metricSubRow}>
                <Text style={styles.metricSubOrange}>Pendientes: {metrics.pedidosPendientes}</Text>
                <Text style={styles.metricSubGray}>Hoy: {metrics.pedidosHoy}</Text>
              </View>
            </View>
          </View>

          {/* Fila 2: Métricas operativas */}
          <View style={styles.metricsRowSecondary}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: COLORS.info + '20' }]}>
                <Ionicons name="storefront" size={24} color={COLORS.info} />
              </View>
              <Text style={styles.metricValue}>{metrics.productosActivos}</Text>
              <Text style={styles.metricLabel}>Productos Activos</Text>
              {metrics.productosBajoStock > 0 && (
                <Text style={styles.metricAlert}>⚠️ {metrics.productosBajoStock} bajo stock</Text>
              )}
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: '#FFD700' + '30' }]}>
                <Ionicons name="star" size={24} color="#FFD700" />
              </View>
              <Text style={styles.metricValue}>{formatNumber(metrics.calificacionPromedio, 1)}/5</Text>
              <Text style={styles.metricLabel}>Calificación</Text>
              <Text style={styles.metricSub}>{metrics.totalReseñas} reseñas</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: COLORS.success + '20' }]}>
                <MaterialCommunityIcons name="percent" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.metricValue}>75%</Text>
              <Text style={styles.metricLabel}>Margen Objetivo</Text>
              <Text style={[styles.metricSub, { color: metrics.totalVentas > 1000 ? COLORS.success : COLORS.warning }]}>
                {metrics.totalVentas > 1000 ? 'Alcanzado' : 'En progreso'}
              </Text>
            </View>
          </View>
        </View>

        {/* Alertas */}
        {metrics.productosBajoStock > 0 && (
          <TouchableOpacity 
            style={styles.alertCard}
            onPress={() => navigation.navigate('MisProductos')}
          >
            <View style={styles.alertIcon}>
              <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Bajo stock</Text>
              <Text style={styles.alertText}>
                {metrics.productosBajoStock} producto(s) con menos de 3 unidades
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}

        {/* Pedidos Pendientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pedidos Pendientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Pedidos')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Ionicons name="clipboard-outline" size={40} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>Sin pedidos pendientes</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderCard}
                onPress={() => navigation.navigate('Pedidos')}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderCode}>#{order.codigo_recogida}</Text>
                  <View style={[
                    styles.orderStatus,
                    { backgroundColor: getStatusColor(order.estado) + '20' }
                  ]}>
                    <Text style={[
                      styles.orderStatusText,
                      { color: getStatusColor(order.estado) }
                    ]}>
                      {order.estado}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderProduct} numberOfLines={1}>
                  {order.nombre_producto}
                </Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderBuyer}>{order.nombre_comprador}</Text>
                  <Text style={styles.orderTotal}>${formatPrice(order.total || 0)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('AddProduct')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="add" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.quickActionText}>Nuevo Pack</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('MisProductos')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.info }]}>
                <Ionicons name="pricetags" size={22} color={COLORS.white} />
              </View>
              <Text style={styles.quickActionText}>Productos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('PaymentSettings')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#5856D6' }]}>
                <Ionicons name="card" size={22} color={COLORS.white} />
              </View>
              <Text style={styles.quickActionText}>Pagos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('StoreReviews')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="chatbubbles" size={22} color={COLORS.white} />
              </View>
              <Text style={styles.quickActionText}>Reseñas</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: Platform.OS === 'android' ? 50 : 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },
  scrollView: { flex: 1 },

  // Stripe Warning
  stripeWarningContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  stripeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    borderRadius: 12,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    ...SHADOWS.sm,
  },
  stripeWarningIcon: {
    marginRight: SPACING.sm,
  },
  stripeWarningContent: {
    flex: 1,
  },
  stripeWarningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CC7A00',
    marginBottom: 2,
  },
  stripeWarningText: {
    fontSize: 13,
    color: '#996600',
  },

  // Hero Header
  heroContainer: {
    marginBottom: SPACING.md,
  },
  heroBackground: {
    width: '100%',
    height: 220,
  },
  heroBackgroundImage: {
    resizeMode: 'cover',
  },
  heroGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: SPACING.md,
  },
  storeLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  storeInitials: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  storeInitialsText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  heroStoreName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginTop: 2,
  },
  heroRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  heroRating: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },
  heroTipsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCoverButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: SPACING.sm,
  },
  heroStat: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Legacy Header (mantener por compatibilidad)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: SPACING.md,
  },
  greeting: { fontSize: 16, color: COLORS.textSecondary },
  storeName: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  tipsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Metrics Container - New Professional Design
  metricsContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metricsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  metricsRowPrimary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricsRowSecondary: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCardRevenue: {
    flex: 1.2,
    minHeight: 140,
  },
  metricCardOrders: {
    flex: 1,
    minHeight: 140,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metricBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metricBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  metricValueLarge: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },
  metricSubGreen: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  metricSubOrange: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '600',
  },
  metricSubGray: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  metricAlert: {
    fontSize: 10,
    color: COLORS.warning,
    fontWeight: '600',
    marginTop: 4,
  },

  // Legacy Metrics Grid (mantener por compatibilidad)
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 110,
    ...SHADOWS.sm,
  },
  metricCardLarge: {
    width: (width - SPACING.md * 2 - 10) / 2 + 5,
  },
  metricIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: COLORS.text,
    marginBottom: 2,
  },
  metricLabel: { 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    fontWeight: '600',
    marginBottom: 4,
  },
  metricSubRow: { 
    width: '100%',
    gap: 4,
  },
  metricSub: { 
    fontSize: 11, 
    color: COLORS.textSecondary, 
    fontWeight: '500',
  },

  // Alert Card
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 12,
    padding: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  alertIcon: { marginRight: SPACING.sm },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  alertText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Section
  section: { marginTop: SPACING.lg, paddingHorizontal: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  seeAllText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  // Empty Orders
  emptyOrders: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  emptyText: { marginTop: 8, fontSize: 14, color: COLORS.textTertiary },

  // Order Card
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: 8,
    ...SHADOWS.sm,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderCode: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  orderStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  orderStatusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  orderProduct: { fontSize: 14, color: COLORS.text, marginTop: 6 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  orderBuyer: { fontSize: 12, color: COLORS.textSecondary },
  orderTotal: { fontSize: 14, fontWeight: '700', color: COLORS.text },

  // Quick Actions
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: { fontSize: 11, color: COLORS.text, fontWeight: '600', textAlign: 'center' },
});

export default MerchantDashboardScreen;
