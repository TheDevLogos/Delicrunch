/**
 * 🔔 DELICRUNCH - Servicio de Notificaciones Push
 * 
 * Sistema de notificaciones nativas para Android que funcionan
 * aunque la app esté cerrada. Incluye 30 mensajes creativos
 * y enganchantes para atraer usuarios.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ============================================================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ============================================================================

// Configurar cómo se muestran las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ============================================================================
// 30 NOTIFICACIONES CREATIVAS PARA DELICRUNCH
// ============================================================================

export const CREATIVE_NOTIFICATIONS = [
  // 🍕 ANTOJO Y HAMBRE
  {
    id: 1,
    title: "🍕 ¿Cómo está tu antojo hoy?",
    body: "Hay packs deliciosos esperándote. ¡Rescátalos antes de que se acaben!",
    category: "antojo"
  },
  {
    id: 2,
    title: "🤔 ¿Ya decidiste qué cenar?",
    body: "Nosotros sí: comida increíble a precios de rescate. ¡Échale un ojo!",
    category: "antojo"
  },
  {
    id: 3,
    title: "😋 Tu estómago te está llamando...",
    body: "Y nosotros tenemos la respuesta. ¡Packs sorpresa con hasta 70% OFF!",
    category: "antojo"
  },
  {
    id: 4,
    title: "🌮 ¿Hambre a esta hora?",
    body: "No te preocupes, tenemos comida lista esperándote. ¡Abre la app!",
    category: "antojo"
  },
  {
    id: 5,
    title: "🍔 Houston, tenemos un problema...",
    body: "Tu refri está vacío. Solución: rescata un pack delicioso ahora.",
    category: "antojo"
  },

  // 💰 OFERTAS Y AHORRO
  {
    id: 6,
    title: "💸 ¿Te gusta ahorrar dinero?",
    body: "Obvio que sí. Tenemos packs con descuentos de hasta 70%. ¡No te los pierdas!",
    category: "ahorro"
  },
  {
    id: 7,
    title: "🎰 ¡Jackpot de comida!",
    body: "Encontramos ofertas increíbles cerca de ti. Tu billetera te lo agradecerá.",
    category: "ahorro"
  },
  {
    id: 8,
    title: "💰 Alerta de súper oferta",
    body: "Hay comercios con packs a precio de ganga. ¡Corre antes de que vuelen!",
    category: "ahorro"
  },
  {
    id: 9,
    title: "🤑 ¿Quieres comer rico sin gastar mucho?",
    body: "Misión posible. Rescata comida deliciosa a precios de locura.",
    category: "ahorro"
  },
  {
    id: 10,
    title: "💵 Tu dinero rinde más aquí",
    body: "Compra inteligente: misma calidad, mitad de precio. ¡Abre Delicrunch!",
    category: "ahorro"
  },

  // 🌍 IMPACTO AMBIENTAL
  {
    id: 11,
    title: "🌍 El planeta necesita héroes",
    body: "Cada pack que rescatas evita desperdicio. ¡Sé un héroe hoy!",
    category: "eco"
  },
  {
    id: 12,
    title: "🦸 Tu superpoder: rescatar comida",
    body: "Con cada compra salvas alimentos y cuidas el planeta. ¡Activa tu poder!",
    category: "eco"
  },
  {
    id: 13,
    title: "♻️ ¿Sabías que...?",
    body: "1/3 de la comida se desperdicia. Tú puedes cambiar eso. ¡Rescata un pack!",
    category: "eco"
  },
  {
    id: 14,
    title: "🌱 Comer rico y cuidar el planeta",
    body: "Dos pájaros de un tiro. Rescata comida y reduce el desperdicio.",
    category: "eco"
  },
  {
    id: 15,
    title: "🌿 Hazlo por el planeta",
    body: "Cada pack rescatado = menos CO2. ¡Tu pequeña acción, gran impacto!",
    category: "eco"
  },

  // ⏰ URGENCIA Y ESCASEZ
  {
    id: 16,
    title: "⏰ ¡Últimas horas!",
    body: "Los packs de hoy se están agotando. ¡No te quedes sin el tuyo!",
    category: "urgencia"
  },
  {
    id: 17,
    title: "🔥 Esto se pone caliente",
    body: "Los packs más populares están volando. ¡Apúrate!",
    category: "urgencia"
  },
  {
    id: 18,
    title: "⚡ ¡Corre, corre!",
    body: "Quedan pocos packs disponibles cerca de ti. ¡No dejes pasar la oportunidad!",
    category: "urgencia"
  },
  {
    id: 19,
    title: "🏃 Los rápidos ganan",
    body: "Las mejores ofertas duran poco. ¿Vas a quedarte fuera?",
    category: "urgencia"
  },
  {
    id: 20,
    title: "📢 Aviso importante",
    body: "Tus comercios favoritos tienen nuevos packs. ¡Ve antes de que se acaben!",
    category: "urgencia"
  },

  // 🎉 DIVERSIÓN Y CURIOSIDAD
  {
    id: 21,
    title: "🎲 ¿Te atreves a probar algo nuevo?",
    body: "Los packs sorpresa son una aventura culinaria. ¡Anímate!",
    category: "diversion"
  },
  {
    id: 22,
    title: "🎁 Tenemos una sorpresa para ti",
    body: "Abre la app y descubre qué delicia te espera hoy.",
    category: "diversion"
  },
  {
    id: 23,
    title: "🎯 Misión del día",
    body: "Rescatar al menos un pack delicioso. ¿Aceptas el reto?",
    category: "diversion"
  },
  {
    id: 24,
    title: "🌟 Tú eres especial",
    body: "Por eso te avisamos primero: hay nuevos packs disponibles. ¡Mira!",
    category: "diversion"
  },
  {
    id: 25,
    title: "🎪 El circo de los sabores",
    body: "Función única: packs deliciosos a precios mágicos. ¡Entrada gratis!",
    category: "diversion"
  },

  // 🍰 ESPECÍFICOS DE COMIDA
  {
    id: 26,
    title: "🍰 ¿Un postre para endulzar el día?",
    body: "Pastelerías cerca de ti tienen packs irresistibles. ¡Antójate!",
    category: "comida"
  },
  {
    id: 27,
    title: "☕ ¿Café y algo rico?",
    body: "Combos perfectos para tu tarde. Rescátalos antes de cerrar.",
    category: "comida"
  },
  {
    id: 28,
    title: "🥪 Hora del snack",
    body: "Tu cuerpo pide combustible. Tenemos opciones deliciosas cerca.",
    category: "comida"
  },
  {
    id: 29,
    title: "🍞 Pan recién hecho, precio de ayer",
    body: "Panaderías con productos del día a precios increíbles. ¡Huele delicioso!",
    category: "comida"
  },
  {
    id: 30,
    title: "🥗 ¿Comida saludable a buen precio?",
    body: "Sí existe. Rescata ensaladas, bowls y más. ¡Tu cuerpo te lo agradecerá!",
    category: "comida"
  }
];

// ============================================================================
// CONSTANTES
// ============================================================================

const STORAGE_KEYS = {
  PUSH_TOKEN: '@delicrunch_push_token',
  NOTIFICATION_PREFERENCES: '@delicrunch_notification_prefs',
  LAST_NOTIFICATION_TIME: '@delicrunch_last_notif_time',
  NOTIFICATION_HISTORY: '@delicrunch_notif_history',
};

const NOTIFICATION_CHANNELS = {
  DEFAULT: 'delicrunch-default',
  OFFERS: 'delicrunch-offers',
  REMINDERS: 'delicrunch-reminders',
};

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Registra el dispositivo para notificaciones push
 * @returns {Promise<string|null>} Token de push o null si falla
 */
