import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
// Importamos ambas instancias: 'api' para comprar (requiere token) y 'publicApi' para ver detalles (no requiere token).
import api, { publicApi } from '../services/api';
import StyledButton from '../components/StyledButton';
import logger from '../services/logger';
import ReadOnlyStarRating from '../components/ReadOnlyStarRating'; // <-- Importar el componente reutilizable

const ReviewItem = ({ review }) => (
  <View style={styles.reviewItem}>
    <View style={styles.reviewHeader}>
      <Text style={styles.reviewAuthor}>{review.nombre_usuario || 'Anónimo'}</Text>
      <ReadOnlyStarRating rating={review.calificacion} />
    </View>
    <Text style={styles.reviewComment}>{review.comentario}</Text>
  </View>
);

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        // Usamos Promise.all para buscar los detalles del producto y las reseñas en paralelo
        const [productResponse, reviewsResponse] = await Promise.all([
          publicApi.get(`/products/${productId}`),
          publicApi.get(`/reviews/${productId}`) // Asumimos que este endpoint devuelve las reseñas de un producto
        ]);
        setProduct(productResponse.data);
        setReviews(reviewsResponse.data);
      } catch (error) {
        logger.error(error, 'fetchProductDetails'); // <-- Usar el logger
        Alert.alert("Error", "No se pudieron cargar los detalles del producto.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // Ahora, esta función simplemente navega a la pantalla de pago reutilizable.
  const handlePurchase = () => {
    // Nos aseguramos de que el producto esté cargado antes de navegar
    if (product) {
      navigation.navigate('Payment', { product });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Producto no encontrado.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image
          source={{ uri: product.imagen_url || 'https://via.placeholder.com/400' }}
          style={styles.image}
        />
        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{product.nombre}</Text>
          <Text style={styles.storeName}>{product.nombre_comercio}</Text>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{product.descripcion}</Text>
          <Text style={styles.sectionTitle}>Horario de Recogida</Text>
          <Text style={styles.pickupTime}>De {product.hora_recogida_inicio} a {product.hora_recogida_fin}</Text>
          <Text style={styles.sectionTitle}>Dirección de Recogida</Text>
          <Text style={styles.description}>{product.direccion}</Text>

          {/* --- SECCIÓN DE RESEÑAS --- */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Opiniones de los Clientes</Text>
          {reviews.length > 0 ? (
            <>
              <View style={styles.averageRatingContainer}>
                <Text style={styles.averageRatingText}>Calificación Promedio: </Text>
                <ReadOnlyStarRating rating={product.calificacion_promedio || 0} size={20} />
                <Text style={styles.averageRatingText}> ({reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'})</Text>
              </View>
              {reviews.map(review => <ReviewItem key={review.id} review={review} />)}
            </>
          ) : (
            <Text style={styles.noReviewsText}>Este producto aún no tiene reseñas. ¡Sé el primero en opinar!</Text>
          )}

        </View>
      </ScrollView>
      <View style={styles.priceContainer}>
        <Text style={styles.originalPrice}>${product.precio_original}</Text>
        <Text style={styles.discountPrice}>${product.precio_descuento}</Text>
      </View>
      <View style={styles.purchaseContainer}>
        <StyledButton 
            title="Comprar Ahora" 
            onPress={handlePurchase} 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 250 },
  detailsContainer: { padding: 20 },
  productName: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 5 },
  storeName: { fontSize: 18, color: '#8A8A8E', marginBottom: 15 },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  originalPrice: { fontSize: 20, color: '#8A8A8E', textDecorationLine: 'line-through' },
  discountPrice: { fontSize: 28, fontWeight: 'bold', color: '#30D158' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 20,
    marginBottom: 10,
  },
  description: { fontSize: 16, lineHeight: 24, color: '#3C3C43' },
  pickupTime: { fontSize: 16, color: '#3C3C43' },
  purchaseContainer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 20,
  },
  averageRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  averageRatingText: {
    fontSize: 16,
    color: '#3C3C43',
    marginRight: 5,
  },
  reviewItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewAuthor: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  reviewComment: { fontSize: 15, color: '#3C3C43', lineHeight: 22 },
  noReviewsText: { fontSize: 16, color: '#8A8A8E', fontStyle: 'italic', textAlign: 'center', marginVertical: 20 },
});

export default ProductDetailScreen;