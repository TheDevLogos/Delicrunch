import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import logger from '../services/logger';
import { formatPrice } from '../src/utils/format';

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
  inputBg: '#F9FAFB',
  info: '#3B82F6',
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

const EditProductScreen = ({ route, navigation }) => {
  const { productId } = route.params;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioOriginal, setPrecioOriginal] = useState('');
  const [precioDescuento, setPrecioDescuento] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [image, setImage] = useState(null); // Para la nueva imagen seleccionada
  const [existingImageUrl, setExistingImageUrl] = useState(null); // Para la imagen actual

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Cargar los datos del producto al iniciar la pantalla
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${productId}`);
        const product = response.data;
        setNombre(product.nombre);
        setDescripcion(product.descripcion);
        setPrecioOriginal(String(product.precio_original));
        setPrecioDescuento(String(product.precio_descuento));
        setCantidad(String(product.cantidad_inicial));
        setHoraInicio(product.hora_recogida_inicio);
        setHoraFin(product.hora_recogida_fin);
        setExistingImageUrl(product.imagen_url);
      } catch (error) {
        logger.error(error, 'fetchProduct for editing');
        Alert.alert('Error', 'No se pudieron cargar los datos del producto.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar la imagen.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 2. Guardar los cambios
  const handleUpdateProduct = async () => {
    // ... (validaciones similares a AddProductScreen)
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion);
      formData.append('precio_original', parseFloat(precioOriginal));
      formData.append('precio_descuento', parseFloat(precioDescuento));
      // El backend espera 'cantidad_disponible' en la ruta PUT
      formData.append('cantidad_disponible', parseInt(cantidad, 10));
      // Mantener 'cantidad_inicial' si se necesita en otros endpoints
      formData.append('cantidad_inicial', parseInt(cantidad, 10));
      formData.append('hora_recogida_inicio', horaInicio);
      formData.append('hora_recogida_fin', horaFin);

      // Si se seleccionó una nueva imagen, la añadimos
      if (image) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('imagen', { uri: image, name: filename, type });
      } else {
        // Si no se selecciona una nueva imagen, enviamos la URL existente para que el backend no la borre.
        formData.append('imagen_url', existingImageUrl);
      }

      // Usamos el método PUT para actualizar el producto
      await api.put(`/products/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Éxito', 'El producto ha sido actualizado.');
      navigation.goBack();
    } catch (error) {
      logger.error(error, 'handleUpdateProduct');
      Alert.alert('Error', 'No se pudo actualizar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Eliminar el producto
  const handleDeleteProduct = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/products/${productId}`);
      Alert.alert('Éxito', 'El producto ha sido eliminado.');
      navigation.goBack();
    } catch (error) {
      logger.error(error, 'handleDeleteProduct');
      Alert.alert('Error', 'No se pudo eliminar el producto.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Alerta de confirmación para evitar borrados accidentales
  const confirmDelete = () => {
    Alert.alert(
      "Confirmar Eliminación",
      "¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", onPress: handleDeleteProduct, style: "destructive" }
      ],
      { cancelable: true }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  const discount = precioOriginal && precioDescuento && parseFloat(precioOriginal) > 0
    ? Math.round((1 - parseFloat(precioDescuento) / parseFloat(precioOriginal)) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Producto</Text>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={confirmDelete}
        >
          <Ionicons name="trash-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview de Imagen */}
          <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
            <Image
              source={{ uri: image || existingImageUrl || 'https://via.placeholder.com/400' }}
              style={styles.imagePreview}
            />
            <View style={styles.imageOverlay}>
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={24} color={COLORS.background} />
              </View>
              <Text style={styles.changeImageText}>Cambiar imagen</Text>
            </View>
            {discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discount}%</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Formulario */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información del Pack</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre del Pack</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="pricetag-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej: Pack Sorpresa"
                  placeholderTextColor={COLORS.textLight}
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripción</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Describe qué incluye el pack..."
                  placeholderTextColor={COLORS.textLight}
                  value={descripcion}
                  onChangeText={setDescripcion}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Precios */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Precios</Text>
            
            <View style={styles.priceRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                <Text style={styles.inputLabel}>Precio Original</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textLight}
                    value={precioOriginal}
                    onChangeText={setPrecioOriginal}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                <Text style={styles.inputLabel}>Precio Descuento</Text>
                <View style={[styles.inputContainer, { borderColor: COLORS.primary }]}>
                  <Text style={[styles.currencySymbol, { color: COLORS.primary }]}>$</Text>
                  <TextInput
                    style={[styles.textInput, { color: COLORS.primary, fontWeight: '700' }]}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textLight}
                    value={precioDescuento}
                    onChangeText={setPrecioDescuento}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {discount > 0 && (
              <View style={styles.savingsCard}>
                <Ionicons name="trending-down" size={20} color={COLORS.success} />
                <Text style={styles.savingsText}>
                  Los clientes ahorran {discount}% (${formatPrice((parseFloat(precioOriginal || 0) - parseFloat(precioDescuento || 0)))})
                </Text>
              </View>
            )}
          </View>

          {/* Disponibilidad */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Disponibilidad</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cantidad de Packs</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cube-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej: 10"
                  placeholderTextColor={COLORS.textLight}
                  value={cantidad}
                  onChangeText={setCantidad}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.timeRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                <Text style={styles.inputLabel}>Hora Inicio</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="14:00"
                    placeholderTextColor={COLORS.textLight}
                    value={horaInicio}
                    onChangeText={setHoraInicio}
                  />
                </View>
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                <Text style={styles.inputLabel}>Hora Fin</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="18:00"
                    placeholderTextColor={COLORS.textLight}
                    value={horaFin}
                    onChangeText={setHoraFin}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              Los cambios se aplicarán inmediatamente y estarán visibles para todos los usuarios.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer con botón de guardar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleUpdateProduct}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={COLORS.background} style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const COLORS_INFO = '#3B82F6';

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
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
  },
  imagePickerContainer: {
    position: 'relative',
    margin: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.surface,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  cameraIcon: {
    marginRight: SPACING.sm,
  },
  changeImageText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '600',
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  discountText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
  formSection: {
    margin: SPACING.md,
    marginTop: 0,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  textAreaContainer: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  priceRow: {
    flexDirection: 'row',
  },
  timeRow: {
    flexDirection: 'row',
  },
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}15`,
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  savingsText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.md,
    marginTop: 0,
    backgroundColor: `${COLORS_INFO}10`,
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textLight,
  },
});

export default EditProductScreen;