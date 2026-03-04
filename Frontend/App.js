import React, { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthProvider';
import { LocationProvider } from './contexts/LocationContext';
import { GamificationProvider } from './contexts/GamificationContext';
// import { NotificationProvider } from './contexts/NotificationContext'; // DESACTIVADO: causaba error con ExpoPushTokenManager

export default function App() {
  const navigationRef = useRef(null);

  // =====================================================
  // HANDLER DE DEEP LINKS - Callbacks de Mercado Pago
  // Cuando MP redirige a delicrunch://payment-result?status=success|failure|pending
  // =====================================================
  const handleDeepLink = (event) => {
    const url = event?.url || event;
    if (!url || typeof url !== 'string') return;

    try {
      // Parsear la URL del deep link
      if (url.startsWith('delicrunch://payment-result')) {
        const paramString = url.split('?')[1] || '';
        const params = {};
        paramString.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });

        const status = params.status;
        const paymentId = params.payment_id;
        const collectionStatus = params.collection_status;

        console.log('📱 Deep Link - Payment Result:', { status, paymentId, collectionStatus });

        if (!navigationRef.current) return;

        if (status === 'success' || collectionStatus === 'approved') {
          navigationRef.current.navigate('PaymentSuccess', { paymentId, collectionStatus });
        } else if (status === 'failure' || collectionStatus === 'rejected') {
          navigationRef.current.navigate('PaymentError', { paymentId, collectionStatus });
        } else if (status === 'pending' || collectionStatus === 'pending') {
          // Pago pendiente - ir a mis pedidos
          navigationRef.current.navigate('MyOrders');
        }
      }
    } catch (error) {
      console.error('❌ Error procesando deep link:', error);
    }
  };

  useEffect(() => {
    // Escuchar deep links mientras la app está abierta
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Manejar deep link inicial (cuando la app se abre desde un deep link)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    }).catch(err => console.error('Error getInitialURL:', err));

    return () => subscription?.remove();
  }, []);

  return (
    <SafeAreaProvider>
      {/* NotificationProvider DESACTIVADO - causaba error con ExpoPushTokenManager */}
      <AuthProvider>
        <LocationProvider>
          <GamificationProvider>
            <NavigationContainer ref={navigationRef}>
              <AppNavigator /> 
            </NavigationContainer>
          </GamificationProvider>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
