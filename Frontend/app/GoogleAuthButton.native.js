import React, { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  GoogleSignin,
  GoogleSigninButton,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

const GoogleAuthButton = ({ disabled = false, onCredential, onError }) => {
  const onErrorRef = useRef(onError);
  const onCredentialRef = useRef(onCredential);
  const configured = useRef(false);

  useEffect(() => {
    onErrorRef.current = onError;
    onCredentialRef.current = onCredential;
  }, [onCredential, onError]);

  const handlePress = useCallback(async () => {
    try {
      const googleAuth = Constants.expoConfig?.extra?.googleAuth || {};
      if (!googleAuth.webClientId) {
        throw new Error('Falta configurar el cliente web de Google.');
      }
      if (Platform.OS === 'ios' && !googleAuth.iosClientId) {
        throw new Error('Falta configurar el cliente iOS de Google.');
      }

      if (!configured.current) {
        GoogleSignin.configure({
          webClientId: googleAuth.webClientId,
          ...(Platform.OS === 'ios' && googleAuth.iosClientId
            ? { iosClientId: googleAuth.iosClientId }
            : {}),
          offlineAccess: false,
          scopes: ['email', 'profile'],
        });
        configured.current = true;
      }

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return;

      const idToken = response.data?.idToken;
      if (!idToken) throw new Error('Google no devolvió un token de identidad válido.');
      await onCredentialRef.current(idToken);
    } catch (error) {
      onErrorRef.current?.(error);
    }
  }, []);

  return (
    <GoogleSigninButton
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={handlePress}
      disabled={disabled}
      style={{ width: '100%', height: 48 }}
      accessibilityLabel="Iniciar sesión con Google"
    />
  );
};

export default GoogleAuthButton;
