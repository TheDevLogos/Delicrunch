import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StyledButton from './StyledButton';

const { height } = Dimensions.get('window');

/**
 * Un modal de oferta flash que aparece con una animación.
 * Muestra un producto destacado de forma llamativa.
 *
 * @param {object} props
 * @param {boolean} props.visible - Controla si el modal es visible.
 * @param {object | null} props.product - El producto a mostrar en la oferta.
 * @param {() => void} props.onClose - Función para cerrar el modal.
 * @param {(product: object) => void} props.onPurchase - Función para manejar la compra.
 */
const FlashDealModal = ({ visible, product, onClose, onPurchase }) => {
  // Usamos Animated para la animación de entrada del modal
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      // Animación para que el modal suba desde la parte inferior
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      // Animación para que el modal baje y desaparezca
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!product) {
    return null;
  }

  const handlePurchase = () => {
    onPurchase(product);
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="none" // La animación la controlamos nosotros
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          {/* Botón para cerrar */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle" size={32} color="#999" />
          </TouchableOpacity>

          {/* Contenido de la oferta */}
          <Text style={styles.headerText}>¡Oferta Flash!</Text>
          <Text style={styles.subHeaderText}>¡No te pierdas este pack increíble!</Text>

          <Image source={{ uri: product.imagen_url }} style={styles.productImage} />

          <Text style={styles.productName}>{product.nombre}</Text>
          <Text style={styles.storeName}>{product.nombre_comercio}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.originalPrice}>${product.precio_original}</Text>
            <Text style={styles.discountPrice}>¡Solo ${product.precio_descuento}!</Text>
          </View>

          <StyledButton
            title="¡Lo quiero!"
            onPress={handlePurchase}
            variant="success"
            style={{ marginTop: 20 }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e67e22',
    marginBottom: 5,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  productImage: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    marginBottom: 15,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  storeName: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  originalPrice: {
    fontSize: 18,
    color: '#95a5a6',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountPrice: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#27ae60',
  },
});

export default FlashDealModal;
