import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { publicApi } from '../services/api';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarById } from '../src/constants/profileAvatars';
import { COLORS, SPACING } from '../src/constants/theme';
import { formatPrice, formatNumber } from '../src/utils/format';
import FlashDealModal from '../components/FlashDealModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;

const DiscoverScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { 
    userLocation, 
    isLoadingLocation, 
    detectLocation,
    nearbyRadius,
    calculateDistance,
  } = useLocation();
  
  // Estado del perfil
  const [userProfile, setUserProfile] = useState(null);
  const backendBase = (api.defaults?.baseURL || '').replace(/\/?api$/, '');
  
  // Estados
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [categoryList, setCategoryList] = useState(['Todos', 'Tacos', 'Pizza', 'Sushi', 'Café', 'Desayunos', 'Postres']);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sections, setSections] = useState({ recommended: [], saving: [], surprise: [] });
  const [showFlashDealModal, setShowFlashDealModal] = useState(false);
  const [flashDealProducts, setFlashDealProducts] = useState([]);

  const shuffleArray = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const discountPct = (product) => {
    if (!product?.precio_original) return 0;
    return ((product.precio_original - product.precio_descuento) / product.precio_original) * 100;
  };

  // Fetch productos
  const fetchProducts = async () => {
    try {
      const response = await publicApi.get('/products');
      const data = response.data || [];
      
      // Agregar distancia calculada a cada producto
      if (userLocation?.latitude && userLocation?.longitude) {
        const productsWithDistance = data.map(product => {
          // Buscar coordenadas del producto (puede venir de la tienda)
          const lat = parseFloat(product.latitud);
          const lng = parseFloat(product.longitud);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              lat,
              lng
            );
            return { ...product, distancia: formatNumber(distance, 1) };
          }
          return { ...product, distancia: '0.5' };
        });
        setProducts(productsWithDistance);
        const categories = Array.from(new Set(productsWithDistance.map(p => p.categoria).filter(Boolean)));
        setCategoryList(['Todos', ...shuffleArray(categories)]);
      } else {
        setProducts(data);
        const categories = Array.from(new Set(data.map(p => p.categoria).filter(Boolean)));
        setCategoryList(['Todos', ...shuffleArray(categories)]);
      }
    } catch (err) {
      console.error('Error al obtener productos:', err);
      setProducts([]);
    }
  };

  const loadFavorites = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('favorites');
      const favs = raw ? JSON.parse(raw) : [];
      setFavoriteIds(favs.map(p => p.id));
    } catch (e) {}
  }, []);

  // Fetch perfil del usuario
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/profiles/me');
      setUserProfile(response.data);
    } catch (e) {
      // Usuario no autenticado
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchProducts().finally(() => setIsLoading(false));
      loadFavorites();
      if (user) {
        fetchUserProfile();
        checkFirstLogin();
      }
    }, [userLocation, user])
  );

  // Verificar si necesita ver el modal de primer login
  const checkFirstLogin = async () => {
    try {
      const response = await api.get('/profiles/check-first-login');
      if (response.data.should_show_modal && user?.rol === 'comprador') {
        // Mostrar el FlashDealModal
        setShowFlashDealModal(true);
        // Obtener productos para el modal
        const productsResponse = await publicApi.get('/products');
        const availableProducts = productsResponse.data.filter(p => 
          (p.cantidad_disponible || 0) > 0
        );
        setFlashDealProducts(availableProducts.slice(0, 10));
        // Marcar como mostrado
        await api.post('/profiles/first-login');
      }
    } catch (e) {
      console.error('Error checking first login:', e);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [userLocation]);

  // Handler para detectar ubicación por GPS
  const handleDetectLocation = async () => {
    const result = await detectLocation();
    if (result.success) {
      Alert.alert(
        '📍 Ubicación actualizada',
        `Tu ubicación es: ${result.location.fullAddress}`,
        [{ text: 'OK' }]
      );
      fetchProducts();
    } else {
      Alert.alert(
        'Error de ubicación',
        result.error || 'No se pudo detectar tu ubicación. Verifica los permisos.',
        [{ text: 'OK' }]
      );
    }
  };

  const filteredProducts = useMemo(() => {
    const term = searchQuery.toLowerCase();
    const base = products.filter(p =>
      p.nombre?.toLowerCase().includes(term) ||
      p.nombre_comercio?.toLowerCase().includes(term)
    );

    if (selectedCategory === 'Todos') return base;
    return base.filter(p => (p.categoria || '').toLowerCase() === selectedCategory.toLowerCase());
  }, [products, searchQuery, selectedCategory]);

  useEffect(() => {
    if (!filteredProducts.length) {
      setSections({ recommended: [], saving: [], surprise: [] });
      return;
    }

    const loadSections = async () => {
      try {
        // Recomendados para ti (basados en historial si hay usuario, o aleatorio)
        let recommended = [];
        if (user) {
          try {
            const recommendedResponse = await api.get('/products/recommended');
            recommended = recommendedResponse.data || [];
          } catch (e) {
            // Si falla, usar productos filtrados aleatorios
            recommended = shuffleArray(filteredProducts).slice(0, 6);
          }
        } else {
          recommended = shuffleArray(filteredProducts).slice(0, 6);
        }

        // Ahorra antes de que sea tarde (productos listos)
        let saving = [];
        try {
          const readyResponse = await publicApi.get('/products/ready');
          saving = readyResponse.data || [];
          if (saving.length === 0) {
            // Fallback a productos con gran descuento
            const savingSource = filteredProducts.filter(p => discountPct(p) >= 40);
            saving = shuffleArray(savingSource.length ? savingSource : filteredProducts).slice(0, 6);
          }
        } catch (e) {
          const savingSource = filteredProducts.filter(p => discountPct(p) >= 40);
          saving = shuffleArray(savingSource.length ? savingSource : filteredProducts).slice(0, 6);
        }

        // Nuevas Surprise Bags (productos nuevos o de tiendas nuevas)
        let surprise = [];
        try {
          const newResponse = await publicApi.get('/products/new');
          surprise = newResponse.data || [];
          if (surprise.length === 0) {
            surprise = shuffleArray(filteredProducts).slice(0, 6);
          }
        } catch (e) {
          surprise = shuffleArray(filteredProducts).slice(0, 6);
        }

        setSections({ recommended, saving, surprise });
      } catch (e) {
        console.error('Error loading sections:', e);
        // Fallback a lógica anterior
        const recommended = shuffleArray(filteredProducts).slice(0, 6);
        const savingSource = filteredProducts.filter(p => discountPct(p) >= 40);
        const saving = shuffleArray(savingSource.length ? savingSource : filteredProducts).slice(0, 6);
        const surprise = shuffleArray(filteredProducts).slice(0, 6);
        setSections({ recommended, saving, surprise });
      }
    };

    loadSections();
  }, [filteredProducts, user]);

  const toggleFavorite = async (product) => {
    try {
      const raw = await AsyncStorage.getItem('favorites');
      const favs = raw ? JSON.parse(raw) : [];
      const exists = favs.find(p => p.id === product.id);
      let next = exists ? favs.filter(p => p.id !== product.id) : [product, ...favs];
      await AsyncStorage.setItem('favorites', JSON.stringify(next));
      setFavoriteIds(next.map(p => p.id));
    } catch (e) {}
  };

  // Componente de tarjeta de producto horizontal
  const ProductCardHorizontal = ({ product }) => {
    if (!product) return null;
    
    const discount = product.precio_original && product.precio_descuento 
      ? Math.round(((product.precio_original - product.precio_descuento) / product.precio_original) * 100)
      : 0;
    const stockLeft = product.cantidad_disponible || 1;
    const rating = typeof product.calificacion_promedio === 'number'
      ? formatNumber(product.calificacion_promedio, 1)
      : '4.5';
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.imagen_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }}
            style={styles.productImage}
          />
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>{stockLeft} left</Text>
          </View>
          <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(product)}>
            <Ionicons name={favoriteIds.includes(product.id) ? 'heart' : 'heart-outline'} size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.storeLogoContainer}
            onPress={() => navigation.navigate('StoreProfile', { storeId: product.store_id })}
          >
            <View style={styles.storeLogo}>
              <Text style={styles.storeLogoText}>
                {product.nombre_comercio?.substring(0, 2).toUpperCase() || 'DC'}
              </Text>
            </View>
            <Text style={styles.storeNameOverlay} numberOfLines={1}>
              {product.nombre_comercio || 'Tienda'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.nombre || 'Surprise Bag'}
          </Text>
          <Text style={styles.pickupTime} numberOfLines={1}>
            Recoge hoy 3:00 PM - 5:00 PM
          </Text>
          <View style={styles.productFooter}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={COLORS.primary} />
              <Text style={styles.ratingText}>{rating}</Text>
              <Text style={styles.distanceText}>  {formatNumber(product.distancia,1) || '0.8'} mi</Text>
            </View>
            <Text style={styles.priceText}>${formatPrice(product.precio_descuento)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Componente de sección
  const ProductSection = ({ title, products, onSeeAll }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>Ver todo</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ProductCardHorizontal product={item} />}
        contentContainerStyle={styles.horizontalList}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando ofertas...</Text>
      </SafeAreaView>
    );
  }

  // Obtener el primer nombre del usuario
  const firstName = userProfile?.nombre?.split(' ')[0] || 'Usuario';
  
  // Renderizar avatar del usuario
  const renderUserAvatar = () => {
    if (userProfile?.avatar_icon_id) {
      const avatar = getAvatarById(userProfile.avatar_icon_id);
      const IconComp = avatar.iconSet === 'material' ? MaterialCommunityIcons : Ionicons;
      return (
        <View style={[styles.greetingAvatar, { backgroundColor: avatar.backgroundColor }]}>
          <IconComp name={avatar.icon} size={22} color={avatar.color} />
        </View>
      );
    } else if (userProfile?.foto_perfil) {
      return (
        <Image
          source={{ uri: userProfile.foto_perfil.startsWith('http') ? userProfile.foto_perfil : (backendBase + userProfile.foto_perfil) }}
          style={styles.greetingAvatarImage}
        />
      );
    }
    return (
      <View style={styles.greetingAvatarPlaceholder}>
        <Text style={styles.greetingAvatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Saludo personalizado */}
      {userProfile && (
        <TouchableOpacity 
          style={styles.greetingContainer}
          onPress={() => navigation.navigate('Perfil')}
          activeOpacity={0.7}
        >
          {renderUserAvatar()}
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingText}>
              Hola, <Text style={styles.greetingName}>{firstName}</Text> 👋
            </Text>
            <Text style={styles.greetingSubtext}>¿Qué vas a rescatar hoy?</Text>
          </View>
        </TouchableOpacity>
      )}
      
      {/* Header con ubicación */}
      <View style={[styles.header, !userProfile && styles.headerNoGreeting]}>
        <TouchableOpacity 
          style={styles.locationContainer} 
          onPress={handleDetectLocation}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="location" size={18} color={COLORS.primary} />
          )}
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>
              {userLocation?.city || 'Detectar ubicación'}
            </Text>
            <Text style={styles.locationSubtitle}>
              {isLoadingLocation ? 'Detectando...' : `dentro de ${nearbyRadius} mi`}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={COLORS.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.localHaulsButton}
          onPress={() => navigation.navigate('Buscar', { viewMode: 'map' })}
        >
          <MaterialCommunityIcons name="map-marker-radius" size={24} color={COLORS.primary} />
          <Text style={styles.localHaulsText}>Ver{'\n'}Mapa</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar restaurantes o productos"
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => {
            if (searchQuery.trim()) {
              navigation.navigate('Buscar', { initialSearch: searchQuery });
            }
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* Ubicación actual info */}
      {userLocation?.fullAddress && (
        <View style={styles.locationBanner}>
          <Ionicons name="navigate-circle" size={18} color={COLORS.primary} />
          <Text style={styles.locationBannerText} numberOfLines={1}>
            {userLocation.fullAddress}
          </Text>
          <TouchableOpacity onPress={handleDetectLocation}>
            <Ionicons name="refresh" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Contenido principal */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Categorías rápidas */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
            {categoryList.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity 
                  key={cat}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>

        <ProductSection 
          title="Recomendados para ti" 
            products={sections.recommended}
          onSeeAll={() => navigation.navigate('Buscar', { viewMode: 'list' })}
        />

        <ProductSection 
          title="Ahorra antes de que sea tarde" 
            products={sections.saving.length > 0 ? sections.saving : sections.recommended}
          onSeeAll={() => navigation.navigate('Buscar', { viewMode: 'list' })}
        />

        <ProductSection 
          title="Nuevas Surprise Bags" 
            products={sections.surprise.length > 0 ? sections.surprise : sections.recommended}
          onSeeAll={() => navigation.navigate('Buscar', { viewMode: 'list' })}
        />

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* FlashDealModal para primer login */}
      {showFlashDealModal && flashDealProducts.length > 0 && (
        <Modal
          visible={showFlashDealModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFlashDealModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowFlashDealModal(false)}
              >
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
              <FlashDealModal 
                products={flashDealProducts} 
                navigation={navigation}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
    paddingBottom: Platform.OS === 'android' ? 8 : 0, // Margin extra para Android
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.text },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  headerNoGreeting: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationTextContainer: { marginLeft: 6, marginRight: 4 },
  locationTitle: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  locationSubtitle: { fontSize: 12, color: '#8E8E93' },
  localHaulsButton: { alignItems: 'center', padding: 8, backgroundColor: '#FFF8F0', borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary },
  localHaulsText: { fontSize: 10, fontWeight: '600', color: COLORS.primary, textAlign: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: SPACING.md, marginVertical: SPACING.sm, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text },
  locationBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8F0', marginHorizontal: SPACING.md, marginBottom: SPACING.sm, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  locationBannerText: { flex: 1, marginLeft: 8, fontSize: 13, color: COLORS.text },
  categoriesScroll: { marginBottom: SPACING.sm },
  categoriesContainer: { paddingHorizontal: SPACING.md, paddingVertical: 4 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F2F7', marginRight: 8 },
  categoryChipActive: { backgroundColor: COLORS.primary },
  categoryText: { fontSize: 14, fontWeight: '500', color: '#8E8E93' },
  categoryTextActive: { color: '#FFFFFF' },
  scrollView: { flex: 1 },
  section: { marginTop: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  seeAllButton: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  horizontalList: { paddingLeft: SPACING.md, paddingRight: 4 },
  productCard: { width: CARD_WIDTH, marginRight: 12, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  imageContainer: { width: '100%', height: 130, position: 'relative' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  stockBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stockText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  favoriteButton: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  storeLogoContainer: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingRight: 10, paddingVertical: 2 },
  storeLogo: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  storeLogoText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  storeNameOverlay: { fontSize: 12, fontWeight: '600', color: '#FFFFFF', maxWidth: CARD_WIDTH - 60 },
  productInfo: { padding: 10 },
  productName: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  pickupTime: { fontSize: 11, color: '#8E8E93', marginBottom: 8 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginLeft: 2 },
  distanceText: { fontSize: 12, color: '#8E8E93' },
  priceText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  // Estilos del saludo personalizado
  greetingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.md, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 6 : 4,
    paddingBottom: Platform.OS === 'android' ? 8 : 8,
    backgroundColor: COLORS.background,
  },
  greetingAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 10,
  },
  greetingAvatarImage: { 
    width: 40, 
    height: 40, 
    borderRadius: 20,
    marginRight: 10,
  },
  greetingAvatarPlaceholder: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: COLORS.primary, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 10,
  },
  greetingAvatarInitial: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#FFFFFF',
  },
  greetingTextContainer: { 
    flex: 1,
  },
  greetingText: { 
    fontSize: 15, 
    color: COLORS.text,
  },
  greetingName: { 
    fontWeight: '700', 
    color: COLORS.primary,
  },
  greetingSubtext: { 
    fontSize: 12, 
    color: '#8E8E93',
    marginTop: 1,
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: SPACING.md,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DiscoverScreen;
