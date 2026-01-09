import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../src/constants/theme';
import { formatPrice } from '../src/utils/format';

// ProductCard estilo Too Good To Go
const ProductCard = ({ product, onPress, onFavoritePress, isFavorite }) => {
  const discount = product.precio_original > 0 
    ? Math.round((1 - product.precio_descuento / product.precio_original) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Imagen del producto */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.imagen_url || 'https://via.placeholder.com/400' }}
          style={styles.image}
        />
        
        {/* Badge de descuento */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{discount}%</Text>
          </View>
        )}
        
        {/* Botón favorito */}
        {onFavoritePress && (
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={onFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={22} 
              color={isFavorite ? COLORS.accent : COLORS.white} 
            />
          </TouchableOpacity>
        )}

        {/* Logo de la tienda (simulado) */}
        <View style={styles.storeLogoContainer}>
          <View style={styles.storeLogo}>
            <Text style={styles.storeLogoText}>
              {product.nombre_comercio?.charAt(0).toUpperCase() || 'T'}
            </Text>
          </View>
        </View>
      </View>

      {/* Info del producto */}
      <View style={styles.infoContainer}>
        <View style={styles.infoTop}>
          <Text style={styles.storeName} numberOfLines={1}>
            {product.nombre_comercio || 'Tienda'}
          </Text>
          {product.distancia && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location-outline" size={12} color={COLORS.textLight} />
              <Text style={styles.distanceText}>{product.distancia}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.title} numberOfLines={1}>{product.nombre}</Text>
        
        {/* Hora de recogida */}
        {(product.hora_recogida_inicio || product.hora_recogida_fin) && (
          <View style={styles.pickupRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
            <Text style={styles.pickupText}>
              Recogida {product.hora_recogida_inicio} - {product.hora_recogida_fin}
            </Text>
          </View>
        )}

        {/* Precios y disponibilidad */}
        <View style={styles.bottomRow}>
          <View style={styles.stockContainer}>
            <Text style={[
              styles.stockText,
              product.cantidad_disponible <= 3 && styles.stockTextLow
            ]}>
              {product.cantidad_disponible > 0 
                ? `${product.cantidad_disponible} disponibles`
                : 'Agotado'
              }
            </Text>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.originalPrice}>
                ${formatPrice(product.precio_original)}
              </Text>
            <View style={styles.discountPriceContainer}>
                <Text style={styles.discountPrice}>
                  ${formatPrice(product.precio_descuento)}
                </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: 16,
    ...SHADOWS.md,
  },
  
  // Imagen
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeLogoContainer: {
    position: 'absolute',
    bottom: -20,
    left: 14,
  },
  storeLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.sm,
  },
  storeLogoText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },

  // Info
  infoContainer: {
    padding: 14,
    paddingTop: 24,
    paddingLeft: 68,
  },
  infoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  storeName: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  
  // Pickup
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pickupText: {
    fontSize: 13,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Bottom
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockContainer: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  stockTextLow: {
    color: COLORS.warning,
  },
  
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 13,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountPriceContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default ProductCard;