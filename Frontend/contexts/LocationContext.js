/**
 * Contexto de Ubicación Global
 * Maneja la ubicación del usuario y la ciudad detectada
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation debe usarse dentro de LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState({
    city: 'Delicias',
    region: 'Chihuahua',
    fullAddress: 'Delicias, Chihuahua',
    latitude: 28.1910,
    longitude: -105.4708,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [nearbyRadius, setNearbyRadius] = useState(12); // millas

  // Cargar ubicación guardada al iniciar
  useEffect(() => {
    loadSavedLocation();
  }, []);

  const loadSavedLocation = async () => {
    try {
      const saved = await AsyncStorage.getItem('userLocation');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserLocation(parsed);
      }
    } catch (e) {
      console.log('Error cargando ubicación guardada:', e);
    }
  };

  const saveLocation = async (location) => {
    try {
      await AsyncStorage.setItem('userLocation', JSON.stringify(location));
    } catch (e) {
      console.log('Error guardando ubicación:', e);
    }
  };

  // Detectar ubicación por GPS
  const detectLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status !== 'granted') {
        setIsLoadingLocation(false);
        return { success: false, error: 'Permiso denegado' };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding para obtener ciudad
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (geocode && geocode[0]) {
        const geo = geocode[0];
        const newLocation = {
          city: geo.city || geo.subregion || 'Mi ubicación',
          region: geo.region || '',
          fullAddress: [geo.city, geo.region].filter(Boolean).join(', ') || 'Mi ubicación',
          latitude,
          longitude,
          street: geo.street,
          postalCode: geo.postalCode,
        };
        
        setUserLocation(newLocation);
        await saveLocation(newLocation);
        setIsLoadingLocation(false);
        return { success: true, location: newLocation };
      }
      
      // Si no hay geocode, al menos guardamos las coordenadas
      const fallbackLocation = {
        city: 'Mi ubicación',
        region: '',
        fullAddress: 'Mi ubicación',
        latitude,
        longitude,
      };
      setUserLocation(fallbackLocation);
      await saveLocation(fallbackLocation);
      setIsLoadingLocation(false);
      return { success: true, location: fallbackLocation };
      
    } catch (error) {
      console.error('Error detectando ubicación:', error);
      setIsLoadingLocation(false);
      return { success: false, error: error.message };
    }
  }, []);

  // Establecer ubicación manualmente
  const setManualLocation = useCallback(async (city, region = '') => {
    setIsLoadingLocation(true);
    try {
      // Geocodificar la ciudad para obtener coordenadas
      const geocode = await Location.geocodeAsync(`${city}, ${region}`);
      
      if (geocode && geocode[0]) {
        const { latitude, longitude } = geocode[0];
        const newLocation = {
          city,
          region,
          fullAddress: [city, region].filter(Boolean).join(', '),
          latitude,
          longitude,
        };
        setUserLocation(newLocation);
        await saveLocation(newLocation);
        setIsLoadingLocation(false);
        return { success: true, location: newLocation };
      }
      
      setIsLoadingLocation(false);
      return { success: false, error: 'Ciudad no encontrada' };
    } catch (error) {
      setIsLoadingLocation(false);
      return { success: false, error: error.message };
    }
  }, []);

  // Calcular distancia entre dos puntos (en millas)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 3959; // Radio de la Tierra en millas
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Filtrar tiendas por distancia
  const filterByDistance = useCallback((stores, maxDistance = nearbyRadius) => {
    if (!userLocation.latitude || !userLocation.longitude) return stores;
    
    return stores.filter(store => {
      const lat = parseFloat(store.latitud);
      const lng = parseFloat(store.longitud);
      if (isNaN(lat) || isNaN(lng)) return true; // Incluir si no tiene coordenadas
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        lat,
        lng
      );
      return distance <= maxDistance;
    }).map(store => {
      const lat = parseFloat(store.latitud);
      const lng = parseFloat(store.longitud);
      const distance = (isNaN(lat) || isNaN(lng)) 
        ? null 
        : calculateDistance(userLocation.latitude, userLocation.longitude, lat, lng);
      return { ...store, distancia: distance };
    }).sort((a, b) => (a.distancia || 999) - (b.distancia || 999));
  }, [userLocation, nearbyRadius, calculateDistance]);

  const value = {
    userLocation,
    isLoadingLocation,
    locationPermission,
    nearbyRadius,
    setNearbyRadius,
    detectLocation,
    setManualLocation,
    calculateDistance,
    filterByDistance,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;
