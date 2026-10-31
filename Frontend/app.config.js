// app.config.js - Configuración dinámica de Expo
// Lee variables de entorno desde .env y las inyecta en extra
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const withLocalAndroidSigning = require('./plugins/withLocalAndroidSigning');

module.exports = ({ config }) => {
  // Prioridad: variable de entorno > .env > fallback
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://delicrunch.onrender.com/api';
  
  console.log('📱 [app.config.js] API URL:', apiUrl);
  
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    '1042705451323-i8afmbpbg4jb59b6cg5udlj5vkrb0k77.apps.googleusercontent.com';
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
  const iosUrlScheme = googleIosClientId
    ? `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}`
    : null;
  
  // Configuración nativa de Android
  const androidConfig = {
    ...config.android,
    adaptiveIcon: {
      foregroundImage: "./assets/delicrunch-adaptive-foreground.png",
      backgroundColor: "#F46A16"
    },
    package: "com.delicrunch.app",
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "POST_NOTIFICATIONS"
    ],
    // La app no usa alarmas ni notificaciones programadas. Estas pueden
    // reaparecer por dependencias nativas, así que se excluyen del manifiesto.
    blockedPermissions: [
      "android.permission.SCHEDULE_EXACT_ALARM",
      "android.permission.USE_EXACT_ALARM",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.SYSTEM_ALERT_WINDOW"
    ]
  };
  
  return {
    ...config,
    android: androidConfig,
    plugins: [
      ...(config.plugins || []),
      ...(iosUrlScheme ? [[
        '@react-native-google-signin/google-signin',
        { iosUrlScheme },
      ]] : []),
      withLocalAndroidSigning,
    ],
    extra: {
      ...(config.extra || {}),
      apiUrl: apiUrl,
      googleAuth: {
        webClientId: googleWebClientId,
        iosClientId: googleIosClientId,
      },
      // Este ID solo enruta tokens del servicio de push de Expo; no activa EAS Build.
      eas: {
        projectId: config.extra?.eas?.projectId,
      },
    },
  };
};
