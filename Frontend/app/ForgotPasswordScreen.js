import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import StyledTextInput from '../components/StyledTextInput';
import StyledButton from '../components/StyledButton';
import api from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendLink = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor, introduce tu correo electrónico.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      Alert.alert('Revisa tu Email', response.data.msg);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al enviar el enlace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Recuperar Contraseña</Text>
      <Text style={styles.subtitle}>Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.</Text>
      <StyledTextInput
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <StyledButton title="Enviar Enlace" onPress={handleSendLink} disabled={isSubmitting} />
    </SafeAreaView>
  );
};

// ... (estilos similares a LoginScreen)
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  subtitle: { fontSize: 16, textAlign: 'center', color: 'gray', marginBottom: 30 },
});

export default ForgotPasswordScreen;