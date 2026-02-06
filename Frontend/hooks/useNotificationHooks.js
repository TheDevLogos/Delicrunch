import { useContext, useCallback } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  getRandomNotification,
  getNotificationsByCategory,
  scheduleRandomCreativeNotification,
  sendImmediateNotification,
} from '../services/notificationService';

// Hook principal para usar el contexto de notificaciones
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
}

// Hook para notificaciones contextuales basadas en acciones del usuario
export function useContextualNotifications() {
  const { sendNotification } = useNotifications();

  // Notificación cuando el usuario agrega al carrito
  const notifyAddedToCart = useCallback(async (productName) => {
    const messages = [
      `¡${productName} agregado! 🛒 ¿Algo más que te provoque?`,
      `¡Excelente elección! ${productName} está en tu carrito 🎉`,
      `${productName} te espera en el carrito. ¿Listo para ordenar?`,
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    await sendNotification('Agregado al carrito', randomMessage);
  }, [sendNotification]);

  // Notificación cuando completa una compra
  const notifyPurchaseComplete = useCallback(async (orderNumber) => {
    await sendNotification(
      '✅ ¡Pedido confirmado!',
      `Tu orden #${orderNumber} está en camino. ¡Prepárate para disfrutar!`
    );
  }, [sendNotification]);

  // Notificación de logro desbloqueado
  const notifyAchievementUnlocked = useCallback(async (achievementName, points) => {
    await sendNotification(
      `🏆 ¡Logro desbloqueado!`,
      `Has conseguido "${achievementName}" y ganado ${points} puntos`
    );
  }, [sendNotification]);

  // Notificación de descuento disponible
  const notifyDiscountAvailable = useCallback(async (discount, expiresIn) => {
    await sendNotification(
      `💰 ¡${discount}% de descuento!`,
      `Aprovecha esta oferta en las próximas ${expiresIn} horas`
    );
  }, [sendNotification]);

  // Notificación de nuevo restaurante cerca
  const notifyNewRestaurantNearby = useCallback(async (restaurantName, distance) => {
    await sendNotification(
      `🆕 Nuevo restaurante cerca`,
      `${restaurantName} acaba de abrir a ${distance}km de ti. ¡Descúbrelo!`
    );
  }, [sendNotification]);

  // Notificación de impacto ambiental
  const notifyEcoImpact = useCallback(async (co2Saved, trees) => {
    await sendNotification(
      `🌱 ¡Impacto positivo!`,
      `Has ahorrado ${co2Saved}kg de CO2. Equivalente a plantar ${trees} árboles 🌳`
    );
  }, [sendNotification]);

  return {
    notifyAddedToCart,
    notifyPurchaseComplete,
    notifyAchievementUnlocked,
    notifyDiscountAvailable,
    notifyNewRestaurantNearby,
    notifyEcoImpact,
  };
}

// Hook para programar notificaciones creativas aleatorias
export function useScheduleCreativeNotifications() {
  const scheduleCreative = useCallback(async (delayInSeconds = 60) => {
    try {
      const notification = await scheduleRandomCreativeNotification(delayInSeconds);
      console.log('Notificación programada:', notification.title);
      return notification;
    } catch (error) {
      console.error('Error programando notificación creativa:', error);
      throw error;
    }
  }, []);

  const scheduleByCategory = useCallback(async (category, delayInSeconds = 60) => {
    try {
      const notifications = getNotificationsByCategory(category);
      if (notifications.length === 0) {
        throw new Error(`No hay notificaciones para la categoría: ${category}`);
      }

      const randomNotif = notifications[Math.floor(Math.random() * notifications.length)];
      
      await sendImmediateNotification(
        randomNotif.title,
        randomNotif.body,
        randomNotif.data
      );

      return randomNotif;
    } catch (error) {
      console.error('Error programando notificación por categoría:', error);
      throw error;
    }
  }, []);

  return {
    scheduleCreative,
    scheduleByCategory,
  };
}

// Hook para notificaciones de ofertas urgentes
export function useUrgentDealsNotifications() {
  const { sendNotification } = useNotifications();

  const notifyFlashDeal = useCallback(async (dealInfo) => {
    const { discount, restaurant, timeLeft } = dealInfo;
    await sendNotification(
      `⚡ Flash Deal: ${discount}% OFF`,
      `En ${restaurant}. ¡Solo por ${timeLeft} minutos!`,
      { type: 'flash_deal', urgent: true }
    );
  }, [sendNotification]);

  const notifyLastChance = useCallback(async (couponCode, expiresInMinutes) => {
    await sendNotification(
      `⏰ ¡Última oportunidad!`,
      `Cupón ${couponCode} expira en ${expiresInMinutes} minutos`,
      { type: 'last_chance', urgent: true }
    );
  }, [sendNotification]);

  const notifyLowStock = useCallback(async (productName, unitsLeft) => {
    await sendNotification(
      `🔥 ¡Stock limitado!`,
      `Solo quedan ${unitsLeft} unidades de ${productName}`,
      { type: 'low_stock', urgent: true }
    );
  }, [sendNotification]);

  return {
    notifyFlashDeal,
    notifyLastChance,
    notifyLowStock,
  };
}

export default {
  useNotifications,
  useContextualNotifications,
  useScheduleCreativeNotifications,
  useUrgentDealsNotifications,
};
