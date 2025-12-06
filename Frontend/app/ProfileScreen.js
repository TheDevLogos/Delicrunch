import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StyledButton from '../components/StyledButton';
import ReadOnlyStarRating from '../components/ReadOnlyStarRating'; // <-- Importar el componente de estrellas
import StripeOnboarding from '../components/StripeOnboarding'; // <-- Importar el nuevo componente

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profiles/me'); // <-- LÍNEA SIMPLIFICADA
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

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  if (!profile) {
    return <Text style={styles.errorText}>No se pudo cargar el perfil.</Text>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi Perfil</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Nombre</Text>
            <Text style={styles.infoValue}>{profile.nombre}</Text>
            {/* Mostramos la calificación solo si el usuario es un comercio */}
            {profile.rol === 'comercio' && (
              <>
                <View style={styles.divider} />
                <Text style={styles.infoLabel}>Calificación como Vendedor</Text>
                <ReadOnlyStarRating rating={profile.calificacion_promedio_vendedor || 0} size={22} />
              </>
            )}
            <View style={styles.divider} />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile.email}</Text>
            <View style={styles.divider} />
            <Text style={styles.infoLabel}>Tipo de cuenta</Text>
            <Text style={styles.infoValue}>{profile.rol.charAt(0).toUpperCase() + profile.rol.slice(1)}</Text>
          </View>

          {/* Mostramos el componente de Stripe solo si es un comercio */}
          {profile.rol === 'comercio' && (
            <StripeOnboarding />
          )}

        </View>
        <StyledButton
          title="Editar Perfil"
          // Usamos getParent() para subir al navegador padre (el StackNavigator principal)
          // y desde ahí navegar a la pantalla de edición. Esto evita errores de anidamiento.
          onPress={() => navigation.getParent()?.navigate('EditProfileScreen', { profile })}
          style={{ marginBottom: 10 }}
        />
        <StyledButton title="Cerrar Sesión" onPress={signOut} variant="danger" />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 40 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 34, fontWeight: 'bold', color: '#1C1C1E' },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoLabel: { fontSize: 16, color: '#8A8A8E' },
  infoValue: { fontSize: 18, color: '#1C1C1E', marginTop: 4, marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 10 },
  errorText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'red' },
});

export default ProfileScreen;