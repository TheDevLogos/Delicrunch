/**
 * Sistema de Recompensas para Comercios
 * Niveles, beneficios y premios para negocios en Delicrunch
 */

// ============================================================
// NIVELES PARA COMERCIOS
// Basado en: ventas, pedidos completados, calificación y antigüedad
// ============================================================

export const MERCHANT_LEVEL_TIERS = {
  STARTER: { name: 'Iniciante', color: '#8E8E93', icon: 'storefront-outline', order: 1 },
  BRONZE: { name: 'Bronce', color: '#CD7F32', icon: 'storefront', order: 2 },
  SILVER: { name: 'Plata', color: '#C0C0C0', icon: 'medal-outline', order: 3 },
  GOLD: { name: 'Oro', color: '#FFD700', icon: 'medal', order: 4 },
  PLATINUM: { name: 'Platino', color: '#E5E4E2', icon: 'trophy-outline', order: 5 },
  DIAMOND: { name: 'Diamante', color: '#B9F2FF', icon: 'diamond', order: 6 },
};

export const MERCHANT_LEVELS = [
  // Iniciante
  { level: 1, tier: 'STARTER', xpRequired: 0, title: 'Iniciante', 
    description: 'Bienvenido a Delicrunch. ¡Empieza a vender y ganar puntos!' },
  
  // Bronce
  { level: 2, tier: 'BRONZE', xpRequired: 500, title: 'Bronce III',
    description: '¡Vas por buen camino! Sigue vendiendo.' },
  { level: 3, tier: 'BRONZE', xpRequired: 1500, title: 'Bronce II',
    description: 'Tus clientes te están conociendo.' },
  { level: 4, tier: 'BRONZE', xpRequired: 3000, title: 'Bronce I',
    description: '¡Casi llegas a Plata!' },
  
  // Plata
  { level: 5, tier: 'SILVER', xpRequired: 5000, title: 'Plata III',
    description: 'Ya eres un comercio reconocido.' },
  { level: 6, tier: 'SILVER', xpRequired: 8000, title: 'Plata II',
    description: 'Tus ventas van en aumento.' },
  { level: 7, tier: 'SILVER', xpRequired: 12000, title: 'Plata I',
    description: '¡El Oro está cerca!' },
  
  // Oro
  { level: 8, tier: 'GOLD', xpRequired: 18000, title: 'Oro III',
    description: '¡Felicidades! Eres un comercio Oro.' },
  { level: 9, tier: 'GOLD', xpRequired: 25000, title: 'Oro II',
    description: 'Tu negocio brilla en Delicrunch.' },
  { level: 10, tier: 'GOLD', xpRequired: 35000, title: 'Oro I',
    description: '¡Siguiente parada: Platino!' },
  
  // Platino
  { level: 11, tier: 'PLATINUM', xpRequired: 50000, title: 'Platino III',
    description: 'Eres parte de la élite de comercios.' },
  { level: 12, tier: 'PLATINUM', xpRequired: 70000, title: 'Platino II',
    description: 'Tu reputación te precede.' },
  { level: 13, tier: 'PLATINUM', xpRequired: 100000, title: 'Platino I',
    description: '¡El Diamante está a tu alcance!' },
  
  // Diamante
  { level: 14, tier: 'DIAMOND', xpRequired: 150000, title: 'Diamante III',
    description: '¡Increíble! Eres Diamante.' },
  { level: 15, tier: 'DIAMOND', xpRequired: 200000, title: 'Diamante II',
    description: 'Uno de los mejores comercios.' },
  { level: 16, tier: 'DIAMOND', xpRequired: 300000, title: 'Diamante I',
    description: '¡Leyenda de Delicrunch!' },
];

// ============================================================
// FÓRMULAS DE XP PARA COMERCIOS
// ============================================================

/**
 * Calcula XP ganada por una venta completada
 * @param {number} orderTotal - Total de la venta en MXN
 * @param {number} rating - Calificación recibida (1-5)
 * @param {boolean} isRepeatCustomer - Si es cliente recurrente
 */
export const calculateMerchantXP = (orderTotal = 0, rating = 0, isRepeatCustomer = false) => {
  // Fórmula base:
  // - 10 XP por cada $100 de venta
  // - 50 XP bonus por rating 5 estrellas
  // - 20 XP bonus por cliente recurrente
  
  const baseXP = Math.floor(orderTotal / 10);
  const ratingBonus = rating === 5 ? 50 : rating >= 4 ? 25 : 0;
  const repeatBonus = isRepeatCustomer ? 20 : 0;
  
  return baseXP + ratingBonus + repeatBonus;
};

/**
 * Obtiene el nivel actual basado en XP total
 */
export const getMerchantLevelFromXP = (totalXP) => {
  let currentLevel = MERCHANT_LEVELS[0];
  for (let i = MERCHANT_LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= MERCHANT_LEVELS[i].xpRequired) {
      currentLevel = MERCHANT_LEVELS[i];
      break;
    }
  }
  return currentLevel;
};

/**
 * Obtiene el siguiente nivel
 */
