import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StyledTextInput from '../components/StyledTextInput';
import NeoButton from '../components/NeoButton';
import Header from './components/Header';
import PromoCard from './components/PromoCard';
import GradientButton from './components/GradientButton';
import LocationMapModal from '../components/LocationMapModal';
import api from '../services/api';
import FormError from '../components/FormError';
import logger from '../services/logger';
import { COLORS, TYPOGRAPHY, BORDERS, SHADOWS, SPACING } from '../src/constants/theme';
import { BUSINESS_CATEGORIES } from '../src/constants/categories';

const RegisterScreen = ({ navigation }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [rol, setRol] = useState('comprador');
  const [loading, setLoading] = useState(false);
  
  // Campos específicos para comercios
  const [nombreComercio, setNombreComercio] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [horario, setHorario] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (!nombre || !email || !password || !confirmPassword || !rol) { 
      setError('Por favor, completa todos los campos y selecciona un rol.');
      return;
    }
    
    // Validación adicional para comercios
    if (rol === 'comercio') {
      if (!nombreComercio || !direccion || !telefono || !categoria) {
        setError('Por favor, completa todos los campos requeridos del comercio.');
        return;
      }
      
      // Validar formato de coordenadas si se proporcionan
      if (latitud && (isNaN(latitud) || latitud < -90 || latitud > 90)) {
        setError('Latitud debe ser un número entre -90 y 90.');
        return;
      }
      
      if (longitud && (isNaN(longitud) || longitud < -180 || longitud > 180)) {
        setError('Longitud debe ser un número entre -180 y 180.');
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, introduce una dirección de correo electrónico válida.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const userData = { nombre, email, password, rol };
      
      // Agregar campos de comercio si el rol es comercio
      if (rol === 'comercio') {
        userData.storeData = {
          nombre_comercio: nombreComercio,
          direccion,
          telefono,
          horario: horario || 'Por definir',
          descripcion: descripcion || '',
          categoria,
          latitud: latitud ? parseFloat(latitud) : null,
          longitud: longitud ? parseFloat(longitud) : null,
        };
      }
      
      console.log('Enviando datos al backend:', userData);

      const response = await api.post('/auth/register', userData);
      console.log('Respuesta del backend:', response.data);

      Alert.alert(
        '✅ ¡Registro Exitoso!',
        rol === 'comercio' 
          ? 'Tu cuenta de comercio ha sido creada. Ahora puedes iniciar sesión y configurar tu tienda.'
          : 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.'
      );
      navigation.navigate('Login');

    } catch (error) {
      logger.error(error, 'handleRegister');
      if (error.response && error.response.data.msg) {
        setError(error.response.data.msg);
      } else {
        setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setLatitud(lat.toString());
    setLongitud(lng.toString());
    setMapModalVisible(false);
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView 
          contentContainerStyle={styles.contentContainer} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <Header large />
          <PromoCard />

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Full Name Input */}
            <View style={styles.inputWrapper}>
              <StyledTextInput
                placeholder="👤 Nombre"
                value={nombre}
                onChangeText={setNombre}
                placeholderTextColor="#999"
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <StyledTextInput
                placeholder="📧 Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <StyledTextInput
                placeholder="🔐 Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#999"
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <StyledTextInput
                placeholder="🔐 Confirmar"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#999"
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Role Selector - Comprimido */}
            <View style={styles.roleSelectorContainer}>
              <Text style={styles.roleSelectorLabel}>Registro como:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    rol === 'comprador' && styles.roleButtonSelected,
                  ]}
                  onPress={() => setRol('comprador')}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      rol === 'comprador' && styles.roleButtonTextSelected,
                    ]}
                  >
                    🛍️ Comprador
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    rol === 'comercio' && styles.roleButtonSelected,
                  ]}
                  onPress={() => setRol('comercio')}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      rol === 'comercio' && styles.roleButtonTextSelected,
                    ]}
                  >
                    🏪 Comercio
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Campos específicos para Comercios */}
            {rol === 'comercio' && (
              <>
                <View style={styles.sectionTitle}>
                  <Text style={styles.sectionTitleText}>Información del Comercio</Text>
                </View>
                
                {/* Nombre del Comercio */}
                <View style={styles.inputWrapper}>
                  <StyledTextInput
                    placeholder="🏪 Nombre del Comercio *"
                    value={nombreComercio}
                    onChangeText={setNombreComercio}
                    placeholderTextColor="#999"
                    style={styles.input}
                    editable={!loading}
                  />
                </View>
                
                {/* Categoría */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Categoría del Negocio *</Text>
                  <TouchableOpacity 
                    style={styles.categorySelector}
                    onPress={() => setShowCategoryPicker(true)}
                    disabled={loading}
                  >
                    <Ionicons name="restaurant-outline" size={20} color={COLORS.primary} />
                    <Text style={[styles.categorySelectorText, !categoria && { color: '#999' }]}>
                      {categoria || 'Selecciona categoría'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={COLORS.textLight || '#999'} />
                  </TouchableOpacity>
                </View>
                
                {/* Dirección */}
                <View style={styles.inputWrapper}>
                  <StyledTextInput
                    placeholder="📍 Dirección Completa *"
                    value={direccion}
                    onChangeText={setDireccion}
                    placeholderTextColor="#999"
                    style={styles.input}
                    editable={!loading}
                    multiline
                  />
                </View>
                
                {/* Sección de Ubicación */}
                <View style={styles.locationSection}>
                  <View style={styles.locationHeader}>
                    <Text style={styles.locationTitle}>📍 Ubicación del Negocio</Text>
                    <TouchableOpacity
                      style={styles.mapButton}
                      onPress={() => setMapModalVisible(true)}
                      disabled={loading}
                    >
                      <Ionicons name="map" size={20} color={COLORS.white} />
                      <Text style={styles.mapButtonText}>Mapa</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.coordinatesRow}>
                    <View style={[styles.inputWrapper, styles.coordinateInput]}>
                      <StyledTextInput
                        placeholder="🌎 Latitud"
                        value={latitud}
                        onChangeText={setLatitud}
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                        style={styles.input}
                        editable={!loading}
                      />
                    </View>
                    <View style={[styles.inputWrapper, styles.coordinateInput]}>
                      <StyledTextInput
                        placeholder="🌍 Longitud"
                        value={longitud}
                        onChangeText={setLongitud}
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                        style={styles.input}
                        editable={!loading}
                      />
                    </View>
                  </View>
                  
                  {latitud && longitud && (
                    <View style={styles.coordinatesPreview}>
                      <Text style={styles.coordinatesPreviewText}>
                        📍 Ubicación: {parseFloat(latitud).toFixed(4)}, {parseFloat(longitud).toFixed(4)}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Teléfono */}
                <View style={styles.inputWrapper}>
                  <StyledTextInput
                    placeholder="📱 Teléfono *"
                    value={telefono}
                    onChangeText={setTelefono}
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                    style={styles.input}
                    editable={!loading}
                  />
                </View>
                
                {/* Horario */}
                <View style={styles.inputWrapper}>
                  <StyledTextInput
                    placeholder="🕐 Horario (ej: Lun-Dom 8:00 AM - 10:00 PM)"
                    value={horario}
                    onChangeText={setHorario}
                    placeholderTextColor="#999"
                    style={styles.input}
                    editable={!loading}
                  />
                </View>
                
                {/* Descripción */}
                <View style={styles.inputWrapper}>
                  <StyledTextInput
                    placeholder="📝 Descripción breve de tu negocio"
                    value={descripcion}
                    onChangeText={setDescripcion}
                    placeholderTextColor="#999"
                    style={[styles.input, styles.textArea]}
                    editable={!loading}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </>
            )}

            {/* Error Message */}
            {error && <FormError error={error} />}

            {/* Register Button */}
            <View style={styles.buttonContainer}>
              <GradientButton
                title={loading ? '⏳ Registrando...' : '✨ CREAR'}
                onPress={handleRegister}
                style={styles.registerButton}
                disabled={loading}
                iconName="sparkles"
              />
            </View>

            {/* Login Link Button */}
            <NeoButton
              title="🔑 YA TENGO CUENTA"
              onPress={() => navigation.navigate('Login')}
              variant="secondary"
              style={styles.loginButton}
              noShadow={true}
            />
          </View>
          <View style={{ height: 0 }} />
        </ScrollView>
      </SafeAreaView>
      
      {/* Modal de Mapa */}
      <LocationMapModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        onLocationSelect={handleLocationSelect}
        initialLatitude={latitud ? parseFloat(latitud) : null}
        initialLongitude={longitud ? parseFloat(longitud) : null}
      />
      
      {/* Modal de Selección de Categoría */}
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.categoryModal}>
          <View style={styles.categoryModalHeader}>
            <Text style={styles.categoryModalTitle}>Selecciona Categoría</Text>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.categoryList}>
            {BUSINESS_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryOption,
                  categoria === cat.label && styles.categoryOptionSelected
                ]}
                onPress={() => {
                  setCategoria(cat.label);
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  categoria === cat.label && styles.categoryLabelSelected
                ]}>
                  {cat.label}
                </Text>
                {categoria === cat.label && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.25,
  },
  title: {
    flex: 0,
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 2,
    ...TYPOGRAPHY.bold,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: SPACING.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formSection: {
      flexGrow: 1,
      justifyContent: 'flex-start',
      paddingBottom: SPACING.xs,
  },
    inputWrapper: {
      marginBottom: SPACING.sm,
    },
    input: {
      backgroundColor: COLORS.white,
      borderWidth: BORDERS.width,
      borderColor: COLORS.border,
      borderRadius: 12,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontSize: 15,
      fontWeight: '700',
      color: '#000000', // Texto negro siempre visible
      ...Platform.select({
      ios: {
        shadowColor: COLORS.border,
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 6,
      },
      }),
    },
  roleSelectorContainer: {
    marginVertical: SPACING.sm,
  },
  roleSelectorLabel: {
    fontSize: 12,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  roleButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  roleButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleButtonText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  roleButtonTextSelected: {
    color: COLORS.background,
  },
  buttonContainer: {
    marginTop: SPACING.xs,
    marginBottom: 0,
  },
  registerButton: {
    marginVertical: SPACING.xs,
    borderRadius: 12,
    paddingVertical: 12,
  },
  loginButton: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
    borderRadius: 12,
    paddingVertical: 12,
  },
  headerTop: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.md,
  },
  topLogo: {
    width: 120,
    height: 120,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.xs,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    ...TYPOGRAPHY.bold,
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  coordinateInput: {
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BORDERS.radius.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border || '#E0E0E0',
    ...SHADOWS.small,
  },
  categorySelectorText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  categoryModal: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: 80,
    borderTopLeftRadius: BORDERS.radius.xl,
    borderTopRightRadius: BORDERS.radius.xl,
    ...SHADOWS.large,
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E0E0E0',
  },
  categoryModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  categoryList: {
    flex: 1,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#F0F0F0',
    gap: SPACING.md,
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.primary + '10',
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  categoryLabelSelected: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  locationSection: {
    marginBottom: SPACING.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mapButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  coordinatesPreview: {
    marginTop: SPACING.xs,
    padding: SPACING.sm,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  coordinatesPreviewText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;