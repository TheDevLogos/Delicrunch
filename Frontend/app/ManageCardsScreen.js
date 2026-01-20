/**
 * ManageCardsScreen - Gestión completa de tarjetas con Stripe
 * 
 * Permite a los usuarios:
 * - Ver tarjetas guardadas en Stripe
 * - Agregar nuevas tarjetas
 * - Establecer tarjeta por defecto
 * - Eliminar tarjetas
 * - Sincronizar con Stripe
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS, SHADOWS } from '../src/constants/theme';

// Iconos por marca de tarjeta
const CARD_BRAND_COLORS = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  amex: '#006FCF',
  discover: '#FF6000',
  default: COLORS.primary,
};

const ManageCardsScreen = ({ navigation }) => {
  const {
    cards,
    defaultCardId,
    loading,
    error,
    hasCards,
    cardsCount,
    loadCards,
    setDefaultCard,
    deleteCard,
    syncCards,
    isDefaultCard,
  } = usePaymentMethods();

  /**
   * Navegar a pantalla de agregar tarjeta
   */
  const handleAddCard = () => {
    navigation.navigate('SaveCard');
  };

  /**
   * Establecer tarjeta como predeterminada
   */
  const handleSetDefault = async (paymentMethodId, cardInfo) => {
    const success = await setDefaultCard(paymentMethodId);
    
    if (success) {
      Alert.alert(
        '✅ Tarjeta actualizada',
        `${cardInfo.brand.toUpperCase()} •••• ${cardInfo.last4} es ahora tu tarjeta predeterminada`
      );
    } else {
      Alert.alert(
        '❌ Error',
        'No se pudo establecer la tarjeta como predeterminada. Intenta de nuevo.'
      );
    }
  };

  /**
   * Eliminar tarjeta con confirmación
   */
  const handleDelete = (paymentMethodId, cardInfo) => {
    Alert.alert(
      'Eliminar tarjeta',
      `¿Estás seguro de eliminar la tarjeta ${cardInfo.brand.toUpperCase()} •••• ${cardInfo.last4}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCard(paymentMethodId);
            
            if (success) {
              Alert.alert('✅', 'Tarjeta eliminada correctamente');
            } else {
              Alert.alert('❌', 'No se pudo eliminar la tarjeta');
            }
          },
        },
      ]
    );
  };

  /**
   * Sincronizar tarjetas manualmente
   */
  const handleSync = async () => {
    const success = await syncCards();
    
    if (success) {
      Alert.alert('✅ Sincronizado', 'Tarjetas actualizadas desde Stripe');
    } else {
      Alert.alert('❌ Error', 'No se pudo sincronizar con Stripe');
    }
  };

  /**
   * Renderizar item de tarjeta
   */
  const renderCard = ({ item }) => {
    const isDefault = isDefaultCard(item.id);
    const brandColor = CARD_BRAND_COLORS[item.brand?.toLowerCase()] || CARD_BRAND_COLORS.default;

    return (
      <View style={[styles.cardItem, isDefault && styles.cardItemDefault]}>
        {/* Icono de marca */}
        <View style={[styles.cardIconContainer, { backgroundColor: `${brandColor}20` }]}>
          <Ionicons name="card" size={28} color={brandColor} />
        </View>

        {/* Información de la tarjeta */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardBrand}>
            {item.brand?.toUpperCase() || 'TARJETA'} •••• {item.last4}
          </Text>
          <Text style={styles.cardExpiry}>
            Vence: {String(item.exp_month).padStart(2, '0')}/{item.exp_year}
          </Text>
          {item.funding && (
            <Text style={styles.cardFunding}>
              {item.funding === 'credit' ? 'Crédito' : item.funding === 'debit' ? 'Débito' : item.funding}
            </Text>
          )}
        </View>

        {/* Badge de predeterminada */}
        {isDefault && (
          <View style={styles.defaultBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.defaultBadgeText}>Predeterminada</Text>
          </View>
        )}

        {/* Acciones */}
        <View style={styles.cardActions}>
          {/* Botón establecer como default */}
          <TouchableOpacity
            style={[styles.actionButton, isDefault && styles.actionButtonDisabled]}
            onPress={() => handleSetDefault(item.id, item)}
            disabled={isDefault}
          >
            <Ionicons
              name={isDefault ? 'star' : 'star-outline'}
              size={22}
              color={isDefault ? '#FFC107' : COLORS.textSecondary}
            />
          </TouchableOpacity>

          {/* Botón eliminar */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item.id, item)}
          >
            <Ionicons name="trash-outline" size={22} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * Estado vacío
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="card-outline" size={80} color={COLORS.textTertiary} />
      <Text style={styles.emptyTitle}>No tienes tarjetas guardadas</Text>
      <Text style={styles.emptySubtitle}>
        Agrega una tarjeta para realizar pagos más rápidos y seguros
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddCard}>
        <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
        <Text style={styles.emptyButtonText}>Agregar primera tarjeta</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Header de la lista
   */
  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderText}>
        {cardsCount} {cardsCount === 1 ? 'tarjeta guardada' : 'tarjetas guardadas'}
      </Text>
      
      {hasCards && (
        <TouchableOpacity onPress={handleSync} style={styles.syncButton}>
          <Ionicons name="sync" size={16} color={COLORS.primary} />
          <Text style={styles.syncButtonText}>Sincronizar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mis Tarjetas</Text>

        <TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Mensaje de error */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Lista de tarjetas */}
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        ListHeaderComponent={hasCards ? renderHeader : null}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={[
          styles.listContent,
          !hasCards && !loading && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadCards}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Footer con información */}
      {hasCards && (
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
          <Text style={styles.footerText}>
            Tus tarjetas están protegidas con encriptación de nivel bancario
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    margin: SPACING.md,
    padding: SPACING.sm,
    borderRadius: BORDERS.radius.md,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
  },

  // Lista
  listContent: {
    padding: SPACING.md,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  listHeaderText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.primarySoft,
    borderRadius: BORDERS.radius.sm,
  },
  syncButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },

  // Card item
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDERS.radius.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardItemDefault: {
    borderColor: COLORS.success,
    borderWidth: 2,
    backgroundColor: `${COLORS.success}08`,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  cardExpiry: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardFunding: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: SPACING.sm,
  },
  defaultBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BORDERS.radius.md,
    marginTop: SPACING.lg,
  },
  emptyButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});

export default ManageCardsScreen;
