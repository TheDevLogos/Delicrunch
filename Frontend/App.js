import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';

import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthProvider';

export default function App() {
  return (
    <StripeProvider
      publishableKey="pk_test_51SRRYk8hoiRFdhGtFHnTJRVAPniX7lh6esuxdNc13Xw7GK3njphOGYTQ8An7HJSdcTxjeVMi2tULPp6DqKugVbDT00PMJuLLkJ" // <-- REPLACE WITH REAL KEY
    >
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </StripeProvider>
  );
}
