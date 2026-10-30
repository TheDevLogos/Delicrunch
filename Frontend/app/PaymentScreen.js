import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { formatPrice } from '../src/utils/format';
import { COLORS } from '../src/constants/theme';

// This screen reserves a pack. Payment happens directly at the store.
const PaymentScreen = ({ route, navigation }) => {
  const { product, quantity = 1 } = route.params || {};
  const [selectedQuantity, setSelectedQuantity] = useState(quantity);
  const [submitting, setSubmitting] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [couponId, setCouponId] = useState(null);
  const [notes, setNotes] = useState('');
  const total = Number(product?.precio_descuento || 0) * Number(selectedQuantity);

  useEffect(() => {
    if (!product?.id || !Number.isFinite(total) || total <= 0) return;
    let active = true;
    api.get('/coupons/available', { params: { category: product.categoria, total } })
      .then(({ data }) => {
        if (active) {
          const eligible = (data.coupons || []).filter(c => c.type !== '2x1' || Number(selectedQuantity) >= 2);
          setCoupons(eligible);
          setCouponId(current => current && !eligible.some(c => c.id === current) ? null : current);
        }
      })
      .catch(() => { if (active) setCoupons([]); });
    return () => { active = false; };
  }, [product?.id, product?.categoria, total, selectedQuantity]);

  const reserve = async () => {
    if (submitting || !product?.id) return;
    setSubmitting(true);
    try {
      const { data: order } = await api.post('/orders', {
        productId: product.id,
        cantidad: selectedQuantity,
        couponId,
        notas: notes.trim(),
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
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tu reserva</Text>
        <Text style={styles.subtitle}>
          Recibirás un ticket con un código para mostrarlo en el comercio.
        </Text>

        <View style={styles.card}>
          {product.imagen_url ? (
            <Image source={{ uri: product.imagen_url }} style={styles.image} />
          ) : null}
          <Text style={styles.product}>{product.nombre}</Text>
          <Text style={styles.detail}>{product.nombre_comercio}</Text>
          <View style={styles.quantityRow}>
            <Text style={styles.quantityText}>Cantidad de packs</Text>
            <View style={styles.quantityStepper}>
              <TouchableOpacity style={styles.quantityButton} onPress={() => setSelectedQuantity(q => Math.max(1, q - 1))} disabled={selectedQuantity <= 1} accessibilityLabel="Quitar un pack"><Ionicons name="remove" size={20} color={COLORS.text} /></TouchableOpacity>
              <Text style={styles.quantityNumber}>{selectedQuantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={() => setSelectedQuantity(q => Math.min(Number(product.cantidad_disponible) || 1, q + 1))} disabled={selectedQuantity >= Number(product.cantidad_disponible || 0)} accessibilityLabel="Añadir un pack"><Ionicons name="add" size={20} color={COLORS.text} /></TouchableOpacity>
            </View>
          </View>
          <Text style={styles.detail}>
            Recogida: {product.hora_recogida_inicio || 'Consultar con el comercio'}
            {product.hora_recogida_fin ? ` – ${product.hora_recogida_fin}` : ''}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.totalLabel}>¿Alguna petición para el comercio?</Text>
          <Text style={styles.notice}>Opcional. El comercio la verá junto con tu reserva.</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ej. Sin cebolla, por favor"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            maxLength={500}
            accessibilityLabel="Petición especial para el comercio"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.summaryRow}><Text style={styles.label}>Subtotal</Text><Text style={styles.summaryValue}>${formatPrice(total)} MXN</Text></View>
          <View style={styles.summaryRow}><Text style={styles.label}>Pago en la app</Text><Text style={styles.summaryValue}>$0 MXN</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}><Text style={styles.totalLabel}>A pagar al recoger</Text><Text style={styles.price}>${formatPrice(total)} MXN*</Text></View>
          <Text style={styles.notice}>
            *Antes de aplicar un cupón. Paga en efectivo al recoger; el total definitivo aparece en el ticket.
          </Text>
        </View>
        {coupons.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>Cupón para esta reserva</Text>
            <TouchableOpacity onPress={() => setCouponId(null)} accessibilityRole="radio" accessibilityState={{ selected: couponId === null }}>
              <Text style={styles.detail}>{couponId === null ? '●' : '○'} Sin cupón</Text>
            </TouchableOpacity>
            {coupons.map(coupon => (
              <TouchableOpacity key={coupon.id} onPress={() => setCouponId(coupon.id)} accessibilityRole="radio" accessibilityState={{ selected: couponId === coupon.id }}>
                <Text style={styles.detail}>{couponId === coupon.id ? '●' : '○'} {coupon.name}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.notice}>El descuento y el total definitivo aparecerán en el ticket.</Text>
          </View>
        )}
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
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 30, width: '100%', maxWidth: 620, alignSelf: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { color: COLORS.text, fontSize: 16, marginLeft: 8 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8, marginBottom: 24, lineHeight: 22 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  image: { width: '100%', height: 170, borderRadius: 14, marginBottom: 16 },
  product: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  detail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  quantityText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  quantityStepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primarySoft, borderRadius: 12 },
  quantityButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  quantityNumber: { width: 24, textAlign: 'center', color: COLORS.text, fontWeight: '800' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
  summaryValue: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  totalLabel: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  label: { fontSize: 15, color: COLORS.textSecondary },
  price: { fontSize: 22, fontWeight: '800', color: COLORS.primaryDark },
  notice: { fontSize: 13, lineHeight: 20, color: COLORS.textSecondary, marginTop: 15 },
  notesInput: { minHeight: 86, marginTop: 12, padding: 12, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, color: COLORS.text, backgroundColor: COLORS.background },
  footer: { padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderColor: COLORS.border, width: '100%', maxWidth: 620, alignSelf: 'center' },
  button: { backgroundColor: COLORS.primary, borderRadius: 15, padding: 17, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default PaymentScreen;
