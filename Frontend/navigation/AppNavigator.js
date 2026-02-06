import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';

// Importación de todas las pantallas necesarias
import LoginScreen from '../app/LoginScreen';
import RegisterScreen from '../app/RegisterScreen';
import ForgotPasswordScreen from '../app/ForgotPasswordScreen';
import ProductDetailScreen from '../app/ProductDetailScreen';
import OrderConfirmationScreen from '../app/OrderConfirmationScreen';
import AddProductScreen from '../app/AddProductScreen';
import EditProfileScreen from '../app/EditProfileScreen';
import MyOrdersScreen from '../app/MyOrdersScreen';
import MyReviewsScreen from '../app/MyReviewsScreen';
import LeaveReviewScreen from '../app/LeaveReviewScreen';
import PaymentScreen from '../app/PaymentScreen';
import PaymentMethodsScreen from '../app/PaymentMethodsScreen';
import PaymentSuccessScreen from '../app/PaymentSuccessScreen';
import PaymentErrorScreen from '../app/PaymentErrorScreen';
import ManageCardsScreen from '../app/ManageCardsScreen';
import StoreProfileScreen from '../app/StoreProfileScreen';
import StoreReviewsScreen from '../app/StoreReviewsScreen';

// Pantallas de comercio
import OrderHistoryScreen from '../app/OrderHistoryScreen';
import MerchantRewardsScreen from '../app/MerchantRewardsScreen';
import EditProductScreen from '../app/EditProductScreen';
import StoreOrdersScreen from '../app/StoreOrdersScreen';
import MyProductsScreen from '../app/MyProductsScreen';
import OrderDetailScreen from '../app/OrderDetailScreen';
import MerchantPaymentSettingsScreen from '../app/MerchantPaymentSettingsScreen';

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
import DeveloperMenu from './DeveloperMenu'; // 🆕 Developer Menu

const Stack = createNativeStackNavigator();

// 2. Stack de pantallas de autenticación (cuando NO estás logueado)
// Ahora incluye TODAS las pantallas para testing sin autenticación
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="DeveloperMenu" component={DeveloperMenu} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Detalles del Pack', headerShown: true }} />
    <Stack.Screen name="StoreProfile" component={StoreProfileScreen} options={{ title: 'Tienda', headerShown: false }} />
    <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ title: '¡Gracias!', headerBackVisible: false, headerShown: true }} />
    <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Añadir Nuevo Producto', headerShown: false }} />
    <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Editar Producto', headerShown: false }} />
    <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ title: 'Editar Perfil', headerShown: true }} />
    <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'Mis Pedidos', headerShown: true }} />
    <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: 'Mis Reseñas', headerShown: true }} />
    <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} options={{ title: 'Dejar Reseña', headerShown: true }} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Detalle del Pedido', headerShown: false }} />
    <Stack.Screen name="StoreReviews" component={StoreReviewsScreen} options={{ title: 'Reseñas de Mi Tienda', headerShown: false }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Pago', headerShown: true }} />
    <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: 'Métodos de Pago', headerShown: true }} />
    <Stack.Screen name="ManageCards" component={ManageCardsScreen} options={{ title: 'Gestionar Tarjetas', headerShown: true }} />
    <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ title: 'Pago Exitoso', headerShown: false }} />
    <Stack.Screen name="PaymentError" component={PaymentErrorScreen} options={{ title: 'Error de Pago', headerShown: false }} />
    {/* Pantallas exclusivas de comercio */}
    <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'Historial de Pedidos', headerShown: false }} />
    <Stack.Screen name="MerchantRewards" component={MerchantRewardsScreen} options={{ title: 'Mis Premios', headerShown: false }} />
    <Stack.Screen name="MerchantPaymentSettings" component={MerchantPaymentSettingsScreen} options={{ title: 'Configurar Pagos', headerShown: false }} />
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
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Detalles del Pack', headerShown: true }} />
    <Stack.Screen name="StoreProfile" component={StoreProfileScreen} options={{ title: 'Tienda', headerShown: false }} />
    <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ title: '¡Gracias!', headerBackVisible: false, headerShown: true }} />
    <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Añadir Nuevo Producto', headerShown: false }} />
    <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Editar Producto', headerShown: false }} />
    <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ title: 'Editar Perfil', headerShown: true }} />
    <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'Mis Pedidos', headerShown: true }} />
    <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: 'Mis Reseñas', headerShown: true }} />
    <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} options={{ title: 'Dejar Reseña', headerShown: true }} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Detalle del Pedido', headerShown: false }} />
    <Stack.Screen name="StoreReviews" component={StoreReviewsScreen} options={{ title: 'Reseñas de Mi Tienda', headerShown: false }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Pago', headerShown: true }} />
    <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: 'Métodos de Pago', headerShown: true }} />
    <Stack.Screen name="ManageCards" component={ManageCardsScreen} options={{ title: 'Gestionar Tarjetas', headerShown: true }} />
    <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ title: 'Pago Exitoso', headerShown: false }} />
    <Stack.Screen name="PaymentError" component={PaymentErrorScreen} options={{ title: 'Error de Pago', headerShown: false }} />
    {/* Pantallas exclusivas de comercio */}
    <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'Historial de Pedidos', headerShown: false }} />
    <Stack.Screen name="MerchantRewards" component={MerchantRewardsScreen} options={{ title: 'Mis Premios', headerShown: false }} />
    <Stack.Screen name="StoreOrders" component={StoreOrdersScreen} options={{ title: 'Pedidos de Mi Tienda', headerShown: true }} />
    <Stack.Screen name="MyProducts" component={MyProductsScreen} options={{ title: 'Mis Productos', headerShown: true }} />
    <Stack.Screen name="MerchantPaymentSettings" component={MerchantPaymentSettingsScreen} options={{ title: 'Configurar Pagos', headerShown: false }} />
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Renderizado final: decide qué stack mostrar (Auth o App)
  // Ahora inicia con DeveloperMenu en la pantalla de auth
  return user == null ? <AuthStack /> : <AppStack userRole={user.rol} />;
};

export default AppNavigator;
