import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';
import { formatPrice } from '../src/utils/format';

const getStatusInfo = (status) => {
  switch (status) {
    case 'pendiente':
      return { color: COLORS.warning, icon: 'time-outline', label: 'Pendiente' };
    case 'confirmado':
      return { color: COLORS.info, icon: 'checkmark-circle-outline', label: 'Confirmado' };
    case 'recogido':
      return { color: COLORS.success, icon: 'bag-check-outline', label: 'Recogido' };
    case 'cancelado':
      return { color: COLORS.error, icon: 'close-circle-outline', label: 'Cancelado' };
    default:
      return { color: COLORS.textLight, icon: 'ellipse-outline', label: status };
  }
};

const OrderItem = ({ item, onStatusChange }) => {
  const statusInfo = getStatusInfo(item.estado);
  
  const handleConfirm = () => {
    Alert.alert(
      'Confirmar Pedido',
      '¿Marcar este pedido como confirmado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => onStatusChange(item.id, 'confirmado') },
      ]
    );
  };

  const handleMarkPickedUp = () => {
    Alert.alert(
      'Marcar como Recogido',
      `¿El cliente ha recogido el pedido?\nCódigo: ${item.codigo_recogida}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, recogido', onPress: () => onStatusChange(item.id, 'recogido') },
      ]
    );
  };
  
  return (
    <View style={styles.orderCard}>
      {/* Header del pedido */}
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Pedido</Text>
          <Text style={styles.orderId}>#{item.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Info del producto */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.nombre_producto}</Text>
        <Text style={styles.productPrice}>
          ${formatPrice(item.precio_total || item.precio_descuento || 0)}
        </Text>
      </View>

      {/* Info del comprador */}
      <View style={styles.buyerInfo}>
        <Ionicons name="person-outline" size={16} color={COLORS.textLight} />
        <Text style={styles.buyerName}>{item.nombre_comprador}</Text>
      </View>

      {/* Código de recogida - prominente */}
      <View style={styles.pickupCodeContainer}>
        <Text style={styles.pickupCodeLabel}>Código de Recogida</Text>
        <View style={styles.pickupCodeBox}>
          <Text style={styles.pickupCode}>{item.codigo_recogida}</Text>
        </View>
      </View>

      {/* Hora de recogida */}
      {(item.hora_recogida_inicio || item.hora_recogida_fin) && (
        <View style={styles.pickupTimeRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.primary} />
          <Text style={styles.pickupTime}>
            Recogida: {item.hora_recogida_inicio} - {item.hora_recogida_fin}
          </Text>
        </View>
      )}

      {/* Botones de acción */}
      {item.estado === 'pendiente' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Ionicons name="checkmark" size={18} color={COLORS.white} />
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {item.estado === 'confirmado' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.pickupButton}
            onPress={handleMarkPickedUp}
          >
            <Ionicons name="bag-check" size={18} color={COLORS.white} />
            <Text style={styles.pickupButtonText}>Marcar Recogido</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const StoreOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStoreOrders = async () => {
    try {
      const response = await api.get('/orders/mystoreorders');
      setOrders(response.data);
    } catch (error) {
      console.error("Error al obtener los pedidos:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { estado: newStatus });
      // Recargar pedidos
      fetchStoreOrders();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchStoreOrders();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStoreOrders();
  }, []);

  // Separar pedidos por estado
  const pendingOrders = orders.filter(o => o.estado === 'pendiente');
  const confirmedOrders = orders.filter(o => o.estado === 'confirmado');
  const completedOrders = orders.filter(o => ['recogido', 'cancelado'].includes(o.estado));

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Pedidos de Hoy</Text>
      
      {/* Stats rápidos */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.warning + '15' }]}>
          <Text style={[styles.statNumber, { color: COLORS.warning }]}>{pendingOrders.length}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.info + '15' }]}>
          <Text style={[styles.statNumber, { color: COLORS.info }]}>{confirmedOrders.length}</Text>
          <Text style={styles.statLabel}>Confirmados</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
          <Text style={[styles.statNumber, { color: COLORS.success }]}>{completedOrders.length}</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="clipboard-outline" size={64} color={COLORS.textLight} />
      </View>
      <Text style={styles.emptyTitle}>Sin pedidos aún</Text>
      <Text style={styles.emptySubtitle}>
        Los pedidos de tus clientes aparecerán aquí
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <OrderItem item={item} onStatusChange={handleStatusChange} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 100,
  },
  
  // Header
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 16,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },

  // Order Card
  orderCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  orderIdLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginRight: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
  },
  
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  buyerName: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 6,
  },
  
  pickupCodeContainer: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  pickupCodeLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pickupCodeBox: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  pickupCode: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 4,
  },
  
  pickupTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickupTime: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  pickupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pickupButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: { 
    fontSize: 22, 
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default StoreOrdersScreen;