export async function registerForPushNotifications() {
  let token = null;

  // Verificar si es un dispositivo físico
  if (!Device.isDevice) {
    console.log('⚠️ Las notificaciones push requieren un dispositivo físico');
    return null;
  }

  // Verificar/solicitar permisos
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('❌ Permisos de notificación denegados');
    return null;
  }

  // Configurar canal de notificación para Android
  if (Platform.OS === 'android') {
    await setupAndroidNotificationChannels();
  }

  try {
    // Obtener el token de Expo Push
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '266fa507-5eba-4cf8-b44f-0aa42d08a694', // Tu projectId de EAS
    });
    token = tokenData.data;
    
    // Guardar token localmente
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
    console.log('✅ Push Token registrado:', token);
  } catch (error) {
    console.error('❌ Error obteniendo push token:', error);
  }

  return token;
}

/**
 * Configura los canales de notificación para Android
 */
async function setupAndroidNotificationChannels() {
  // Canal principal
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DEFAULT, {
    name: 'Delicrunch',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B35',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });

  // Canal de ofertas
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.OFFERS, {
    name: 'Ofertas y Descuentos',
    description: 'Notificaciones sobre ofertas especiales y descuentos',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4CAF50',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });

  // Canal de recordatorios
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.REMINDERS, {
    name: 'Recordatorios',
    description: 'Recordatorios para rescatar packs',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#2196F3',
    sound: 'default',
    enableVibrate: true,
    showBadge: false,
  });

  console.log('✅ Canales de Android configurados');
}

/**
 * Obtiene una notificación aleatoria del pool de 30 mensajes
 * @returns {Object} Notificación aleatoria
 */
export function getRandomNotification() {
  const randomIndex = Math.floor(Math.random() * CREATIVE_NOTIFICATIONS.length);
  return CREATIVE_NOTIFICATIONS[randomIndex];
}

/**
 * Obtiene una notificación por categoría
 * @param {string} category - Categoría: antojo, ahorro, eco, urgencia, diversion, comida
 * @returns {Object} Notificación de la categoría
 */
export function getNotificationByCategory(category) {
  const filtered = CREATIVE_NOTIFICATIONS.filter(n => n.category === category);
  if (filtered.length === 0) return getRandomNotification();
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}

/**
 * Programa una notificación local
 * @param {Object} options - Opciones de la notificación
 * @returns {Promise<string>} ID de la notificación programada
 */
export async function scheduleLocalNotification(options = {}) {
  const {
    title,
    body,
    data = {},
    trigger = null, // null = inmediata
    channelId = NOTIFICATION_CHANNELS.DEFAULT,
  } = options;

  const notificationContent = {
    title,
    body,
    data: {
      ...data,
      timestamp: new Date().toISOString(),
    },
    sound: 'default',
    priority: 'high',
  };

  // Agregar channelId para Android
  if (Platform.OS === 'android') {
    notificationContent.channelId = channelId;
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: notificationContent,
    trigger,
  });

  console.log('📬 Notificación programada:', identifier);
  return identifier;
}

