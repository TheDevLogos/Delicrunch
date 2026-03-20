import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import * as Location from 'expo-location';
import api, { publicApi } from '../services/api';
import ProductCard from '../components/ProductCard';
import FlashDealModal from '../components/FlashDealModal';
import MapSection from '../components/MapSection';
import SpecialNotificationModal from '../components/SpecialNotificationModal';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS, SHADOWS, LAYOUT } from '../src/constants/theme';

  const HomeScreen = () => {
const navigation = useNavigation(); 
  const { user } = useAuth();

  // --- ESTADOS DEL COMPONENTE ---
  const [products, setProducts] = useState([]); // Para almacenar la lista de productos
  const [filteredProducts, setFilteredProducts] = useState([]); // Para la lista filtrada
  const [searchQuery, setSearchQuery] = useState(''); // Para el texto de búsqueda
  const [isLoading, setIsLoading] = useState(false); // Para mostrar un indicador de carga
  const [isRefreshing, setIsRefreshing] = useState(false); // Para el "pull-to-refresh"
  const [error, setError] = useState(null); // Para almacenar cualquier error de la API
  const [stores, setStores] = useState([]); // Para las tiendas con packs y ubicación
  const [loadingStores, setLoadingStores] = useState(true);
  
  // --- ESTADOS PARA NOTIFICACIONES ESPECIALES ---
  const [showNotification, setShowNotification] = useState(false);
  const [notificationProduct, setNotificationProduct] = useState(null);
  const [notificationType, setNotificationType] = useState('new');
  const [userLocation, setUserLocation] = useState(null);
  const [favoriteStores, setFavoriteStores] = useState([]);
  // --- FUNCIÓN PARA OBTENER TIENDAS CON UBICACIÓN Y PACKS ---
  const fetchStores = async () => {
    try {
      setLoadingStores(true);
      const response = await publicApi.get('/stores/with-products');
      setStores(response.data);
    } catch (err) {
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  };

  // --- OBTENER UBICACIÓN DEL USUARIO ---
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (err) {
      console.log('Error getting location:', err);
    }
  };

  // --- CARGAR FAVORITOS ---
  const loadFavorites = async () => {
    try {
      // No dependemos de una clave local 'token' (AuthProvider usa 'userToken').
      // Usamos `api` (que añade x-auth-token desde AsyncStorage) y dejamos
      // que el interceptor maneje la ausencia de token.
      const response = await api.get('/profiles/favorites');
      setFavoriteStores(response.data || []);
    } catch (err) {
      // Si no hay sesión o recibimos 401/404, simplemente dejamos favoritos vacíos
      console.log('Error loading favorites (ignored):', err?.response?.status || err.message);
      setFavoriteStores([]);
    }
  };

  // --- CALCULAR DISTANCIA (Haversine) ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // --- SELECCIONAR PRODUCTO PARA NOTIFICACIÓN ---
  const selectNotificationProduct = async (allProducts) => {
    if (!allProducts || allProducts.length === 0) return;

    // Filtrar solo productos que existan y tengan inventario disponible
    const availableProducts = allProducts.filter(p => (p.cantidad_disponible || p.cantidad_inicial || 0) > 0);
    if (availableProducts.length === 0) return;

    // Forzar: sólo considerar productos con descuento >= 50% para la notificación especial
    const highDiscountProducts = availableProducts.filter(p => {
      const discount = p.precio_original && p.precio_descuento
        ? Math.round((1 - p.precio_descuento / p.precio_original) * 100)
        : 0;
      return discount >= 50;
    });

    if (highDiscountProducts.length === 0) {
      // No hay ofertas >=50% hoy
      return;
    }

    const today = new Date().toDateString();
    const notifKey = `@home_notification_shown_${today}`;
    
    // Solo mostrar una notificación por día
    const alreadyShown = await AsyncStorage.getItem(notifKey);
    if (alreadyShown) return;

    // Categorizar productos
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinutes;

    const categorized = {
      new: [], // Recién subidos (últimas 24h)
      hot_sale: [], // Mayor descuento (>50%)
      closing_soon: [], // Cierran en las próximas 2 horas
      top_rated: [], // Calificación >= 4.5
      favorite_store: [], // De tiendas favoritas
      nearby: [], // Cercanos (< 2km)
    };

    for (const product of highDiscountProducts) {
      // Recién subidos (últimas 24 horas)
      const createdAt = new Date(product.created_at);
      const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
      if (hoursSinceCreated < 24) {
        categorized.new.push(product);
      }

      // Hot sale (descuento > 50%)
      const discount = product.precio_original && product.precio_descuento
        ? (1 - product.precio_descuento / product.precio_original) * 100
        : 0;
      if (discount >= 50) {
        categorized.hot_sale.push(product);
      }

      // Por cerrar (próximas 2 horas)
      if (product.hora_recogida_fin) {
        const [finHour, finMin] = product.hora_recogida_fin.split(':').map(Number);
        const finTime = finHour * 60 + (finMin || 0);
        if (finTime > currentTime && finTime - currentTime <= 120) {
          categorized.closing_soon.push(product);
        }
      }

      // Top rated
      if (product.calificacion_promedio >= 4.5) {
        categorized.top_rated.push(product);
      }

      // Tienda favorita
      if (favoriteStores.some(f => f.store_id === product.store_id)) {
        categorized.favorite_store.push(product);
      }

      // Cercanos
      if (userLocation && product.latitud && product.longitud) {
        const distance = calculateDistance(
          userLocation.latitude, userLocation.longitude,
          parseFloat(product.latitud), parseFloat(product.longitud)
        );
        if (distance <= 2) {
          categorized.nearby.push({ ...product, distance });
        }
      }
    }

    // Prioridad: closing_soon > favorite_store > hot_sale > nearby > top_rated > new
    let selectedProduct = null;
    let type = 'new';

    if (categorized.closing_soon.length > 0) {
      selectedProduct = categorized.closing_soon[Math.floor(Math.random() * categorized.closing_soon.length)];
      type = 'closing_soon';
    } else if (categorized.favorite_store.length > 0) {
      selectedProduct = categorized.favorite_store[Math.floor(Math.random() * categorized.favorite_store.length)];
      type = 'favorite_store';
    } else if (categorized.hot_sale.length > 0) {
      selectedProduct = categorized.hot_sale[Math.floor(Math.random() * categorized.hot_sale.length)];
      type = 'hot_sale';
    } else if (categorized.nearby.length > 0) {
      categorized.nearby.sort((a, b) => a.distance - b.distance);
      selectedProduct = categorized.nearby[0];
      type = 'nearby';
    } else if (categorized.top_rated.length > 0) {
      selectedProduct = categorized.top_rated[Math.floor(Math.random() * categorized.top_rated.length)];
      type = 'top_rated';
    } else if (categorized.new.length > 0) {
      selectedProduct = categorized.new[Math.floor(Math.random() * categorized.new.length)];
      type = 'new';
    } else {
      // Seleccionar uno aleatorio
      selectedProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
      type = 'new';
    }

    if (selectedProduct) {
      // Pequeño delay para mejor UX
      setTimeout(() => {
        setNotificationProduct(selectedProduct);
        setNotificationType(type);
        setShowNotification(true);
        AsyncStorage.setItem(notifKey, 'true');
      }, 1500);
    }
  };

  // --- FUNCIÓN PARA OBTENER DATOS ---
  const fetchProducts = async () => {
    setError(null); // Limpiamos errores previos
    try {
      // Usamos publicApi para asegurar que la petición vaya sin token
      const response = await publicApi.get('/products');
      setProducts(response.data); // Guardamos los productos en el estado
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError("No se pudieron cargar los productos. Inténtalo de nuevo.");
    }
  };

  // --- LÓGICA DE FILTRADO ---
  // Este efecto se ejecuta cada vez que el texto de búsqueda o la lista de productos cambia.
  useEffect(() => {
    if (searchQuery === '') {
      setFilteredProducts(products); // Si no hay búsqueda, mostramos todos
    } else {
      // Filtramos los productos cuyo nombre (en minúsculas) incluya el texto de búsqueda (en minúsculas)
      const filtered = products.filter(product =>
        product.nombre.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);


  // --- EFECTO DE CARGA INICIAL (usando useFocusEffect) ---
  // Se ejecuta cada vez que la pantalla obtiene el foco, asegurando datos frescos.
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      getUserLocation();
      loadFavorites();
      fetchProducts().finally(() => setIsLoading(false));
      fetchStores();
    }, [])
  );

  // --- MOSTRAR NOTIFICACIÓN CUANDO LOS PRODUCTOS ESTÉN LISTOS ---
  useEffect(() => {
    if (products.length > 0 && !isLoading) {
      selectNotificationProduct(products);
    }
  }, [products, isLoading]);

  // --- FUNCIÓN PARA EL PULL-TO-REFRESH ---
  // useCallback memoriza la función para evitar re-creaciones innecesarias.
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchProducts().finally(() => setIsRefreshing(false));
  }, []);

  // --- RENDERIZADO CONDICIONAL ---
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="medium" color="#0A84FF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <StyledButton title="Reintentar" onPress={handleRefresh} />
      </View>
    );
  }

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {/* Modal de Notificación Especial */}
      <SpecialNotificationModal
        visible={showNotification}
        onClose={() => setShowNotification(false)}
        product={notificationProduct}
        notificationType={notificationType}
        navigation={navigation}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>¡Hola! 👋</Text>
          <Text style={styles.subtitle}>Salva comida cerca de ti</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textTertiary} style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar packs sorpresa..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item, index) => `home-${item.id}-${index}`}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          />
        )}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="food-off" size={64} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No se encontraron resultados' : 'No hay packs disponibles'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Intenta con otra búsqueda' : 'Vuelve más tarde para ver nuevas ofertas'}
            </Text>
          </View>
        )}
        ListHeaderComponent={() => (
          <View>
            {/* Flash Deals */}
            <FlashDealModal
              products={
                products && products.length > 0
                  ? products
                  : (user?.rol === 'comprador'
                      ? [{ id: -9999, nombre: 'Prueba Flash', descripcion: 'Oferta de prueba para comprador', precio_descuento: 1, precio_original: 5, nombre_comercio: 'Demo', imagen_url: '' }]
                      : [])
              }
              navigation={navigation}
            />
            
            {/* Map Section */}
            <View style={styles.mapCard}>
              <View style={styles.mapHeader}>
                <Text style={styles.sectionTitle}>Comercios cercanos</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>Ver mapa</Text>
                </TouchableOpacity>
              </View>
              <MapSection stores={stores.map(s => ({
                lat: Number(s.latitud),
                lng: Number(s.longitud),
                nombre_comercio: s.nombre_comercio,
                direccion: s.direccion
              }))} loading={loadingStores} />
            </View>
            
            {/* Products Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Packs Sorpresa</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{filteredProducts.length} disponibles</Text>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDERS.radius.lg,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  // Loading & Error
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  // Map Card
  mapCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDERS.radius.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  seeAll: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  badge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDERS.radius.sm,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  // List
  listContent: {
    paddingBottom: LAYOUT.listPaddingBottom,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDERS.radius.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default HomeScreen;