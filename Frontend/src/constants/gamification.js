/**
 * Delicrunch Gamification System
 * Sistema completo de niveles, XP, insignias y recompensas
 */

// ============================================================
// SISTEMA DE NIVELES JERÁRQUICOS
// Bronce III → II → I → Plata III → II → I → Oro → Platino → Diamante
// ============================================================

export const LEVEL_TIERS = {
  BRONZE: { name: 'Bronce', color: '#CD7F32', icon: 'shield', order: 1 },
  SILVER: { name: 'Plata', color: '#C0C0C0', icon: 'shield-half', order: 2 },
  GOLD: { name: 'Oro', color: '#FFD700', icon: 'shield-checkmark', order: 3 },
  PLATINUM: { name: 'Platino', color: '#E5E4E2', icon: 'diamond', order: 4 },
  DIAMOND: { name: 'Diamante', color: '#B9F2FF', icon: 'diamond-outline', order: 5 },
};

// XP requerida para cada nivel (escalado +35% más difícil para dejar espacio a bonuses)
// Los niveles ahora requieren más XP, incentivando promociones, retos y flash deals
export const LEVELS = [
  // Bronce - Niveles iniciales accesibles
  { level: 1, tier: 'BRONZE', rank: 'III', xpRequired: 0, title: 'Bronce III' },
  { level: 2, tier: 'BRONZE', rank: 'II', xpRequired: 135, title: 'Bronce II' },      // +35%
  { level: 3, tier: 'BRONZE', rank: 'I', xpRequired: 340, title: 'Bronce I' },        // +35%
  // Plata - Recompensas interesantes comienzan aquí
  { level: 4, tier: 'SILVER', rank: 'III', xpRequired: 675, title: 'Plata III' },     // +35%
  { level: 5, tier: 'SILVER', rank: 'II', xpRequired: 1150, title: 'Plata II' },      // +35%
  { level: 6, tier: 'SILVER', rank: 'I', xpRequired: 1755, title: 'Plata I' },        // +35%
  // Oro - Cupones premium
  { level: 7, tier: 'GOLD', rank: 'III', xpRequired: 2700, title: 'Oro III' },        // +35%
  { level: 8, tier: 'GOLD', rank: 'II', xpRequired: 4050, title: 'Oro II' },          // +35%
  { level: 9, tier: 'GOLD', rank: 'I', xpRequired: 6075, title: 'Oro I' },            // +35%
  // Platino - Recompensas exclusivas
  { level: 10, tier: 'PLATINUM', rank: 'III', xpRequired: 8775, title: 'Platino III' }, // +35%
  { level: 11, tier: 'PLATINUM', rank: 'II', xpRequired: 12150, title: 'Platino II' }, // +35%
  { level: 12, tier: 'PLATINUM', rank: 'I', xpRequired: 16875, title: 'Platino I' },   // +35%
  // Diamante - Élite con máximos beneficios
  { level: 13, tier: 'DIAMOND', rank: 'III', xpRequired: 23625, title: 'Diamante III' }, // +35%
  { level: 14, tier: 'DIAMOND', rank: 'II', xpRequired: 33750, title: 'Diamante II' },   // +35%
  { level: 15, tier: 'DIAMOND', rank: 'I', xpRequired: 47250, title: 'Diamante I' },     // +35%
];

// ============================================================
// FÓRMULAS DE XP (Ajustadas -35% para compras regulares)
// Los bonuses especiales compensan: Flash Deals, Retos Eco, Promociones
// ============================================================

/**
 * Calcula XP ganada por una compra/rescate REGULAR
 * Reducida 35% para incentivar participación en eventos especiales
 * @param {number} packsSaved - Número de packs rescatados
 * @param {number} savingsAmount - Dinero ahorrado en MXN
 * @param {number} co2Avoided - kg de CO2 evitado
 * @returns {number} XP total ganada
 */
