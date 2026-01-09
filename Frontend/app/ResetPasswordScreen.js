import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StyledTextInput from '../components/StyledTextInput';
import NeoButton from '../components/NeoButton';
import api from '../services/api';
import logger from '../services/logger';
import { COLORS, TYPOGRAPHY, BORDERS, SHADOWS, SPACING } from '../src/constants/theme';

const ResetPasswordScreen = ({ route, navigation }) => {
  const { token } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('⚠️ Error', 'Por favor, completa ambos campos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('⚠️ Error', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('⚠️ Error', 'Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });

      Alert.alert(
        '✅ ¡Éxito!',
        'Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión con tu nueva contraseña.'
      );
      navigation.navigate('Login');

    } catch (error) {
      logger.error(error, 'handleResetPassword');
      Alert.alert('❌ Error', error.response?.data?.msg || 'El enlace de recuperación es inválido o ha expirado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>NUEVA</Text>
            <Text style={styles.title}>CONTRASEÑA</Text>
            <Text style={styles.subtitle}>Crea una nueva contraseña segura</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.passwordInputContainer}>
                <StyledTextInput
                  placeholder="🔐 Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={COLORS.text}
                  style={styles.input}
                  editable={!isSubmitting}
                />
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={COLORS.primary}
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                />
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.passwordInputContainer}>
                <StyledTextInput
                  placeholder="🔐 Confirmar"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor={COLORS.text}
                  style={styles.input}
                  editable={!isSubmitting}
                />
                <Ionicons
                  name={showConfirmPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={COLORS.primary}
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </View>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>Requisitos:</Text>
              <Text style={[styles.requirementText, password.length >= 6 && styles.requirementMet]}>
                {password.length >= 6 ? '✓' : '○'} Mínimo 6 caracteres
              </Text>
              <Text style={[styles.requirementText, password === confirmPassword && password && styles.requirementMet]}>
                {password === confirmPassword && password ? '✓' : '○'} Coinciden
              </Text>
            </View>

            {/* Reset Button */}
            <View style={styles.buttonContainer}>
              <NeoButton 
                title={isSubmitting ? "⏳ Actualizando..." : "✅ RESTABLECER"} 
                onPress={handleResetPassword}
                style={styles.resetButton}
                disabled={isSubmitting}
              />
            </View>

            {/* Back to Login */}
            <NeoButton
              title="🔑 VOLVER AL LOGIN"
              onPress={() => navigation.navigate('Login')}
              variant="secondary"
              style={styles.backButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
      flex: 0.75,
      justifyContent: 'center',
      gap: SPACING.sm,
  safeArea: {
    flex: 1,
      position: 'relative',
      marginBottom: SPACING.sm,
  content: {
    flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: COLORS.border,
      borderRadius: 4,
      paddingRight: SPACING.md,
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: 1,
          shadowRadius: 0,
        },
        android: {
          elevation: 6,
        },
      }),
    flex: 0.25,
  },
      flex: 1,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontSize: 14,
      color: COLORS.text,
    letterSpacing: 2,
    ...TYPOGRAPHY.bold,
    fontStyle: 'italic',
  },
  formSection: {
    flex: 0.75,
    justifyContent: 'center',
    gap: SPACING.md,
  },
  inputWrapper: {
    position: 'relative',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingRight: SPACING.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
  },
  eyeIcon: {
    padding: SPACING.sm,
  },
  requirementsBox: {
     backgroundColor: '#FFFFFF',
     borderWidth: 2,
     borderColor: COLORS.border,
     borderRadius: 4,
     padding: SPACING.md,
     marginVertical: SPACING.sm,
     ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 6,
      },
     }),
    },
  },
  requirementsTitle: {
     fontSize: 11,
     fontWeight: '700',
     color: COLORS.text,
     marginBottom: SPACING.sm,
  },
  requirementText: {
     fontSize: 10,
     color: COLORS.text,
     fontWeight: '600',
     marginBottom: SPACING.xs,
  },
  requirementMet: {
    color: COLORS.primary,
  },
  buttonContainer: {
    marginVertical: SPACING.sm,
  },
  resetButton: {
    marginVertical: SPACING.sm,
  },
  backButton: {
    marginVertical: SPACING.sm,
  },
});

export default ResetPasswordScreen;