import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../services/api';
import { COLORS } from '../src/constants/theme';

const PickupVerificationModal = ({ orderId, onClose, onVerified, onError }) => {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    if (!code.trim() || busy) return;
    setBusy(true);
    try {
      await api.patch(`/orders/${orderId}`, {
        estado: 'recogido',
        codigo_recogida: code.trim().toUpperCase(),
      });
      setCode('');
      onVerified();
    } catch (error) {
      onError(error.response?.data?.msg || 'No se pudo verificar el código.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={Boolean(orderId)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Verificar entrega</Text>
          <Text style={styles.help}>
            Pide al cliente el código de su ticket. El pago en efectivo se realiza directamente en el comercio.
          </Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="Código del cliente"
            accessibilityLabel="Código del ticket"
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} disabled={busy}>
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={verify} disabled={busy || !code.trim()}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verificar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  card: { backgroundColor: COLORS.white, padding: 22, borderRadius: 20 },
  title: { fontSize: 21, fontWeight: '800', color: COLORS.text },
  help: { fontSize: 15, lineHeight: 21, color: COLORS.textSecondary, marginTop: 10 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, padding: 13, marginTop: 18, fontSize: 17 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20, marginTop: 20 },
  cancel: { color: COLORS.textSecondary, fontSize: 16 },
  button: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  buttonText: { color: '#fff', fontWeight: '700' },
});

export default PickupVerificationModal;
