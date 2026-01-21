/**
 * 🔔 DELICRUNCH - Pantalla de Configuración de Notificaciones
 * 
 * Permite a los usuarios gestionar sus preferencias de notificaciones
 * y ver/probar el sistema de notificaciones.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../contexts/NotificationContext';

export default function NotificationSettingsScreen({ navigation }) {
  const {
    isEnabled,
    isInitialized,
    dailyNotificationsEnabled,
    scheduledNotifications,
    pushToken,
    toggleDailyNotifications,
    requestPermissions,
    sendRandomNotification,
    cancelAll,
    refreshScheduledNotifications,
    getAllNotifications,
  } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshScheduledNotifications();
  }, []);

  /**
   * Solicita permisos de notificación
   */
  const handleRequestPermissions = async () => {
    setIsLoading(true);
    const granted = await requestPermissions();
    setIsLoading(false);

    if (granted) {
      Alert.alert(
        '✅ Notificaciones Activadas',
        'Ahora recibirás notificaciones sobre ofertas y packs disponibles.'
      );
    } else {
      Alert.alert(
        'Permisos Requeridos',
        'Para recibir notificaciones, actívalas en la configuración de tu dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  /**
   * Prueba enviando una notificación
   */
  const handleTestNotification = async () => {
    if (!isEnabled) {
      Alert.alert('Notificaciones Desactivadas', 'Primero activa las notificaciones.');
      return;
    }

    await sendRandomNotification();
    Alert.alert(
      '📬 Notificación Enviada',
      'Deberías ver una notificación en unos segundos.'
    );
  };

  /**
   * Toggle notificaciones diarias
   */
  const handleToggleDailyNotifications = async (value) => {
    await toggleDailyNotifications(value);
  };

  /**
   * Cancela todas las notificaciones
   */
  const handleCancelAll = async () => {
    Alert.alert(
      'Cancelar Notificaciones',
      '¿Estás seguro de cancelar todas las notificaciones programadas?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            await cancelAll();
            Alert.alert('✅', 'Todas las notificaciones han sido canceladas.');
          },
        },
      ]
    );
  };

  /**
   * Muestra lista de notificaciones disponibles
   */
  const handleShowNotificationList = () => {
    const notifications = getAllNotifications();
    const categories = [...new Set(notifications.map(n => n.category))];
    
    let message = '';
    categories.forEach(cat => {
      const count = notifications.filter(n => n.category === cat).length;
      message += `• ${cat}: ${count} notificaciones\n`;
    });
    message += `\nTotal: ${notifications.length} notificaciones creativas`;

    Alert.alert('📋 Notificaciones Disponibles', message);
  };

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="notifications-outline" size={48} color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="notifications" size={64} color="#FF6B35" />
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <Text style={styles.headerSubtitle}>
          Recibe alertas sobre ofertas y packs disponibles
        </Text>
      </View>

      {/* Estado de Notificaciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado</Text>
        
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons 
              name={isEnabled ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={isEnabled ? "#4CAF50" : "#F44336"} 
            />
            <Text style={styles.statusText}>
              Notificaciones {isEnabled ? 'Activadas' : 'Desactivadas'}
            </Text>
          </View>

          {!isEnabled && (
            <TouchableOpacity 
              style={styles.enableButton}
              onPress={handleRequestPermissions}
              disabled={isLoading}
            >
              <Ionicons name="notifications" size={20} color="#FFF" />
              <Text style={styles.enableButtonText}>
                {isLoading ? 'Activando...' : 'Activar Notificaciones'}
              </Text>
            </TouchableOpacity>
          )}

          {isEnabled && pushToken && (
            <Text style={styles.tokenText} numberOfLines={1}>
              Token: {pushToken.substring(0, 30)}...
            </Text>
          )}
        </View>
      </View>

      {/* Preferencias */}
      {isEnabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="today" size={24} color="#FF6B35" />
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceTitle}>Notificaciones Diarias</Text>
                  <Text style={styles.preferenceDescription}>
                    Recibe 3 recordatorios al día sobre packs disponibles
                  </Text>
                </View>
              </View>
              <Switch
                value={dailyNotificationsEnabled}
                onValueChange={handleToggleDailyNotifications}
                trackColor={{ false: '#E0E0E0', true: '#FFCCBC' }}
                thumbColor={dailyNotificationsEnabled ? '#FF6B35' : '#BDBDBD'}
              />
            </View>

            <View style={styles.scheduledInfo}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.scheduledText}>
                Horarios: 11:30, 17:00, 19:30
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Notificaciones Programadas */}
      {isEnabled && scheduledNotifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Programadas ({scheduledNotifications.length})
          </Text>
          
          <View style={styles.scheduledCard}>
            {scheduledNotifications.slice(0, 5).map((notif, index) => (
              <View key={index} style={styles.scheduledItem}>
                <Ionicons name="alarm-outline" size={20} color="#FF6B35" />
                <Text style={styles.scheduledItemText} numberOfLines={1}>
                  {notif.content.title}
                </Text>
              </View>
            ))}
            {scheduledNotifications.length > 5 && (
              <Text style={styles.moreText}>
                +{scheduledNotifications.length - 5} más...
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Acciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones</Text>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleTestNotification}
          disabled={!isEnabled}
        >
          <Ionicons name="send" size={20} color="#FF6B35" />
          <Text style={styles.actionButtonText}>Enviar Notificación de Prueba</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShowNotificationList}
        >
          <Ionicons name="list" size={20} color="#FF6B35" />
          <Text style={styles.actionButtonText}>Ver Tipos de Notificaciones</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => refreshScheduledNotifications()}
        >
          <Ionicons name="refresh" size={20} color="#FF6B35" />
          <Text style={styles.actionButtonText}>Actualizar Lista</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        {isEnabled && scheduledNotifications.length > 0 && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleCancelAll}
          >
            <Ionicons name="trash" size={20} color="#F44336" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>
              Cancelar Todas las Notificaciones
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Ionicons name="information-circle-outline" size={20} color="#999" />
        <Text style={styles.infoText}>
          Las notificaciones te ayudan a no perderte las mejores ofertas. 
          Puedes desactivarlas en cualquier momento.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  enableButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tokenText: {
    fontSize: 10,
    color: '#999',
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  preferenceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  preferenceText: {
    marginLeft: 12,
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scheduledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  scheduledText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  scheduledCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduledItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  scheduledItemText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  dangerText: {
    color: '#F44336',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
    lineHeight: 18,
  },
  bottomPadding: {
    height: 40,
  },
});
