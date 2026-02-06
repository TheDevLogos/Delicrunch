import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StyledButton from '../components/StyledButton';

const PaymentErrorScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Ionicons name="close-circle" size={80} color="#ff3b30" />
      <Text style={styles.title}>Error en el Pago</Text>
      <Text style={styles.subtitle}>
        Hubo un problema al procesar tu pago. Por favor, verifica tu método de pago e intenta de nuevo.
      </Text>
      <StyledButton
        title="Intentar de Nuevo"
        onPress={() => navigation.goBack()}
      />
      <StyledButton
        title="Volver al Inicio"
        variant="outline"
        onPress={() => navigation.navigate('Home')}
        style={{ marginTop: 12 }}
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

export default PaymentErrorScreen;
