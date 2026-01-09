/**
 * AdminMetricsScreen - Panel de Métricas y Estadísticas
 * Métricas de ventas, operaciones, por ciudad y por comercio
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SPACING, SHADOWS } from '../../src/constants/theme';
import { formatNumber } from '../../src/utils/format';

const { width } = Dimensions.get('window');

const AdminMetricsScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // general, cities, stores
  
  // Métricas generales
  const [generalMetrics, setGeneralMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalStores: 0,
    totalUsers: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    growthRate: 0,
  });

  // Métricas por ciudad
  const [cityMetrics, setCityMetrics] = useState([]);

  // Métricas por comercio
  const [storeMetrics, setStoreMetrics] = useState([]);

  // Tendencias
  const [trends, setTrends] = useState({
    dailySales: [],
    topCategories: [],
    peakHours: [],
  });

  const loadMetrics = async () => {
    try {
      setIsLoading(true);

      // Cargar datos base
      const [storesRes, productsRes] = await Promise.all([
        api.get('/stores').catch(() => ({ data: [] })),
        api.get('/products').catch(() => ({ data: [] })),
      ]);

      const stores = storesRes.data || [];
      const products = productsRes.data || [];

      // Cargar pedidos
      let orders = [];
      try {
        const ordersRes = await api.get('/orders/all');
        orders = ordersRes.data || [];
      } catch (e) {
        orders = generateDemoOrders();
      }

      // Calcular métricas generales
      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      const completedOrders = orders.filter(o => o.estado !== 'cancelado');
      const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

      // Calcular crecimiento (comparar con período anterior - demo)
      const thisMonth = orders.filter(o => {
        const date = new Date(o.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
      const lastMonth = orders.filter(o => {
        const date = new Date(o.created_at);
        const now = new Date();
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
      });
      
      const thisMonthRevenue = thisMonth.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      const lastMonthRevenue = lastMonth.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      const growthRate = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      setGeneralMetrics({
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalStores: stores.length,
        totalUsers: Math.floor(orders.length * 0.7), // Aproximación
        avgOrderValue,
        conversionRate: 3.2, // Demo
        growthRate,
      });

      // Calcular métricas por ciudad
      const citiesMap = {};
      stores.forEach(store => {
        const city = store.ciudad || 'Sin ciudad';
        if (!citiesMap[city]) {
          citiesMap[city] = { stores: 0, products: 0, orders: 0, revenue: 0 };
        }
        citiesMap[city].stores++;
        citiesMap[city].products += store.total_productos || products.filter(p => p.store_id === store.id).length;
      });

      // Asignar órdenes a ciudades (aproximación)
      orders.forEach(order => {
        const store = stores.find(s => s.id === order.store_id);
        if (store) {
          const city = store.ciudad || 'Sin ciudad';
          if (citiesMap[city]) {
            citiesMap[city].orders++;
            citiesMap[city].revenue += parseFloat(order.total || 0);
          }
        }
      });

      const cityMetricsArray = Object.entries(citiesMap)
        .map(([city, data]) => ({ city, ...data }))
        .sort((a, b) => b.revenue - a.revenue);
      setCityMetrics(cityMetricsArray);

      // Calcular métricas por comercio
      const storeMetricsArray = stores.map(store => {
        const storeOrders = orders.filter(o => o.store_id === store.id);
        const storeRevenue = storeOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
        const storeProducts = products.filter(p => p.store_id === store.id).length;

        return {
          id: store.id,
          nombre: store.nombre,
          ciudad: store.ciudad || 'Sin ciudad',
          productos: store.total_productos || storeProducts,
          ordenes: storeOrders.length,
          revenue: storeRevenue,
          rating: store.rating || Math.random() * 2 + 3, // Demo
          activo: store.activo !== false,
        };
      }).sort((a, b) => b.revenue - a.revenue);
      setStoreMetrics(storeMetricsArray);

      // Tendencias (demo data)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate.toDateString() === date.toDateString();
        });
        last7Days.push({
          day: date.toLocaleDateString('es-MX', { weekday: 'short' }),
          sales: dayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0),
          orders: dayOrders.length,
        });
      }

      setTrends({
        dailySales: last7Days,
        topCategories: [
          { name: 'Panadería', percentage: 35 },
          { name: 'Frutas', percentage: 25 },
          { name: 'Comida preparada', percentage: 20 },
          { name: 'Lácteos', percentage: 12 },
          { name: 'Otros', percentage: 8 },
        ],
        peakHours: [
          { hour: '12:00', orders: 45 },
          { hour: '13:00', orders: 62 },
          { hour: '18:00', orders: 58 },
          { hour: '19:00', orders: 71 },
          { hour: '20:00', orders: 55 },
        ],
      });

    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const generateDemoOrders = () => {
    const orders = [];
    const now = new Date();
    
    for (let i = 0; i < 100; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      orders.push({
        id: i + 1,
        total: (Math.random() * 400 + 50).toFixed(2),
        estado: Math.random() > 0.1 ? 'completado' : 'cancelado',
        created_at: date.toISOString(),
        store_id: Math.floor(Math.random() * 10) + 1,
      });
    }
    
    return orders;
  };

  useFocusEffect(
    useCallback(() => {
      loadMetrics();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMetrics();
  }, []);

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
  };

  const tabs = [
    { id: 'general', label: 'General', icon: 'analytics' },
    { id: 'cities', label: 'Ciudades', icon: 'location' },
    { id: 'stores', label: 'Comercios', icon: 'storefront' },
  ];

  const renderGeneralTab = () => (
    <View style={styles.tabContent}>
      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, styles.kpiCardLarge]}>
          <View style={[styles.kpiIcon, { backgroundColor: '#34C75920' }]}>
            <Ionicons name="cash" size={28} color="#34C759" />
          </View>
          <Text style={styles.kpiValue}>{formatCurrency(generalMetrics.totalRevenue)}</Text>
          <Text style={styles.kpiLabel}>Ingresos Totales</Text>
          <View style={styles.kpiGrowth}>
            <Ionicons 
              name={generalMetrics.growthRate >= 0 ? 'trending-up' : 'trending-down'} 
              size={14} 
              color={generalMetrics.growthRate >= 0 ? '#34C759' : '#FF3B30'} 
            />
            <Text style={[
              styles.kpiGrowthText,
              { color: generalMetrics.growthRate >= 0 ? '#34C759' : '#FF3B30' }
            ]}>
              {generalMetrics.growthRate >= 0 ? '+' : ''}{formatNumber(generalMetrics.growthRate, 1)}% vs mes anterior
            </Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, styles.kpiCardHalf]}>
            <View style={[styles.kpiIconSmall, { backgroundColor: '#007AFF20' }]}>
              <Ionicons name="receipt" size={20} color="#007AFF" />
            </View>
            <Text style={styles.kpiValueSmall}>{generalMetrics.totalOrders}</Text>
            <Text style={styles.kpiLabelSmall}>Pedidos</Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiCardHalf]}>
            <View style={[styles.kpiIconSmall, { backgroundColor: '#FF950020' }]}>
              <Ionicons name="cart" size={20} color="#FF9500" />
            </View>
            <Text style={styles.kpiValueSmall}>{formatCurrency(generalMetrics.avgOrderValue)}</Text>
            <Text style={styles.kpiLabelSmall}>Ticket Promedio</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, styles.kpiCardHalf]}>
            <View style={[styles.kpiIconSmall, { backgroundColor: '#AF52DE20' }]}>
              <Ionicons name="storefront" size={20} color="#AF52DE" />
            </View>
            <Text style={styles.kpiValueSmall}>{generalMetrics.totalStores}</Text>
            <Text style={styles.kpiLabelSmall}>Comercios</Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiCardHalf]}>
            <View style={[styles.kpiIconSmall, { backgroundColor: '#FF3B3020' }]}>
              <Ionicons name="fast-food" size={20} color="#FF3B30" />
            </View>
            <Text style={styles.kpiValueSmall}>{generalMetrics.totalProducts}</Text>
            <Text style={styles.kpiLabelSmall}>Productos</Text>
          </View>
        </View>
      </View>

      {/* Sales Trend Chart (simplified) */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Ventas Últimos 7 Días</Text>
        <View style={styles.barChart}>
          {trends.dailySales.map((day, index) => {
            const maxSales = Math.max(...trends.dailySales.map(d => d.sales), 1);
            const barHeight = (day.sales / maxSales) * 100;
            
            return (
              <View key={index} style={styles.barContainer}>
                <Text style={styles.barValue}>{formatCurrency(day.sales)}</Text>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height: `${Math.max(barHeight, 5)}%` }]} />
                </View>
                <Text style={styles.barLabel}>{day.day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Top Categories */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Categorías Más Vendidas</Text>
        {trends.topCategories.map((category, index) => (
          <View key={index} style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(index) }]} />
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            <View style={styles.categoryBarContainer}>
              <View style={[styles.categoryBar, { width: `${category.percentage}%`, backgroundColor: getCategoryColor(index) }]} />
            </View>
            <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
          </View>
        ))}
      </View>

      {/* Peak Hours */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Horas Pico</Text>
        <View style={styles.peakHoursContainer}>
          {trends.peakHours.map((peak, index) => (
            <View key={index} style={styles.peakHourItem}>
              <View style={styles.peakHourIcon}>
                <Ionicons name="time" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.peakHourTime}>{peak.hour}</Text>
              <Text style={styles.peakHourOrders}>{peak.orders} pedidos</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderCitiesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Métricas por Ciudad</Text>
      
      {cityMetrics.length > 0 ? (
        cityMetrics.map((city, index) => (
          <View key={city.city} style={styles.cityCard}>
            <View style={styles.cityHeader}>
              <View style={styles.cityRank}>
                <Text style={styles.cityRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.cityInfo}>
                <Text style={styles.cityName}>{city.city}</Text>
                <Text style={styles.citySubtext}>{city.stores} comercios</Text>
              </View>
              <Text style={styles.cityRevenue}>{formatCurrency(city.revenue)}</Text>
            </View>
            
            <View style={styles.cityStats}>
              <View style={styles.cityStat}>
                <Ionicons name="fast-food-outline" size={16} color="#666" />
                <Text style={styles.cityStatText}>{city.products} productos</Text>
              </View>
              <View style={styles.cityStat}>
                <Ionicons name="receipt-outline" size={16} color="#666" />
                <Text style={styles.cityStatText}>{city.orders} pedidos</Text>
              </View>
              <View style={styles.cityStat}>
                <Ionicons name="trending-up" size={16} color="#34C759" />
                <Text style={styles.cityStatText}>
                  {city.orders > 0 ? formatCurrency(city.revenue / city.orders) : '$0'} prom
                </Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>Sin datos de ciudades</Text>
        </View>
      )}
    </View>
  );

  const renderStoresTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Top Comercios por Ventas</Text>
      
      {storeMetrics.length > 0 ? (
        storeMetrics.slice(0, 20).map((store, index) => (
          <View key={store.id} style={styles.storeCard}>
            <View style={styles.storeHeader}>
              <View style={[
                styles.storeRank,
                index < 3 && { backgroundColor: ['#FFD700', '#C0C0C0', '#CD7F32'][index] }
              ]}>
                <Text style={[styles.storeRankText, index < 3 && { color: '#fff' }]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName} numberOfLines={1}>{store.nombre}</Text>
                <Text style={styles.storeCity}>{store.ciudad}</Text>
              </View>
              <View style={[
                styles.storeStatus,
                { backgroundColor: store.activo ? '#E8F5E9' : '#FFEBEE' }
              ]}>
                <View style={[
                  styles.storeStatusDot,
                  { backgroundColor: store.activo ? '#34C759' : '#FF3B30' }
                ]} />
              </View>
            </View>
            
            <View style={styles.storeMetrics}>
              <View style={styles.storeMetric}>
                <Text style={styles.storeMetricValue}>{formatCurrency(store.revenue)}</Text>
                <Text style={styles.storeMetricLabel}>Ventas</Text>
              </View>
              <View style={styles.storeMetric}>
                <Text style={styles.storeMetricValue}>{store.ordenes}</Text>
                <Text style={styles.storeMetricLabel}>Pedidos</Text>
              </View>
              <View style={styles.storeMetric}>
                <Text style={styles.storeMetricValue}>{store.productos}</Text>
                <Text style={styles.storeMetricLabel}>Productos</Text>
              </View>
              <View style={styles.storeMetric}>
                <View style={styles.storeRating}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.storeMetricValue}>{formatNumber(store.rating, 1)}</Text>
                </View>
                <Text style={styles.storeMetricLabel}>Rating</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>Sin datos de comercios</Text>
        </View>
      )}
    </View>
  );

  const getCategoryColor = (index) => {
    const colors = ['#34C759', '#007AFF', '#FF9500', '#AF52DE', '#999'];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando métricas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Métricas</Text>
        <Text style={styles.headerSubtitle}>Análisis y estadísticas</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={18} 
              color={activeTab === tab.id ? COLORS.primary : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'cities' && renderCitiesTab()}
        {activeTab === 'stores' && renderStoresTab()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Tab Content
  scrollContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 14,
  },

  // KPI Cards
  kpiGrid: {
    marginBottom: 20,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  kpiCardLarge: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiCardHalf: {
    width: (width - 44) / 2,
    alignItems: 'center',
  },
  kpiIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiIconSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  kpiValueSmall: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  kpiLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  kpiLabelSmall: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  kpiGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  kpiGrowthText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Chart Section
  chartSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
  },
  barWrapper: {
    width: 24,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 6,
    textTransform: 'capitalize',
  },

  // Categories
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 13,
    color: '#333',
  },
  categoryBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    width: 40,
    textAlign: 'right',
  },

  // Peak Hours
  peakHoursContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  peakHourItem: {
    width: '30%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  peakHourIcon: {
    marginBottom: 6,
  },
  peakHourTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  peakHourOrders: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },

  // City Cards
  cityCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  cityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cityRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cityRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  citySubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cityRevenue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  cityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cityStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },

  // Store Cards
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  storeCity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  storeStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  storeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  storeMetric: {
    alignItems: 'center',
  },
  storeMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  storeMetricLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  storeRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default AdminMetricsScreen;
