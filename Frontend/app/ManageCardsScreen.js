/**
 * ManageCardsScreen - Información sobre métodos de pago
 * 
 * Con Mercado Pago Checkout Pro, los métodos de pago se gestionan
 * directamente en la plataforma de Mercado Pago.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';

const ManageCardsScreen = ({ navigation }) => {
  const openMercadoPago = () => {
    Linking.openURL('https://www.mercadopago.com.mx/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header con icono */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="credit-card-check" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Métodos de Pago</Text>
          <Text style={styles.subtitle}>
            Tus pagos son procesados de forma segura por Mercado Pago
          </Text>
        </View>

        {/* Información */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Pagos Seguros</Text>
              <Text style={styles.infoText}>
                Todas las transacciones están protegidas con encriptación SSL y los más altos estándares de seguridad.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="card" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Múltiples Métodos</Text>
              <Text style={styles.infoText}>
                Acepta tarjetas de crédito, débito, OXXO, SPEI y más métodos de pago.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="time" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Sin Guardar Datos</Text>
              <Text style={styles.infoText}>
                No almacenamos datos de tarjetas. Cada pago se procesa directamente en Mercado Pago.
              </Text>
            </View>
          </View>
        </View>

        {/* Métodos de pago aceptados */}
        <View style={styles.methodsSection}>
          <Text style={styles.sectionTitle}>Métodos Aceptados</Text>
          <View style={styles.methodsGrid}>
            <View style={styles.methodItem}>
              <Ionicons name="card" size={32} color="#1A1F71" />
              <Text style={styles.methodName}>Visa</Text>
            </View>
            <View style={styles.methodItem}>
              <Ionicons name="card" size={32} color="#EB001B" />
              <Text style={styles.methodName}>Mastercard</Text>
            </View>
            <View style={styles.methodItem}>
              <Ionicons name="card" size={32} color="#006FCF" />
              <Text style={styles.methodName}>AMEX</Text>
            </View>
            <View style={styles.methodItem}>
              <MaterialCommunityIcons name="store" size={32} color="#F44336" />
              <Text style={styles.methodName}>OXXO</Text>
            </View>
          </View>
        </View>

        {/* Botón para ir a Mercado Pago */}
        <TouchableOpacity style={styles.mpButton} onPress={openMercadoPago}>
          <MaterialCommunityIcons name="open-in-new" size={20} color={COLORS.white} />
          <Text style={styles.mpButtonText}>Administrar en Mercado Pago</Text>
        </TouchableOpacity>

        {/* Nota */}
        <Text style={styles.note}>
          Si tienes una cuenta de Mercado Pago, puedes guardar tus tarjetas directamente en su plataforma para pagos más rápidos.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  infoSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    ...SHADOWS.sm,
    marginBottom: SPACING.lg,
  },
  infoItem: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  methodsSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    ...SHADOWS.sm,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  methodItem: {
    alignItems: 'center',
    width: '25%',
    paddingVertical: SPACING.sm,
  },
  methodName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  mpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009EE3',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  mpButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  note: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ManageCardsScreen;
