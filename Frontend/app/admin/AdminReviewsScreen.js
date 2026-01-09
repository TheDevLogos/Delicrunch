/**
 * AdminReviewsScreen - Gestión de Reviews y Quejas
 * Ver y responder a comentarios, gestionar quejas de usuarios
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SPACING, SHADOWS } from '../../src/constants/theme';
import { formatNumber } from '../../src/utils/format';

const { width } = Dimensions.get('window');

const AdminReviewsScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // all, pending, complaints, positive
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      
      // Cargar todas las reviews del sistema usando el endpoint de admin
      let allReviews = [];
      try {
        const response = await api.get('/reviews/admin/all');
        allReviews = response.data.reviews || [];
      } catch (e) {
        console.log('Error cargando reviews:', e);
        // Datos de demostración si no hay endpoint
        allReviews = generateDemoReviews();
      }

      // Enriquecer con información adicional
      const enrichedReviews = allReviews.map(review => ({
        ...review,
        tipo: categorizeReview(review),
        estado: review.estado || 'activo',
        respuesta_admin: review.respuesta_admin || null,
      }));

      setReviews(enrichedReviews);
      applyFilters(enrichedReviews, activeFilter);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const generateDemoReviews = () => {
    return [
      {
        id: 1,
        usuario_nombre: 'María García',
        producto_nombre: 'Pack Sorpresa Panadería',
        comercio_nombre: 'La Casa del Pan',
        rating: 5,
        comentario: '¡Excelente! Recibí pan recién horneado a un precio increíble.',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        usuario_nombre: 'Carlos López',
        producto_nombre: 'Pack Mix Frutas',
        comercio_nombre: 'Frutería El Sol',
        rating: 2,
        comentario: 'Algunas frutas estaban muy maduras, casi pasadas. Esperaba mejor calidad.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        usuario_nombre: 'Ana Martínez',
        producto_nombre: 'Pack Desayuno',
        comercio_nombre: 'Café Express',
        rating: 4,
        comentario: 'Muy bueno, solo faltó variedad en el pack.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 4,
        usuario_nombre: 'Roberto Sánchez',
        producto_nombre: 'Pack Vegetariano',
        comercio_nombre: 'Green Market',
        rating: 1,
        comentario: 'El comercio no entregó el pedido. Muy mala experiencia.',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        es_queja: true,
      },
    ];
  };

  const categorizeReview = (review) => {
    const rating = review.calificacion || review.rating || 0;
    if (review.es_queja || rating === 1) return 'queja';
    if (rating <= 2) return 'negativo';
    if (rating >= 4) return 'positivo';
    return 'neutral';
  };

  const applyFilters = (reviewsList, filter) => {
    let result = [...reviewsList];

    switch (filter) {
      case 'pending':
        result = result.filter(r => !r.respuesta_admin);
        break;
      case 'complaints':
        result = result.filter(r => r.tipo === 'queja' || (r.calificacion || r.rating) <= 2);
        break;
      case 'positive':
        result = result.filter(r => (r.calificacion || r.rating) >= 4);
        break;
    }

    // Ordenar por fecha más reciente
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setFilteredReviews(result);
  };

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReviews();
  }, []);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilters(reviews, filter);
  };

  const openReviewModal = (review) => {
    setSelectedReview(review);
    setResponseText(review.respuesta_admin || '');
    setModalVisible(true);
  };

  const handleSendResponse = async () => {
    if (!responseText.trim()) {
      Alert.alert('Error', 'Por favor escribe una respuesta');
      return;
    }

    try {
      setActionLoading(true);
      
      // Usar el endpoint correcto de admin para responder
      await api.post(`/reviews/admin/${selectedReview.id}/respond`, {
        respuesta: responseText.trim(),
      });

      // Actualizar localmente
      const updatedReviews = reviews.map(r =>
        r.id === selectedReview.id ? { ...r, respuesta_admin: responseText } : r
      );
      setReviews(updatedReviews);
      applyFilters(updatedReviews, activeFilter);
      
      setModalVisible(false);
      Alert.alert('Éxito', 'Respuesta enviada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la respuesta');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    Alert.alert(
      'Eliminar Review',
      '¿Estás seguro de que deseas eliminar esta review? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              // Usar el endpoint correcto para eliminar
              await api.delete(`/reviews/${reviewId}`);

              const updatedReviews = reviews.filter(r => r.id !== reviewId);
              setReviews(updatedReviews);
              applyFilters(updatedReviews, activeFilter);
              setModalVisible(false);
              Alert.alert('Éxito', 'Review eliminada');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la review');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const filterTabs = [
    { id: 'all', label: 'Todas', count: reviews.length, icon: 'chatbubbles' },
    { id: 'pending', label: 'Sin responder', count: reviews.filter(r => !r.respuesta_admin).length, icon: 'time' },
    { id: 'complaints', label: 'Quejas', count: reviews.filter(r => r.tipo === 'queja' || (r.calificacion || r.rating) <= 2).length, icon: 'warning' },
    { id: 'positive', label: 'Positivas', count: reviews.filter(r => (r.calificacion || r.rating) >= 4).length, icon: 'happy' },
  ];

  const getReviewBadge = (review) => {
    const rating = review.calificacion || review.rating || 0;
    if (review.tipo === 'queja' || rating === 1) {
      return { icon: 'warning', color: '#FF3B30', bg: '#FFEBEE', label: 'Queja' };
    }
    if (rating <= 2) {
      return { icon: 'sad', color: '#FF9500', bg: '#FFF3E0', label: 'Negativo' };
    }
    if (rating >= 4) {
      return { icon: 'happy', color: '#34C759', bg: '#E8F5E9', label: 'Positivo' };
    }
    return { icon: 'remove', color: '#666', bg: '#f5f5f5', label: 'Neutral' };
  };

  const renderStars = (rating, size = 14) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? '#FFD700' : '#ddd'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  const renderReviewCard = (review) => {
    const badge = getReviewBadge(review);
    
    return (
      <TouchableOpacity
        key={review.id}
        style={styles.reviewCard}
        onPress={() => openReviewModal(review)}
        activeOpacity={0.7}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={18} color="#666" />
            </View>
            <View>
              <Text style={styles.userName}>{review.usuario_nombre}</Text>
              <Text style={styles.reviewDate}>
                {new Date(review.created_at).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
          
          <View style={[styles.reviewBadge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.icon} size={12} color={badge.color} />
            <Text style={[styles.reviewBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.reviewProduct}>
          <Ionicons name="fast-food-outline" size={14} color="#666" />
          <Text style={styles.productName} numberOfLines={1}>
            {review.nombre_producto || review.producto_nombre}
          </Text>
          <Text style={styles.storeName}>• {review.nombre_comercio || review.comercio_nombre}</Text>
        </View>

        <View style={styles.ratingRow}>
          {renderStars(review.calificacion || review.rating)}
          <Text style={styles.ratingText}>{review.calificacion || review.rating}/5</Text>
        </View>

        <Text style={styles.reviewComment} numberOfLines={2}>
          {review.comentario}
        </Text>

        {review.respuesta_admin && (
          <View style={styles.responsePreview}>
            <Ionicons name="chatbubble-ellipses" size={12} color={COLORS.primary} />
            <Text style={styles.responsePreviewText} numberOfLines={1}>
              Respondido: {review.respuesta_admin}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Reviews</Text>
        <Text style={styles.headerSubtitle}>{reviews.length} reviews totales</Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.statValue}>
            {reviews.length > 0 
                ? formatNumber((reviews.reduce((sum, r) => sum + (r.calificacion || r.rating || 0), 0) / reviews.length), 1)
                : '---'
              }
          </Text>
          <Text style={styles.statLabel}>Promedio</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="warning" size={20} color="#FF3B30" />
          <Text style={styles.statValue}>
            {reviews.filter(r => (r.calificacion || r.rating) <= 2).length}
          </Text>
          <Text style={styles.statLabel}>Quejas</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={20} color="#FF9500" />
          <Text style={styles.statValue}>
            {reviews.filter(r => !r.respuesta_admin).length}
          </Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.filterTab,
              activeFilter === tab.id && styles.filterTabActive
            ]}
            onPress={() => handleFilterChange(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={16} 
              color={activeFilter === tab.id ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.filterTabText,
              activeFilter === tab.id && styles.filterTabTextActive
            ]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reviews List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {filteredReviews.length > 0 ? (
          filteredReviews.map(renderReviewCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No hay reviews</Text>
            <Text style={styles.emptySubtext}>
              No se encontraron reviews en esta categoría
            </Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Review Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedReview && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detalle de Review</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* User & Rating */}
                  <View style={styles.modalUserSection}>
                    <View style={styles.modalAvatar}>
                      <Ionicons name="person" size={24} color="#666" />
                    </View>
                    <View style={styles.modalUserInfo}>
                      <Text style={styles.modalUserName}>{selectedReview.usuario_nombre}</Text>
                      <Text style={styles.modalDate}>
                        {new Date(selectedReview.created_at).toLocaleDateString('es-MX', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={styles.modalRating}>
                      {renderStars(selectedReview.calificacion || selectedReview.rating, 18)}
                    </View>
                  </View>

                  {/* Product Info */}
                  <View style={styles.modalProductSection}>
                    <Text style={styles.modalSectionTitle}>Producto</Text>
                    <Text style={styles.modalProductName}>{selectedReview.nombre_producto || selectedReview.producto_nombre}</Text>
                    <Text style={styles.modalStoreName}>{selectedReview.nombre_comercio || selectedReview.comercio_nombre}</Text>
                  </View>

                  {/* Comment */}
                  <View style={styles.modalCommentSection}>
                    <Text style={styles.modalSectionTitle}>Comentario</Text>
                    <Text style={styles.modalComment}>{selectedReview.comentario}</Text>
                  </View>

                  {/* Response Section */}
                  <View style={styles.modalResponseSection}>
                    <Text style={styles.modalSectionTitle}>
                      {selectedReview.respuesta_admin ? 'Respuesta enviada' : 'Responder al usuario'}
                    </Text>
                    
                    <TextInput
                      style={styles.responseInput}
                      placeholder="Escribe tu respuesta aquí..."
                      value={responseText}
                      onChangeText={setResponseText}
                      multiline
                      numberOfLines={4}
                      placeholderTextColor="#999"
                    />

                    <View style={styles.quickResponses}>
                      <Text style={styles.quickResponseTitle}>Respuestas rápidas:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[
                          '¡Gracias por tu comentario! 🙏',
                          'Lamentamos tu experiencia. Te contactaremos.',
                          'Estamos trabajando para mejorar.',
                          'Tu feedback es muy valioso.',
                        ].map((quick, i) => (
                          <TouchableOpacity
                            key={i}
                            style={styles.quickResponseChip}
                            onPress={() => setResponseText(quick)}
                          >
                            <Text style={styles.quickResponseText}>{quick}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </ScrollView>

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteReview(selectedReview.id)}
                    disabled={actionLoading}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.sendButton, !responseText.trim() && styles.sendButtonDisabled]}
                    onPress={handleSendResponse}
                    disabled={actionLoading || !responseText.trim()}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="#fff" />
                        <Text style={styles.sendButtonText}>Enviar Respuesta</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },

  // Filters
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  filterTabTextActive: {
    color: '#fff',
  },

  // List
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Review Card
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  reviewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  storeName: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  responsePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  responsePreviewText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 6,
    flex: 1,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
  },
  modalUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  modalRating: {
    alignItems: 'flex-end',
  },
  modalProductSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalStoreName: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  modalCommentSection: {
    marginBottom: 20,
  },
  modalComment: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  modalResponseSection: {
    marginBottom: 16,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  quickResponses: {
    marginTop: 8,
  },
  quickResponseTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  quickResponseChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickResponseText: {
    fontSize: 12,
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AdminReviewsScreen;
