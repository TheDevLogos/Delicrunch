/**
 * ProductDetailScreen - Pantalla de Detalle de Producto
 * Diseño inspirado en Too Good To Go
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api, { publicApi } from '../services/api';
import logger from '../services/logger';
import ReadOnlyStarRating from '../components/ReadOnlyStarRating';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS, SHADOWS } from '../src/constants/theme';
import { formatPrice, formatNumber } from '../src/utils/format';

const { width } = Dimensions.get('window');

// Helper para formatear calificación de forma segura
const formatRating = (rating) => {
  if (rating === null || rating === undefined || isNaN(rating)) return '4.5';
  return formatNumber(rating, 1);
};

// Componente de reseña individual
const ReviewItem = ({ review }) => (
  <View style={styles.reviewItem}>
    <View style={styles.reviewHeader}>
      <View style={styles.reviewerInfo}>
        <View style={styles.reviewerAvatar}>
          <Text style={styles.reviewerInitial}>
            {review.nombre_usuario?.charAt(0).toUpperCase() || 'A'}
          </Text>
        </View>
        <Text style={styles.reviewAuthor}>{review.nombre_usuario || 'Anónimo'}</Text>
      </View>
      <ReadOnlyStarRating rating={review.calificacion} size={14} />
    </View>
    <Text style={styles.reviewComment}>{review.comentario}</Text>
    <Text style={styles.reviewDate}>
      {new Date(review.created_at).toLocaleDateString('es-MX', { 
        day: 'numeric', month: 'short', year: 'numeric' 
      })}
    </Text>
  </View>
);

// Componente de badge de información
const InfoBadge = ({ icon, text, color = COLORS.primary }) => (
  <View style={[styles.infoBadge, { backgroundColor: color + '15' }]}>
    <Ionicons name={icon} size={16} color={color} />
    <Text style={[styles.infoBadgeText, { color }]}>{text}</Text>
  </View>
);

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const [productResponse, reviewsResponse] = await Promise.all([
          publicApi.get('/products/' + productId),
          publicApi.get('/reviews/' + productId).catch(() => ({ data: [] }))
        ]);
        setProduct(productResponse.data);
        setReviews(reviewsResponse.data || []);
      } catch (error) {
        logger.error(error, 'fetchProductDetails');
        Alert.alert("Error", "No se pudieron cargar los detalles del producto.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  const handlePurchase = () => {
    if (product) {
      navigation.navigate('Payment', { product, quantity });
    }
  };

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= (product?.cantidad_disponible || 1)) {
      setQuantity(newQty);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.textTertiary} />
        <Text style={styles.errorText}>Producto no encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const discount = product.precio_original && product.precio_descuento && Number(product.precio_original) > 0
    ? Math.round(((Number(product.precio_original) - Number(product.precio_descuento)) / Number(product.precio_original)) * 100)
    : 0;
  const savings = formatPrice(Number(product.precio_original || 0) - Number(product.precio_descuento || 0));
  const stockLeft = product.cantidad_disponible || 0;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Image con overlay */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.imagen_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800' }}
          style={styles.heroImage}
        />
        <View style={styles.imageOverlay} />
        
        {/* Navigation buttons */}
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleFavorite}>
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? COLORS.error : COLORS.white} 
            />
          </TouchableOpacity>
        </View>

        {/* Discount badge */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{discount}%</Text>
        </View>

        {/* Stock badge */}
        {stockLeft <= 5 && stockLeft > 0 && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>¡Solo {stockLeft} disponibles!</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Store info */}
        <TouchableOpacity 
          style={styles.storeRow}
          onPress={() => navigation.navigate('StoreProfile', { storeId: product.store_id })}
        >
          <View style={styles.storeLogo}>
            <Text style={styles.storeLogoText}>
              {product.nombre_comercio?.substring(0, 2).toUpperCase() || 'DC'}
            </Text>
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{product.nombre_comercio}</Text>
            <View style={styles.storeRating}>
              <Ionicons name="star" size={14} color={COLORS.star} />
              <Text style={styles.storeRatingText}>
                {formatRating(product.calificacion_promedio)} ({reviews.length} reseñas)
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Product name and description */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.nombre}</Text>
          <Text style={styles.productDescription}>{product.descripcion}</Text>
        </View>

        {/* Info badges */}
        <View style={styles.badgesRow}>
          <InfoBadge icon="leaf" text="Salva comida" color={COLORS.primary} />
          <InfoBadge 
            icon="time-outline" 
            text={(product.hora_recogida_inicio || '14:00') + ' - ' + (product.hora_recogida_fin || '18:00')}
            color={COLORS.info}
          />
        </View>

        {/* Pickup details card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles de recogida</Text>
          
          <View style={styles.cardRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <View style={styles.cardRowContent}>
              <Text style={styles.cardRowLabel}>Horario de recogida</Text>
              <Text style={styles.cardRowValue}>
                Hoy, {product.hora_recogida_inicio || '14:00'} - {product.hora_recogida_fin || '18:00'}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardRow}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <View style={styles.cardRowContent}>
              <Text style={styles.cardRowLabel}>Dirección</Text>
              <Text style={styles.cardRowValue}>{product.direccion || 'Dirección no disponible'}</Text>
            </View>
          </View>
        </View>

        {/* What you could get */}
        {product.tipo_contenido && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>¿Qué podrías recibir?</Text>
            <Text style={styles.cardDescription}>{product.tipo_contenido}</Text>
          </View>
        )}

        {/* Savings impact */}
        <View style={styles.impactCard}>
          <MaterialCommunityIcons name="leaf" size={32} color={COLORS.primary} />
          <View style={styles.impactContent}>
            <Text style={styles.impactTitle}>Tu impacto</Text>
            <Text style={styles.impactText}>
              Al comprar este pack, ahorras ${savings} MXN y evitas ~2.5 kg de CO₂
            </Text>
          </View>
        </View>

        {/* Reviews section */}
        <View style={styles.reviewsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Opiniones ({reviews.length})</Text>
            {reviews.length > 0 && (
              <View style={styles.averageRating}>
                <Ionicons name="star" size={16} color={COLORS.star} />
                <Text style={styles.averageRatingText}>
                  {formatRating(product.calificacion_promedio)}
                </Text>
              </View>
            )}
          </View>

          {reviews.length > 0 ? (
            reviews.slice(0, 3).map(review => (
              <ReviewItem key={review.id} review={review} />
            ))
          ) : (
            <View style={styles.noReviews}>
              <Ionicons name="chatbubble-outline" size={32} color={COLORS.textTertiary} />
              <Text style={styles.noReviewsText}>
                Aún no hay reseñas. ¡Sé el primero en opinar!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom purchase bar */}
      <View style={styles.purchaseBar}>
        <View style={styles.priceSection}>
          <Text style={styles.originalPrice}>${formatPrice(product.precio_original)}</Text>
          <Text style={styles.discountPrice}>${formatPrice(product.precio_descuento)}</Text>
        </View>

        {stockLeft > 1 && (
          <View style={styles.quantitySelector}>
            <TouchableOpacity 
              style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
              onPress={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <Ionicons name="remove" size={20} color={quantity <= 1 ? COLORS.textTertiary : COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity 
              style={[styles.qtyBtn, quantity >= stockLeft && styles.qtyBtnDisabled]}
              onPress={() => handleQuantityChange(1)}
              disabled={quantity >= stockLeft}
            >
              <Ionicons name="add" size={20} color={quantity >= stockLeft ? COLORS.textTertiary : COLORS.text} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.purchaseButton, stockLeft === 0 && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={stockLeft === 0}
        >
          <Text style={styles.purchaseButtonText}>
            {stockLeft === 0 ? 'Agotado' : 'Reservar • $' + formatPrice((Number(product.precio_descuento || 0) * quantity))}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: SPACING.md, fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.xl },
  errorText: { marginTop: SPACING.md, fontSize: TYPOGRAPHY.fontSize.lg, color: COLORS.textSecondary },
  backButton: { marginTop: SPACING.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: BORDERS.radius.md },
  backButtonText: { color: COLORS.white, fontWeight: TYPOGRAPHY.fontWeight.semibold },

  // Hero image
  imageContainer: { height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  headerButtons: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.md },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  discountBadge: { position: 'absolute', top: Platform.OS === 'ios' ? 100 : 90, left: SPACING.md, backgroundColor: COLORS.error, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDERS.radius.sm },
  discountText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.bold },
  stockBadge: { position: 'absolute', bottom: SPACING.md, left: SPACING.md, backgroundColor: COLORS.warning, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDERS.radius.sm },
  stockText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.semibold },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // Store row
  storeRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  storeLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  storeLogoText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold },
  storeInfo: { flex: 1, marginLeft: SPACING.sm },
  storeName: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text },
  storeRating: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  storeRatingText: { marginLeft: 4, fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },

  // Product info
  productInfo: { padding: SPACING.md, backgroundColor: COLORS.surface },
  productName: { fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text, marginBottom: SPACING.sm },
  productDescription: { fontSize: TYPOGRAPHY.fontSize.base, lineHeight: 24, color: COLORS.textSecondary },

  // Badges
  badgesRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, gap: SPACING.sm },
  infoBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDERS.radius.full, gap: 4 },
  infoBadgeText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.medium },

  // Cards
  card: { backgroundColor: COLORS.surface, marginTop: SPACING.sm, padding: SPACING.md },
  cardTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text, marginBottom: SPACING.md },
  cardDescription: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textSecondary, lineHeight: 22 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardRowContent: { flex: 1, marginLeft: SPACING.sm },
  cardRowLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textTertiary },
  cardRowValue: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.text, marginTop: 2 },
  cardDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },

  // Impact card
  impactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primarySoft, margin: SPACING.md, padding: SPACING.md, borderRadius: BORDERS.radius.lg },
  impactContent: { flex: 1, marginLeft: SPACING.sm },
  impactTitle: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary },
  impactText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.primaryDark, marginTop: 2 },

  // Reviews
  reviewsSection: { backgroundColor: COLORS.surface, marginTop: SPACING.sm, padding: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  averageRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  averageRatingText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text },
  reviewItem: { backgroundColor: COLORS.surfaceSecondary, padding: SPACING.md, borderRadius: BORDERS.radius.md, marginBottom: SPACING.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center' },
  reviewerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  reviewerInitial: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.bold },
  reviewAuthor: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text },
  reviewComment: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textSecondary, lineHeight: 22 },
  reviewDate: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textTertiary, marginTop: SPACING.sm },
  noReviews: { alignItems: 'center', padding: SPACING.xl },
  noReviewsText: { marginTop: SPACING.sm, fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textTertiary, textAlign: 'center' },

  // Purchase bar
  purchaseBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOWS.lg },
  priceSection: { marginRight: SPACING.md },
  originalPrice: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textTertiary, textDecorationLine: 'line-through' },
  discountPrice: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceSecondary, borderRadius: BORDERS.radius.md, marginRight: SPACING.md },
  qtyBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  qtyBtnDisabled: { opacity: 0.5 },
  qtyText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text, minWidth: 24, textAlign: 'center' },
  purchaseButton: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: BORDERS.radius.md, alignItems: 'center' },
  purchaseButtonDisabled: { backgroundColor: COLORS.textTertiary },
  purchaseButtonText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold },
});

export default ProductDetailScreen;
