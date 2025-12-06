import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import StyledButton from '../components/StyledButton';

// Componente para renderizar cada producto del comercio
const ProductItem = ({ item }) => {
  const navigation = useNavigation(); // Usamos el hook aquí para obtener el contexto de navegación correcto.
  return (
    <View style={styles.productItem}>
      <Image source={{ uri: item.imagen_url || 'https://via.placeholder.com/150' }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>{item.nombre}</Text>
        <Text style={styles.productDetails}>Precio Original: ${item.precio_original}</Text>
        <Text style={styles.productDetails}>Precio Descuento: ${item.precio_descuento}</Text>
        <Text style={styles.productStock}>Stock Disponible: {item.cantidad_disponible}</Text>
        <StyledButton
          title="Editar"
          // Al igual que en ProfileScreen, usamos getParent() para acceder al navegador
          // padre que contiene tanto el TabNavigator como la pantalla de edición.
          onPress={() => navigation.getParent()?.navigate('EditProductScreen', { productId: item.id })}
          variant="secondary"
          style={{ marginTop: 10, height: 40 }}
          textStyle={{ fontSize: 14 }}
        />
      </View>
    </View>
  );
};

const MyProductsScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStoreProducts = async () => {
    try {
      // Esta ruta obtiene los productos del comercio que ha iniciado sesión
      const response = await api.get('/products/mystore');
      setProducts(response.data);
    } catch (error) {
      console.error("Error al obtener los productos de la tienda:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // useFocusEffect recarga los datos cada vez que la pantalla obtiene el foco,
  // útil para ver los nuevos productos después de añadirlos.
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchStoreProducts();
    }, [])
  );

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ProductItem item={item} />}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Mis Productos</Text>
            <StyledButton 
              title="Añadir Nuevo Producto" 
              onPress={() => navigation.navigate('AddProduct')}
              style={{ marginHorizontal: 20, marginBottom: 20 }}
            />
          </>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No has publicado ningún producto.</Text>}
        contentContainerStyle={{ paddingTop: 20 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  productItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, marginBottom: 15, marginHorizontal: 20, borderRadius: 8, elevation: 2, alignItems: 'center' },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: { fontSize: 18, fontWeight: 'bold' },
  productDetails: { fontSize: 16, color: '#555', marginTop: 5 },
  productStock: { fontSize: 16, color: '#28a745', marginTop: 5, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});

export default MyProductsScreen;