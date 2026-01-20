import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AvatarIconPicker from '../components/AvatarIconPicker';
import api from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROFILE_AVATARS, getAvatarById } from '../src/constants/profileAvatars';

// TGTG Design System
const COLORS = {
  primary: '#036B52',
  primaryDark: '#024A38',
  secondary: '#F5F5F5',
  accent: '#FF6B35',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  inputBg: '#F9FAFB',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
};

const EditProfileScreen = ({ route, navigation }) => {
  // Recibimos el perfil actual para pre-rellenar el formulario
  const { profile } = route.params;

  const [nombre, setNombre] = useState(profile.nombre);
  const [telefono, setTelefono] = useState(profile.telefono || '');
  const [direccion, setDireccion] = useState(profile.direccion || '');
  const [ciudad, setCiudad] = useState(profile.ciudad || '');
  const [fotoPerfil, setFotoPerfil] = useState(null); // local uri
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Estados para el cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Estados para icono de avatar
  const [selectedAvatarId, setSelectedAvatarId] = useState(profile.avatar_icon_id || null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const handleUpdateProfile = async () => {
    if (!nombre) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const form = new FormData();
      form.append('nombre', nombre);
      if (telefono) form.append('telefono', telefono);
      if (direccion) form.append('direccion', direccion);
      if (ciudad) form.append('ciudad', ciudad);
      if (selectedAvatarId) form.append('avatar_icon_id', selectedAvatarId);
      if (fotoPerfil) {
        const filename = fotoPerfil.split('/').pop();
        const ext = filename?.split('.').pop();
        form.append('foto_perfil', {
          uri: fotoPerfil,
          name: filename || `foto.${ext || 'jpg'}`,
          type: 'image/' + (ext || 'jpeg'),
        });
      }

      await api.put('/profiles/me', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (ciudad) {
        await AsyncStorage.setItem('preferredCity', ciudad);
      }

      Alert.alert('Éxito', 'Tu perfil ha sido actualizado.');
      navigation.goBack();
    } catch (error) {
      console.error('Error al actualizar el perfil:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.msg || 'No se pudo actualizar tu perfil.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para actualizar tu avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setFotoPerfil(result.assets[0].uri);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Por favor, completa todos los campos de contraseña.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Asumimos un endpoint para cambiar la contraseña
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      Alert.alert('Éxito', 'Tu contraseña ha sido actualizada.');
      // Limpiamos los campos después del éxito
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.msg || 'No se pudo cambiar la contraseña.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sección de Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {selectedAvatarId ? (
              (() => {
                const avatar = getAvatarById(selectedAvatarId);
                const IconComp = avatar.iconSet === 'material' 
                  ? MaterialCommunityIcons 
                  : Ionicons;
                return (
                  <View style={[styles.avatarIcon, { backgroundColor: avatar.backgroundColor }]}>
                    <IconComp name={avatar.icon} size={48} color={avatar.color} />
                  </View>
                );
              })()
            ) : fotoPerfil ? (
              <Image source={{ uri: fotoPerfil }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {nombre?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={() => setShowAvatarPicker(true)}
            >
              <Ionicons name="pencil" size={16} color={COLORS.background} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Toca el lápiz para cambiar tu avatar</Text>
        </View>

        {/* Información Personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Tu nombre"
                placeholderTextColor={COLORS.textLight}
                value={nombre}
                onChangeText={setNombre}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <View style={[styles.inputContainer, styles.inputDisabled]}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, styles.textDisabled]}
                value={profile.email}
                editable={false}
              />
              <Ionicons name="lock-closed" size={16} color={COLORS.textLight} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Tu teléfono"
                placeholderTextColor={COLORS.textLight}
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Ubicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Tu dirección"
                placeholderTextColor={COLORS.textLight}
                value={direccion}
                onChangeText={setDireccion}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ciudad</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Tu ciudad"
                placeholderTextColor={COLORS.textLight}
                value={ciudad}
                onChangeText={setCiudad}
              />
            </View>
          </View>
        </View>

        {/* Foto de Perfil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto de Perfil</Text>
          
          <TouchableOpacity 
            style={styles.photoPickerCard}
            onPress={handlePickImage}
          >
            {fotoPerfil ? (
              <Image source={{ uri: fotoPerfil }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={32} color={COLORS.textLight} />
              </View>
            )}
            <View style={styles.photoPickerContent}>
              <Text style={styles.photoPickerTitle}>
                {fotoPerfil ? 'Cambiar foto' : 'Agregar foto'}
              </Text>
              <Text style={styles.photoPickerSubtitle}>
                Elige una imagen de tu galería
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          style={[styles.saveButton, isUpdatingProfile && styles.buttonDisabled]}
          onPress={handleUpdateProfile}
          disabled={isUpdatingProfile}
        >
          {isUpdatingProfile ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={COLORS.background} style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cambio de Contraseña */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña Actual</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Tu contraseña actual"
                placeholderTextColor={COLORS.textLight}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nueva Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Nueva contraseña"
                placeholderTextColor={COLORS.textLight}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Confirma la nueva contraseña"
                placeholderTextColor={COLORS.textLight}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.passwordButton, isUpdatingPassword && styles.buttonDisabled]}
            onPress={handleUpdatePassword}
            disabled={isUpdatingPassword}
          >
            {isUpdatingPassword ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <>
                <Ionicons name="sync-outline" size={20} color={COLORS.background} style={{ marginRight: 8 }} />
                <Text style={styles.passwordButtonText}>Actualizar Contraseña</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal del selector de iconos */}
        <AvatarIconPicker
          visible={showAvatarPicker}
          onClose={() => setShowAvatarPicker(false)}
          onSelect={(avatarId) => {
            setSelectedAvatarId(avatarId);
            setShowAvatarPicker(false);
          }}
          currentAvatarId={selectedAvatarId}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatarIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryDark,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.background,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatarHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  inputDisabled: {
    backgroundColor: COLORS.secondary,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  textDisabled: {
    color: COLORS.textLight,
  },
  photoPickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoPreview: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: SPACING.md,
  },
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  photoPickerContent: {
    flex: 1,
  },
  photoPickerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  photoPickerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  passwordButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.md,
  },
  passwordButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
});

export default EditProfileScreen;