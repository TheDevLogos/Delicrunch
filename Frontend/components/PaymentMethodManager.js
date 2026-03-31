/**
 * PaymentMethodManager - Gestión de métodos de pago de MercadoPago para usuarios
 * Explica el proceso y mantiene el historial de pagos
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';

const TGTG_COLORS = {
  primary: '#00AB84',
  primaryDark: '#008768',
  primaryLight: '#E6F7F3',
  success: '#34C759',
  warning: '#FF9500',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  background: '#F8F9FA',
};

const PaymentMethodManager = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [hasCompletedPayment, setHasCompletedPayment] = useState(false);

  useEffect(() => {
    loadPaymentStatus();
  }, []);

  const loadPaymentStatus = async () => {
    try {
      setLoading(true);
      
      // Verificar en AsyncStorage si el usuario ya completó un pago
      const mpStatus = await AsyncStorage.getItem('@mercadopago_user_status');
      if (mpStatus) {
        const parsed = JSON.parse(mpStatus);
        setHasCompletedPayment(parsed.hasCompletedPayment || false);
      }

      // Verificar en el backend si hay pagos completados
      try {
        const response = await api.get('/payments/user-status');
        if (response.data.success) {
          const serverStatus = response.data.data;
          setPaymentStatus(serverStatus);
          
          if (serverStatus.totalPayments > 0) {
            setHasCompletedPayment(true);
            // Guardar en AsyncStorage
            await AsyncStorage.setItem('@mercadopago_user_status', JSON.stringify({
              hasCompletedPayment: true,
              totalPayments: serverStatus.totalPayments,
              lastPayment: serverStatus.lastPayment,
            }));
          }
        }
      } catch (apiError) {
        // Si el endpoint no existe o falla, usar solo AsyncStorage
        console.log('API user-status no disponible, usando datos locales');
      }
    } catch (error) {
      console.error('Error cargando estado de pago:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPayment = () => {
    Alert.alert(
      '🧪 Datos de Prueba MercadoPago',
      'Usuario de prueba:\n\nEmail: TESTUSER629845597039228278\nContraseña: q54PAVQxwZ\nCódigo verificación: 906188\n\nTarjetas de prueba:\n• Visa: 4509 9535 6623 3704\n• Mastercard: 5031 7557 3454 0604\nCVV: 123\nVencimiento: 11/25',
      [
        { text: 'Entendido', style: 'default' }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={TGTG_COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <LinearGradient
        colors={hasCompletedPayment 
          ? [TGTG_COLORS.success, '#2EA06E'] 
          : ['#009EE3', '#0077B5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerCard}
      >
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name={hasCompletedPayment ? "check-decagram" : "credit-card-multiple"}
            size={40}
            color="white"
          />
        </View>
        <Text style={styles.headerTitle}>
          {hasCompletedPayment 
            ? '✓ Cuenta MercadoPago Vinculada' 
            : '💳 Configura tu Método de Pago'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {hasCompletedPayment 
            ? `Has completado ${paymentStatus?.totalPayments || 0} ${paymentStatus?.totalPayments === 1 ? 'pago' : 'pagos'} exitosos`
            : 'Realiza tu primera compra para vincular tu cuenta'}
        </Text>
      </LinearGradient>

      {/* Status Card */}
      {hasCompletedPayment && paymentStatus && (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="information-circle" size={20} color={TGTG_COLORS.primary} />
            <Text style={styles.statusTitle}>Estado de tu cuenta</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Total de pagos:</Text>
            <Text style={styles.statusValue}>{paymentStatus.totalPayments}</Text>
          </View>
          
          {paymentStatus.lastPayment && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Último pago:</Text>
              <Text style={styles.statusValue}>
                {new Date(paymentStatus.lastPayment).toLocaleDateString('es-MX')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* How it Works Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="help-circle-outline" size={24} color={TGTG_COLORS.primary} />
          <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
        </View>

        <View style={styles.stepsList}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Selecciona un producto</Text>
              <Text style={styles.stepText}>
                Elige cualquier producto disponible en Delicrunch
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Procede al pago</Text>
              <Text style={styles.stepText}>
                Serás redirigido a MercadoPago para completar tu primera compra
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Inicia sesión o regístrate</Text>
              <Text style={styles.stepText}>
                En tu primer pago, ingresa tus datos en MercadoPago. Después, tus datos quedarán guardados
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>¡Listo para comprar!</Text>
              <Text style={styles.stepText}>
                En tus siguientes compras, MercadoPago recordará tu cuenta
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Benefits Card */}
      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>🔐 Beneficios de MercadoPago</Text>
        
        <View style={styles.benefit}>
          <Ionicons name="shield-checkmark" size={20} color={TGTG_COLORS.success} />
          <Text style={styles.benefitText}>Protección al comprador</Text>
        </View>
        
        <View style={styles.benefit}>
          <Ionicons name="lock-closed" size={20} color={TGTG_COLORS.success} />
          <Text style={styles.benefitText}>Datos encriptados</Text>
        </View>
        
        <View style={styles.benefit}>
          <Ionicons name="card" size={20} color={TGTG_COLORS.success} />
          <Text style={styles.benefitText}>Múltiples medios de pago</Text>
        </View>
        
        <View style={styles.benefit}>
          <Ionicons name="repeat" size={20} color={TGTG_COLORS.success} />
          <Text style={styles.benefitText}>Compras recurrentes sin re-ingresar datos</Text>
        </View>
      </View>

      {/* Test Account Info */}
      <TouchableOpacity style={styles.testCard} onPress={handleTestPayment} activeOpacity={0.7}>
        <View style={styles.testIcon}>
          <Ionicons name="flask" size={20} color={TGTG_COLORS.warning} />
        </View>
        <View style={styles.testContent}>
          <Text style={styles.testTitle}>Datos de prueba disponibles</Text>
          <Text style={styles.testText}>Toca aquí para ver las credenciales de prueba</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={TGTG_COLORS.textSecondary} />
      </TouchableOpacity>

      {/* Action Buttons */}
      {!hasCompletedPayment && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Descubre' })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[TGTG_COLORS.primary, TGTG_COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>Explorar Productos</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Help Link */}
      <TouchableOpacity
        style={styles.helpButton}
        onPress={() => {
          Alert.alert(
            '❓ ¿Necesitas ayuda?',
            'Si tienes problemas con tu pago o necesitas asistencia, contáctanos:\n\n📧 soporte@delicrunch.com\n📱 WhatsApp: +52 55 1234 5678',
            [{ text: 'Entendido' }]
          );
        }}
      >
        <Ionicons name="help-circle-outline" size={20} color={TGTG_COLORS.primary} />
        <Text style={styles.helpButtonText}>¿Necesitas ayuda?</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TGTG_COLORS.background,
    padding: 16,
  },
  headerCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: TGTG_COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TGTG_COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: TGTG_COLORS.background,
  },
  statusLabel: {
    fontSize: 14,
    color: TGTG_COLORS.textSecondary,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TGTG_COLORS.text,
  },
  infoCard: {
    backgroundColor: TGTG_COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TGTG_COLORS.text,
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TGTG_COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: TGTG_COLORS.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TGTG_COLORS.text,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    color: TGTG_COLORS.textSecondary,
    lineHeight: 18,
  },
  benefitsCard: {
    backgroundColor: TGTG_COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TGTG_COLORS.text,
    marginBottom: 12,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  benefitText: {
    fontSize: 14,
    color: TGTG_COLORS.text,
    fontWeight: '500',
  },
  testCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: TGTG_COLORS.warning,
  },
  testIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testContent: {
    flex: 1,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TGTG_COLORS.text,
    marginBottom: 2,
  },
  testText: {
    fontSize: 12,
    color: TGTG_COLORS.textSecondary,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: TGTG_COLORS.card,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  helpButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: TGTG_COLORS.primary,
  },
});

export default PaymentMethodManager;
