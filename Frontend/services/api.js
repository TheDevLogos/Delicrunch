import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// --- URL Base Dinámica para Desarrollo ---
// Configuración actualizada para Expo SDK 51+
const getApiUrl = () => {
  // En desarrollo, intentamos obtener la IP del host de desarrollo
  if (__DEV__) {
    // Para Expo SDK 51+, usamos expoConfig en lugar de manifest
    const expoConfig = Constants.expoConfig;
    
    // Intentamos obtener la IP del debugger host
    if (expoConfig?.hostUri) {
      const host = expoConfig.hostUri.split(':')[0];
      return `http://${host}:5001/api`;
    }
    
    // Fallback para desarrollo local
    if (Platform.OS === 'android') {
      return 'http://192.168.0.102:5001/api'; // Emulador Android
    }
    
    // Para iOS y otros, usar localhost
    return 'http://localhost:5001/api';
  }
  
  // En producción, usar el dominio real
  return 'https://api.delicrunch.com/api';
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

// --- INSTANCIA PÚBLICA ---
// Creamos una segunda instancia de axios que NO tiene el interceptor.
// La usaremos para las llamadas a la API que no necesitan token de autenticación.
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
});

// Exportamos 'api' como la exportación por defecto.
export default api;