export const calculateXP = (packsSaved = 1, savingsAmount = 0, co2Avoided = 0) => {
  // Fórmula base reducida 35%:
  // - 32 XP base por pack (antes 50)
  // - 0.65 XP por peso ahorrado (antes 1)
  // - 6.5 XP por kg CO2 (antes 10)
  const baseXP = packsSaved * 32;
  const savingsXP = Math.floor(savingsAmount * 0.65);
  const co2XP = Math.floor(co2Avoided * 6.5);
  
  // Combo multiplier reducido
  const comboMultiplier = packsSaved >= 3 ? 1.3 : packsSaved >= 2 ? 1.1 : 1;
  
  return Math.floor((baseXP + savingsXP + co2XP) * comboMultiplier);
};

/**
 * Calcula XP BONUS para eventos especiales (Flash Deals, Promociones, Retos)
 * @param {string} bonusType - Tipo de bonus: 'flash_deal', 'eco_challenge', 'promo', 'first_purchase', 'streak'
 * @param {number} baseXP - XP base de la compra
 * @returns {number} XP bonus adicional
 */
export const calculateBonusXP = (bonusType, baseXP = 0) => {
  const bonusMultipliers = {
    flash_deal: 0.75,       // +75% XP en flash deals (≥50% descuento)
    eco_challenge: 1.0,     // +100% XP en retos ecológicos
    promo: 0.5,             // +50% XP en promociones regulares
    first_purchase: 2.0,    // +200% XP primera compra del día
    streak_7: 0.25,         // +25% XP por racha de 7 días
    streak_30: 0.5,         // +50% XP por racha de 30 días
    weekend_warrior: 0.35,  // +35% XP compras fin de semana
    category_explorer: 0.4, // +40% XP por probar nueva categoría
  };
  
  const multiplier = bonusMultipliers[bonusType] || 0;
  return Math.floor(baseXP * multiplier);
};

/**
 * Obtiene el nivel actual basado en XP total
 */
export const getLevelFromXP = (totalXP) => {
  let currentLevel = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpRequired) {
      currentLevel = LEVELS[i];
      break;
    }
  }
  return currentLevel;
};

/**
 * Obtiene el siguiente nivel
 */
export const getNextLevel = (currentLevel) => {
  const idx = LEVELS.findIndex(l => l.level === currentLevel.level);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
};

/**
 * Calcula progreso hacia el siguiente nivel (0-100%)
 */
export const getLevelProgress = (totalXP, currentLevel) => {
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) return 100; // Ya está en el máximo nivel
  
  const xpInCurrentLevel = totalXP - currentLevel.xpRequired;
  const xpNeededForNext = nextLevel.xpRequired - currentLevel.xpRequired;
  
  return Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNext) * 100));
};

// ============================================================
// SISTEMA DE INSIGNIAS (BADGES)
// ============================================================

export const BADGE_TIERS = {
  COMMON: { name: 'Común', color: '#8E8E93', bgColor: '#F2F2F7' },
  RARE: { name: 'Rara', color: '#007AFF', bgColor: '#E5F1FF' },
  EPIC: { name: 'Épica', color: '#AF52DE', bgColor: '#F5E6FF' },
  LEGENDARY: { name: 'Legendaria', color: '#FFD700', bgColor: '#FFF9E6' },
};

