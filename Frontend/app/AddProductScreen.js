import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import logger from '../services/logger';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';
import { BUSINESS_CATEGORIES, getCategoryLabels } from '../src/constants/categories';
import { calculateCO2Saved } from '../src/constants/co2Factors';

const AddProductScreen = ({ navigation }) => {
  const [nombre, setNombre] = useState('Pack Sorpresa');
  const [descripcion, setDescripcion] = useState('');
  const [precioOriginal, setPrecioOriginal] = useState('');
  const [precioDescuento, setPrecioDescuento] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productoListo, setProductoListo] = useState(false);
  const [categoria, setCategoria] = useState('Otros');
  
  // Estados para modales
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Opciones de horarios
  const timeOptions = [
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
    '23:00', '23:30', '00:00', 
  ];

  const selectStartTime = (time) => {
    setHoraInicio(time);
    setShowStartTimePicker(false);
  };
  
  const selectEndTime = (time) => {
    setHoraFin(time);
    setShowEndTimePicker(false);
  };

  const discount = precioOriginal && precioDescuento && parseFloat(precioOriginal) > 0
    ? Math.round((1 - parseFloat(precioDescuento) / parseFloat(precioOriginal)) * 100)
    : 0;

  // Calcular CO2 estimado según categoría y cantidad
  const estimatedCO2 = cantidad && parseInt(cantidad) > 0
    ? calculateCO2Saved(categoria, parseInt(cantidad))
    : 0;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para seleccionar una imagen.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleAddProduct = async () => {
    if (!nombre || !precioOriginal || !precioDescuento || !cantidad) {
      Alert.alert('Campos Incompletos', 'Por favor, complete nombre, precios y cantidad.');
      return;
    }

    const original = parseFloat(precioOriginal);
    const discountPrice = parseFloat(precioDescuento);

    if (isNaN(original) || isNaN(discountPrice)) {
      Alert.alert('Error de Formato', 'Los precios deben ser números válidos.');
      return;
    }

    if (discountPrice >= original) {
      Alert.alert('Error en Precios', 'El precio con descuento debe ser menor que el precio original.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion || '');
      formData.append('precio_original', original);
      formData.append('precio_descuento', discountPrice);
      formData.append('cantidad_disponible', parseInt(cantidad, 10));
      formData.append('cantidad_maxima_diaria', parseInt(cantidad, 10));
      formData.append('categoria', categoria);
      formData.append('hora_recogida_inicio', horaInicio || '14:00');
      formData.append('hora_recogida_fin', horaFin || '18:00');
      formData.append('producto_listo', productoListo);

      if (image) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('imagen', { uri: image, name: filename, type });
      }

      await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('¡Publicado!', 'Tu pack está ahora disponible para los usuarios.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      logger.error(error, 'handleAddProduct');
      Alert.alert('Error', 'No se pudo añadir el producto. Revisa los datos introducidos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Pack</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Selector de imagen - estilo TGTG */}
          <TouchableOpacity 
            style={styles.imageSelector}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {image ? (
              <>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={24} color={COLORS.white} />
                  <Text style={styles.changeImageText}>Cambiar imagen</Text>
                </View>
                {discount > 0 && (
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>-{discount}%</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.cameraIconContainer}>
                  <Ionicons name="camera-outline" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.imagePlaceholderText}>Añadir foto del pack</Text>
                <Text style={styles.imagePlaceholderSubtext}>
                  Una buena foto aumenta las ventas
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Formulario */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información del Pack</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej: Pack Sorpresa de Panadería"
                placeholderTextColor={COLORS.textLight}
                value={nombre}
                onChangeText={setNombre}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe qué puede incluir tu pack..."
                placeholderTextColor={COLORS.textLight}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Selector de Categoría */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Categoría del Producto</Text>
              <TouchableOpacity 
                style={styles.timeSelector}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Ionicons name="restaurant-outline" size={18} color={COLORS.textLight} />
                <Text style={styles.timeSelectorText}>
                  {categoria}
                </Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {/* Indicador de CO2 estimado */}
            {estimatedCO2 > 0 && (
              <View style={styles.co2Preview}>
                <Ionicons name="leaf" size={18} color={COLORS.success} />
                <Text style={styles.co2PreviewText}>
                  ~{estimatedCO2.toFixed(1)} kg CO₂ evitados con este pack
                </Text>
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Precios</Text>
            
            <View style={styles.priceRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Precio Original</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="85.00"
                    placeholderTextColor={COLORS.textLight}
                    value={precioOriginal}
                    onChangeText={setPrecioOriginal}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Precio Pack</Text>
                <View style={[styles.priceInputWrapper, styles.discountPriceWrapper]}>
                  <Text style={[styles.currencySymbol, { color: COLORS.primary }]}>$</Text>
                  <TextInput
                    style={[styles.priceInput, { color: COLORS.primary }]}
                    placeholder="45.00"
                    placeholderTextColor={COLORS.textLight}
                    value={precioDescuento}
                    onChangeText={setPrecioDescuento}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {discount > 0 && (
              <View style={styles.discountPreview}>
                <Ionicons name="pricetag" size={18} color={COLORS.accent} />
                <Text style={styles.discountPreviewText}>
                  ¡Tus clientes ahorrarán un {discount}%!
                </Text>
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Disponibilidad</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Cantidad de Packs</Text>
              <TextInput
                style={styles.textInput}
                placeholder="¿Cuántos packs tienes hoy?"
                placeholderTextColor={COLORS.textLight}
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.priceRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Desde</Text>
                <TouchableOpacity 
                  style={styles.timeSelector}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={18} color={COLORS.textLight} />
                  <Text style={[styles.timeSelectorText, !horaInicio && { color: COLORS.textLight }]}>
                    {horaInicio || '19:00'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Hasta</Text>
                <TouchableOpacity 
                  style={styles.timeSelector}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={18} color={COLORS.textLight} />
                  <Text style={[styles.timeSelectorText, !horaFin && { color: COLORS.textLight }]}>
                    {horaFin || '20:00'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Producto Listo */}
          <View style={styles.formSection}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setProductoListo(!productoListo)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, productoListo && styles.checkboxChecked]}>
                {productoListo && <Ionicons name="checkmark" size={18} color={COLORS.white} />}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.checkboxLabel}>Producto ya Listo</Text>
                <Text style={styles.checkboxDescription}>
                  Marca esto si el pack ya está preparado y listo para recoger. 
                  Aparecerá en la sección "Ahorra antes de que sea tarde"
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Botón publicar */}
          <TouchableOpacity 
            style={[
              styles.publishButton,
              isSubmitting && styles.publishButtonDisabled
            ]}
            onPress={handleAddProduct}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <Text style={styles.publishButtonText}>Publicando...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                <Text style={styles.publishButtonText}>Publicar Pack</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Modal selector de hora inicio */}
      <Modal
        visible={showStartTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStartTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerHeader}>
              <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                <Text style={styles.timePickerCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>Hora de inicio</Text>
              <View style={{ width: 60 }} />
            </View>
            <ScrollView style={styles.timePickerList}>
              {timeOptions.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeOption, horaInicio === time && styles.timeOptionSelected]}
                  onPress={() => selectStartTime(time)}
                >
                  <Text style={[styles.timeOptionText, horaInicio === time && styles.timeOptionTextSelected]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Modal selector de hora fin */}
      <Modal
        visible={showEndTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerHeader}>
              <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                <Text style={styles.timePickerCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>Hora de fin</Text>
              <View style={{ width: 60 }} />
            </View>
            <ScrollView style={styles.timePickerList}>
              {timeOptions.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeOption, horaFin === time && styles.timeOptionSelected]}
                  onPress={() => selectEndTime(time)}
                >
                  <Text style={[styles.timeOptionText, horaFin === time && styles.timeOptionTextSelected]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Modal selector de categoría */}
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerHeader}>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Text style={styles.timePickerCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>Categoría del Pack</Text>
              <View style={{ width: 60 }} />
            </View>
            <ScrollView style={styles.timePickerList}>
              {BUSINESS_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.timeOption, categoria === cat.label && styles.timeOptionSelected]}
                  onPress={() => {
                    setCategoria(cat.label);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[styles.timeOptionText, categoria === cat.label && styles.timeOptionTextSelected]}>
                    {cat.icon} {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  scrollView: {
    flex: 1,
  },
  content: { 
    padding: SPACING.md,
  },
  
  // Image selector
  imageSelector: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
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
    paddingVertical: 12,
  },
  changeImageText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  previewBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewBadgeText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '08',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
    borderRadius: 16,
    margin: 2,
  },
  cameraIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  imagePlaceholderSubtext: {
    fontSize: 13,
    color: COLORS.textLight,
  },

  // Form sections
  formSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  
  // Inputs
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textLight,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  
  // Price inputs
  priceRow: {
    flexDirection: 'row',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  discountPriceWrapper: {
    borderColor: COLORS.primary + '50',
    backgroundColor: COLORS.primary + '08',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textLight,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  discountPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '15',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  discountPreviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accent,
    marginLeft: 8,
  },

  // CO2 Preview
  co2Preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  co2PreviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.success,
    marginLeft: 8,
  },

  // Time inputs
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  timeSelectorText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 8,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '80%',
    maxHeight: '60%',
    ...SHADOWS.medium,
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  timePickerCancel: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  timePickerList: {
    maxHeight: 250,
  },
  timeOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  timeOptionSelected: {
    backgroundColor: COLORS.primary + '15',
  },
  timeOptionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  timeOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Checkbox styles
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  checkboxDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Publish button
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  publishButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  publishButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddProductScreen;
