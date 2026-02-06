/**
 * MerchantPaymentSettingsScreen - Configuración de Pagos para Comercios
 * Pantalla dedicada para gestionar cuenta de Mercado Pago
 * Diseño inspirado en Too Good To Go
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';
import { formatPrice, formatDate } from '../src/utils/format';

const MerchantPaymentSettingsScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // Estados para cuenta Mercado Pago
  const [accountStatus, setAccountStatus] = useState(null);
  const [balance, setBalance] = useState({ available: [], pending: [] });
  const [payouts, setPayouts] = useState([]);
  
  // Formulario de configuración
  const [mercadopagoEmail, setMercadopagoEmail] = useState('');
  const [showConfigForm, setShowConfigForm] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPaymentSettings();
    }, [])
  );

  const loadPaymentSettings = async () => {
    try {
      setIsLoading(true);
      
      // Cargar estado de cuenta
      const statusRes = await api.get('/payments/merchant-status');
      setAccountStatus(statusRes.data);
      
      // Si tiene cuenta activa, cargar balance y payouts
      if (statusRes.data.hasMercadoPagoAccount) {
        try {
          const balanceRes = await api.get('/payments/merchant-balance');
          setBalance(balanceRes.data);
        } catch (error) {
          console.log('Error cargando balance:', error);
        }
        
        try {
          const payoutsRes = await api.get('/payments/merchant-payouts');
          setPayouts(payoutsRes.data.payouts || []);
        } catch (error) {
          console.log('Error cargando payouts:', error);
        }
      }
    } catch (error) {
      console.error('Error cargando configuración de pagos:', error);
      Alert.alert('Error', 'No se pudo cargar la información de pagos');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaymentSettings();
  };

  const handleConfigureMercadoPago = async () => {
    if (!mercadopagoEmail || !mercadopagoEmail.includes('@')) {
      Alert.alert('Error', 'Por favor ingresa un email válido de Mercado Pago');
      return;
    }

    setIsConfiguring(true);
    try {
      await api.post('/payments/merchant-setup', {
        mercadopago_email: mercadopagoEmail,
      });
      
      Alert.alert(
        '✅ ¡Configuración exitosa!',
        'Tu cuenta de Mercado Pago ha sido vinculada correctamente. Ahora podrás recibir pagos por tus ventas.',
        [{ text: 'OK' }]
      );
      
      setShowConfigForm(false);
      setMercadopagoEmail('');
      loadPaymentSettings();
    } catch (error) {
      console.error('Error configurando Mercado Pago:', error);
      Alert.alert('Error', error.response?.data?.msg || 'No se pudo configurar Mercado Pago');
    } finally {
      setIsConfiguring(false);
    }
  };

  const getStatusIcon = (status) => {
    const statusMap = {
      'paid': { icon: 'checkmark-circle', color: COLORS.success },
      'pending': { icon: 'time-outline', color: COLORS.warning },
      'in_transit': { icon: 'airplane-outline', color: COLORS.info },
      'failed': { icon: 'close-circle', color: COLORS.error },
    };
    return statusMap[status] || statusMap['pending'];
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'paid': 'Pagado',
      'pending': 'Pendiente',
      'in_transit': 'En tránsito',
      'failed': 'Fallido',
      'canceled': 'Cancelado',
    };
    return statusMap[status] || status;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </SafeAreaView>
    );
  }

  // Obtener balance principal
  const mainBalance = balance.available?.find(b => b.currency === 'MXN') || { amount: 0, currency: 'MXN' };
  const mainPending = balance.pending?.find(b => b.currency === 'MXN') || { amount: 0, currency: 'MXN' };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración de Pagos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Estado de Cuenta */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bank" size={24} color="#009EE3" />
            <Text style={styles.sectionTitle}>Estado de tu Cuenta</Text>
          </View>
          
          <View style={styles.card}>
            {!accountStatus?.hasMercadoPagoAccount ? (
              <>
                <View style={styles.statusRow}>
                  <Ionicons name="information-circle" size={20} color={COLORS.textSecondary} />
                  <Text style={styles.statusText}>No has configurado tu cuenta de pagos</Text>
                </View>
                <Text style={styles.infoText}>
                  Para recibir pagos por tus ventas, necesitas vincular tu cuenta de Mercado Pago.
                </Text>
                
                {!showConfigForm ? (
                  <TouchableOpacity 
                    style={styles.configButton}
                    onPress={() => setShowConfigForm(true)}
                  >
                    <MaterialCommunityIcons name="link-variant-plus" size={20} color="#FFF" />
                    <Text style={styles.configButtonText}>Configurar Mercado Pago</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.configForm}>
                    <Text style={styles.formLabel}>Email de tu cuenta Mercado Pago:</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="tu_email@ejemplo.com"
                      placeholderTextColor={COLORS.textTertiary}
                      value={mercadopagoEmail}
                      onChangeText={setMercadopagoEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <View style={styles.formButtons}>
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowConfigForm(false);
                          setMercadopagoEmail('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.saveButton, isConfiguring && styles.saveButtonDisabled]}
                        onPress={handleConfigureMercadoPago}
                        disabled={isConfiguring}
                      >
                        {isConfiguring ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text style={styles.saveButtonText}>Guardar</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={styles.statusRow}>
                  <Ionicons 
                    name={accountStatus.chargesEnabled ? "checkmark-circle" : "alert-circle"} 
                    size={20} 
                    color={accountStatus.chargesEnabled ? COLORS.success : COLORS.warning} 
                  />
                  <Text style={[
                    styles.statusText,
                    { color: accountStatus.chargesEnabled ? COLORS.success : COLORS.warning }
                  ]}>
                    {accountStatus.chargesEnabled ? 'Puede recibir pagos' : 'No puede recibir pagos aún'}
                  </Text>
                </View>
                
                <View style={styles.statusRow}>
                  <Ionicons 
                    name={accountStatus.payoutsEnabled ? "checkmark-circle" : "alert-circle"} 
                    size={20} 
                    color={accountStatus.payoutsEnabled ? COLORS.success : COLORS.warning} 
                  />
                  <Text style={[
                    styles.statusText,
                    { color: accountStatus.payoutsEnabled ? COLORS.success : COLORS.warning }
                  ]}>
                    {accountStatus.payoutsEnabled ? 'Puede recibir transferencias' : 'No puede recibir transferencias aún'}
                  </Text>
                </View>

                <View style={styles.divider} />
                
                {accountStatus.mercadopagoEmail && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email vinculado:</Text>
                    <Text style={styles.infoValue}>{accountStatus.mercadopagoEmail}</Text>
                  </View>
                )}
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Comisión plataforma:</Text>
                  <Text style={styles.infoValue}>{accountStatus.comisionPlataforma || 25}%</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Balance - Solo si tiene cuenta activa */}
        {accountStatus?.hasMercadoPagoAccount && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="wallet" size={24} color="#009EE3" />
              <Text style={styles.sectionTitle}>Balance</Text>
            </View>
            
            <View style={styles.balanceCards}>
              <LinearGradient
                colors={['#009EE3', '#00B1EA']}
                style={styles.balanceCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.balanceLabel}>Disponible</Text>
                <Text style={styles.balanceAmount}>
                  ${formatPrice(mainBalance.amount)} MXN
                </Text>
                <Text style={styles.balanceNote}>Listo para transferir</Text>
              </LinearGradient>
              
              <View style={styles.pendingCard}>
                <Text style={styles.pendingLabel}>En tránsito</Text>
                <Text style={styles.pendingAmount}>
                  ${formatPrice(mainPending.amount)} MXN
                </Text>
                <Text style={styles.pendingNote}>Llegará pronto</Text>
              </View>
            </View>
          </View>
        )}

        {/* Historial de Pagos */}
        {accountStatus?.hasMercadoPagoAccount && payouts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt" size={24} color="#009EE3" />
              <Text style={styles.sectionTitle}>Últimos Pagos</Text>
            </View>
            
            <View style={styles.card}>
              {payouts.map((payout, index) => {
                const statusInfo = getStatusIcon(payout.status);
                return (
                  <View key={payout.id || index}>
                    <View style={styles.payoutRow}>
                      <View style={styles.payoutLeft}>
                        <View style={[styles.payoutIcon, { backgroundColor: statusInfo.color + '20' }]}>
                          <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
                        </View>
                        <View style={styles.payoutInfo}>
                          <Text style={styles.payoutDescription}>{payout.description || `Pago #${payout.id}`}</Text>
                          <Text style={styles.payoutDate}>
                            {payout.created ? new Date(payout.created * 1000 || payout.created).toLocaleDateString('es-MX') : 'Reciente'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.payoutRight}>
                        <Text style={styles.payoutAmount}>
                          ${formatPrice(payout.amount)} {payout.currency}
                        </Text>
                        <Text style={[styles.payoutStatus, { color: statusInfo.color }]}>
                          {getStatusLabel(payout.status)}
                        </Text>
                      </View>
                    </View>
                    {index < payouts.length - 1 && <View style={styles.payoutDivider} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Info sobre Mercado Pago */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color={COLORS.textSecondary} />
            <Text style={styles.sectionTitle}>Información</Text>
          </View>
          
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
              <Text style={styles.infoItemText}>
                Mercado Pago protege todas tus transacciones con cifrado de grado bancario
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color={COLORS.info} />
              <Text style={styles.infoItemText}>
                Los pagos se acreditan automáticamente según los tiempos de Mercado Pago
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="cash" size={20} color={COLORS.primary} />
              <Text style={styles.infoItemText}>
                Recibirás el {100 - (accountStatus?.comisionPlataforma || 25)}% del valor de cada venta
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: SPACING.xl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  configButton: {
    flexDirection: 'row',
    backgroundColor: '#009EE3',
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  configButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  configForm: {
    marginTop: SPACING.sm,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: '#009EE3',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  balanceCards: {
    gap: SPACING.sm,
  },
  balanceCard: {
    borderRadius: 12,
    padding: SPACING.lg,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.xs,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: SPACING.xs,
  },
  balanceNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  pendingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  pendingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  pendingAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  pendingNote: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  payoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  payoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payoutInfo: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  payoutDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  payoutDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  payoutRight: {
    alignItems: 'flex-end',
  },
  payoutAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  payoutStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  payoutDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  infoItemText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default MerchantPaymentSettingsScreen;
