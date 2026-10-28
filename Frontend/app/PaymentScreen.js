import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { formatPrice } from '../src/utils/format';

// This screen reserves a pack. Payment happens directly at the store.
const PaymentScreen = ({ route, navigation }) => {
  const { product, quantity = 1 } = route.params || {};
  const [submitting, setSubmitting] = useState(false);
  const total = Number(product?.precio_descuento || 0) * Number(quantity);

  const reserve = async () => {
    if (submitting || !product?.id) return;
    setSubmitting(true);
    try {
      const { data: order } = await api.post('/orders', {
        productId: product.id,
        cantidad: quantity,
      });
      if (!order?.id || !order?.codigo_recogida) {
        throw new Error('El servidor no devolvió un ticket válido.');
      }
      navigation.replace('OrderConfirmation', { order, product });
    } catch (error) {
      Alert.alert(
        'No se pudo reservar',
        error.response?.data?.msg || error.message || 'Intenta de nuevo más tarde.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>No se encontró el producto.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#173b30" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Confirmar reserva</Text>
        <Text style={styles.subtitle}>
          Recibirás un ticket con un código para mostrarlo en el comercio.
        </Text>

        <View style={styles.card}>
          {product.imagen_url ? (
            <Image source={{ uri: product.imagen_url }} style={styles.image} />
          ) : null}
          <Text style={styles.product}>{product.nombre}</Text>
          <Text style={styles.detail}>{product.nombre_comercio}</Text>
          <Text style={styles.detail}>Cantidad: {quantity}</Text>
          <Text style={styles.detail}>
            Recogida: {product.hora_recogida_inicio || 'Consultar con el comercio'}
            {product.hora_recogida_fin ? ` – ${product.hora_recogida_fin}` : ''}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Total a pagar en el comercio</Text>
          <Text style={styles.price}>${formatPrice(total)} MXN</Text>
          <Text style={styles.notice}>
            Paga en efectivo al recoger. Delicrunch no cobra ni procesa este pago.
            El precio definitivo se confirma en el ticket emitido por el servidor.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, submitting && styles.disabled]}
          onPress={reserve}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Reservar y obtener código</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5faf7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 30 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { color: '#173b30', fontSize: 16, marginLeft: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#173b30' },
  subtitle: { fontSize: 16, color: '#52645c', marginTop: 8, marginBottom: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#e2ebe5',
  },
  image: { width: '100%', height: 150, borderRadius: 10, marginBottom: 16 },
  product: { fontSize: 20, fontWeight: '700', color: '#173b30', marginBottom: 6 },
  detail: { fontSize: 15, color: '#52645c', marginTop: 5 },
  label: { fontSize: 16, color: '#52645c' },
  price: { fontSize: 27, fontWeight: '700', color: '#0c8b68', marginTop: 8 },
  notice: { fontSize: 14, lineHeight: 21, color: '#52645c', marginTop: 15 },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2ebe5' },
  button: { backgroundColor: '#0c8b68', borderRadius: 12, padding: 17, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default PaymentScreen;
