import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import StyledTextInput from '../components/StyledTextInput';
import StyledButton from '../components/StyledButton';
import api from '../services/api';
import FormError from '../components/FormError'; // <-- 1. Importar el nuevo componente
import logger from '../services/logger'; // <-- Importar el logger

const RegisterScreen = ({ navigation }) => {
  // --- ESTADO DEL FORMULARIO ---
  // useState es un "Hook" de React. Nos permite guardar datos dentro de un componente.
  // Cada vez que estos datos cambian, el componente se vuelve a renderizar (se redibuja).
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Nuevo estado para la confirmación
  const [error, setError] = useState(null); // <-- 2. Añadir estado para el mensaje de error
  // Por ahora, el rol será fijo. Más adelante podríamos añadir un selector.
  const [rol, setRol] = useState('comprador'); // o 'comercio'

const handleRegister = async () => {
    setError(null); // Limpiar errores previos al intentar de nuevo

    // Validación simple en el frontend
    if (!nombre || !email || !password || !confirmPassword || !rol) { 
      setError('Por favor, completa todos los campos y selecciona un rol.');
      return;
    }

    // --- VALIDACIÓN DE EMAIL ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, introduce una dirección de correo electrónico válida.');
      return;
    }
    // --- FIN DE VALIDACIÓN ---

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // --- VALIDACIÓN DE CONFIRMACIÓN DE CONTRASEÑA ---
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      // Creamos el objeto con los datos del usuario
      const userData = { nombre, email, password, rol };
      
      console.log('Enviando datos al backend:', userData);

      // Realizamos la petición POST a la ruta /auth/register de nuestra API
      const response = await api.post('/auth/register', userData);

      console.log('Respuesta del backend:', response.data);

      // Si el registro es exitoso, mostramos un mensaje y lo enviamos al Login
      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.'
      );
      navigation.navigate('Login');

    } catch (error) {
      logger.error(error, 'handleRegister'); // <-- Usar el logger
      // Si el backend nos devuelve un mensaje de error específico, lo mostramos
      if (error.response && error.response.data.msg) {
        setError(error.response.data.msg);
      } else {
        // Error genérico si el servidor no está disponible o hay otro problema
        setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    }
};
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Crear una Cuenta</Text>

      <StyledTextInput
        placeholder="Nombre completo"
        value={nombre}
        onChangeText={setNombre} // Cuando el texto cambia, actualizamos el estado 'nombre'
      />
      <StyledTextInput
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address" // Muestra el teclado optimizado para emails
        autoCapitalize="none"
      />
      <StyledTextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Oculta el texto de la contraseña
      />
      <StyledTextInput
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* --- SELECTOR DE ROL --- */}
      <View style={styles.roleSelectorContainer}>
        <Text style={styles.roleSelectorLabel}>Quiero registrarme como:</Text>
        <View style={styles.roleButtons}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              rol === 'comprador' && styles.roleButtonSelected, // Estilo condicional si está seleccionado
            ]}
            onPress={() => setRol('comprador')}
          >
            <Text
              style={[
                styles.roleButtonText,
                rol === 'comprador' && styles.roleButtonTextSelected,
              ]}
            >
              Comprador
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              styles.roleButtonComercio, // Estilo para el borde verde
              rol === 'comercio' && styles.roleButtonComercioSelected, // Estilo para el fondo verde
            ]}
            onPress={() => setRol('comercio')}
          >
            <Text
              style={[
                styles.roleButtonTextComercio, // Estilo para el texto verde
                rol === 'comercio' && styles.roleButtonTextSelected,
              ]}
            >
              Comercio
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* --- FIN DE SECCIÓN --- */}

      {/* 3. Renderizar el componente de error */}
      <FormError error={error} />

      <StyledButton title="Registrarme" onPress={handleRegister} />
      <StyledButton
        title="Ya tengo cuenta"
        onPress={() => navigation.navigate('Login')}
        variant="secondary"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
   // --- NUEVOS ESTILOS ---
  roleSelectorContainer: {
    width: '100%',
    marginBottom: 20,
    marginTop: 10,
  },
  roleSelectorLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  roleButton: {
    flex: 1, // Para que ocupen el mismo espacio
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  roleButtonSelected: {
    backgroundColor: '#007bff',
  },
  roleButtonComercio: {
    borderColor: '#28a745', // Borde verde
  },
  roleButtonComercioSelected: {
    backgroundColor: '#28a745', // Fondo verde
  },
  roleButtonTextComercio: {
    color: '#28a745', // Texto verde
    fontSize: 16,
    fontWeight: '600',
  },
  roleButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  roleButtonTextSelected: {
    color: '#fff',
  },
  // --- FIN DE NUEVOS ESTILOS ---
});

export default RegisterScreen;