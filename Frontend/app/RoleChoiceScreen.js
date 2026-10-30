import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AuthVideoBackground from '../components/AuthVideoBackground';
import { COLORS } from '../src/constants/theme';

export default function RoleChoiceScreen() {
  const { chooseRole, signOut } = useAuth();
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');

  const selectRole = async rol => {
    if (saving) return;
    setSaving(true);
    try {
      await chooseRole(rol, rol === 'comercio' ? {
        nombre_comercio: storeName.trim(),
        direccion: storeAddress.trim(),
        telefono: storePhone.trim(),
      } : undefined);
    } catch (error) {
      Alert.alert('No se pudo guardar tu elección', error.response?.data?.msg || error.message || 'Inténtalo otra vez.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <AuthVideoBackground />
      <StatusBar barStyle="light-content" backgroundColor="#25150D" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Image source={require('../assets/Crunchy.png')} resizeMode="contain" style={styles.mascot} />
          <Text style={styles.brand}>Delicrunch</Text>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>UN PASO MÁS</Text>
            <Text style={styles.title}>¿Cómo usarás Delicrunch?</Text>
            <Text style={styles.subtitle}>Elige el tipo de cuenta para preparar tu espacio. Esta elección quedará ligada a tu perfil.</Text>
            <TouchableOpacity style={styles.option} onPress={() => selectRole('comprador')} disabled={saving} accessibilityRole="button" accessibilityLabel="Continuar como cliente">
              <View style={styles.icon}><Ionicons name="bag-handle-outline" size={27} color={COLORS.white} /></View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Soy cliente</Text>
                <Text style={styles.optionText}>Explorar packs, reservar y recoger.</Text>
              </View>
              <Ionicons name="arrow-forward" size={21} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => setSelectedRole('comercio')} disabled={saving} accessibilityRole="button" accessibilityLabel="Continuar como comercio">
              <View style={styles.icon}><Ionicons name="storefront-outline" size={27} color={COLORS.white} /></View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Soy comercio</Text>
                <Text style={styles.optionText}>Crear mi tienda y ofrecer productos.</Text>
              </View>
              <Ionicons name="arrow-forward" size={21} color={COLORS.white} />
            </TouchableOpacity>
            {selectedRole === 'comercio' && (
              <View style={styles.storeForm}>
                <Text style={styles.formTitle}>Cuéntanos de tu comercio</Text>
                <TextInput style={styles.input} placeholder="Nombre del comercio" placeholderTextColor="rgba(255,255,255,0.6)" value={storeName} onChangeText={setStoreName} maxLength={120} accessibilityLabel="Nombre del comercio" />
                <TextInput style={styles.input} placeholder="Dirección" placeholderTextColor="rgba(255,255,255,0.6)" value={storeAddress} onChangeText={setStoreAddress} maxLength={250} accessibilityLabel="Dirección del comercio" />
                <TextInput style={styles.input} placeholder="Teléfono" placeholderTextColor="rgba(255,255,255,0.6)" value={storePhone} onChangeText={setStorePhone} keyboardType="phone-pad" maxLength={40} accessibilityLabel="Teléfono del comercio" />
                <TouchableOpacity style={styles.continueButton} onPress={() => selectRole('comercio')} disabled={saving || !storeName.trim() || !storeAddress.trim() || !storePhone.trim()} accessibilityRole="button">
                  <Text style={styles.continueText}>Crear mi comercio</Text>
                </TouchableOpacity>
              </View>
            )}
            {saving && <ActivityIndicator color={COLORS.white} style={styles.spinner} />}
            <TouchableOpacity onPress={signOut} disabled={saving} style={styles.back} accessibilityRole="button">
              <Text style={styles.backText}>Usar otra cuenta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#25150D' },
  safeArea: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  mascot: { width: 190, height: 190 },
  brand: { color: COLORS.white, fontSize: 32, fontWeight: '800', marginBottom: 20 },
  card: { width: '100%', maxWidth: 500, padding: 24, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(31,19,12,0.82)' },
  eyebrow: { color: '#FFD4B5', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: COLORS.white, fontSize: 27, fontWeight: '800', marginTop: 8 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 23 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 82, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.14)', padding: 13, marginBottom: 12 },
  icon: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  optionCopy: { flex: 1 },
  optionTitle: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  optionText: { color: 'rgba(255,255,255,0.78)', fontSize: 13, marginTop: 3 },
  storeForm: { marginTop: 8 },
  formTitle: { color: COLORS.white, fontSize: 17, fontWeight: '800', marginBottom: 11 },
  input: { color: COLORS.white, minHeight: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)', borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.13)', paddingHorizontal: 14, marginBottom: 10 },
  continueButton: { minHeight: 52, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  continueText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  spinner: { marginTop: 8 },
  back: { alignItems: 'center', paddingTop: 14 },
  backText: { color: '#FFD4B5', fontWeight: '700' },
});
