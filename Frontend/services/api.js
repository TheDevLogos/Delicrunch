import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// --- URL Base Dinámica para Desarrollo (Expo SDK 51+) ---
// Aseguramos que SIEMPRE termine en /api y evitamos duplicaciones
const ensureApiSuffix = (url) => {
  if (!url) return url;
  // Elimina cualquier / al final
  const normalized = url.replace(/\/$/, '');
  // Si ya termina con /api, lo devolvemos tal cual
  if (/\/api$/i.test(normalized)) return normalized;
  return `${normalized}/api`;
};

const getApiUrl = () => {
  // 1) PRIORITARIO: extra.apiUrl inyectado por app.config.js (lee .env en build time)
  const expoExtraApi = Constants.expoConfig?.extra?.apiUrl;
  if (expoExtraApi) {
    console.log('🔗 Usando extra.apiUrl:', expoExtraApi);
    return ensureApiSuffix(expoExtraApi);
  }

  // 2) Variable de entorno en runtime (EXPO_PUBLIC_*)
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('🔗 Usando EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
    return ensureApiSuffix(process.env.EXPO_PUBLIC_API_URL);
  }

  // 3) Manifest legacy (Expo SDK < 46)
  const manifestApi = Constants.manifest?.extra?.apiUrl;
  if (manifestApi) {
    console.log('🔗 Usando manifest.extra.apiUrl:', manifestApi);
    return ensureApiSuffix(manifestApi);
  }

  // 3b) Si estamos en un entorno donde Expo expone debuggerHost (packager), usarlo
  // Ej: "192.168.1.5:19000" -> extraer la IP y usar el puerto del backend
  const debuggerHost = Constants.manifest?.debuggerHost;
  if (debuggerHost && __DEV__) {
    const hostFromDebugger = debuggerHost.split(':')[0];
    console.log('🔗 Usando manifest.debuggerHost como host de dev:', hostFromDebugger);
    return ensureApiSuffix(`http://${hostFromDebugger}:5001`);
  }

  // 4) Desarrollo: derivar desde hostUri de Expo
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      // Si es un túnel ngrok/localtunnel, usarlo directamente
      if (host.includes('.') && !host.startsWith('192.') && !host.startsWith('10.') && !host.startsWith('172.')) {
        console.log('🔗 Usando hostUri (túnel):', host);
        return ensureApiSuffix(`https://${host}`);
      }
      console.log('🔗 Usando hostUri (local):', host);
      return ensureApiSuffix(`http://${host}:5001`);
    }
    
    // Fallbacks por plataforma
    if (Platform.OS === 'android') {
      console.log('🔗 Fallback Android emulator');
      return ensureApiSuffix('http://10.0.2.2:5001');
    }
    console.log('🔗 Fallback localhost');
    return ensureApiSuffix('http://localhost:5001');
  }

  // 5) Producción
  return ensureApiSuffix('https://api.delicrunch.com');
};

const API_BASE_URL = getApiUrl();

console.log('🌐 API Base URL final:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- ¡LA MAGIA DE LOS INTERCEPTORES! ---
// Este código se ejecutará ANTES de cada petición que hagamos con 'api'.
api.interceptors.request.use(
  async (config) => {
    // 1. Obtener el token del almacenamiento
    const token = await AsyncStorage.getItem('userToken');

    // 2. Si el token existe, añadirlo al header 'x-auth-token'
    if (token) {
      config.headers['x-auth-token'] = token;
    }

    // 3. Devolver la configuración modificada para que la petición continúe
    return config;
  },
  (error) => {
    // Si hay un error al configurar la petición, lo rechazamos.
    return Promise.reject(error);
  }
);

// --- INTERCEPTOR DE RESPUESTA ---
// Maneja errores 401 (token inválido/expirado) limpiando el token automáticamente
// Y detecta respuestas HTML en lugar de JSON
api.interceptors.response.use(
  (response) => {
    // Verificar si la respuesta es HTML cuando esperamos JSON
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html') && !contentType.includes('application/json')) {
      console.error('⚠️ Servidor respondió con HTML en lugar de JSON:', response.config.url);
      throw new Error('El servidor respondió con HTML en lugar de JSON. Verifica la URL del backend.');
    }
    return response;
  },
  async (error) => {
    // Si recibimos un 401, el token es inválido o ha expirado
    if (error.response?.status === 401) {
      // Limpiar el token inválido del almacenamiento
      await AsyncStorage.removeItem('userToken');
      console.log('🔐 Token inválido detectado y eliminado automáticamente');
    }

    // Detectar si la respuesta de error es HTML
    const contentType = error.response?.headers['content-type'] || '';
    if (contentType.includes('text/html') || error.message?.includes('<!doctype') || error.message?.includes('<!DOCTYPE')) {
      console.error('⚠️ Error: Servidor respondió con HTML:', error.config?.url);
      return Promise.reject(new Error('El servidor respondió con HTML. Puede ser una página de error o configuración de túnel incorrecta.'));
    }

    return Promise.reject(error);
  }
);

// --- INSTANCIA PÚBLICA ---
// Creamos una segunda instancia de axios que NO tiene el interceptor.
// La usaremos para las llamadas a la API que no necesitan token de autenticación.
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
});

// Exportamos 'api' como la exportación por defecto.
export default api;