export const BADGES = [
  // ========== A. Por Packs Rescatados ==========
  {
    id: 'first_rescue',
    name: 'Primer Rescate',
    description: 'Salva tu primer pack de comida',
    icon: 'leaf',
    tier: 'COMMON',
    category: 'PACKS',
    requirement: 1,
    checkCondition: (stats) => stats.totalPacksSaved >= 1,
  },
  {
    id: 'novice_guardian',
    name: 'Guardián Novato',
    description: 'Rescata 10 packs de comida',
    icon: 'shield-checkmark',
    tier: 'COMMON',
    category: 'PACKS',
    requirement: 10,
    checkCondition: (stats) => stats.totalPacksSaved >= 10,
  },
  {
    id: 'local_hero',
    name: 'Héroe Local',
    description: 'Rescata 50 packs de comida',
    icon: 'star',
    tier: 'RARE',
    category: 'PACKS',
    requirement: 50,
    checkCondition: (stats) => stats.totalPacksSaved >= 50,
  },
  {
    id: 'food_savior',
    name: 'Salvador de Alimentos',
    description: 'Rescata 100 packs de comida',
    icon: 'trophy',
    tier: 'EPIC',
    category: 'PACKS',
    requirement: 100,
    checkCondition: (stats) => stats.totalPacksSaved >= 100,
  },
  {
    id: 'anti_waste_legend',
    name: 'Leyenda Anti-Desperdicio',
    description: 'Rescata 500 packs de comida',
    icon: 'ribbon',
    tier: 'LEGENDARY',
    category: 'PACKS',
    requirement: 500,
    checkCondition: (stats) => stats.totalPacksSaved >= 500,
  },

  // ========== B. Por Impacto Ambiental (CO2) ==========
  {
    id: 'green_footprint',
    name: 'Pequeña Huella Verde',
    description: 'Evita 10 kg de CO₂',
    icon: 'footsteps',
    tier: 'COMMON',
    category: 'ENVIRONMENT',
    requirement: 10,
    checkCondition: (stats) => stats.totalCO2Saved >= 10,
  },
  {
    id: 'eco_warrior',
    name: 'Eco-Guerrero',
    description: 'Evita 100 kg de CO₂',
    icon: 'earth',
    tier: 'RARE',
    category: 'ENVIRONMENT',
    requirement: 100,
    checkCondition: (stats) => stats.totalCO2Saved >= 100,
  },
  {
    id: 'planet_protector',
    name: 'Protector del Planeta',
    description: 'Evita 500 kg de CO₂',
    icon: 'globe',
    tier: 'EPIC',
    category: 'ENVIRONMENT',
    requirement: 500,
    checkCondition: (stats) => stats.totalCO2Saved >= 500,
  },
  {
    id: 'energy_saver',
    name: 'Salvavidas Energético',
    description: 'Ahorra energía equivalente a 50 kWh',
    icon: 'flash',
    tier: 'RARE',
    category: 'ENVIRONMENT',
    requirement: 50,
    checkCondition: (stats) => stats.totalKWhSaved >= 50,
  },
  {
    id: 'efficiency_master',
    name: 'Maestro de la Eficiencia',
    description: 'Ahorra energía equivalente a 200 kWh',
    icon: 'thunderstorm',
    tier: 'EPIC',
    category: 'ENVIRONMENT',
    requirement: 200,
    checkCondition: (stats) => stats.totalKWhSaved >= 200,
  },

  // ========== C. Por Racha/Consistencia ==========
  {
    id: 'weekly_commitment',
    name: 'Compromiso Semanal',
    description: 'Rescata comida 7 días consecutivos',
    icon: 'calendar',
    tier: 'RARE',
    category: 'STREAK',
    requirement: 7,
    checkCondition: (stats) => stats.currentStreak >= 7,
  },
  {
    id: 'dedicated_month',
    name: 'Mes Dedicado',
    description: 'Mantén una racha de 30 días',
    icon: 'calendar-outline',
    tier: 'EPIC',
    category: 'STREAK',
    requirement: 30,
    checkCondition: (stats) => stats.currentStreak >= 30,
  },
  {
    id: 'guardian_of_year',
    name: 'Guardián del Año',
    description: 'Mantén una racha de 365 días',
    icon: 'medal',
    tier: 'LEGENDARY',
    category: 'STREAK',
    requirement: 365,
    checkCondition: (stats) => stats.currentStreak >= 365,
  },

  // ========== D. Por Nivel ==========
  {
    id: 'silver_achiever',
    name: 'Plata Alcanzada',
    description: 'Alcanza el rango Plata I',
    icon: 'shield-half',
    tier: 'RARE',
    category: 'LEVEL',
    requirement: 6,
    checkCondition: (stats) => stats.currentLevel >= 6,
  },
  {
    id: 'gold_achiever',
    name: 'Oro Conquistado',
    description: 'Alcanza el rango Oro I',
    icon: 'shield-checkmark',
    tier: 'EPIC',
    category: 'LEVEL',
    requirement: 9,
    checkCondition: (stats) => stats.currentLevel >= 9,
  },
  {
    id: 'platinum_elite',
    name: 'Élite de Platino',
    description: 'Alcanza el rango Platino I',
    icon: 'diamond',
    tier: 'EPIC',
    category: 'LEVEL',
    requirement: 12,
    checkCondition: (stats) => stats.currentLevel >= 12,
  },
  {
    id: 'diamond_legend',
    name: 'Leyenda Diamante',
    description: 'Alcanza el rango Diamante I',
    icon: 'diamond-outline',
    tier: 'LEGENDARY',
    category: 'LEVEL',
    requirement: 15,
    checkCondition: (stats) => stats.currentLevel >= 15,
  },

  // ========== E. Por Ahorro ==========
  {
    id: 'penny_pincher',
    name: 'Ahorrador Inicial',
    description: 'Ahorra $100 MXN en total',
    icon: 'wallet',
    tier: 'COMMON',
    category: 'SAVINGS',
    requirement: 100,
    checkCondition: (stats) => stats.totalSavings >= 100,
  },
  {
    id: 'smart_shopper',
    name: 'Comprador Inteligente',
    description: 'Ahorra $500 MXN en total',
    icon: 'cash',
    tier: 'RARE',
    category: 'SAVINGS',
    requirement: 500,
    checkCondition: (stats) => stats.totalSavings >= 500,
  },
  {
    id: 'savings_champion',
    name: 'Campeón del Ahorro',
    description: 'Ahorra $2,000 MXN en total',
    icon: 'card',
    tier: 'EPIC',
    category: 'SAVINGS',
    requirement: 2000,
    checkCondition: (stats) => stats.totalSavings >= 2000,
  },
  {
    id: 'financial_wizard',
    name: 'Mago Financiero',
    description: 'Ahorra $10,000 MXN en total',
    icon: 'sparkles',
    tier: 'LEGENDARY',
    category: 'SAVINGS',
    requirement: 10000,
    checkCondition: (stats) => stats.totalSavings >= 10000,
  },

  // ========== F. Especiales ==========
  {
    id: 'early_adopter',
    name: 'Pionero',
    description: 'Únete a Delicrunch en su primer año',
    icon: 'rocket',
    tier: 'RARE',
    category: 'SPECIAL',
    requirement: null,
    checkCondition: (stats) => stats.isEarlyAdopter,
  },
  {
    id: 'social_butterfly',
    name: 'Mariposa Social',
    description: 'Comparte tu impacto 5 veces',
    icon: 'share-social',
    tier: 'COMMON',
    category: 'SPECIAL',
    requirement: 5,
    checkCondition: (stats) => stats.totalShares >= 5,
  },
  {
    id: 'reviewer',
    name: 'Crítico Experto',
    description: 'Deja 10 reseñas de productos',
    icon: 'chatbubbles',
    tier: 'RARE',
    category: 'SPECIAL',
    requirement: 10,
    checkCondition: (stats) => stats.totalReviews >= 10,
  },
];

