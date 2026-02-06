import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  ImageBackground,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

// Normalizar estado del backend a formato display
const normalizeStatus = (status) => {
  const statusMap = {
    'pendiente': 'Pendiente',
    'confirmado': 'Confirmado',
    'en_preparacion': 'En preparación',
    'listo': 'Listo',
    'recogido': 'Entregado',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado',
  };
  return statusMap[status?.toLowerCase()] || status;
};

// Mapeo de estados a estilos
const getStatusStyle = (status) => {
  const normalized = normalizeStatus(status);
  const statusMap = {
    'Pendiente': { bg: `${COLORS.warning}15`, color: COLORS.warning, icon: 'time-outline' },
    'Confirmado': { bg: `${COLORS.info}15`, color: COLORS.info, icon: 'checkmark-circle-outline' },
    'En preparación': { bg: `${COLORS.info}15`, color: COLORS.info, icon: 'restaurant-outline' },
    'Listo': { bg: `${COLORS.primary}15`, color: COLORS.primary, icon: 'bag-check-outline' },
    'Entregado': { bg: `${COLORS.success}15`, color: COLORS.success, icon: 'checkmark-done' },
    'Cancelado': { bg: `${COLORS.error}15`, color: COLORS.error, icon: 'close-circle-outline' },
  };
  return statusMap[normalized] || statusMap['Pendiente'];
};

