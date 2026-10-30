import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, Image, ScrollView, KeyboardAvoidingView, TextInput, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { publicApi } from '../services/api';
import logger from '../services/logger';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, BORDERS, SHADOWS, SPACING } from '../src/constants/theme';
import GoogleAuthButton from './GoogleAuthButton';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  // Función interna que realiza el inicio de sesión con email y contraseña.
  const doLogin = async (emailToUse, passwordToUse) => {
    if (!emailToUse || !passwordToUse) {
      Alert.alert('⚠️ Error', 'Por favor, introduce tu email y contraseña.');
      return null;
    }

    setLoading(true);
    try {
      const userData = { email: emailToUse, password: passwordToUse };
      const response = await publicApi.post('/auth/login', userData);
      const { token } = response.data || {};

      if (!token || typeof token !== 'string') {
        Alert.alert('❌ Error de Login', 'Respuesta inválida del servidor.');
        return null;
      }

      await signIn(token);
      return token;
    } catch (error) {
      logger.error(error, 'handleLogin');
      // Mejor logging para depuración rápida
      const resp = error?.response;
      const status = resp?.status;
      const backendMsg = resp?.data?.msg || resp?.data || null;

      let message = 'No se pudo conectar con el servidor.';
      // Considerar 400 como credenciales inválidas (muchos endpoints usan 400 para esto)
      if (status === 401 || (status === 400 && backendMsg === 'Credenciales inválidas.')) message = backendMsg || 'Credenciales inválidas.';
      else if (status >= 400 && backendMsg) message = backendMsg;
      else if (error?.message?.includes('Network')) message = 'Problema de red. Verifica tu conexión.';

      Alert.alert('❌ Error de Login', message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    await doLogin(email, password);
  };

  const handleGoogleCredential = async (idToken) => {
    setLoading(true);
    try {
      const response = await publicApi.post('/auth/google', { idToken });
      const token = response.data?.token;
      if (!token || typeof token !== 'string') {
        throw new Error('El servidor no devolvió una sesión válida.');
      }
      await signIn(token);
    } catch (error) {
      const message = error.response?.data?.msg || 'No se pudo verificar tu cuenta de Google.';
      Alert.alert('No se pudo iniciar sesión', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    Alert.alert('Google Sign-In', error?.message || 'No se pudo abrir el acceso de Google.');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView 
          contentContainerStyle={styles.contentContainer} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image source={require('../assets/Crunchy.png')} style={styles.mascot} resizeMode="contain" />
            <Text style={styles.brand}>Delicrunch</Text>
            <Text style={styles.tagline}>Rescata sabor. Recoge cerca de ti.</Text>
          </View>
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>¡Qué gusto verte!</Text>
            <Text style={styles.formSubtitle}>Entra para encontrar packs y gestionar tus reservas.</Text>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                placeholder="tu@correo.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORS.textTertiary}
                style={styles.input}
                editable={!loading}
              />
            </View>

            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={COLORS.textTertiary}
                style={styles.input}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(value => !value)} accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPasswordContainer}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.loginButton, loading && styles.disabled]} onPress={handleLogin} disabled={loading} accessibilityRole="button">
              <Text style={styles.loginButtonText}>{loading ? 'Ingresando…' : 'Iniciar sesión'}</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.loginDivider}>
              <View style={styles.loginDividerLine} />
              <Text style={styles.loginDividerText}>o continúa con</Text>
              <View style={styles.loginDividerLine} />
            </View>
            <GoogleAuthButton disabled={loading} onCredential={handleGoogleCredential} onError={handleGoogleError} />
            <TouchableOpacity style={styles.registerRow} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>¿Aún no tienes cuenta? </Text>
              <Text style={styles.registerLink}>Crear cuenta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  safeArea: { flex: 1 },
  contentContainer: { flexGrow: 1 },
  hero: { minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 24 },
  mascot: { width: 112, height: 112 },
  brand: { color: COLORS.white, fontSize: 34, fontWeight: '800', letterSpacing: -1, marginTop: 4 },
  tagline: { color: COLORS.white, fontSize: 14, marginTop: 5, textAlign: 'center' },
  formSection: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 30, paddingBottom: 36 },
  formTitle: { fontSize: 27, color: COLORS.text, fontWeight: '800' },
  formSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 5, marginBottom: 24, lineHeight: 21 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  inputWrapper: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, marginBottom: 17, backgroundColor: COLORS.surfaceLight },
  input: { flex: 1, minHeight: 50, fontSize: 15, color: COLORS.text },
  forgotPasswordContainer: { alignSelf: 'flex-end', paddingVertical: 4, marginBottom: 20 },
  forgotPasswordText: { color: COLORS.primaryDark, fontSize: 13, fontWeight: '700' },
  loginButton: { minHeight: 54, backgroundColor: COLORS.primary, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  loginButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.6 },
  loginDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  loginDividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  loginDividerText: { color: COLORS.textSecondary, fontSize: 12 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', paddingTop: 25, paddingBottom: 8 },
  registerText: { color: COLORS.textSecondary, fontSize: 14 },
  registerLink: { color: COLORS.primaryDark, fontSize: 14, fontWeight: '800' },
});

export default LoginScreen;
