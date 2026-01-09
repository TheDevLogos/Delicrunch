/**
 * MerchantDashboardScreen - Panel Principal para Comercios
 * Muestra métricas, pedidos pendientes, ganancias y acciones rápidas
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../src/constants/theme';
import { formatPrice, formatNumber } from '../src/utils/format';
import MerchantTipsModal from '../components/MerchantTipsModal';

const { width } = Dimensions.get('window');

const MerchantDashboardScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tu panel...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Modal de Tips */}
      <MerchantTipsModal 
        visible={showTips} 
        onClose={() => setShowTips(false)} 
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola! 👋</Text>
            <Text style={styles.storeName}>{storeInfo?.nombre_comercio || 'Mi Tienda'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.tipsButton}
            onPress={() => setShowTips(true)}
          >
            <Ionicons name="bulb" size={24} color={COLORS.warning} />
          </TouchableOpacity>
        </View>

        {/* Métricas Principales */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.metricCardLarge]}>
            <View style={[styles.metricIcon, { backgroundColor: COLORS.success + '20' }]}>
              <MaterialCommunityIcons name="cash-multiple" size={28} color={COLORS.success} />
            </View>
            <Text style={styles.metricValue}>${formatPrice(metrics.totalVentas)}</Text>
            <Text style={styles.metricLabel}>Ventas Totales</Text>
            <View style={styles.metricSubRow}>
              <Text style={styles.metricSub}>Hoy: ${formatPrice(metrics.ventasHoy)}</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: COLORS.warning + '20' }]}>
              <Ionicons name="time" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.metricValue}>{metrics.pedidosPendientes}</Text>
            <Text style={styles.metricLabel}>Pendientes</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="today" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.metricValue}>{metrics.pedidosHoy}</Text>
            <Text style={styles.metricLabel}>Pedidos Hoy</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="checkmark-done" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.metricValue}>{metrics.pedidosCompletados}</Text>
            <Text style={styles.metricLabel}>Completados</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: COLORS.info + '20' }]}>
              <Ionicons name="fast-food" size={24} color={COLORS.info} />
            </View>
            <Text style={styles.metricValue}>{metrics.productosActivos}</Text>
            <Text style={styles.metricLabel}>Productos</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#FFD700' + '30' }]}>
              <Ionicons name="star" size={24} color="#FFD700" />
            </View>
            <Text style={styles.metricValue}>{formatNumber(metrics.calificacionPromedio, 1)}</Text>
            <Text style={styles.metricLabel}>Calificación</Text>
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
              onPress={() => navigation.navigate('Historial')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.success }]}>
                <Ionicons name="receipt" size={22} color={COLORS.white} />
              </View>
              <Text style={styles.quickActionText}>Historial</Text>
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

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },
  scrollView: { flex: 1 },

  // Header
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

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: 10,
  },
  metricCard: {
    width: (width - SPACING.md * 2 - 20) / 3,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  metricCardLarge: {
    width: (width - SPACING.md * 2 - 10) / 2 + 5,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  metricLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  metricSubRow: { marginTop: 4 },
  metricSub: { fontSize: 11, color: COLORS.success, fontWeight: '600' },

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
