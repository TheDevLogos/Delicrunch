/**
 * usePaymentMethods - Hook personalizado para gestión de métodos de pago
 * 
 * Proporciona una interfaz completa para:
 * - Cargar tarjetas guardadas de Stripe
 * - Establecer tarjeta por defecto
 * - Eliminar tarjetas
 * - Sincronizar con Stripe
 * 
 * @example
 * const { cards, defaultCardId, loading, setDefaultCard } = usePaymentMethods();
 */

import { useState, useEffect, useCallback } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { 
  createCustomerSession, 
  getStripeCustomerCards 
} from '../services/stripeCustomerService';
import api from '../services/api';

export const usePaymentMethods = () => {
  const stripe = useStripe();
  
  // Estados
  const [cards, setCards] = useState([]);
  const [defaultCardId, setDefaultCardId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Cargar tarjetas guardadas de Stripe
   */
  const loadCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando tarjetas guardadas...');
      
      // 1. Obtener Customer Session
      const { customerId: cid } = await createCustomerSession();
      setCustomerId(cid);
      
      // 2. Obtener tarjetas de Stripe
      const stripeCards = await getStripeCustomerCards(cid);
      setCards(stripeCards);
      
      // 3. Obtener tarjeta por defecto del perfil
      try {
        const profileResponse = await api.get('/profile');
        const defaultPM = profileResponse.data.default_payment_method_id;
        setDefaultCardId(defaultPM);
        console.log(`✅ Tarjeta por defecto: ${defaultPM || 'ninguna'}`);
      } catch (err) {
        console.warn('⚠️ No se pudo obtener tarjeta por defecto:', err.message);
      }
      
      console.log(`✅ Cargadas ${stripeCards.length} tarjetas`);
      
    } catch (err) {
      console.error('❌ Error al cargar tarjetas:', err);
      setError(err.message || 'Error al cargar tarjetas');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Establecer una tarjeta como predeterminada
   * @param {string} paymentMethodId - ID del payment method de Stripe
   * @returns {Promise<boolean>} - true si se estableció correctamente
   */
  const setDefaultCard = useCallback(async (paymentMethodId) => {
    try {
      console.log(`🔄 Estableciendo tarjeta ${paymentMethodId} como default...`);
      
      const response = await api.put('/payments/set-default-payment-method', {
        paymentMethodId
      });
      
      if (response.data.success) {
        setDefaultCardId(paymentMethodId);
        console.log(`✅ Tarjeta establecida como default`);
        return true;
      }
      
      return false;
      
    } catch (err) {
      console.error('❌ Error al establecer tarjeta default:', err);
      setError(err.response?.data?.msg || err.message || 'Error al establecer tarjeta');
      return false;
    }
  }, []);

  /**
   * Eliminar una tarjeta
   * @param {string} paymentMethodId - ID del payment method de Stripe
   * @returns {Promise<boolean>} - true si se eliminó correctamente
   */
  const deleteCard = useCallback(async (paymentMethodId) => {
    try {
      console.log(`🔄 Eliminando tarjeta ${paymentMethodId}...`);
      
      const response = await api.delete(`/payments/payment-methods/${paymentMethodId}`);
      
      if (response.data.success) {
        console.log(`✅ Tarjeta eliminada`);
        // Recargar lista de tarjetas
        await loadCards();
        return true;
      }
      
      return false;
      
    } catch (err) {
      console.error('❌ Error al eliminar tarjeta:', err);
      setError(err.response?.data?.msg || err.message || 'Error al eliminar tarjeta');
      return false;
    }
  }, [loadCards]);

  /**
   * Sincronizar tarjetas con Stripe
   * @returns {Promise<boolean>} - true si se sincronizó correctamente
   */
  const syncCards = useCallback(async () => {
    try {
      console.log('🔄 Sincronizando tarjetas con Stripe...');
      
      const response = await api.post('/payments/sync-cards');
      
      if (response.data.success) {
        console.log(`✅ Sincronizadas ${response.data.synced} tarjetas`);
        // Recargar lista de tarjetas
        await loadCards();
        return true;
      }
      
      return false;
      
    } catch (err) {
      console.error('❌ Error al sincronizar tarjetas:', err);
      setError(err.response?.data?.msg || err.message || 'Error al sincronizar');
      return false;
    }
  }, [loadCards]);

  /**
   * Obtener la tarjeta por defecto
   * @returns {object|null} - Objeto de la tarjeta por defecto o null
   */
  const getDefaultCard = useCallback(() => {
    if (!defaultCardId || cards.length === 0) return null;
    return cards.find(card => card.id === defaultCardId) || null;
  }, [cards, defaultCardId]);

  /**
   * Verificar si una tarjeta es la por defecto
   * @param {string} paymentMethodId - ID del payment method
   * @returns {boolean}
   */
  const isDefaultCard = useCallback((paymentMethodId) => {
    return defaultCardId === paymentMethodId;
  }, [defaultCardId]);

  // Cargar tarjetas al montar el componente
  useEffect(() => {
    loadCards();
  }, [loadCards]);

  return {
    // Estados
    cards,
    defaultCardId,
    loading,
    customerId,
    error,
    
    // Funciones
    loadCards,
    setDefaultCard,
    deleteCard,
    syncCards,
    getDefaultCard,
    isDefaultCard,
    
    // Utilidades
    hasCards: cards.length > 0,
    cardsCount: cards.length,
  };
};

export default usePaymentMethods;
