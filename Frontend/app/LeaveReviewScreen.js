import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import logger from '../services/logger';

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

// Componente para la selección de estrellas
const StarRating = ({ rating, setRating, size = 48, disabled = false }) => {
  return (
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
            color={star <= rating ? COLORS.star : COLORS.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Etiquetas de calificación
const getRatingLabel = (rating) => {
  const labels = {
    0: 'Selecciona tu calificación',
    1: 'Muy malo',
    2: 'Malo',
    3: 'Regular',
    4: 'Bueno',
    5: 'Excelente',
  };
  return labels[rating] || '';
};

const LeaveReviewScreen = ({ route, navigation }) => {
  const { orderId, productId, storeName, productName } = route.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      if (orderId) {
        const response = await api.get(`/orders/${orderId}`);
        setOrderDetails(response.data);
      }
    } catch (error) {
      logger.error(error, 'fetchOrderDetails');
    } finally {
      setLoading(false);
    }
  };

  // Solicitar permisos y seleccionar imagen
  const pickImage = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tu galería para subir fotos.',
          [{ text: 'Entendido' }]
        );
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Limitar a 3 imágenes máximo
        if (images.length >= 3) {
          Alert.alert(
            'Límite alcanzado',
            'Puedes subir máximo 3 fotos por reseña.',
            [{ text: 'Entendido' }]
          );
          return;
        }

        setImages([...images, { uri: selectedImage.uri, uploaded: false }]);
      }
    } catch (error) {
      logger.error(error, 'pickImage');
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  // Tomar foto con la cámara
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tu cámara para tomar fotos.',
          [{ text: 'Entendido' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        
        if (images.length >= 3) {
          Alert.alert(
            'Límite alcanzado',
            'Puedes subir máximo 3 fotos por reseña.',
            [{ text: 'Entendido' }]
          );
          return;
        }

        setImages([...images, { uri: photo.uri, uploaded: false }]);
      }
    } catch (error) {
      logger.error(error, 'takePhoto');
      Alert.alert('Error', 'No se pudo tomar la foto.');
    }
  };

  // Mostrar opciones de imagen
  const showImageOptions = () => {
    Alert.alert(
      'Agregar foto',
      'Elige una opción',
      [
        { text: 'Tomar foto', onPress: takePhoto },
        { text: 'Elegir de galería', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Eliminar imagen
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert(
        'Calificación Requerida', 
        'Por favor, selecciona al menos una estrella para continuar.',
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Preparar FormData para enviar con imágenes
      const formData = new FormData();
      formData.append('producto_id', productId);
      formData.append('pedido_id', orderId);
      formData.append('calificacion', rating);
      formData.append('comentario', comment.trim());

      // Agregar imágenes si las hay
      if (images.length > 0) {
        images.forEach((image, index) => {
          const uriParts = image.uri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          formData.append('images', {
            uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
            name: `review_${Date.now()}_${index}.${fileType}`,
            type: `image/${fileType}`,
          });
        });
      }

      // Enviar review con imágenes
      await api.post('/reviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert(
        '¡Gracias por tu opinión!', 
        'Tu reseña ayuda a otros usuarios a tomar mejores decisiones.',
        [{ 
          text: 'Continuar', 
          onPress: () => navigation.goBack() 
        }]
      );

    } catch (error) {
      logger.error(error, 'handleSubmitReview');
      const errorMessage = error.response?.data?.msg || 
        'No se pudo enviar tu reseña. Es posible que ya hayas dejado una para este pedido.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayStoreName = storeName || orderDetails?.tienda_nombre || 'la tienda';
  const displayProductName = productName || orderDetails?.producto_nombre || 'el producto';

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
        <Text style={styles.headerTitle}>Dejar Reseña</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.storeIcon}>
                <Ionicons name="storefront" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tu experiencia en</Text>
                <Text style={styles.storeName}>{displayStoreName}</Text>
                {displayProductName && (
                  <Text style={styles.productName}>{displayProductName}</Text>
                )}
              </View>
            </View>

            {/* Rating Section */}
            <View style={styles.ratingSection}>
              <Text style={styles.sectionTitle}>¿Cómo calificarías tu experiencia?</Text>
              <StarRating rating={rating} setRating={setRating} />
              <Text style={[
                styles.ratingLabel,
                rating > 0 && { color: rating >= 4 ? COLORS.success : rating >= 3 ? COLORS.warning : COLORS.error }
              ]}>
                {getRatingLabel(rating)}
              </Text>
            </View>

            {/* Comment Section */}
            <View style={styles.commentSection}>
              <Text style={styles.sectionTitle}>Cuéntanos más (opcional)</Text>
              <Text style={styles.sectionSubtitle}>
                Tu opinión ayuda a otros usuarios y a la tienda a mejorar
              </Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="¿Qué te gustó? ¿Qué podría mejorar?"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={5}
                  maxLength={500}
                  placeholderTextColor={COLORS.textLight}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>
                  {comment.length}/500
                </Text>
              </View>
            </View>

            {/* Photo Section */}
            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>Agrega fotos (opcional)</Text>
              <Text style={styles.sectionSubtitle}>
                Las fotos ayudan a otros usuarios a ver el producto
              </Text>
              
              <View style={styles.imagesContainer}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {images.length < 3 && (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={showImageOptions}
                    disabled={uploadingImages}
                  >
                    {uploadingImages ? (
                      <ActivityIndicator color={COLORS.primary} />
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
                        <Text style={styles.addPhotoText}>Agregar foto</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              
              {images.length > 0 && (
                <Text style={styles.photoHint}>
                  {images.length}/3 fotos • Puedes agregar hasta 3 fotos
                </Text>
              )}
            </View>

            {/* Tips */}
            <View style={styles.tipsCard}>
              <View style={styles.tipHeader}>
                <Ionicons name="bulb-outline" size={20} color={COLORS.warning} />
                <Text style={styles.tipTitle}>Consejos para una buena reseña</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Sé específico sobre lo que te gustó o no</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Comenta sobre la calidad y frescura</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Menciona si el valor fue adecuado</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Submit Button */}
      {!loading && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || rating === 0) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitReview}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <>
                <Ionicons name="send" size={20} color={COLORS.background} style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Enviar Reseña</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 120, // Aumentado para dar espacio al botón fijo
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  storeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  productName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
    lineHeight: 20,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  starButton: {
    padding: SPACING.xs,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  commentSection: {
    marginBottom: SPACING.lg,
  },
  textAreaContainer: {
    position: 'relative',
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  charCount: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.md,
    fontSize: 12,
    color: COLORS.textLight,
  },
  photoSection: {
    marginBottom: SPACING.lg,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    ...SHADOWS.md,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  photoHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: `${COLORS.warning}10`,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.warning}30`,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.sm,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.warning,
    marginRight: SPACING.sm,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  footer: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textLight,
    ...SHADOWS.sm,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
});

export default LeaveReviewScreen;