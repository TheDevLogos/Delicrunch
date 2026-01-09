import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { formatPrice } from '../src/utils/format';

const OrderHistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get('/orders/mystoreorders');
      const data = response.data;
      // Only show completed orders (recogido)
      const completedOrders = data.filter(order => order.estado === 'recogido');
      setOrders(completedOrders);
      setFilteredOrders(completedOrders);
    } catch (err) {
      console.error('Error fetching order history:', err);
      setError(err.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Apply filters whenever they change
  useEffect(() => {
    let result = [...orders];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order =>
        order.codigo_recogida?.toLowerCase().includes(query) ||
        order.nombre_comprador?.toLowerCase().includes(query) ||
        order.id?.toString().includes(query)
      );
    }

    // Period filter
    const now = new Date();
    if (selectedPeriod === 'today') {
      result = result.filter(order => {
        const orderDate = new Date(order.fecha_recogida_real || order.updated_at);
        return orderDate.toDateString() === now.toDateString();
      });
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(order => {
        const orderDate = new Date(order.fecha_recogida_real || order.updated_at);
        return orderDate >= weekAgo;
      });
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(order => {
        const orderDate = new Date(order.fecha_recogida_real || order.updated_at);
        return orderDate >= monthAgo;
      });
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.fecha_recogida_real || a.updated_at);
      const dateB = new Date(b.fecha_recogida_real || b.updated_at);

      if (sortBy === 'date_desc') return dateB - dateA;
      if (sortBy === 'date_asc') return dateA - dateB;
      if (sortBy === 'amount_desc') return parseFloat(b.total || 0) - parseFloat(a.total || 0);
      if (sortBy === 'amount_asc') return parseFloat(a.total || 0) - parseFloat(b.total || 0);
      return 0;
    });

    setFilteredOrders(result);
  }, [orders, searchQuery, selectedPeriod, sortBy]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return `$${formatPrice(amount || 0)}`;
  };

  // Calculate summary stats
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const renderPeriodFilter = () => {
    const periods = [
      { key: 'all', label: 'Todo' },
      { key: 'today', label: 'Hoy' },
      { key: 'week', label: 'Semana' },
      { key: 'month', label: 'Mes' },
    ];

    return (
      <View style={styles.periodContainer}>
        {periods.map(period => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === period.key && styles.periodTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{totalOrders}</Text>
        <Text style={styles.summaryLabel}>Pedidos</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
        <Text style={styles.summaryLabel}>Total</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{formatCurrency(avgOrderValue)}</Text>
        <Text style={styles.summaryLabel}>Promedio</Text>
      </View>
    </View>
  );

  const renderOrderItem = ({ item: order }) => {
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderCode}>{order.codigo_recogida || `#${order.id}`}</Text>
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#34C759" />
              <Text style={styles.completedText}>Entregado</Text>
            </View>
          </View>
          <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.orderDetailRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.orderDetailText}>
              {order.nombre_comprador || 'Cliente'}
            </Text>
          </View>
          <View style={styles.orderDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.orderDetailText}>
              {formatDate(order.fecha_recogida_real || order.updated_at)}
            </Text>
          </View>
        </View>

        {order.items?.length > 0 && (
          <View style={styles.orderItems}>
            <Text style={styles.orderItemsTitle}>
              {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
            </Text>
            {order.items.slice(0, 2).map((item, idx) => (
              <Text key={idx} style={styles.orderItemText} numberOfLines={1}>
                • {item.cantidad}x {item.nombre_producto || item.nombre}
              </Text>
            ))}
            {order.items.length > 2 && (
              <Text style={styles.orderItemMore}>
                +{order.items.length - 2} más...
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Sin pedidos completados</Text>
      <Text style={styles.emptyText}>
        {searchQuery || selectedPeriod !== 'all'
          ? 'No hay pedidos que coincidan con tus filtros'
          : 'Aquí verás el historial de pedidos entregados'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Pedidos</Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            // Cycle through sort options
            const options = ['date_desc', 'date_asc', 'amount_desc', 'amount_asc'];
            const currentIdx = options.indexOf(sortBy);
            setSortBy(options[(currentIdx + 1) % options.length]);
          }}
        >
          <Ionicons name="swap-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por código o cliente..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {renderPeriodFilter()}
      {renderSummary()}

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  sortButton: {
    padding: 8,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },

  // Period filter
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  periodButtonActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  periodText: {
    fontSize: 13,
    color: '#666',
  },
  periodTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Summary
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#eee',
  },

  // List
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'column',
  },
  orderCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 4,
    fontWeight: '500',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F97316',
  },
  orderDetails: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  orderItems: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  orderItemsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  orderItemText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  orderItemMore: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default OrderHistoryScreen;
