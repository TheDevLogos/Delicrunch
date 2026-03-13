/**
 * AdminTransactionsScreen - Vista de Transacciones
 * Ver transacciones por día, semana, mes y año
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
  StatusBar,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SPACING, SHADOWS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

const AdminTransactionsScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [activePeriod, setActivePeriod] = useState('day'); // day, week, month, year
  const [searchQuery, setSearchQuery] = useState('');
  
  // Métricas por período
  const [periodMetrics, setPeriodMetrics] = useState({
    total: 0,
    count: 0,
    average: 0,
    maxTransaction: 0,
  });

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      
      // Cargar pedidos (transacciones)
      let allOrders = [];
      try {
        const response = await api.get('/admin/transactions');
        allOrders = response.data || [];
      } catch (e) {
        // Datos de demostración
        allOrders = generateDemoTransactions();
      }

      // Mapear pedidos a transacciones
      const transactionsData = allOrders.map(order => ({
        id: order.id,
        tipo: 'compra',
        monto: parseFloat(order.total || 0),
        estado: order.payment_status || order.estado || 'completado',
        fecha: order.created_at || new Date().toISOString(),
        usuario: order.buyer_name || order.usuario_nombre || 'Usuario',
        comercio: order.store_name || order.comercio_nombre || 'Comercio',
        metodo_pago: order.payment_method || 'Tarjeta',
        productos: order.items?.length || 1,
      }));

      setTransactions(transactionsData);
      applyPeriodFilter(transactionsData, activePeriod, searchQuery);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const generateDemoTransactions = () => {
    const now = new Date();
    const transactions = [];
    
    // Generar transacciones de demostración
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 365);
      const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      transactions.push({
        id: i + 1,
        total: (Math.random() * 500 + 50).toFixed(2),
        payment_status: Math.random() > 0.1 ? 'completado' : 'fallido',
        created_at: date.toISOString(),
        buyer_name: ['Ana García', 'Carlos López', 'María Pérez', 'Juan Rodríguez', 'Laura Martínez'][Math.floor(Math.random() * 5)],
        store_name: ['La Casa del Pan', 'Frutería El Sol', 'Café Express', 'Green Market', 'Sushi Roll'][Math.floor(Math.random() * 5)],
        payment_method: ['Tarjeta', 'Efectivo', 'PayPal'][Math.floor(Math.random() * 3)],
        items: [{ id: 1 }, { id: 2 }].slice(0, Math.floor(Math.random() * 3) + 1),
      });
    }
    
    return transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const applyPeriodFilter = (transactionsList, period, query) => {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    let filtered = transactionsList.filter(t => new Date(t.fecha) >= startDate);

    // Filtrar por búsqueda
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(t =>
        t.usuario.toLowerCase().includes(lowerQuery) ||
        t.comercio.toLowerCase().includes(lowerQuery) ||
        t.id.toString().includes(query)
      );
    }

    // Calcular métricas
    const completedTransactions = filtered.filter(t => t.estado === 'completado');
    const totalAmount = completedTransactions.reduce((sum, t) => sum + t.monto, 0);
    const avgAmount = completedTransactions.length > 0 ? totalAmount / completedTransactions.length : 0;
    const maxAmount = completedTransactions.length > 0 ? Math.max(...completedTransactions.map(t => t.monto)) : 0;

    setPeriodMetrics({
      total: totalAmount,
      count: filtered.length,
      average: avgAmount,
      maxTransaction: maxAmount,
    });

    setFilteredTransactions(filtered);
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTransactions();
  }, []);

  const handlePeriodChange = (period) => {
    setActivePeriod(period);
    applyPeriodFilter(transactions, period, searchQuery);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyPeriodFilter(transactions, activePeriod, text);
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const periodTabs = [
    { id: 'day', label: 'Hoy', icon: 'today' },
    { id: 'week', label: 'Semana', icon: 'calendar' },
    { id: 'month', label: 'Mes', icon: 'calendar-outline' },
    { id: 'year', label: 'Año', icon: 'calendar-number' },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completado':
        return { color: '#34C759', bg: '#E8F5E9', icon: 'checkmark-circle', label: 'Completado' };
      case 'pendiente':
        return { color: '#FF9500', bg: '#FFF3E0', icon: 'time', label: 'Pendiente' };
      case 'fallido':
        return { color: '#FF3B30', bg: '#FFEBEE', icon: 'close-circle', label: 'Fallido' };
      default:
        return { color: '#666', bg: '#f5f5f5', icon: 'help-circle', label: status };
    }
  };

  const renderTransactionCard = (transaction) => {
    const statusStyle = getStatusStyle(transaction.estado);
    
    return (
      <View key={transaction.id} style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionId}>#{transaction.id}</Text>
            <Text style={styles.transactionDate}>{formatDate(transaction.fecha)}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Ionicons name={statusStyle.icon} size={12} color={statusStyle.color} />
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <View style={styles.transactionBody}>
          <View style={styles.transactionParties}>
            <View style={styles.partyRow}>
              <Ionicons name="person-outline" size={14} color="#666" />
              <Text style={styles.partyText} numberOfLines={1}>{transaction.usuario}</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color="#ccc" />
            <View style={styles.partyRow}>
              <Ionicons name="storefront-outline" size={14} color="#666" />
              <Text style={styles.partyText} numberOfLines={1}>{transaction.comercio}</Text>
            </View>
          </View>

          <View style={styles.transactionDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="card-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{transaction.metodo_pago}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cube-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{transaction.productos} items</Text>
            </View>
          </View>
        </View>

        <View style={styles.transactionFooter}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={[
            styles.amountValue,
            transaction.estado === 'fallido' && styles.amountFailed
          ]}>
            {formatCurrency(transaction.monto)}
          </Text>
        </View>
      </View>
    );
  };

  // Agrupar transacciones por fecha
  const groupTransactionsByDate = () => {
    const groups = {};
    filteredTransactions.forEach(t => {
      const dateKey = new Date(t.fecha).toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });
    return groups;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando transacciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedTransactions = groupTransactionsByDate();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transacciones</Text>
        <Text style={styles.headerSubtitle}>Historial de pagos y ventas</Text>
      </View>

      {/* Period Tabs */}
      <View style={styles.periodContainer}>
        {periodTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.periodTab,
              activePeriod === tab.id && styles.periodTabActive
            ]}
            onPress={() => handlePeriodChange(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={18} 
              color={activePeriod === tab.id ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.periodTabText,
              activePeriod === tab.id && styles.periodTabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Metrics Summary */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#34C75920' }]}>
            <Ionicons name="cash" size={18} color="#34C759" />
          </View>
          <Text style={styles.metricValue}>{formatCurrency(periodMetrics.total)}</Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>
        
        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#007AFF20' }]}>
            <Ionicons name="receipt" size={18} color="#007AFF" />
          </View>
          <Text style={styles.metricValue}>{periodMetrics.count}</Text>
          <Text style={styles.metricLabel}>Transacciones</Text>
        </View>
        
        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#AF52DE20' }]}>
            <Ionicons name="trending-up" size={18} color="#AF52DE" />
          </View>
          <Text style={styles.metricValue}>{formatCurrency(periodMetrics.average)}</Text>
          <Text style={styles.metricLabel}>Promedio</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por usuario, comercio o ID..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {Object.keys(groupedTransactions).length > 0 ? (
          Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
            <View key={date}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{date}</Text>
                <Text style={styles.dateCount}>
                  {dateTransactions.length} transacción{dateTransactions.length !== 1 ? 'es' : ''}
                </Text>
              </View>
              {dateTransactions.map(renderTransactionCard)}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No hay transacciones</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? 'No se encontraron resultados para tu búsqueda'
                : `No hay transacciones en este período`
              }
            </Text>
          </View>
        )}
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

  // Period tabs
  periodContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  periodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  periodTabActive: {
    backgroundColor: COLORS.primary,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  periodTabTextActive: {
    color: '#fff',
  },

  // Metrics
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    color: '#1a1a1a',
  },

  // List
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textTransform: 'capitalize',
  },
  dateCount: {
    fontSize: 12,
    color: '#999',
  },

  // Transaction Card
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  transactionBody: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
  },
  transactionParties: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  partyRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
    flex: 1,
  },
  transactionDetails: {
    flexDirection: 'row',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
    color: '#666',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  amountFailed: {
    color: '#FF3B30',
    textDecorationLine: 'line-through',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default AdminTransactionsScreen;
