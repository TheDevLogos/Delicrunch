/**
 * PromotionalOnboardingModal - Modal inicial con promoción de features
 * Se muestra 1 sola vez al primer login del comprador
 * Presenta: sistema XP, cupones, impacto ambiental CO2
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../src/constants/theme';

const { width } = Dimensions.get('window');

const PromotionalOnboardingModal = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Datos de los 3 slides
  const slides = [
    {
      icon: '⭐',
      title: 'Gana Experiencia (XP)',
      description: 'Por cada compra recibes XP. Sube de nivel y desbloquea recompensas exclusivas.',
      color: ['#FFD700', '#FFA500'],
      features: ['🎮 +5 XP por compra', '📈 Sube 10 niveles', '🎁 Recompensas especiales'],
    },
    {
      icon: '🎫',
      title: 'Cupones por Nivel',
      description: 'Desbloquea cupones únicos conforme subes de nivel. Ahorra en cada pedido.',
      color: ['#FF6B6B', '#FF8E72'],
      features: ['💰 Hasta 30% descuento', '🎯 Ofertas personalizadas', '🔓 Desbloquea en cada nivel'],
    },
    {
      icon: '🌍',
      title: 'Impacto Ambiental',
      description: 'Cada compra reduce CO2. Mira tu contribución al planeta en tu perfil.',
      color: ['#4CAF50', '#81C784'],
      features: ['♻️ Rastrea tu impacto', '🌱 Cada compra ayuda', '📊 Ve tu progreso'],
    },
  ];

  // Animación de entrada/salida
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 90, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 600, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    setCurrentSlide(0);
    onClose();
  };

  const slide = slides[currentSlide];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.modal}>
          {/* Header con color gradiente */}
          <LinearGradient
            colors={slide.color}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.slideIcon}>{slide.icon}</Text>
              <Text style={styles.headerTitle}>{slide.title}</Text>
            </View>

            {/* Slide indicators */}
            <View style={styles.indicators}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentSlide && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView
            style={styles.content}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.description}>{slide.description}</Text>

            {/* Features list */}
            <View style={styles.featuresContainer}>
              {slide.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Call to action message */}
            <View style={styles.callToActionBox}>
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.callToActionText}>
                {currentSlide === 0 && '¡Comienza a ganar XP en tu siguiente compra!'}
                {currentSlide === 1 && '¡Desbloquea cupones conforme subes de nivel!'}
                {currentSlide === 2 && '¡Tu compra ayuda al planeta!'}
              </Text>
            </View>
          </ScrollView>

          {/* Navigation buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[
                styles.navButton,
                currentSlide === 0 && styles.navButtonDisabled,
              ]}
              onPress={handlePrev}
              disabled={currentSlide === 0}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentSlide === 0 ? '#CCC' : COLORS.primary}
              />
            </TouchableOpacity>

            {currentSlide === slides.length - 1 ? (
              <TouchableOpacity
                style={styles.finishButton}
                onPress={handleClose}
              >
                <Text style={styles.finishButtonText}>¡Entendido!</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>Siguiente</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.navButton,
                currentSlide === slides.length - 1 && styles.navButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={currentSlide === slides.length - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentSlide === slides.length - 1 ? '#CCC' : COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...SHADOWS.card,
  },
  header: {
    paddingTop: SPACING.m,
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.m,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.s,
    right: SPACING.s,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: SPACING.m,
  },
  slideIcon: {
    fontSize: 48,
    marginBottom: SPACING.s,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.s,
    marginTop: SPACING.m,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  indicatorActive: {
    backgroundColor: '#FFF',
    width: 24,
  },
  content: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
  },
  description: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.m,
  },
  featuresContainer: {
    marginBottom: SPACING.m,
    gap: SPACING.s,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  callToActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 12,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  callToActionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 18,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: SPACING.s,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.m,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  nextButton: {
    flex: 1,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  finishButton: {
    flex: 1,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default PromotionalOnboardingModal;
