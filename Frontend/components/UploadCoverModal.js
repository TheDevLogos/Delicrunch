/**
 * UploadCoverModal - Modal para subir portada/hero de tienda
 * Permite seleccionar imagen 16:9 y subirla a backend
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { COLORS, SPACING, SHADOWS, LAYOUT } from '../src/constants/theme';

const { width } = Dimensions.get('window');

const UploadCoverModal = ({ visible, onClose, onSuccess }) => {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Animación de entrada/salida del modal
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 90, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 600, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // Función para seleccionar imagen del galería
  const pickImage = async () => {
    try {
      setIsLoading(true);
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permiso Requerido', 'Necesitamos permiso para acceder a tus fotos.');
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Banner 16:9
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para subir portada al backend
  const uploadCover = async () => {
    if (!selectedImage) {
      Alert.alert('Validación', 'Por favor selecciona una imagen primero');
      return;
    }

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      
      const uriParts = selectedImage.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('cover_url', {
        uri: selectedImage.uri,
        name: `cover_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      });

      // Subir al endpoint del backend
      const response = await api.put('/stores/me/cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        Alert.alert('¡Éxito!', 'Portada actualizada correctamente');
        setSelectedImage(null);
        onSuccess?.(); // Callback para refrescar datos en la aplicación
        onClose();
      }
    } catch (error) {
      console.error('Error uploading cover:', error);
      const errorMsg = error.response?.data?.error || 'No se pudo subir la portada';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // Función para cancelar
  const handleClose = () => {
    setSelectedImage(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Fondo oscuro */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Contenido del modal */}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>📷 Editar Portada</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isUploading}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Descripción */}
          <Text style={styles.description}>
            Sube una imagen para la portada de tu tienda (16:9)
          </Text>

          {/* Preview de imagen seleccionada */}
          {selectedImage ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.preview}
              />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={pickImage}
                disabled={isUploading}
              >
                <Ionicons name="camera" size={20} color={COLORS.white} />
                <Text style={styles.changeImageText}>Cambiar Imagen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectImageButton}
              onPress={pickImage}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={40} color={COLORS.primary} />
                  <Text style={styles.selectImageText}>Seleccionar Imagen</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Botones de acción */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isUploading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.uploadButton,
                (!selectedImage || isUploading) && styles.uploadButtonDisabled,
              ]}
              onPress={uploadCover}
              disabled={!selectedImage || isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.uploadButtonText}>Subir Portada</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.s,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.m,
    lineHeight: 20,
  },
  previewContainer: {
    marginBottom: SPACING.m,
    overflow: 'hidden',
    borderRadius: 12,
  },
  preview: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    marginTop: SPACING.s,
    borderRadius: 12,
    gap: SPACING.s,
  },
  changeImageText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  selectImageButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
    backgroundColor: `${COLORS.primary}10`,
  },
  selectImageText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: SPACING.s,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: SPACING.m,
    marginTop: SPACING.m,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.m,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.inputBackground,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
  },
  uploadButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UploadCoverModal;
