/**
 * StoreReviewsScreen - Pantalla de Reseñas para Comercios
 * Permite a los comercios ver todas las reseñas de su tienda y responder
 */
import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { formatNumber } from '../src/utils/format';

// TGTG Design System
const COLORS = {
  primary: '#036B52',
  primaryDark: '#024A38',
  secondary: '#F5F5F5',
  accent: '#FF6B35',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  star: '#F59E0B',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
};

const StoreReviewsScreen = () => {
  const navigation = useNavigation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    promedio: 0,
    distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  
  // Estado para modal de respuesta
  const [selectedReview, setSelectedReview] = useState(null);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const fetchReviews = async () => {
    let data = [];
    try {
      try {
        const response = await api.get('/reviews/mystore');
        data = response.data || [];
      } catch (err) {
        const url = err.response?.config?.url || '/reviews/mystore';
        const status = err.response?.status;
        if (status === 404) {
          console.warn(`Reviews endpoint not found (404): ${url}`);
          data = [];
        } else {
          console.error('Error al obtener reseñas:', url, status, err.message || err);
          data = [];
        }
      }

      setReviews(data);

      // Calcular estadísticas localmente
      const totalReviews = data?.length || 0;
      if (totalReviews > 0) {
        const sum = data.reduce((acc, r) => acc + (r.calificacion || 0), 0);
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        data.forEach(r => {
          if (dist[r.calificacion] !== undefined) {
            dist[r.calificacion]++;
          }
        });
        setStats({
          total: totalReviews,
          promedio: sum / totalReviews,
          distribucion: dist
        });
      } else {
        setStats({ total: 0, promedio: 0, distribucion: { 5:0,4:0,3:0,2:0,1:0 } });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReviews();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchReviews();
    }, [])
  );

  const renderStars = (rating, size = 16) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={COLORS.star}
        />
      ))}
    </View>
  );

  const renderStatsHeader = () => (
    <View style={styles.statsContainer}>
      {/* Resumen principal */}
      <View style={styles.mainStat}>
        <Text style={styles.mainStatNumber}>{formatNumber(stats.promedio, 1)}</Text>
        {renderStars(Math.round(stats.promedio), 24)}
        <Text style={styles.mainStatLabel}>{stats.total} reseñas</Text>
      </View>
      
      {/* Distribución de estrellas */}
      <View style={styles.distributionContainer}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.distribucion[star] || 0;
          const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
          return (
            <View key={star} style={styles.distributionRow}>
              <Text style={styles.distributionStar}>{star}</Text>
              <Ionicons name="star" size={12} color={COLORS.star} />
              <View style={styles.distributionBarBg}>
                <View 
                  style={[
                    styles.distributionBarFill, 
                    { width: `${percentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.distributionCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderReview = ({ item }) => (
    <TouchableOpacity 
      style={styles.reviewCard}
      onPress={() => openResponseModal(item)}
      activeOpacity={0.8}
    >
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {item.nombre_usuario?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.nombre_usuario || 'Usuario'}</Text>
            <Text style={styles.reviewDate}>
              {new Date(item.created_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
        {renderStars(item.calificacion)}
      </View>

      {/* Producto reseñado */}
      {item.nombre_producto && (
        <View style={styles.productTag}>
          <Ionicons name="pricetag-outline" size={12} color={COLORS.primary} />
          <Text style={styles.productTagText}>{item.nombre_producto}</Text>
        </View>
      )}

      {/* Código de pedido */}
      {item.codigo_recogida && (
        <View style={styles.orderTag}>
          <Ionicons name="receipt-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.orderTagText}>Pedido #{item.codigo_recogida}</Text>
        </View>
      )}

      <Text style={styles.reviewComment}>
        {item.comentario || 'Sin comentario'}
      </Text>

      {/* Respuesta del comercio */}
      {item.respuesta_admin ? (
        <View style={styles.adminResponse}>
          <View style={styles.adminResponseHeader}>
            <Ionicons name="chatbubble-ellipses" size={14} color={COLORS.primary} />
            <Text style={styles.adminResponseLabel}>Tu respuesta</Text>
          </View>
          <Text style={styles.adminResponseText}>{item.respuesta_admin}</Text>
          {item.fecha_respuesta && (
            <Text style={styles.adminResponseDate}>
              {new Date(item.fecha_respuesta).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short'
              })}
            </Text>
          )}
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.respondButton}
          onPress={() => openResponseModal(item)}
        >
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
          <Text style={styles.respondButtonText}>Responder</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
  
  // Funciones para el modal de respuesta
  const openResponseModal = (review) => {
    setSelectedReview(review);
    setResponseText(review.respuesta_admin || '');
    setResponseModalVisible(true);
  };
  
  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      Alert.alert('Error', 'Por favor escribe una respuesta');
      return;
    }
    
    try {
      setSubmittingResponse(true);
      await api.post(`/reviews/mystore/${selectedReview.id}/respond`, {
        respuesta: responseText.trim()
      });
      
      // Actualizar localmente
      const updatedReviews = reviews.map(r => 
        r.id === selectedReview.id 
          ? { ...r, respuesta_admin: responseText.trim(), fecha_respuesta: new Date().toISOString() } 
          : r
      );
      setReviews(updatedReviews);
      setResponseModalVisible(false);
      Alert.alert('¡Listo!', 'Tu respuesta ha sido enviada');
    } catch (error) {
      const url = error.response?.config?.url || (`/reviews/mystore/${selectedReview.id}/respond`);
      const status = error.response?.status;
      console.error('Error al enviar respuesta:', url, status, error.message || error);
      if (status === 404) {
        Alert.alert('Error', 'Endpoint de respuesta no encontrado (404). Contacta al equipo de backend.');
      } else {
        Alert.alert('Error', error.response?.data?.msg || 'No se pudo enviar la respuesta');
      }
    } finally {
      setSubmittingResponse(false);
    }
  };
  
  // Modal de respuesta
  const renderResponseModal = () => (
    <Modal
      visible={responseModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setResponseModalVisible(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedReview?.respuesta_admin ? 'Editar respuesta' : 'Responder reseña'}
            </Text>
            <TouchableOpacity onPress={() => setResponseModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          {/* Reseña original */}
          {selectedReview && (
            <View style={styles.originalReview}>
              <View style={styles.originalReviewHeader}>
                <Text style={styles.originalReviewUser}>{selectedReview.nombre_usuario}</Text>
                {renderStars(selectedReview.calificacion, 14)}
              </View>
              <Text style={styles.originalReviewText} numberOfLines={3}>
                {selectedReview.comentario || 'Sin comentario'}
              </Text>
            </View>
          )}
          
          <TextInput
            style={styles.responseInput}
            placeholder="Escribe tu respuesta..."
            placeholderTextColor={COLORS.textLight}
            value={responseText}
            onChangeText={setResponseText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <TouchableOpacity 
            style={[styles.submitButton, submittingResponse && styles.submitButtonDisabled]}
            onPress={handleSubmitResponse}
            disabled={submittingResponse}
          >
            {submittingResponse ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>Enviar respuesta</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando reseñas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reseñas de Mi Tienda</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id ?? Math.random())}
        renderItem={renderReview}
        ListHeaderComponent={stats.total > 0 ? renderStatsHeader : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textLight} />
            </View>
            <Text style={styles.emptyTitle}>Sin reseñas aún</Text>
            <Text style={styles.emptySubtitle}>
              Cuando tus clientes dejen reseñas, aparecerán aquí
            </Text>
          </View>
        }
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
      />
      
      {/* Modal de respuesta */}
      {renderResponseModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  
  // Stats
  statsContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mainStatNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
  },
  mainStatLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  distributionContainer: {
    gap: SPACING.xs,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  distributionStar: {
    width: 16,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  distributionBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    backgroundColor: COLORS.star,
    borderRadius: 4,
  },
  distributionCount: {
    width: 24,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },

  // Review Card
  reviewCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  productTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  productTagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  orderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  orderTagText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  adminResponse: {
    marginTop: SPACING.md,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: 12,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  adminResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  adminResponseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  adminResponseText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  adminResponseDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  
  // Botón de responder
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  respondButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Modal de respuesta
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  originalReview: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  originalReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  originalReviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  originalReviewText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});

export default StoreReviewsScreen;
