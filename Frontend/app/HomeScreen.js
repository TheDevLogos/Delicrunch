import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Para el icono del botón de limpiar
import api, { publicApi } from '../services/api'; // Usaremos publicApi para evitar problemas con el token
import ProductCard from '../components/ProductCard';
import StyledButton from '../components/StyledButton';
import StyledTextInput from '../components/StyledTextInput'; // Importamos el campo de texto

const HomeScreen = () => {
const navigation = useNavigation(); 

  // --- ESTADOS DEL COMPONENTE ---
  const [products, setProducts] = useState([]); // Para almacenar la lista de productos
  const [filteredProducts, setFilteredProducts] = useState([]); // Para la lista filtrada
  const [searchQuery, setSearchQuery] = useState(''); // Para el texto de búsqueda
  const [isLoading, setIsLoading] = useState(false); // Para mostrar un indicador de carga
  const [isRefreshing, setIsRefreshing] = useState(false); // Para el "pull-to-refresh"
  const [error, setError] = useState(null); // Para almacenar cualquier error de la API

  // --- FUNCIÓN PARA OBTENER DATOS ---
  const fetchProducts = async () => {
    setError(null); // Limpiamos errores previos
    try {
      // Usamos publicApi para asegurar que la petición vaya sin token
      const response = await publicApi.get('/products');
      setProducts(response.data); // Guardamos los productos en el estado
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError("No se pudieron cargar los productos. Inténtalo de nuevo.");
    }
  };

  // --- LÓGICA DE FILTRADO ---
  // Este efecto se ejecuta cada vez que el texto de búsqueda o la lista de productos cambia.
  useEffect(() => {
    if (searchQuery === '') {
      setFilteredProducts(products); // Si no hay búsqueda, mostramos todos
    } else {
      // Filtramos los productos cuyo nombre (en minúsculas) incluya el texto de búsqueda (en minúsculas)
      const filtered = products.filter(product =>
        product.nombre.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);


  // --- EFECTO DE CARGA INICIAL (usando useFocusEffect) ---
  // Se ejecuta cada vez que la pantalla obtiene el foco, asegurando datos frescos.
  useFocusEffect(
    useCallback(() => {
    setIsLoading(true);
    fetchProducts().finally(() => setIsLoading(false));
  }, [])
  );

  // --- FUNCIÓN PARA EL PULL-TO-REFRESH ---
  // useCallback memoriza la función para evitar re-creaciones innecesarias.
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchProducts().finally(() => setIsRefreshing(false));
  }, []);

  // --- RENDERIZADO CONDICIONAL ---
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="medium" color="#0A84FF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <StyledButton title="Reintentar" onPress={handleRefresh} />
      </View>
    );
  }

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <SafeAreaView style={styles.container}>
      {/* FlatList es el componente optimizado de React Native para mostrar listas */}
      <FlatList
        data={filteredProducts}
        // 'keyExtractor' le dice a FlatList cómo identificar cada elemento de forma única
        keyExtractor={(item) => item.id.toString()}
        // 'renderItem' define cómo se debe renderizar cada elemento de la lista
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            // Al presionar, navegamos a 'ProductDetail' y le pasamos el ID del item
            // como un parámetro llamado 'productId'.
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          />
        )}
        // Props para la funcionalidad de "pull-to-refresh"
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        // Añade un poco de espacio en la parte superior e inferior de la lista
        contentContainerStyle={styles.listContent}
        // Componente que se muestra si la lista está vacía
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text>{searchQuery ? 'No se encontraron resultados.' : 'No hay packs disponibles.'}</Text>
          </View>
        )}
        // Componente que se renderiza en la cabecera de la lista
        ListHeaderComponent={() => (
          <View>
            <Text style={styles.title}>Packs Sorpresa Disponibles</Text>
            <View style={styles.searchContainer}>
              <StyledTextInput
                placeholder="Buscar por nombre del pack..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={22} color="#888" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5E6', // Nuevo color de fondo
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50, // Añadimos margen para que no quede pegado a la barra de búsqueda
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#1C1C1E',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginHorizontal: 0,
    marginBottom: 0,
    borderWidth: 0, // Quitamos el borde del input
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    height: '100%',
    justifyContent: 'center',
    padding: 5,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
  }
});

export default HomeScreen;