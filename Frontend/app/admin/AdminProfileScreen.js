import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, SHADOWS } from '../../src/constants/theme';
import { getAvatarById } from '../../src/constants/profileAvatars';

/**
 * AdminProfileScreen - Pantalla de perfil especial para administradores
 * 
 * Funcionalidades:
 * - Cambiar de vista entre Admin / Comprador / Comercio (simular roles)
 * - Acceso a todas las funciones de todos los roles
 * - Gestión de usuarios
 * - Cerrar sesión / Ir a Login
 */

const AdminProfileScreen = () => {
  const navigation = useNavigation();
  const backendBase = (api.defaults?.baseURL || '').replace(/\/?api$/, '');
  const { signOut, user, simulatedRole, effectiveRole, setSimulatedRole } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // El rol que se muestra actualmente (admin si no hay simulación, o el simulado)
  const currentViewRole = simulatedRole || 'admin';

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profiles/me');
      setProfile(response.data);
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchProfile();
    }, [])
  );

  // Cambiar rol simulado - esto recarga completamente el BottomTabNavigator
  const handleRoleSwitch = async (newRole) => {
    if (newRole === currentViewRole) {
      // Ya está en ese rol
      return;
    }
    
    // Si selecciona admin, quitar la simulación
    if (newRole === 'admin') {
      await setSimulatedRole(null);
    } else {
      await setSimulatedRole(newRole);
    }
  };

  // Ir a pantalla de login (salir completamente)
  const handleGoToLogin = () => {
    Alert.alert(
      '🚪 Salir al Login',
      '¿Deseas cerrar sesión e ir a la pantalla de login?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, salir', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!profile) {
    return <Text style={styles.errorText}>No se pudo cargar el perfil.</Text>;
  }

  // Menú de funciones según rol simulado
  const getMenuByRole = () => {
    const menus = {
      admin: [
        {
          title: '🛡️ Panel de Administración',
          items: [
            { icon: 'shield-checkmark-outline', label: 'Dashboard Admin', subtitle: 'Panel principal', onPress: () => navigation.navigate('MainTabs', { screen: 'AdminDashboard' }), color: '#6366f1' },
            { icon: 'storefront-outline', label: 'Gestionar Comercios', subtitle: 'Ver y moderar tiendas', onPress: () => navigation.navigate('MainTabs', { screen: 'AdminStores' }), color: '#8b5cf6' },
            { icon: 'chatbubbles-outline', label: 'Moderar Reseñas', subtitle: 'Aprobar/eliminar reviews', onPress: () => navigation.navigate('MainTabs', { screen: 'AdminReviews' }), color: '#ec4899' },
            { icon: 'card-outline', label: 'Transacciones', subtitle: 'Historial de pagos', onPress: () => navigation.navigate('MainTabs', { screen: 'AdminTransactions' }), color: '#14b8a6' },
            { icon: 'bar-chart-outline', label: 'Métricas', subtitle: 'Estadísticas globales', onPress: () => navigation.navigate('AdminMetrics'), color: '#f59e0b' },
          ]
        },
        {
          title: '👥 Gestión de Usuarios',
          items: [
            { icon: 'people-outline', label: 'Ver Usuarios', subtitle: 'Lista de todos los usuarios', onPress: () => Alert.alert('Próximamente', 'Gestión de usuarios en desarrollo'), color: '#3b82f6' },
            { icon: 'person-add-outline', label: 'Crear Usuario', subtitle: 'Añadir nuevo usuario', onPress: () => Alert.alert('Próximamente', 'Crear usuario en desarrollo'), color: '#10b981' },
          ]
        }
      ],
      comprador: [
        {
          title: '🛒 Funciones de Comprador',
          items: [
            { icon: 'compass-outline', label: 'Descubrir', subtitle: 'Explorar tiendas cerca', onPress: () => navigation.navigate('Descubre'), color: COLORS.primary },
            { icon: 'search-outline', label: 'Buscar Productos', subtitle: 'Encontrar ofertas', onPress: () => navigation.navigate('Buscar'), color: '#3b82f6' },
            { icon: 'heart-outline', label: 'Mis Favoritos', subtitle: 'Tiendas guardadas', onPress: () => navigation.navigate('Favoritos'), color: '#ef4444' },
            { icon: 'bag-handle-outline', label: 'Mis Pedidos', subtitle: 'Historial de compras', onPress: () => navigation.navigate('MyOrders'), color: '#8b5cf6' },
            { icon: 'star-outline', label: 'Mis Reseñas', subtitle: 'Opiniones dejadas', onPress: () => navigation.navigate('MyReviews'), color: '#f59e0b' },
            { icon: 'card-outline', label: 'Métodos de Pago', subtitle: 'Gestionar tarjetas', onPress: () => navigation.navigate('PaymentMethods'), color: '#14b8a6' },
            { icon: 'trophy-outline', label: 'Recompensas', subtitle: 'Puntos y premios', onPress: () => navigation.navigate('Recompensas'), color: '#eab308' },
          ]
        }
      ],
      comercio: [
        {
          title: '🏪 Funciones de Comercio',
          items: [
            { icon: 'fast-food-outline', label: 'Mis Productos', subtitle: 'Gestionar packs', onPress: () => navigation.navigate('MyProducts'), color: '#f97316' },
            { icon: 'add-circle-outline', label: 'Añadir Producto', subtitle: 'Publicar nuevo pack', onPress: () => navigation.navigate('AddProduct'), color: '#22c55e' },
            { icon: 'clipboard-outline', label: 'Pedidos Entrantes', subtitle: 'Gestionar pedidos', onPress: () => navigation.navigate('StoreOrders'), color: '#3b82f6' },
            { icon: 'star-outline', label: 'Reseñas de Tienda', subtitle: 'Ver opiniones', onPress: () => navigation.navigate('StoreReviews'), color: '#f59e0b' },
            { icon: 'analytics-outline', label: 'Estadísticas', subtitle: 'Rendimiento', onPress: () => Alert.alert('Próximamente', 'Estadísticas en desarrollo'), color: '#8b5cf6' },
          ]
        }
      ]
    };
    return menus[currentViewRole] || menus.admin;
  };

  const currentMenus = getMenuByRole();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header con badge de SuperAdmin */}
        <View style={styles.header}>
          <View style={styles.superAdminBadge}>
            <FontAwesome5 name="crown" size={12} color="#fbbf24" />
            <Text style={styles.superAdminText}>SUPER ADMIN</Text>
          </View>
          
          <View style={styles.avatarContainer}>
            {profile.avatar_icon_id ? (
              (() => {
                const avatar = getAvatarById(profile.avatar_icon_id);
                const IconComp = avatar.iconSet === 'material' 
                  ? MaterialCommunityIcons 
                  : Ionicons;
                return (
                  <View style={[styles.avatarIconContainer, { backgroundColor: avatar.backgroundColor }]}>
                    <IconComp name={avatar.icon} size={44} color={avatar.color} />
                  </View>
                );
              })()
            ) : profile.foto_perfil ? (
              <Image 
                source={{ uri: profile.foto_perfil.startsWith('http') ? profile.foto_perfil : (backendBase + profile.foto_perfil) }} 
                style={styles.avatarImage} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="shield-checkmark" size={40} color={COLORS.white} />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{profile.nombre}</Text>
          <Text style={styles.userEmail}>{profile.email}</Text>
          
          <View style={styles.rolBadgeAdmin}>
            <Ionicons name="shield" size={14} color={COLORS.white} />
            <Text style={styles.rolText}>Administrador</Text>
          </View>
        </View>

        {/* Selector de Rol (Modo de Vista) */}
        <View style={styles.roleSwitcher}>
          <Text style={styles.roleSwitcherTitle}>🔄 Cambiar Vista de la App</Text>
          <Text style={styles.roleSwitcherSubtitle}>
            Cambia completamente la navegación para ver la app como otro usuario
          </Text>
          
          <View style={styles.roleButtons}>
            <TouchableOpacity 
              style={[styles.roleButton, currentViewRole === 'admin' && styles.roleButtonActive]}
              onPress={() => handleRoleSwitch('admin')}
            >
              <Ionicons name="shield" size={20} color={currentViewRole === 'admin' ? COLORS.white : '#6366f1'} />
              <Text style={[styles.roleButtonText, currentViewRole === 'admin' && styles.roleButtonTextActive]}>Admin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.roleButton, currentViewRole === 'comprador' && styles.roleButtonActiveComprador]}
              onPress={() => handleRoleSwitch('comprador')}
            >
              <Ionicons name="person" size={20} color={currentViewRole === 'comprador' ? COLORS.white : COLORS.primary} />
              <Text style={[styles.roleButtonText, currentViewRole === 'comprador' && styles.roleButtonTextActive]}>Comprador</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.roleButton, currentViewRole === 'comercio' && styles.roleButtonActiveComercio]}
              onPress={() => handleRoleSwitch('comercio')}
            >
              <Ionicons name="storefront" size={20} color={currentViewRole === 'comercio' ? COLORS.white : COLORS.secondary} />
              <Text style={[styles.roleButtonText, currentViewRole === 'comercio' && styles.roleButtonTextActive]}>Comercio</Text>
            </TouchableOpacity>
          </View>
          
          {currentViewRole !== 'admin' && (
            <View style={styles.simulationWarning}>
              <Ionicons name="information-circle" size={16} color="#f59e0b" />
              <Text style={styles.simulationWarningText}>
                Modo simulación activo. La navegación muestra las tabs de {currentViewRole}.
              </Text>
            </View>
          )}
        </View>

        {/* Menús según rol simulado */}
        {currentMenus.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity 
                key={itemIndex}
                style={[
                  styles.menuItem,
                  itemIndex === section.items.length - 1 && styles.menuItemLast
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  {item.subtitle && (
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Acciones rápidas de admin */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>⚡ Acciones Rápidas</Text>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('EditProfileScreen', { profile })}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Editar Mi Perfil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('ProductDetail', { productId: 1 })}
          >
            <Ionicons name="eye-outline" size={20} color="#8b5cf6" />
            <Text style={styles.quickActionText}>Ver Producto de Ejemplo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickActionButton, styles.quickActionButtonDanger]}
            onPress={handleGoToLogin}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={[styles.quickActionText, { color: COLORS.error }]}>Salir al Login</Text>
          </TouchableOpacity>
        </View>

        {/* Cerrar Sesión */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <Ionicons name="power-outline" size={22} color={COLORS.error} />
          <Text style={styles.logoutText}>Cerrar Sesión Completamente</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  container: { 
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  
  // Header
  header: { 
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  superAdminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  superAdminText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#6366f1',
  },
  avatarIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a1a1a',
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  rolBadgeAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  rolText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },

  // Role Switcher
  roleSwitcher: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: 16,
    borderRadius: 16,
    ...SHADOWS.sm,
  },
  roleSwitcherTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  roleSwitcherSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  roleButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#4f46e5',
  },
  roleButtonActiveComprador: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark || '#c96000',
  },
  roleButtonActiveComercio: {
    backgroundColor: COLORS.secondary,
    borderColor: '#0d9488',
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  roleButtonTextActive: {
    color: COLORS.white,
  },
  simulationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  simulationWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
  },

  // Menu Sections
  menuSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },

  // Quick Actions
  quickActions: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: 16,
    borderRadius: 16,
    ...SHADOWS.sm,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  quickActionButtonDanger: {
    backgroundColor: '#fef2f2',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    marginHorizontal: SPACING.md,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.error,
    ...SHADOWS.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
    marginLeft: 8,
  },

  errorText: { 
    textAlign: 'center', 
    marginTop: 50, 
    fontSize: 16, 
    color: COLORS.error,
  },
});

export default AdminProfileScreen;
