import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Importamos los iconos

import HomeScreen from '../app/HomeScreen';
import MyOrdersScreen from '../app/MyOrdersScreen';
import ProfileScreen from '../app/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Esta función nos permite definir el icono para cada pestaña
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Explorar') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Mis Pedidos') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Mi Perfil') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          // Puedes usar cualquier icono de la librería Ionicons
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        // Opciones estéticas para las pestañas
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Ocultamos el header de cada pestaña
      })}
    >
      <Tab.Screen name="Explorar" component={HomeScreen} />
      <Tab.Screen name="Mis Pedidos" component={MyOrdersScreen} />
      <Tab.Screen name="Mi Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;