// ============================================================
// CATEGORÍAS DE INSIGNIAS
// ============================================================

export const BADGE_CATEGORIES = {
  PACKS: { name: 'Packs Rescatados', icon: 'fast-food', color: '#FF6B35' },
  ENVIRONMENT: { name: 'Impacto Ambiental', icon: 'leaf', color: '#34C759' },
  STREAK: { name: 'Constancia', icon: 'flame', color: '#FF9500' },
  LEVEL: { name: 'Niveles', icon: 'trophy', color: '#AF52DE' },
  SAVINGS: { name: 'Ahorro', icon: 'wallet', color: '#007AFF' },
  SPECIAL: { name: 'Especiales', icon: 'star', color: '#FFD700' },
};

// ============================================================
// LEADERBOARD / RANKING
// ============================================================

// Apodos divertidos para el leaderboard
export const NICKNAMES = [
  'Salvador Verde', 'Guardián Eco', 'Héroe del Sabor', 'Cazador de Ofertas',
  'Protector Foodie', 'Maestro Rescate', 'Leyenda Urbana', 'Campeón Local',
  'Ninja del Ahorro', 'Guerrero Sostenible', 'Defensor Gourmet', 'Pionero Verde',
  'Cruzado Ambiental', 'Aventurero Culinario', 'Explorador Delicioso',
];

