import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Alert, 
  ScrollView, 
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import logger from '../services/logger';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';

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

  const discount = precioOriginal && precioDescuento && parseFloat(precioOriginal) > 0
    ? Math.round((1 - parseFloat(precioDescuento) / parseFloat(precioOriginal)) * 100)
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
    if (!nombre || !precioOriginal || !precioDescuento || !cantidad || !horaInicio || !horaFin || !image) {
      Alert.alert('Campos Incompletos', 'Todos los campos, incluida la imagen, son obligatorios.');
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
      formData.append('descripcion', descripcion);
      formData.append('precio_original', original);
      formData.append('precio_descuento', discountPrice);
      formData.append('cantidad_inicial', parseInt(cantidad, 10));
      formData.append('hora_recogida_inicio', horaInicio);
      formData.append('hora_recogida_fin', horaFin);

      const filename = image.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('imagen', { uri: image, name: filename, type });

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
    <SafeAreaView style={styles.container}>
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
                    placeholder="15.00"
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
                    placeholder="4.99"
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
                <View style={styles.timeInputWrapper}>
                  <Ionicons name="time-outline" size={18} color={COLORS.textLight} />
                  <TextInput
                    style={styles.timeInput}
                    placeholder="19:00"
                    placeholderTextColor={COLORS.textLight}
                    value={horaInicio}
                    onChangeText={setHoraInicio}
                  />
                </View>
              </View>
              
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Hasta</Text>
                <View style={styles.timeInputWrapper}>
                  <Ionicons name="time-outline" size={18} color={COLORS.textLight} />
                  <TextInput
                    style={styles.timeInput}
                    placeholder="20:00"
                    placeholderTextColor={COLORS.textLight}
                    value={horaFin}
                    onChangeText={setHoraFin}
                  />
                </View>
              </View>
            </View>
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

  // Time inputs
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  timeInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 15,
    color: COLORS.text,
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
