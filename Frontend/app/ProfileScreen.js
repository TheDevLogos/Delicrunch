import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator, 
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ReadOnlyStarRating from '../components/ReadOnlyStarRating';
import StripeOnboarding from '../components/StripeOnboarding';
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';
import { getAvatarById } from '../src/constants/profileAvatars';
import { formatNumber } from '../src/utils/format';

// Helper para formatear calificación de forma segura
const formatRating = (rating) => {
  if (rating === null || rating === undefined || isNaN(rating)) return '4.5';
  return formatNumber(rating, 1);
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const backendBase = (api.defaults?.baseURL || '').replace(/\/?api$/, '');
  const { signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profiles/me');
      setProfile(response.data);
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
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

  const isComprador = profile.rol === 'comprador';
  const isComercio = profile.rol === 'comercio';
  const isAdmin = profile.rol === 'admin';

  // Menú dinámico según rol
  const getMenuOptions = () => {
    const options = [];
    
    // Opciones para COMPRADORES
    if (isComprador || isAdmin) {
      options.push({
        icon: 'bag-handle-outline',
        label: 'Mis Pedidos',
        subtitle: 'Historial de compras',
        onPress: () => navigation.navigate('MyOrders'),
        color: COLORS.primary,
      });
      options.push({
        icon: 'star-outline',
        label: 'Mis Reseñas',
        subtitle: 'Opiniones que has dejado',
        onPress: () => navigation.navigate('MyReviews'),
        color: COLORS.primary,
      });
      options.push({
        icon: 'card-outline',
        label: 'Métodos de Pago',
        subtitle: 'Gestiona tus tarjetas',
        onPress: () => navigation.navigate('PaymentMethods'),
        color: COLORS.primary,
      });
    }
    
    // Opciones para COMERCIOS
    if (isComercio) {
      options.push({
        icon: 'storefront-outline',
        label: 'Mis Productos',
        subtitle: 'Gestiona tus packs',
        onPress: () => navigation.navigate('MyProducts'),
        color: COLORS.primary,
      });
      options.push({
        icon: 'add-circle-outline',
        label: 'Añadir Producto',
        subtitle: 'Publica un nuevo pack',
        onPress: () => navigation.navigate('AddProduct'),
        color: COLORS.secondary,
      });
      options.push({
        icon: 'clipboard-outline',
        label: 'Pedidos de Mi Tienda',
        subtitle: 'Gestiona pedidos entrantes',
        onPress: () => navigation.navigate('StoreOrders'),
        color: COLORS.primary,
      });
      options.push({
        icon: 'analytics-outline',
        label: 'Estadísticas',
        subtitle: 'Rendimiento de tu tienda',
        onPress: () => {},
        color: COLORS.textLight,
      });
    }
    
    // Opciones comunes
    options.push({
      icon: 'settings-outline',
      label: 'Configuración',
      subtitle: 'Preferencias de la app',
      onPress: () => {},
      color: COLORS.textLight,
    });
    options.push({
      icon: 'help-circle-outline',
      label: 'Ayuda y Soporte',
      subtitle: 'FAQ y contacto',
      onPress: () => {},
      color: COLORS.textLight,
    });
    
    return options;
  };

  const menuOptions = getMenuOptions();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header con avatar - estilo TGTG */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('EditProfileScreen', { profile })}
          >
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
                <Text style={styles.avatarInitial}>
                  {profile.nombre?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={12} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{profile.nombre}</Text>
          <Text style={styles.userEmail}>{profile.email}</Text>
          
          {profile.ciudad && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.userCity}>{profile.ciudad}</Text>
            </View>
          )}
          
          <View style={[styles.rolBadge, isComercio && styles.rolBadgeComercio]}>
            <Ionicons 
              name={isComercio ? 'storefront' : isAdmin ? 'shield' : 'person'} 
              size={12} 
              color={COLORS.white} 
            />
            <Text style={styles.rolText}>
              {profile.rol.charAt(0).toUpperCase() + profile.rol.slice(1)}
            </Text>
          </View>
          
          {/* Rating para comercios */}
          {isComercio && profile.calificacion_promedio_vendedor && (
            <View style={styles.ratingRow}>
              <ReadOnlyStarRating rating={profile.calificacion_promedio_vendedor} size={18} />
              <Text style={styles.ratingValue}>
                {formatRating(profile.calificacion_promedio_vendedor)}
              </Text>
            </View>
          )}
        </View>

        {/* Botón editar perfil */}
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('EditProfileScreen', { profile })}
          activeOpacity={0.7}
        >
          <View style={styles.editProfileLeft}>
            <Ionicons name="create-outline" size={22} color={COLORS.primary} />
            <View style={styles.editProfileTextContainer}>
              <Text style={styles.editProfileText}>Editar Perfil</Text>
              <Text style={styles.editProfileSubtext}>Foto, nombre, ciudad</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        {/* Stripe para comercios */}
        {isComercio && (
          <View style={styles.stripeSection}>
            <StripeOnboarding />
          </View>
        )}

        {/* Menú de opciones */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>
            {isComercio ? 'Gestión de Tienda' : 'Mi Cuenta'}
          </Text>
          {menuOptions.map((option, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.menuItem,
                index === menuOptions.length - 1 && styles.menuItemLast
              ]}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: option.color + '15' }]}>
                <Ionicons name={option.icon} size={22} color={option.color} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemLabel}>{option.label}</Text>
                {option.subtitle && (
                  <Text style={styles.menuItemSubtitle}>{option.subtitle}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón cerrar sesión */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
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
  
  // Header estilo TGTG
  header: { 
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 16,
    paddingBottom: 24,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a1a1a',
    // Neo Brutalism shadow
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
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
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userCity: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  rolBadgeComercio: {
    backgroundColor: COLORS.secondary,
  },
  rolText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 6,
  },

  // Editar perfil
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: 16,
    borderRadius: 16,
    ...SHADOWS.sm,
  },
  editProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editProfileTextContainer: {
    marginLeft: 12,
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  editProfileSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },

  // Stripe section
  stripeSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },

  // Menu
  menuSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    padding: 16,
    borderRadius: 16,
    ...SHADOWS.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
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

export default ProfileScreen;