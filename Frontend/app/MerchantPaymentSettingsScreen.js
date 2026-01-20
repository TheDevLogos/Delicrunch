/**
 * MerchantPaymentSettingsScreen - Configuración de Pagos para Comercios
 * Pantalla dedicada para gestionar cuenta de Stripe Connect
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import api from '../services/api';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';
import { formatPrice, formatDate } from '../src/utils/format';

const MerchantPaymentSettingsScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  
  // Estados para cuenta Stripe
  const [accountStatus, setAccountStatus] = useState(null);
  const [balance, setBalance] = useState({ available: [], pending: [] });
  const [payouts, setPayouts] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadPaymentSettings();
    }, [])
  );

  const loadPaymentSettings = async () => {
    try {
      setIsLoading(true);
      
      // Cargar estado de cuenta
      const statusRes = await api.get('/payments/stripe-account-status');
      setAccountStatus(statusRes.data);
      
      // Si tiene cuenta activa, cargar balance y payouts
      if (statusRes.data.hasStripeAccount && statusRes.data.chargesEnabled) {
        try {
          const balanceRes = await api.get('/payments/connected-account-balance');
          setBalance(balanceRes.data);
        } catch (error) {
          console.log('Error cargando balance:', error);
        }
        
        try {
          const payoutsRes = await api.get('/payments/upcoming-payouts');
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

  const handleOpenOnboarding = async () => {
    setIsCreatingLink(true);
    try {
      const response = await api.post('/payments/create-account-link');
      const { url } = response.data;
      await WebBrowser.openBrowserAsync(url);
      
      // Recargar después de cerrar el navegador
      setTimeout(() => {
        loadPaymentSettings();
      }, 2000);
    } catch (error) {
      console.error('Error creando enlace:', error);
      Alert.alert('Error', 'No se pudo generar el enlace de configuración');
    } finally {
      setIsCreatingLink(false);
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
  const mainBalance = balance.available.find(b => b.currency === 'MXN') || { amount: 0, currency: 'MXN' };
  const mainPending = balance.pending.find(b => b.currency === 'MXN') || { amount: 0, currency: 'MXN' };

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
            <MaterialCommunityIcons name="bank" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Estado de tu Cuenta</Text>
          </View>
          
          <View style={styles.card}>
            {!accountStatus?.hasStripeAccount ? (
              <>
                <View style={styles.statusRow}>
                  <Ionicons name="information-circle" size={20} color={COLORS.textSecondary} />
                  <Text style={styles.statusText}>No has configurado tu cuenta de pagos</Text>
                </View>
                <Text style={styles.infoText}>
                  Para recibir pagos por tus ventas, necesitas conectar una cuenta bancaria con Stripe.
                </Text>
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
                
                <View style={styles.statusRow}>
                  <Ionicons 
                    name={accountStatus.detailsSubmitted ? "checkmark-circle" : "alert-circle"} 
                    size={20} 
                    color={accountStatus.detailsSubmitted ? COLORS.success : COLORS.warning} 
                  />
                  <Text style={[
                    styles.statusText,
                    { color: accountStatus.detailsSubmitted ? COLORS.success : COLORS.warning }
                  ]}>
                    {accountStatus.detailsSubmitted ? 'Información completa' : 'Información incompleta'}
                  </Text>
                </View>

                <View style={styles.divider} />
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tipo:</Text>
                  <Text style={styles.infoValue}>{accountStatus.type === 'express' ? 'Express' : 'Standard'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>País:</Text>
                  <Text style={styles.infoValue}>{accountStatus.country || 'No especificado'}</Text>
                </View>
                
                {accountStatus.email && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{accountStatus.email}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Balance - Solo si tiene cuenta activa */}
        {accountStatus?.hasStripeAccount && accountStatus?.chargesEnabled && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={24} color={COLORS.success} />
              <Text style={styles.sectionTitle}>Balance</Text>
            </View>
            
            <View style={[styles.card, styles.balanceCard]}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.balanceGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.balanceSection}>
                  <Text style={styles.balanceLabel}>Disponible</Text>
                  <Text style={styles.balanceAmount}>
                    ${formatPrice(mainBalance.amount)} {mainBalance.currency}
                  </Text>
                </View>
                
                <View style={styles.balanceDivider} />
                
                <View style={styles.balanceSection}>
                  <Text style={styles.balanceLabel}>Pendiente</Text>
                  <Text style={styles.balanceAmount}>
                    ${formatPrice(mainPending.amount)} {mainPending.currency}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Comisiones */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="chart-pie" size={24} color={COLORS.info} />
            <Text style={styles.sectionTitle}>Comisiones</Text>
          </View>
          
          <View style={styles.card}>
            <View style={styles.commissionRow}>
              <View style={styles.commissionInfo}>
                <Text style={styles.commissionLabel}>Comercio recibe</Text>
                <Text style={styles.commissionPercentage}>75%</Text>
              </View>
              <View style={[styles.commissionBar, { flex: 3, backgroundColor: COLORS.success }]} />
            </View>
            
            <View style={styles.commissionRow}>
              <View style={styles.commissionInfo}>
                <Text style={styles.commissionLabel}>Plataforma cobra</Text>
                <Text style={styles.commissionPercentage}>25%</Text>
              </View>
              <View style={[styles.commissionBar, { flex: 1, backgroundColor: COLORS.primary }]} />
            </View>
            
            <Text style={styles.commissionNote}>
              Las comisiones se aplican automáticamente en cada venta
            </Text>
          </View>
        </View>

        {/* Próximos Pagos */}
        {payouts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={24} color={COLORS.warning} />
              <Text style={styles.sectionTitle}>Próximos Pagos</Text>
            </View>
            
            {payouts.slice(0, 5).map((payout) => {
              const statusInfo = getStatusIcon(payout.status);
              return (
                <View key={payout.id} style={styles.payoutCard}>
                  <View style={styles.payoutHeader}>
                    <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
                    <Text style={[styles.payoutStatus, { color: statusInfo.color }]}>
                      {getStatusLabel(payout.status)}
                    </Text>
                  </View>
                  
                  <Text style={styles.payoutAmount}>
                    ${formatPrice(payout.amount)} {payout.currency}
                  </Text>
                  
                  <View style={styles.payoutFooter}>
                    <Text style={styles.payoutDate}>
                      Llegada: {formatDate(payout.arrivalDate * 1000)}
                    </Text>
                    <Text style={styles.payoutMethod}>
                      {payout.method === 'standard' ? 'Transferencia' : payout.method}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Botón de Acción Principal */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              isCreatingLink && styles.actionButtonDisabled
            ]}
            onPress={handleOpenOnboarding}
            disabled={isCreatingLink}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isCreatingLink ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="card" size={24} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>
                    {!accountStatus?.hasStripeAccount 
                      ? 'Conectar con Stripe'
                      : accountStatus.chargesEnabled 
                        ? 'Gestionar Cuenta'
                        : 'Continuar Configuración'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.disclaimer}>
            Serás redirigido a Stripe para completar o gestionar tu cuenta de forma segura
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  
  // Section
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  
  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  
  // Status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontSize: 15,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  // Balance
  balanceCard: {
    padding: 0,
    overflow: 'hidden',
  },
  balanceGradient: {
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceSection: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.white,
    opacity: 0.3,
    marginHorizontal: SPACING.md,
  },
  
  // Commission
  commissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  commissionInfo: {
    width: 140,
  },
  commissionLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  commissionPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  commissionBar: {
    height: 8,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
  commissionNote: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  
  // Payouts
  payoutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  payoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  payoutStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  payoutAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginVertical: SPACING.xs,
  },
  payoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  payoutDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  payoutMethod: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  
  // Action Button
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 16,
  },
});

export default MerchantPaymentSettingsScreen;
