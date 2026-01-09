import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthProvider';
import { LocationProvider } from './contexts/LocationContext';
import { GamificationProvider } from './contexts/GamificationContext';

export default function App() {
  return (
    <StripeProvider
      publishableKey="pk_test_51SRRYk8hoiRFdhGtFHnTJRVAPniX7lh6esuxdNc13Xw7GK3njphOGYTQ8An7HJSdcTxjeVMi2tULPp6DqKugVbDT00PMJuLLkJ" // <-- REPLACE WITH REAL KEY
    >
      <SafeAreaProvider>
        <AuthProvider>
          <LocationProvider>
            <GamificationProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </GamificationProvider>
          </LocationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
}
