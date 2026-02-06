import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StyledButton from '../components/StyledButton';

const PaymentSuccessScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Ionicons name="checkmark-circle" size={80} color="#30D158" />
      <Text style={styles.title}>¡Pago Exitoso!</Text>
      <Text style={styles.subtitle}>
        Tu pago ha sido procesado correctamente. Recibirás una confirmación por correo electrónico.
      </Text>
      <StyledButton
        title="Ver Mis Pedidos"
        onPress={() => navigation.navigate('MyOrders')}
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

export default PaymentSuccessScreen;
