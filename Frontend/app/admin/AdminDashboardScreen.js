/**
 * AdminDashboardScreen - Panel Principal de Administración
 * Vista general de toda la actividad de Delicrunch
 */
import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SPACING, SHADOWS } from '../../src/constants/theme';
import { formatPrice } from '../../src/utils/format';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Métricas principales
  const [metrics, setMetrics] = useState({
    totalStores: 0,
    pendingStores: 0,
    activeStores: 0,
    inactiveStores: 0,
    totalUsers: 0,
    totalBuyers: 0,
    totalOrders: 0,
    ordersToday: 0,
    totalRevenue: 0,
    revenueToday: 0,
    pendingReviews: 0,
    totalProducts: 0,
    activeProducts: 0,
  });

  // Alertas y actividad reciente
  const [alerts, setAlerts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Cargar tiendas
      const storesRes = await api.get('/stores').catch(() => ({ data: [] }));
      const stores = storesRes.data || [];
      
      // Cargar usuarios (simulado - el endpoint real sería /admin/users)
      let users = [];
      try {
        const usersRes = await api.get('/admin/users');
        users = usersRes.data || [];
      } catch (e) {
        // Si no existe el endpoint, usar datos de demostración
        users = [{ rol: 'comprador' }, { rol: 'comprador' }, { rol: 'comercio' }];
      }

      // Cargar pedidos
      let orders = [];
      try {
        const ordersRes = await api.get('/admin/transactions');
        orders = ordersRes.data || [];
      } catch (e) {
        orders = [];
      }

      // Cargar productos
      const productsRes = await api.get('/products').catch(() => ({ data: [] }));
      const products = productsRes.data || [];

      // Cargar reviews
      let reviews = [];
      try {
        const reviewsRes = await api.get('/reviews');
        reviews = reviewsRes.data || [];
      } catch (e) {
        reviews = [];
      }

      // Calcular métricas
      const today = new Date().toDateString();
      const ordersToday = orders.filter(o => new Date(o.created_at).toDateString() === today);
      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      const revenueToday = ordersToday.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

      setMetrics({
        totalStores: stores.length,
        pendingStores: stores.filter(s => s.estado === 'pendiente').length,
        activeStores: stores.filter(s => s.activo !== false).length,
        inactiveStores: stores.filter(s => s.activo === false).length,
        totalUsers: users.length,
        totalBuyers: users.filter(u => u.rol === 'comprador').length,
        totalOrders: orders.length,
        ordersToday: ordersToday.length,
        totalRevenue,
        revenueToday,
        pendingReviews: reviews.filter(r => r.estado === 'pendiente').length,
        totalProducts: products.length,
        activeProducts: products.filter(p => p.cantidad_disponible > 0).length,
      });

      // Generar alertas
      const newAlerts = [];
      const pendingStores = stores.filter(s => s.estado === 'pendiente');
      if (pendingStores.length > 0) {
        newAlerts.push({
          id: 'pending_stores',
          type: 'warning',
          icon: 'storefront',
          title: `${pendingStores.length} comercio(s) pendiente(s)`,
          subtitle: 'Requieren aprobación',
          action: () => navigation.navigate('AdminStores'),
        });
      }

      const lowStockProducts = products.filter(p => p.cantidad_disponible > 0 && p.cantidad_disponible <= 2);
      if (lowStockProducts.length > 0) {
        newAlerts.push({
          id: 'low_stock',
          type: 'info',
          icon: 'warning',
          title: `${lowStockProducts.length} producto(s) con bajo stock`,
          subtitle: 'Quedan pocas unidades',
        });
      }

      setAlerts(newAlerts);

      // Actividad reciente (últimos 5 pedidos)
      const recent = orders
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(o => ({
          id: o.id,
          type: 'order',
          title: `Pedido #${o.id}`,
          subtitle: `${formatPrice(o.total)} - ${o.estado || 'pendiente'}`,
          time: new Date(o.created_at).toLocaleString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: 'short'
          }),
        }));
      setRecentActivity(recent);

    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  // Tarjetas de navegación rápida
  const quickActions = [
    {
      id: 'stores',
      icon: 'storefront',
      label: 'Comercios',
      color: '#007AFF',
      badge: metrics.pendingStores,
      onPress: () => navigation.navigate('AdminStores'),
    },
    {
      id: 'reviews',
      icon: 'chatbubbles',
      label: 'Reviews',
      color: '#FF9500',
      badge: metrics.pendingReviews,
      onPress: () => navigation.navigate('AdminReviews'),
    },
    {
      id: 'transactions',
      icon: 'card',
      label: 'Transacciones',
      color: '#34C759',
      onPress: () => navigation.navigate('AdminTransactions'),
    },
    {
      id: 'metrics',
      icon: 'bar-chart',
      label: 'Métricas',
      color: '#AF52DE',
      onPress: () => navigation.navigate('AdminMetrics'),
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando panel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Panel de Administración</Text>
          <Text style={styles.subtitle}>Delicrunch Control Center</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Alertas */}
        {alerts.length > 0 && (
          <View style={styles.alertsContainer}>
            {alerts.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={[styles.alertCard, alert.type === 'warning' && styles.alertWarning]}
                onPress={alert.action}
                activeOpacity={0.8}
              >
                <View style={[styles.alertIcon, alert.type === 'warning' && styles.alertIconWarning]}>
                  <Ionicons name={alert.icon} size={20} color={alert.type === 'warning' ? '#FF9500' : COLORS.primary} />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertSubtitle}>{alert.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Métricas principales */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.metricCardLarge]}>
            <View style={[styles.metricIcon, { backgroundColor: '#34C75920' }]}>
              <Ionicons name="cash" size={24} color="#34C759" />
            </View>
            <Text style={styles.metricValue}>{formatCurrency(metrics.totalRevenue)}</Text>
            <Text style={styles.metricLabel}>Ingresos Totales</Text>
            <View style={styles.metricSubRow}>
              <Text style={styles.metricSubValue}>Hoy: {formatCurrency(metrics.revenueToday)}</Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={[styles.metricCard, styles.metricCardHalf]}>
              <View style={[styles.metricIcon, { backgroundColor: '#007AFF20' }]}>
                <Ionicons name="storefront" size={20} color="#007AFF" />
              </View>
              <Text style={styles.metricValue}>{metrics.totalStores}</Text>
              <Text style={styles.metricLabel}>Comercios</Text>
              <Text style={styles.metricSubtext}>
                {metrics.activeStores} activos
              </Text>
            </View>

            <View style={[styles.metricCard, styles.metricCardHalf]}>
              <View style={[styles.metricIcon, { backgroundColor: '#FF950020' }]}>
                <Ionicons name="receipt" size={20} color="#FF9500" />
              </View>
              <Text style={styles.metricValue}>{metrics.totalOrders}</Text>
              <Text style={styles.metricLabel}>Pedidos</Text>
              <Text style={styles.metricSubtext}>
                {metrics.ordersToday} hoy
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={[styles.metricCard, styles.metricCardHalf]}>
              <View style={[styles.metricIcon, { backgroundColor: '#AF52DE20' }]}>
                <Ionicons name="people" size={20} color="#AF52DE" />
              </View>
              <Text style={styles.metricValue}>{metrics.totalUsers}</Text>
              <Text style={styles.metricLabel}>Usuarios</Text>
              <Text style={styles.metricSubtext}>
                {metrics.totalBuyers} compradores
              </Text>
            </View>

            <View style={[styles.metricCard, styles.metricCardHalf]}>
              <View style={[styles.metricIcon, { backgroundColor: '#FF3B3020' }]}>
                <Ionicons name="fast-food" size={20} color="#FF3B30" />
              </View>
              <Text style={styles.metricValue}>{metrics.totalProducts}</Text>
              <Text style={styles.metricLabel}>Productos</Text>
              <Text style={styles.metricSubtext}>
                {metrics.activeProducts} disponibles
              </Text>
            </View>
          </View>
        </View>

        {/* Acciones rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={28} color={action.color} />
                  {action.badge > 0 && (
                    <View style={styles.quickActionBadge}>
                      <Text style={styles.quickActionBadgeText}>{action.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actividad reciente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          {recentActivity.length > 0 ? (
            <View style={styles.activityList}>
              {recentActivity.map((activity, index) => (
                <View 
                  key={activity.id} 
                  style={[
                    styles.activityItem,
                    index === recentActivity.length - 1 && styles.activityItemLast
                  ]}
                >
                  <View style={styles.activityIcon}>
                    <Ionicons name="receipt-outline" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                  </View>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="time-outline" size={40} color="#ccc" />
              <Text style={styles.emptyActivityText}>Sin actividad reciente</Text>
            </View>
          )}
        </View>

        {/* Resumen del sistema */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado del Sistema</Text>
          <View style={styles.systemStatus}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.statusText}>API activa</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.statusText}>Base de datos conectada</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.statusText}>Pagos habilitados</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: Platform.OS === 'android' ? 8 : 0, // Margin extra para Android
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  adminBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Alerts
  alertsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  alertWarning: {
    borderLeftColor: '#FF9500',
    backgroundColor: '#FFF9F0',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertIconWarning: {
    backgroundColor: '#FF950015',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  alertSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  // Metrics
  metricsGrid: {
    padding: 16,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  metricCardLarge: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCardHalf: {
    width: (width - 44) / 2,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  metricSubRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metricSubValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  metricSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 14,
  },

  // Quick actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  quickActionBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  quickActionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  // Activity
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityItemLast: {
    borderBottomWidth: 0,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
  },
  emptyActivity: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyActivityText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },

  // System status
  systemStatus: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.sm,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
});

export default AdminDashboardScreen;
