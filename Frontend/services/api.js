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
  // 1) Variable de entorno prioritaria (ideal para dispositivos reales)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return ensureApiSuffix(process.env.EXPO_PUBLIC_API_URL);
  }

  // 2) Desarrollo: derivar desde hostUri de Expo
  if (__DEV__) {
    const expoConfig = Constants.expoConfig;
    if (expoConfig?.hostUri) {
      const host = expoConfig.hostUri.split(':')[0];
      return ensureApiSuffix(`http://${host}:5001`);
    }
    // Fallbacks
    if (Platform.OS === 'android') return ensureApiSuffix('http://10.0.2.2:5001'); // emulador Android
    return ensureApiSuffix('http://localhost:5001');
  }

  // 3) Producción
  return ensureApiSuffix('https://api.delicrunch.com');
};

const API_BASE_URL = getApiUrl();

console.log('🌐 API Base URL:', API_BASE_URL);

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
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si recibimos un 401, el token es inválido o ha expirado
    if (error.response?.status === 401) {
      // Limpiar el token inválido del almacenamiento
      await AsyncStorage.removeItem('userToken');
      console.log('🔐 Token inválido detectado y eliminado automáticamente');
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
