import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Alert, 
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import StyledTextInput from '../components/StyledTextInput';
import api from '../services/api';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';

// Iconos de marca de tarjeta
const CARD_ICONS = {
  visa: 'card',
  mastercard: 'card',
  amex: 'card',
  default: 'card-outline',
};

const CardItem = ({ item, onDelete, onMakeDefault }) => (
  <View style={[styles.cardItem, item.is_default && styles.cardDefault]}> 
    <View style={styles.cardIconContainer}>
      <Ionicons 
        name={CARD_ICONS[item.brand?.toLowerCase()] || CARD_ICONS.default} 
        size={28} 
        color={item.is_default ? COLORS.primary : COLORS.textSecondary} 
      />
    </View>
    <View style={styles.cardInfo}>
      <Text style={styles.cardTitle}>
        {item.brand || 'Tarjeta'} •••• {item.last4}
      </Text>
      <Text style={styles.cardMeta}>
        Vence {String(item.exp_month).padStart(2,'0')}/{item.exp_year}
      </Text>
      {item.is_default && (
        <View style={styles.defaultBadge}>
          <Ionicons name="checkmark-circle" size={12} color={COLORS.primary} />
          <Text style={styles.defaultBadgeText}>Predeterminada</Text>
        </View>
      )}
    </View>
    <View style={styles.cardActions}>
      {!item.is_default && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onMakeDefault(item.id)}
        >
          <Ionicons name="star-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => onDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  </View>
);

const PaymentMethodsScreen = () => {
  const navigation = useNavigation();
  const [cards, setCards] = useState([]);
  const [brand, setBrand] = useState('');
  const [number, setNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      const res = await api.get('/payments/methods');
      setCards(res.data);
    } catch (e) {
      console.error('fetchCards', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleAdd = async () => {
    if (!brand || !number || number.length < 4 || !expMonth || !expYear) {
      Alert.alert('Datos incompletos', 'Ingresa marca, últimos dígitos y expiración.');
      return;
    }
    setSaving(true);
    try {
      const last4 = number.slice(-4);
      await api.post('/payments/methods', {
        brand,
        last4,
        exp_month: parseInt(expMonth, 10),
        exp_year: parseInt(expYear, 10),
        make_default: cards.length === 0,
      });
      setBrand(''); setNumber(''); setExpMonth(''); setExpYear('');
      fetchCards();
      Alert.alert('✅ Éxito', 'Tarjeta guardada correctamente');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.msg || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Eliminar tarjeta',
      '¿Estás seguro de eliminar esta tarjeta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/payments/methods/${id}`);
              fetchCards();
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar.');
            }
          }
        }
      ]
    );
  };

  const handleMakeDefault = async (id) => {
    try {
      await api.put(`/payments/methods/${id}/default`);
      fetchCards();
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Métodos de Pago</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <CardItem item={item} onDelete={handleDelete} onMakeDefault={handleMakeDefault} />
        )}
        ListHeaderComponent={
          <View style={styles.addCardSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="add-circle" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Agregar nueva tarjeta</Text>
            </View>
            
            <View style={styles.form}>
              <Text style={styles.label}>Marca de la tarjeta</Text>
              <StyledTextInput 
                placeholder="Ej: Visa, Mastercard..." 
                value={brand} 
                onChangeText={setBrand}
                style={styles.input}
              />
              
              <Text style={styles.label}>Número de tarjeta</Text>
              <StyledTextInput 
                placeholder="1234 5678 9012 3456" 
                value={number} 
                onChangeText={setNumber} 
                keyboardType="number-pad"
                style={styles.input}
              />
              
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Mes exp.</Text>
                  <StyledTextInput 
                    placeholder="MM" 
                    value={expMonth} 
                    onChangeText={setExpMonth} 
                    keyboardType="number-pad"
                    maxLength={2}
                    style={styles.input}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Año exp.</Text>
                  <StyledTextInput 
                    placeholder="YYYY" 
                    value={expYear} 
                    onChangeText={setExpYear} 
                    keyboardType="number-pad"
                    maxLength={4}
                    style={styles.input}
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.addButton, saving && styles.addButtonDisabled]}
                onPress={handleAdd} 
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="add" size={20} color={COLORS.white} />
                    <Text style={styles.addButtonText}>Guardar tarjeta</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <View style={styles.noteContainer}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.note}>
                  Los pagos se procesan de forma segura a través de Mercado Pago Checkout Pro.
                </Text>
              </View>
            </View>
            
            {cards.length > 0 && (
              <View style={styles.savedCardsHeader}>
                <Ionicons name="wallet" size={22} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Tarjetas guardadas</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No tienes tarjetas guardadas</Text>
            <Text style={styles.emptySubtext}>Agrega una tarjeta para pagos más rápidos</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 40,
  },
  
  // Add card section
  addCardSection: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  savedCardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.lg,
    marginBottom: 12,
  },
  
  // Form
  form: { 
    backgroundColor: COLORS.white, 
    borderRadius: 16,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  label: { 
    fontSize: 13, 
    fontWeight: '500',
    marginBottom: 6, 
    color: COLORS.textSecondary,
  },
  input: {
    marginBottom: 12,
  },
  row: { 
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 8,
  },
  note: { 
    flex: 1,
    fontSize: 12, 
    color: COLORS.textSecondary, 
    lineHeight: 18,
  },
  
  // Card item
  cardItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 14, 
    backgroundColor: COLORS.white, 
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  cardDefault: { 
    borderWidth: 2, 
    borderColor: COLORS.primary,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: '600',
    color: COLORS.text,
  },
  cardMeta: { 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    marginTop: 2,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
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
  deleteButton: {
    backgroundColor: COLORS.errorLight,
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 40,
  },
  emptyText: { 
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text, 
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
});

export default PaymentMethodsScreen;
