import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

// El componente recibe un objeto 'product' y una función 'onPress'.
const ProductCard = ({ product, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        // Usamos la imagen real del producto con un placeholder por si no existe
        source={{ uri: product.imagen_url || 'https://via.placeholder.com/400' }}
        style={styles.image}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{product.nombre}</Text>
        <Text style={styles.storeName}>{product.nombre_comercio}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.originalPrice}>${product.precio_original}</Text>
          <Text style={styles.discountPrice}>${product.precio_descuento}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#4A4A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    marginHorizontal: 20,
  },
  image: {
    width: '100%',
    height: 180,
  },
  infoContainer: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 5,
  },
  storeName: {
    fontSize: 14,
    color: '#8A8A8E',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Alinea los precios a la derecha
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#30D158',
  },
});

export default ProductCard;