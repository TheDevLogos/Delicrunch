import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StyledButton from '../components/StyledButton';

const StripeOnboardingErrorScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="close-circle" size={80} color="#ff3b30" />
      <Text style={styles.title}>Ocurrió un Error</Text>
      <Text style={styles.subtitle}>
        No se pudo completar el proceso de configuración. Por favor, inténtalo de nuevo.
      </Text>
      <StyledButton
        title="Volver a Mi Perfil"
        onPress={() => navigation.navigate('MainTabs', { screen: 'Mi Perfil' })}
        variant="danger"
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

export default StripeOnboardingErrorScreen;