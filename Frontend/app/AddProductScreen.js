import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import StyledTextInput from '../components/StyledTextInput';
import StyledButton from '../components/StyledButton';
import api from '../services/api'; // El interceptor se encarga del token
import logger from '../services/logger'; // <-- Importar el logger

const AddProductScreen = ({ navigation }) => {
  const [nombre, setNombre] = useState('Pack Sorpresa');
  const [descripcion, setDescripcion] = useState('');
  const [precioOriginal, setPrecioOriginal] = useState('');
  const [precioDescuento, setPrecioDescuento] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [image, setImage] = useState(null); // Estado para la URI de la imagen
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    // Pedimos permiso para acceder a la galería
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
      Alert.alert('Error', 'Todos los campos, incluida la imagen, son obligatorios.');
      return;
    }

    // --- VALIDACIÓN DE PRECIOS ---
    const original = parseFloat(precioOriginal);
    const discount = parseFloat(precioDescuento);

    if (isNaN(original) || isNaN(discount)) {
      Alert.alert('Error de Formato', 'Los precios deben ser números válidos.');
      return;
    }

    if (discount >= original) {
      Alert.alert('Error en Precios', 'El precio con descuento debe ser menor que el precio original.');
      return;
    }
    // --- FIN DE LA VALIDACIÓN ---
    
    setIsSubmitting(true);
    try {
      // Usamos FormData para enviar la imagen y los datos
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion);
      formData.append('precio_original', original); // Usamos el valor ya parseado
      formData.append('precio_descuento', discount); // Usamos el valor ya parseado
      formData.append('cantidad_inicial', parseInt(cantidad, 10));
      formData.append('hora_recogida_inicio', horaInicio);
      formData.append('hora_recogida_fin', horaFin);

      // Extraemos el nombre del archivo y el tipo de la URI
      const filename = image.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('imagen', { uri: image, name: filename, type });

      // Hacemos la petición POST con FormData
      await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Éxito', 'El producto ha sido añadido correctamente.');
      navigation.goBack(); // Volver a la lista de productos
    } catch (error) {
      logger.error(error, 'handleAddProduct'); // <-- Usar el logger
      Alert.alert('Error', 'No se pudo añadir el producto. Revisa los datos introducidos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <StyledButton title="Seleccionar Imagen del Producto" onPress={pickImage} />
        {image && (
          <Image
            source={{ uri: image }}
            style={styles.imagePreview}
          />
        )}

        <StyledTextInput placeholder="Nombre del Pack" value={nombre} onChangeText={setNombre} />
        <StyledTextInput placeholder="Descripción (ej. pan, bollería, fruta...)" value={descripcion} onChangeText={setDescripcion} multiline />
        <StyledTextInput placeholder="Precio Original (ej. 15.00)" value={precioOriginal} onChangeText={setPrecioOriginal} keyboardType="decimal-pad" />
        <StyledTextInput placeholder="Precio con Descuento (ej. 4.99)" value={precioDescuento} onChangeText={setPrecioDescuento} keyboardType="decimal-pad" />
        <StyledTextInput placeholder="Cantidad de Packs Disponibles" value={cantidad} onChangeText={setCantidad} keyboardType="number-pad" />
        <StyledTextInput placeholder="Hora de Recogida (Inicio, ej. 19:00)" value={horaInicio} onChangeText={setHoraInicio} />
        <StyledTextInput placeholder="Hora de Recogida (Fin, ej. 20:00)" value={horaFin} onChangeText={setHoraFin} />
        <StyledButton title="Publicar Producto" onPress={handleAddProduct} disabled={isSubmitting} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  imagePreview: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 8,
  },
});

export default AddProductScreen;
