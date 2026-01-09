import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView, KeyboardAvoidingView, Platform, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StyledTextInput from '../components/StyledTextInput';
import NeoButton from '../components/NeoButton';
import api from '../services/api';
import logger from '../services/logger';
import { COLORS, TYPOGRAPHY, BORDERS, SHADOWS, SPACING } from '../src/constants/theme';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendLink = async () => {
    if (!email) {
      Alert.alert('⚠️ Error', 'Por favor, introduce tu correo electrónico.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('⚠️ Error', 'Por favor, introduce una dirección válida.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setEmailSent(true);
      Alert.alert('✅ Éxito', response.data.msg || 'Se ha enviado un enlace a tu correo electrónico.');
      setTimeout(() => navigation.goBack(), 2000);
    } catch (error) {
      logger.error(error, 'handleSendLink');
      Alert.alert('❌ Error', 'Ocurrió un problema al enviar el enlace. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={35} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>RECUPERAR</Text>
            <Text style={styles.title}>CONTRASEÑA</Text>
            <Text style={styles.subtitle}>No te preocupes, podemos ayudarte</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.instructionText}>
              Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </Text>

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
                editable={!isSubmitting}
              />
            </View>

            {/* Send Link Button */}
            <View style={styles.buttonContainer}>
              <NeoButton 
                title={isSubmitting ? "⏳ Enviando..." : "🚀 ENVIAR"} 
                onPress={handleSendLink}
                style={styles.sendButton}
                disabled={isSubmitting || emailSent}
              />
            </View>

            {/* Success Message */}
            {emailSent && (
              <View style={styles.successMessage}>
                <Ionicons name="checkmark-circle" size={32} color={COLORS.primary} />
                <Text style={styles.successText}>¡Enlace enviado correctamente!</Text>
              </View>
            )}

            {/* Back to Login Link */}
            <NeoButton
              title="🔑 VOLVER AL LOGIN"
              onPress={() => navigation.navigate('Login')}
              variant="secondary"
              style={styles.backLoginButton}
            />
          </View>
        </View>
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
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.25,
  },
  title: {
    fontSize: 42,
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
     flex: 0.75,
     justifyContent: 'center',
     gap: SPACING.sm,
  },
  instructionText: {
     fontSize: 15,
     color: COLORS.text,
     textAlign: 'center',
     marginBottom: SPACING.sm,
     lineHeight: 16,
  },
  inputWrapper: {
     position: 'relative',
     marginBottom: SPACING.sm,
  },
  input: {
     borderWidth: 2,
     borderColor: COLORS.border,
     borderRadius: 4,
     paddingHorizontal: SPACING.md,
     paddingVertical: SPACING.sm,
     fontSize: 14,
     color: COLORS.text,
     backgroundColor: '#FFFFFF',
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
  buttonContainer: {
    marginVertical: SPACING.sm,
  },
  sendButton: {
    marginVertical: SPACING.sm,
  },
  successMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  successText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  backLoginButton: {
    marginVertical: SPACING.sm,
  },
});

export default ForgotPasswordScreen;