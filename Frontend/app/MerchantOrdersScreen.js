import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import StyledButton from '../components/StyledButton';

// Componente para renderizar cada pedido recibido
// Ahora recibe una función para manejar la actualización del estado
const OrderItem = ({ item, onUpdateStatus }) => (
  <View style={styles.orderItem}>
    <Text style={styles.orderTitle}>{item.nombre_producto}</Text>
    <Text style={styles.orderInfo}>Comprador: {item.nombre_comprador}</Text>
    <Text style={styles.orderCode}>Código de Recogida: {item.codigo_recogida}</Text>
    <Text style={[styles.orderStatus, item.estado === 'Entregado' && styles.deliveredStatus]}>
      Estado: {item.estado}
    </Text>
    {/* Mostramos el botón solo si el pedido no ha sido entregado */}
    {item.estado !== 'Entregado' && (
      <StyledButton
        title="Marcar como Entregado"
        onPress={() => onUpdateStatus(item.id, 'Entregado')}
        variant="success"
        style={styles.actionButton}
        textStyle={styles.actionButtonText}
      />
    )}
  </View>
);

const MerchantOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStoreOrders = async () => {
    try {
      // Esta ruta obtiene los pedidos recibidos por el comercio logueado
      const response = await api.get('/orders/mystoreorders');
      setOrders(response.data);
    } catch (error) {
      console.error("Error al obtener los pedidos de la tienda:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Nueva función para actualizar el estado de un pedido
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      // Hacemos la llamada a la API para actualizar el pedido
      await api.patch(`/orders/${orderId}`, { estado: newStatus });

      // Actualizamos el estado local para que el cambio se vea al instante
      setOrders(currentOrders =>
        currentOrders.map(order =>
          order.id === orderId ? { ...order, estado: newStatus } : order
        )
      );

      Alert.alert('Éxito', 'El pedido ha sido marcado como entregado.');
    } catch (error) {
      console.error("Error al actualizar el estado del pedido:", error.response?.data || error.message);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchStoreOrders();
    }, [])
  );

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <OrderItem item={item} onUpdateStatus={handleUpdateOrderStatus} />}
        ListHeaderComponent={<Text style={styles.title}>Pedidos Recibidos</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>Aún no has recibido ningún pedido.</Text>}
        contentContainerStyle={{ padding: 20 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  orderItem: { backgroundColor: '#fff', padding: 15, marginBottom: 15, borderRadius: 8, elevation: 2 },
  orderTitle: { fontSize: 18, fontWeight: 'bold' },
  orderInfo: { fontSize: 16, color: '#555', marginTop: 5 },
  orderCode: { fontSize: 16, color: '#333', marginTop: 5, fontWeight: '600' },
  orderStatus: { fontSize: 14, fontStyle: 'italic', color: '#28a745', marginTop: 10 },
  deliveredStatus: {
    color: 'gray', // Cambiamos el color para los pedidos ya entregados
  },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
  actionButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
  actionButtonText: {
    fontSize: 14,
  },
});

export default MerchantOrdersScreen;