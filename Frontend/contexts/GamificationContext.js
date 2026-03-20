/**
 * GamificationContext - Contexto global para el sistema de gamificación
 * Maneja XP, niveles, insignias y estadísticas del usuario
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import {
  calculateXP,
  getLevelFromXP,
  getNextLevel,
  getLevelProgress,
  checkNewBadges,
  getBadgeProgress,
  calculateKWhFromCO2,
  BADGES,
  LEVELS,
} from '../src/constants/gamification';

const GamificationContext = createContext();

const STORAGE_KEYS = {
  STATS: '@delicrunch_gamification_stats',
  BADGES: '@delicrunch_unlocked_badges',
  LAST_ACTIVITY: '@delicrunch_last_activity',
  COUPONS: '@delicrunch_coupons',
};

const DEFAULT_STATS = {
  totalXP: 0,
  totalPacksSaved: 0,
  totalSavings: 0,
  totalCO2Saved: 0,
  totalKWhSaved: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalShares: 0,
  totalReviews: 0,
  currentLevel: 1,
  isEarlyAdopter: true, // Por ahora todos son early adopters
  lastActivityDate: null,
};

export const GamificationProvider = ({ children }) => {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(LEVELS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [newBadgeQueue, setNewBadgeQueue] = useState([]);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);
  const [currentNotificationBadge, setCurrentNotificationBadge] = useState(null);

  // Cargar datos al iniciar
  useEffect(() => {
    loadGamificationData();
  }, []);

  // Actualizar nivel cuando cambia XP
  useEffect(() => {
    const level = getLevelFromXP(stats.totalXP);
    setCurrentLevel(level);
    setStats(prev => ({ ...prev, currentLevel: level.level }));
  }, [stats.totalXP]);

  // Procesar cola de notificaciones de insignias
  useEffect(() => {
    if (newBadgeQueue.length > 0 && !showBadgeNotification) {
      const badge = newBadgeQueue[0];
      setCurrentNotificationBadge(badge);
      setShowBadgeNotification(true);
    }
  }, [newBadgeQueue, showBadgeNotification]);

  const loadGamificationData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar stats locales
      const storedStats = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
      const storedBadges = await AsyncStorage.getItem(STORAGE_KEYS.BADGES);
      const lastActivity = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      
      let loadedStats = storedStats ? JSON.parse(storedStats) : DEFAULT_STATS;
      let loadedBadges = storedBadges ? JSON.parse(storedBadges) : [];
      
      // Verificar racha
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const today = new Date();
        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          // Racha rota
          loadedStats.currentStreak = 0;
        }
      }
      
      // Intentar sincronizar con el servidor SOLO si hay token
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        try {
          const response = await api.get('/profiles/gamification');
          if (response.data) {
            // Merge server data con local (servidor tiene prioridad)
            loadedStats = {
              ...loadedStats,
              totalPacksSaved: response.data.total_packs_saved || loadedStats.totalPacksSaved,
              totalSavings: response.data.total_savings || loadedStats.totalSavings,
              totalCO2Saved: response.data.total_co2_saved || loadedStats.totalCO2Saved,
              totalXP: response.data.total_xp || loadedStats.totalXP,
              totalReviews: response.data.total_reviews || loadedStats.totalReviews,
            };
            
            if (response.data.unlocked_badges) {
              // Normalizar formato: el servidor puede devolver solo ids o objetos
              loadedBadges = response.data.unlocked_badges.map(b => {
                if (!b) return null;
                if (typeof b === 'string') return { id: b, unlockedAt: new Date().toISOString() };
                if (b.id) return b;
                return { id: String(b), unlockedAt: new Date().toISOString() };
              }).filter(Boolean);
            }
          }
        } catch (e) {
          // Usar datos locales si falla el servidor
          // Solo logear si no es un error de autenticación (401)
          if (!e.response || e.response.status !== 401) {
            console.warn('⚠️ No se pudo sincronizar gamification con servidor:', e.message);
          }
          console.log('Using local gamification data');
        }
      } else {
        // No hay token, usar datos locales sin intentar sincronizar
        console.log('No token available, using local gamification data');
      }
      
      // Calcular kWh
      loadedStats.totalKWhSaved = calculateKWhFromCO2(loadedStats.totalCO2Saved);
      
      setStats(loadedStats);
      setUnlockedBadges(loadedBadges);
      
      // Guardar datos actualizados
      await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(loadedStats));
      await AsyncStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(loadedBadges));
      
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Registra una compra/rescate y actualiza XP, stats e insignias
   * @param {number} packsSaved - Número de packs salvados
   * @param {number} savings - Ahorro en dinero
   * @param {number} co2Saved - CO2 evitado en kg
   */
  const recordPurchase = useCallback(async (packsSaved = 1, savings = 0, co2Saved = 2.5) => {
    // Calcular XP ganada
    const xpGained = calculateXP(packsSaved, savings, co2Saved);
    
    // Actualizar stats
    const newStats = {
      ...stats,
      totalXP: stats.totalXP + xpGained,
      totalPacksSaved: stats.totalPacksSaved + packsSaved,
      totalSavings: stats.totalSavings + savings,
      totalCO2Saved: stats.totalCO2Saved + co2Saved,
      totalKWhSaved: calculateKWhFromCO2(stats.totalCO2Saved + co2Saved),
      lastActivityDate: new Date().toISOString(),
    };
    
    // Actualizar racha
    const today = new Date().toDateString();
    const lastActivity = stats.lastActivityDate ? new Date(stats.lastActivityDate).toDateString() : null;
    
    if (lastActivity !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastActivity === yesterday.toDateString()) {
        newStats.currentStreak = stats.currentStreak + 1;
      } else if (!lastActivity || lastActivity !== today) {
        newStats.currentStreak = 1;
      }
      
      if (newStats.currentStreak > newStats.longestStreak) {
        newStats.longestStreak = newStats.currentStreak;
      }
    }
    
    // Actualizar nivel en stats
    const newLevel = getLevelFromXP(newStats.totalXP);
    newStats.currentLevel = newLevel.level;
    
    setStats(newStats);
    
    // Verificar nuevas insignias
    const unlockedIds = unlockedBadges.map(b => (b && b.id) ? b.id : b);
    const newBadges = checkNewBadges(newStats, unlockedIds);
    
    if (newBadges.length > 0) {
      const updatedBadges = [...unlockedBadges, ...newBadges];
      setUnlockedBadges(updatedBadges);
      setNewBadgeQueue(prev => [...prev, ...newBadges]);
      
      await AsyncStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(updatedBadges));
    }
    
    // Guardar stats
    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, new Date().toISOString());
    
    // Sincronizar con servidor y actualizar lista de insignias si la API responde
    // SOLO si hay token válido
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      try {
        const resp = await api.post('/profiles/gamification', {
          xp_gained: xpGained,
          packs_saved: packsSaved,
          savings: savings,
          co2_saved: co2Saved,
          new_badges: newBadges.map(b => b.id),
        });

        if (resp?.data?.unlocked_badges) {
          const serverBadges = resp.data.unlocked_badges.map(b => {
            if (!b) return null;
            if (typeof b === 'string') return { id: b, unlockedAt: new Date().toISOString() };
            if (b.id) return b;
            return { id: String(b), unlockedAt: new Date().toISOString() };
          }).filter(Boolean);

          // Merge unique
          const merged = [...updatedBadges];
          serverBadges.forEach(sb => {
            if (!merged.some(m => (m && m.id ? m.id : m) === (sb.id))) merged.push(sb);
          });

          setUnlockedBadges(merged);
          await AsyncStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(merged));
        }
      } catch (e) {
        // Solo logear si no es un error de autenticación (401)
        if (!e.response || e.response.status !== 401) {
          console.warn('⚠️ No se pudo sincronizar gamification con servidor:', e.message);
        }
        console.log('Failed to sync gamification with server');
      }
    }
    
    // Si se subió de nivel, crear cupón local (si existe recompensa)
    let awardedCoupon = null;
    try {
      if (newLevel.level !== currentLevel.level) {
        const reward = getRewardForLevel(newLevel.level);
        if (reward && reward.coupon) {
          const c = reward.coupon;
          const couponObj = {
            id: c.id,
            name: c.name,
            description: c.description,
            type: c.type,
            value: c.value,
            category: c.category || 'ALL',
            min_purchase: c.minPurchase || 0,
            expires_at: new Date(Date.now() + ((c.validDays || 30) * 24 * 60 * 60 * 1000)).toISOString(),
            status: 'active',
            icon: c.icon,
            color: c.color,
          };

          // Guardar en almacenamiento local
          try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.COUPONS);
            const existing = stored ? JSON.parse(stored) : { active: [], used: [], expired: [] };
            existing.active = [couponObj, ...(existing.active || [])];
            await AsyncStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(existing));
            awardedCoupon = couponObj;
          } catch (e) {
            console.log('Failed to save local coupon', e);
          }
        }
      }
    } catch (e) {
      console.log('Error awarding coupon:', e);
    }

    return {
      xpGained,
      newBadges,
      newLevel: newLevel.level !== currentLevel.level ? newLevel : null,
      newCoupon: awardedCoupon,
    };
  }, [stats, unlockedBadges, currentLevel]);

  /**
   * Registra una acción de compartir
   */
  const recordShare = useCallback(async () => {
    const newStats = {
      ...stats,
      totalShares: stats.totalShares + 1,
    };
    setStats(newStats);
    
    // Verificar insignias
    const unlockedIds = unlockedBadges.map(b => (b && b.id) ? b.id : b);
    const newBadges = checkNewBadges(newStats, unlockedIds);
    
    if (newBadges.length > 0) {
      const updatedBadges = [...unlockedBadges, ...newBadges];
      setUnlockedBadges(updatedBadges);
      setNewBadgeQueue(prev => [...prev, ...newBadges]);
      await AsyncStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(updatedBadges));
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
  }, [stats, unlockedBadges]);

  /**
   * Registra una reseña
   */
  const recordReview = useCallback(async () => {
    const newStats = {
      ...stats,
      totalReviews: stats.totalReviews + 1,
    };
    setStats(newStats);
    
    const unlockedIds = unlockedBadges.map(b => (b && b.id) ? b.id : b);
    const newBadges = checkNewBadges(newStats, unlockedIds);
    
    if (newBadges.length > 0) {
      const updatedBadges = [...unlockedBadges, ...newBadges];
      setUnlockedBadges(updatedBadges);
      setNewBadgeQueue(prev => [...prev, ...newBadges]);
      await AsyncStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(updatedBadges));
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
  }, [stats, unlockedBadges]);

  /**
   * Cierra la notificación de insignia actual
   */
  const dismissBadgeNotification = useCallback(() => {
    setShowBadgeNotification(false);
    setCurrentNotificationBadge(null);
    setNewBadgeQueue(prev => prev.slice(1));
  }, []);

  /**
   * Obtiene el progreso de todas las insignias
   */
  const getAllBadgesProgress = useCallback(() => {
    return BADGES.map(badge => ({
      ...badge,
      progress: getBadgeProgress(badge, stats),
      isUnlocked: unlockedBadges.some(b => (b && b.id ? b.id : b) === badge.id),
      unlockedAt: unlockedBadges.find(b => (b && b.id ? b.id : b) === badge.id)?.unlockedAt,
    }));
  }, [stats, unlockedBadges]);

  /**
   * Obtiene datos para el leaderboard comparando usuarios reales de la BD
   */
  const getLeaderboard = useCallback(async () => {
    try {
      const response = await api.get('/profiles/leaderboard');
      const data = response.data || {};
      return {
        leaderboard: data.leaderboard || [],
        userRank: data.userRank || null,
      };
    } catch (e) {
      // Fallback mock si el endpoint no responde
      return {
        leaderboard: [
          { id: 1, nickname: 'Salvador Verde', xp: 12500, level: 10, tier: 'PLATINUM', rank: 1 },
          { id: 2, nickname: 'Eco Guerrero', xp: 9800, level: 9, tier: 'GOLD', rank: 2 },
          { id: 3, nickname: 'Héroe Local', xp: 7500, level: 8, tier: 'GOLD', rank: 3 },
          { id: 4, nickname: 'Guardián Foodie', xp: 5200, level: 7, tier: 'GOLD', rank: 4 },
          { id: 5, nickname: 'Ninja Ahorro', xp: 3800, level: 6, tier: 'SILVER', rank: 5 },
        ],
        userRank: null,
      };
    }
  }, []);

  const value = {
    // State
    stats,
    currentLevel,
    unlockedBadges,
    isLoading,
    
    // Badge notification
    showBadgeNotification,
    currentNotificationBadge,
    dismissBadgeNotification,
    
    // Actions
    recordPurchase,
    recordShare,
    recordReview,
    loadGamificationData,
    
    // Computed
    getAllBadgesProgress,
    getLeaderboard,
    levelProgress: getLevelProgress(stats.totalXP, currentLevel),
    nextLevel: getNextLevel(currentLevel),
    xpToNextLevel: getNextLevel(currentLevel) 
      ? getNextLevel(currentLevel).xpRequired - stats.totalXP 
      : 0,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

export default GamificationContext;
