import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import logger from '../services/logger';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';
import { formatPrice } from '../src/utils/format';

// Mapeo de estados
const STATUS_CONFIG = {
  pendiente: { color: '#FF9500', icon: 'time-outline', label: 'Pendiente' },
  confirmado: { color: '#007AFF', icon: 'checkmark-circle-outline', label: 'Confirmado' },
  en_preparacion: { color: '#5856D6', icon: 'restaurant-outline', label: 'Preparando' },
  listo: { color: COLORS.primary, icon: 'bag-check-outline', label: 'Listo para recoger' },
  recogido: { color: '#34C759', icon: 'checkmark-done-circle', label: 'Entregado' },
  entregado: { color: '#34C759', icon: 'checkmark-done-circle', label: 'Entregado' },
  cancelado: { color: '#FF3B30', icon: 'close-circle-outline', label: 'Cancelado' },
};

// Componente de estrellas para calificación
const StarRating = ({ rating, setRating, size = 40, disabled = false }) => (
  <View style={styles.starContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => !disabled && setRating(star)}
        style={styles.starButton}
        disabled={disabled}
      >
        <Ionicons
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={star <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      </TouchableOpacity>
    ))}
  </View>
);

const getRatingLabel = (rating) => {
  const labels = {
    0: 'Toca para calificar',
    1: 'Muy malo',
    2: 'Malo',
    3: 'Regular',
    4: 'Bueno',
    5: '¡Excelente!',
  };
  return labels[rating] || '';
};

