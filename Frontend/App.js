import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthProvider';
import { LocationProvider } from './contexts/LocationContext';
import { GamificationProvider } from './contexts/GamificationContext';
// import { NotificationProvider } from './contexts/NotificationContext'; // DESACTIVADO: causaba error con ExpoPushTokenManager

const linking = {
  prefixes: ['https://delicrunch.vercel.app', 'delicrunch://'],
  config: {
    screens: {
      ResetPassword: 'reset-password/:token',
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      {/* NotificationProvider DESACTIVADO - causaba error con ExpoPushTokenManager */}
      <AuthProvider>
        <LocationProvider>
          <GamificationProvider>
            <NavigationContainer linking={linking}>
              <AppNavigator /> 
            </NavigationContainer>
          </GamificationProvider>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
