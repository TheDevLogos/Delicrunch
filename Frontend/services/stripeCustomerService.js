/**
 * Servicio para manejar Customer Sessions de Stripe
 * 
 * Este servicio se comunica con el backend para:
 * 1. Crear/obtener un Stripe Customer
 * 2. Generar Ephemeral Key
 * 3. Crear SetupIntent para guardar tarjetas
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5001';

/**
 * Crea una Customer Session en Stripe (lado servidor)
 * 
 * @returns {Promise<Object>} Objeto con customerId, ephemeralKeySecret, setupIntentClientSecret
 * @throws {Error} Si no hay token o si el servidor responde con error
 */
export const createCustomerSession = async () => {
    try {
        // 1. Obtener token de autenticación
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
            throw new Error('No hay sesión activa. Por favor inicia sesión.');
        }

        console.log('📡 Llamando a /api/payments/customer-session...');

        // 2. Llamar al endpoint del backend
        const response = await fetch(`${API_URL}/api/payments/customer-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        // 3. Parsear respuesta
        const data = await response.json();

        // 4. Manejar errores HTTP
        if (!response.ok) {
            console.error('❌ Error del servidor:', data);
            throw new Error(data.msg || `Error ${response.status}: ${response.statusText}`);
        }

        // 5. Validar estructura de la respuesta
        if (!data.customerId || !data.ephemeralKeySecret || !data.setupIntentClientSecret) {
            console.error('❌ Respuesta incompleta:', data);
            throw new Error('Respuesta del servidor incompleta');
        }

        console.log('✅ Customer Session creada:', {
            customerId: data.customerId,
            hasEphemeralKey: !!data.ephemeralKeySecret,
            hasSetupIntent: !!data.setupIntentClientSecret,
        });

        return {
            customerId: data.customerId,
            ephemeralKeySecret: data.ephemeralKeySecret,
            setupIntentClientSecret: data.setupIntentClientSecret,
            publishableKey: data.publishableKey,
        };

    } catch (error) {
        console.error('❌ Error en createCustomerSession:', error);
        
        // Proporcionar mensajes más amigables
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
 * Inicializa y presenta el Payment Sheet de Stripe para guardar una tarjeta
 * 
 * @param {Object} stripe - Hook useStripe() de @stripe/stripe-react-native
 * @returns {Promise<boolean>} true si se guardó la tarjeta, false si se canceló
 */
export const presentPaymentSheetForCardSetup = async (stripe) => {
    try {
        const { initPaymentSheet, presentPaymentSheet } = stripe;

        console.log('💳 Iniciando proceso de guardar tarjeta...');

        // 1. Obtener datos del backend
        const { customerId, ephemeralKeySecret, setupIntentClientSecret } = 
            await createCustomerSession();

        // 2. Inicializar Payment Sheet
        const { error: initError } = await initPaymentSheet({
            merchantDisplayName: 'Delicrunch',
            customerId: customerId,
            customerEphemeralKeySecret: ephemeralKeySecret,
            setupIntentClientSecret: setupIntentClientSecret,
            allowsDelayedPaymentMethods: true,
            defaultBillingDetails: {
                name: '', // Se puede prellenar con datos del usuario
            },
            returnURL: 'delicrunch://payment-result',
        });

        if (initError) {
            console.error('❌ Error al inicializar Payment Sheet:', initError);
            throw new Error(`Error de inicialización: ${initError.message}`);
        }

        console.log('✅ Payment Sheet inicializado');

        // 3. Presentar el formulario de tarjeta al usuario
        const { error: presentError } = await presentPaymentSheet();

        // 4. Manejar resultado
        if (presentError) {
            if (presentError.code === 'Canceled') {
                console.log('ℹ️ Usuario canceló el formulario');
                return false;
            }
            
            console.error('❌ Error al presentar Payment Sheet:', presentError);
            throw new Error(`Error de presentación: ${presentError.message}`);
        }

        console.log('✅ Tarjeta guardada exitosamente');
        return true;

    } catch (error) {
        console.error('❌ Error en presentPaymentSheetForCardSetup:', error);
        throw error;
    }
};

/**
 * Obtener las tarjetas guardadas en Stripe de un customer
 * 
 * @param {string} customerId - ID del customer de Stripe
 * @returns {Promise<Array>} Array de tarjetas guardadas
 */
export const getStripeCustomerCards = async (customerId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
            throw new Error('No hay sesión activa. Por favor inicia sesión.');
        }

        console.log(`📡 Obteniendo tarjetas de Stripe para customer: ${customerId}`);

        const response = await fetch(`${API_URL}/api/payments/stripe-cards/${customerId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Error del servidor:', data);
            throw new Error(data.msg || `Error ${response.status}`);
        }

        console.log(`✅ Obtenidas ${data.cards?.length || 0} tarjetas de Stripe`);

        return data.cards || [];

    } catch (error) {
        console.error('❌ Error en getStripeCustomerCards:', error);
        throw error;
    }
};

export default {
    createCustomerSession,
    presentPaymentSheetForCardSetup,
    getStripeCustomerCards,
};
