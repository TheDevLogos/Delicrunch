/**
 * StoreProfileScreen - Perfil de Tienda
 * Muestra información completa de la tienda y sus productos disponibles
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { publicApi } from '../services/api';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '../contexts/LocationContext';
import { COLORS, SPACING, BORDERS } from '../src/constants/theme';
import { formatPrice, formatNumber } from '../src/utils/format';

const { width } = Dimensions.get('window');

const StoreProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { storeId } = route.params || {};
  const { userLocation, calculateDistance } = useLocation();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'info' | 'reviews' | 'stats'
  const [isOwner, setIsOwner] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    fetchStoreData();
    loadFavorites();
    checkOwnership();
  }, [storeId]);

  const checkOwnership = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.rol === 'comercio') {
          // Verificar si este usuario es dueño de esta tienda
          const storesRes = await api.get('/stores/my-store');
          if (storesRes.data?.id === storeId) {
            setIsOwner(true);
            fetchAnalytics();
          }
        }
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const fetchAnalytics = async (period = '30') => {
    try {
      setAnalyticsLoading(true);
      const response = await api.get(`/orders/store-analytics?period=${period}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchStoreData = async () => {
    try {
      setIsLoading(true);
      
      // Obtener información de la tienda
      const [storesRes, productsRes, reviewsRes] = await Promise.all([
        publicApi.get('/stores/with-products'),
        publicApi.get('/products'),
        publicApi.get(`/reviews/store/${storeId}`).catch(() => ({ data: [] })),
      ]);

      const storeData = storesRes.data?.find(s => s.id === storeId);
      const storeProducts = productsRes.data?.filter(p => p.store_id === storeId) || [];
      
      // Calcular rating promedio
      const reviews = reviewsRes.data || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.calificacion, 0) / reviews.length 
        : 4.5;

      if (storeData) {
        setStore({
          ...storeData,
          rating: avgRating,
          reviewCount: reviews.length,
          reviews,
        });
      }
      setProducts(storeProducts);
    } catch (error) {
      console.error('Error cargando tienda:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const raw = await AsyncStorage.getItem('favorites');
      const favs = raw ? JSON.parse(raw) : [];
      setFavoriteIds(favs.map(p => p.id));
    } catch (e) {}
  };

  const toggleFavorite = async (product) => {
    try {
      const raw = await AsyncStorage.getItem('favorites');
      const favs = raw ? JSON.parse(raw) : [];
      const exists = favs.find(p => p.id === product.id);
      let next = exists 
        ? favs.filter(p => p.id !== product.id) 
        : [product, ...favs];
      await AsyncStorage.setItem('favorites', JSON.stringify(next));
      setFavoriteIds(next.map(p => p.id));
    } catch (e) {}
  };

  const openMaps = () => {
    if (!store?.latitud || !store?.longitud) return;
    
    const lat = parseFloat(store.latitud);
    const lng = parseFloat(store.longitud);
    const label = encodeURIComponent(store.nombre_comercio);
    
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });
    
    Linking.openURL(url);
  };

  const callStore = () => {
    if (!store?.telefono) return;
    Linking.openURL(`tel:${store.telefono}`);
  };

  const getDistance = () => {
    if (!store?.latitud || !store?.longitud || !userLocation?.latitude) return null;
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      parseFloat(store.latitud),
      parseFloat(store.longitud)
    );
    return formatNumber(distance, 1);
  };

  // Producto Card
  const ProductCard = ({ product }) => {
    const discount = Math.round(((product.precio_original - product.precio_descuento) / product.precio_original) * 100);
    const isFavorite = favoriteIds.includes(product.id);

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: product.imagen_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }}
          style={styles.productImage}
        />
        
        {/* Badge descuento */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{discount}%</Text>
        </View>
        
        {/* Favorito */}
        <TouchableOpacity 
          style={styles.favoriteBtn}
          onPress={() => toggleFavorite(product)}
        >
          <Ionicons 
            name={isFavorite ? 'heart' : 'heart-outline'} 
            size={20} 
            color={isFavorite ? COLORS.primary : '#FFFFFF'} 
          />
        </TouchableOpacity>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.nombre}
          </Text>
          <Text style={styles.productDesc} numberOfLines={1}>
            {product.descripcion}
          </Text>
          
          <View style={styles.priceRow}>
              <Text style={styles.originalPrice}>${formatPrice(product.precio_original)}</Text>
              <Text style={styles.discountPrice}>${formatPrice(product.precio_descuento)}</Text>
          </View>
          
          <View style={styles.stockRow}>
            <View style={styles.stockIndicator}>
              <View style={[styles.stockDot, { backgroundColor: product.cantidad_disponible > 3 ? '#34C759' : '#FF9500' }]} />
              <Text style={styles.stockText}>{product.cantidad_disponible} disponibles</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Review Card
  const ReviewCard = ({ review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={styles.reviewerAvatar}>
            <Text style={styles.reviewerInitial}>
              {review.nombre_usuario?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.reviewerName}>{review.nombre_usuario || 'Usuario'}</Text>
            <Text style={styles.reviewDate}>
              {new Date(review.created_at).toLocaleDateString('es-MX')}
            </Text>
          </View>
        </View>
        <View style={styles.reviewRating}>
          {[1, 2, 3, 4, 5].map(star => (
            <Ionicons
              key={star}
              name={star <= review.calificacion ? 'star' : 'star-outline'}
              size={14}
              color={COLORS.primary}
            />
          ))}
        </View>
      </View>
      {review.comentario && (
        <Text style={styles.reviewComment}>{review.comentario}</Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#8E8E93" />
        <Text style={styles.errorText}>Tienda no encontrada</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const distance = getDistance();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header con imagen */}
      <View style={styles.headerImageContainer}>
        <Image
          source={{ uri: products[0]?.imagen_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800' }}
          style={styles.headerImage}
        />
        <View style={styles.headerOverlay} />
        
        {/* Botón de regreso */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Info de la tienda */}
        <View style={styles.storeHeaderInfo}>
          <View style={styles.storeLogo}>
            <Text style={styles.storeLogoText}>
              {store.nombre_comercio?.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.storeHeaderText}>
            <Text style={styles.storeName}>{store.nombre_comercio}</Text>
            <View style={styles.storeMetaRow}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FFFFFF" />
                <Text style={styles.ratingText}>{formatNumber(store.rating, 1) || '4.5'}</Text>
                <Text style={styles.reviewCountText}>({store.reviewCount || 0})</Text>
              </View>
              {distance && (
                <View style={styles.distanceBadge}>
                  <Ionicons name="location-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.distanceText}>{distance} mi</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            Productos ({products.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            Información
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
            Reseñas
          </Text>
        </TouchableOpacity>
        {isOwner && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
            onPress={() => {
              setActiveTab('stats');
              if (!analytics) fetchAnalytics();
            }}
          >
            <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
              Estadísticas
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido según tab activo */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'products' && (
          <View style={styles.productsGrid}>
            {products.length > 0 ? (
              products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <View style={styles.emptyProducts}>
                <MaterialCommunityIcons name="food-off" size={48} color="#8E8E93" />
                <Text style={styles.emptyText}>No hay productos disponibles</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'info' && (
          <View style={styles.infoSection}>
            {/* Descripción */}
            {store.descripcion && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoTitle}>Sobre nosotros</Text>
                <Text style={styles.infoDesc}>{store.descripcion}</Text>
              </View>
            )}

            {/* Horarios */}
            {store.horario && (
              <View style={styles.infoBlock}>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                  <View style={styles.infoRowContent}>
                    <Text style={styles.infoLabel}>Horario</Text>
                    <Text style={styles.infoValue}>{store.horario}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Dirección */}
            <TouchableOpacity style={styles.infoBlock} onPress={openMaps}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                <View style={styles.infoRowContent}>
                  <Text style={styles.infoLabel}>Dirección</Text>
                  <Text style={styles.infoValue}>{store.direccion}</Text>
                  <Text style={styles.infoAction}>Ver en mapa →</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Teléfono */}
            {store.telefono && (
              <TouchableOpacity style={styles.infoBlock} onPress={callStore}>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color={COLORS.primary} />
                  <View style={styles.infoRowContent}>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoValue}>{store.telefono}</Text>
                    <Text style={styles.infoAction}>Llamar →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Categoría */}
            <View style={styles.infoBlock}>
              <View style={styles.infoRow}>
                <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
                <View style={styles.infoRowContent}>
                  <Text style={styles.infoLabel}>Categoría</Text>
                  <Text style={styles.infoValue}>{products[0]?.categoria || 'Restaurante'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.reviewsSection}>
            {/* Resumen de ratings */}
            <View style={styles.ratingSummary}>
              <Text style={styles.bigRating}>{formatNumber(store.rating, 1) || '4.5'}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(store.rating || 4.5) ? 'star' : 'star-outline'}
                    size={20}
                    color={COLORS.primary}
                  />
                ))}
              </View>
              <Text style={styles.totalReviews}>{store.reviewCount || 0} reseñas</Text>
            </View>

            {/* Lista de reseñas */}
            {store.reviews && store.reviews.length > 0 ? (
              store.reviews.map((review, index) => (
                <ReviewCard key={review.id || index} review={review} />
              ))
            ) : (
              <View style={styles.emptyReviews}>
                <Ionicons name="chatbubble-outline" size={48} color="#8E8E93" />
                <Text style={styles.emptyText}>Aún no hay reseñas</Text>
                <Text style={styles.emptySubtext}>Sé el primero en dejar una reseña</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'stats' && isOwner && (
          <View style={styles.statsSection}>
            {analyticsLoading ? (
              <View style={styles.statsLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando estadísticas...</Text>
              </View>
            ) : analytics ? (
              <>
                {/* KPIs Principales */}
                <View style={styles.kpiContainer}>
                  <View style={[styles.kpiCard, { backgroundColor: '#E8F5E9' }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: '#4CAF50' }]}>
                      <MaterialCommunityIcons name="cash-multiple" size={24} color="#FFF" />
                    </View>
                    <Text style={styles.kpiValue}>${formatPrice(analytics.summary.ventas_totales)}</Text>
                    <Text style={styles.kpiLabel}>Ventas Totales</Text>
                    {analytics.summary.ventas_growth != 0 && (
                      <View style={styles.kpiGrowth}>
                        <Ionicons 
                          name={analytics.summary.ventas_growth > 0 ? 'trending-up' : 'trending-down'} 
                          size={14} 
                          color={analytics.summary.ventas_growth > 0 ? '#4CAF50' : '#F44336'} 
                        />
                        <Text style={[styles.kpiGrowthText, { 
                          color: analytics.summary.ventas_growth > 0 ? '#4CAF50' : '#F44336' 
                        }]}>
                          {analytics.summary.ventas_growth}%
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.kpiCard, { backgroundColor: '#E3F2FD' }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: '#2196F3' }]}>
                      <Ionicons name="wallet" size={24} color="#FFF" />
                    </View>
                    <Text style={styles.kpiValue}>${formatPrice(analytics.summary.ingresos_netos)}</Text>
                    <Text style={styles.kpiLabel}>Ingresos Netos</Text>
                    <Text style={styles.kpiSubtext}>Después de comisión</Text>
                  </View>

                  <View style={[styles.kpiCard, { backgroundColor: '#FFF3E0' }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: '#FF9800' }]}>
                      <Ionicons name="cart" size={24} color="#FFF" />
                    </View>
                    <Text style={styles.kpiValue}>{analytics.summary.total_pedidos}</Text>
                    <Text style={styles.kpiLabel}>Total Pedidos</Text>
                    {analytics.summary.pedidos_growth != 0 && (
                      <View style={styles.kpiGrowth}>
                        <Ionicons 
                          name={analytics.summary.pedidos_growth > 0 ? 'trending-up' : 'trending-down'} 
                          size={14} 
                          color={analytics.summary.pedidos_growth > 0 ? '#4CAF50' : '#F44336'} 
                        />
                        <Text style={[styles.kpiGrowthText, { 
                          color: analytics.summary.pedidos_growth > 0 ? '#4CAF50' : '#F44336' 
                        }]}>
                          {analytics.summary.pedidos_growth}%
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.kpiCard, { backgroundColor: '#F3E5F5' }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: '#9C27B0' }]}>
                      <Ionicons name="people" size={24} color="#FFF" />
                    </View>
                    <Text style={styles.kpiValue}>{analytics.summary.clientes_unicos}</Text>
                    <Text style={styles.kpiLabel}>Clientes Únicos</Text>
                  </View>
                </View>

                {/* Métricas Secundarias */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>${formatPrice(analytics.summary.ticket_promedio)}</Text>
                    <Text style={styles.metricLabel}>Ticket Promedio</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{analytics.summary.conversion_rate}%</Text>
                    <Text style={styles.metricLabel}>Tasa Conversión</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{analytics.summary.pedidos_completados}</Text>
                    <Text style={styles.metricLabel}>Completados</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{analytics.summary.pedidos_activos}</Text>
                    <Text style={styles.metricLabel}>En Proceso</Text>
                  </View>
                </View>

                {/* Top Productos */}
                <View style={styles.statsCard}>
                  <View style={styles.statsCardHeader}>
                    <MaterialCommunityIcons name="trophy" size={20} color={COLORS.primary} />
                    <Text style={styles.statsCardTitle}>Top Productos</Text>
                  </View>
                  {analytics.topProducts.slice(0, 5).map((product, index) => (
                    <View key={product.id} style={styles.productRankItem}>
                      <View style={styles.productRankLeft}>
                        <View style={[styles.rankBadge, index < 3 && styles.rankBadgeTop]}>
                          <Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>
                            {index + 1}
                          </Text>
                        </View>
                        <View style={styles.productRankInfo}>
                          <Text style={styles.productRankName} numberOfLines={1}>
                            {product.nombre}
                          </Text>
                          <View style={styles.productRankStats}>
                            <Text style={styles.productRankStat}>
                              {product.unidades} unidades
                            </Text>
                            <Text style={styles.productRankStat}>•</Text>
                            <Text style={styles.productRankStat}>
                              {product.pedidos} pedidos
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.productRankRevenue}>
                        ${formatPrice(product.ingresos)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Distribución por Estado */}
                <View style={styles.statsCard}>
                  <View style={styles.statsCardHeader}>
                    <Ionicons name="pie-chart" size={20} color={COLORS.primary} />
                    <Text style={styles.statsCardTitle}>Estado de Pedidos</Text>
                  </View>
                  {analytics.statusDistribution.map((status, index) => {
                    const statusColors = {
                      'pendiente': '#FF9800',
                      'confirmado': '#2196F3',
                      'listo': '#9C27B0',
                      'recogido': '#4CAF50',
                      'cancelado': '#F44336'
                    };
                    const color = statusColors[status.estado] || '#757575';
                    
                    return (
                      <View key={index} style={styles.statusDistItem}>
                        <View style={styles.statusDistLeft}>
                          <View style={[styles.statusDot, { backgroundColor: color }]} />
                          <Text style={styles.statusDistLabel}>
                            {status.estado.charAt(0).toUpperCase() + status.estado.slice(1)}
                          </Text>
                        </View>
                        <View style={styles.statusDistRight}>
                          <Text style={styles.statusDistValue}>{status.cantidad}</Text>
                          <Text style={styles.statusDistPercent}>({status.porcentaje}%)</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Horarios de Mayor Demanda */}
                <View style={styles.statsCard}>
                  <View style={styles.statsCardHeader}>
                    <Ionicons name="time" size={20} color={COLORS.primary} />
                    <Text style={styles.statsCardTitle}>Horarios de Mayor Demanda</Text>
                  </View>
                  <View style={styles.peakHoursContainer}>
                    {analytics.peakHours.slice(0, 6).map((hour, index) => {
                      const maxPedidos = Math.max(...analytics.peakHours.map(h => h.pedidos));
                      const heightPercentage = (hour.pedidos / maxPedidos) * 100;
                      
                      return (
                        <View key={index} style={styles.peakHourBar}>
                          <View style={styles.peakHourValue}>
                            <Text style={styles.peakHourText}>{hour.pedidos}</Text>
                          </View>
                          <View style={styles.peakHourBarContainer}>
                            <View 
                              style={[
                                styles.peakHourBarFill, 
                                { height: `${heightPercentage}%` }
                              ]} 
                            />
                          </View>
                          <Text style={styles.peakHourLabel}>
                            {hour.hora}:00
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Tendencia Diaria */}
                {analytics.dailyTrend.length > 0 && (
                  <View style={styles.statsCard}>
                    <View style={styles.statsCardHeader}>
                      <Ionicons name="trending-up" size={20} color={COLORS.primary} />
                      <Text style={styles.statsCardTitle}>Tendencia Últimos 7 Días</Text>
                    </View>
                    {analytics.dailyTrend.slice(0, 7).reverse().map((day, index) => {
                      const maxVentas = Math.max(...analytics.dailyTrend.slice(0, 7).map(d => parseFloat(d.ventas)));
                      const widthPercentage = maxVentas > 0 ? (parseFloat(day.ventas) / maxVentas) * 100 : 0;
                      
                      return (
                        <View key={index} style={styles.trendItem}>
                          <Text style={styles.trendDate}>
                            {new Date(day.fecha).toLocaleDateString('es-MX', { 
                              weekday: 'short', 
                              day: 'numeric' 
                            })}
                          </Text>
                          <View style={styles.trendBarContainer}>
                            <View 
                              style={[
                                styles.trendBar, 
                                { width: `${widthPercentage}%` }
                              ]} 
                            />
                          </View>
                          <Text style={styles.trendValue}>
                            ${formatPrice(day.ventas)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyStats}>
                <MaterialCommunityIcons name="chart-line" size={64} color="#8E8E93" />
                <Text style={styles.emptyText}>No hay datos disponibles</Text>
                <Text style={styles.emptySubtext}>Las estadísticas aparecerán cuando tengas pedidos</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Header
  headerImageContainer: {
    height: 200,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeHeaderInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  storeLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  storeLogoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storeHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  storeName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  reviewCountText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 4,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },

  // Products Grid
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  productCard: {
    width: (width - SPACING.md * 3) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  stockText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  emptyProducts: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 4,
  },

  // Info Section
  infoSection: {
    padding: SPACING.md,
  },
  infoBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoRowContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  infoAction: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '500',
  },

  // Reviews Section
  reviewsSection: {
    padding: SPACING.md,
  },
  ratingSummary: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  bigRating: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: '#8E8E93',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewerInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyReviews: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  // Statistics Section
  statsSection: {
    padding: SPACING.md,
  },
  statsLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  kpiCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  kpiSubtext: {
    fontSize: 10,
    color: '#C7C7CC',
    marginTop: 2,
  },
  kpiGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  kpiGrowthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 56) / 4,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statsCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  productRankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  productRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankBadgeTop: {
    backgroundColor: COLORS.primary,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
  },
  rankTextTop: {
    color: '#FFF',
  },
  productRankInfo: {
    flex: 1,
  },
  productRankName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  productRankStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productRankStat: {
    fontSize: 11,
    color: '#8E8E93',
  },
  productRankRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statusDistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  statusDistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusDistLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  statusDistRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDistValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusDistPercent: {
    fontSize: 12,
    color: '#8E8E93',
  },
  peakHoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 20,
  },
  peakHourBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  peakHourValue: {
    marginBottom: 8,
  },
  peakHourText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  peakHourBarContainer: {
    width: '80%',
    height: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  peakHourBarFill: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  peakHourLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 6,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  trendDate: {
    width: 60,
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  trendBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  trendValue: {
    width: 70,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  emptyStats: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});

export default StoreProfileScreen;
