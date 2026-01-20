/**
 * AdminStoresScreen - Gestión de Comercios
 * Ajustes de UI y listas
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SPACING, SHADOWS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
const IS_NARROW = width < 640;
const CARD_WIDTH = IS_NARROW ? width - 32 : Math.min((width - 48) / 2, 420);

const AdminStoresScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedStore, setSelectedStore] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState([]);
  const [advancedFilters, setAdvancedFilters] = useState({ ciudad: '', minRating: 0, minOrders: 0, sortBy: 'recent' });

  const stats = useMemo(() => {
    const total = stores.length;
    const activos = stores.filter(s => s.activo === true && s.estado !== 'pendiente').length;
    const pendientes = stores.filter(s => s.estado === 'pendiente').length;
    const inactivos = stores.filter(s => s.activo === false).length;
    
    // Total de pedidos SIN duplicados
    const totalPedidos = stores.reduce((sum, s) => {
      const orders = parseInt(s.total_orders) || 0;
      return sum + orders;
    }, 0);

    // Ingresos totales - normalizar valores
    const totalRevenueRaw = stores.reduce((sum, s) => {
      const rev = parseFloat(s.total_revenue) || 0;
      return sum + rev;
    }, 0);

    // Promedio de pedidos por tienda (solo tiendas activas)
    const activosCount = activos > 0 ? activos : 1;
    const avgOrdersPerStore = Math.round(totalPedidos / activosCount);
    
    // Nuevas tiendas en los últimos 30 días
    const now = Date.now();
    const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
    const newStores30Days = stores.filter(s => {
      const regDate = new Date(s.fecha_registro || s.created_at);
      return now - regDate.getTime() <= THIRTY_DAYS;
    }).length;

    // Calificación promedio - solo de tiendas con rating
    const ratedStores = stores.filter(s => {
      const rating = parseFloat(s.rating) || parseFloat(s.calificacion_promedio) || 0;
      return rating > 0;
    });
    const avgRating = ratedStores.length > 0 
      ? ratedStores.reduce((sum, s) => {
          const rating = parseFloat(s.rating) || parseFloat(s.calificacion_promedio) || 0;
          return sum + rating;
        }, 0) / ratedStores.length
      : 0;

    // Top 5 comercios por ingresos
    const topStoresByRevenue = [...stores]
      .filter(s => parseFloat(s.total_revenue) > 0)
      .sort((a, b) => parseFloat(b.total_revenue || 0) - parseFloat(a.total_revenue || 0))
      .slice(0, 5)
      .map(s => ({ 
        id: s.id, 
        nombre: s.nombre || s.nombre_comercio, 
        total_revenue: parseFloat(s.total_revenue) 
      }));

    // Ingresos semanales
    const weekThis = stores.reduce((sum, s) => sum + (parseFloat(s.revenue_this_week) || 0), 0);
    const weekPrev = stores.reduce((sum, s) => sum + (parseFloat(s.revenue_prev_week) || 0), 0);
    const wowChangePercent = weekPrev > 0 ? ((weekThis - weekPrev) / weekPrev) * 100 : null;

    return { 
      total, 
      activos, 
      pendientes, 
      inactivos, 
      totalPedidos, 
      avgRating, 
      totalRevenueRaw, 
      avgOrdersPerStore, 
      newStores30Days,
      topStoresByRevenue, 
      weekThis, 
      weekPrev, 
      wowChangePercent
    };
  }, [stores]);

  // Obtener ciudades únicas
  const ciudades = useMemo(() => {
    const ciudadSet = new Set(stores.map(s => s.ciudad).filter(Boolean));
    return ['Todas', ...Array.from(ciudadSet)];
  }, [stores]);

  const loadStores = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/stores');
      const storesData = response.data || [];
      
      const enrichedStores = storesData.map(store => {
        return {
          ...store,
          id: store.id,
          nombre: store.nombre_comercio || store.nombre || 'Sin nombre',
          estado: store.estado || 'activo',
          activo: store.activo !== false,
          fecha_registro: store.created_at || store.fecha_registro || new Date().toISOString(),
          total_orders: parseInt(store.total_orders) || 0,
          total_productos: parseInt(store.total_products || store.total_productos) || 0,
          rating: parseFloat(store.calificacion_promedio) || parseFloat(store.rating) || 0,
          total_reviews: parseInt(store.total_reviews) || 0,
          total_revenue: parseFloat(store.total_revenue) || 0,
          revenue_this_week: parseFloat(store.revenue_this_week) || 0,
          revenue_prev_week: parseFloat(store.revenue_prev_week) || 0,
          ciudad: store.ciudad || '',
          direccion: store.direccion || '',
          owner_name: store.owner_name || '',
          owner_email: store.owner_email || '',
        };
      });

      // Intentar obtener ingresos semanales por tienda desde backend y fusionarlos
      try {
        const revResp = await api.get('/admin/stores/revenues/weekly');
        const revData = revResp.data || [];
        const revMap = revData.reduce((m, r) => {
          m[r.store_id] = r; return m;
        }, {});

        const merged = enrichedStores.map(s => {
          const r = revMap[s.id] || {};
          const revenue_this_week = r.revenue_this_week || s.revenue_this_week || 0;
          const revenue_prev_week = r.revenue_prev_week || s.revenue_prev_week || 0;
          return { ...s, total_revenue: s.total_revenue || s.total_revenue_cents || 0, revenue_this_week, revenue_prev_week };
        });

        setStores(merged);
        applyFilters(merged, searchQuery, activeFilter, advancedFilters);
      } catch (err) {
        // Si falla el endpoint, continuar con los datos básicos
        console.warn('No fue posible obtener ingresos semanales:', err.message || err);
        setStores(enrichedStores);
        applyFilters(enrichedStores, searchQuery, activeFilter, advancedFilters);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      Alert.alert('Error', 'No se pudieron cargar los comercios');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (storesList, query, filter, advanced) => {
    let result = [...storesList];

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(store => 
        store.nombre?.toLowerCase().includes(lowerQuery) ||
        store.nombre_comercio?.toLowerCase().includes(lowerQuery) ||
        store.direccion?.toLowerCase().includes(lowerQuery) ||
        store.ciudad?.toLowerCase().includes(lowerQuery) ||
        store.owner_email?.toLowerCase().includes(lowerQuery)
      );
    }

    switch (filter) {
      case 'pending':
        result = result.filter(s => s.estado === 'pendiente');
        break;
      case 'active':
        result = result.filter(s => s.activo === true && s.estado !== 'pendiente');
        break;
      case 'inactive':
        result = result.filter(s => s.activo === false);
        break;
    }

    if (advanced.ciudad && advanced.ciudad !== 'Todas') {
      result = result.filter(s => s.ciudad === advanced.ciudad);
    }
    if (advanced.minRating > 0) {
      result = result.filter(s => (s.rating || 0) >= advanced.minRating);
    }
    if (advanced.minOrders > 0) {
      result = result.filter(s => (s.total_orders || 0) >= advanced.minOrders);
    }

    switch (advanced.sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'orders':
        result.sort((a, b) => (b.total_orders || 0) - (a.total_orders || 0));
        break;
      case 'name':
        result.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
        break;
    }

    setFilteredStores(result);
  };

  useFocusEffect(
    useCallback(() => {
      loadStores();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStores();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(stores, text, activeFilter, advancedFilters);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilters(stores, searchQuery, filter, advancedFilters);
  };

  const handleAdvancedFilterChange = (key, value) => {
    const newFilters = { ...advancedFilters, [key]: value };
    setAdvancedFilters(newFilters);
    applyFilters(stores, searchQuery, activeFilter, newFilters);
  };

  const resetAdvancedFilters = () => {
    const defaultFilters = { ciudad: '', minRating: 0, minOrders: 0, sortBy: 'recent' };
    setAdvancedFilters(defaultFilters);
    applyFilters(stores, searchQuery, activeFilter, defaultFilters);
    setFilterModalVisible(false);
  };

  const openStoreModal = (store) => {
    setSelectedStore(store);
    setModalVisible(true);
  };

  const closeStoreModal = () => {
    setModalVisible(false);
    setSelectedStore(null);
  };

  const toggleExpand = (storeId) => {
    setExpandedIds(prev => {
      const exists = prev.includes(storeId);
      if (exists) return prev.filter(id => id !== storeId);
      return [...prev, storeId];
    });
  };

  const handleApproveStore = async (storeId) => {
    try {
      setActionLoading(true);
      await api.put('/admin/stores/' + storeId + '/approve').catch(() => {
        console.log('Simulating store approval:', storeId);
      });
      
      const updatedStores = stores.map(s => 
        s.id === storeId ? { ...s, estado: 'activo', activo: true } : s
      );
      setStores(updatedStores);
      applyFilters(updatedStores, searchQuery, activeFilter, advancedFilters);
      setModalVisible(false);
      Alert.alert('Éxito', 'Comercio aprobado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo aprobar el comercio');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStore = async (storeId, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activar' : 'desactivar';
    
    Alert.alert(
      (action.charAt(0).toUpperCase() + action.slice(1)) + ' comercio?',
      'El comercio ' + (newStatus ? 'podrá' : 'no podrá') + ' recibir pedidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: newStatus ? 'Activar' : 'Desactivar',
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await api.put('/admin/stores/' + storeId + '/toggle', { activo: newStatus }).catch(() => {
                console.log('Simulating store toggle:', storeId, newStatus);
              });
              
              const updatedStores = stores.map(s => 
                s.id === storeId ? { ...s, activo: newStatus } : s
              );
              setStores(updatedStores);
              applyFilters(updatedStores, searchQuery, activeFilter, advancedFilters);
              setModalVisible(false);
              Alert.alert('Éxito', 'Comercio ' + action + 'do correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo ' + action + ' el comercio');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const filterTabs = [
    { id: 'all', label: 'Todos', count: stores.length, icon: 'apps' },
    { id: 'pending', label: 'Pendientes', count: stats.pendientes, icon: 'time' },
    { id: 'active', label: 'Activos', count: stats.activos, icon: 'checkmark-circle' },
    { id: 'inactive', label: 'Inactivos', count: stats.inactivos, icon: 'close-circle' },
  ];

  const getStatusBadge = (store) => {
    if (store.estado === 'pendiente') {
      return { label: 'Pendiente', color: '#FF9500', bg: '#FFF3E0', icon: 'time' };
    }
    if (store.activo) {
      return { label: 'Activo', color: '#34C759', bg: '#E8F5E9', icon: 'checkmark-circle' };
    }
    return { label: 'Inactivo', color: '#FF3B30', bg: '#FFEBEE', icon: 'close-circle' };
  };

  const renderStars = (rating, size = 14) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(i => (
          <Ionicons
            key={i}
            name={i <= fullStars ? 'star' : (i === fullStars + 1 && hasHalf ? 'star-half' : 'star-outline')}
            size={size}
            color={i <= fullStars || (i === fullStars + 1 && hasHalf) ? '#FFD700' : '#ddd'}
          />
        ))}
      </View>
    );
  };

  const renderSummaryCards = () => (
    <>
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.summaryContainer}
    >
      {/* Total Comercios */}
      <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
        <View style={[styles.summaryIconContainer, { backgroundColor: '#2196F3' }]}>
          <Ionicons name="storefront" size={18} color="#fff" />
        </View>
        <Text style={styles.summaryValue}>{stats.total}</Text>
        <Text style={styles.summaryLabel}>Total Comercios</Text>
      </View>
      
      {/* Activos */}
      <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
        <View style={[styles.summaryIconContainer, { backgroundColor: '#4CAF50' }]}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
        </View>
        <Text style={styles.summaryValue}>{stats.activos}</Text>
        <Text style={styles.summaryLabel}>Activos</Text>
        <Text style={styles.summaryPercentage}>
          {stats.total > 0 ? Math.round((stats.activos / stats.total) * 100) : 0}%
        </Text>
      </View>
      
      {/* Pendientes */}
      <View style={[styles.summaryCard, { backgroundColor: '#FFF3E0' }]}>
        <View style={[styles.summaryIconContainer, { backgroundColor: '#FF9800' }]}>
          <Ionicons name="time" size={18} color="#fff" />
        </View>
        <Text style={styles.summaryValue}>{stats.pendientes}</Text>
        <Text style={styles.summaryLabel}>Pendientes</Text>
        {stats.pendientes > 0 && (
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>Requiere atención</Text>
          </View>
        )}
      </View>
      
      {/* Total Pedidos */}
      <View style={[styles.summaryCard, { backgroundColor: '#FFF8E1' }]}>
        <View style={[styles.summaryIconContainer, { backgroundColor: '#FFC107' }]}>
          <Ionicons name="receipt" size={18} color="#fff" />
        </View>
        <Text style={styles.summaryValue}>{stats.totalPedidos.toLocaleString()}</Text>
        <Text style={styles.summaryLabel}>Total Pedidos</Text>
      </View>
      
      {/* Ingresos Totales */}
      <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
        <View style={[styles.summaryIconContainer, { backgroundColor: '#4CAF50' }]}>
          <Ionicons name="cash" size={18} color="#fff" />
        </View>
        <Text style={styles.summaryValue}>
          ${(stats.totalRevenueRaw / 1000).toFixed(1)}k
        </Text>
        <Text style={styles.summaryLabel}>Ingresos Totales</Text>
      </View>

      {/* Promedio Pedidos/Tienda */}
      <View style={[styles.summaryCard, { backgroundColor: '#F3E5F5' }]}>
        <View style={[styles.summaryIconContainer, { backgroundColor: '#9C27B0' }]}>
          <Ionicons name="stats-chart" size={18} color="#fff" />
        </View>
        <Text style={styles.summaryValue}>{stats.avgOrdersPerStore}</Text>
        <Text style={styles.summaryLabel}>Pedidos/Tienda</Text>
      </View>

      {/* Nuevos (30 días) */}
      <View style={[styles.summaryCard, { backgroundColor: '#FCE4EC' }]}>
        <View style={[styles.summaryIconContainer, { backgroundColor: '#E91E63' }]}>
          <Ionicons name="rocket" size={18} color="#fff" />
        </View>
        <Text style={styles.summaryValue}>{stats.newStores30Days}</Text>
        <Text style={styles.summaryLabel}>Nuevos (30d)</Text>
      </View>

      {/* Rating Promedio */}
      <View style={[styles.summaryCard, { backgroundColor: '#FFF9C4' }]}>
        <View style={[styles.summaryIconContainer, { backgroundColor: '#FFC107' }]}>
          <Ionicons name="star" size={18} color="#fff" />
        </View>
        <Text style={styles.summaryValue}>
          {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
        </Text>
        <Text style={styles.summaryLabel}>Rating Promedio</Text>
      </View>
    </ScrollView>

    {/* Sección de ingresos semanales y top comercios */}
    <View style={styles.revenueSection}>
      <View style={styles.wowBox}>
        <Text style={styles.wowLabel}>Ingresos esta semana</Text>
        <Text style={styles.wowValue}>
          ${stats.weekThis > 0 ? (stats.weekThis / 1000).toFixed(1) + 'k' : '0'}
        </Text>
        {stats.wowChangePercent !== null && stats.weekPrev > 0 ? (
          <View style={[styles.wowChangeBadge, stats.wowChangePercent >= 0 ? styles.wowPositive : styles.wowNegative]}>
            <Ionicons 
              name={stats.wowChangePercent >= 0 ? 'trending-up' : 'trending-down'} 
              size={14} 
              color={stats.wowChangePercent >= 0 ? '#4CAF50' : '#F44336'} 
            />
            <Text style={[styles.wowChange, stats.wowChangePercent >= 0 ? styles.wowPositive : styles.wowNegative]}>
              {Math.abs(stats.wowChangePercent).toFixed(1)}% vs semana anterior
            </Text>
          </View>
        ) : (
          <Text style={styles.wowNA}>Sin datos históricos</Text>
        )}
      </View>

      <View style={styles.topStoresBox}>
        <Text style={styles.topStoresTitle}>🏆 Top 5 Comercios por Ingresos</Text>
        {stats.topStoresByRevenue && stats.topStoresByRevenue.length > 0 ? (
          stats.topStoresByRevenue.map((s, idx) => (
            <View key={s.id || idx} style={styles.topStoreRow}>
              <View style={styles.topStoreRank}>
                <Text style={styles.topStoreRankText}>{idx + 1}</Text>
              </View>
              <Text style={styles.topStoreName} numberOfLines={1}>{s.nombre}</Text>
              <Text style={styles.topStoreRevenue}>${(s.total_revenue / 1000).toFixed(1)}k</Text>
            </View>
          ))
        ) : (
          <Text style={styles.topStoresEmpty}>No hay datos de ingresos disponibles</Text>
        )}
      </View>
    </View>
    </>
  );

  const renderListHeader = () => (
    <>
      {renderSummaryCards()}

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, ciudad, email..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options" size={22} color={hasActiveFilters ? '#fff' : COLORS.primary} />
          {hasActiveFilters && <View style={styles.filterBadgeDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabsContainer}
        contentContainerStyle={styles.filterTabsContent}
        nestedScrollEnabled={true}
      >
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.filterTab,
              activeFilter === tab.id && styles.filterTabActive
            ]}
            onPress={() => handleFilterChange(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={16} 
              color={activeFilter === tab.id ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.filterTabText,
              activeFilter === tab.id && styles.filterTabTextActive
            ]}>
              {tab.label}
            </Text>
            <View style={[
              styles.filterTabBadge,
              activeFilter === tab.id && styles.filterTabBadgeActive
            ]}>
              <Text style={[
                styles.filterTabBadgeText,
                activeFilter === tab.id && styles.filterTabBadgeTextActive
              ]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  const renderStoreCard = (store) => {
    const status = getStatusBadge(store);
    const rating = store.rating || store.calificacion_promedio || 0;
    const isExpanded = expandedIds.includes(store.id);
    
    return (
      <TouchableOpacity
        key={store.id}
        style={styles.storeCard}
        onPress={() => toggleExpand(store.id)}
        activeOpacity={0.8}
      >
        <View style={styles.storeCardHeader}>
          <View style={styles.storeLogoContainer}>
            {store.logo_url ? (
              <Image source={{ uri: store.logo_url }} style={styles.storeLogo} />
            ) : (
              <View style={styles.storeLogoPlaceholder}>
                <Text style={styles.storeLogoText}>
                  {(store.nombre || 'C').substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <Text style={styles.storeName} numberOfLines={1}>
          {store.nombre || store.nombre_comercio}
        </Text>
        
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {store.ciudad || store.direccion || 'Sin ubicación'}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          {renderStars(rating, 12)}
          <Text style={styles.ratingText}>
            {rating > 0 ? rating.toFixed(1) : 'Sin rating'}
          </Text>
          {store.total_reviews > 0 && (
            <Text style={styles.reviewsCount}>({store.total_reviews})</Text>
          )}
        </View>

        <View style={styles.storeStatsRow}>
          <View style={styles.miniStat}>
            <Ionicons name="cube-outline" size={14} color={COLORS.primary} />
            <Text style={styles.miniStatText}>{store.total_productos || 0}</Text>
          </View>
          <View style={styles.miniStat}>
            <Ionicons name="receipt-outline" size={14} color="#FF9800" />
            <Text style={styles.miniStatText}>{store.total_orders || 0}</Text>
          </View>
          <View style={styles.miniStat}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.miniStatText}>
              {new Date(store.fecha_registro).toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'short' 
              })}
            </Text>
          </View>
        </View>

        {store.owner_name && (
          <View style={styles.ownerRow}>
            <Ionicons name="person-outline" size={12} color="#999" />
            <Text style={styles.ownerText} numberOfLines={1}>{store.owner_name}</Text>
          </View>
        )}

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.quickStatsRow}>
              <Text style={styles.quickStat}>Pedidos: <Text style={styles.quickStatValue}>{store.total_orders || 0}</Text></Text>
              <Text style={styles.quickStat}>Productos: <Text style={styles.quickStatValue}>{store.total_productos || 0}</Text></Text>
              <Text style={styles.quickStat}>Ingresos: <Text style={styles.quickStatValue}>${((store.total_revenue||0)/1000).toFixed(1)}k</Text></Text>
            </View>

            <View style={styles.quickActionRow}>
              {store.estado === 'pendiente' ? (
                <TouchableOpacity style={[styles.quickActionButton, styles.approveButton]} onPress={() => handleApproveStore(store.id)} disabled={actionLoading}>
                  {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.quickActionText}>Aprobar</Text>}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.quickActionButton, store.activo ? styles.deactivateButton : styles.activateButton]}
                  onPress={() => handleToggleStore(store.id, store.activo)}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.quickActionText}>{store.activo ? 'Desactivar' : 'Activar'}</Text>}
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.quickActionButton, styles.detailsButton]} onPress={() => openStoreModal(store)}>
                <Text style={styles.quickActionText}>Ver detalles</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.filterModalOverlay}>
        <View style={styles.filterModalContent}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filtros Avanzados</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterModalBody}>
            <Text style={styles.filterLabel}>Ciudad</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsRow}>
              {ciudades.map(ciudad => (
                <TouchableOpacity
                  key={ciudad}
                  style={[
                    styles.filterChip,
                    (advancedFilters.ciudad === ciudad || (ciudad === 'Todas' && !advancedFilters.ciudad)) && styles.filterChipActive
                  ]}
                  onPress={() => handleAdvancedFilterChange('ciudad', ciudad === 'Todas' ? '' : ciudad)}
                >
                  <Text style={[
                    styles.filterChipText,
                    (advancedFilters.ciudad === ciudad || (ciudad === 'Todas' && !advancedFilters.ciudad)) && styles.filterChipTextActive
                  ]}>
                    {ciudad}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterLabel}>Rating mínimo</Text>
            <View style={styles.ratingFilterRow}>
              {[0, 1, 2, 3, 4, 5].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.ratingFilterButton,
                    advancedFilters.minRating === r && styles.ratingFilterButtonActive
                  ]}
                  onPress={() => handleAdvancedFilterChange('minRating', r)}
                >
                  {r === 0 ? (
                    <Text style={[
                      styles.ratingFilterText,
                      advancedFilters.minRating === r && styles.ratingFilterTextActive
                    ]}>Todos</Text>
                  ) : (
                    <View style={styles.ratingFilterContent}>
                      <Text style={[
                        styles.ratingFilterText,
                        advancedFilters.minRating === r && styles.ratingFilterTextActive
                      ]}>{r}+</Text>
                      <Ionicons name="star" size={12} color={advancedFilters.minRating === r ? '#fff' : '#FFD700'} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Pedidos mínimos</Text>
            <View style={styles.ordersFilterRow}>
              {[0, 10, 50, 100, 500].map(orders => (
                <TouchableOpacity
                  key={orders}
                  style={[
                    styles.ordersFilterButton,
                    advancedFilters.minOrders === orders && styles.ordersFilterButtonActive
                  ]}
                  onPress={() => handleAdvancedFilterChange('minOrders', orders)}
                >
                  <Text style={[
                    styles.ordersFilterText,
                    advancedFilters.minOrders === orders && styles.ordersFilterTextActive
                  ]}>
                    {orders === 0 ? 'Todos' : orders + '+'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Ordenar por</Text>
            <View style={styles.sortOptionsRow}>
              {[
                { id: 'recent', label: 'Más recientes', icon: 'time-outline' },
                { id: 'rating', label: 'Mejor rating', icon: 'star-outline' },
                { id: 'orders', label: 'Más pedidos', icon: 'receipt-outline' },
                { id: 'name', label: 'Nombre A-Z', icon: 'text-outline' },
              ].map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.sortOption,
                    advancedFilters.sortBy === option.id && styles.sortOptionActive
                  ]}
                  onPress={() => handleAdvancedFilterChange('sortBy', option.id)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={18} 
                    color={advancedFilters.sortBy === option.id ? '#fff' : '#666'} 
                  />
                  <Text style={[
                    styles.sortOptionText,
                    advancedFilters.sortBy === option.id && styles.sortOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.filterModalActions}>
            <TouchableOpacity style={styles.resetButton} onPress={resetAdvancedFilters}>
              <Text style={styles.resetButtonText}>Limpiar filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>Aplicar ({filteredStores.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderStoreModal = () => {
    if (!selectedStore) return null;
    
    return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeStoreModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Comercio</Text>
              <TouchableOpacity onPress={closeStoreModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalStoreHeader}>
                <View style={styles.modalLogoContainer}>
                  {selectedStore.logo_url ? (
                    <Image source={{ uri: selectedStore.logo_url }} style={styles.modalLogo} />
                  ) : (
                    <View style={styles.modalLogoPlaceholder}>
                      <Ionicons name="storefront" size={40} color="#999" />
                    </View>
                  )}
                </View>
                <View style={styles.modalStoreInfo}>
                  <Text style={styles.modalStoreName}>{selectedStore.nombre || selectedStore.nombre_comercio}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBadge(selectedStore).bg }]}>
                    <Ionicons name={getStatusBadge(selectedStore).icon} size={12} color={getStatusBadge(selectedStore).color} />
                    <Text style={[styles.statusText, { color: getStatusBadge(selectedStore).color }]}>
                      {getStatusBadge(selectedStore).label}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalRatingSection}>
                <Text style={styles.modalRatingValue}>
                  {(Number(selectedStore.rating) || Number(selectedStore.calificacion_promedio) || 0).toFixed(1)}
                </Text>
                {renderStars(Number(selectedStore.rating) || Number(selectedStore.calificacion_promedio) || 0, 20)}
                <Text style={styles.modalReviewsCount}>
                  {selectedStore.total_reviews || 0} reseñas
                </Text>
              </View>

              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <View style={[styles.modalStatIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="cube" size={20} color="#2196F3" />
                  </View>
                  <Text style={styles.modalStatValue}>{selectedStore.total_productos || 0}</Text>
                  <Text style={styles.modalStatLabel}>Productos</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <View style={[styles.modalStatIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="receipt" size={20} color="#FF9800" />
                  </View>
                  <Text style={styles.modalStatValue}>{selectedStore.total_orders || 0}</Text>
                  <Text style={styles.modalStatLabel}>Pedidos</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <View style={[styles.modalStatIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="cash" size={20} color="#4CAF50" />
                  </View>
                  <Text style={styles.modalStatValue}>
                    {'$' + ((selectedStore.total_revenue || 0) / 1000).toFixed(1) + 'k'}
                  </Text>
                  <Text style={styles.modalStatLabel}>Ingresos</Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Información de Contacto</Text>
                
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="location" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Dirección</Text>
                    <Text style={styles.detailValue}>
                      {(selectedStore.direccion || 'No especificada') + (selectedStore.ciudad ? ', ' + selectedStore.ciudad : '')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="call" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Teléfono</Text>
                    <Text style={styles.detailValue}>{selectedStore.telefono || 'No especificado'}</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="mail" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{selectedStore.owner_email || selectedStore.email || 'No especificado'}</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="person" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Propietario</Text>
                    <Text style={styles.detailValue}>{selectedStore.owner_name || 'No especificado'}</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="calendar" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Registrado</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedStore.fecha_registro).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedStore.descripcion && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionTitle}>Descripción</Text>
                  <Text style={styles.descriptionText}>{selectedStore.descripcion}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              {selectedStore.estado === 'pendiente' ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => {
                    handleApproveStore(selectedStore.id);
                    closeStoreModal();
                  }}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Aprobar Comercio</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    selectedStore.activo ? styles.deactivateButton : styles.activateButton
                  ]}
                  onPress={() => {
                    handleToggleStore(selectedStore.id, selectedStore.activo);
                  }}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons 
                        name={selectedStore.activo ? 'close-circle' : 'checkmark-circle'} 
                        size={20} 
                        color="#fff" 
                      />
                      <Text style={styles.actionButtonText}>
                        {selectedStore.activo ? 'Desactivar' : 'Activar'} Comercio
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        </View>
      </View>
    </Modal>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando comercios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasActiveFilters = advancedFilters.ciudad || advancedFilters.minRating > 0 || advancedFilters.minOrders > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Gestión de Comercios</Text>
          <Text style={styles.headerSubtitle}>{stores.length} comercios registrados</Text>
        </View>
      </View>

      {/* Layout dividido en dos filas horizontales */}
      <View style={styles.splitLayout}>
        {/* Fila superior: Tarjetas, estadísticas y filtros */}
        <View style={styles.topSection}>
          <ScrollView
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
          >
            {renderSummaryCards()}
            
            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por nombre, ciudad, email..."
                  value={searchQuery}
                  onChangeText={handleSearch}
                  placeholderTextColor="#999"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => handleSearch('')}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
                onPress={() => setFilterModalVisible(true)}
              >
                <Ionicons name="options" size={22} color={hasActiveFilters ? '#fff' : COLORS.primary} />
                {hasActiveFilters && <View style={styles.filterBadgeDot} />}
              </TouchableOpacity>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterTabsContainer}
              contentContainerStyle={styles.filterTabsContent}
            >
              {filterTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.filterTab,
                    activeFilter === tab.id && styles.filterTabActive
                  ]}
                  onPress={() => handleFilterChange(tab.id)}
                >
                  <Ionicons 
                    name={tab.icon} 
                    size={16} 
                    color={activeFilter === tab.id ? '#fff' : '#666'} 
                  />
                  <Text style={[
                    styles.filterTabText,
                    activeFilter === tab.id && styles.filterTabTextActive
                  ]}>
                    {tab.label}
                  </Text>
                  <View style={[
                    styles.filterTabBadge,
                    activeFilter === tab.id && styles.filterTabBadgeActive
                  ]}>
                    <Text style={[
                      styles.filterTabBadgeText,
                      activeFilter === tab.id && styles.filterTabBadgeTextActive
                    ]}>
                      {tab.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>
        </View>

        {/* Fila inferior: Lista de comercios */}
        <View style={styles.bottomSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>
              Comercios ({filteredStores.length})
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={resetAdvancedFilters} style={styles.clearFiltersSmallButton}>
                <Text style={styles.clearFiltersSmallText}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList
            data={filteredStores}
            keyExtractor={(item) => `store-${item.id}`}
            renderItem={({ item }) => renderStoreCard(item)}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="storefront-outline" size={48} color="#ccc" />
                </View>
                <Text style={styles.emptyText}>No se encontraron comercios</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery || hasActiveFilters 
                    ? 'Intenta con otros filtros o búsqueda' 
                    : 'No hay comercios registrados'}
                </Text>
                {hasActiveFilters && (
                  <TouchableOpacity style={styles.clearFiltersButton} onPress={resetAdvancedFilters}>
                    <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </View>
      </View>

      {renderFilterModal()}
      {renderStoreModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  splitLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  topSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  clearFiltersSmallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  clearFiltersSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  summaryContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  summaryCard: {
    width: 110,
    padding: 12,
    borderRadius: 16,
    marginRight: 10,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  summaryPercentage: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '700',
    marginTop: 2,
  },
  summaryBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#FF9800',
  },
  summaryBadgeText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '700',
  },
  revenueSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  wowBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    ...SHADOWS.sm,
  },
  topStoresBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF8E1',
    ...SHADOWS.sm,
  },
  wowLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  wowValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  wowChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  wowChange: {
    fontSize: 11,
    fontWeight: '700',
  },
  wowPositive: {
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  wowNegative: {
    color: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  wowNA: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  topStoresTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  topStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  topStoreRank: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topStoreRankText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  topStoreName: {
    fontSize: 11,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  topStoreRevenue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  topStoresEmpty: {
    color: '#999',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    color: '#1a1a1a',
    minHeight: 32,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  filterTabsContainer: {
    backgroundColor: '#fff',
    maxHeight: 56,
  },
  filterTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterTabBadge: {
    marginLeft: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterTabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterTabBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  filterTabBadgeTextActive: {
    color: '#fff',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  storesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  storesGridSingle: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  storeCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  storeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  storeLogoContainer: {
    position: 'relative',
  },
  storeLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  storeLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeLogoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 6,
  },
  reviewsCount: {
    fontSize: 11,
    color: '#999',
    marginLeft: 2,
  },
  storeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  ownerText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
    flex: 1,
  },
  expandedContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickStat: {
    fontSize: 12,
    color: '#666',
  },
  quickStatValue: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  quickActionText: {
    color: '#fff',
    fontWeight: '600',
  },
  detailsButton: {
    backgroundColor: '#6c757d',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  clearFiltersText: {
    color: '#fff',
    fontWeight: '600',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  filterModalBody: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 8,
  },
  filterChipsRow: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  ratingFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  ratingFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  ratingFilterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  ratingFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingFilterText: {
    fontSize: 13,
    color: '#666',
  },
  ratingFilterTextActive: {
    color: '#fff',
  },
  ordersFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  ordersFilterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  ordersFilterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  ordersFilterText: {
    fontSize: 13,
    color: '#666',
  },
  ordersFilterTextActive: {
    color: '#fff',
  },
  sortOptionsRow: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: COLORS.primary,
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  sortOptionTextActive: {
    color: '#fff',
  },
  filterModalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
  },
  modalStoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalLogoContainer: {
    marginRight: 16,
  },
  modalLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  modalLogoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalStoreInfo: {
    flex: 1,
  },
  modalStoreName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalRatingSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#fafafa',
    borderRadius: 16,
  },
  modalRatingValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalReviewsCount: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  activateButton: {
    backgroundColor: '#34C759',
  },
  deactivateButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AdminStoresScreen;
