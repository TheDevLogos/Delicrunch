import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StyledTextInput from '../components/StyledTextInput';
import NeoButton from '../components/NeoButton';
import Header from './components/Header';
import PromoCard from './components/PromoCard';
import GradientButton from './components/GradientButton';
import api from '../services/api';
import FormError from '../components/FormError';
import logger from '../services/logger';
import { COLORS, TYPOGRAPHY, BORDERS, SHADOWS, SPACING } from '../src/constants/theme';

const RegisterScreen = ({ navigation }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [rol, setRol] = useState('comprador');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (!nombre || !email || !password || !confirmPassword || !rol) { 
      setError('Por favor, completa todos los campos y selecciona un rol.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, introduce una dirección de correo electrónico válida.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const userData = { nombre, email, password, rol };
      console.log('Enviando datos al backend:', userData);

      const response = await api.post('/auth/register', userData);
      console.log('Respuesta del backend:', response.data);

      Alert.alert(
        '✅ ¡Registro Exitoso!',
        'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.'
      );
      navigation.navigate('Login');

    } catch (error) {
      logger.error(error, 'handleRegister');
      if (error.response && error.response.data.msg) {
        setError(error.response.data.msg);
      } else {
        setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          {/* Title Section */}
          <Header large />
          <PromoCard />

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Full Name Input */}
            <View style={styles.inputWrapper}>
              <StyledTextInput
                placeholder="👤 Nombre"
                value={nombre}
                onChangeText={setNombre}
                placeholderTextColor={COLORS.text}
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <StyledTextInput
                placeholder="📧 Email"
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

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <StyledTextInput
                placeholder="🔐 Confirmar"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor={COLORS.text}
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Role Selector - Comprimido */}
            <View style={styles.roleSelectorContainer}>
              <Text style={styles.roleSelectorLabel}>Registro como:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    rol === 'comprador' && styles.roleButtonSelected,
                  ]}
                  onPress={() => setRol('comprador')}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      rol === 'comprador' && styles.roleButtonTextSelected,
                    ]}
                  >
                    🛍️ Comprador
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    rol === 'comercio' && styles.roleButtonSelected,
                  ]}
                  onPress={() => setRol('comercio')}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      rol === 'comercio' && styles.roleButtonTextSelected,
                    ]}
                  >
                    🏪 Comercio
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error && <FormError error={error} />}

            {/* Register Button */}
            <View style={styles.buttonContainer}>
              <GradientButton
                title={loading ? '⏳ Registrando...' : '✨ CREAR'}
                onPress={handleRegister}
                style={styles.registerButton}
                disabled={loading}
                iconName="sparkles"
              />
            </View>

            {/* Login Link Button */}
            <NeoButton
              title="🔑 YA TENGO CUENTA"
              onPress={() => navigation.navigate('Login')}
              variant="secondary"
              style={styles.loginButton}
            />
          </View>
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
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.25,
  },
  title: {
    flex: 0,
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 2,
    ...TYPOGRAPHY.bold,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: SPACING.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formSection: {
      flexGrow: 1,
      justifyContent: 'flex-start',
      paddingBottom: SPACING.lg,
  },
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
  roleSelectorContainer: {
    marginVertical: SPACING.sm,
  },
  roleSelectorLabel: {
    fontSize: 12,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  roleButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  roleButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleButtonText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  roleButtonTextSelected: {
    color: COLORS.background,
  },
  buttonContainer: {
    marginVertical: SPACING.sm,
  },
  registerButton: {
    marginVertical: SPACING.sm,
    borderRadius: 12,
    paddingVertical: 12,
  },
  loginButton: {
    marginVertical: SPACING.sm,
    borderRadius: 12,
    paddingVertical: 12,
  },
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
});

export default RegisterScreen;