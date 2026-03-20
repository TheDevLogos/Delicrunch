/**
 * Delicrunch Design System - Too Good To Go Inspired
 * Sistema de diseño unificado para toda la aplicación
 * Basado en https://www.alyssalong.design/project/too-good-to-go
 */

// ============================================================
// COLORES - Paleta TGTG
// ============================================================
export const COLORS = {
  // Primary - Verde TGTG (el color principal de la marca)
  primary: '#036B52',        // Verde oscuro principal
  primaryLight: '#048A67',   // Verde medio para hovers
  primaryDark: '#024D3B',    // Verde muy oscuro
  primarySoft: '#E8F5F1',    // Verde muy suave para fondos
  
  // Secondary - Verde brillante
  secondary: '#00A86B',      // Verde brillante para acentos
  secondaryLight: '#4CD4A8', // Verde claro
  
  // Accent - Colores para CTAs y ofertas
  accent: '#FF6B35',         // Naranja vibrante para CTAs
  accentLight: '#FF8C5A',    // Naranja claro
  accentDark: '#E55A28',     // Naranja oscuro
  
  // Background
  background: '#F7F7F7',     // Gris muy claro (TGTG usa este)
  surface: '#FFFFFF',        // Blanco puro para cards
  surfaceLight: '#FAFAFA',   // Casi blanco
  surfaceSecondary: '#F2F2F7', // Gris claro para secciones
  
  // Text - Escala de grises
  text: '#1A1A1A',           // Negro suave principal
  textSecondary: '#666666',  // Gris oscuro para texto secundario
  textTertiary: '#8E8E93',   // Gris claro para placeholders
  textLight: '#8E8E93',      // Alias para compatibilidad
  textWhite: '#FFFFFF',      // Blanco
  textMuted: '#AEAEB2',      // Gris muy claro
  
  // Status Colors
  success: '#34C759',        // Verde éxito (iOS style)
  successLight: '#E3F9E8',   // Fondo verde claro
  warning: '#FF9500',        // Naranja advertencia
  warningLight: '#FFF4E6',   // Fondo naranja claro
  error: '#FF3B30',          // Rojo error
  errorLight: '#FFEBEA',     // Fondo rojo claro
  info: '#007AFF',           // Azul info
  infoLight: '#E5F1FF',      // Fondo azul claro
  
  // Borders
  border: '#E5E5EA',         // Gris borde principal
  borderLight: '#F2F2F7',    // Gris borde claro
  borderDark: '#C7C7CC',     // Gris borde oscuro
  
  // Overlays
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  overlayDark: 'rgba(0,0,0,0.7)',
  
  // Special
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Cards
  cardBackground: '#FFFFFF',
  cardShadow: '#000000',
  shadowColor: '#000000',
  
  // Discount badge
  discount: '#FF3B30',
  discountBg: '#FF3B30',
  
  // Star rating
  star: '#FFB800',
  starEmpty: '#E5E5EA',
};

// ============================================================
// TIPOGRAFÍA - Sistema TGTG
// ============================================================
export const TYPOGRAPHY = {
  // Font families (System fonts para mejor rendimiento)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font sizes - Escala tipográfica TGTG
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    hero: 32,
    display: 40,
    button: 14,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
  
  // Text transform (for compatibility)
  textTransform: {
    uppercase: 'uppercase',
    lowercase: 'lowercase',
    capitalize: 'capitalize',
    none: 'none',
  },
};

// ============================================================
// ESPACIADO - Sistema 4pt
// ============================================================
export const SPACING = {
  xs: 4,
  sm: 8,
  smd: 12,
  md: 16,
  mld: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  screenPadding: 16,
};

