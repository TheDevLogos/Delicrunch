import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import StyledButton from '../components/StyledButton';
import logger from '../services/logger';

// Componente para renderizar cada pedido
const OrderItem = ({ item }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.orderItem}>
      <Text style={styles.orderTitle}>{item.nombre_producto}</Text>
      <Text style={styles.orderStore}>{item.nombre_comercio}</Text>
      <Text style={[styles.orderStatus, item.estado === 'Entregado' && styles.deliveredStatus]}>
        Estado: {item.estado}
      </Text>
      <Text style={styles.orderPrice}>Total: ${item.precio_total}</Text>
      <Text style={styles.orderDate}>Fecha: {new Date(item.fecha_pedido).toLocaleDateString()}</Text>
      {/* Mostramos el botón solo si el pedido fue entregado y no tiene reseña */}
      {item.estado === 'Entregado' && !item.tiene_resena && (
        <StyledButton
          title="Dejar Reseña"
          onPress={() => navigation.navigate('LeaveReviewScreen', { orderId: item.id, productId: item.producto_id })}
          variant="secondary"
          style={{ marginTop: 15, height: 40, borderWidth: 1 }}
          textStyle={{ fontWeight: '500' }}
        />
      )}
    </View>
  );
};

const MyOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/myorders');
      setOrders(response.data);
    } catch (error) {
      logger.error(error, 'fetchOrders');
      Alert.alert("Error", "No se pudieron cargar tus pedidos.");
    } finally {
      setIsLoading(false);
    }
  };

  // useFocusEffect se ejecuta cada vez que la pantalla entra en foco.
  // Es mejor que useEffect para listas que necesitan estar actualizadas.
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchOrders();
    }, [])
  );

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <OrderItem item={item} />}
        ListHeaderComponent={<Text style={styles.title}>Mi Historial de Pedidos</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>Aún no has realizado ningún pedido.</Text>}
        contentContainerStyle={{ padding: 20 }}
      />
    </SafeAreaView>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  orderItem: { backgroundColor: '#fff', padding: 15, marginBottom: 15, borderRadius: 8, elevation: 2 },
  orderTitle: { fontSize: 18, fontWeight: 'bold' },
  orderStore: { fontSize: 16, color: '#555', marginTop: 5 },
  orderStatus: { fontSize: 14, fontStyle: 'italic', color: '#007bff', marginTop: 10 },
  deliveredStatus: {
    color: 'gray', // Color para los pedidos ya entregados
  },
  orderPrice: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  orderDate: { fontSize: 14, color: '#888', marginTop: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});

export default MyOrdersScreen;