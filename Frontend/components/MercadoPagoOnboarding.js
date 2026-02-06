  /**
 * MercadoPagoOnboarding - Componente de onboarding para Mercado Pago
 * Muestra información sobre la integración y botón para configurar
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';

const MercadoPagoOnboarding = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState(null);

  useEffect(() => {
    loadAccountStatus();
  }, []);

  const loadAccountStatus = async () => {
    try {
      const response = await api.get('/payments/merchant-status');
      setAccountStatus(response.data);
    } catch (error) {
      console.error('Error cargando estado de cuenta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureMercadoPago = () => {
    navigation.navigate('MerchantPaymentSettings');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  const isConfigured = accountStatus?.hasMercadoPagoAccount;
  const chargesEnabled = accountStatus?.chargesEnabled;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isConfigured ? ['#009EE3', '#0C7BA9'] : ['#FFD700', '#FFA500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={isConfigured ? "check-circle" : "alert-circle"}
              size={32}
              color="white"
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {isConfigured ? '✅ Mercado Pago Configurado' : '💳 Configura Mercado Pago'}
            </Text>
            <Text style={styles.subtitle}>
              {isConfigured 
                ? chargesEnabled 
                  ? 'Cuenta activa y lista para recibir pagos'
                  : 'Completa la configuración de tu cuenta'
                : 'Recibe pagos de forma segura'
              }
            </Text>
          </View>
        </View>

        {!isConfigured ? (
          <View style={styles.benefits}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.benefitText}>Pagos seguros y confiables</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.benefitText}>Retiros automáticos</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.benefitText}>Protección al vendedor</Text>
            </View>
          </View>
        ) : (
          <View style={styles.statusInfo}>
            {accountStatus.mercadopagoEmail && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={16} color="white" />
                <Text style={styles.infoText}>{accountStatus.mercadopagoEmail}</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleConfigureMercadoPago}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isConfigured ? 'Administrar Cuenta' : 'Configurar Ahora'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  card: {
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    marginRight: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  benefits: {
    marginBottom: SPACING.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  benefitText: {
    color: 'white',
    fontSize: 14,
    marginLeft: SPACING.sm,
  },
  statusInfo: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: 'white',
    fontSize: 14,
    marginLeft: SPACING.sm,
  },
  button: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: SPACING.sm,
  },
});

export default MercadoPagoOnboarding;
