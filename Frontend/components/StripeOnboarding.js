import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import StyledButton from './StyledButton';
import logger from '../services/logger';

const StripeOnboarding = () => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get('/payments/stripe-account-status');
        setStatus(response.data);
      } catch (error) {
        logger.error(error, 'fetchStripeStatus');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleOnboarding = async () => {
    setIsCreatingLink(true);
    try {
      const response = await api.post('/payments/create-account-link');
      const { url } = response.data;
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      logger.error(error, 'createStripeAccountLink');
      Alert.alert('Error', 'No se pudo generar el enlace de registro. Inténtalo de nuevo.');
    } finally {
      setIsCreatingLink(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={{ marginVertical: 20 }} />;
  }

  const renderContent = () => {
    if (!status) {
      return <Text style={styles.statusText}>No se pudo verificar el estado de tu cuenta de pagos.</Text>;
    }

    // Cuenta completamente activa
    if (status.chargesEnabled && status.payoutsEnabled && status.detailsSubmitted) {
      return (
        <>
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#30D158" />
            <Text style={[styles.statusText, { color: '#30D158' }]}>
              Tu cuenta está activa y lista para recibir pagos
            </Text>
          </View>
          <StyledButton
            title="Gestionar Cuenta de Pagos"
            onPress={handleOnboarding}
            isLoading={isCreatingLink}
            variant="secondary"
          />
        </>
      );
    }

    // Tiene cuenta pero falta información o permisos
    if (status.hasStripeAccount) {
      return (
        <>
          <View style={styles.statusContainer}>
            <Ionicons name="alert-circle" size={20} color="#ff9500" />
            <Text style={[styles.statusText, { color: '#ff9500' }]}>
              {!status.chargesEnabled && 'No puedes recibir pagos aún. '}
              {!status.payoutsEnabled && 'No puedes recibir transferencias aún. '}
              {!status.detailsSubmitted && 'Información incompleta. '}
            </Text>
          </View>
          <StyledButton
            title="Continuar Configuración"
            onPress={handleOnboarding}
            isLoading={isCreatingLink}
          />
        </>
      );
    }

    // No tiene cuenta
    return (
      <>
        <Text style={styles.statusText}>
          Para recibir pagos por tus ventas, necesitas conectar una cuenta bancaria con Stripe.
        </Text>
        <StyledButton
          title="Conectar con Stripe"
          onPress={handleOnboarding}
          isLoading={isCreatingLink}
          variant="success"
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Pagos</Text>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusText: { fontSize: 16, marginLeft: 8, flex: 1, lineHeight: 22 },
});

export default StripeOnboarding;