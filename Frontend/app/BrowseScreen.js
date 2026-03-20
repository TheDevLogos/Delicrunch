/**
 * BrowseScreen - Pantalla de Búsqueda con Mapa y Filtros
 * Muestra tiendas en mapa con marcadores interactivos y sistema de filtros
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { publicApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '../contexts/LocationContext';
import { COLORS, SPACING, LAYOUT } from '../src/constants/theme';
import { formatPrice, formatNumber } from '../src/utils/format';
// WebView se cargará dinámicamente para evitar fallos en Expo Go

const { width, height } = Dimensions.get('window');

// Usaremos Leaflet vía WebView (open source) como mapa principal para evitar dependencias nativas
let WebView;
try {
  WebView = require('react-native-webview').WebView;
} catch (e) {
  WebView = null;
}

// Fallback manual para mostrar markers si la API no responde
const FALLBACK_STORES = [
  { id: 9001, nombre_comercio: 'Taquería Las Delicias', latitud: 28.1910, longitud: -105.4708 },
  { id: 9002, nombre_comercio: 'El Borrego de Oro', latitud: 28.1875, longitud: -105.4685 },
  { id: 9003, nombre_comercio: 'Chilaquiles La Carreta', latitud: 28.1945, longitud: -105.4752 },
  { id: 9004, nombre_comercio: "Pizza Orsini's", latitud: 28.1898, longitud: -105.4721 },
  { id: 9005, nombre_comercio: 'Dr. Sushi', latitud: 28.1962, longitud: -105.4635 },
  { id: 9006, nombre_comercio: 'Café Placeres', latitud: 28.1922, longitud: -105.4695 },
];

// Categorías de comercio disponibles
const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: 'grid-outline' },
  { id: 'tacos', name: 'Tacos', icon: 'restaurant-outline' },
  { id: 'pizza', name: 'Pizza', icon: 'pizza-outline' },
  { id: 'sushi', name: 'Sushi', icon: 'fish-outline' },
  { id: 'cafe', name: 'Café', icon: 'cafe-outline' },
  { id: 'desayunos', name: 'Desayunos', icon: 'sunny-outline' },
  { id: 'postres', name: 'Postres', icon: 'ice-cream-outline' },
  { id: 'barbacoa', name: 'Barbacoa', icon: 'flame-outline' },
];

// Rangos de precios
const PRICE_RANGES = [
  { id: 'all', name: 'Todos', min: 0, max: 9999 },
  { id: 'low', name: '$0 - $50', min: 0, max: 50 },
  { id: 'medium', name: '$50 - $100', min: 50, max: 100 },
  { id: 'high', name: '$100 - $200', min: 100, max: 200 },
  { id: 'premium', name: '$200+', min: 200, max: 9999 },
];

// Distancias
const DISTANCE_OPTIONS = [
  { id: 1, name: '1 mi' },
  { id: 5, name: '5 mi' },
  { id: 12, name: '12 mi' },
  { id: 25, name: '25 mi' },
  { id: 50, name: '50 mi' },
];

// Helper para formatear calificación de forma segura
const formatRating = (rating) => {
  if (rating === null || rating === undefined || isNaN(rating)) return '4.5';
  return formatNumber(rating, 1);
};

const BrowseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mapRef = useRef(null);
  const webViewRef = useRef(null);
  
  const { 
    userLocation, 
    isLoadingLocation,
    detectLocation,
    calculateDistance,
    nearbyRadius,
    setNearbyRadius,
  } = useLocation();
  
  // Estados
  const [viewMode, setViewMode] = useState('map');
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedStoreDetails, setSelectedStoreDetails] = useState(null);
  
  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedDistance, setSelectedDistance] = useState(nearbyRadius);
  
  // Region del mapa
  const [region, setRegion] = useState({
    latitude: userLocation?.latitude || 28.1910,
    longitude: userLocation?.longitude || -105.4708,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Fetch datos
  const fetchData = async () => {
    try {
      const [storesRes, productsRes] = await Promise.all([
        publicApi.get('/stores/with-products'),
        publicApi.get('/products'),
      ]);
      
      const storesData = storesRes.data || [];
      const productsData = productsRes.data || [];

      // Deduplicar productos por ID para evitar repeticiones en lista
      const uniqueProducts = [];
      const seen = new Set();
      for (const p of productsData) {
        if (p?.id == null || seen.has(p.id)) continue;
        seen.add(p.id);
        uniqueProducts.push(p);
      }
      
      // Agregar distancia a las tiendas
      const storesWithDistance = storesData.map(store => {
        const lat = parseFloat(store.latitud);
        const lng = parseFloat(store.longitud);
        if (!isNaN(lat) && !isNaN(lng) && userLocation?.latitude) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            lat,
            lng
          );
          return { ...store, distancia: distance };
        }
        return { ...store, distancia: 999 };
      });
      
      // Agregar distancia a productos
      const productsWithDistance = uniqueProducts.map(product => {
        const store = storesWithDistance.find(s => s.id === product.store_id);
        return { ...product, distancia: store?.distancia || 999 };
      });
      
      setStores(storesWithDistance);
      setProducts(productsWithDistance);
      setFilteredStores(storesWithDistance);
      setFilteredProducts(productsWithDistance);
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setStores([]);
      setProducts([]);
    }
  };

  // Aplicar filtros
  const applyFilters = useCallback(() => {
    let filtered = [...products];
    let filteredS = [...stores];
    
    // Filtrar por ciudad del usuario automáticamente
    if (userLocation?.city) {
      const userCity = userLocation.city.toLowerCase();
      filtered = filtered.filter(p => {
        const productCity = (p.ciudad || '').toLowerCase();
        return productCity.includes(userCity) || userCity.includes(productCity);
      });
      filteredS = filteredS.filter(s => {
        const storeCity = (s.ciudad || '').toLowerCase();
        return storeCity.includes(userCity) || userCity.includes(storeCity);
      });
    }
    
    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre?.toLowerCase().includes(query) ||
        p.nombre_comercio?.toLowerCase().includes(query) ||
        p.categoria?.toLowerCase().includes(query)
      );
      filteredS = filteredS.filter(s =>
        s.nombre_comercio?.toLowerCase().includes(query)
      );
    }
    
    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      const catQuery = selectedCategory.toLowerCase();
      filtered = filtered.filter(p =>
        p.categoria?.toLowerCase().includes(catQuery) ||
        p.nombre_comercio?.toLowerCase().includes(catQuery)
      );
      filteredS = filteredS.filter(s =>
        s.nombre_comercio?.toLowerCase().includes(catQuery)
      );
    }
    
    // Filtrar por precio
    if (selectedPriceRange !== 'all') {
      const range = PRICE_RANGES.find(r => r.id === selectedPriceRange);
      if (range) {
        filtered = filtered.filter(p => {
          const price = parseFloat(p.precio_descuento);
          return price >= range.min && price <= range.max;
        });
      }
    }
    
    // Filtrar por distancia
    if (selectedDistance && userLocation?.latitude) {
      filtered = filtered.filter(p => (p.distancia || 999) <= selectedDistance);
      filteredS = filteredS.filter(s => (s.distancia || 999) <= selectedDistance);
    }
    
    // Ordenar por distancia
    filtered.sort((a, b) => (a.distancia || 999) - (b.distancia || 999));
    filteredS.sort((a, b) => (a.distancia || 999) - (b.distancia || 999));
    
    setFilteredProducts(filtered);
    setFilteredStores(filteredS);
  }, [products, stores, searchQuery, selectedCategory, selectedPriceRange, selectedDistance, userLocation]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchData().finally(() => setIsLoading(false));
      
      // Inicializar desde params
      if (route?.params?.viewMode) setViewMode(route.params.viewMode);
      if (route?.params?.initialSearch) setSearchQuery(route.params.initialSearch);
      
      // Cargar favoritos
      (async () => {
        try {
          const raw = await AsyncStorage.getItem('favorites');
          const favs = raw ? JSON.parse(raw) : [];
          setFavoriteIds(favs.map(p => p.id));
        } catch (e) {}
      })();
      
      // Actualizar región del mapa
      if (userLocation?.latitude && userLocation?.longitude) {
        const newRegion = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
        if (mapRef.current && MapView) {
          mapRef.current.animateToRegion(newRegion, 600);
        }
      }
    }, [route, userLocation])
  );

  // Toggle favorito
  const toggleFavorite = async (product) => {
    try {
      const raw = await AsyncStorage.getItem('favorites');
      const favs = raw ? JSON.parse(raw) : [];
      const exists = favs.find(p => p.id === product.id);
      const next = exists ? favs.filter(p => p.id !== product.id) : [product, ...favs];
      await AsyncStorage.setItem('favorites', JSON.stringify(next));
      setFavoriteIds(next.map(p => p.id));
    } catch (e) {}
  };

  // Centrar mapa en ubicación del usuario
  const centerOnUser = async () => {
    const result = await detectLocation();
    if (!result.success) return;
    const target = {
      latitude: result.location.latitude,
      longitude: result.location.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(target);
    if (MapView && mapRef.current) {
      mapRef.current.animateToRegion(target, 600);
    } else if (webViewRef.current) {
      const js = 'window.centerMap(' + target.latitude + ', ' + target.longitude + '); true;';
      try { webViewRef.current.injectJavaScript(js); } catch (e) {}
    }
  };

  // Abrir navegación a la tienda
  const openDirections = (store) => {
    if (!store) return;
    const lat = parseFloat(store.latitud);
    const lng = parseFloat(store.longitud);
    if (isNaN(lat) || isNaN(lng)) return;
    const label = encodeURIComponent(store.nombre_comercio || 'Destino');
    const url = 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng + '&destination_place_id=&travelmode=driving&dir_action=navigate';
    Linking.openURL(url).catch(() => {
      const fallback = 'https://www.openstreetmap.org/directions?engine=graphhopper_car&route=' + lat + '%2C' + lng;
      Linking.openURL(fallback).catch(() => {});
    });
  };

  // Modal de filtros
  const FilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Categorías */}
            <Text style={styles.filterSectionTitle}>Tipo de comercio</Text>
            <View style={styles.filterChipsContainer}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Ionicons 
                    name={cat.icon} 
                    size={16} 
                    color={selectedCategory === cat.id ? '#FFFFFF' : COLORS.text} 
                  />
                  <Text style={[styles.filterChipText, selectedCategory === cat.id && styles.filterChipTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Rango de precios */}
            <Text style={styles.filterSectionTitle}>Rango de precios</Text>
            <View style={styles.filterChipsContainer}>
              {PRICE_RANGES.map(range => (
                <TouchableOpacity
                  key={range.id}
                  style={[styles.filterChip, selectedPriceRange === range.id && styles.filterChipActive]}
                  onPress={() => setSelectedPriceRange(range.id)}
                >
                  <Text style={[styles.filterChipText, selectedPriceRange === range.id && styles.filterChipTextActive]}>
                    {range.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Distancia */}
            <Text style={styles.filterSectionTitle}>Distancia máxima</Text>
            <View style={styles.filterChipsContainer}>
              {DISTANCE_OPTIONS.map(dist => (
                <TouchableOpacity
                  key={dist.id}
                  style={[styles.filterChip, selectedDistance === dist.id && styles.filterChipActive]}
                  onPress={() => {
                    setSelectedDistance(dist.id);
                    setNearbyRadius(dist.id);
                  }}
                >
                  <Text style={[styles.filterChipText, selectedDistance === dist.id && styles.filterChipTextActive]}>
                    {dist.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          {/* Botones de acción */}
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.clearFiltersBtn}
              onPress={() => {
                setSelectedCategory('all');
                setSelectedPriceRange('all');
                setSelectedDistance(12);
                setNearbyRadius(12);
              }}
            >
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyFiltersBtn}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersText}>Aplicar ({filteredProducts.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Card de producto para lista
  const ProductListCard = ({ product }) => {
    const discount = Math.round(((product.precio_original - product.precio_descuento) / product.precio_original) * 100);
    
    return (
      <TouchableOpacity 
        style={styles.listCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
        activeOpacity={0.9}
      >
        <View style={styles.listCardImageWrapper}>
          <Image
            source={{ uri: product.imagen_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }}
            style={styles.listCardImage}
          />
          <View style={styles.stockBadgeList}>
            <Text style={styles.stockBadgeText}>{product.cantidad_disponible || 0} left</Text>
          </View>
        </View>
        <View style={styles.listCardContent}>
          <View style={styles.listCardHeader}>
            <TouchableOpacity 
              style={styles.storeInfo}
              onPress={() => navigation.navigate('StoreProfile', { storeId: product.store_id })}
            >
              <View style={styles.smallStoreLogo}>
                <Text style={styles.smallStoreLogoText}>
                  {product.nombre_comercio?.substring(0, 2).toUpperCase() || 'DC'}
                </Text>
              </View>
              <Text style={styles.listStoreName} numberOfLines={1}>
                {product.nombre_comercio || 'Tienda'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.listFavoriteBtn} onPress={() => toggleFavorite(product)}>
              <Ionicons 
                name={favoriteIds.includes(product.id) ? 'heart' : 'heart-outline'} 
                size={22} 
                color={favoriteIds.includes(product.id) ? COLORS.primary : '#8E8E93'} 
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.listProductName} numberOfLines={1}>
            {product.nombre || 'Surprise Bag'}
          </Text>
          <Text style={styles.listPickupTime}>
            Recoge hoy 3:00 PM - 5:00 PM
          </Text>
          
          <View style={styles.listCardFooter}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={COLORS.primary} />
              <Text style={styles.ratingText}>{formatRating(product.calificacion_promedio)}</Text>
              <Text style={styles.distanceText}>  {formatNumber(product.distancia,1) || '0.8'} mi</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>${formatPrice(product.precio_original, 0)}</Text>
              <Text style={styles.listPrice}>${formatPrice(product.precio_descuento)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Preview card al seleccionar tienda en mapa
  const StorePreviewCard = ({ store, details }) => {
    if (!store) return null;
    
    const storeProducts = details?.productos?.length ? details.productos : products.filter(p => p.store_id === store.id);
    const mainProduct = storeProducts[0];
    const avgRating = (details?.calificacion_promedio) || (storeProducts.reduce((sum, p) => sum + (p.calificacion_promedio || 4.5), 0) / (storeProducts.length || 1));
    const minPrice = storeProducts.length ? Math.min(...storeProducts.map(p => parseFloat(p.precio_descuento) || 0)) : 0;
    
    return (
      <TouchableOpacity 
        style={styles.previewCard}
        onPress={() => navigation.navigate('StoreProfile', { storeId: store.id })}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: mainProduct?.imagen_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400' }}
          style={styles.previewImage}
        />
        <View style={styles.previewContent}>
          <Text style={styles.previewStoreName} numberOfLines={1}>
            {store.nombre_comercio || 'Tienda'}
          </Text>
          <View style={styles.previewRatingRow}>
            <Ionicons name="star" size={14} color={COLORS.primary} />
            <Text style={styles.previewRating}>{formatNumber(avgRating,1)}</Text>
            <Text style={styles.previewDistance}>• {formatNumber(store.distancia,1) || '0.5'} mi</Text>
          </View>
          <Text style={styles.previewProducts}>
            {storeProducts.length} producto{storeProducts.length !== 1 ? 's' : ''} disponible{storeProducts.length !== 1 ? 's' : ''}
          </Text>
          {details?.ultima_resena && (
            <Text style={styles.previewLastReview} numberOfLines={2}>
              "{details.ultima_resena.comentario}" — {details.ultima_resena.user_nombre}
            </Text>
          )}
          <Text style={styles.previewPrice}>{'Desde $' + formatNumber(minPrice || 0, 0)}</Text>
          <TouchableOpacity style={styles.navigateBtn} onPress={() => openDirections(store)}>
            <Ionicons name="navigate" size={16} color="#FFFFFF" />
            <Text style={styles.navigateBtnText}>Cómo llegar</Text>
          </TouchableOpacity>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
      </TouchableOpacity>
    );
  };

  // Renderizado del mapa
  const renderMapView = () => {
    // Mapa Leaflet por WebView
    if (!WebView) {
      return (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={64} color={COLORS.primary} />
          <Text style={styles.mapPlaceholderTitle}>Vista de Mapa</Text>
          <Text style={styles.mapPlaceholderText}>
            {filteredStores.length} tiendas disponibles cerca de ti
          </Text>
          <TouchableOpacity style={styles.switchToListBtn} onPress={() => setViewMode('list')}>
            <Text style={styles.switchToListText}>Ver en Lista</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const userLatVal = (userLocation && userLocation.latitude) ? userLocation.latitude : region.latitude;
    const userLngVal = (userLocation && userLocation.longitude) ? userLocation.longitude : region.longitude;
    const storesSource = (filteredStores.length ? filteredStores : FALLBACK_STORES)
      .map((s) => ({ id: s.id, name: s.nombre_comercio, lat: parseFloat(s.latitud), lng: parseFloat(s.longitud) }))
      .filter((s) => !isNaN(s.lat) && !isNaN(s.lng));
    const storesJson = JSON.stringify(storesSource);

    const leafletHtml = [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />',
      '  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" />',
      '  <style> html, body, #map { height: 100%; margin: 0; padding: 0; } .leaflet-popup-content { font-family: -apple-system, Roboto, Arial, sans-serif; } </style>',
      '</head>',
      '<body>',
      '  <div id="map"></div>',
      '  <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>',
      '  <script>',
      '    const userLat = ' + userLatVal + ';',
      '    const userLng = ' + userLngVal + ';',
      '    const stores = ' + storesJson + ';',
      '    const map = L.map("map").setView([userLat, userLng], 13);',
      '    window.map = map;',
      '    window.centerMap = function(lat, lng) { try { map.setView([lat, lng], 13); } catch (e) {} };',
      '    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);',
      '    L.circleMarker([userLat, userLng], { radius: 6, color: "#2E86DE" }).addTo(map).bindPopup("Tu ubicación");',
      '    stores.forEach(function(s){',
      '      if (isNaN(s.lat) || isNaN(s.lng)) return;',
      '      var m = L.marker([s.lat, s.lng]).addTo(map).bindPopup(s.name || "Tienda");',
      '      m.on("click", function(){',
      '        if (window.ReactNativeWebView) {',
      '          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "markerPress", storeId: s.id }));',
      '        }',
      '      });',
      '    });',
      '  </script>',
      '</body>',
      '</html>'
    ].join('\n');

    return (
      <View style={styles.mapContainer}>
        <WebView
          style={styles.map}
          originWhitelist={[ '*' ]}
          source={{ html: leafletHtml }}
          ref={webViewRef}
          onMessage={async (event) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg.type === 'markerPress') {
                const store = filteredStores.find(s => s.id === msg.storeId) || FALLBACK_STORES.find(s => s.id === msg.storeId);
                setSelectedStore(store || null);
                if (store && store.id < 9000) {
                  try {
                    const res = await publicApi.get('/stores/' + store.id);
                    setSelectedStoreDetails(res.data);
                  } catch (e) {
                    setSelectedStoreDetails(null);
                  }
                } else {
                  setSelectedStoreDetails(null);
                }
              }
            } catch (e) {}
          }}
        />
        {/* Botón para centrar en usuario */}
        <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
          <Ionicons name="locate" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        {/* Preview card */}
        {selectedStore && (
          <View style={styles.previewCardContainer}>
            <StorePreviewCard store={selectedStore} details={selectedStoreDetails} />
          </View>
        )}
      </View>
    );
  };

  // Renderizado de lista
  const renderListView = () => (
    <FlatList
      data={filteredProducts}
      keyExtractor={(item, index) => `product-${item.id}-${index}`}
      renderItem={({ item }) => <ProductListCard product={item} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <Text style={styles.resultsCount}>
          {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''}
        </Text>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="food-off" size={48} color="#8E8E93" />
          <Text style={styles.emptyText}>No se encontraron resultados</Text>
          <Text style={styles.emptySubtext}>Intenta ajustar los filtros</Text>
        </View>
      }
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tiendas...</Text>
      </SafeAreaView>
    );
  }

  // Contador de filtros activos
  const activeFiltersCount = [
    selectedCategory !== 'all',
    selectedPriceRange !== 'all',
    selectedDistance !== 12,
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <FilterModal />
      
      {/* Header con ubicación */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.locationContainer} onPress={detectLocation}>
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="location" size={18} color={COLORS.primary} />
          )}
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>{userLocation?.city || 'Mi ubicación'}</Text>
            <Text style={styles.locationSubtitle}>dentro de {selectedDistance} mi</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda y filtro */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tiendas o productos"
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={22} color={activeFiltersCount > 0 ? '#FFFFFF' : COLORS.primary} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Toggle List / Map */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons name="list" size={18} color={viewMode === 'list' ? '#FFFFFF' : '#8E8E93'} />
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            Lista
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'map' && styles.toggleActive]}
          onPress={() => setViewMode('map')}
        >
          <Ionicons name="map" size={18} color={viewMode === 'map' ? '#FFFFFF' : '#8E8E93'} />
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
            Mapa
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      {viewMode === 'map' ? renderMapView() : renderListView()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.text },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, paddingBottom: SPACING.xs },
  locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationTextContainer: { marginLeft: 6, marginRight: 4 },
  locationTitle: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  locationSubtitle: { fontSize: 12, color: '#8E8E93' },

  // Búsqueda
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: SPACING.smd, borderRadius: SPACING.smd, borderWidth: 1, borderColor: '#E5E5EA', height: LAYOUT.searchBarHeight, marginRight: SPACING.sm },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text },
  filterButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
  filterButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

  // Toggle
  toggleContainer: { flexDirection: 'row', marginHorizontal: SPACING.md, marginBottom: SPACING.sm, backgroundColor: '#E5E5EA', borderRadius: SPACING.sm, padding: SPACING.xs },
  toggleButton: { flex: 1, flexDirection: 'row', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginLeft: 6 },
  toggleTextActive: { color: '#FFFFFF' },

  // Modal de filtros
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: SPACING.md, paddingBottom: 40, maxHeight: height * 0.8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  filterSectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 16, marginBottom: 12 },
  filterChipsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F2F7', marginRight: 8, marginBottom: 8 },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { fontSize: 14, color: COLORS.text, marginLeft: 4 },
  filterChipTextActive: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row', marginTop: 24 },
  clearFiltersBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', marginRight: 8 },
  clearFiltersText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  applyFiltersBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.primary },
  applyFiltersText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },

  // Mapa
  mapContainer: { flex: 1, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  markerContainer: { alignItems: 'center' },
  marker: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  markerSelected: { transform: [{ scale: 1.2 }] },
  markerEmpty: { opacity: 0.6 },
  markerEmptyInner: { backgroundColor: '#8E8E93' },
  markerBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center' },
  markerBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  centerBtn: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },

  // Preview card en mapa
  previewCardContainer: { position: 'absolute', bottom: SPACING.mld, left: SPACING.md, right: SPACING.md },
  previewCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: LAYOUT.cardBorderRadius, padding: SPACING.smd, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  previewImage: { width: 70, height: 70, borderRadius: 12, marginRight: 12 },
  previewContent: { flex: 1 },
  previewStoreName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  previewRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  previewRating: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginLeft: 4 },
  previewDistance: { fontSize: 13, color: '#8E8E93', marginLeft: 4 },
  previewProducts: { fontSize: 12, color: '#8E8E93', marginBottom: 2 },
  previewLastReview: { fontSize: 12, color: '#8E8E93', fontStyle: 'italic', marginBottom: 4 },
  previewPrice: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  navigateBtn: { marginTop: SPACING.sm, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: SPACING.smd, paddingVertical: SPACING.sm, borderRadius: SPACING.mld },
  navigateBtnText: { marginLeft: 6, color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  // Lista
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.mld },
  resultsCount: { fontSize: 14, color: '#8E8E93', marginBottom: 12 },
  listCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  listCardImageWrapper: { position: 'relative' },
  listCardImage: { width: 100, height: 120, resizeMode: 'cover' },
  stockBadgeList: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  stockBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  listCardContent: { flex: 1, padding: SPACING.smd },
  listCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  storeInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  smallStoreLogo: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  smallStoreLogoText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  listStoreName: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 },
  listFavoriteBtn: { padding: 4 },
  listProductName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  listPickupTime: { fontSize: 12, color: '#8E8E93', marginBottom: 8 },
  listCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginLeft: 2 },
  distanceText: { fontSize: 12, color: '#8E8E93' },
  priceContainer: { flexDirection: 'row', alignItems: 'center' },
  originalPrice: { fontSize: 12, color: '#8E8E93', textDecorationLine: 'line-through', marginRight: 6 },
  listPrice: { fontSize: 16, fontWeight: '700', color: COLORS.primary },

  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 12, fontSize: 16, color: '#8E8E93' },
  emptySubtext: { fontSize: 14, color: '#C7C7CC', marginTop: 4 },

  // Map placeholder
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7', padding: 40 },
  mapPlaceholderTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  mapPlaceholderText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 24 },
  switchToListBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  switchToListText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});

export default BrowseScreen;
