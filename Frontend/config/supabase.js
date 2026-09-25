// =============================================
// CONFIGURACIÓN DE SUPABASE PARA FRONTEND
// =============================================

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Obtener las credenciales desde las variables de entorno
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 
                    process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_KEY || 
                        process.env.EXPO_PUBLIC_SUPABASE_KEY;

// Verificar que las credenciales estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERROR: Credenciales de Supabase no configuradas');
    console.error('Asegúrate de tener EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_KEY en tu .env');
}

// El navegador guarda la sesión en localStorage; iOS/Android usan AsyncStorage.
const authStorage = Platform.OS === 'web'
    ? (typeof window !== 'undefined' ? window.localStorage : undefined)
    : AsyncStorage;

// Crear el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
    },
});

// Exportar la instancia del cliente
export default supabase;
