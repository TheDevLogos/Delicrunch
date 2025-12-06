import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import StyledTextInput from '../components/StyledTextInput';
import StyledButton from '../components/StyledButton';
import api from '../services/api';

const EditProfileScreen = ({ route, navigation }) => {
  // Recibimos el perfil actual para pre-rellenar el formulario
  const { profile } = route.params;

  const [nombre, setNombre] = useState(profile.nombre);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Estados para el cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleUpdateProfile = async () => {
    if (!nombre) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const updatedData = { nombre };

      // Hacemos la llamada a la API para actualizar el perfil
      await api.put('/profiles/me', updatedData);

      Alert.alert('Éxito', 'Tu perfil ha sido actualizado.');
      navigation.goBack(); // Volvemos a la pantalla de perfil

    } catch (error) {
      console.error("Error al actualizar el perfil:", error.response?.data);
      Alert.alert('Error', 'No se pudo actualizar tu perfil. Inténtalo de nuevo.');
    } finally {
      setIsUpdatingProfile(false);
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Editar Perfil</Text>

        <Text style={styles.label}>Nombre Completo</Text>
        <StyledTextInput
          placeholder="Tu nombre"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Correo Electrónico</Text>
        <StyledTextInput
          value={profile.email}
          editable={false} // El email no se puede editar
          style={styles.disabledInput}
        />

        <StyledButton
          title={isUpdatingProfile ? "Guardando..." : "Guardar Cambios"}
          onPress={handleUpdateProfile}
          disabled={isUpdatingProfile}
          style={{ marginBottom: 30 }}
        />

        {/* --- SECCIÓN PARA CAMBIAR CONTRASEÑA --- */}
        <View style={styles.divider} />
        <Text style={styles.title}>Cambiar Contraseña</Text>

        <Text style={styles.label}>Contraseña Actual</Text>
        <StyledTextInput placeholder="Tu contraseña actual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />

        <Text style={styles.label}>Nueva Contraseña</Text>
        <StyledTextInput placeholder="Introduce la nueva contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry />

        <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
        <StyledTextInput placeholder="Confirma la nueva contraseña" value={confirmNewPassword} onChangeText={setConfirmNewPassword} secureTextEntry />

        <StyledButton
          title={isUpdatingPassword ? "Actualizando..." : "Cambiar Contraseña"}
          onPress={handleUpdatePassword}
          isLoading={isUpdatingPassword}
          variant="danger"
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  label: { fontSize: 16, color: '#333', marginBottom: 5, marginLeft: 5 },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#a0a0a0',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
});

export default EditProfileScreen;