/**
 * 🔔 DELICRUNCH - Contexto de Notificaciones
 * 
 * Provider que gestiona el estado global de notificaciones,
 * inicializa el sistema y proporciona métodos a toda la app.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../services/notificationService';

// ============================================================================
// CONTEXTO
// ============================================================================

const NotificationContext = createContext(null);

// ============================================================================
// CONSTANTES
// ============================================================================

const STORAGE_KEYS = {
  NOTIFICATIONS_INITIALIZED: '@delicrunch_notifs_initialized',
  DAILY_NOTIFICATIONS_ENABLED: '@delicrunch_daily_notifs',
  LAST_OPEN_TIME: '@delicrunch_last_open',
};

// ============================================================================
// PROVIDER
// ============================================================================

export function NotificationProvider({ children }) {
  // Estado
  const [pushToken, setPushToken] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [dailyNotificationsEnabled, setDailyNotificationsEnabled] = useState(true);

  // Refs
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef();
  const responseListener = useRef();

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  useEffect(() => {
    initializeNotifications();

    // Listener para cambios en el estado de la app
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (notificationListener.current) {
        notificationListener.current();
      }
    };
  }, []);

  /**
   * Inicializa el sistema de notificaciones
   */
  const initializeNotifications = async () => {
    try {
      console.log('🔔 Inicializando sistema de notificaciones...');

      // Verificar si las notificaciones están habilitadas
      const enabled = await notificationService.areNotificationsEnabled();
      setIsEnabled(enabled);

      if (enabled) {
        try {
          // Registrar para push notifications
          const token = await notificationService.registerForPushNotifications();
          if (token) {
            setPushToken(token);
          }

          // Configurar listeners
          const cleanup = notificationService.setupNotificationListeners({
            onNotificationReceived: handleNotificationReceived,
            onNotificationResponse: handleNotificationResponse,
          });
          notificationListener.current = cleanup;
        } catch (error) {
          console.log('⚠️ Error al inicializar notificaciones:', error.message);
          // Continuar sin notificaciones push
        }

        // Verificar si es la primera vez
        const initialized = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_INITIALIZED);
        
        if (!initialized) {
          // Primera vez: programar notificaciones diarias
          await scheduleDailyNotificationsInternal();
          await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_INITIALIZED, 'true');
          console.log('✅ Notificaciones diarias configuradas por primera vez');
        }

        // Cargar preferencias
        const dailyEnabled = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_NOTIFICATIONS_ENABLED);
        setDailyNotificationsEnabled(dailyEnabled !== 'false');

        // Obtener notificaciones programadas
        await refreshScheduledNotifications();

        // Verificar si la app fue abierta desde una notificación
        await checkInitialNotification();
      }

      setIsInitialized(true);
      console.log('✅ Sistema de notificaciones inicializado');

    } catch (error) {
      console.error('❌ Error inicializando notificaciones:', error);
      setIsInitialized(true);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Maneja cambios en el estado de la app (foreground/background)
   */
  const handleAppStateChange = async (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App volvió a primer plano
      console.log('📱 App en primer plano');
      
      // Limpiar badge
      await notificationService.clearBadge();
      
      // Guardar tiempo de apertura
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_OPEN_TIME, new Date().toISOString());
      
      // Actualizar lista de notificaciones programadas
      await refreshScheduledNotifications();
    }

    if (nextAppState === 'background') {
      // App pasó a segundo plano
      console.log('📱 App en segundo plano');
      
      // Programar recordatorio si está habilitado
      if (dailyNotificationsEnabled) {
        await scheduleBackgroundReminder();
      }
    }

    appState.current = nextAppState;
  };

  /**
   * Maneja notificaciones recibidas en primer plano
   */
  const handleNotificationReceived = (notification) => {
    console.log('📥 Notificación recibida en foreground:', notification);
    setLastNotification(notification);
  };

  /**
   * Maneja cuando el usuario toca una notificación
   */
  const handleNotificationResponse = (response) => {
    console.log('👆 Usuario tocó notificación:', response);
    const data = response.notification.request.content.data;
    
    // Aquí puedes navegar a pantallas específicas según el tipo de notificación
    if (data?.type === 'daily_engagement' || data?.type === 'random_engagement') {
      // Navegar a la pantalla de ofertas/home
      // navigation.navigate('Home');
    }
    
    setLastNotification(response.notification);
  };

  /**
   * Verifica si la app fue abierta desde una notificación
   */
  const checkInitialNotification = async () => {
    const response = await notificationService.getLastNotificationResponse();
    if (response) {
      console.log('📬 App abierta desde notificación:', response);
      handleNotificationResponse(response);
    }
  };

  // ============================================================================
  // MÉTODOS PÚBLICOS
  // ============================================================================

  /**
   * Solicita permisos de notificación
   */
  const requestPermissions = useCallback(async () => {
    try {
      const token = await notificationService.registerForPushNotifications();
      if (token) {
        setPushToken(token);
        setIsEnabled(true);
        await scheduleDailyNotificationsInternal();
        return true;
      }
      return false;
    } catch (error) {
      console.log('⚠️ Error al solicitar permisos:', error.message);
      return false;
    }
  }, []);

  /**
   * Programa notificaciones diarias (interno)
   */
  const scheduleDailyNotificationsInternal = async () => {
    if (Platform.OS !== 'web') {
      await notificationService.scheduleDailyNotifications();
      await refreshScheduledNotifications();
    }
  };

  /**
   * Habilita/deshabilita notificaciones diarias
   */
  const toggleDailyNotifications = useCallback(async (enabled) => {
    setDailyNotificationsEnabled(enabled);
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_NOTIFICATIONS_ENABLED, String(enabled));

    if (enabled) {
      await scheduleDailyNotificationsInternal();
      console.log('✅ Notificaciones diarias habilitadas');
    } else {
      await notificationService.cancelAllScheduledNotifications();
      setScheduledNotifications([]);
      console.log('🔕 Notificaciones diarias deshabilitadas');
    }
  }, []);

  /**
   * Envía una notificación inmediata
   */
  const sendNotification = useCallback(async (title, body, data = {}) => {
    return notificationService.sendImmediateNotification(title, body, data);
  }, []);

  /**
   * Envía una notificación aleatoria
   */
  const sendRandomNotification = useCallback(async () => {
    return notificationService.scheduleRandomNotification(null);
  }, []);

  /**
   * Programa un recordatorio
   */
  const scheduleReminder = useCallback(async (delayMinutes = 30) => {
    return notificationService.scheduleReminderNotification(delayMinutes);
  }, []);

  /**
   * Programa recordatorio cuando la app pasa a background
   */
  const scheduleBackgroundReminder = async () => {
    // Programar un recordatorio aleatorio para dentro de 2-4 horas
    const delayHours = 2 + Math.random() * 2; // Entre 2 y 4 horas
    const delayMinutes = Math.floor(delayHours * 60);
    
    const notification = notificationService.getRandomNotification();
    
    await notificationService.scheduleLocalNotification({
      title: notification.title,
      body: notification.body,
      data: {
        notificationId: notification.id,
        category: notification.category,
        type: 'background_reminder',
      },
      trigger: {
        seconds: delayMinutes * 60,
      },
    });

    console.log(`⏰ Recordatorio programado para ${delayMinutes} minutos`);
  };

  /**
   * Actualiza la lista de notificaciones programadas
   */
  const refreshScheduledNotifications = async () => {
    const notifications = await notificationService.getScheduledNotifications();
    setScheduledNotifications(notifications);
  };

  /**
   * Cancela todas las notificaciones
   */
  const cancelAll = useCallback(async () => {
    await notificationService.cancelAllScheduledNotifications();
    setScheduledNotifications([]);
  }, []);

  /**
   * Obtiene todas las notificaciones creativas disponibles
   */
  const getAllNotifications = useCallback(() => {
    return notificationService.CREATIVE_NOTIFICATIONS;
  }, []);

  /**
   * Obtiene una notificación aleatoria
   */
  const getRandomNotification = useCallback(() => {
    return notificationService.getRandomNotification();
  }, []);

  // ============================================================================
  // VALOR DEL CONTEXTO
  // ============================================================================

  const contextValue = {
    // Estado
    pushToken,
    isEnabled,
    isInitialized,
    lastNotification,
    scheduledNotifications,
    dailyNotificationsEnabled,

    // Métodos
    requestPermissions,
    toggleDailyNotifications,
    sendNotification,
    sendRandomNotification,
    scheduleReminder,
    cancelAll,
    refreshScheduledNotifications,
    
    // Utilidades
    getAllNotifications,
    getRandomNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default NotificationContext;