/**
 * Genera un apodo aleatorio para un usuario
 */
export const generateNickname = (userId) => {
  const index = userId % NICKNAMES.length;
  return NICKNAMES[index];
};

// ============================================================
// RECOMPENSAS POR NIVEL - Sistema de Cupones
// Cupones variados por categoría: Vegetariano, Mexicano, Repostería, etc.
// ============================================================

export const COUPON_CATEGORIES = {
  ALL: { name: 'Cualquier categoría', icon: 'grid', color: '#007AFF' },
  MEXICANO: { name: 'Mexicano', icon: 'flame', color: '#FF6B35' },
  VEGETARIANO: { name: 'Vegetariano', icon: 'leaf', color: '#34C759' },
  REPOSTERIA: { name: 'Repostería', icon: 'ice-cream', color: '#FF9500' },
  CAFE: { name: 'Café', icon: 'cafe', color: '#8B4513' },
  PANADERIA: { name: 'Panadería', icon: 'bread-slice', color: '#D2691E' },
  SUSHI: { name: 'Sushi', icon: 'fish', color: '#E91E63' },
  PIZZA: { name: 'Pizza', icon: 'pizza', color: '#FF5722' },
  SALUDABLE: { name: 'Saludable', icon: 'nutrition', color: '#4CAF50' },
};

export const COUPON_TYPES = {
  PERCENTAGE: 'percentage',   // Descuento porcentual
  FIXED: 'fixed',             // Descuento fijo en pesos
  TWO_FOR_ONE: '2x1',         // 2x1
  FREE_ITEM: 'free_item',     // Producto gratis
};

