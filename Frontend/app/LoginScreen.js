import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StyledTextInput from '../components/StyledTextInput';
import NeoButton from '../components/NeoButton';
import api from '../services/api';
import logger from '../services/logger';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, BORDERS, SHADOWS, SPACING } from '../src/constants/theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, introduce tu email y contraseña.');
      return;
    }

    try {
      const userData = { email, password };
      console.log('Enviando credenciales:', userData);
      const response = await api.post('/auth/login', userData);
      const { token } = response.data;

      signIn(token);

    } catch (error) {
      logger.error(error, 'handleLogin');
      if (error.response && error.response.data.msg) {
        Alert.alert('Error de Login', error.response.data.msg);
      } else {
        Alert.alert('Error de Login', 'No se pudo conectar con el servidor.');
      }
    }
  };

  // Mascot Component with Sandwich Icon
  const Mascot = () => (
    <View style={styles.mascotContainer}>
      <View style={styles.mascot}>
        <Ionicons name="restaurant-outline" size={40} color={COLORS.primary} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Mascot />

      <View style={styles.titleContainer}>
        <Text style={styles.title}>DELICRUNCH</Text>
        <Text style={styles.subtitle}>Rescata comida, contribuye al medio ambiente{'\n'}a un super precio</Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputShadow} />
          <StyledTextInput
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.inputWrapper}>
          <View style={styles.inputShadow} />
          <StyledTextInput
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
        </View>
      </View>

      <NeoButton title="Continuar" onPress={handleLogin} style={styles.loginButton} />

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPasswordContainer}>
        <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <NeoButton
        title="Crear una cuenta"
        onPress={() => navigation.navigate('Register')}
        variant="secondary"
        style={styles.registerButton}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  mascotContainer: {
    marginBottom: SPACING.xl,
  },
  mascot: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.white,
    borderWidth: BORDERS.width,
    borderColor: COLORS.border,
    borderRadius: BORDERS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: SHADOWS.hard.color,
        shadowOffset: {
          width: SHADOWS.hard.offset,
          height: SHADOWS.hard.offset,
        },
        shadowOpacity: SHADOWS.hard.opacity,
        shadowRadius: SHADOWS.hard.radius,
      },
      android: {
        elevation: SHADOWS.hard.elevation,
      },
    }),
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.title,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    textAlign: 'center',
    textTransform: TYPOGRAPHY.textTransform.uppercase,
    ...Platform.select({
      ios: {
        textShadowColor: COLORS.border,
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
      },
      android: {
        textShadowColor: COLORS.border,
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
      },
    }),
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.body,
    color: COLORS.secondary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  inputShadow: {
    position: 'absolute',
    top: SHADOWS.hard.offset,
    left: SHADOWS.hard.offset,
    right: 0,
    bottom: 0,
    backgroundColor: SHADOWS.hard.color,
    borderRadius: BORDERS.radius.small,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: BORDERS.width,
    borderColor: COLORS.border,
    borderRadius: BORDERS.radius.small,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.body,
    ...Platform.select({
      ios: {
        shadowColor: SHADOWS.hard.color,
        shadowOffset: {
          width: SHADOWS.hard.offset,
          height: SHADOWS.hard.offset,
        },
        shadowOpacity: SHADOWS.hard.opacity,
        shadowRadius: SHADOWS.hard.radius,
      },
      android: {
        elevation: SHADOWS.hard.elevation,
      },
    }),
  },
  loginButton: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  forgotPasswordContainer: {
    marginBottom: SPACING.xl,
  },
  forgotPasswordText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.body,
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  registerButton: {
    width: '100%',
  },
});

export default LoginScreen;
