import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, Image, ScrollView, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StyledTextInput from '../components/StyledTextInput';
import NeoButton from '../components/NeoButton';
import api, { publicApi } from '../services/api';
import logger from '../services/logger';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, BORDERS, SHADOWS, SPACING } from '../src/constants/theme';
import Header from './components/Header';
import PromoCard from './components/PromoCard';
import GradientButton from './components/GradientButton';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  // Función interna que realiza el login dado email y password (útil para quickLogin)
  const doLogin = async (emailToUse, passwordToUse) => {
    if (!emailToUse || !passwordToUse) {
      Alert.alert('⚠️ Error', 'Por favor, introduce tu email y contraseña.');
      return null;
    }

    setLoading(true);
    try {
      const userData = { email: emailToUse, password: passwordToUse };
      console.log('Enviando credenciales:', userData);
      const response = await publicApi.post('/auth/login', userData);
      console.log('Respuesta login:', { status: response.status, data: response.data });
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
      console.log('API login error details:', {
        status: status,
        data: resp?.data,
        headers: resp?.headers,
        url: resp?.config?.url,
      });

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

  // Quick login helpers (solo visibles en desarrollo)
  const quickLogin = async (preset) => {
    const presets = {
      comprador: { email: 'ana.delicias@test.com', password: 'Comprador123' },
      comercio: { email: 'pizza.orsinis@delicrunch.com', password: 'Comercio123' },
      admin: { email: 'admindeli@delicrunch.com', password: 'Admin1234' },
    };
    const creds = presets[preset];
    if (!creds) return;
    setEmail(creds.email);
    setPassword(creds.password);
    await doLogin(creds.email, creds.password);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          {/* Title Section */}
          <Header large />
          <PromoCard />

          {/* Login Form Section */}
          <View style={styles.formSection}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <StyledTextInput
                placeholder="📧 Correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORS.text}
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <StyledTextInput
                placeholder="🔐 Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={COLORS.text}
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Login Button */}
            <View style={styles.buttonContainer}>
              <GradientButton
                title={loading ? '⏳ Cargando...' : '🚀 RESCATAR COMIDA AHORA'}
                onPress={handleLogin}
                style={styles.loginButton}
                disabled={loading}
                iconName="rocket"
              />
            </View>

            {/* Quick Login Buttons (dev only) */}
            {__DEV__ && (
              <View style={styles.quickLoginContainer}>
                <Text style={styles.devNote}>Modo desarrollo: Inicia sesión rápido:</Text>
                <View style={styles.quickButtonsRow}>
                  <TouchableOpacity onPress={() => quickLogin('comprador')} style={styles.quickButton}>
                    <Text style={styles.quickButtonText}>Comprador</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => quickLogin('comercio')} style={styles.quickButton}>
                    <Text style={styles.quickButtonText}>Comercio</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => quickLogin('admin')} style={styles.quickButton}>
                    <Text style={styles.quickButtonText}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Forgot Password Link */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPasswordContainer}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* Register Button */}
            <NeoButton
              title="✨ CREAR UNA CUENTA"
              onPress={() => navigation.navigate('Register')}
              variant="secondary"
              style={styles.registerButton}
              noShadow={true}
            />
          </View>
          {/* spacer to ensure register button is visible above keyboard */}
          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },

  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },

  // TITLE SECTION
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.8,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  
  // LOGO - Sin cuadro, más grande, debajo del título
  headerTop: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.md,
  },
  topLogo: {
    width: 120,
    height: 120,
    marginBottom: SPACING.xs,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: 0.3,
  },

  promoCard: {
    backgroundColor: '#f6fffa',
    borderRadius: 14,
    padding: SPACING.md,
    marginTop: -SPACING.lg, // más pegado a las letras
    marginBottom: SPACING.md,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#e6f6ee',
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#b85b12',
    textAlign: 'center',
    marginBottom: 6,
  },
  promoSubtitle: {
    fontSize: 13,
    color: '#556',
    textAlign: 'center',
    marginBottom: 8,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  expValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#d95b1f',
    marginRight: 8,
  },
  expLabelCol: {
    alignItems: 'flex-start',
  },
  expLabel: {
    fontSize: 11,
    color: '#444',
    fontWeight: '700',
  },
  heroLabel: {
    fontSize: 11,
    color: '#444',
    fontWeight: '600',
  },

  quickLoginContainer: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderRadius: BORDERS.radius.small,
    backgroundColor: COLORS.surface,
  },
  devNote: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  quickButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radius.small,
    alignItems: 'center',
  },
  quickButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },

  // FORM SECTION
  formSection: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: SPACING.lg,
  },

  // INPUT WRAPPER - Sin bordes coloreados, solo marco negro
  inputWrapper: {
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: BORDERS.width,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.border,
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  // BUTTON CONTAINER
  buttonContainer: {
    marginVertical: SPACING.md,
  },
  loginButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
  },

  // FORGOT PASSWORD
  forgotPasswordContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // REGISTER BUTTON
  registerButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: SPACING.lg,
  },
});

export default LoginScreen;
