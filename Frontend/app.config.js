// app.config.js - Configuración dinámica de Expo
// Lee variables de entorno desde .env y las inyecta en extra
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = ({ config }) => {
  // Prioridad: variable de entorno > .env > fallback
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';
  const mercadoPagoPublicKey = process.env.EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '';
  
  console.log('📱 [app.config.js] API URL:', apiUrl);
  console.log('📱 [app.config.js] Mercado Pago Key:', mercadoPagoPublicKey ? '✅ Configurada' : '❌ No configurada');
  
  // Verificar si existe google-services.json
  const googleServicesPath = path.join(__dirname, 'google-services.json');
  const hasGoogleServices = fs.existsSync(googleServicesPath);
  
  console.log('📱 [app.config.js] Google Services:', hasGoogleServices ? '✅ Encontrado' : '⚠️  No encontrado (usando placeholder)');
  
  // Configuración de Android con google-services condicional
  const androidConfig = {
    ...config.android,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.delicrunch.app",
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "WAKE_LOCK",
      "POST_NOTIFICATIONS",
      "SCHEDULE_EXACT_ALARM",
      "USE_EXACT_ALARM"
    ]
  };
  
  // Solo agregar googleServicesFile si el archivo existe
  if (hasGoogleServices) {
    androidConfig.googleServicesFile = "./google-services.json";
  }
  
  return {
    ...config,
    android: androidConfig,
    extra: {
      ...(config.extra || {}),
      apiUrl: apiUrl,
      mercadoPagoPublicKey: mercadoPagoPublicKey,
      eas: {
        projectId: config.extra?.eas?.projectId,
      },
    },
  };
};