/**
 * Programa una notificación aleatoria
 * @param {Object} trigger - Cuándo mostrar la notificación
 * @returns {Promise<string>} ID de la notificación
 */
export async function scheduleRandomNotification(trigger = null) {
  const notification = getRandomNotification();
  
  return scheduleLocalNotification({
    title: notification.title,
    body: notification.body,
    data: {
      notificationId: notification.id,
      category: notification.category,
      type: 'random_engagement',
    },
    trigger,
    channelId: NOTIFICATION_CHANNELS.OFFERS,
  });
}

/**
 * Programa notificaciones diarias aleatorias
 * Programa 3 notificaciones al día en horarios óptimos
 */
export async function scheduleDailyNotifications() {
  // Cancelar notificaciones anteriores
  await cancelAllScheduledNotifications();

  const notificationTimes = [
    { hour: 11, minute: 30 }, // Antes del almuerzo
    { hour: 17, minute: 0 },  // Hora del snack
    { hour: 19, minute: 30 }, // Antes de la cena
  ];

  const scheduledIds = [];

  for (const time of notificationTimes) {
    const notification = getRandomNotification();
    
    const trigger = {
      hour: time.hour,
      minute: time.minute,
      repeats: true,
    };

    const id = await scheduleLocalNotification({
      title: notification.title,
      body: notification.body,
      data: {
        notificationId: notification.id,
        category: notification.category,
        type: 'daily_engagement',
        scheduledTime: `${time.hour}:${time.minute}`,
      },
      trigger,
      channelId: NOTIFICATION_CHANNELS.OFFERS,
    });

    scheduledIds.push(id);
  }

  console.log('📅 Notificaciones diarias programadas:', scheduledIds);
  
  // Guardar preferencia
  await AsyncStorage.setItem(
    STORAGE_KEYS.NOTIFICATION_PREFERENCES, 
    JSON.stringify({ dailyEnabled: true, scheduledIds })
  );

  return scheduledIds;
}

