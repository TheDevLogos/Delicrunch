import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { navigationRef } from '../navigation/navigationRef';
import { emitNewOrder } from '../services/orderEvents';
import api from '../services/api';
import { COLORS } from '../src/constants/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

const PUSH_TOKEN_KEY = '@delicrunch_push_token';

export default function PushBridge() {
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const enabled = Platform.OS === 'android' && user && !user.onboarding_required && ['comprador', 'comercio'].includes(user.rol);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    const register = async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('orders', {
            name: 'Pedidos nuevos', importance: Notifications.AndroidImportance.MAX,
            sound: 'default', vibrationPattern: [0, 250, 180, 250],
          });
          await Notifications.setNotificationChannelAsync('general', {
            name: 'Novedades de Delicrunch', importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
          });
        }
        let permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
        if (!permission.granted || cancelled) return;
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
        if (!projectId) throw new Error('Falta el identificador de Expo.');
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (cancelled) return;
        await api.put('/push/devices', { token, platform: Platform.OS });
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      } catch (error) {
        console.warn('No se pudo registrar este dispositivo para avisos:', error.message);
      }
    };
    register();
    return () => { cancelled = true; };
  }, [enabled, user?.id]);

  useEffect(() => {
    if (user?.rol !== 'comercio' || user.onboarding_required) return undefined;
    let active = true;
    const openOrder = async response => {
      const data = response?.notification?.request?.content?.data;
      const orderId = Number(data?.orderId);
      if (data?.type !== 'merchant_order' || !Number.isSafeInteger(orderId) || orderId <= 0) return;
      emitNewOrder();
      try {
        const result = await api.get(`/orders/${orderId}/merchant`);
        if (active) setOrder(result.data);
      } catch (error) {
        console.warn('No se pudo abrir el pedido:', error.message);
      }
      await Notifications.clearLastNotificationResponseAsync();
    };
    const received = Notifications.addNotificationReceivedListener(notification => {
      if (notification.request.content.data?.type === 'merchant_order') emitNewOrder();
    });
    const responses = Notifications.addNotificationResponseReceivedListener(openOrder);
    Notifications.getLastNotificationResponseAsync().then(openOrder).catch(() => {});
    return () => { active = false; received.remove(); responses.remove(); };
  }, [user?.id, user?.rol, user?.onboarding_required]);

  const goToOrders = () => {
    setOrder(null);
    if (navigationRef.isReady()) navigationRef.navigate('MainTabs', { screen: 'Pedidos' });
  };
  const prepare = async () => {
    if (!order || busy) return;
    setBusy(true);
    try {
      if (order.estado === 'confirmado') await api.patch(`/orders/${order.id}`, { estado: 'en_preparacion' });
      emitNewOrder();
      goToOrders();
    } catch (error) {
      console.warn('No se pudo iniciar la preparación:', error.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal visible={Boolean(order)} transparent animationType="fade" onRequestClose={() => setOrder(null)}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.center}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>NUEVO PEDIDO</Text>
            <Text style={styles.title}>Prepara esta reserva</Text>
            <Text style={styles.reference}>{order?.ticket_reference}</Text>
            <Text style={styles.row}>Producto: {order?.nombre_producto} × {order?.cantidad}</Text>
            <Text style={styles.row}>Cliente: {order?.nombre_comprador}</Text>
            <Text style={styles.row}>Hora: {order?.created_at ? new Date(order.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</Text>
            <Text style={styles.row}>Precio apartado: ${Number(order?.total || 0).toFixed(2)} MXN</Text>
            <Text style={styles.noteLabel}>Petición especial</Text>
            <Text style={styles.note}>{order?.notas || 'Sin peticiones adicionales.'}</Text>
            <Text style={styles.hint}>Solicita al cliente su código privado al entregar el pedido.</Text>
            <TouchableOpacity style={styles.button} onPress={prepare} disabled={busy} accessibilityRole="button">
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{order?.estado === 'confirmado' ? 'Comenzar a preparar' : 'Ver en pedidos'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.close} onPress={() => setOrder(null)} accessibilityRole="button"><Text style={styles.closeText}>Cerrar</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(24,16,12,0.74)' }, center: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: '#fff', padding: 24, borderRadius: 24 },
  eyebrow: { color: COLORS.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: COLORS.text, fontSize: 25, fontWeight: '800', marginTop: 5 },
  reference: { color: COLORS.primaryDark, fontSize: 19, fontWeight: '800', marginVertical: 15 },
  row: { color: COLORS.text, fontSize: 15, marginBottom: 10 }, noteLabel: { color: COLORS.text, fontWeight: '800', marginTop: 8 },
  note: { color: COLORS.textSecondary, lineHeight: 21, marginTop: 5 }, hint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 16 },
  button: { backgroundColor: COLORS.primary, borderRadius: 14, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 }, close: { alignItems: 'center', padding: 15 }, closeText: { color: COLORS.textSecondary, fontWeight: '700' },
});
