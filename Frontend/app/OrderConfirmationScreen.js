import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import StyledButton from '../components/StyledButton';

// La pantalla recibirá los detalles del pedido a través de los parámetros de la ruta.
const OrderConfirmationScreen = ({ route, navigation }) => {
  // Extraemos el objeto 'order' que le pasaremos al navegar a esta pantalla.
  const { order } = route.params;

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error: No se encontraron los detalles del pedido.</Text>
      </SafeAreaView>
    );
  }
 // La nueva función para manejar el botón
  const handleGoHome = () => {
    // El método reset() borra todo el historial de navegación actual (ProductDetail, OrderConfirmation)
    // y lo reemplaza con un nuevo estado.
    navigation.reset({
      index: 0, // La pantalla activa será la primera de la lista.
      routes: [{ name: 'MainTabs' }], // La ruta correcta que contiene los navegadores de pestañas.
    });
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>¡Pedido Confirmado!</Text>
        <Text style={styles.subtitle}>
          ¡Gracias por salvar esta comida! Muestra el siguiente código en la tienda para recoger tu pack.
        </Text>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Tu Código de Recogida</Text>
          <Text style={styles.pickupCode}>{order.codigo_recogida}</Text>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.detailTitle}>Resumen del Pedido</Text>
          <Text style={styles.detailText}>ID del Pedido: {order.id}</Text>
          <Text style={styles.detailText}>Total Pagado: ${order.precio_total}</Text>
          <Text style={styles.detailText}>Fecha: {new Date(order.fecha_pedido).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        {/* Este botón llevará al usuario de vuelta a la pantalla principal. */}
        <StyledButton
          title="Volver al Inicio"
          onPress={handleGoHome}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 30,
  },
  codeContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  codeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  pickupCode: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 2,
  },
  orderDetails: {
    width: '100%',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  footer: {
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
});

export default OrderConfirmationScreen;