/**
 * Programa una notificación para recordar al usuario
 * @param {number} delayMinutes - Minutos hasta mostrar la notificación
 */
export async function scheduleReminderNotification(delayMinutes = 30) {
  const notification = getNotificationByCategory('urgencia');
  
  return scheduleLocalNotification({
    title: notification.title,
    body: notification.body,
    data: {
      notificationId: notification.id,
      category: notification.category,
      type: 'reminder',
    },
    trigger: {
      seconds: delayMinutes * 60,
    },
    channelId: NOTIFICATION_CHANNELS.REMINDERS,
  });
}

/**
 * Envía una notificación inmediata
 * @param {string} title - Título
 * @param {string} body - Cuerpo del mensaje
 * @param {Object} data - Datos adicionales
 */
export async function sendImmediateNotification(title, body, data = {}) {
  return scheduleLocalNotification({
    title,
    body,
    data,
    trigger: null, // Inmediata
  });
}

/**
 * Cancela todas las notificaciones programadas
 */
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('🗑️ Todas las notificaciones programadas canceladas');
}

/**
 * Cancela una notificación específica
 * @param {string} identifier - ID de la notificación
 */
export async function cancelNotification(identifier) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
  console.log('🗑️ Notificación cancelada:', identifier);
}

/**
 * Obtiene todas las notificaciones programadas
 * @returns {Promise<Array>} Lista de notificaciones programadas
 */
export async function getScheduledNotifications() {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications;
}

/**
 * Verifica si las notificaciones están habilitadas
 * @returns {Promise<boolean>}
 */
export async function areNotificationsEnabled() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Obtiene el token de push almacenado
 * @returns {Promise<string|null>}
 */
export async function getStoredPushToken() {
  return AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
}

/**
 * Limpia el badge de la app (iOS/Android)
 */
export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Establece el número del badge
 * @param {number} count - Número a mostrar
 */
export async function setBadgeCount(count) {
  await Notifications.setBadgeCountAsync(count);
}

// ============================================================================
// LISTENERS Y HANDLERS
// ============================================================================

/**
 * Configura los listeners para notificaciones
 * @param {Object} handlers - Handlers para diferentes eventos
 */
export function setupNotificationListeners(handlers = {}) {
  const {
    onNotificationReceived,
    onNotificationResponse,
  } = handlers;

  // Listener para notificaciones recibidas mientras la app está en primer plano
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    notification => {
      console.log('📥 Notificación recibida:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Listener para cuando el usuario interactúa con la notificación
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    response => {
      console.log('👆 Usuario interactuó con notificación:', response);
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    }
  );

  // Retornar función para limpiar subscripciones
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Obtiene la última notificación que abrió la app
 * @returns {Promise<Object|null>}
 */
export async function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  // Registro
  registerForPushNotifications,
  getStoredPushToken,
  areNotificationsEnabled,
  
  // Notificaciones
  CREATIVE_NOTIFICATIONS,
  getRandomNotification,
  getNotificationByCategory,
  
  // Programación
  scheduleLocalNotification,
  scheduleRandomNotification,
  scheduleDailyNotifications,
  scheduleReminderNotification,
  sendImmediateNotification,
  
  // Gestión
  cancelAllScheduledNotifications,
  cancelNotification,
  getScheduledNotifications,
  
  // Badge
  clearBadge,
  setBadgeCount,
  
  // Listeners
  setupNotificationListeners,
  getLastNotificationResponse,
};