// ============================================================
// LAYOUT - Dimensiones y espaciado especial TGTG
// ============================================================
export const LAYOUT = {
  // Safe areas y márgenes de pantalla
  screenPaddingHorizontal: 16,  // Padding lateral estándar (igual que SPACING.md)
  screenPaddingVertical: 12,    // Padding vertical estándar
  
  // Componentes específicos
  bottomTabHeight: 100,          // Altura de la barra de navegación inferior
  searchBarHeight: 44,           // Altura estándar de barra de búsqueda (iOS style)
  headerHeight: 56,              // Altura estándar de headers
  
  // Cards y contenedores
  cardPadding: 16,               // Padding interno de cards (SPACING.md)
  cardPaddingSmall: 12,          // Padding para cards pequeños (SPACING.smd)
  cardMargin: 16,                // Margen entre cards
  cardBorderRadius: 16,          // Border radius de cards (BORDERS.radius.lg)
  
  // Listas y scroll
  listPaddingBottom: 100,        // Padding inferior para listas con bottom tab
  listItemSpacing: 8,            // Espaciado entre items de lista (SPACING.sm)
  
  // Modales
  modalPadding: 20,              // Padding interno de modales (SPACING.mld)
  modalMaxHeight: 0.8,           // 80% de la altura de pantalla
  
  // Inputs
  inputHeight: 48,               // Altura de inputs estándar
  inputPadding: 16,              // Padding interno de inputs
  
  // Touch targets (accesibilidad)
  minTouchTarget: 44,            // Tamaño mínimo recomendado para botones (iOS guideline)
  iconButtonSize: 40,            // Tamaño de botones circulares de iconos
  
  // Secciones
  sectionSpacing: 24,            // Espacio entre secciones (SPACING.lg)
  sectionPaddingHorizontal: 16,  // Padding lateral de secciones
  
  // Badges y chips
  badgePaddingHorizontal: 8,     // Padding horizontal de badges (SPACING.sm)
  badgePaddingVertical: 4,       // Padding vertical de badges (SPACING.xs)
  chipPaddingHorizontal: 16,     // Padding horizontal de chips
  chipPaddingVertical: 8,        // Padding vertical de chips
};

// ============================================================
// BORDES - Radios y anchos
// ============================================================
export const BORDERS = {
  width: 2,
  widths: {
    thin: 1,
    normal: 2,
    thick: 3,
  },
  radius: {
    none: 0,
    xs: 4,
    sm: 4,
    small: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
};

// ============================================================
// SOMBRAS - Sistema de elevación
// ============================================================
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  hard: {
    color: COLORS.text,
    offset: 3,
    opacity: 1,
    radius: 0,
  },
};

// ============================================================
// TAMAÑOS DE COMPONENTES
// ============================================================
export const SIZES = {
  button: {
    height: { sm: 36, md: 44, lg: 52, xl: 56 },
    padding: { sm: 12, md: 16, lg: 20 },
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  icon: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32, xxl: 48 },
  avatar: { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 },
  card: { borderRadius: 16, padding: 16 },
  tabBar: { height: 80, iconSize: 24 },
  header: { height: 56 },
};

// ============================================================
// ANIMACIONES
// ============================================================
export const ANIMATIONS = {
  duration: { fast: 150, normal: 300, slow: 500 },
  easing: { ease: 'ease', easeIn: 'ease-in', easeOut: 'ease-out', easeInOut: 'ease-in-out' },
};

// ============================================================
// ESTILOS COMUNES REUTILIZABLES
// ============================================================
export const COMMON_STYLES = {
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  cardCompact: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDERS.radius.md,
    padding: SPACING.sm,
    ...SHADOWS.sm,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  discountBadge: {
    backgroundColor: COLORS.discount,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDERS.radius.sm,
  },
  stockBadge: {
    backgroundColor: COLORS.overlayDark,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDERS.radius.sm,
  },
  input: {
    height: SIZES.input.height,
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.input.paddingHorizontal,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  priceOriginal: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textTertiary,
    textDecorationLine: 'line-through',
  },
  priceDiscount: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
};

// ============================================================
// TGTG SPECIFIC STYLES
// ============================================================
export const TGTG_STYLES = {
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radius.md,
    height: SIZES.button.height.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radius.md,
    height: SIZES.button.height.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radius.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  greenBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDERS.radius.full,
  },
  pickupTimeBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDERS.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  LAYOUT,
  BORDERS,
  SHADOWS,
  SIZES,
  ANIMATIONS,
  COMMON_STYLES,
  TGTG_STYLES,
};
