import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthProvider';
import { LocationProvider } from './contexts/LocationContext';
import { GamificationProvider } from './contexts/GamificationContext';
import PushBridge from './components/PushBridge';
import {InboxProvider} from './contexts/InboxContext';
import { navigationRef } from './navigation/navigationRef';

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
      <AuthProvider>
        <LocationProvider>
          <GamificationProvider>
            <InboxProvider>
            <NavigationContainer linking={linking} ref={navigationRef}>
              <AppNavigator />
              <PushBridge />
            </NavigationContainer>
            </InboxProvider>
          </GamificationProvider>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
