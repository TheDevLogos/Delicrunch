import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import StyledTextInput from '../components/StyledTextInput';
import StyledButton from '../components/StyledButton';
import api from '../services/api';

const ResetPasswordScreen = ({ route, navigation }) => {
  // El token vendrá del enlace profundo (deep link) que configuraremos
  const { token } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Por favor, completa ambos campos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña Débil', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Llamamos a la nueva ruta del backend, pasándole el token y la nueva contraseña
      await api.post(`/auth/reset-password/${token}`, { password });

      Alert.alert(
        'Éxito',
        'Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión con tu nueva contraseña.'
      );
      // Llevamos al usuario a la pantalla de Login
      navigation.navigate('Login');

    } catch (error) {
      Alert.alert('Error', error.response?.data?.msg || 'El enlace de recuperación es inválido o ha expirado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Crea una Nueva Contraseña</Text>
      <Text style={styles.subtitle}>Introduce tu nueva contraseña a continuación.</Text>

      <StyledTextInput
        placeholder="Nueva contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <StyledTextInput
        placeholder="Confirmar nueva contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <StyledButton
        title={isSubmitting ? 'Actualizando...' : 'Restablecer Contraseña'}
        onPress={handleResetPassword}
        disabled={isSubmitting}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'gray',
    marginBottom: 30,
  },
});

export default ResetPasswordScreen;