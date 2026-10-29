import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Constants from 'expo-constants';

const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';

const GoogleAuthButton = ({ disabled = false, onCredential, onError }) => {
  const buttonRef = useRef(null);
  const onErrorRef = useRef(onError);
  const onCredentialRef = useRef(onCredential);

  useEffect(() => {
    onErrorRef.current = onError;
    onCredentialRef.current = onCredential;
  }, [onCredential, onError]);

  useEffect(() => {
    const clientId = Constants.expoConfig?.extra?.googleAuth?.webClientId;
    if (!clientId || !buttonRef.current || typeof document === 'undefined') return undefined;

    let cancelled = false;
    const renderButton = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response?.credential) {
            onErrorRef.current?.(new Error('Google no devolvió un token de identidad válido.'));
            return;
          }
          onCredentialRef.current?.(response.credential);
        },
        auto_select: false,
      });
      buttonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.min(360, Math.max(260, buttonRef.current.clientWidth || 320)),
      });
    };

    const existingScript = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);
    if (window.google?.accounts?.id) {
      renderButton();
    } else if (existingScript) {
      existingScript.addEventListener('load', renderButton, { once: true });
    } else {
      const script = document.createElement('script');
      script.src = GOOGLE_IDENTITY_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      script.onerror = () => onErrorRef.current?.(new Error('No se pudo cargar Google Sign-In.'));
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      buttonRef.current?.replaceChildren();
    };
  }, []);

  return (
    <View
      ref={buttonRef}
      pointerEvents={disabled ? 'none' : 'auto'}
      accessibilityLabel="Iniciar sesión con Google"
      style={{ width: '100%', minHeight: 48, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.55 : 1 }}
    />
  );
};

export default GoogleAuthButton;
