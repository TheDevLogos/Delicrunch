import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../src/constants/theme';

const DeveloperMenu = ({ navigation }) => {
  const [devMode, setDevMode] = useState(false);

  const screens = [
    { name: 'HomeScreen', title: '🏠 Inicio', route: 'MainTabs' },
    { name: 'LoginScreen', title: '🔐 Login', route: 'Login' },
    { name: 'RegisterScreen', title: '📝 Registro', route: 'Register' },
    { name: 'ProductDetailScreen', title: '📦 Detalle Producto', route: 'ProductDetail', params: { productId: 1 } },
    { name: 'OrderConfirmationScreen', title: '✅ Confirmación Pedido', route: 'OrderConfirmation', params: { order: { id: 1, codigo_recogida: 'ABC123', precio_total: 25.99, fecha_pedido: new Date() } } },
    { name: 'AddProductScreen', title: '➕ Agregar Producto', route: 'AddProduct' },
  ];

  const handleNavigate = (route, params = {}) => {
    if (route === 'MainTabs') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } else {
      navigation.navigate(route, params);
    }
  };

  if (!devMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockedBox}>
          <Ionicons name="lock-closed" size={60} color={COLORS.primary} />
          <Text style={styles.lockedText}>Developer Mode Bloqueado</Text>
          <Text style={styles.lockedSubtext}>Presiona 5 veces rápidamente para desbloquear</Text>
          <TouchableOpacity 
            style={styles.unlockButton}
            onPress={() => {
              setDevMode(true);
              Alert.alert('✓ Dev Mode Activado', 'Ahora puedes navegar a todas las pantallas');
            }}
          >
            <Text style={styles.unlockButtonText}>Desbloquear Developer Mode</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛠️ Developer Menu</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => setDevMode(false)}
        >
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.screensContainer}>
        {screens.map((screen, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.screenButton}
            onPress={() => handleNavigate(screen.route, screen.params)}
          >
            <View style={styles.screenButtonContent}>
              <Text style={styles.screenTitle}>{screen.title}</Text>
              <Text style={styles.screenRoute}>{screen.route}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>📱 Development Mode - Solo para pruebas</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  lockedBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  lockedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  lockedSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  unlockButton: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 3,
    borderColor: COLORS.border,
  },
  unlockButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 1,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  screensContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  screenButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 5,
  },
  screenButtonContent: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  screenRoute: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

export default DeveloperMenu;
