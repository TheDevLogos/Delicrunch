import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import logger from '../services/logger';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';
import { formatPrice } from '../src/utils/format';

// Mapeo de estados a colores e iconos
const STATUS_CONFIG = {
  pendiente: { color: '#FF9500', icon: 'time-outline', label: 'Pendiente' },
  confirmado: { color: '#007AFF', icon: 'checkmark-circle-outline', label: 'Confirmado' },
  preparando: { color: '#5856D6', icon: 'restaurant-outline', label: 'Preparando' },
  listo: { color: COLORS.primary, icon: 'bag-check-outline', label: 'Listo para recoger' },
  entregado: { color: '#34C759', icon: 'checkmark-done-circle', label: 'Entregado' },
  cancelado: { color: '#FF3B30', icon: 'close-circle-outline', label: 'Cancelado' },
};

// Componente para renderizar cada pedido
const OrderItem = ({ item }) => {
  const navigation = useNavigation();
  const statusKey = item.estado?.toLowerCase() || 'pendiente';
  const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pendiente;
  
  return (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      activeOpacity={0.9}
    >
      {/* Header del pedido */}
      <View style={styles.orderHeader}>
        <View style={styles.storeInfo}>
          <View style={styles.storeLogo}>
            <Text style={styles.storeLogoText}>
              {item.nombre_comercio?.substring(0, 2).toUpperCase() || 'DC'}
            </Text>
          </View>
          <View style={styles.storeDetails}>
            <Text style={styles.storeName} numberOfLines={1}>
              {item.nombre_comercio || 'Tienda'}
            </Text>
            <Text style={styles.orderDate}>
              {new Date(item.fecha_pedido || item.created_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
          <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>
      
      {/* Contenido del pedido */}
      <View style={styles.orderContent}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.nombre_producto || 'Surprise Bag'}
        </Text>
        
        {item.codigo_recogida && (
          <View style={styles.pickupCodeContainer}>
            <Ionicons name="key-outline" size={14} color={COLORS.primary} />
            <Text style={styles.pickupCodeLabel}>Código de recogida:</Text>
            <Text style={styles.pickupCode}>{item.codigo_recogida}</Text>
          </View>
        )}
      </View>
      
      {/* Footer con precio y acción */}
      <View style={styles.orderFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total pagado</Text>
          <Text style={styles.priceValue}>
            ${formatPrice(item.total || item.precio_total || 0)}
          </Text>
        </View>
        
        {statusKey === 'entregado' && !item.tiene_resena && (
          <TouchableOpacity 
            style={styles.reviewButton}
            onPress={() => navigation.navigate('LeaveReview', { 
              orderId: item.id, 
              productId: item.producto_id,
              storeId: item.store_id,
              storeName: item.nombre_comercio,
              productName: item.nombre_producto,
            })}
          >
            <Ionicons name="star-outline" size={16} color={COLORS.white} />
            <Text style={styles.reviewButtonText}>Dejar reseña</Text>
          </TouchableOpacity>
        )}
        
        {statusKey === 'listo' && (
          <View style={styles.readyBadge}>
            <Ionicons name="notifications" size={14} color={COLORS.primary} />
            <Text style={styles.readyText}>¡Listo para recoger!</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const MyOrdersScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/myorders');
      setOrders(response.data);
    } catch (error) {
      logger.error(error, 'fetchOrders');
      Alert.alert("Error", "No se pudieron cargar tus pedidos.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchOrders();
    }, [])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <OrderItem item={item} />}
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={80} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>Sin pedidos aún</Text>
            <Text style={styles.emptySubtitle}>
              Cuando hagas tu primer pedido, aparecerá aquí
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Descubre')}
            >
              <Text style={styles.exploreButtonText}>Explorar ofertas</Text>
            </TouchableOpacity>
          </View>
        }
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Lista
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 20,
  },

  // Tarjeta de pedido
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    ...SHADOWS.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storeLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  storeLogoText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Contenido
  orderContent: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  pickupCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  pickupCodeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  pickupCode: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },

  // Footer
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  priceContainer: {},
  priceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
  },
  exploreButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default MyOrdersScreen;