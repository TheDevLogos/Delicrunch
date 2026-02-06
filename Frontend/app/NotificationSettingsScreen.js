import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';
import {
  getAllScheduledNotifications,
  getRandomNotification,
  sendImmediateNotification,
} from '../services/notificationService';

export default function NotificationSettingsScreen() {
  const { 
    dailyNotificationsEnabled, 
    toggleDailyNotifications,
    sendNotification,
  } = useNotifications();

  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadScheduledNotifications();
  }, [dailyNotificationsEnabled]);

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await getAllScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const handleToggleDailyNotifications = async () => {
    setLoading(true);
    try {
      await toggleDailyNotifications();
      await loadScheduledNotifications();
      Alert.alert(
        'Éxito',
        dailyNotificationsEnabled
          ? 'Notificaciones diarias desactivadas'
          : 'Notificaciones diarias activadas'
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const randomNotif = getRandomNotification();
      await sendImmediateNotification(
        randomNotif.title,
        randomNotif.body,
        randomNotif.data
      );
      Alert.alert('¡Enviada!', 'Revisa tu bandeja de notificaciones');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la notificación de prueba');
    }
  };

  const renderScheduledNotification = ({ item, index }) => {
    const trigger = item.trigger;
    let scheduleText = 'Inmediata';

    if (trigger) {
      if (trigger.type === 'daily') {
        scheduleText = `Diaria a las ${trigger.hour}:${String(trigger.minute).padStart(2, '0')}`;
      } else if (trigger.type === 'timeInterval') {
        scheduleText = `En ${Math.round(trigger.seconds / 60)} minutos`;
      }
    }

    return (
      <View style={styles.notificationItem}>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>
            {item.content.title || 'Sin título'}
          </Text>
          <Text style={styles.notificationBody}>
            {item.content.body || 'Sin descripción'}
          </Text>
          <Text style={styles.notificationSchedule}>{scheduleText}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configuración de Notificaciones</Text>
        <Text style={styles.headerSubtitle}>
          Personaliza cómo y cuándo recibes notificaciones
        </Text>
      </View>

      {/* Toggle de notificaciones diarias */}
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>Notificaciones Diarias</Text>
          <Text style={styles.settingDescription}>
            Recibe recordatorios de desayuno, almuerzo y cena
          </Text>
        </View>
        <Switch
          value={dailyNotificationsEnabled}
          onValueChange={handleToggleDailyNotifications}
          disabled={loading}
          trackColor={{ false: '#767577', true: '#FF6B35' }}
          thumbColor={dailyNotificationsEnabled ? '#FFF' : '#f4f3f4'}
        />
      </View>

      {/* Botón de prueba */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={handleTestNotification}
      >
        <Text style={styles.testButtonText}>🔔 Enviar Notificación de Prueba</Text>
      </TouchableOpacity>

      {/* Lista de notificaciones programadas */}
      <View style={styles.scheduledSection}>
        <Text style={styles.sectionTitle}>
          Notificaciones Programadas ({scheduledNotifications.length})
        </Text>
        {scheduledNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No hay notificaciones programadas
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Activa las notificaciones diarias para comenzar
            </Text>
          </View>
        ) : (
          <FlatList
            data={scheduledNotifications}
            renderItem={renderScheduledNotification}
            keyExtractor={(item, index) => `notification-${index}`}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Información adicional */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ Acerca de las Notificaciones</Text>
        <Text style={styles.infoText}>
          • Recibirás ofertas personalizadas{'\n'}
          • Te avisaremos de nuevos restaurantes{'\n'}
          • Conocerás descuentos exclusivos{'\n'}
          • Recordatorios de comidas diarias{'\n'}
          • Alertas de impacto ambiental positivo
        </Text>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scheduledSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  notificationItem: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationSchedule: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: '#FFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  bottomPadding: {
    height: 32,
  },
});
