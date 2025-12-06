// Neon Crunch - Neobrutalism Pop Design Tokens

export const COLORS = {
  // Background
  background: '#F7F5E6', // Crema Hueso

  // Primary (Action)
  primary: '#FF5400', // Naranja Lava

  // Text and Borders
  text: '#1A1A1A', // Negro Tinta
  border: '#1A1A1A', // Negro Tinta

  // Secondary
  secondary: '#7000FF', // Violeta Ácido

  // Accent
  accent: '#CCFF00', // Verde Lima

  // Additional
  white: '#FFFFFF',
  black: '#000000',
};

export const TYPOGRAPHY = {
  fontFamily: 'Inter-Bold', // Assuming Inter-Bold or system equivalent
  fontSize: {
    title: 48,
    subtitle: 24,
    body: 16,
    button: 18,
  },
  fontWeight: {
    bold: 'bold',
    normal: 'normal',
  },
  textTransform: {
    uppercase: 'uppercase',
    none: 'none',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDERS = {
  width: 3,
  radius: {
    none: 0,
    small: 8,
    full: 50, // For avatars/circular elements
  },
};

export const SHADOWS = {
  hard: {
    offset: 4,
    color: COLORS.border,
    opacity: 1,
    radius: 0,
    elevation: 8, // For Android shadows
  },
};
