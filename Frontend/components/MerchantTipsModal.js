/**
 * MerchantTipsModal - Modal con tips aleatorios para comercios
 * Se muestra cada vez que el comercio entra a la app
 */
import React, { useState, useEffect, useRef } from 'react';
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
import { COLORS, SPACING, SHADOWS } from '../src/constants/theme';

const { width, height } = Dimensions.get('window');

// 20+ tips para comercios - se muestran 10 aleatorios cada vez
const ALL_TIPS = [
  {
    id: 1,
    icon: 'camera',
    iconType: 'ionicons',
    title: 'Fotos de Alta Calidad',
    text: 'Los packs con fotos atractivas reciben hasta 3x más pedidos. Usa luz natural y muestra el contenido real.',
    category: 'fotos',
  },
  {
    id: 2,
    icon: 'pricetag',
    iconType: 'ionicons',
    title: 'Precio Irresistible',
    text: 'Ofrece al menos 40% de descuento. Los usuarios buscan ofertas increíbles y compararán precios.',
    category: 'precio',
  },
  {
    id: 3,
    icon: 'time',
    iconType: 'ionicons',
    title: 'Horario Estratégico',
    text: 'Publica tus packs entre 10-11 AM. Es cuando más usuarios están buscando opciones para comer.',
    category: 'horario',
  },
  {
    id: 4,
    icon: 'restaurant',
    iconType: 'ionicons',
    title: 'Variedad en el Pack',
    text: 'Incluye variedad en tu pack sorpresa. Los usuarios aman descubrir diferentes productos.',
    category: 'producto',
  },
  {
    id: 5,
    icon: 'star',
    iconType: 'ionicons',
    title: 'Responde Rápido',
    text: 'Confirma los pedidos en menos de 5 minutos. Los comercios rápidos tienen mejor calificación.',
    category: 'servicio',
  },
  {
    id: 6,
    icon: 'chatbubbles',
    iconType: 'ionicons',
    title: 'Pide Reseñas',
    text: 'Invita a tus clientes a dejar reseñas. Un simple "¿Qué te pareció?" puede triplicar tus reviews.',
    category: 'reseñas',
  },
  {
    id: 7,
    icon: 'trending-up',
    iconType: 'ionicons',
    title: 'Stock Consistente',
    text: 'Mantén packs disponibles todos los días. Los usuarios frecuentes buscan sus tiendas favoritas.',
    category: 'inventario',
  },
  {
    id: 8,
    icon: 'gift',
    iconType: 'ionicons',
    title: 'Sorprende al Cliente',
    text: 'Incluye un pequeño extra en el pack de vez en cuando. Las sorpresas generan clientes leales.',
    category: 'servicio',
  },
  {
    id: 9,
    icon: 'megaphone',
    iconType: 'ionicons',
    title: 'Promociona en Redes',
    text: 'Comparte tus packs en Instagram/Facebook. Etiqueta @Delicrunch para mayor alcance.',
    category: 'marketing',
  },
  {
    id: 10,
    icon: 'calendar',
    iconType: 'ionicons',
    title: 'Aprovecha Fechas Especiales',
    text: 'En fines de semana y festivos hay más demanda. Prepara más stock y packs especiales.',
    category: 'estrategia',
  },
  {
    id: 11,
    icon: 'fast-food',
    iconType: 'ionicons',
    title: 'Descripción Detallada',
    text: 'Describe claramente qué puede contener tu pack. La transparencia genera confianza.',
    category: 'producto',
  },
  {
    id: 12,
    icon: 'location',
    iconType: 'ionicons',
    title: 'Dirección Clara',
    text: 'Actualiza tu dirección y puntos de referencia. Facilita que los clientes te encuentren.',
    category: 'ubicación',
  },
  {
    id: 13,
    icon: 'notifications',
    iconType: 'ionicons',
    title: 'Activa Notificaciones',
    text: 'No pierdas pedidos. Activa las notificaciones para enterarte al instante de nuevas órdenes.',
    category: 'operación',
  },
  {
    id: 14,
    icon: 'thumbs-up',
    iconType: 'ionicons',
    title: 'Calidad Constante',
    text: 'Mantén la misma calidad siempre. Un cliente satisfecho vuelve y recomienda.',
    category: 'calidad',
  },
  {
    id: 15,
    icon: 'cube',
    iconType: 'ionicons',
    title: 'Empaque Atractivo',
    text: 'Usa empaques que mantengan la comida fresca y se vean profesionales.',
    category: 'presentación',
  },
  {
    id: 16,
    icon: 'people',
    iconType: 'ionicons',
    title: 'Conoce a tus Clientes',
    text: 'Saluda por nombre a clientes frecuentes. La conexión personal genera lealtad.',
    category: 'servicio',
  },
  {
    id: 17,
    icon: 'analytics',
    iconType: 'ionicons',
    title: 'Revisa tus Métricas',
    text: 'Analiza qué productos se venden más y ajusta tu oferta según la demanda.',
    category: 'análisis',
  },
  {
    id: 18,
    icon: 'refresh',
    iconType: 'ionicons',
    title: 'Renueva tu Menú',
    text: 'Introduce nuevos packs periódicamente. La novedad atrae clientes curiosos.',
    category: 'producto',
  },
  {
    id: 19,
    icon: 'leaf',
    iconType: 'ionicons',
    title: 'Destaca lo Sostenible',
    text: 'Menciona cuánto CO₂ se ahorra. Los usuarios valoran el impacto ambiental positivo.',
    category: 'sustentabilidad',
  },
  {
    id: 20,
    icon: 'happy',
    iconType: 'ionicons',
    title: 'Actitud Positiva',
    text: 'Una sonrisa al entregar hace la diferencia. La experiencia completa importa.',
    category: 'servicio',
  },
];

const MerchantTipsModal = ({ visible, onClose }) => {
  const [tips, setTips] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Seleccionar 10 tips aleatorios
      const shuffled = [...ALL_TIPS].sort(() => Math.random() - 0.5);
      setTips(shuffled.slice(0, 3));
      setCurrentIndex(0);
      
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNext = () => {
    if (currentIndex < tips.length - 1) {
      // Animación de salida y entrada
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      
      setCurrentIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!visible || tips.length === 0) return null;

  const currentTip = tips[currentIndex];
  const isLast = currentIndex === tips.length - 1;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header con contador */}
          <View style={styles.header}>
            <View style={styles.tipCounter}>
              <Text style={styles.tipCounterText}>
                💡 Tip {currentIndex + 1} de {tips.length}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Contenido del Tip */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name={currentTip.icon} size={40} color={COLORS.primary} />
            </View>
            
            <Text style={styles.title}>{currentTip.title}</Text>
            <Text style={styles.text}>{currentTip.text}</Text>
            
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{currentTip.category}</Text>
            </View>
          </View>

          {/* Progress dots */}
          <View style={styles.dotsContainer}>
            {tips.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.dotActive,
                  index < currentIndex && styles.dotCompleted,
                ]}
              />
            ))}
          </View>

          {/* Botones */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.skipButton} onPress={handleClose}>
              <Text style={styles.skipText}>Saltar todos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextText}>
                {isLast ? '¡Empezar!' : 'Siguiente'}
              </Text>
              <Ionicons 
                name={isLast ? 'rocket' : 'arrow-forward'} 
                size={18} 
                color={COLORS.white} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  container: {
    width: width - SPACING.md * 2,
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tipCounter: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tipCounterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  text: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  categoryBadge: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  dotCompleted: {
    backgroundColor: COLORS.primary + '60',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  nextText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default MerchantTipsModal;
