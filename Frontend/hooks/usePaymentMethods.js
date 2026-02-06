/**
 * usePaymentMethods - Hook para métodos de pago con Mercado Pago
 * 
 * NOTA: Con Mercado Pago Checkout Pro, las tarjetas se gestionan
 * directamente en la página de Mercado Pago, no en la app.
 * 
 * Este hook ahora proporciona información básica sobre
 * el estado de pago del usuario.
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const usePaymentMethods = () => {
  // Estados
  const [savedMethods, setSavedMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Cargar métodos de pago guardados (si hay alguno en la BD local)
   */
  const loadMethods = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando métodos de pago...');
      
      // Con Mercado Pago Checkout Pro, las tarjetas se gestionan en MP
      // Aquí solo obtenemos métodos guardados localmente si existen
      const response = await api.get('/payments/methods');
      
      if (response.data.success !== false) {
        const methods = response.data.methods || response.data || [];
        setSavedMethods(methods);
        console.log(`✅ Cargados ${methods.length} métodos`);
      }
      
    } catch (err) {
      // Si el endpoint no existe o falla, simplemente no hay métodos guardados
      console.log('ℹ️ No hay métodos de pago guardados:', err.message);
      setSavedMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar un método de pago guardado
   * @param {number} methodId - ID del método en la BD
   */
  const deleteMethod = useCallback(async (methodId) => {
    try {
      await api.delete(`/payments/methods/${methodId}`);
      setSavedMethods(prev => prev.filter(m => m.id !== methodId));
      console.log(`✅ Método ${methodId} eliminado`);
      return true;
    } catch (err) {
      console.error('❌ Error al eliminar método:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  return {
    // Estados
    cards: savedMethods, // Mantener compatibilidad con código existente
    savedMethods,
    loading,
    error,
    
    // Acciones
    loadCards: loadMethods, // Alias para compatibilidad
    loadMethods,
    deleteMethod,
    
    // Con Mercado Pago estas funciones no aplican
    defaultCardId: null,
    setDefaultCard: async () => false,
    deleteCard: deleteMethod,
    customerId: null,
    refresh: loadMethods,
  };
};

export default usePaymentMethods;
