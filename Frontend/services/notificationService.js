import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración global de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Mensajes creativos para notificaciones (30 diferentes)
const CREATIVE_NOTIFICATIONS = [
  // Categoría: Antojo
  {
    category: 'antojo',
    title: '🍕 ¡Tu pizza favorita te extraña!',
    body: 'Han pasado 3 días sin ordenar. ¿Qué tal una pizza deliciosa hoy?',
    data: { type: 'craving', category: 'pizza' }
  },
  {
    category: 'antojo',
    title: '🍔 ¿Hambre de hamburguesa?',
    body: 'Las mejores hamburguesas de la ciudad están a un tap de distancia',
    data: { type: 'craving', category: 'burger' }
  },
  {
    category: 'antojo',
    title: '🍣 Sushi fresh hoy',
    body: 'Tu restaurante de sushi tiene nuevos rolls especiales',
    data: { type: 'craving', category: 'sushi' }
  },
  {
    category: 'antojo',
    title: '🌮 Martes de tacos',
    body: '¡Los mejores tacos al pastor te esperan!',
    data: { type: 'craving', category: 'tacos' }
  },
  {
    category: 'antojo',
    title: '🍰 ¿Antojo de postre?',
    body: 'Nuevos pasteles y postres disponibles cerca de ti',
    data: { type: 'craving', category: 'dessert' }
  },

  // Categoría: Ahorro
  {
    category: 'ahorro',
    title: '💰 ¡Flash Deal activo!',
    body: '50% OFF en restaurantes seleccionados por las próximas 2 horas',
    data: { type: 'deal', discount: 50 }
  },
  {
    category: 'ahorro',
    title: '🎉 Cupón especial para ti',
    body: '$100 de descuento en tu próxima orden de $500 o más',
    data: { type: 'coupon', amount: 100 }
  },
  {
    category: 'ahorro',
    title: '⚡ Ofertas relámpago',
    body: 'Descuentos especiales terminan en 1 hora',
    data: { type: 'flash', urgent: true }
  },
  {
    category: 'ahorro',
    title: '🏆 Recompensa desbloqueada',
    body: 'Has ganado 200 puntos. ¡Canjéalos por descuentos!',
    data: { type: 'rewards', points: 200 }
  },
  {
    category: 'ahorro',
    title: '💳 Cashback disponible',
    body: '10% de cashback en todos los restaurantes hoy',
    data: { type: 'cashback', percentage: 10 }
  },

  // Categoría: Eco-Friendly
  {
    category: 'eco',
    title: '🌱 Comida sostenible',
    body: 'Descubre restaurantes eco-friendly cerca de ti',
    data: { type: 'eco', category: 'sustainable' }
  },
  {
    category: 'eco',
    title: '♻️ ¡Evita desperdiciar!',
    body: 'Rescata comida deliciosa con 40% descuento antes de que cierre',
    data: { type: 'eco', category: 'rescue' }
  },
  {
    category: 'eco',
    title: '🌍 Compra verde, come bien',
    body: 'Cada pedido eco-friendly ayuda al planeta',
    data: { type: 'eco', impact: 'positive' }
  },
  {
    category: 'eco',
    title: '🌿 Has salvado 5kg de CO2',
    body: '¡Tu impacto ambiental es increíble! Sigue así',
    data: { type: 'eco', achievement: 'co2_saved' }
  },
  {
    category: 'eco',
    title: '🥗 Menú del día sostenible',
    body: 'Opciones vegetarianas y veganas con descuento especial',
    data: { type: 'eco', category: 'veggie' }
  },

  // Categoría: Urgencia
  {
    category: 'urgencia',
    title: '⏰ ¡Última oportunidad!',
    body: 'El cupón de $150 expira en 30 minutos',
    data: { type: 'urgent', reason: 'expiring_coupon' }
  },
  {
    category: 'urgencia',
    title: '🔥 Stock limitado',
    body: 'Solo quedan 3 porciones de tu platillo favorito',
    data: { type: 'urgent', reason: 'low_stock' }
  },
  {
    category: 'urgencia',
    title: '⚡ Cierra en 1 hora',
    body: 'Tu restaurante favorito está por cerrar. ¡Ordena ahora!',
    data: { type: 'urgent', reason: 'closing_soon' }
  },
  {
    category: 'urgencia',
    title: '🎯 Mesa reservada',
    body: 'Tu mesa se liberará en 15 minutos. ¿Confirmas asistencia?',
    data: { type: 'urgent', reason: 'reservation' }
  },
  {
    category: 'urgencia',
    title: '📦 Pedido listo',
    body: 'Tu orden está lista para recoger. Mantiene su calor por 20 min',
    data: { type: 'urgent', reason: 'pickup_ready' }
  },

  // Categoría: Diversión
  {
    category: 'diversion',
    title: '🎲 Ruleta de la suerte',
    body: '¡Gira la ruleta y gana descuentos de hasta 70%!',
    data: { type: 'fun', game: 'roulette' }
  },
  {
    category: 'diversion',
    title: '🎊 ¡Sorpresa del día!',
    body: 'Toca para descubrir tu regalo misterioso',
    data: { type: 'fun', surprise: true }
  },
  {
    category: 'diversion',
    title: '🏅 Nuevo logro desbloqueado',
    body: 'Has completado 10 pedidos. ¡Eres un foodie experto!',
    data: { type: 'fun', achievement: 'foodie_expert' }
  },
  {
    category: 'diversion',
    title: '🎮 Desafío del día',
    body: 'Prueba 3 restaurantes nuevos y gana puntos dobles',
    data: { type: 'fun', challenge: 'explorer' }
  },
  {
    category: 'diversion',
    title: '🌟 ¡Nivel subido!',
    body: 'Ahora eres nivel Platinum. Disfruta beneficios exclusivos',
    data: { type: 'fun', level_up: 'platinum' }
  },

  // Categoría: Comida por hora del día
  {
    category: 'comida',
    title: '☕ Buenos días',
    body: 'Empieza el día con un desayuno delicioso',
    data: { type: 'meal_time', meal: 'breakfast' }
  },
  {
    category: 'comida',
    title: '🌅 Hora del almuerzo',
    body: 'Menús ejecutivos con entrega rápida disponibles',
    data: { type: 'meal_time', meal: 'lunch' }
  },
  {
    category: 'comida',
    title: '🌙 ¿Qué hay de cenar?',
    body: 'Cena especial con descuento después de las 8pm',
    data: { type: 'meal_time', meal: 'dinner' }
  },
  {
    category: 'comida',
    title: '🍿 Snack de media tarde',
    body: 'Antojitos y botanas perfectos para este momento',
    data: { type: 'meal_time', meal: 'snack' }
  },
  {
    category: 'comida',
    title: '🌮 Viernes de antojo',
    body: 'Fin de semana empieza con tu comida favorita',
    data: { type: 'meal_time', meal: 'weekend' }
  }
];

