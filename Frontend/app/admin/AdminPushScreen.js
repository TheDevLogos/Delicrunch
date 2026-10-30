import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { COLORS } from '../../src/constants/theme';

const audienceLabel = { comprador: 'Clientes', comercio: 'Comercios' };

export default function AdminPushScreen() {
  const [audience, setAudience] = useState('comprador');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [devices, setDevices] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get('/push/campaigns');
      setDevices(response.data.devices || []);
      setMessages(response.data.messages || []);
    } catch (error) {
      Alert.alert('No se pudo cargar', error.response?.data?.msg || 'Intenta de nuevo.');
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const send = () => {
    if (!title.trim() || !body.trim()) return Alert.alert('Falta información', 'Escribe título y mensaje.');
    const count = devices.find(item => item.audience === audience)?.devices || 0;
    if (!count) return Alert.alert('Sin dispositivos', `Aún no hay dispositivos de ${audienceLabel[audience].toLowerCase()} registrados.`);
    Alert.alert('Confirmar envío', `Se enviará a ${count} dispositivo${count === 1 ? '' : 's'} de ${audienceLabel[audience].toLowerCase()}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Enviar', onPress: async () => {
        setSending(true);
        try {
          await api.post('/push/campaigns', { audience, title: title.trim(), body: body.trim() });
          setTitle(''); setBody(''); await load();
          Alert.alert('Enviado', 'Consulta el estado de entrega en el historial.');
        } catch (error) { Alert.alert('No se pudo enviar', error.response?.data?.msg || 'Intenta de nuevo.'); }
        finally { setSending(false); }
      } },
    ]);
  };

  const refreshReceipts = async () => {
    setLoading(true);
    try { await api.post('/push/receipts/refresh'); await load(); }
    catch (error) { Alert.alert('No se pudo actualizar', error.response?.data?.msg || 'Intenta de nuevo.'); setLoading(false); }
  };

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
    <Text style={styles.heading}>Enviar notificación</Text>
    <Text style={styles.description}>Aparecerá en los dispositivos Android que instalaron una versión compatible y aceptaron recibir avisos.</Text>
    <View style={styles.segment}>
      {['comprador', 'comercio'].map(role => <TouchableOpacity key={role} accessibilityRole="button" onPress={() => setAudience(role)} style={[styles.segmentButton, audience === role && styles.segmentSelected]}>
        <Text style={[styles.segmentText, audience === role && styles.segmentTextSelected]}>{audienceLabel[role]} · {devices.find(item => item.audience === role)?.devices || 0}</Text>
      </TouchableOpacity>)}
    </View>
    <Text style={styles.label}>Título</Text>
    <TextInput style={styles.input} value={title} onChangeText={setTitle} maxLength={120} placeholder="Una novedad para ti" accessibilityLabel="Título del aviso" />
    <Text style={styles.label}>Mensaje</Text>
    <TextInput style={[styles.input, styles.multiline]} value={body} onChangeText={setBody} maxLength={500} multiline textAlignVertical="top" placeholder="Escribe el aviso" accessibilityLabel="Mensaje del aviso" />
    <TouchableOpacity style={[styles.primary, sending && styles.disabled]} onPress={send} disabled={sending} accessibilityRole="button">
      {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Enviar aviso</Text>}
    </TouchableOpacity>
    <View style={styles.historyHeader}><Text style={styles.heading}>Seguimiento</Text><TouchableOpacity onPress={refreshReceipts} accessibilityRole="button"><Text style={styles.refresh}>Actualizar estados</Text></TouchableOpacity></View>
    <Text style={styles.description}>Aceptada por proveedor significa que el servicio de Android recibió el aviso; la entrega y lectura pueden depender del dispositivo.</Text>
    {messages.length === 0 ? <Text style={styles.empty}>Todavía no hay envíos.</Text> : messages.map(item => <View key={item.id} style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.meta}>{item.kind === 'order' ? 'Pedido automático' : 'Envío manual'} · {audienceLabel[item.audience]} · {new Date(item.created_at).toLocaleString('es-MX')}</Text>
      <Text style={styles.body}>{item.body}</Text>
      <Text style={styles.stats}>Dispositivos: {item.recipient_count}  ·  Aceptadas: {item.accepted}  ·  En espera: {item.awaiting_receipt}  ·  Fallidas: {item.failed}</Text>
    </View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF9F4' }, content: { padding: 20, paddingBottom: 40 },
  heading: { color: '#261A14', fontSize: 22, fontWeight: '800' }, description: { color: '#6D625B', fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 16 },
  segment: { flexDirection: 'row', backgroundColor: '#F2E8DF', borderRadius: 14, padding: 4, marginBottom: 20 }, segmentButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 11 }, segmentSelected: { backgroundColor: COLORS.primary }, segmentText: { color: '#6D625B', fontWeight: '700' }, segmentTextSelected: { color: '#fff' },
  label: { color: '#261A14', fontWeight: '700', marginBottom: 7 }, input: { backgroundColor: '#fff', borderColor: '#E7D9CD', borderWidth: 1, borderRadius: 13, padding: 14, fontSize: 15, marginBottom: 16 }, multiline: { height: 110 },
  primary: { backgroundColor: COLORS.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', minHeight: 50 }, primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 }, disabled: { opacity: 0.6 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }, refresh: { color: COLORS.primary, fontWeight: '800' }, empty: { color: '#6D625B', paddingVertical: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F1E7DE' }, cardTitle: { color: '#261A14', fontSize: 16, fontWeight: '800' }, meta: { color: '#81736B', fontSize: 12, marginTop: 5 }, body: { color: '#50443D', marginTop: 10 }, stats: { color: COLORS.primary, fontWeight: '700', fontSize: 12, marginTop: 12 },
});