// Recompensas desbloqueables por nivel
export const LEVEL_REWARDS = [
  // Nivel 2 - Bronce II (primer logro)
  {
    level: 2,
    coupon: {
      id: 'welcome_5',
      name: '¡Bienvenido Rescatador!',
      description: '5% de descuento en tu próxima compra',
      type: COUPON_TYPES.PERCENTAGE,
      value: 5,
      category: 'ALL',
      minPurchase: 0,
      maxDiscount: 50,
      validDays: 30,
      icon: 'gift',
      color: '#34C759',
    }
  },
  // Nivel 3 - Bronce I
  {
    level: 3,
    coupon: {
      id: 'bronze_veggie',
      name: 'Veggie Explorer',
      description: '10% descuento en categoría Vegetariano',
      type: COUPON_TYPES.PERCENTAGE,
      value: 10,
      category: 'VEGETARIANO',
      minPurchase: 50,
      maxDiscount: 30,
      validDays: 21,
      icon: 'leaf',
      color: '#34C759',
    }
  },
  // Nivel 4 - Plata III
  {
    level: 4,
    coupon: {
      id: 'silver_mex',
      name: 'Sabor Mexicano',
      description: '$15 de descuento en comida Mexicana',
      type: COUPON_TYPES.FIXED,
      value: 15,
      category: 'MEXICANO',
      minPurchase: 60,
      maxDiscount: 15,
      validDays: 21,
      icon: 'flame',
      color: '#FF6B35',
    }
  },
  // Nivel 5 - Plata II
  {
    level: 5,
    coupon: {
      id: 'silver_cafe',
      name: 'Coffee Lover',
      description: '2x1 en packs de Café',
      type: COUPON_TYPES.TWO_FOR_ONE,
      value: 100,
      category: 'CAFE',
      minPurchase: 0,
      maxDiscount: 80,
      validDays: 14,
      icon: 'cafe',
      color: '#8B4513',
    }
  },
  // Nivel 6 - Plata I
  {
    level: 6,
    coupon: {
      id: 'silver_sweet',
      name: 'Dulce Recompensa',
      description: '15% descuento en Repostería',
      type: COUPON_TYPES.PERCENTAGE,
      value: 15,
      category: 'REPOSTERIA',
      minPurchase: 40,
      maxDiscount: 50,
      validDays: 21,
      icon: 'ice-cream',
      color: '#FF9500',
    }
  },
  // Nivel 7 - Oro III
  {
    level: 7,
    coupon: {
      id: 'gold_all',
      name: 'Oro Universal',
      description: '12% de descuento en cualquier pack',
      type: COUPON_TYPES.PERCENTAGE,
      value: 12,
      category: 'ALL',
      minPurchase: 50,
      maxDiscount: 60,
      validDays: 30,
      icon: 'star',
      color: '#FFD700',
    }
  },
  // Nivel 8 - Oro II
  {
    level: 8,
    coupon: {
      id: 'gold_sushi',
      name: 'Sushi Master',
      description: '2x1 en packs de Sushi',
      type: COUPON_TYPES.TWO_FOR_ONE,
      value: 100,
      category: 'SUSHI',
      minPurchase: 80,
      maxDiscount: 120,
      validDays: 14,
      icon: 'fish',
      color: '#E91E63',
    }
  },
  // Nivel 9 - Oro I
  {
    level: 9,
    coupon: {
      id: 'gold_healthy',
      name: 'Vida Saludable',
      description: '$25 de descuento + pack Saludable gratis',
      type: COUPON_TYPES.FIXED,
      value: 25,
      category: 'SALUDABLE',
      minPurchase: 100,
      maxDiscount: 25,
      validDays: 21,
      icon: 'nutrition',
      color: '#4CAF50',
      bonus: 'free_item',
    }
  },
  // Nivel 10 - Platino III
  {
    level: 10,
    coupon: {
      id: 'platinum_pizza',
      name: 'Pizza Premium',
      description: '20% descuento en Pizza',
      type: COUPON_TYPES.PERCENTAGE,
      value: 20,
      category: 'PIZZA',
      minPurchase: 60,
      maxDiscount: 80,
      validDays: 30,
      icon: 'pizza',
      color: '#FF5722',
    }
  },
  // Nivel 11 - Platino II
  {
    level: 11,
    coupon: {
      id: 'platinum_bread',
      name: 'Pan Artesanal',
      description: '2x1 en Panadería + $10 extra',
      type: COUPON_TYPES.TWO_FOR_ONE,
      value: 100,
      category: 'PANADERIA',
      minPurchase: 50,
      maxDiscount: 100,
      validDays: 21,
      icon: 'bread-slice',
      color: '#D2691E',
      extraDiscount: 10,
    }
  },
  // Nivel 12 - Platino I
  {
    level: 12,
    coupon: {
      id: 'platinum_elite',
      name: 'Élite Platino',
      description: '18% descuento universal + prioridad',
      type: COUPON_TYPES.PERCENTAGE,
      value: 18,
      category: 'ALL',
      minPurchase: 80,
      maxDiscount: 100,
      validDays: 45,
      icon: 'diamond',
      color: '#E5E4E2',
      priority: true,
    }
  },
  // Nivel 13 - Diamante III
  {
    level: 13,
    coupon: {
      id: 'diamond_mex_2x1',
      name: 'Diamante Mexicano',
      description: '2x1 en Mexicano + 10% adicional',
      type: COUPON_TYPES.TWO_FOR_ONE,
      value: 100,
      category: 'MEXICANO',
      minPurchase: 70,
      maxDiscount: 150,
      validDays: 30,
      icon: 'flame',
      color: '#B9F2FF',
      extraDiscount: 10,
    }
  },
  // Nivel 14 - Diamante II
  {
    level: 14,
    coupon: {
      id: 'diamond_super',
      name: 'Super Diamante',
      description: '25% descuento universal',
      type: COUPON_TYPES.PERCENTAGE,
      value: 25,
      category: 'ALL',
      minPurchase: 100,
      maxDiscount: 150,
      validDays: 60,
      icon: 'sparkles',
      color: '#B9F2FF',
    }
  },
  // Nivel 15 - Diamante I (Máximo)
  {
    level: 15,
    coupon: {
      id: 'diamond_legend',
      name: 'Leyenda Diamante',
      description: '30% descuento + pack gratis mensual',
      type: COUPON_TYPES.PERCENTAGE,
      value: 30,
      category: 'ALL',
      minPurchase: 0,
      maxDiscount: 200,
      validDays: 90,
      icon: 'trophy',
      color: '#FFD700',
      freeMonthlyPack: true,
      priority: true,
    }
  },
];

