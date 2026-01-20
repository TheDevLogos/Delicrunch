import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../src/constants/theme';
import { formatPrice } from '../src/utils/format';
import { publicApi } from '../services/api';

const COUNTDOWN_START = 20 * 60; // 20 minutos en segundos

export default function FlashDealModal({ products = [], navigation }) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_START);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localProducts, setLocalProducts] = useState(products || []);
  const intervalRef = useRef(null);

  // Si no llegan productos desde el parent, intentar cargar un respaldo público
  useEffect(() => {
    let mounted = true;
    const loadFallback = async () => {
      if (localProducts && localProducts.length > 0) return;
      try {
        const resp = await publicApi.get('/products');
        const all = resp.data || [];
        const available = all.filter(p => (p.cantidad_disponible || p.cantidad_inicial || 0) > 0);
        if (mounted) setLocalProducts(available.length ? available : all.slice(0, 6));
      } catch (e) {
        // Silencioso: si falla, no mostramos el modal
      }
    };
    loadFallback();
    return () => { mounted = false; };
  }, [localProducts]);

  // Cuando cambian props.products actualizamos localProducts
  useEffect(() => {
    if (products && products.length > 0) setLocalProducts(products);
  }, [products]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Cambia al siguiente producto y reinicia el contador
          const nextIndex = localProducts.length > 0 ? (currentIndex + 1) % localProducts.length : 0;
          setCurrentIndex(nextIndex);
          return COUNTDOWN_START;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [currentIndex, localProducts]);

  if (!localProducts || localProducts.length === 0) return null;
  const product = localProducts[currentIndex];
  const min = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const sec = String(secondsLeft % 60).padStart(2, '0');

  const handleBuy = () => {
    navigation.navigate('OrderConfirmation', { product });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.flashTitle}>⚡ Flash Rescue</Text>
      <Text style={styles.timer}>{`00:${min}:${sec}`}</Text>
      <View style={styles.productBox}>
        {product?.imagen_url ? (
          <Image source={{ uri: product.imagen_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}><Text>Sin imagen</Text></View>
        )}
        <View style={styles.infoBox}>
          <Text style={styles.productName}>{product?.nombre || 'Oferta'}</Text>
          <Text style={styles.productDesc}>{product?.descripcion || ''}</Text>
          <Text style={styles.price}>${formatPrice(product?.precio_descuento || 0)} <Text style={styles.priceOriginal}>${formatPrice(product?.precio_original || 0)}</Text></Text>
          <Text style={styles.store}>{product?.nombre_comercio || ''}</Text>
          <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
            <Text style={styles.buyButtonText}>¡Lo quiero!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 8,
  },
  flashTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
    letterSpacing: 1,
  },
  timer: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 8,
    letterSpacing: 2,
  },
  productBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: SPACING.md,
    backgroundColor: COLORS.white,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: SPACING.md,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flex: 1,
  },
  productName: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  productDesc: {
    color: COLORS.white,
    fontSize: 12,
    marginBottom: 2,
  },
  price: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  priceOriginal: {
    color: COLORS.accent,
    textDecorationLine: 'line-through',
    fontSize: 12,
    marginLeft: 4,
  },
  store: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  buyButton: {
    marginTop: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  buyButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
