import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api'; // El interceptor se encarga del token

const OrderItem = ({ item }) => (
  <View style={styles.orderItem}>
    <Text style={styles.orderTitle}>{item.nombre_producto}</Text>
    <Text style={styles.orderInfo}>Comprador: {item.nombre_comprador}</Text>
    <Text style={styles.orderCode}>Código de Recogida: {item.codigo_recogida}</Text>
    <Text style={styles.orderStatus}>Estado: {item.estado}</Text>
  </View>
);

const StoreOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStoreOrders = async () => {
    try {
      // LLAMADA SIMPLIFICADA
      const response = await api.get('/orders/mystoreorders');
      setOrders(response.data);
    } catch (error) {
      console.error("Error al obtener los pedidos de la tienda:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
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
        renderItem={({ item }) => <OrderItem item={item} />}
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
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});

export default StoreOrdersScreen;