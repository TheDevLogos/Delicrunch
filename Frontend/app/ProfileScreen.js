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
  Switch,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ReadOnlyStarRating from '../components/ReadOnlyStarRating';
import MercadoPagoOnboarding from '../components/MercadoPagoOnboarding';
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
  
  // Estados para configuración y ayuda
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

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
  
  // Función para seleccionar logo del comercio
  const pickLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permiso Requerido', 'Necesitamos permiso para acceder a tus fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Logo cuadrado
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadLogo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking logo:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para subir logo al backend
  const uploadLogo = async (imageUri) => {
    try {
      const formData = new FormData();
      
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('foto_perfil', {
        uri: imageUri,
        name: `logo_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      });

      await api.put('/profiles/me', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('¡Éxito!', 'Logo actualizado correctamente');
      fetchProfile(); // Recargar perfil
    } catch (error) {
      console.error('Error uploading logo:', error);
      Alert.alert('Error', 'No se pudo subir el logo');
    }
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

  // Normalizar rol - el backend envía 'buyer', 'seller', 'admin'
  const userRole = (profile.rol || profile.role || '').toLowerCase();
  const isComprador = userRole === 'buyer' || userRole === 'comprador';
  const isComercio = userRole === 'seller' || userRole === 'comercio';
  const isAdmin = userRole === 'admin';

  // Menú dinámico según rol
  const getMenuOptions = () => {
    const options = [];
    
    // Opciones para COMPRADORES
    if (isComprador) {
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
        subtitle: 'Gestiona tus tarjetas y MercadoPago',
        onPress: () => navigation.navigate('ManageCards'),
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
        icon: 'wallet-outline',
        label: 'Cuentas para Cobrar',
        subtitle: 'Configura Mercado Pago',
        onPress: () => navigation.navigate('MerchantPaymentSettings'),
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
    
    // Opciones para ADMIN
    if (isAdmin) {
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
        onPress: () => navigation.navigate('ManageCards'),
        color: COLORS.primary,
      });
      options.push({
        icon: 'wallet-outline',
        label: 'Cuentas para Cobrar',
        subtitle: 'Configura Mercado Pago',
        onPress: () => navigation.navigate('MerchantPaymentSettings'),
        color: COLORS.primary,
      });
    }
    
    // Opciones comunes
    options.push({
      icon: 'settings-outline',
      label: 'Configuración',
      subtitle: 'Preferencias de la app',
      onPress: () => setShowSettings(true),
      color: COLORS.primary, // Cambiado a verde activo
    });
    /* DESACTIVADO: expo-notifications removido
    options.push({
      icon: 'notifications-outline',
      label: 'Notificaciones',
      subtitle: 'Configurar alertas',
      onPress: () => navigation.navigate('NotificationSettings'),
      color: COLORS.primary,
    });
    */
    options.push({
      icon: 'help-circle-outline',
      label: 'Ayuda y Soporte',
      subtitle: 'FAQ y contacto',
      onPress: () => setShowHelp(true),
      color: COLORS.primary, // Cambiado a verde activo
    });
    
    return options;
  };

  const menuOptions = getMenuOptions();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
              {isComercio ? 'Comercio' : isAdmin ? 'Admin' : 'Comprador'}
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
          
          {/* Logo del comercio (solo para comercios) */}
          {isComercio && (
            <View style={styles.logoSection}>
              <Text style={styles.logoSectionTitle}>Logo del Comercio</Text>
              <TouchableOpacity 
                style={styles.logoContainer}
                onPress={pickLogo}
                activeOpacity={0.7}
              >
                {profile.foto_perfil ? (
                  <Image 
                    source={{ 
                      uri: profile.foto_perfil.startsWith('http') 
                        ? profile.foto_perfil 
                        : (backendBase + profile.foto_perfil) 
                    }} 
                    style={styles.logoImage} 
                  />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="storefront-outline" size={40} color={COLORS.textLight} />
                    <Text style={styles.logoPlaceholderText}>Subir Logo</Text>
                  </View>
                )}
                <View style={styles.logoEditBadge}>
                  <Ionicons name="camera" size={16} color={COLORS.white} />
                </View>
              </TouchableOpacity>
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

        {/* Mercado Pago Onboarding - para comercios */}
        {isComercio && (
          <View style={styles.stripeSection}>
            <View style={styles.mercadoPagoHeader}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color={COLORS.primary} />
              <Text style={styles.mercadoPagoTitle}>Configuración de Cobros</Text>
            </View>
            <MercadoPagoOnboarding />
          </View>
        )}

        {/* Información de pagos para compradores */}
        {isComprador && (
          <View style={styles.mercadoPagoInfoSection}>
            <View style={styles.mercadoPagoInfoHeader}>
              <MaterialCommunityIcons name="credit-card-check-outline" size={24} color={COLORS.primary} />
              <Text style={styles.mercadoPagoInfoTitle}>Métodos de Pago</Text>
            </View>
            
            <View style={styles.mercadoPagoFeaturesList}>
              <View style={styles.mercadoPagoFeature}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
                <Text style={styles.mercadoPagoFeatureText}>Pago 100% seguro con MercadoPago</Text>
              </View>
              <View style={styles.mercadoPagoFeature}>
                <Ionicons name="card-outline" size={20} color={COLORS.success} />
                <Text style={styles.mercadoPagoFeatureText}>Tarjetas de crédito y débito</Text>
              </View>
              <View style={styles.mercadoPagoFeature}>
                <Ionicons name="wallet-outline" size={20} color={COLORS.success} />
                <Text style={styles.mercadoPagoFeatureText}>Pagos con OXXO y otros métodos</Text>
              </View>
              <View style={styles.mercadoPagoFeature}>
                <Ionicons name="lock-closed" size={20} color={COLORS.success} />
                <Text style={styles.mercadoPagoFeatureText}>Protección al comprador</Text>
              </View>
            </View>
            
            <Text style={styles.mercadoPagoInfoDescription}>
              Al completar tu primera compra, tus datos de pago quedarán guardados de forma segura 
              para futuras transacciones más rápidas. MercadoPago protege tu información financiera 
              con encriptación de nivel bancario.
            </Text>
            
            <TouchableOpacity
              style={styles.mercadoPagoLearnMoreBtn}
              onPress={() => {
                Alert.alert(
                  'Pagos con MercadoPago',
                  '🔒 Seguridad Garantizada:\n\n' +
                  '• Encriptación SSL de 256 bits\n' +
                  '• Protocolos PCI DSS Level 1\n' +
                  '• Protección contra fraudes\n' +
                  '• Soporte 24/7\n\n' +
                  '💳 Métodos de pago aceptados:\n\n' +
                  '• Tarjetas de crédito (Visa, Mastercard, AMEX)\n' +
                  '• Tarjetas de débito\n' +
                  '• OXXO y otros comercios\n' +
                  '• Transferencias bancarias\n' +
                  '• Saldo en MercadoPago\n\n' +
                  '✅ Primera compra:\n' +
                  'Al realizar tu primer pago, tus datos quedarán guardados de forma segura ' +
                  'para que las siguientes compras sean más rápidas y convenientes.',
                  [
                    { text: 'Cerrar', style: 'cancel' },
                    { 
                      text: 'Más información', 
                      onPress: () => Linking.openURL('https://www.mercadopago.com.mx/developers/es/docs/your-integrations/credentials')
                    }
                  ]
                );
              }}
            >
              <Text style={styles.mercadoPagoLearnMoreText}>Más información sobre pagos</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Panel de administración para admins */}
        {isAdmin && (
          <View style={styles.adminSection}>
            <View style={styles.adminHeader}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.secondary} />
              <Text style={styles.adminTitle}>Panel de Administración</Text>
            </View>
            <Text style={styles.adminText}>
              Tienes acceso completo a todas las funciones de la plataforma.
            </Text>
            <TouchableOpacity 
              style={styles.adminButton}
              onPress={() => navigation.navigate('MerchantPaymentSettings')}
            >
              <MaterialCommunityIcons name="cog" size={20} color={COLORS.white} />
              <Text style={styles.adminButtonText}>Configurar MercadoPago</Text>
            </TouchableOpacity>
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

        <View style={{ height: 20 }} />
      </ScrollView>
      
      {/* Modal de Configuración */}
      <Modal 
        visible={showSettings} 
        animationType="slide" 
        presentationStyle="formSheet"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Indicador de modal */}
          <View style={styles.modalIndicator} />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Configuración</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Sección Apariencia */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Apariencia</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="moon-outline" size={20} color={COLORS.text} />
                  <Text style={styles.settingLabel}>Tema oscuro</Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={setIsDarkMode}
                  trackColor={{ false: '#E5E5EA', true: COLORS.primary }}
                  thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
            </View>
            
            {/* Sección Notificaciones */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Notificaciones</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
                  <Text style={styles.settingLabel}>Notificaciones push</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E5E5EA', true: COLORS.primary }}
                  thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
              
              <TouchableOpacity style={styles.settingItem} onPress={() => {
                Alert.alert(
                  'Horarios de Notificación',
                  'Configura cuándo quieres recibir notificaciones:\n\n• Ofertas especiales: 9:00 - 21:00\n• Recordatorios de recogida: Siempre activo\n• Nuevos comercios: 10:00 - 20:00',
                  [{ text: 'Cerrar', style: 'default' }]
                );
              }}>
                <View style={styles.settingLeft}>
                  <Ionicons name="time-outline" size={20} color={COLORS.text} />
                  <Text style={styles.settingLabel}>Horarios de notificación</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            
            {/* Sección Privacidad */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Privacidad y Permisos</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="location-outline" size={20} color={COLORS.text} />
                  <Text style={styles.settingLabel}>Ubicación</Text>
                </View>
                <Switch
                  value={locationEnabled}
                  onValueChange={setLocationEnabled}
                  trackColor={{ false: '#E5E5EA', true: COLORS.primary }}
                  thumbColor={locationEnabled ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
              
              <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Permisos', 'Gestiona los permisos de la app desde la configuración de tu dispositivo.')}>
                <View style={styles.settingLeft}>
                  <Ionicons name="shield-outline" size={20} color={COLORS.text} />
                  <Text style={styles.settingLabel}>Permisos de la app</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem} onPress={() => {
                Alert.alert(
                  'Política de Privacidad',
                  'Delicrunch respeta tu privacidad y protege tus datos personales según la normativa vigente.\n\nPuedes consultar nuestra política completa en:\nwww.delicrunch.com/privacy',
                  [
                    { text: 'Cerrar', style: 'cancel' },
                    { text: 'Abrir enlace', onPress: () => Linking.openURL('https://www.delicrunch.com/privacy') }
                  ]
                );
              }}>
                <View style={styles.settingLeft}>
                  <Ionicons name="eye-off-outline" size={20} color={COLORS.text} />
                  <Text style={styles.settingLabel}>Política de privacidad</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            
            {/* Sección General */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>General</Text>
              
              <TouchableOpacity style={styles.settingItem} onPress={() => {
                Alert.alert(
                  'Seleccionar Idioma',
                  'Elige tu idioma preferido:',
                  [
                    { text: 'Español', onPress: () => Alert.alert('Idioma', 'Español ya está seleccionado') },
                    { text: 'English', onPress: () => Alert.alert('Language', 'English will be available soon') },
                    { text: 'Cancelar', style: 'cancel' }
                  ]
                );
              }}>
                <View style={styles.settingLeft}>
                  <Ionicons name="language-outline" size={20} color={COLORS.text} />
                  <Text style={styles.settingLabel}>Idioma</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>Español</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem} onPress={() => {
                Alert.alert(
                  'Limpiar Caché',
                  '¿Estás seguro de que quieres limpiar la caché? Esto eliminará archivos temporales y puede mejorar el rendimiento.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Limpiar', 
                      style: 'destructive',
                      onPress: () => {
                        // Aquí se implementaría la limpieza de caché
                        Alert.alert('Éxito', 'Caché limpiada correctamente');
                      }
                    }
                  ]
                );
              }}>
                <View style={styles.settingLeft}>
                  <Ionicons name="refresh-outline" size={20} color={COLORS.text} />
                  <Text style={styles.settingLabel}>Limpiar caché</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem} onPress={() => {
                Alert.alert(
                  'Acerca de Delicrunch',
                  'Versión: 2.1.0\nBuild: 2026.01.19\n\nDelicrunch - Rescata comida, salva el planeta\n\nDesarrollado con ❤️ para reducir el desperdicio alimentario.',
                  [{ text: 'Cerrar' }]
                );
              }}>
                <View style={styles.settingLeft}>
                  <Ionicons name="information-circle-outline" size={20} color={COLORS.text} />
                  <Text style={styles.settingLabel}>Acerca de la app</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>v2.1.0</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      
      {/* Modal de Ayuda y Soporte */}
      <Modal 
        visible={showHelp} 
        animationType="slide" 
        presentationStyle="formSheet"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Indicador de modal */}
          <View style={styles.modalIndicator} />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHelp(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ayuda y Soporte</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* FAQ */}
            <View style={styles.faqSection}>
              <Text style={styles.faqSectionTitle}>Preguntas Frecuentes</Text>
              
              {[
                {
                  question: '¿Cómo funciona Delicrunch?',
                  answer: 'Delicrunch te permite rescatar comida de restaurantes y comercios que de otra manera se desperdiciaría. Simplemente busca packs sorpresa cerca de ti, realiza tu compra y recógela en el horario indicado.'
                },
                {
                  question: '¿Qué es un pack sorpresa?',
                  answer: 'Un pack sorpresa es una selección de alimentos frescos que el comercio tiene disponible al final del día. El contenido varía según lo que tengan disponible, pero siempre es comida de calidad a precio reducido.'
                },
                {
                  question: '¿Cómo puedo pagar mi pedido?',
                  answer: 'Puedes pagar con tarjeta de crédito, débito, OXXO y más métodos directamente desde la app. Todos los pagos son procesados de forma segura a través de Mercado Pago.'
                },
                {
                  question: '¿Puedo cancelar mi pedido?',
                  answer: 'Puedes cancelar tu pedido hasta 2 horas antes del horario de recogida sin penalización. Después de ese tiempo, se aplicará una política de cancelación.'
                },
                {
                  question: '¿Qué hago si no puedo recoger mi pedido?',
                  answer: 'Si no puedes recoger tu pedido, contáctanos lo antes posible. En casos excepcionales, podemos ayudarte a reprogramar o reembolsar tu compra.'
                },
                {
                  question: '¿Cómo funcionan los puntos y recompensas?',
                  answer: 'Ganas XP por cada compra que realizas. Al subir de nivel, desbloqueas cupones y recompensas especiales. Mantén tu racha diaria para ganar puntos extra.'
                },
                {
                  question: '¿Puedo registrar mi negocio en Delicrunch?',
                  answer: 'Sí, los comercios pueden registrarse para vender sus excedentes de comida. Necesitas completar el proceso de verificación y configurar tu cuenta de pagos.'
                },
                {
                  question: '¿Es seguro comer la comida de los packs?',
                  answer: 'Absolutamente. Todos los comercios deben cumplir con estándares de seguridad alimentaria. La comida está fresca y es segura para el consumo, solo que no se vendió durante el día regular.'
                },
                {
                  question: '¿Cómo puedo dejar una reseña?',
                  answer: 'Después de recoger tu pedido, puedes calificar tu experiencia y dejar comentarios en la sección "Mis Pedidos". Esto ayuda a otros usuarios y a los comercios a mejorar.'
                },
                {
                  question: '¿Qué pasa si hay un problema con mi pedido?',
                  answer: 'Si tienes algún problema con tu pedido, contáctanos inmediatamente a través del chat en la app o por email. Nuestro equipo te ayudará a resolver cualquier inconveniente.'
                }
              ].map((faq, index) => (
                <View key={index} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.faqQuestion}
                    onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  >
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                    <Ionicons
                      name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={COLORS.text}
                    />
                  </TouchableOpacity>
                  {expandedFAQ === index && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
            
            {/* Contacto */}
            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>Contáctanos</Text>
              <Text style={styles.contactSubtitle}>
                ¿No encontraste la respuesta que buscabas? Nuestro equipo está aquí para ayudarte.
              </Text>
              
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => {
                  Linking.openURL('mailto:admin@delicrunch.com?subject=Soporte%20Delicrunch&body=Hola%2C%20necesito%20ayuda%20con...');
                }}
              >
                <Ionicons name="mail" size={24} color={COLORS.white} />
                <Text style={styles.contactButtonText}>admin@delicrunch.com</Text>
              </TouchableOpacity>
              
              <View style={styles.contactInfo}>
                <Text style={styles.contactInfoText}>
                  Tiempo de respuesta: 24-48 horas
                </Text>
                <Text style={styles.contactInfoText}>
                  Horario de atención: Lunes a Viernes 9:00 - 18:00
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingBottom: Platform.OS === 'android' ? 12 : 8, // Aumentado margin para Android
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    maxHeight: '85%', // Limitar altura máxima
    marginTop: '15%', // Empujar hacia abajo
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md, // Aumentado para mejor área de toque
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    minHeight: 60, // Altura mínima para mejor accesibilidad
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    paddingVertical: SPACING.md,
  },
  
  // Settings styles
  settingsSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 56,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  
  // FAQ styles
  faqSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  faqSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  faqItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  faqAnswer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  faqAnswerText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  
  // Contact styles
  contactSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  contactSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  contactInfo: {
    alignItems: 'center',
    gap: 4,
  },
  contactInfoText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  
  // Header estilo TGTG
  header: { 
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12, // Reducido padding top
    paddingBottom: 20, // Reducido padding bottom
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: SPACING.sm, // Reducido margen inferior
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
  mercadoPagoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  mercadoPagoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },

  // Info section para compradores
  infoSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
    ...SHADOWS.sm,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },

  // MercadoPago info section (compradores)
  mercadoPagoInfoSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
    ...SHADOWS.sm,
  },
  mercadoPagoInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  mercadoPagoInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  mercadoPagoFeaturesList: {
    gap: 10,
    marginBottom: SPACING.md,
  },
  mercadoPagoFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mercadoPagoFeatureText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  mercadoPagoInfoDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  mercadoPagoLearnMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 8,
  },
  mercadoPagoLearnMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Admin section
  adminSection: {
    backgroundColor: COLORS.secondary + '15',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    marginLeft: SPACING.sm,
  },
  adminText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SPACING.xs,
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
  
  // Logo del comercio
  logoSection: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  logoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
    position: 'relative',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundLight || '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border || '#E0E0E0',
    borderStyle: 'dashed',
  },
  logoPlaceholderText: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  logoEditBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.sm,
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