/**
 * Obtiene la recompensa para un nivel específico
 */
export const getRewardForLevel = (level) => {
  return LEVEL_REWARDS.find(r => r.level === level);
};

/**
 * Obtiene todas las recompensas hasta un nivel
 */
export const getRewardsUpToLevel = (level) => {
  return LEVEL_REWARDS.filter(r => r.level <= level);
};

/**
 * Calcula el descuento aplicable de un cupón
 */
export const calculateCouponDiscount = (coupon, subtotal, productCategory) => {
  if (!coupon) return 0;
  
  // Verificar categoría
  if (coupon.category !== 'ALL' && coupon.category !== productCategory) {
    return 0;
  }
  
  // Verificar compra mínima
  if (subtotal < coupon.minPurchase) {
    return 0;
  }
  
  let discount = 0;
  
  switch (coupon.type) {
    case COUPON_TYPES.PERCENTAGE:
      discount = (subtotal * coupon.value) / 100;
      break;
    case COUPON_TYPES.FIXED:
      discount = coupon.value;
      break;
    case COUPON_TYPES.TWO_FOR_ONE:
      // El descuento es el precio del segundo item (50% del total)
      discount = subtotal * 0.5;
      break;
    default:
      discount = 0;
  }
  
  // Aplicar extra si existe
  if (coupon.extraDiscount) {
    discount += coupon.extraDiscount;
  }
  
  // Aplicar límite máximo
  return Math.min(discount, coupon.maxDiscount);
};

// ============================================================
// UTILIDADES
// ============================================================

/**
 * Calcula kWh ahorrados basado en CO2
 * (Aproximación: 1 kWh ≈ 0.5 kg CO2 en México)
 */
export const calculateKWhFromCO2 = (co2Kg) => co2Kg * 2;

/**
 * Obtiene el color del tier de nivel
 */
export const getTierColor = (tier) => LEVEL_TIERS[tier]?.color || '#8E8E93';

/**
 * Obtiene el color del tier de insignia
 */
export const getBadgeTierColor = (tier) => BADGE_TIERS[tier]?.color || '#8E8E93';

/**
 * Verifica y retorna nuevas insignias desbloqueadas
 */
export const checkNewBadges = (stats, unlockedBadgeIds = []) => {
  const newBadges = [];
  
  for (const badge of BADGES) {
    if (unlockedBadgeIds.includes(badge.id)) continue;
    if (badge.checkCondition(stats)) {
      newBadges.push({
        ...badge,
        unlockedAt: new Date().toISOString(),
      });
    }
  }
  
  return newBadges;
};

/**
 * Calcula el progreso hacia una insignia específica
 */
export const getBadgeProgress = (badge, stats) => {
  if (!badge.requirement) return badge.checkCondition(stats) ? 100 : 0;
  
  let currentValue = 0;
  switch (badge.category) {
    case 'PACKS':
      currentValue = stats.totalPacksSaved || 0;
      break;
    case 'ENVIRONMENT':
      if (badge.id.includes('energy') || badge.id.includes('efficiency')) {
        currentValue = stats.totalKWhSaved || 0;
      } else {
        currentValue = stats.totalCO2Saved || 0;
      }
      break;
    case 'STREAK':
      currentValue = stats.currentStreak || 0;
      break;
    case 'LEVEL':
      currentValue = stats.currentLevel || 1;
      break;
    case 'SAVINGS':
      currentValue = stats.totalSavings || 0;
      break;
    case 'SPECIAL':
      if (badge.id === 'social_butterfly') currentValue = stats.totalShares || 0;
      if (badge.id === 'reviewer') currentValue = stats.totalReviews || 0;
      break;
    default:
      break;
  }
  
  return Math.min(100, Math.floor((currentValue / badge.requirement) * 100));
};