// Componente para renderizar cada pedido recibido
const OrderItem = ({ item, onUpdateStatus, onPress }) => {
  const displayStatus = normalizeStatus(item.estado);
  const statusStyle = getStatusStyle(item.estado);
  const isPending = displayStatus === 'Pendiente';
  const isConfirmed = displayStatus === 'Confirmado';
  const isReady = displayStatus === 'Listo';
  const isDelivered = displayStatus === 'Entregado';
  const isCancelled = displayStatus === 'Cancelado';
  const canDeliver = !isDelivered && !isCancelled;
  
  // Calcular precio a mostrar
  const precio = parseFloat(item.total || item.precio_unitario || 0);

  return (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Header con código */}
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Pedido</Text>
          <Text style={styles.orderId}>#{item.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Ionicons name={statusStyle.icon} size={14} color={statusStyle.color} />
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{displayStatus}</Text>
        </View>
      </View>

      {/* Precio del pedido */}
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Total:</Text>
        <Text style={styles.priceValue}>${precio.toFixed(2)} MXN</Text>
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
              onPress={() => onUpdateStatus(item.id, 'confirmado')}
            >
              <Ionicons name="checkmark" size={18} color={COLORS.background} />
              <Text style={styles.actionButtonText}>Confirmar</Text>
            </TouchableOpacity>
          )}
          {isConfirmed && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.readyButton]}
              onPress={() => onUpdateStatus(item.id, 'listo')}
            >
              <Ionicons name="bag-check" size={18} color={COLORS.background} />
              <Text style={styles.actionButtonText}>Listo para recoger</Text>
            </TouchableOpacity>
          )}
          {isReady && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.deliverButton]}
              onPress={() => onUpdateStatus(item.id, 'recogido')}
            >
              <Ionicons name="checkmark-done" size={18} color={COLORS.background} />
              <Text style={styles.actionButtonText}>Marcar entregado</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const MerchantOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState('today'); // today, week, month, year

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

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const closeOrderModal = () => {
    setModalVisible(false);
    setSelectedOrder(null);
  };

  const getFilteredOrdersByPeriod = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at || order.fecha_pedido);
      
      switch(statsPeriod) {
        case 'today':
          return orderDate >= today;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return orderDate >= yearAgo;
        default:
          return true;
      }
    });
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log('🔄 Updating order', orderId, 'to status:', newStatus);
      
      await api.patch(`/orders/${orderId}`, { estado: newStatus });
      
      // Actualizar estado localmente (el backend devuelve estado en minúsculas)
      setOrders(currentOrders =>
        currentOrders.map(order =>
          order.id === orderId ? { ...order, estado: newStatus } : order
        )
      );
      
      const displayStatus = normalizeStatus(newStatus);
      Alert.alert('✅ Actualizado', `El pedido ha sido marcado como ${displayStatus}.`);
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
    const status = normalizeStatus(order.estado);
    if (filter === 'all') return true;
    if (filter === 'pending') return status === 'Pendiente' || status === 'Confirmado';
    if (filter === 'ready') return status === 'Listo';
    if (filter === 'completed') return status === 'Entregado';
    return true;
  });

  const periodOrders = getFilteredOrdersByPeriod();
  
  const pendingCount = periodOrders.filter(o => {
    const s = normalizeStatus(o.estado);
    return s === 'Pendiente' || s === 'Confirmado';
  }).length;
  
  const readyCount = periodOrders.filter(o => normalizeStatus(o.estado) === 'Listo').length;
  const deliveredCount = periodOrders.filter(o => normalizeStatus(o.estado) === 'Entregado').length;
  
  const totalRevenue = periodOrders
    .filter(o => normalizeStatus(o.estado) === 'Entregado')
    .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  const renderHeader = () => (
    <View style={styles.listHeader}>
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

  const renderOrderDetailModal = () => {
    if (!selectedOrder) return null;

    const displayStatus = normalizeStatus(selectedOrder.estado);
    const statusStyle = getStatusStyle(selectedOrder.estado);
    const precio = parseFloat(selectedOrder.total || selectedOrder.precio_unitario || 0);
    const subtotal = parseFloat(selectedOrder.subtotal || precio);
    const comision = parseFloat(selectedOrder.comision_plataforma || 0);
    
    const isPending = displayStatus === 'Pendiente';
    const isConfirmed = displayStatus === 'Confirmado';
    const isReady = displayStatus === 'Listo';
    const isDelivered = displayStatus === 'Entregado';
    const isCancelled = displayStatus === 'Cancelado';
    const canDeliver = !isDelivered && !isCancelled;

    // Formatear fechas
    const fechaPedido = selectedOrder.created_at || selectedOrder.fecha_pedido;
    const fechaRecogida = selectedOrder.fecha_recogida_programada;
    const horaInicio = selectedOrder.hora_recogida_inicio || '14:00';
    const horaFin = selectedOrder.hora_recogida_fin || '18:00';

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeOrderModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Pedido #{selectedOrder.id}</Text>
                <Text style={styles.modalSubtitle}>{selectedOrder.codigo_recogida}</Text>
              </View>
              <TouchableOpacity onPress={closeOrderModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Estado */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Estado del Pedido</Text>
                <View style={[styles.statusBadgeLarge, { backgroundColor: statusStyle.bg }]}>
                  <Ionicons name={statusStyle.icon} size={24} color={statusStyle.color} />
                  <Text style={[styles.statusTextLarge, { color: statusStyle.color }]}>
                    {displayStatus}
                  </Text>
                </View>
              </View>

              {/* Información del Cliente */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  <Ionicons name="person" size={16} color={COLORS.textSecondary} /> Cliente
                </Text>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Nombre:</Text>
                  <Text style={styles.modalInfoValue}>{selectedOrder.nombre_comprador}</Text>
                </View>
                {selectedOrder.email_comprador && (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Email:</Text>
                    <Text style={styles.modalInfoValue}>{selectedOrder.email_comprador}</Text>
                  </View>
                )}
              </View>

              {/* Información del Producto */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  <Ionicons name="fast-food" size={16} color={COLORS.textSecondary} /> Producto
                </Text>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Producto:</Text>
                  <Text style={styles.modalInfoValue}>{selectedOrder.nombre_producto}</Text>
                </View>
                {selectedOrder.cantidad && (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Cantidad:</Text>
                    <Text style={styles.modalInfoValue}>x{selectedOrder.cantidad}</Text>
                  </View>
                )}
              </View>

              {/* Desglose de Precios */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  <Ionicons name="calculator" size={16} color={COLORS.textSecondary} /> Desglose de Precios
                </Text>
                <View style={styles.priceBreakdown}>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Subtotal:</Text>
                    <Text style={styles.modalInfoValue}>${subtotal.toFixed(2)} MXN</Text>
                  </View>
                  {comision > 0 && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Comisión plataforma:</Text>
                      <Text style={[styles.modalInfoValue, { color: COLORS.warning }]}>
                        -${comision.toFixed(2)} MXN
                      </Text>
                    </View>
                  )}
                  <View style={styles.modalDivider} />
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalTotalLabel}>Total:</Text>
                    <Text style={styles.modalTotalValue}>${precio.toFixed(2)} MXN</Text>
                  </View>
                  {comision > 0 && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Tu ganancia:</Text>
                      <Text style={[styles.modalInfoValue, { color: COLORS.success, fontWeight: '700' }]}>
                        ${(precio - comision).toFixed(2)} MXN
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Método de Pago */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  <Ionicons name="card" size={16} color={COLORS.textSecondary} /> Método de Pago
                </Text>
                <View style={styles.paymentMethodBadge}>
                  <Ionicons name="card-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.paymentMethodText}>
                    {selectedOrder.metodo_pago === 'mercadopago' ? 'Mercado Pago' : selectedOrder.metodo_pago || 'No especificado'}
                  </Text>
                </View>
              </View>

              {/* Horario de Recogida */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  <Ionicons name="time" size={16} color={COLORS.textSecondary} /> Horario de Recogida
                </Text>
                <View style={styles.pickupTimeContainer}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  <View style={styles.pickupTimeContent}>
                    {fechaPedido && (
                      <Text style={styles.pickupTimeText}>
                        Pedido: {new Date(fechaPedido).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    )}
                    <Text style={styles.pickupTimeRange}>
                      Rango: {horaInicio} - {horaFin}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Acciones de cambio de estado */}
              {canDeliver && (
                <View style={styles.modalActions}>
                  <Text style={styles.modalSectionTitle}>Cambiar Estado</Text>
                  {isPending && (
                    <TouchableOpacity 
                      style={[styles.modalActionButton, { backgroundColor: COLORS.info }]}
                      onPress={() => {
                        handleUpdateOrderStatus(selectedOrder.id, 'confirmado');
                        closeOrderModal();
                      }}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.modalActionButtonText}>Confirmar Pedido</Text>
                    </TouchableOpacity>
                  )}
                  {isConfirmed && (
                    <TouchableOpacity 
                      style={[styles.modalActionButton, { backgroundColor: COLORS.primary }]}
                      onPress={() => {
                        handleUpdateOrderStatus(selectedOrder.id, 'listo');
                        closeOrderModal();
                      }}
                    >
                      <Ionicons name="bag-check" size={20} color="#fff" />
                      <Text style={styles.modalActionButtonText}>Marcar como Listo</Text>
                    </TouchableOpacity>
                  )}
                  {isReady && (
                    <TouchableOpacity 
                      style={[styles.modalActionButton, { backgroundColor: COLORS.success }]}
                      onPress={() => {
                        handleUpdateOrderStatus(selectedOrder.id, 'recogido');
                        closeOrderModal();
                      }}
                    >
                      <Ionicons name="checkmark-done" size={20} color="#fff" />
                      <Text style={styles.modalActionButtonText}>Marcar como Entregado</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Hero Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.heroHeader}
      >
        <View style={styles.heroHeaderContent}>
          <TouchableOpacity 
            style={styles.heroBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroTitleContainer}>
            <Text style={styles.heroTitle}>Pedidos Recibidos</Text>
            <Text style={styles.heroSubtitle}>{orders.length} pedidos en total</Text>
          </View>
          <TouchableOpacity style={styles.heroRefreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Selector de período */}
        <View style={styles.periodSelector}>
          {[
            { key: 'today', label: 'Hoy', icon: 'today' },
            { key: 'week', label: 'Semana', icon: 'calendar' },
            { key: 'month', label: 'Mes', icon: 'calendar-outline' },
            { key: 'year', label: 'Año', icon: 'calendar-clear' },
          ].map(p => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.periodChip,
                statsPeriod === p.key && styles.periodChipActive
              ]}
              onPress={() => setStatsPeriod(p.key)}
            >
              <Ionicons 
                name={p.icon} 
                size={14} 
                color={statsPeriod === p.key ? COLORS.primary : '#fff'} 
              />
              <Text style={[
                styles.periodChipText,
                statsPeriod === p.key && styles.periodChipTextActive
              ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats en el hero */}
        <View style={styles.heroStatsRow}>
          <View style={styles.heroStat}>
            <Ionicons name="time" size={20} color={COLORS.warning} />
            <Text style={styles.heroStatNumber}>{pendingCount}</Text>
            <Text style={styles.heroStatLabel}>Pendientes</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Ionicons name="bag-check" size={20} color="#4ADE80" />
            <Text style={styles.heroStatNumber}>{readyCount}</Text>
            <Text style={styles.heroStatLabel}>Listos</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={styles.heroStatNumber}>{deliveredCount}</Text>
            <Text style={styles.heroStatLabel}>Entregados</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Ionicons name="cash" size={20} color="#4ADE80" />
            <Text style={styles.heroStatNumber}>${totalRevenue.toFixed(0)}</Text>
            <Text style={styles.heroStatLabel}>Ingresos</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <OrderItem 
            item={item} 
            onUpdateStatus={handleUpdateOrderStatus}
            onPress={openOrderModal}
          />
        )}
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
      
      {/* Modal de detalle de orden */}
      {renderOrderDetailModal()}
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
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}10`,
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...SHADOWS.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
    letterSpacing: 1,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: SPACING.lg,
  },
  modalSection: {
    marginBottom: SPACING.lg,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  statusTextLarge: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.md,
  },
  priceBreakdown: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  paymentMethodText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pickupTimeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  pickupTimeContent: {
    flex: 1,
  },
  pickupTimeText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  pickupTimeRange: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalActions: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  modalActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Period selector styles
  periodSelector: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'space-around',
  },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 4,
  },
  periodChipActive: {
    backgroundColor: '#fff',
  },
  periodChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  periodChipTextActive: {
    color: COLORS.primary,
  },
  heroHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + SPACING.md : SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  heroHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  heroBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  heroRefreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: SPACING.md,
    borderRadius: 16,
    padding: SPACING.sm,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});

export default MerchantOrdersScreen;