// Registrar el dispositivo para notificaciones push
export async function registerForPushNotifications() {
  try {
    let token;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('⚠️ Permisos de notificación no concedidos');
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('✅ Push Token:', token);
    } else {
      console.log('⚠️ No es un dispositivo físico - notificaciones push no disponibles');
      return null;
    }

    // Configuración para Android
    if (Platform.OS === 'android') {
      await setupAndroidNotificationChannels();
    }

    return token;
  } catch (error) {
    console.log('⚠️ Error al registrar notificaciones push:', error.message);
    // No romper la app si falla el registro de notificaciones
    return null;
  }
}

// Configurar canales de notificación para Android
async function setupAndroidNotificationChannels() {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Notificaciones Generales',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B35',
  });

  await Notifications.setNotificationChannelAsync('deals', {
    name: 'Ofertas y Descuentos',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFD700',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('orders', {
    name: 'Estado de Pedidos',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250],
    lightColor: '#4CAF50',
  });

  await Notifications.setNotificationChannelAsync('eco', {
    name: 'Eco-Friendly',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#8BC34A',
  });
}

// Programar notificaciones diarias
export async function scheduleDailyNotifications() {
  // Cancelar notificaciones previas
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Programar notificación de desayuno (8:00 AM)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '☕ Buenos días',
      body: 'Empieza el día con un desayuno delicioso',
      data: { type: 'morning' },
      sound: 'default',
    },
    trigger: {
      hour: 8,
      minute: 0,
      repeats: true,
    },
  });

  // Programar notificación de almuerzo (1:00 PM)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌅 Hora del almuerzo',
      body: 'Menús ejecutivos con entrega rápida disponibles',
      data: { type: 'lunch' },
      sound: 'default',
    },
    trigger: {
      hour: 13,
      minute: 0,
      repeats: true,
    },
  });

  // Programar notificación de cena (7:00 PM)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 ¿Qué hay de cenar?',
      body: 'Cena especial con descuento después de las 8pm',
      data: { type: 'dinner' },
      sound: 'default',
    },
    trigger: {
      hour: 19,
      minute: 0,
      repeats: true,
    },
  });

  console.log('Notificaciones diarias programadas');
}

// Enviar notificación inmediata
export async function sendImmediateNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // null = inmediata
  });
}

// Obtener notificación aleatoria creativa
export function getRandomNotification() {
  const randomIndex = Math.floor(Math.random() * CREATIVE_NOTIFICATIONS.length);
  return CREATIVE_NOTIFICATIONS[randomIndex];
}

// Obtener notificaciones por categoría
export function getNotificationsByCategory(category) {
  return CREATIVE_NOTIFICATIONS.filter(notif => notif.category === category);
}

// Programar notificación creativa aleatoria
export async function scheduleRandomCreativeNotification(delayInSeconds = 60) {
  const randomNotif = getRandomNotification();
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: randomNotif.title,
      body: randomNotif.body,
      data: randomNotif.data,
      sound: 'default',
    },
    trigger: {
      seconds: delayInSeconds,
    },
  });

  return randomNotif;
}

// Obtener todas las notificaciones programadas
export async function getAllScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Cancelar todas las notificaciones
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Guardar preferencias de notificaciones
export async function saveNotificationPreferences(preferences) {
  try {
    await AsyncStorage.setItem('notification_preferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error guardando preferencias:', error);
  }
}

// Obtener preferencias de notificaciones
export async function getNotificationPreferences() {
  try {
    const preferences = await AsyncStorage.getItem('notification_preferences');
    return preferences ? JSON.parse(preferences) : null;
  } catch (error) {
    console.error('Error obteniendo preferencias:', error);
    return null;
  }
}

// Manejar notificación recibida cuando la app está en primer plano
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

// Manejar interacción del usuario con la notificación
export function addNotificationResponseReceivedListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export default {
  registerForPushNotifications,
  scheduleDailyNotifications,
  sendImmediateNotification,
  getRandomNotification,
  getNotificationsByCategory,
  scheduleRandomCreativeNotification,
  getAllScheduledNotifications,
  cancelAllNotifications,
  saveNotificationPreferences,
  getNotificationPreferences,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  CREATIVE_NOTIFICATIONS,
};
