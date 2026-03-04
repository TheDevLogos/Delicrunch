/**
 * Servicio de Mercado Pago para el Frontend
 * 
 * Este servicio se comunica con el backend para:
 * 1. Crear preferencias de pago (Checkout Pro)
 * 2. Verificar estado de pagos
 * 3. Gestionar configuración de comercios
 * 
 * Documentación: https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/mobile-integration/react-native-expo-go
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Asegura que la URL siempre termine en /api
const ensureApiSuffix = (url) => {
    if (!url) return url;
    const normalized = url.replace(/\/$/, '');
    if (/\/api$/i.test(normalized)) return normalized;
    return `${normalized}/api`;
};

// Obtener la URL base del API de forma consistente con el resto de la app
const getApiUrl = () => {
    // 1) extra.apiUrl inyectado por app.config.js
    const expoExtraApi = Constants.expoConfig?.extra?.apiUrl;
    if (expoExtraApi) {
        return ensureApiSuffix(expoExtraApi);
    }
    
    // 2) Variable de entorno en runtime
    if (process.env.EXPO_PUBLIC_API_URL) {
        return ensureApiSuffix(process.env.EXPO_PUBLIC_API_URL);
    }
    
    // 3) Fallback a localhost
    return ensureApiSuffix('http://localhost:5001');
};

const API_URL = getApiUrl();
console.log('💳 MercadoPago Service API URL:', API_URL);

/**
 * Crea una preferencia de pago para Checkout Pro
 * 
 * @param {Object} params - Parámetros de la preferencia
 * @param {number} params.productId - ID del producto
 * @param {number} params.cantidad - Cantidad de productos
 * @param {number} params.coupon_discount - Descuento de cupón
 * @returns {Promise<Object>} Preferencia con init_point para redirección
 */
export const createPaymentPreference = async ({ productId, cantidad = 1, coupon_discount = 0 }) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        
        if (!token) {
            throw new Error('No hay sesión activa. Por favor inicia sesión.');
        }

        console.log('📡 Creando preferencia de Mercado Pago...');

        const response = await fetch(`${API_URL}/payments/create-preference`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({
                productId,
                cantidad,
                coupon_discount,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Error del servidor:', data);
            throw new Error(data.msg || `Error ${response.status}: ${response.statusText}`);
        }

        console.log('✅ Preferencia creada:', {
            preferenceId: data.preferenceId,
            amount: data.amount,
        });

        return {
            preferenceId: data.preferenceId,
            initPoint: data.initPoint,
            sandboxInitPoint: data.sandboxInitPoint,
            amount: data.amount,
            merchantAmount: data.merchantAmount,
            platformFee: data.platformFee,
        };

    } catch (error) {
        console.error('❌ Error en createPaymentPreference:', error);
        
        if (error.message.includes('Network request failed')) {
            throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
        }
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        
        throw error;
    }
};

/**
 * Obtiene el estado de un pago
 * 
 * @param {string} paymentId - ID del pago de Mercado Pago
 * @returns {Promise<Object>} Estado del pago
 */
export const getPaymentStatus = async (paymentId) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        
        if (!token) {
            throw new Error('No hay sesión activa.');
        }

        const response = await fetch(`${API_URL}/payments/status/${paymentId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || `Error ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error('❌ Error en getPaymentStatus:', error);
        throw error;
    }
};

/**
 * Configura cuenta de Mercado Pago para un comercio
 * 
 * @param {string} mercadopagoEmail - Email de la cuenta de Mercado Pago
 * @returns {Promise<Object>} Resultado de la configuración
 */
export const setupMerchantAccount = async (mercadopagoEmail) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        
        if (!token) {
            throw new Error('No hay sesión activa.');
        }

        console.log('📡 Configurando cuenta de Mercado Pago...');

        const response = await fetch(`${API_URL}/payments/merchant-setup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({ mercadopago_email: mercadopagoEmail }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || `Error ${response.status}`);
        }

        console.log('✅ Cuenta de Mercado Pago configurada');

        return data;

    } catch (error) {
        console.error('❌ Error en setupMerchantAccount:', error);
        throw error;
    }
};

/**
 * Obtiene el estado de configuración de un comercio
 * 
 * @returns {Promise<Object>} Estado de la cuenta del comercio
 */
export const getMerchantStatus = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        
        if (!token) {
            throw new Error('No hay sesión activa.');
        }

        const response = await fetch(`${API_URL}/payments/merchant-status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || `Error ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error('❌ Error en getMerchantStatus:', error);
        throw error;
    }
};

/**
 * Obtiene el balance del comercio
 * 
 * @returns {Promise<Object>} Balance disponible y pendiente
 */
export const getMerchantBalance = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        
        if (!token) {
            throw new Error('No hay sesión activa.');
        }

        const response = await fetch(`${API_URL}/payments/merchant-balance`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || `Error ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error('❌ Error en getMerchantBalance:', error);
        throw error;
    }
};

/**
 * Obtiene el historial de pagos del comercio
 * 
 * @returns {Promise<Object>} Lista de payouts
 */
export const getMerchantPayouts = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        
        if (!token) {
            throw new Error('No hay sesión activa.');
        }

        const response = await fetch(`${API_URL}/payments/merchant-payouts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || `Error ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error('❌ Error en getMerchantPayouts:', error);
        throw error;
    }
};

export default {
    createPaymentPreference,
    getPaymentStatus,
    setupMerchantAccount,
    getMerchantStatus,
    getMerchantBalance,
    getMerchantPayouts,
};
