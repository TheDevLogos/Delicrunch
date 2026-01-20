// app.config.js - Configuración dinámica de Expo
// Lee variables de entorno desde .env y las inyecta en extra
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = ({ config }) => {
  // Prioridad: variable de entorno > .env > fallback
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  
  console.log('📱 [app.config.js] API URL:', apiUrl);
  console.log('📱 [app.config.js] Stripe Key:', stripePublishableKey ? '✅ Configurada' : '❌ No configurada');
  
  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      apiUrl: apiUrl,
      stripePublishableKey: stripePublishableKey,
      eas: {
        projectId: config.extra?.eas?.projectId,
      },
    },
  };
};
