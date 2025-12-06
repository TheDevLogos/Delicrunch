import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';


// Importación de todas las pantallas necesarias
import WelcomeScreen from '../app/WelcomeScreen';
import LoginScreen from '../app/LoginScreen';
import RegisterScreen from '../app/RegisterScreen';
import ProductDetailScreen from '../app/ProductDetailScreen';
import OrderConfirmationScreen from '../app/OrderConfirmationScreen';
import AddProductScreen from '../app/AddProductScreen';

// Importación de los navegadores de pestañas
import MainTabNavigator from './MainTabNavigator'; // Para Compradores
import MerchantTabNavigator from './MerchantTabNavigator'; // Para Comercios

const Stack = createNativeStackNavigator();

// 2. Stack de pantallas de autenticación (cuando NO estás logueado)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// 3. Stack principal de la app (cuando SÍ estás logueado)
//    Decide qué TabNavigator mostrar basado en el rol del usuario.
const AppStack = ({ userRole }) => (
  <Stack.Navigator screenOptions={{ headerBackTitle: 'Volver' }}>
    <Stack.Screen
      name="MainTabs"
      component={userRole === 'comercio' ? MerchantTabNavigator : MainTabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Detalles del Pack', headerShown: true }} />
    <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ title: '¡Gracias!', headerBackVisible: false, headerShown: true }} />
    <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Añadir Nuevo Producto', headerShown: true }} />
  </Stack.Navigator>
);

// 4. Componente principal que gestiona la lógica de navegación
const AppNavigator = () => {
  // Obtenemos el usuario del contexto global definido en App.js
  const { user, isLoading } = useAuth();

  // Mostrar indicador de carga mientras se verifica la sesión
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Renderizado final: decide qué stack mostrar (Auth o App)
  // Ya no necesitamos el NavigationContainer ni el AuthContext.Provider aquí
  return user == null ? <AuthStack /> : <AppStack userRole={user.rol} />;
};

export default AppNavigator;