export const getNextMerchantLevel = (currentLevel) => {
  const idx = MERCHANT_LEVELS.findIndex(l => l.level === currentLevel.level);
  return idx < MERCHANT_LEVELS.length - 1 ? MERCHANT_LEVELS[idx + 1] : null;
};

/**
 * Calcula progreso hacia el siguiente nivel (0-100%)
 */
export const getMerchantLevelProgress = (totalXP, currentLevel) => {
  const nextLevel = getNextMerchantLevel(currentLevel);
  if (!nextLevel) return 100;
  
  const xpInCurrentLevel = totalXP - currentLevel.xpRequired;
  const xpNeededForNext = nextLevel.xpRequired - currentLevel.xpRequired;
  
  return Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNext) * 100));
};

// ============================================================
// RECOMPENSAS POR NIVEL - PREMIOS REALES PARA COMERCIOS
// ============================================================

export const MERCHANT_REWARDS = [
  // Nivel 2 - Bronce III
  {
    level: 2,
    rewards: [
      { id: 'badge_first_sale', type: 'badge', name: 'Primera Venta', icon: 'ribbon', claimed: false },
    ],
  },
  
  // Nivel 3 - Bronce II
  {
    level: 3,
    rewards: [
      { id: 'fb_post_1', type: 'social', name: '1 Post en Facebook Delicrunch', 
        description: 'Publicaremos tu negocio en nuestra página de Facebook',
        icon: 'logo-facebook', claimed: false },
    ],
  },
  
  // Nivel 4 - Bronce I
  {
    level: 4,
    rewards: [
      { id: 'ig_story_1', type: 'social', name: '1 Historia en Instagram', 
        description: 'Te mencionaremos en nuestras historias de Instagram',
        icon: 'logo-instagram', claimed: false },
      { id: 'badge_rising_star', type: 'badge', name: 'Estrella en Ascenso', icon: 'star-half', claimed: false },
    ],
  },
  
  // Nivel 5 - Plata III
  {
    level: 5,
    rewards: [
      { id: 'featured_week', type: 'feature', name: 'Destacado de la Semana', 
        description: 'Tu tienda aparecerá como destacada en la app durante 7 días',
        icon: 'flame', claimed: false },
      { id: 'ig_post_1', type: 'social', name: '1 Post en Instagram', 
        description: 'Publicación permanente en nuestro feed de Instagram',
        icon: 'logo-instagram', claimed: false },
    ],
  },
  
  // Nivel 6 - Plata II
  {
    level: 6,
    rewards: [
      { id: 'tiktok_1', type: 'social', name: '1 Video en TikTok', 
        description: 'Crearemos un TikTok promocionando tu negocio',
        icon: 'logo-tiktok', claimed: false },
    ],
  },
  
  // Nivel 7 - Plata I
  {
    level: 7,
    rewards: [
      { id: 'radio_mention', type: 'media', name: 'Mención en Radio Local', 
        description: '3 menciones de tu negocio en radio local (15 seg c/u)',
        icon: 'radio', claimed: false },
      { id: 'badge_silver', type: 'badge', name: 'Comercio Plata', icon: 'shield-checkmark', claimed: false },
    ],
  },
  
  // Nivel 8 - Oro III
  {
    level: 8,
    rewards: [
      { id: 'featured_month', type: 'feature', name: 'Destacado del Mes', 
        description: 'Tu tienda destacada en la app durante 30 días',
        icon: 'trophy', claimed: false },
      { id: 'fb_campaign', type: 'social', name: 'Campaña Facebook Ads', 
        description: '$500 MXN en publicidad de Facebook para tu negocio',
        icon: 'megaphone', claimed: false },
    ],
  },
  
  // Nivel 9 - Oro II
  {
    level: 9,
    rewards: [
      { id: 'radio_spot_30', type: 'media', name: 'Spot de Radio 30 seg', 
        description: '5 spots de 30 segundos en radio local',
        icon: 'radio', claimed: false },
      { id: 'ig_campaign', type: 'social', name: 'Campaña Instagram Ads', 
        description: '$500 MXN en publicidad de Instagram para tu negocio',
        icon: 'logo-instagram', claimed: false },
    ],
  },
  
  // Nivel 10 - Oro I
  {
    level: 10,
    rewards: [
      { id: 'blog_feature', type: 'media', name: 'Artículo en Blog', 
        description: 'Artículo destacando tu negocio en el blog de Delicrunch',
        icon: 'newspaper', claimed: false },
      { id: 'podcast_mention', type: 'media', name: 'Mención en Podcast', 
        description: 'Te mencionaremos en podcasts locales de emprendimiento',
        icon: 'mic', claimed: false },
      { id: 'badge_gold', type: 'badge', name: 'Comercio Oro', icon: 'medal', claimed: false },
    ],
  },
  
  // Nivel 11 - Platino III
  {
    level: 11,
    rewards: [
      { id: 'tv_mention', type: 'media', name: 'Mención en TV Local', 
        description: 'Mención de tu negocio en programa de TV local',
        icon: 'tv', claimed: false },
      { id: 'google_ads', type: 'social', name: 'Campaña Google Ads', 
        description: '$1,000 MXN en publicidad de Google para tu negocio',
        icon: 'logo-google', claimed: false },
    ],
  },
  
  // Nivel 12 - Platino II
  {
    level: 12,
    rewards: [
      { id: 'interview_radio', type: 'media', name: 'Entrevista en Radio', 
        description: 'Entrevista de 5 minutos en programa de radio local',
        icon: 'mic', claimed: false },
      { id: 'influencer_collab', type: 'social', name: 'Colaboración con Influencer', 
        description: 'Un influencer local promocionará tu negocio',
        icon: 'people', claimed: false },
    ],
  },
  
  // Nivel 13 - Platino I
  {
    level: 13,
    rewards: [
      { id: 'tv_segment', type: 'media', name: 'Segmento en TV', 
        description: 'Segmento de 2 minutos sobre tu negocio en TV local',
        icon: 'videocam', claimed: false },
      { id: 'billboard_digital', type: 'outdoor', name: 'Anuncio Digital Outdoor', 
        description: '1 semana en pantalla digital en zona céntrica',
        icon: 'desktop', claimed: false },
      { id: 'badge_platinum', type: 'badge', name: 'Comercio Platino', icon: 'diamond-outline', claimed: false },
    ],
  },
  
  // Nivel 14 - Diamante III
  {
    level: 14,
    rewards: [
      { id: 'newspaper_ad', type: 'media', name: 'Anuncio en Periódico', 
        description: 'Anuncio de 1/4 de página en periódico local',
        icon: 'newspaper', claimed: false },
      { id: 'premium_placement', type: 'feature', name: 'Posición Premium Permanente', 
        description: 'Tu tienda siempre aparecerá en las primeras posiciones',
        icon: 'rocket', claimed: false },
    ],
  },
  
  // Nivel 15 - Diamante II
  {
    level: 15,
    rewards: [
      { id: 'documentary_short', type: 'media', name: 'Mini Documental', 
        description: 'Video documental de 3 minutos sobre tu negocio',
        icon: 'film', claimed: false },
      { id: 'multi_platform_campaign', type: 'social', name: 'Campaña Multi-Plataforma', 
        description: '$3,000 MXN en publicidad en todas las redes sociales',
        icon: 'globe', claimed: false },
    ],
  },
  
  // Nivel 16 - Diamante I (Máximo)
  {
    level: 16,
    rewards: [
      { id: 'tv_interview', type: 'media', name: 'Entrevista en TV', 
        description: 'Entrevista de 5 minutos en noticiero local',
        icon: 'tv', claimed: false },
      { id: 'brand_ambassador', type: 'feature', name: 'Embajador de Marca', 
        description: 'Serás embajador oficial de Delicrunch en tu ciudad',
        icon: 'ribbon', claimed: false },
      { id: 'annual_feature', type: 'feature', name: 'Destacado Anual', 
        description: 'Aparición en el informe anual de Delicrunch',
        icon: 'document', claimed: false },
      { id: 'badge_diamond', type: 'badge', name: 'Comercio Diamante', icon: 'diamond', claimed: false },
    ],
  },
];

