import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../src/constants/theme';

import { useAuth } from '../contexts/AuthContext';

// Importación de todas las pantallas necesarias
import LoginScreen from '../app/LoginScreen';
import RegisterScreen from '../app/RegisterScreen';
import ForgotPasswordScreen from '../app/ForgotPasswordScreen';
import ResetPasswordScreen from '../app/ResetPasswordScreen';
import ProductDetailScreen from '../app/ProductDetailScreen';
import OrderConfirmationScreen from '../app/OrderConfirmationScreen';
import AddProductScreen from '../app/AddProductScreen';
import EditProfileScreen from '../app/EditProfileScreen';
import MyOrdersScreen from '../app/MyOrdersScreen';
import MyReviewsScreen from '../app/MyReviewsScreen';
import LeaveReviewScreen from '../app/LeaveReviewScreen';
import PaymentScreen from '../app/PaymentScreen';
import StoreProfileScreen from '../app/StoreProfileScreen';
import StoreReviewsScreen from '../app/StoreReviewsScreen';

// Pantallas de comercio
import OrderHistoryScreen from '../app/OrderHistoryScreen';
import MerchantRewardsScreen from '../app/MerchantRewardsScreen';
import EditProductScreen from '../app/EditProductScreen';
import StoreOrdersScreen from '../app/StoreOrdersScreen';
import MyProductsScreen from '../app/MyProductsScreen';
import OrderDetailScreen from '../app/OrderDetailScreen';

// Pantallas de comprador
import FavoritesScreen from '../app/FavoritesScreen';
import RewardsScreen from '../app/RewardsScreen';
import DiscoverScreen from '../app/DiscoverScreen';
import BrowseScreen from '../app/BrowseScreen';

// Pantallas de admin
import AdminMetricsScreen from '../app/admin/AdminMetricsScreen';

// Pantalla de notificaciones
// import NotificationSettingsScreen from '../app/NotificationSettingsScreen'; // DESACTIVADO: expo-notifications removido

// Importación de los navegadores de pestañas
import MainTabNavigator from './MainTabNavigator'; // Para Compradores
import MerchantTabNavigator from './MerchantTabNavigator'; // Para Comercios
import BottomTabNavigator from './BottomTabNavigator'; // Nuevo navegador de tabs inferior

const Stack = createNativeStackNavigator();

// Las pantallas de pedidos y comercio requieren una sesión iniciada.
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);

// 3. Stack principal de la app (cuando SÍ estás logueado)
//    Usa el nuevo BottomTabNavigator
const AppStack = ({ userRole }) => (
  <Stack.Navigator screenOptions={{ headerBackTitle: 'Volver', headerShown: false }}>
    <Stack.Screen
      name="MainTabs"
      component={BottomTabNavigator}
    />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Detalles del Pack', headerShown: false }} />
    <Stack.Screen name="StoreProfile" component={StoreProfileScreen} options={{ title: 'Tienda', headerShown: false }} />
    <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ title: '¡Gracias!', headerBackVisible: false, headerShown: true }} />
    <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Añadir Nuevo Producto', headerShown: false }} />
    <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Editar Producto', headerShown: false }} />
    <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ title: 'Editar Perfil', headerShown: false }} />
    <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'Mis Pedidos', headerShown: false }} />
    <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: 'Mis Reseñas', headerShown: false }} />
    <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} options={{ title: 'Dejar Reseña', headerShown: false }} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Detalle del Pedido', headerShown: false }} />
    <Stack.Screen name="StoreReviews" component={StoreReviewsScreen} options={{ title: 'Reseñas de Mi Tienda', headerShown: false }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Reservar', headerShown: false }} />
    {/* Pantallas exclusivas de comercio */}
    <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'Historial de Pedidos', headerShown: false }} />
    <Stack.Screen name="MerchantRewards" component={MerchantRewardsScreen} options={{ title: 'Mis Premios', headerShown: false }} />
    <Stack.Screen name="StoreOrders" component={StoreOrdersScreen} options={{ title: 'Pedidos de Mi Tienda', headerShown: true }} />
    <Stack.Screen name="MyProducts" component={MyProductsScreen} options={{ title: 'Mis Productos', headerShown: true }} />
    {/* Pantallas de comprador accesibles para admin */}
    <Stack.Screen name="Favoritos" component={FavoritesScreen} options={{ title: 'Favoritos', headerShown: true }} />
    <Stack.Screen name="Recompensas" component={RewardsScreen} options={{ title: 'Recompensas', headerShown: true }} />
    <Stack.Screen name="Descubre" component={DiscoverScreen} options={{ title: 'Descubrir', headerShown: false }} />
    <Stack.Screen name="Buscar" component={BrowseScreen} options={{ title: 'Buscar', headerShown: false }} />
    {/* Pantallas de admin accesibles desde perfil */}
    <Stack.Screen name="AdminMetrics" component={AdminMetricsScreen} options={{ title: 'Métricas', headerShown: true }} />
    {/* Pantalla de configuración de notificaciones */}
    {/* <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notificaciones', headerShown: true }} /> */}
  </Stack.Navigator>
);

// 4. Componente principal que gestiona la lógica de navegación
const AppNavigator = () => {
  // Obtenemos el usuario del contexto global definido en App.js
  const { user, isLoading } = useAuth();

  // Mostrar indicador de carga mientras se verifica la sesión
  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <Image source={require('../assets/Crunchy.png')} style={loadingStyles.mascot} resizeMode="contain" />
        <Text style={loadingStyles.brand}>Delicrunch</Text>
        <Text style={loadingStyles.message}>Packs deliciosos cerca de ti</Text>
        <ActivityIndicator size="small" color={COLORS.white} style={loadingStyles.spinner} />
      </View>
    );
  }

  // Renderizado final: decide qué stack mostrar (Auth o App)
  return user == null ? <AuthStack /> : <AppStack userRole={user.rol} />;
};

export default AppNavigator;

const loadingStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary, padding: 24 },
  mascot: { width: 168, height: 168, marginBottom: 12 },
  brand: { color: COLORS.white, fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  message: { color: COLORS.white, fontSize: 15, marginTop: 8 },
  spinner: { marginTop: 36 },
});
