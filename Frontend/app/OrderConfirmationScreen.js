import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice } from '../src/utils/format';
import { COLORS } from '../src/constants/theme';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { order, product } = route.params || {};

  if (!order?.id || !order?.codigo_recogida) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>El ticket no está disponible. Consulta Mis pedidos.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyOrders')}>
          <Text style={styles.link}>Ver mis pedidos</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.icon}>
          <Ionicons name="ticket-outline" size={42} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Reserva confirmada</Text>
        <Text style={styles.subtitle}>Ticket #{order.id}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Código para recoger</Text>
          <Text style={styles.code} selectable>{order.codigo_recogida}</Text>
          <Text style={styles.help}>Muéstralo al comercio al momento de la entrega.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.product}>{order.nombre_producto || product?.nombre}</Text>
          <Text style={styles.detail}>{order.nombre_comercio || product?.nombre_comercio}</Text>
          <Text style={styles.detail}>Cantidad: {order.cantidad || 1}</Text>
          <Text style={styles.detail}>
            Recogida: {product?.hora_recogida_inicio || 'Consultar con el comercio'}
            {product?.hora_recogida_fin ? ` – ${product.hora_recogida_fin}` : ''}
          </Text>
          <Text style={styles.price}>${formatPrice(order.total)} MXN</Text>
          <Text style={styles.help}>Paga en efectivo directamente en el comercio. Delicrunch no procesó ningún pago.</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MyOrders')}>
          <Text style={styles.buttonText}>Ver mis pedidos</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { padding: 20, alignItems: 'stretch' },
  icon: { alignItems: 'center', marginTop: 15 },
  title: { fontSize: 27, fontWeight: '800', textAlign: 'center', color: COLORS.text, marginTop: 12 },
  subtitle: { textAlign: 'center', color: COLORS.textSecondary, marginBottom: 22 },
  card: { backgroundColor: COLORS.white, padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  label: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 15 },
  code: { textAlign: 'center', fontSize: 35, fontWeight: '800', letterSpacing: 3, color: COLORS.primaryDark, marginVertical: 12 },
  help: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8 },
  product: { color: COLORS.text, fontSize: 19, fontWeight: '700', marginBottom: 8 },
  detail: { color: COLORS.textSecondary, fontSize: 15, marginTop: 5 },
  price: { color: COLORS.primaryDark, fontSize: 25, fontWeight: '800', marginTop: 20 },
  button: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: COLORS.primary, marginTop: 15, fontSize: 16 },
});

export default OrderConfirmationScreen;
