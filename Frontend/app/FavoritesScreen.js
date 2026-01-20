import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api, { publicApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatPrice, formatNumber } from '../src/utils/format';
import { COLORS, SPACING } from '../src/constants/theme';

const { width } = Dimensions.get('window');

// Helper para formatear calificación de forma segura
const formatRating = (rating) => {
  if (rating === null || rating === undefined || isNaN(rating)) return '4.5';
  return formatNumber(rating, 1);
};

const FavoritesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem('favorites');
      const favs = raw ? JSON.parse(raw) : [];
      setFavorites(favs);
    } catch (err) {
      console.error('Error al obtener favoritos:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const removeFavorite = (id) => {
    Alert.alert('Eliminar', '¿Deseas eliminar este artículo de favoritos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const next = favorites.filter((f) => f.id !== id);
          setFavorites(next);
          try { await AsyncStorage.setItem('favorites', JSON.stringify(next)); } catch (e) {}
        },
      },
    ]);
  };

  // Tarjeta de favorito estilo horizontal
  const FavoriteCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.favoriteCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.imagen_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.storeInfo}>
            <View style={styles.storeLogo}>
              <Text style={styles.storeLogoText}>
                {item.nombre_comercio?.substring(0, 2).toUpperCase() || 'DC'}
              </Text>
            </View>
            <Text style={styles.storeName} numberOfLines={1}>
              {item.nombre_comercio || 'Tienda'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => removeFavorite(item.id)}
          >
            <Ionicons name="heart" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.productName} numberOfLines={1}>
          {item.nombre || 'Surprise Bag'}
        </Text>
        <Text style={styles.pickupTime}>
          Recoge hoy {item.hora_recogida_inicio || '3:00 PM'} - {item.hora_recogida_fin || '5:00 PM'}
        </Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={COLORS.primary} />
            <Text style={styles.ratingText}>{formatRating(item.calificacion_promedio)}</Text>
            <Text style={styles.distanceText}>  {item.distancia || '0.8'} mi</Text>
          </View>
          <Text style={styles.priceText}>${formatPrice(item.precio_descuento)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favoritos</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <FavoriteCard item={item} />}
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
            <Ionicons name="heart-outline" size={80} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No tienes favoritos aún</Text>
            <Text style={styles.emptySubtitle}>
              Guarda tus tiendas y productos favoritos para acceder rápidamente
            </Text>
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
  
  // Header
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Lista
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 20,
  },

  // Tarjeta de favorito
  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: 110,
    height: 130,
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storeLogo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  storeLogoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storeName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  pickupTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 2,
  },
  distanceText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  priceText: {
    fontSize: 17,
    fontWeight: '700',
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
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default FavoritesScreen;
