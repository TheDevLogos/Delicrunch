/**
 * 🔔 DELICRUNCH - Hook de Notificaciones
 * 
 * Hook personalizado que proporciona acceso fácil al sistema de
 * notificaciones y métodos útiles para diferentes escenarios.
 */

import { useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import notificationService from '../services/notificationService';

/**
 * Hook para enviar notificaciones contextuales basadas en acciones del usuario
 */
export function useContextualNotifications() {
  const { isEnabled, sendNotification, scheduleReminder } = useNotifications();

  /**
   * Notifica cuando hay nuevos packs disponibles cerca
   */
  const notifyNewPacksNearby = useCallback(async (count = 1) => {
    if (!isEnabled) return;
    
    const titles = [
      "🎉 ¡Nuevos packs cerca de ti!",
      "📍 Hay novedades en tu zona",
      "🔔 Packs frescos disponibles",
    ];
    
    const bodies = [
      `${count} pack${count > 1 ? 's' : ''} nuevo${count > 1 ? 's' : ''} te esper${count > 1 ? 'an' : 'a'}. ¡No te lo${count > 1 ? 's' : ''} pierdas!`,
      `Encontramos ${count} oferta${count > 1 ? 's' : ''} increíble${count > 1 ? 's' : ''} cerca de ti.`,
      `${count} comercio${count > 1 ? 's' : ''} cerca acaba${count > 1 ? 'n' : ''} de publicar packs.`,
    ];
    
    const randomIndex = Math.floor(Math.random() * titles.length);
    
    await sendNotification(titles[randomIndex], bodies[randomIndex], {
      type: 'new_packs_nearby',
      count,
    });
  }, [isEnabled, sendNotification]);

  /**
   * Notifica sobre un descuento especial
   */
  const notifySpecialDiscount = useCallback(async (discount, storeName) => {
    if (!isEnabled) return;
    
    await sendNotification(
      `💰 ¡${discount}% OFF en ${storeName}!`,
      `Oferta por tiempo limitado. ¡Aprovecha antes de que se acabe!`,
      {
        type: 'special_discount',
        discount,
        storeName,
      }
    );
  }, [isEnabled, sendNotification]);

  /**
   * Notifica cuando el carrito está a punto de expirar
   */
  const notifyCartExpiring = useCallback(async (itemName) => {
    if (!isEnabled) return;
    
    await sendNotification(
      "⏰ Tu carrito te extraña",
      `"${itemName}" sigue esperándote. ¡Completa tu pedido!`,
      {
        type: 'cart_expiring',
        itemName,
      }
    );
  }, [isEnabled, sendNotification]);

  /**
   * Notifica sobre una orden lista para recoger
   */
  const notifyOrderReady = useCallback(async (orderNumber, storeName) => {
    if (!isEnabled) return;
    
    await sendNotification(
      "✅ ¡Tu pedido está listo!",
      `Orden #${orderNumber} lista para recoger en ${storeName}`,
      {
        type: 'order_ready',
        orderNumber,
        storeName,
      }
    );
  }, [isEnabled, sendNotification]);

  /**
   * Notifica sobre puntos/recompensas ganadas
   */
  const notifyRewardEarned = useCallback(async (points, totalPoints) => {
    if (!isEnabled) return;
    
    await sendNotification(
      "🌟 ¡Ganaste puntos!",
      `+${points} puntos eco. Total: ${totalPoints}. ¡Sigue rescatando!`,
      {
        type: 'reward_earned',
        points,
        totalPoints,
      }
    );
  }, [isEnabled, sendNotification]);

  /**
   * Notifica sobre un flash deal
   */
  const notifyFlashDeal = useCallback(async (storeName, timeLeft) => {
    if (!isEnabled) return;
    
    await sendNotification(
      "⚡ ¡Flash Deal activo!",
      `${storeName} tiene ofertas relámpago. Quedan ${timeLeft} minutos.`,
      {
        type: 'flash_deal',
        storeName,
        timeLeft,
      }
    );
  }, [isEnabled, sendNotification]);

  /**
   * Programa un recordatorio para volver a la app
   */
  const scheduleReEngagement = useCallback(async (delayHours = 24) => {
    if (!isEnabled) return;
    
    const notification = notificationService.getRandomNotification();
    
    await notificationService.scheduleLocalNotification({
      title: notification.title,
      body: notification.body,
      data: {
        type: 're_engagement',
        notificationId: notification.id,
      },
      trigger: {
        seconds: delayHours * 60 * 60,
      },
    });
  }, [isEnabled]);

  return {
    notifyNewPacksNearby,
    notifySpecialDiscount,
    notifyCartExpiring,
    notifyOrderReady,
    notifyRewardEarned,
    notifyFlashDeal,
    scheduleReEngagement,
  };
}

/**
 * Hook para categorías específicas de notificaciones
 */
export function useCategoryNotifications() {
  const { isEnabled, sendNotification } = useNotifications();

  /**
   * Envía una notificación de la categoría "antojo"
   */
  const sendCravingNotification = useCallback(async () => {
    if (!isEnabled) return;
    const notification = notificationService.getNotificationByCategory('antojo');
    await sendNotification(notification.title, notification.body, {
      category: 'antojo',
      notificationId: notification.id,
    });
  }, [isEnabled, sendNotification]);

  /**
   * Envía una notificación de la categoría "ahorro"
   */
  const sendSavingsNotification = useCallback(async () => {
    if (!isEnabled) return;
    const notification = notificationService.getNotificationByCategory('ahorro');
    await sendNotification(notification.title, notification.body, {
      category: 'ahorro',
      notificationId: notification.id,
    });
  }, [isEnabled, sendNotification]);

  /**
   * Envía una notificación de la categoría "eco"
   */
  const sendEcoNotification = useCallback(async () => {
    if (!isEnabled) return;
    const notification = notificationService.getNotificationByCategory('eco');
    await sendNotification(notification.title, notification.body, {
      category: 'eco',
      notificationId: notification.id,
    });
  }, [isEnabled, sendNotification]);

  /**
   * Envía una notificación de la categoría "urgencia"
   */
  const sendUrgencyNotification = useCallback(async () => {
    if (!isEnabled) return;
    const notification = notificationService.getNotificationByCategory('urgencia');
    await sendNotification(notification.title, notification.body, {
      category: 'urgencia',
      notificationId: notification.id,
    });
  }, [isEnabled, sendNotification]);

  /**
   * Envía una notificación de la categoría "diversión"
   */
  const sendFunNotification = useCallback(async () => {
    if (!isEnabled) return;
    const notification = notificationService.getNotificationByCategory('diversion');
    await sendNotification(notification.title, notification.body, {
      category: 'diversion',
      notificationId: notification.id,
    });
  }, [isEnabled, sendNotification]);

  /**
   * Envía una notificación de la categoría "comida"
   */
  const sendFoodNotification = useCallback(async () => {
    if (!isEnabled) return;
    const notification = notificationService.getNotificationByCategory('comida');
    await sendNotification(notification.title, notification.body, {
      category: 'comida',
      notificationId: notification.id,
    });
  }, [isEnabled, sendNotification]);

  return {
    sendCravingNotification,
    sendSavingsNotification,
    sendEcoNotification,
    sendUrgencyNotification,
    sendFunNotification,
    sendFoodNotification,
  };
}

export default useContextualNotifications;
