import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';
import { formatPrice } from '../src/utils/format';

// Componente para renderizar cada producto - estilo TGTG
const ProductItem = ({ item }) => {
  const navigation = useNavigation();
  
  const discount = item.precio_original > 0 
    ? Math.round((1 - item.precio_descuento / item.precio_original) * 100)
    : 0;

  return (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.getParent()?.navigate('EditProduct', { productId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.productImageContainer}>
        <Image 
          source={{ uri: item.imagen_url || 'https://via.placeholder.com/150' }} 
          style={styles.productImage} 
        />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        <View style={[
          styles.stockBadge,
          item.cantidad_disponible <= 3 && styles.stockBadgeLow
        ]}>
          <Text style={styles.stockBadgeText}>
            {item.cantidad_disponible} disponibles
          </Text>
        </View>
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={1}>{item.nombre}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.originalPrice}>${formatPrice(item.precio_original)}</Text>
          <Text style={styles.discountPrice}>${formatPrice(item.precio_descuento)}</Text>
        </View>
        
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.getParent()?.navigate('EditProduct', { productId: item.id })}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.white} />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
          
          <View style={[
            styles.statusIndicator,
            item.activo ? styles.statusActive : styles.statusInactive
          ]}>
            <View style={[
              styles.statusDot,
              item.activo ? styles.statusDotActive : styles.statusDotInactive
            ]} />
            <Text style={styles.statusText}>
              {item.activo ? 'Activo' : 'Pausado'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MyProductsScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, lowStock: 0 });

  const fetchStoreProducts = async () => {
    try {
      const response = await api.get('/products/mystore');
      setProducts(response.data);
      
      // Calcular estadísticas
      const active = response.data.filter(p => p.activo).length;
      const lowStock = response.data.filter(p => p.cantidad_disponible <= 3).length;
      setStats({ total: response.data.length, active, lowStock });
    } catch (error) {
      console.error("Error al obtener los productos:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchStoreProducts();
    }, [])
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Título */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Mis Productos</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
          <Text style={[styles.statNumber, { color: COLORS.primary }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
          <Text style={[styles.statNumber, { color: COLORS.success }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.warning + '15' }]}>
          <Text style={[styles.statNumber, { color: COLORS.warning }]}>{stats.lowStock}</Text>
          <Text style={styles.statLabel}>Bajo Stock</Text>
        </View>
      </View>

      {/* Botón añadir prominente */}
      <TouchableOpacity 
        style={styles.addProductButton}
        onPress={() => navigation.navigate('AddProduct')}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={22} color={COLORS.white} />
        <Text style={styles.addProductButtonText}>Añadir Nuevo Pack</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="fast-food-outline" size={64} color={COLORS.textLight} />
      </View>
      <Text style={styles.emptyTitle}>Sin productos aún</Text>
      <Text style={styles.emptySubtitle}>
        Empieza a publicar tus packs sorpresa y ayuda a reducir el desperdicio de alimentos
      </Text>
      <TouchableOpacity 
        style={styles.emptyAddButton}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <Text style={styles.emptyAddButtonText}>Crear mi primer pack</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ProductItem item={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: COLORS.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
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
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  
  // Add product button
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  addProductButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Product Card
  productCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 140,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  stockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeLow: {
    backgroundColor: COLORS.warning,
  },
  stockBadgeText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 11,
  },
  
  productInfo: {
    padding: 14,
  },
  productTitle: { 
    fontSize: 17, 
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  originalPrice: { 
    fontSize: 14, 
    color: COLORS.textLight, 
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountPrice: { 
    fontSize: 18, 
    fontWeight: '700',
    color: COLORS.primary,
  },
  
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: COLORS.success + '15',
  },
  statusInactive: {
    backgroundColor: COLORS.textLight + '15',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: COLORS.success,
  },
  statusDotInactive: {
    backgroundColor: COLORS.textLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
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
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyAddButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyProductsScreen;