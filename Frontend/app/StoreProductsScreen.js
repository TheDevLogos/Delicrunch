import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../services/api'; // El interceptor se encarga del token
import StyledButton from '../components/StyledButton';
import { formatPrice } from '../src/utils/format';

// Componente para renderizar cada producto del comercio
const ProductItem = ({ item }) => (
  <View style={styles.productItem}>
    <Text style={styles.productTitle}>{item.nombre}</Text>
    <Text style={styles.productDetails}>Precio Original: ${formatPrice(item.precio_original)}</Text>
    <Text style={styles.productDetails}>Precio Descuento: ${formatPrice(item.precio_descuento)}</Text>
    <Text style={styles.productStock}>Stock Disponible: {item.cantidad_disponible}</Text>
  </View>
);

const StoreProductsScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStoreProducts = async () => {
    try {
      // LLAMADA SIMPLIFICADA: No se necesita el token manualmente.
      const response = await api.get('/products/mystore');
      setProducts(response.data);
    } catch (error) {
      console.error("Error al obtener los productos de la tienda:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // useFocusEffect se asegura de que la lista se recargue cada vez que volvemos a esta pantalla
  // (por ejemplo, después de añadir un nuevo producto).
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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
  productItem: { backgroundColor: '#fff', padding: 15, marginBottom: 15, marginHorizontal: 20, borderRadius: 8, elevation: 2 },
  productTitle: { fontSize: 18, fontWeight: 'bold' },
  productDetails: { fontSize: 16, color: '#555', marginTop: 5 },
  productStock: { fontSize: 16, color: '#007bff', marginTop: 5, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});

export default StoreProductsScreen;