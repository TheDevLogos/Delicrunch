import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StyledButton from '../components/StyledButton';

const StripeOnboardingSuccessScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="checkmark-circle" size={80} color="#30D158" />
      <Text style={styles.title}>¡Configuración Guardada!</Text>
      <Text style={styles.subtitle}>
        Hemos recibido tus datos. Stripe está verificando tu cuenta, esto puede tardar unos minutos.
      </Text>
      <StyledButton
        title="Volver a Mi Perfil"
        onPress={() => navigation.navigate('Mi Perfil')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 30,
  },
});

export default StripeOnboardingSuccessScreen;