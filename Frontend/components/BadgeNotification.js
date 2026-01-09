/**
 * BadgeNotification - Notificación animada al desbloquear una insignia
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from '../src/constants/theme';
import { BADGE_TIERS, getBadgeTierColor } from '../src/constants/gamification';

const { width, height } = Dimensions.get('window');

const BadgeNotification = ({ badge, visible, onDismiss }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      // Animación de entrada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Animación de brillo
      Animated.loop(
        Animated.sequence([
          Animated.timing(shineAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shineAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Auto-dismiss después de 4 segundos
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, badge]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible || !badge) return null;

  const tierInfo = BADGE_TIERS[badge.tier] || BADGE_TIERS.COMMON;
  const tierColor = tierInfo.color;

  const shineOpacity = shineAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.95}
        onPress={handleDismiss}
      >
        {/* Confetti effect placeholder */}
        <View style={styles.confettiContainer}>
          {[...Array(8)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.confetti, 
                { 
                  backgroundColor: ['#FFD700', '#FF6B35', '#34C759', '#007AFF', '#AF52DE'][i % 5],
                  left: `${10 + (i * 11)}%`,
                  transform: [{ rotate: `${i * 45}deg` }],
                }
              ]} 
            />
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>🎉 ¡Nueva Insignia!</Text>
        </View>

        {/* Badge Icon */}
        <Animated.View 
          style={[
            styles.badgeContainer, 
            { borderColor: tierColor },
          ]}
        >
          <Animated.View 
            style={[
              styles.shineOverlay,
              { opacity: shineOpacity },
            ]}
          />
          <Ionicons name={badge.icon} size={48} color={tierColor} />
        </Animated.View>

        {/* Badge Info */}
        <Text style={styles.badgeName}>{badge.name}</Text>
        <View style={[styles.tierBadge, { backgroundColor: tierInfo.bgColor }]}>
          <Text style={[styles.tierText, { color: tierColor }]}>
            {tierInfo.name}
          </Text>
        </View>
        <Text style={styles.badgeDescription}>{badge.description}</Text>

        {/* Dismiss hint */}
        <Text style={styles.dismissHint}>Toca para cerrar</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 9999,
  },
  card: {
    width: width * 0.85,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
    top: 20,
  },
  header: {
    marginBottom: SPACING.md,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  badgeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    marginVertical: SPACING.md,
    overflow: 'hidden',
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: SPACING.sm,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '700',
  },
  badgeDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 22,
  },
  dismissHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: SPACING.lg,
  },
});

export default BadgeNotification;
