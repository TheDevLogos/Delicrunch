import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SPACING, TYPOGRAPHY } from '../src/constants/theme';

// Usar WebView para mostrar Leaflet
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const LocationMapModal = ({ 
  visible, 
  onClose, 
  onLocationSelect, 
  initialLatitude = null, 
  initialLongitude = null 
}) => {
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const webViewRef = useRef(null);

  // HTML del mapa Leaflet
  const getMapHTML = (lat = 28.1910, lng = -105.4708) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seleccionar Ubicación</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        #map { width: 100vw; height: 100vh; }
        .coordinates-info {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.95);
          padding: 15px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          font-size: 14px;
          text-align: center;
        }
        .coordinates-info h3 {
          color: #FF6B35;
          margin-bottom: 8px;
          font-size: 16px;
        }
        .coordinates-text {
          color: #333;
          font-weight: 600;
        }
        .instructions {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.95);
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          z-index: 1000;
          font-size: 12px;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="instructions">
        📍 Toca en el mapa para seleccionar la ubicación de tu negocio
      </div>
      
      <div id="map"></div>
      
      <div class="coordinates-info">
        <h3>📍 Coordenadas Seleccionadas</h3>
        <div class="coordinates-text" id="coordinates">
          Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}
        </div>
      </div>

      <script>
        // Inicializar el mapa
        var map = L.map('map').setView([${lat}, ${lng}], 16);

        // Capa de tiles de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        // Marcador inicial
        var marker = L.marker([${lat}, ${lng}], {
          draggable: true
        }).addTo(map);

        // Función para actualizar coordenadas
        function updateCoordinates(lat, lng) {
          document.getElementById('coordinates').innerHTML = 
            'Lat: ' + lat.toFixed(6) + ', Lng: ' + lng.toFixed(6);
          
          // Enviar coordenadas al React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'locationSelected',
            latitude: lat,
            longitude: lng
          }));
        }

        // Event listener para clics en el mapa
        map.on('click', function(e) {
          var lat = e.latlng.lat;
          var lng = e.latlng.lng;
          
          marker.setLatLng([lat, lng]);
          updateCoordinates(lat, lng);
        });

        // Event listener para arrastre del marcador
        marker.on('dragend', function(e) {
          var lat = e.target.getLatLng().lat;
          var lng = e.target.getLatLng().lng;
          updateCoordinates(lat, lng);
        });

        // Enviar coordenadas iniciales
        updateCoordinates(${lat}, ${lng});
        
        // Función para centrar en ubicación
        window.centerOnLocation = function(lat, lng) {
          map.setView([lat, lng], 16);
          marker.setLatLng([lat, lng]);
          updateCoordinates(lat, lng);
        };
      </script>
    </body>
    </html>
  `;

  // Obtener ubicación actual del usuario
  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Se necesitan permisos de ubicación para usar esta función.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });

      // Centrar el mapa en la ubicación actual
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'centerOnLocation',
          latitude,
          longitude
        }));
      }

    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert(
        'Error',
        'No se pudo obtener la ubicación actual. Verifica que el GPS esté activado.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejar mensajes del WebView
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'locationSelected') {
        setCurrentLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
      }
    } catch (error) {
      console.error('Error procesando mensaje de WebView:', error);
    }
  };

  // Confirmar selección de ubicación
  const handleConfirmLocation = () => {
    if (currentLocation) {
      onLocationSelect(currentLocation.latitude, currentLocation.longitude);
      onClose();
    } else {
      Alert.alert(
        'Ubicación requerida',
        'Por favor, selecciona una ubicación en el mapa.',
        [{ text: 'OK' }]
      );
    }
  };

  // Determinar coordenadas iniciales
  const getInitialCoordinates = () => {
    if (initialLatitude && initialLongitude) {
      return { lat: initialLatitude, lng: initialLongitude };
    }
    // Coordenadas por defecto (Chihuahua, México)
    return { lat: 28.1910, lng: -105.4708 };
  };

  const initialCoords = getInitialCoordinates();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Seleccionar Ubicación</Text>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleConfirmLocation}
          >
            <Ionicons name="checkmark" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Mapa */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: getMapHTML(initialCoords.lat, initialCoords.lng) }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando mapa...</Text>
              </View>
            )}
          />
        </View>

        {/* Botón de ubicación actual */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="location" size={24} color={COLORS.white} />
          )}
        </TouchableOpacity>

        {/* Información de coordenadas */}
        {currentLocation && (
          <View style={styles.coordinatesInfo}>
            <Text style={styles.coordinatesTitle}>Coordenadas Seleccionadas:</Text>
            <Text style={styles.coordinatesText}>
              Lat: {currentLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordinatesText}>
              Lng: {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    ...TYPOGRAPHY.bold,
  },
  mapContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.text,
    fontSize: 16,
  },
  locationButton: {
    position: 'absolute',
    bottom: 120,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  coordinatesInfo: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    maxWidth: width - (SPACING.lg * 2),
  },
  coordinatesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  coordinatesText: {
    fontSize: 12,
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default LocationMapModal;