const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params || {};

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para reseña
  const [hasReview, setHasReview] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener detalles del pedido
      const orderRes = await api.get(`/orders/${orderId}`);
      const orderData = orderRes.data;
      setOrder(orderData);
      
      console.log('📦 Order Details:', {
        orderId,
        estado: orderData.estado,
        productId: orderData.product_id
      });

      // Verificar si ya existe una reseña para este pedido
      try {
        const reviewsRes = await api.get('/reviews/my');
        const reviews = reviewsRes.data || [];
        console.log('📝 My Reviews:', reviews.length, 'reviews found');
        
        // Buscar review de este pedido específico
        const orderReview = reviews.find(r => {
          const matchesOrderId = r.order_id === orderId || r.order_id === parseInt(orderId);
          console.log(`Checking review ${r.id}: order_id=${r.order_id}, matches=${matchesOrderId}`);
          return matchesOrderId;
        });
        
        if (orderReview) {
          console.log('✅ Found existing review:', orderReview.id);
          setHasReview(true);
          setExistingReview(orderReview);
          setRating(orderReview.calificacion);
          setComment(orderReview.comentario || '');
        } else {
          console.log('❌ No existing review found for order', orderId);
          setHasReview(false);
          setExistingReview(null);
        }
      } catch (e) {
        // Si falla obtener reseñas, no es crítico
        console.log('⚠️ Error loading reviews:', e.message);
        setHasReview(false);
        setExistingReview(null);
      }
    } catch (err) {
      logger.error(err, 'fetchOrderDetails');
      setError('No se pudo cargar el pedido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Calificación requerida', 'Por favor selecciona al menos una estrella.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      console.log('📤 Submitting review:', {
        order_id: orderId,
        product_id: order?.product_id,
        calificacion: rating,
        comentario: comment.trim()
      });
      
      const response = await api.post('/reviews', {
        order_id: orderId,
        product_id: order?.product_id,
        calificacion: rating,
        comentario: comment.trim(),
      });

      console.log('✅ Review submitted successfully:', response.data);

      Alert.alert(
        '¡Gracias por tu opinión!',
        'Tu reseña ayuda a otros usuarios y al comercio a mejorar.',
        [{ text: 'OK', onPress: () => {
          // Actualizar estado local inmediatamente
          setHasReview(true);
          setExistingReview({ 
            calificacion: rating, 
            comentario: comment.trim(),
            id: response.data.id,
            created_at: response.data.created_at
          });
          // Refrescar datos para asegurar sincronización
          fetchOrderDetails();
        }}]
      );
    } catch (err) {
      logger.error(err, 'handleSubmitReview');
      console.error('❌ Error submitting review:', err.response?.data || err.message);
      const msg = err.response?.data?.msg || 'No se pudo enviar la reseña. Intenta de nuevo.';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const openMaps = () => {
    if (!order?.latitud || !order?.longitud) return;
    const lat = parseFloat(order.latitud);
    const lng = parseFloat(order.longitud);
    const label = encodeURIComponent(order.nombre_comercio || 'Tienda');
    
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });
    Linking.openURL(url);
  };

  const callStore = () => {
    if (!order?.telefono) return;
    Linking.openURL(`tel:${order.telefono}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando detalles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>{error || 'Pedido no encontrado'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusKey = order.estado?.toLowerCase() || 'pendiente';
  const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pendiente;
  
  // Verificar si el pedido está en estado que permite reseñar
  const isDeliveredStatus = ['recogido', 'entregado', 'listo'].includes(statusKey);
  const canReview = isDeliveredStatus && !hasReview;
  const showExistingReview = hasReview && existingReview;
  
  console.log('🔍 Review Status:', {
    orderId,
    estado: order.estado,
    statusKey,
    isDeliveredStatus,
    hasReview,
    canReview,
    showExistingReview
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}>
          <View style={[styles.statusIconContainer, { backgroundColor: statusInfo.color + '20' }]}>
            <Ionicons name={statusInfo.icon} size={28} color={statusInfo.color} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
            {order.codigo_recogida && (
              <View style={styles.pickupCodeRow}>
                <Text style={styles.pickupCodeLabel}>Código:</Text>
                <Text style={styles.pickupCode}>{order.codigo_recogida}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Store Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tienda</Text>
          <View style={styles.storeCard}>
            <View style={styles.storeLogo}>
              <Text style={styles.storeLogoText}>
                {order.nombre_comercio?.substring(0, 2).toUpperCase() || 'DC'}
              </Text>
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{order.nombre_comercio || 'Tienda'}</Text>
              <Text style={styles.storeAddress} numberOfLines={2}>
                {order.direccion || 'Dirección no disponible'}
              </Text>
            </View>
            <View style={styles.storeActions}>
              {order.telefono && (
                <TouchableOpacity style={styles.actionButton} onPress={callStore}>
                  <Ionicons name="call-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              {order.latitud && order.longitud && (
                <TouchableOpacity style={styles.actionButton} onPress={openMaps}>
                  <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Producto</Text>
          <View style={styles.productCard}>
            <Image
              source={{ uri: order.imagen_url || 'https://via.placeholder.com/100' }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {order.nombre_producto || 'Surprise Bag'}
              </Text>
              {order.hora_recogida_inicio && order.hora_recogida_fin && (
                <View style={styles.pickupTimeRow}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.pickupTimeText}>
                    Recogida: {order.hora_recogida_inicio} - {order.hora_recogida_fin}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fecha del pedido</Text>
              <Text style={styles.summaryValue}>
                {formatDate(order.fecha_pedido || order.created_at)}
              </Text>
            </View>
            {order.fecha_recogida_real && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fecha de recogida</Text>
                <Text style={styles.summaryValue}>{formatDate(order.fecha_recogida_real)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${formatPrice(order.subtotal || order.total)}</Text>
            </View>
            {order.comision_plataforma > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Comisión servicio</Text>
                <Text style={styles.summaryValue}>Incluida</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total pagado</Text>
              <Text style={styles.totalValue}>${formatPrice(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Review Section */}
        {(canReview || showExistingReview) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {showExistingReview ? 'Tu Reseña' : '¿Cómo estuvo tu experiencia?'}
            </Text>
            
            <View style={styles.reviewCard}>
              {showExistingReview ? (
                // Mostrar reseña existente
                <>
                  <View style={styles.existingReviewHeader}>
                    <StarRating rating={existingReview.calificacion} setRating={() => {}} size={24} disabled />
                    <View style={styles.reviewedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.reviewedText}>Reseña enviada</Text>
                    </View>
                  </View>
                  {existingReview.comentario && (
                    <Text style={styles.existingComment}>"{existingReview.comentario}"</Text>
                  )}
                  {existingReview.respuesta_admin && (
                    <View style={styles.storeResponse}>
                      <View style={styles.responseHeader}>
                        <Ionicons name="chatbubble-ellipses" size={14} color={COLORS.primary} />
                        <Text style={styles.responseLabel}>Respuesta del comercio</Text>
                      </View>
                      <Text style={styles.responseText}>{existingReview.respuesta_admin}</Text>
                    </View>
                  )}
                </>
              ) : (
                // Formulario para nueva reseña
                <>
                  <Text style={styles.reviewPrompt}>Tu opinión ayuda a otros usuarios</Text>
                  <StarRating rating={rating} setRating={setRating} />
                  <Text style={[
                    styles.ratingLabel,
                    rating > 0 && { color: rating >= 4 ? '#34C759' : rating >= 3 ? '#F59E0B' : '#FF3B30' }
                  ]}>
                    {getRatingLabel(rating)}
                  </Text>

                  <View style={styles.commentContainer}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Cuéntanos más sobre tu experiencia (opcional)"
                      placeholderTextColor={COLORS.textLight}
                      value={comment}
                      onChangeText={setComment}
                      multiline
                      numberOfLines={4}
                      maxLength={500}
                      textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{comment.length}/500</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (isSubmittingReview || rating === 0) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmitReview}
                    disabled={isSubmittingReview || rating === 0}
                  >
                    {isSubmittingReview ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.submitButtonText}>Enviar Reseña</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Ionicons name="help-circle-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.helpText}>
            ¿Tienes algún problema con este pedido?
          </Text>
          <TouchableOpacity>
            <Text style={styles.helpLink}>Contactar soporte</Text>
          </TouchableOpacity>
        </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  backLink: {
    marginTop: 12,
  },
  backLinkText: {
    color: COLORS.primary,
    fontWeight: '500',
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },

  // Status Card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  pickupCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pickupCodeLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  pickupCode: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Sections
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Store Card
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.sm,
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeLogoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  storeAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  storeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft || '#E8F5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Product Card
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    ...SHADOWS.sm,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  pickupTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  pickupTimeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Review Card
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    ...SHADOWS.sm,
  },
  reviewPrompt: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  commentContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 100,
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: COLORS.textLight,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Existing Review
  existingReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewedText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  existingComment: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  storeResponse: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.primarySoft || '#E8F5F0',
    borderRadius: 8,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  responseText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },

  // Help Section
  helpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  helpText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  helpLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default OrderDetailScreen;
