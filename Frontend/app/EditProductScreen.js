import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import StyledTextInput from '../components/StyledTextInput';
import StyledButton from '../components/StyledButton';
import api from '../services/api';
import logger from '../services/logger';

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Editar Producto</Text>
        <Image
          source={{ uri: image || existingImageUrl || 'https://via.placeholder.com/400' }}
          style={styles.imagePreview}
        />
        <StyledButton title="Cambiar Imagen" onPress={pickImage} variant="secondary" />

        <StyledTextInput placeholder="Nombre del Pack" value={nombre} onChangeText={setNombre} />
        <StyledTextInput placeholder="Descripción" value={descripcion} onChangeText={setDescripcion} multiline />
        <StyledTextInput placeholder="Precio Original" value={precioOriginal} onChangeText={setPrecioOriginal} keyboardType="decimal-pad" />
        <StyledTextInput placeholder="Precio con Descuento" value={precioDescuento} onChangeText={setPrecioDescuento} keyboardType="decimal-pad" />
        <StyledTextInput placeholder="Cantidad de Packs" value={cantidad} onChangeText={setCantidad} keyboardType="number-pad" />
        <StyledTextInput placeholder="Hora de Recogida (Inicio)" value={horaInicio} onChangeText={setHoraInicio} />
        <StyledTextInput placeholder="Hora de Recogida (Fin)" value={horaFin} onChangeText={setHoraFin} />
        
        <StyledButton
          title="Guardar Cambios"
          onPress={handleUpdateProduct}
          isLoading={isSubmitting}
          variant="success"
        />

        <View style={styles.divider} />

        <StyledButton
          title="Eliminar Producto"
          onPress={confirmDelete}
          isLoading={isDeleting}
          variant="danger"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  imagePreview: {
    width: '100%',
    height: 200,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 15,
  },
});

export default EditProductScreen;