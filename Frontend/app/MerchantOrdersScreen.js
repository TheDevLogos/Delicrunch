import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

// TGTG Design System
const COLORS = {
  primary: '#036B52',
  primaryDark: '#024A38',
  secondary: '#F5F5F5',
  accent: '#FF6B35',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
};

// Mapeo de estados a estilos
const getStatusStyle = (status) => {
  const statusMap = {
    'Pendiente': { bg: `${COLORS.warning}15`, color: COLORS.warning, icon: 'time-outline' },
    'Confirmado': { bg: `${COLORS.info}15`, color: COLORS.info, icon: 'checkmark-circle-outline' },
    'Listo': { bg: `${COLORS.primary}15`, color: COLORS.primary, icon: 'bag-check-outline' },
    'Entregado': { bg: `${COLORS.success}15`, color: COLORS.success, icon: 'checkmark-done' },
    'Cancelado': { bg: `${COLORS.error}15`, color: COLORS.error, icon: 'close-circle-outline' },
  };
  return statusMap[status] || statusMap['Pendiente'];
};

// Componente para renderizar cada pedido recibido
const OrderItem = ({ item, onUpdateStatus }) => {
  const statusStyle = getStatusStyle(item.estado);
  const isPending = item.estado === 'Pendiente';
  const isReady = item.estado === 'Listo';
  const canDeliver = item.estado !== 'Entregado' && item.estado !== 'Cancelado';

  return (
    <View style={styles.orderCard}>
      {/* Header con código */}
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Pedido</Text>
          <Text style={styles.orderId}>#{item.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Ionicons name={statusStyle.icon} size={14} color={statusStyle.color} />
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.estado}</Text>
        </View>
      </View>

      {/* Código de recogida prominente */}
      <View style={styles.pickupCodeContainer}>
        <Ionicons name="key-outline" size={20} color={COLORS.primary} />
        <View style={styles.pickupCodeContent}>
          <Text style={styles.pickupCodeLabel}>Código de recogida</Text>
          <Text style={styles.pickupCode}>{item.codigo_recogida}</Text>
        </View>
      </View>

      {/* Información del producto */}
      <View style={styles.productInfo}>
        <View style={styles.productIcon}>
          <Ionicons name="fast-food-outline" size={20} color={COLORS.background} />
        </View>
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.nombre_producto}</Text>
          <Text style={styles.buyerInfo}>
            <Ionicons name="person-outline" size={12} color={COLORS.textSecondary} /> {item.nombre_comprador}
          </Text>
        </View>
        {item.cantidad && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>x{item.cantidad}</Text>
          </View>
        )}
      </View>

      {/* Fecha */}
      {item.created_at && (
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textLight} />
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      )}

      {/* Acciones */}
      {canDeliver && (
        <View style={styles.actionsContainer}>
          {isPending && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => onUpdateStatus(item.id, 'Confirmado')}
            >
              <Ionicons name="checkmark" size={18} color={COLORS.background} />
              <Text style={styles.actionButtonText}>Confirmar</Text>
            </TouchableOpacity>
          )}
          {item.estado === 'Confirmado' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.readyButton]}
              onPress={() => onUpdateStatus(item.id, 'Listo')}
            >
              <Ionicons name="bag-check" size={18} color={COLORS.background} />
              <Text style={styles.actionButtonText}>Listo para recoger</Text>
            </TouchableOpacity>
          )}
          {isReady && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.deliverButton]}
              onPress={() => onUpdateStatus(item.id, 'Entregado')}
            >
              <Ionicons name="checkmark-done" size={18} color={COLORS.background} />
              <Text style={styles.actionButtonText}>Marcar entregado</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const MerchantOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  // Mapeo de estados frontend -> backend
  const mapStatusToBackend = (frontendStatus) => {
    const statusMap = {
      'Pendiente': 'pendiente',
      'Confirmado': 'confirmado',
      'Listo': 'listo',
      'Entregado': 'recogido',  // Backend usa 'recogido' para entregado
      'Cancelado': 'cancelado'
    };
    return statusMap[frontendStatus] || frontendStatus.toLowerCase();
  };

  const fetchStoreOrders = async () => {
    try {
      const response = await api.get('/orders/mystoreorders');
      setOrders(response.data);
    } catch (error) {
      console.error("Error al obtener los pedidos de la tienda:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const backendStatus = mapStatusToBackend(newStatus);
      console.log('🔄 Updating order', orderId, '- Frontend:', newStatus, '-> Backend:', backendStatus);
      
      await api.patch(`/orders/${orderId}`, { estado: backendStatus });
      
      setOrders(currentOrders =>
        currentOrders.map(order =>
          order.id === orderId ? { ...order, estado: newStatus } : order
        )
      );
      Alert.alert('✅ Actualizado', `El pedido ha sido marcado como ${newStatus}.`);
    } catch (error) {
      console.error("Error al actualizar el estado del pedido:", error.response?.data || error.message);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchStoreOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStoreOrders();
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return order.estado === 'Pendiente' || order.estado === 'Confirmado';
    if (filter === 'ready') return order.estado === 'Listo';
    if (filter === 'completed') return order.estado === 'Entregado';
    return true;
  });

  const pendingCount = orders.filter(o => o.estado === 'Pendiente' || o.estado === 'Confirmado').length;
  const readyCount = orders.filter(o => o.estado === 'Listo').length;

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: COLORS.warning }]}>
          <Text style={[styles.statNumber, { color: COLORS.warning }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={[styles.statCard, { borderColor: COLORS.primary }]}>
          <Text style={[styles.statNumber, { color: COLORS.primary }]}>{readyCount}</Text>
          <Text style={styles.statLabel}>Listos</Text>
        </View>
        <View style={[styles.statCard, { borderColor: COLORS.success }]}>
          <Text style={[styles.statNumber, { color: COLORS.success }]}>{orders.filter(o => o.estado === 'Entregado').length}</Text>
          <Text style={styles.statLabel}>Entregados</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pending', label: 'Pendientes' },
          { key: 'ready', label: 'Listos' },
          { key: 'completed', label: 'Entregados' }
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={48} color={COLORS.textLight} />
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'Sin pedidos aún' : `Sin pedidos ${filter === 'pending' ? 'pendientes' : filter === 'ready' ? 'listos' : 'entregados'}`}
      </Text>
      <Text style={styles.emptySubtitle}>
        Los pedidos de tus clientes aparecerán aquí
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedidos Recibidos</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <OrderItem item={item} onUpdateStatus={handleUpdateOrderStatus} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  listHeader: {
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.background,
  },
  orderCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  orderIdLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pickupCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  pickupCodeContent: {
    flex: 1,
  },
  pickupCodeLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  pickupCode: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  buyerInfo: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  quantityBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    gap: SPACING.xs,
  },
  confirmButton: {
    backgroundColor: COLORS.info,
  },
  readyButton: {
    backgroundColor: COLORS.primary,
  },
  deliverButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default MerchantOrdersScreen;