import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import StyledButton from '../components/StyledButton';
import api from '../services/api';
import logger from '../services/logger';
import Constants from 'expo-constants';

// Detectamos si estamos en Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

const PaymentScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [clientSecret, setClientSecret] = useState(null); // Para guardar el client_secret para la web

  if (!product) {
    // Fallback por si no se recibe el producto
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No se ha podido cargar la información del producto.</Text>
      </SafeAreaView>
    );
  }

  const discountAmount = (product.precio_original - product.precio_descuento).toFixed(2);

  // Función para crear el Payment Intent y preparar el pago
  const initializePayment = async () => {
    // Si estamos en Expo Go, mostramos un mensaje informativo
    if (isExpoGo) {
      Alert.alert(
        'Funcionalidad No Disponible en Expo Go',
        'Los pagos con Stripe requieren un build nativo de la aplicación.\n\n' +
        'Para probar esta funcionalidad:\n' +
        '1. Crea un build de desarrollo con EAS: eas build --profile development\n' +
        '2. O usa un simulador/emulador con el build instalado\n\n' +
        'El resto de la app funciona perfectamente en Expo Go.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    setIsPurchasing(true);
    try {
      const response = await api.post('/payments/create-payment-intent', {
        productId: product.id,
      });
      const { clientSecret: secret } = response.data;

      // --- LÓGICA SOLO PARA MÓVIL NATIVO ---
      // 2. Inicializar el Payment Sheet de Stripe
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Delicrunch, Inc.",
        paymentIntentClientSecret: secret,
        allowsDelayedPaymentMethods: false, // Para confirmación inmediata
      });

      if (initError) {
        logger.error(initError, 'initPaymentSheet');
        Alert.alert('Error', 'No se pudo inicializar el pago.');
        setIsPurchasing(false);
        return;
      }

      // 3. Mostrar el Payment Sheet al usuario
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          logger.error(paymentError, 'presentPaymentSheet');
          Alert.alert('Error de Pago', paymentError.message);
        }
        setIsPurchasing(false);
        return;
      }

      await onPaymentSuccess();

    } catch (error) {
      logger.error(error, 'handlePurchase - PaymentScreen');
      const errorMessage = error.response?.data?.msg || 'No se pudo procesar tu solicitud. Inténtalo de nuevo.';
      Alert.alert('Error en la Compra', errorMessage);
      // En caso de error, nos aseguramos de que el botón se reactive.
      setIsPurchasing(false);
    }
  };

  // Función que se ejecuta después de un pago exitoso (en móvil o web)
  const onPaymentSuccess = async () => {
    try {
      setIsPurchasing(true); // Mostramos loading mientras se crea el pedido
      const orderResponse = await api.post('/orders', { productId: product.id });
      const newOrder = orderResponse.data;
      navigation.replace('OrderConfirmation', { order: newOrder });
    } catch (error) {
      logger.error(error, 'onPaymentSuccess - Creating Order');
      Alert.alert('Error', 'Tu pago fue exitoso, pero hubo un problema al crear tu pedido. Contacta a soporte.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Resumen del Pedido */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tu Pedido</Text>
          <View style={styles.productInfo}>
            <Image source={{ uri: product.imagen_url }} style={styles.productImage} />
            <View style={styles.productText}>
              <Text style={styles.productName}>{product.nombre}</Text>
              <Text style={styles.storeName}>{product.nombre_comercio}</Text>
            </View>
          </View>
        </View>

        {/* 2. Detalles de Recogida */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Detalles de Recogida</Text>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={24} color="#555" />
            <Text style={styles.detailText}>
              Hoy, entre {product.hora_recogida_inicio} y {product.hora_recogida_fin}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={24} color="#555" />
            <Text style={styles.detailText}>{product.direccion}</Text>
          </View>
        </View>

        {/* 3. Aviso para Expo Go */}
        {isExpoGo && (
          <View style={styles.card}>
            <View style={styles.warningContainer}>
              <Ionicons name="information-circle" size={24} color="#FF9500" />
              <Text style={styles.warningText}>
                Los pagos no están disponibles en Expo Go. Necesitas un build nativo para usar esta funcionalidad.
              </Text>
            </View>
          </View>
        )}

        {/* 4. Desglose de Precios */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumen de Pago</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Precio Original</Text>
            <Text style={styles.priceValue}>${product.precio_original}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Descuento Delicrunch</Text>
            <Text style={styles.discountValue}>-${discountAmount}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total a Pagar</Text>
            <Text style={styles.totalValue}>${product.precio_descuento}</Text>
          </View>
        </View>
      </ScrollView>

      {/* 5. Footer Fijo para Pagar */}
      <View style={styles.footer}>
        <View style={styles.footerPriceInfo}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>${product.precio_descuento}</Text>
        </View>
        <StyledButton
          title={isExpoGo ? 'No Disponible en Expo Go' : (isPurchasing ? 'Procesando...' : 'Confirmar y Pagar')}
          onPress={initializePayment}
          isLoading={isPurchasing}
          variant={isExpoGo ? 'secondary' : 'success'}
          style={{ flex: 1 }}
          disabled={isExpoGo}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { padding: 15, paddingBottom: 120 }, // Espacio para el footer
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  productInfo: { flexDirection: 'row', alignItems: 'center' },
  productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  productText: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600' },
  storeName: { fontSize: 14, color: 'gray', marginTop: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailText: { fontSize: 16, marginLeft: 15, flex: 1 },
  changePayment: { fontSize: 16, color: '#0A84FF', fontWeight: '600' },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: { fontSize: 16, color: '#555' },
  priceValue: { fontSize: 16 },
  discountValue: { fontSize: 16, color: '#30D158' },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 10,
  },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 30, // Safe area for home indicator
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerPriceInfo: {
    marginRight: 20,
  },
  footerTotalLabel: {
    fontSize: 14,
    color: 'gray',
  },
  footerTotalValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'red',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});

export default PaymentScreen;