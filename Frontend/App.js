import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthProvider';
import { LocationProvider } from './contexts/LocationContext';
import { GamificationProvider } from './contexts/GamificationContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Obtener Stripe publishable key desde variables de entorno
const STRIPE_PUBLISHABLE_KEY = 
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  Constants.expoConfig?.extra?.stripePublishableKey ||
  '';

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn('⚠️ STRIPE_PUBLISHABLE_KEY no está configurada');
}

export default function App() {
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.delicrunch.app"
    >
      <SafeAreaProvider>
        <NotificationProvider>
          <AuthProvider>
            <LocationProvider>
              <GamificationProvider>
                <NavigationContainer>
                  <AppNavigator /> 
                </NavigationContainer>
              </GamificationProvider>
            </LocationProvider>
          </AuthProvider>
        </NotificationProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
}
