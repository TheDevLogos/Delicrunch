// =============================================
// CONFIGURACIÓN DE SUPABASE PARA FRONTEND
// =============================================

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
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

// Crear el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: null, // Usar AsyncStorage para React Native
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
    },
});

// Función para verificar la conexión
export const checkSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        console.log('✅ Conexión con Supabase establecida exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con Supabase:', error.message);
        return false;
    }
};

// Exportar la instancia del cliente
export default supabase;
