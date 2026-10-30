import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { publicApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AuthVideoBackground from '../components/AuthVideoBackground';
import { COLORS } from '../src/constants/theme';

export default function RegisterScreen({ navigation }) {
  const { signIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const register = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) return Alert.alert('Faltan datos', 'Completa todos los campos.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return Alert.alert('Correo inválido', 'Escribe un correo electrónico válido.');
    if (password.length < 6 || password !== confirmPassword) return Alert.alert('Revisa tu contraseña', password.length < 6 ? 'Usa al menos 6 caracteres.' : 'Las contraseñas no coinciden.');
    setLoading(true);
    try {
      const response = await publicApi.post('/auth/register', { nombre: name.trim(), email: email.trim().toLowerCase(), password });
      if (!response.data?.token) throw new Error('No se pudo iniciar la sesión.');
      await signIn(response.data.token);
    } catch (error) {
      Alert.alert('No se pudo crear tu cuenta', error.response?.data?.msg || error.message || 'Inténtalo de nuevo.');
    } finally { setLoading(false); }
  };
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <AuthVideoBackground />
      <StatusBar barStyle="light-content" backgroundColor="#25150D" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image source={require('../assets/Crunchy.png')} resizeMode="contain" style={styles.mascot} />
          <Text style={styles.brand}>Delicrunch</Text>
          <View style={styles.card}>
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Al entrar elegirás si usarás Delicrunch como cliente o comercio.</Text>
            <Text style={styles.label}>Tu nombre</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="¿Cómo te llamas?" placeholderTextColor="rgba(255,255,255,0.6)" autoComplete="name" editable={!loading} />
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="tu@correo.com" placeholderTextColor="rgba(255,255,255,0.6)" keyboardType="email-address" autoCapitalize="none" autoComplete="email" editable={!loading} />
            <Text style={styles.label}>Contraseña</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor="rgba(255,255,255,0.6)" secureTextEntry autoComplete="new-password" editable={!loading} />
            <Text style={styles.label}>Confirma la contraseña</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repite la contraseña" placeholderTextColor="rgba(255,255,255,0.6)" secureTextEntry editable={!loading} />
            <TouchableOpacity style={styles.button} onPress={register} disabled={loading} accessibilityRole="button">
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Crear cuenta</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('Login')} disabled={loading} accessibilityRole="button">
              <Text style={styles.backText}>Ya tengo cuenta · Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#25150D' }, safeArea: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  mascot: { width: 150, height: 150 }, brand: { color: COLORS.white, fontSize: 31, fontWeight: '800', marginBottom: 16 },
  card: { width: '100%', maxWidth: 480, padding: 24, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(31,19,12,0.82)' },
  title: { color: COLORS.white, fontSize: 27, fontWeight: '800' }, subtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 20 },
  label: { color: COLORS.white, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: { color: COLORS.white, minHeight: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)', borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.13)', paddingHorizontal: 14, marginBottom: 15 },
  button: { minHeight: 54, borderRadius: 15, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '800' }, back: { alignItems: 'center', paddingTop: 22 }, backText: { color: '#FFD4B5', fontWeight: '700' },
});
