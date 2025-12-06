import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';
import StyledButton from '../components/StyledButton';
import { Ionicons } from '@expo/vector-icons';

// El objeto 'navigation' es pasado automáticamente a todos los componentes de pantalla
const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="leaf" size={80} color="#30D158" />
        <Text style={styles.title}>Bienvenido a Delicrunch</Text>
        <Text style={styles.subtitle}>Rescata comida deliciosa, ahorra dinero y ayuda al planeta.</Text>
      </View>
      <View style={styles.buttonContainer}>
        <StyledButton
          title="Iniciar Sesión"
          onPress={() => navigation.navigate('Login')} // Navega a la pantalla 'Login'
        />
        <StyledButton
          title="Crear una Cuenta"
          onPress={() => navigation.navigate('Register')} // Navega a la pantalla 'Register'
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#8A8A8E',
    textAlign: 'center',
    marginTop: 15,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
});

export default WelcomeScreen;