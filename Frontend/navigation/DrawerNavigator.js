import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Pantallas importadas
import HomeScreen from '../app/HomeScreen';
import ProfileScreen from '../app/ProfileScreen';
import MyOrdersScreen from '../app/MyOrdersScreen';
import MyReviewsScreen from '../app/MyReviewsScreen';
import FavoritesScreen from '../app/FavoritesScreen';

// Tema
import { COLORS, SPACING } from '../src/constants/theme';

const Drawer = createDrawerNavigator();

// Componente personalizado del contenido del Drawer
function CustomDrawerContent(props) {
  const { user, signOut } = useAuth();

  return (
    <DrawerContentScrollView {...props} style={styles.drawerScroll}>
      <SafeAreaView style={styles.drawerHeader}>
        {/* Banner decorativo neobrutalism */}
        <View style={styles.headerBanner}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account-circle" size={60} color={COLORS.primary} />
          </View>
          <Text style={styles.userName}>{user?.nombre || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.rolBadge}>
            <Text style={styles.rolText}>Comprador</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Items del drawer */}
      <DrawerItemList {...props} />

      {/* Separador */}
      <View style={styles.separator} />

      {/* Botón de logout */}
      <DrawerItem
        label="Cerrar Sesión"
        icon={({ color, size }) => (
          <Ionicons name="log-out" size={size} color="#D32F2F" />
        )}
        labelStyle={styles.logoutLabel}
        onPress={signOut}
      />
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: styles.headerStyle,
        headerTintColor: COLORS.text,
        headerTitleStyle: styles.headerTitleStyle,
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: '#666666',
        drawerStyle: styles.drawerStyle,
        drawerLabelStyle: styles.drawerLabelStyle,
        drawerItemStyle: styles.drawerItemStyle,
        headerRight: () => (
          <MaterialCommunityIcons
            name="bell-outline"
            size={24}
            color={COLORS.primary}
            style={{ marginRight: SPACING.md }}
          />
        ),
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      {/* INICIO */}
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          drawerLabel: 'Inicio',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* PERFIL */}
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Mi Perfil',
          drawerLabel: 'Mi Perfil',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* MIS COMPRAS */}
      <Drawer.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          title: 'Mis Compras',
          drawerLabel: 'Mis Compras',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shopping-outline" size={size} color={color} />
          ),
        }}
      />

      {/* MIS RESEÑAS */}
      <Drawer.Screen
        name="MyReviews"
        component={MyReviewsScreen}
        options={{
          title: 'Mis Reseñas',
          drawerLabel: 'Mis Reseñas',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star-outline" size={size} color={color} />
          ),
        }}
      />

      {/* FAVORITOS */}
      <Drawer.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favoritos',
          drawerLabel: 'Favoritos',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-outline" size={size} color={color} />
          ),
        }}
      />

      {/* CATEGORÍAS */}
      <Drawer.Screen
        name="Bakeries"
        component={HomeScreen}
        options={{
          title: 'Panaderías',
          drawerLabel: 'Panaderías y Pastelerías',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bread-slice" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Cafes"
        component={HomeScreen}
        options={{
          title: 'Cafeterías',
          drawerLabel: 'Cafeterías y Bares',
          drawerIcon: ({ color, size }) => (
            <FontAwesome5 name="coffee" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Supermarkets"
        component={HomeScreen}
        options={{
          title: 'Supermercados',
          drawerLabel: 'Supermercados',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cart" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Restaurants"
        component={HomeScreen}
        options={{
          title: 'Restaurantes',
          drawerLabel: 'Restaurantes',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="silverware-fork-knife" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerScroll: {
    backgroundColor: COLORS.background,
  },
  drawerHeader: {
    paddingVertical: SPACING.lg,
  },
  headerBanner: {
    marginHorizontal: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 0,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: '#FFF8F0',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  rolBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 0,
  },
  rolText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  separator: {
    height: 2,
    backgroundColor: COLORS.primary,
    marginVertical: SPACING.lg,
  },
  logoutLabel: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  drawerItemStyle: {
    paddingVertical: 8,
    marginHorizontal: SPACING.sm,
    borderRadius: 0,
  },
  drawerLabelStyle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: -16,
  },
  drawerStyle: {
    backgroundColor: COLORS.background,
    borderRightWidth: 3,
    borderRightColor: COLORS.primary,
  },
  headerStyle: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  headerTitleStyle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: COLORS.text,
  },
});
