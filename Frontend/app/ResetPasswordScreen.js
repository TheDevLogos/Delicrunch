import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StyledTextInput from '../components/StyledTextInput';
import NeoButton from '../components/NeoButton';
import api from '../services/api';
import logger from '../services/logger';
import { COLORS, SPACING } from '../src/constants/theme';

const ResetPasswordScreen = ({ route, navigation }) => {
  const token = route.params?.token;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async () => {
    if (!token) {
      Alert.alert('Enlace inválido', 'Solicita un nuevo enlace de recuperación.');
      return;
    }
    if (password.length < 12) {
      Alert.alert('Contraseña no segura', 'Usa una contraseña de al menos 12 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Las contraseñas no coinciden', 'Vuelve a escribir la misma contraseña en ambos campos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password/' + encodeURIComponent(token), { password });
      Alert.alert('Contraseña actualizada', 'Ya puedes iniciar sesión con tu nueva contraseña.');
      navigation.replace('Login');
    } catch (error) {
      logger.error(error, 'handleResetPassword');
      Alert.alert('No se pudo actualizar', error.response?.data?.msg || 'Solicita un nuevo enlace de recuperación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>NUEVA CONTRASEÑA</Text>
        <Text style={styles.subtitle}>Usa al menos 12 caracteres y no la compartas.</Text>
        <StyledTextInput
          placeholder="Contraseña nueva"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!isSubmitting}
          style={styles.input}
        />
        <StyledTextInput
          placeholder="Confirma la contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!isSubmitting}
          style={styles.input}
        />
        <NeoButton
          title={isSubmitting ? 'Actualizando…' : 'RESTABLECER CONTRASEÑA'}
          onPress={handleResetPassword}
          disabled={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
});

export default ResetPasswordScreen;
