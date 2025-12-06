import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Importa las pantallas que usará el comercio.
import MyProductsScreen from '../app/MyProductsScreen';
import MerchantOrdersScreen from '../app/MerchantOrdersScreen';
import ProfileScreen from '../app/ProfileScreen'; // Reutilizamos la pantalla de perfil

const Tab = createBottomTabNavigator();

const MerchantTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Mis Productos') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Pedidos') {
            iconName = focused ? 'list-circle' : 'list-circle-outline';
          } else if (route.name === 'Mi Perfil') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#30D158', // Verde para el comercio
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Ocultamos el header por defecto en las pestañas
      })}
    >
      {/* Aquí defines las pestañas para el comercio */}
      <Tab.Screen name="Mis Productos" component={MyProductsScreen} />
      <Tab.Screen name="Pedidos" component={MerchantOrdersScreen} />
      <Tab.Screen name="Mi Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MerchantTabNavigator;