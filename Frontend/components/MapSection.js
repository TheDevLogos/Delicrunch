

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../src/constants/theme';

export default function MapSection({ stores, loading = false }) {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Simular solicitud de permiso de ubicación
    setHasPermission(true);
  }, []);

  if (loading || !stores || !Array.isArray(stores)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tiendas cercanas...</Text>
      </View>
    );
  }

  if (stores.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="location-outline" size={40} color={COLORS.primary} />
        <Text style={styles.emptyText}>No hay tiendas cercanas disponibles</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🗺️ Tiendas Cercanas</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {stores.map((store, idx) => (
          <TouchableOpacity key={idx} style={styles.storeCard}>
            <View style={styles.storeHeader}>
              <Ionicons name="storefront" size={24} color={COLORS.primary} />
              <Text style={styles.storeName}>{store.nombre_comercio}</Text>
            </View>
            <Text style={styles.storeAddress}>
              <Ionicons name="location" size={12} color={COLORS.secondary} />
              {' '}{store.direccion}
            </Text>
            <View style={styles.storeDistance}>
              <Text style={styles.distanceText}>Productos disponibles</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  scrollView: {
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  storeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginRight: SPACING.md,
    width: 280,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 5,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  storeAddress: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  storeDistance: {
    backgroundColor: COLORS.background,
    borderRadius: 6,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
    marginVertical: SPACING.md,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.text,
    fontSize: 14,
  },
  emptyBox: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 160,
    marginVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  emptyText: {
    marginTop: SPACING.md,
    color: COLORS.text,
    fontSize: 14,
    textAlign: 'center',
  },
});