// ============================================================
// CATEGORÍAS DE RECOMPENSAS
// ============================================================

export const REWARD_CATEGORIES = {
  badge: { name: 'Insignias', icon: 'ribbon', color: '#AF52DE' },
  social: { name: 'Redes Sociales', icon: 'share-social', color: '#007AFF' },
  media: { name: 'Medios', icon: 'tv', color: '#FF9500' },
  feature: { name: 'Destacados', icon: 'star', color: '#FFD700' },
  outdoor: { name: 'Publicidad', icon: 'megaphone', color: '#34C759' },
};

// ============================================================
// FUNCIONES HELPER
// ============================================================

/**
 * Obtiene todas las recompensas disponibles hasta cierto nivel
 */
export const getAvailableRewards = (currentLevel) => {
  return MERCHANT_REWARDS
    .filter(r => r.level <= currentLevel)
    .flatMap(r => r.rewards);
};

/**
 * Obtiene las recompensas de un nivel específico
 */
export const getLevelRewards = (level) => {
  const levelRewards = MERCHANT_REWARDS.find(r => r.level === level);
  return levelRewards ? levelRewards.rewards : [];
};

/**
 * Obtiene la siguiente recompensa por reclamar
 */
export const getNextReward = (currentLevel, claimedRewards = []) => {
  const available = getAvailableRewards(currentLevel);
  return available.find(r => !claimedRewards.includes(r.id));
};

export default {
  MERCHANT_LEVEL_TIERS,
  MERCHANT_LEVELS,
  MERCHANT_REWARDS,
  REWARD_CATEGORIES,
  calculateMerchantXP,
  getMerchantLevelFromXP,
  getNextMerchantLevel,
  getMerchantLevelProgress,
  getAvailableRewards,
  getLevelRewards,
  getNextReward,
};
