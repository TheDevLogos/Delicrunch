import React, { useState, useEffect, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Pantallas para compradores
import DiscoverScreen from '../app/DiscoverScreen';
import BrowseScreen from '../app/BrowseScreen';
import FavoritesScreen from '../app/FavoritesScreen';
import RewardsScreen from '../app/RewardsScreen';
import ProfileScreen from '../app/ProfileScreen';

// Pantallas para comercios
import MerchantDashboardScreen from '../app/MerchantDashboardScreen';
import MyProductsScreen from '../app/MyProductsScreen';
import StoreOrdersScreen from '../app/StoreOrdersScreen';
import MerchantRewardsScreen from '../app/MerchantRewardsScreen';

// Pantallas para administración
import AdminDashboardScreen from '../app/admin/AdminDashboardScreen';
import AdminStoresScreen from '../app/admin/AdminStoresScreen';
import AdminReviewsScreen from '../app/admin/AdminReviewsScreen';
import AdminTransactionsScreen from '../app/admin/AdminTransactionsScreen';
import AdminMetricsScreen from '../app/admin/AdminMetricsScreen';
import AdminProfileScreen from '../app/admin/AdminProfileScreen';

// Tema
import { COLORS } from '../src/constants/theme';

const Tab = createBottomTabNavigator();

// Tab Navigator para COMPRADORES (con opción de SuperAdmin si es admin simulando)
const CompradorTabs = ({ isAdmin = false }) => {
  return (
    <Tab.Navigator screenOptions={screenOptionsConfig}>
      <Tab.Screen 
        name="Descubre" 
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Descubre',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'compass' : 'compass-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Buscar" 
        component={BrowseScreen}
        options={{
          tabBarLabel: 'Buscar',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'search' : 'search-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Favoritos" 
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Favoritos',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'heart' : 'heart-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Recompensas" 
        component={RewardsScreen}
        options={{
          tabBarLabel: 'Recompensas',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'trophy' : 'trophy-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      {isAdmin ? (
        <Tab.Screen 
          name="SuperAdmin" 
          component={AdminProfileScreen}
          options={{
            tabBarLabel: 'SuperAdmin',
            tabBarIcon: ({ focused, color }) => (
              <View style={{ position: 'relative' }}>
                <Ionicons 
                  name={focused ? 'person-circle' : 'person-circle-outline'} 
                  size={24} 
                  color={color} 
                />
                <View style={{ 
                  position: 'absolute', 
                  top: -4, 
                  right: -6, 
                  backgroundColor: '#fbbf24',
                  borderRadius: 6,
                  width: 12,
                  height: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 8 }}>👑</Text>
                </View>
              </View>
            ),
          }}
        />
      ) : (
        <Tab.Screen 
          name="Yo" 
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Perfil',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons 
                name={focused ? 'person-circle' : 'person-circle-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
};

// Tab Navigator para COMERCIOS (con opción de SuperAdmin si es admin simulando)
const ComercioTabs = ({ isAdmin = false }) => {
  return (
    <Tab.Navigator screenOptions={screenOptionsConfig}>
      <Tab.Screen 
        name="Dashboard" 
        component={MerchantDashboardScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="MisProductos" 
        component={MyProductsScreen}
        options={{
          tabBarLabel: 'Productos',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'fast-food' : 'fast-food-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Pedidos" 
        component={StoreOrdersScreen}
        options={{
          tabBarLabel: 'Pedidos',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'clipboard' : 'clipboard-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Premios" 
        component={MerchantRewardsScreen}
        options={{
          tabBarLabel: 'Premios',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'trophy' : 'trophy-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      {isAdmin ? (
        <Tab.Screen 
          name="SuperAdmin" 
          component={AdminProfileScreen}
          options={{
            tabBarLabel: 'SuperAdmin',
            tabBarIcon: ({ focused, color }) => (
              <View style={{ position: 'relative' }}>
                <Ionicons 
                  name={focused ? 'person-circle' : 'person-circle-outline'} 
                  size={24} 
                  color={color} 
                />
                <View style={{ 
                  position: 'absolute', 
                  top: -4, 
                  right: -6, 
                  backgroundColor: '#fbbf24',
                  borderRadius: 6,
                  width: 12,
                  height: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 8 }}>👑</Text>
                </View>
              </View>
            ),
          }}
        />
      ) : (
        <Tab.Screen 
          name="Perfil" 
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Perfil',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons 
                name={focused ? 'person-circle' : 'person-circle-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
};

// Configuración común de tabs (como función para evitar usar styles antes de declararlo)
const screenOptionsConfig = () => ({
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: '#8E8E93',
  tabBarStyle: styles.tabBar,
  tabBarLabelStyle: styles.tabBarLabel,
  headerShown: false,
  tabBarHideOnKeyboard: true,
});

// Tab Navigator para ADMINISTRADORES
// Tabs: Dashboard, Comercios, Reviews, Transacciones, Perfil SuperAdmin
const AdminTabs = () => {
  return (
    <Tab.Navigator screenOptions={screenOptionsConfig}>
      <Tab.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Panel',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="AdminStores" 
        component={AdminStoresScreen}
        options={{
          tabBarLabel: 'Comercios',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'storefront' : 'storefront-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="AdminReviews" 
        component={AdminReviewsScreen}
        options={{
          tabBarLabel: 'Reviews',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="AdminTransactions" 
        component={AdminTransactionsScreen}
        options={{
          tabBarLabel: 'Pagos',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'card' : 'card-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="AdminProfile" 
        component={AdminProfileScreen}
        options={{
          tabBarLabel: 'SuperAdmin',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons 
                name={focused ? 'person-circle' : 'person-circle-outline'} 
                size={24} 
                color={color} 
              />
              {/* Badge de corona */}
              <View style={{ 
                position: 'absolute', 
                top: -4, 
                right: -6, 
                backgroundColor: '#fbbf24',
                borderRadius: 6,
                width: 12,
                height: 12,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 8 }}>👑</Text>
              </View>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Componente principal que decide qué tabs mostrar
const BottomTabNavigator = () => {
  const { user, effectiveRole, isAdmin, isTransitioning } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Pequeño delay para asegurar que el contexto está listo
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Pantalla de transición al cambiar de perfil
  if (isTransitioning) {
    return (
      <View style={styles.transitionContainer}>
        <View style={styles.transitionContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.transitionTitle}>🔄 Cambiando de Perfil</Text>
          <Text style={styles.transitionSubtitle}>
            Cargando vista de {effectiveRole === 'comprador' ? 'Comprador' : effectiveRole === 'comercio' ? 'Comercio' : 'Admin'}...
          </Text>
        </View>
      </View>
    );
  }

  // Mientras carga, mostrar loading
  if (isLoading || !effectiveRole) {
    return (
      <View style={styles.transitionContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Mostrar tabs según rol efectivo (simulado o real)
  if (effectiveRole === 'admin') {
    return <AdminTabs />;
  }

  if (effectiveRole === 'comercio') {
    return <ComercioTabs isAdmin={isAdmin} />;
  }

  // Default: comprador
  return <CompradorTabs isAdmin={isAdmin} />;
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 25 : 12, // Reducido para iOS y aumentado para Android
    height: Platform.OS === 'ios' ? 85 : 72, // Reducido height para subir el tab navigator
    // Sombra suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    // Margin bottom para evitar conflicto con botones de Android
    marginBottom: Platform.OS === 'android' ? 8 : 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  // Estilos para la pantalla de transición
  transitionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background || '#f5f5f5',
  },
  transitionContent: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.white || '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 40,
  },
  transitionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text || '#1a1a1a',
    marginTop: 20,
    marginBottom: 8,
  },
  transitionSubtitle: {
    fontSize: 14,
    color: COLORS.textLight || '#666',
    textAlign: 'center',
  },
});

export default BottomTabNavigator;
