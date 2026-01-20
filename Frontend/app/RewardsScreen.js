/**
 * RewardsScreen - Pantalla de Recompensas y Gamificación
 * Sistema completo de niveles, insignias, leaderboard, logros y CUPONES
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGamification } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LEVELS,
  LEVEL_TIERS,
  BADGE_CATEGORIES,
  BADGE_TIERS,
  COUPON_CATEGORIES,
  getTierColor,
  getBadgeTierColor,
  getLevelFromXP,
  getNextLevel,
  getLevelProgress,
  getRewardsUpToLevel,
  LEVEL_REWARDS,
} from '../src/constants/gamification';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS, SHADOWS } from '../src/constants/theme';
import { formatNumber, formatPrice } from '../src/utils/format';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRewardForLevel } from '../src/constants/gamification';
import CouponModal from '../components/CouponModal';

const { width } = Dimensions.get('window');

const RewardsScreen = () => {
  const {
    stats,
    currentLevel,
    unlockedBadges,
    isLoading,
    levelProgress,
    nextLevel,
    xpToNextLevel,
    getAllBadgesProgress,
    getLeaderboard,
    loadGamificationData,
  } = useGamification();

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [leaderboard, setLeaderboard] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [allBadges, setAllBadges] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Estado para cupones
  const [coupons, setCoupons] = useState({ active: [], used: [], expired: [] });
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponFilter, setCouponFilter] = useState('active'); // 'active', 'used', 'expired'
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [selectedLevelCoupon, setSelectedLevelCoupon] = useState(null);
  const [selectedLevelRequired, setSelectedLevelRequired] = useState(null);
  const [levelDefs, setLevelDefs] = useState(null);
  const [levelDefsLoading, setLevelDefsLoading] = useState(false);

  // Animaciones
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Animar barra de progreso
    Animated.timing(progressAnim, {
      toValue: levelProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [levelProgress]);

  const loadData = async () => {
    const badges = getAllBadgesProgress();
    setAllBadges(badges);
    
    const lb = await getLeaderboard();
    setLeaderboard(lb);
    
    // Cargar cupones
    await loadCoupons();
    await loadLevelDefinitions();
  };

  const loadLevelDefinitions = async () => {
    try {
      setLevelDefsLoading(true);
      const resp = await api.get('/coupons/definitions');
      if (resp.data && resp.data.success) {
        setLevelDefs(resp.data);
      }
    } catch (e) {
      console.log('Error loading level definitions', e.message);
    } finally {
      setLevelDefsLoading(false);
    }
  };

  const loadCoupons = async () => {
    try {
      setCouponsLoading(true);
      let merged = { active: [], used: [], expired: [] };
      try {
        const response = await api.get('/coupons/my');
        if (response.data && response.data.success && response.data.coupons) {
          merged = { ...merged, ...response.data.coupons };
        }
      } catch (e) {
        // ignore api failure, we'll try local cache
      }

      // Leer cupones locales creados por subida de nivel
      try {
        const local = await AsyncStorage.getItem('@delicrunch_coupons');
        if (local) {
          const parsed = JSON.parse(local);
          // Merge: prepend local active coupons to merged.active
          merged.active = [
            ...(parsed.active || []),
            ...(merged.active || []),
          ];
          merged.used = merged.used || (parsed.used || []);
          merged.expired = merged.expired || (parsed.expired || []);
        }
      } catch (e) {
        console.log('Error reading local coupons', e);
      }

      setCoupons(merged);
    } catch (error) {
      console.log('Error loading coupons:', error.message);
      // No mostrar error si la API aún no existe
    } finally {
      setCouponsLoading(false);
    }
  };

  const openCouponModal = (coupon, levelRequired) => {
    setSelectedLevelCoupon(coupon);
    setSelectedLevelRequired(levelRequired);
    setCouponModalVisible(true);
  };

  const closeCouponModal = () => {
    setCouponModalVisible(false);
    setSelectedLevelCoupon(null);
    setSelectedLevelRequired(null);
  };

  const handleUseLevelCoupon = async (coupon) => {
    try {
      // Preferir otorgar el cupón en el backend para evitar duplicados
      try {
        const resp = await api.post('/coupons/grant-level', { level: selectedLevelRequired || coupon.levelRequired || selectedLevelRequired });
        if (resp.data && resp.data.success && resp.data.coupon) {
          const granted = resp.data.coupon;
          // Merge into local UI and storage
          const stored = await AsyncStorage.getItem('@delicrunch_coupons');
          const existing = stored ? JSON.parse(stored) : { active: [], used: [], expired: [] };
          existing.active = [granted, ...(existing.active || [])].filter((v,i,self)=> self.findIndex(x=>x.id===v.id)===i);
          await AsyncStorage.setItem('@delicrunch_coupons', JSON.stringify(existing));
          setCoupons(prev => ({ ...prev, active: [granted, ...(prev.active || [])].filter((v,i,self)=> self.findIndex(x=>x.id===v.id)===i) }));
          closeCouponModal();
          Alert.alert('Cupón añadido', resp.data.message || 'Cupón otorgado y añadido a tus cupones.');
          return;
        }
      } catch (apiErr) {
        // Si falla la API (sin autenticación por ejemplo), caer al fallback local
        console.log('Grant level coupon API failed, falling back to local:', apiErr.message);
      }

      // Fallback: Add coupon to local storage active list
      const stored = await AsyncStorage.getItem('@delicrunch_coupons');
      const existing = stored ? JSON.parse(stored) : { active: [], used: [], expired: [] };
      // Avoid duplicates by id
      if (!existing.active.some(c => c.id === coupon.id)) {
        const newCoupon = {
          ...coupon,
          id: `${coupon.id}_${Date.now()}`,
          expires_at: new Date(Date.now() + ((coupon.validDays || 30) * 24 * 60 * 60 * 1000)).toISOString(),
          status: 'active',
        };
        existing.active = [newCoupon, ...(existing.active || [])];
        await AsyncStorage.setItem('@delicrunch_coupons', JSON.stringify(existing));
        // update UI
        setCoupons(prev => ({ ...prev, active: [newCoupon, ...(prev.active || [])] }));
      }
      closeCouponModal();
      Alert.alert('Cupón añadido', 'El cupón se ha añadido a tus cupones activos.');
    } catch (e) {
      console.log('Error adding coupon locally', e);
      Alert.alert('Error', 'No se pudo añadir el cupón localmente.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGamificationData();
    await loadData();
    setRefreshing(false);
  };

  const tierInfo = LEVEL_TIERS[currentLevel?.tier] || LEVEL_TIERS.BRONZE;
  const tierColor = tierInfo?.color || '#CD7F32';

  // Filtrar insignias por categoría
  const filteredBadges = selectedCategory === 'ALL'
    ? allBadges
    : allBadges.filter(b => b.category === selectedCategory);

  // ============================================================
  // COMPONENTES
  // ============================================================

  // Header con nivel actual
  const LevelHeader = () => (
    <Animated.View style={[styles.levelCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.levelIconContainer}>
        <View style={[styles.levelIcon, { backgroundColor: tierColor }]}>
          <Ionicons name={tierInfo.icon || 'shield'} size={40} color="#FFFFFF" />
        </View>
        <View style={[styles.levelBadge, { backgroundColor: tierColor }]}>
          <Text style={styles.levelBadgeText}>{currentLevel?.level || 1}</Text>
        </View>
      </View>

      <View style={styles.levelInfo}>
        <Text style={styles.levelTitle}>{currentLevel?.title || 'Bronce III'}</Text>
        <Text style={styles.xpText}>{stats.totalXP.toLocaleString()} XP</Text>
        
        {nextLevel && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { 
                    backgroundColor: tierColor,
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {xpToNextLevel.toLocaleString()} XP para {nextLevel.title}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  // Stats rápidos
  const QuickStats = () => (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <MaterialCommunityIcons name="food-apple" size={28} color={COLORS.primary} />
        <Text style={styles.statValue}>{stats.totalPacksSaved}</Text>
        <Text style={styles.statLabel}>Packs Salvados</Text>
      </View>
      <View style={styles.statCard}>
        <MaterialCommunityIcons name="leaf" size={28} color="#34C759" />
        <Text style={styles.statValue}>{formatNumber(stats.totalCO2Saved, 1)}</Text>
        <Text style={styles.statLabel}>kg CO₂ Evitados</Text>
      </View>
      <View style={styles.statCard}>
        <MaterialCommunityIcons name="cash" size={28} color="#FF9500" />
        <Text style={styles.statValue}>${formatPrice(stats.totalSavings)}</Text>
        <Text style={styles.statLabel}>Ahorrados</Text>
      </View>
      <View style={styles.statCard}>
        <MaterialCommunityIcons name="fire" size={28} color="#FF3B30" />
        <Text style={styles.statValue}>{stats.currentStreak}</Text>
        <Text style={styles.statLabel}>Días Racha</Text>
      </View>
    </View>
  );

  // Tabs de navegación
  const TabBar = () => (
    <View style={styles.tabBar}>
      {[
        { id: 'overview', label: 'General', icon: 'home' },
        { id: 'coupons', label: 'Cupones', icon: 'ticket' },
        { id: 'badges', label: 'Insignias', icon: 'medal' },
        { id: 'levels', label: 'Niveles', icon: 'trending-up' },
        { id: 'leaderboard', label: 'Ranking', icon: 'podium' },
      ].map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Ionicons 
            name={tab.icon} 
            size={18} 
            color={activeTab === tab.id ? COLORS.primary : COLORS.textTertiary} 
          />
          <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Card de insignia individual
  const BadgeCard = ({ badge }) => {
    const isUnlocked = badge.isUnlocked;
    const tierInfo = BADGE_TIERS[badge.tier];
    const categoryInfo = BADGE_CATEGORIES[badge.category];
    const handlePress = () => {
      let how = '';
      if (!badge.requirement) how = 'Requisito especial. Revisar descripción.';
      else {
        switch (badge.category) {
          case 'PACKS': how = `Rescata ${badge.requirement} pack(s) de comida.`; break;
          case 'ENVIRONMENT': how = `Evita ${badge.requirement} kg de CO₂ (o equivalente).`; break;
          case 'STREAK': how = `Mantén una racha de ${badge.requirement} días.`; break;
          case 'LEVEL': how = `Alcanza el nivel ${badge.requirement}.`; break;
          case 'SAVINGS': how = `Ahorra $${badge.requirement} MXN en total.`; break;
          case 'SPECIAL': how = badge.id === 'social_butterfly' ? `Comparte tu impacto ${badge.requirement} veces.` : badge.id === 'reviewer' ? `Deja ${badge.requirement} reseñas.` : 'Requisito especial.'; break;
          default: how = 'Requisito especial.';
        }
      }

      const title = `${badge.name} ${isUnlocked ? '(Desbloqueada)' : ''}`;
      const message = `${badge.description}\n\nCómo desbloquear:\n${how}` + (isUnlocked && badge.unlockedAt ? `\n\nDesbloqueada: ${new Date(badge.unlockedAt).toLocaleDateString()}` : '');

      Alert.alert(title, message, [{ text: 'Cerrar' }], { cancelable: true });
    };
    
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={[styles.badgeCard, !isUnlocked && styles.badgeCardLocked]}>
        <View style={[
          styles.badgeIconContainer,
          { 
            backgroundColor: isUnlocked ? tierInfo.bgColor : '#F2F2F7',
            borderColor: isUnlocked ? tierInfo.color : '#E5E5EA',
          },
        ]}>
          <Ionicons 
            name={badge.icon} 
            size={28} 
            color={isUnlocked ? tierInfo.color : '#C7C7CC'} 
          />
          {!isUnlocked && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={14} color="#8E8E93" />
            </View>
          )}
        </View>
        
        <Text style={[styles.badgeName, !isUnlocked && styles.badgeNameLocked]}>
          {badge.name}
        </Text>
        
        <View style={[styles.tierPill, { backgroundColor: isUnlocked ? tierInfo.bgColor : '#F2F2F7' }]}>
          <Text style={[styles.tierPillText, { color: isUnlocked ? tierInfo.color : '#8E8E93' }]}>
            {tierInfo.name}
          </Text>
        </View>
        
        {!isUnlocked && (
          <View style={styles.badgeProgress}>
            <View style={styles.badgeProgressBar}>
              <View 
                style={[
                  styles.badgeProgressFill,
                  { width: `${badge.progress}%`, backgroundColor: categoryInfo.color },
                ]}
              />
            </View>
            <Text style={styles.badgeProgressText}>{badge.progress}%</Text>
          </View>
        )}
        </View>
      </TouchableOpacity>
    );
  };

  // Vista de insignias
  const BadgesView = () => (
    <View style={styles.badgesContainer}>
      {/* Filtros de categoría */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === 'ALL' && styles.categoryChipActive]}
          onPress={() => setSelectedCategory('ALL')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'ALL' && styles.categoryTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        {Object.entries(BADGE_CATEGORIES).map(([key, cat]) => (
          <TouchableOpacity
            key={key}
            style={[styles.categoryChip, selectedCategory === key && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(key)}
          >
            <Ionicons 
              name={cat.icon} 
              size={14} 
              color={selectedCategory === key ? '#FFFFFF' : cat.color} 
            />
            <Text style={[styles.categoryText, selectedCategory === key && styles.categoryTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Contador */}
      <Text style={styles.badgeCount}>
        {unlockedBadges.length} de {allBadges.length} desbloqueadas
      </Text>

      {/* Grid de insignias */}
      <View style={styles.badgesGrid}>
        {filteredBadges.map(badge => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </View>
    </View>
  );

  // ============================================================
  // VISTA DE CUPONES
  // ============================================================
  
  // Card de cupón individual
  const CouponCard = ({ coupon, showUseButton = false }) => {
    const categoryInfo = COUPON_CATEGORIES?.[coupon.category] || COUPON_CATEGORIES?.ALL || { 
      name: 'General', 
      icon: 'gift', 
      color: '#34C759' 
    };
    const isExpired = coupon.status === 'expired' || new Date(coupon.expires_at) < new Date();
    const isUsed = coupon.status === 'used';
    
    const getTypeLabel = () => {
      switch(coupon.type) {
        case 'percentage': return `${coupon.value}% OFF`;
        case 'fixed': return `$${formatPrice(coupon.value)} OFF`;
        case '2x1': return '2x1';
        case 'free_item': return 'GRATIS';
        default: return 'Descuento';
      }
    };
    
    const getDaysRemaining = () => {
      if (isUsed || isExpired) return null;
      const days = Math.ceil((new Date(coupon.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
      if (days <= 0) return 'Expira hoy';
      if (days === 1) return '1 día restante';
      return `${days} días restantes`;
    };
    
    return (
      <View style={[
        styles.couponCard,
        isExpired && styles.couponCardExpired,
        isUsed && styles.couponCardUsed,
      ]}>
        {/* Lado izquierdo - valor del cupón */}
        <View style={[
          styles.couponLeft,
          { backgroundColor: isExpired || isUsed ? '#E5E5EA' : (coupon.color || categoryInfo.color) }
        ]}>
          <Text style={styles.couponValue}>{getTypeLabel()}</Text>
          <Ionicons 
            name={coupon.icon || categoryInfo.icon} 
            size={24} 
            color="#FFFFFF" 
          />
        </View>
        
        {/* Perforación decorativa */}
        <View style={styles.couponPerf}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={styles.couponPerfDot} />
          ))}
        </View>
        
        {/* Lado derecho - información */}
        <View style={styles.couponRight}>
          <Text style={[styles.couponName, (isExpired || isUsed) && styles.couponNameDisabled]} numberOfLines={1}>
            {coupon.name}
          </Text>
          
          <View style={styles.couponMeta}>
            <View style={[styles.couponCategoryPill, { backgroundColor: categoryInfo.color + '20' }]}>
              <Text style={[styles.couponCategoryText, { color: categoryInfo.color }]}>
                {categoryInfo.name}
              </Text>
            </View>
            
            {coupon.min_purchase > 0 && (
              <Text style={styles.couponMinPurchase}>
                Min. ${formatPrice(coupon.min_purchase)}
              </Text>
            )}
          </View>
          
          {/* Estado / Tiempo restante */}
          <View style={styles.couponStatus}>
            {isUsed ? (
              <View style={styles.usedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#8E8E93" />
                <Text style={styles.usedText}>Usado</Text>
              </View>
            ) : isExpired ? (
              <View style={styles.expiredBadge}>
                <Ionicons name="time" size={14} color="#FF3B30" />
                <Text style={styles.expiredText}>Expirado</Text>
              </View>
            ) : (
              <View style={styles.activeBadge}>
                <Ionicons name="time-outline" size={14} color="#34C759" />
                <Text style={styles.activeText}>{getDaysRemaining()}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Vista completa de cupones
  const CouponsView = () => {
    const filterOptions = [
      { id: 'active', label: 'Activos', count: coupons.active?.length || 0 },
      { id: 'used', label: 'Usados', count: coupons.used?.length || 0 },
      { id: 'expired', label: 'Expirados', count: coupons.expired?.length || 0 },
    ];
    
    const currentCoupons = coupons[couponFilter] || [];
    
    return (
      <View style={styles.couponsContainer}>
        {/* Header con stats */}
        <View style={styles.couponsHeader}>
          <View style={styles.couponsStat}>
            <Ionicons name="ticket" size={32} color={COLORS.primary} />
            <Text style={styles.couponsStatValue}>{coupons.active?.length || 0}</Text>
            <Text style={styles.couponsStatLabel}>Disponibles</Text>
          </View>
          <View style={styles.couponsDivider} />
          <View style={styles.couponsStat}>
            <Ionicons name="checkmark-done" size={32} color="#34C759" />
            <Text style={styles.couponsStatValue}>{coupons.used?.length || 0}</Text>
            <Text style={styles.couponsStatLabel}>Usados</Text>
          </View>
        </View>
        
        {/* Filtros */}
        <View style={styles.couponsFilters}>
          {filterOptions.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.couponFilterChip,
                couponFilter === filter.id && styles.couponFilterChipActive
              ]}
              onPress={() => setCouponFilter(filter.id)}
            >
              <Text style={[
                styles.couponFilterText,
                couponFilter === filter.id && styles.couponFilterTextActive
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Info sobre cómo obtener cupones */}
        {coupons.active?.length === 0 && couponFilter === 'active' && (
          <View style={styles.emptyCoupons}>
            <Ionicons name="gift-outline" size={64} color={COLORS.textTertiary} />
            <Text style={styles.emptyCouponsTitle}>¡Sube de nivel para ganar cupones!</Text>
            <Text style={styles.emptyCouponsText}>
              Cada nivel que alcances desbloquea recompensas exclusivas.{'\n'}
              Compra packs sorpresa y acumula XP.
            </Text>
            <View style={styles.howToEarn}>
              <Text style={styles.howToEarnTitle}>¿Cómo ganar XP?</Text>
              <View style={styles.howToEarnItem}>
                <Ionicons name="bag-check" size={20} color={COLORS.primary} />
                <Text style={styles.howToEarnText}>Compra packs sorpresa</Text>
              </View>
              <View style={styles.howToEarnItem}>
                <Ionicons name="flash" size={20} color="#FF9500" />
                <Text style={styles.howToEarnText}>Aprovecha Flash Deals (+75% XP)</Text>
              </View>
              <View style={styles.howToEarnItem}>
                <Ionicons name="leaf" size={20} color="#34C759" />
                <Text style={styles.howToEarnText}>Completa retos ecológicos (+100% XP)</Text>
              </View>
              <View style={styles.howToEarnItem}>
                <Ionicons name="flame" size={20} color="#FF3B30" />
                <Text style={styles.howToEarnText}>Mantén tu racha diaria</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Lista de cupones */}
        {couponsLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.couponsList}>
            {currentCoupons.map(coupon => (
              <CouponCard 
                key={coupon.id} 
                coupon={coupon} 
                showUseButton={couponFilter === 'active'}
              />
            ))}
            
            {currentCoupons.length === 0 && couponFilter !== 'active' && (
              <Text style={styles.noCouponsText}>
                No tienes cupones {couponFilter === 'used' ? 'usados' : 'expirados'} aún.
              </Text>
            )}
          </View>
        )}
        
        {/* Cupones desbloqueables por nivel */}
        <View style={styles.levelCouponsSection}>
          <Text style={styles.levelCouponsTitle}>Cupones por Nivel</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16 }}>
            {levelDefsLoading && (
              <View style={{ padding: 16 }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            )}

            {!levelDefsLoading && levelDefs && levelDefs.levels.length > 0 ? (
              // Flatten definitions per level into mini cards
              levelDefs.levels.map(lvl => (
                lvl.definitions.map(defObj => {
                  const def = defObj.definition;
                  const isUnlocked = !!defObj.unlocked;
                  const has = !!defObj.has;
                  return (
                    <TouchableOpacity
                      key={`${def.id}_${lvl.level}`}
                      activeOpacity={0.8}
                      onPress={() => openCouponModal(def, lvl.level)}
                      style={[
                        styles.levelCouponMini,
                        !isUnlocked && styles.levelCouponMiniLocked,
                      ]}
                    >
                      <View style={[styles.miniIcon, { backgroundColor: def.color || '#34C759' }]}> 
                        <Ionicons name={def.icon || 'gift'} size={20} color="#fff" />
                      </View>
                      <Text style={[styles.miniName, !isUnlocked && { color: '#999' }]} numberOfLines={1}>{def.name}</Text>
                      <Text style={[styles.miniLevel, !isUnlocked && { color: '#bbb' }]}>
                        {has ? 'Obtenido' : isUnlocked ? `Nivel ${lvl.level}` : `Bloqueado: Nivel ${lvl.level}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ))
            ) : (
              // fallback to static list if endpoint not available
              LEVEL_REWARDS.map((r) => {
                const c = r.coupon;
                const isUnlocked = currentLevel?.level >= r.level;
                return (
                  <TouchableOpacity
                    key={c.id}
                    activeOpacity={0.8}
                    onPress={() => openCouponModal(c, r.level)}
                    style={[
                      styles.levelCouponMini,
                      !isUnlocked && styles.levelCouponMiniLocked,
                    ]}
                  >
                    <View style={[styles.miniIcon, { backgroundColor: c.color || '#34C759' }]}> 
                      <Ionicons name={c.icon || 'gift'} size={20} color="#fff" />
                    </View>
                    <Text style={[styles.miniName, !isUnlocked && { color: '#999' }]} numberOfLines={1}>{c.name}</Text>
                    <Text style={[styles.miniLevel, !isUnlocked && { color: '#bbb' }]}>Nivel {r.level}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Próximas recompensas */}
        {couponFilter === 'active' && nextLevel && (
          <View style={styles.nextRewardSection}>
            <Text style={styles.nextRewardTitle}>🎁 Próxima Recompensa</Text>
            <View style={styles.nextRewardCard}>
              <View style={styles.nextRewardIcon}>
                <Ionicons name={LEVEL_TIERS[nextLevel.tier]?.icon || 'star'} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.nextRewardInfo}>
                <Text style={styles.nextRewardName}>Nivel {nextLevel.level}: {nextLevel.title}</Text>
                <Text style={styles.nextRewardXP}>{xpToNextLevel.toLocaleString()} XP restantes</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Vista de niveles
  const LevelsView = () => (
    <View style={styles.levelsContainer}>
      {LEVELS.map((level, index) => {
        const isCurrentLevel = level.level === currentLevel?.level;
        const isUnlocked = stats.totalXP >= level.xpRequired;
        const tierInfo = LEVEL_TIERS[level.tier];
        
        return (
          <View 
            key={level.level}
            style={[
              styles.levelRow,
              isCurrentLevel && styles.levelRowCurrent,
              !isUnlocked && styles.levelRowLocked,
            ]}
          >
            <View style={[
              styles.levelRowIcon,
              { backgroundColor: isUnlocked ? tierInfo.color : '#E5E5EA' },
            ]}>
              <Ionicons 
                name={tierInfo.icon} 
                size={20} 
                color={isUnlocked ? '#FFFFFF' : '#8E8E93'} 
              />
            </View>
            
            <View style={styles.levelRowInfo}>
              <Text style={[styles.levelRowTitle, !isUnlocked && styles.levelRowTitleLocked]}>
                {level.title}
              </Text>
              <Text style={styles.levelRowXP}>
                {level.xpRequired.toLocaleString()} XP
              </Text>
            </View>
            
            {isCurrentLevel && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Actual</Text>
              </View>
            )}
            
            {isUnlocked && !isCurrentLevel && (
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            )}
            
            {!isUnlocked && (
              <Ionicons name="lock-closed" size={20} color="#C7C7CC" />
            )}
          </View>
        );
      })}
    </View>
  );

  // Vista de leaderboard
  const LeaderboardView = () => (
    <View style={styles.leaderboardContainer}>
      <Text style={styles.leaderboardTitle}>🏆 Top Salvadores</Text>
      <Text style={styles.leaderboardSubtitle}>Los 5 próximos a ascender de nivel</Text>
      
      {leaderboard.map((user, index) => {
        const tierInfo = LEVEL_TIERS[user.tier] || LEVEL_TIERS.BRONZE;
        const isTop3 = index < 3;
        const medals = ['🥇', '🥈', '🥉'];
        
        return (
          <View key={user.id} style={[styles.leaderboardRow, isTop3 && styles.leaderboardRowTop]}>
            <View style={styles.leaderboardRank}>
              {isTop3 ? (
                <Text style={styles.medalEmoji}>{medals[index]}</Text>
              ) : (
                <Text style={styles.rankNumber}>{index + 1}</Text>
              )}
            </View>
            
            <View style={[styles.leaderboardAvatar, { backgroundColor: tierInfo.color }]}>
              <Ionicons name={tierInfo.icon} size={18} color="#FFFFFF" />
            </View>
            
            <View style={styles.leaderboardInfo}>
              <Text style={styles.leaderboardNickname}>{user.nickname}</Text>
              <View style={styles.leaderboardMeta}>
                <Text style={[styles.leaderboardLevel, { color: tierInfo.color }]}>
                  Nivel {user.level}
                </Text>
                <Text style={styles.leaderboardXP}>
                  {user.xp.toLocaleString()} XP
                </Text>
              </View>
            </View>
            
            {isTop3 && (
              <View style={[styles.ascendBadge, { backgroundColor: tierInfo.color + '20' }]}>
                <Ionicons name="arrow-up" size={12} color={tierInfo.color} />
              </View>
            )}
          </View>
        );
      })}

      {/* Tu posición */}
      <View style={styles.yourPosition}>
        <Text style={styles.yourPositionLabel}>Tu posición</Text>
        <View style={styles.leaderboardRow}>
          <View style={styles.leaderboardRank}>
            <Text style={styles.rankNumber}>--</Text>
          </View>
          <View style={[styles.leaderboardAvatar, { backgroundColor: tierColor }]}>
            <Ionicons name={tierInfo.icon} size={18} color="#FFFFFF" />
          </View>
          <View style={styles.leaderboardInfo}>
            <Text style={styles.leaderboardNickname}>Tú</Text>
            <View style={styles.leaderboardMeta}>
              <Text style={[styles.leaderboardLevel, { color: tierColor }]}>
                {currentLevel?.title}
              </Text>
              <Text style={styles.leaderboardXP}>
                {stats.totalXP.toLocaleString()} XP
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // Renderizar contenido según tab activo
  const renderContent = () => {
    switch (activeTab) {
      case 'coupons':
        return <CouponsView />;
      case 'badges':
        return <BadgesView />;
      case 'levels':
        return <LevelsView />;
      case 'leaderboard':
        return <LeaderboardView />;
      default:
        return (
          <>
            <QuickStats />
            
            {/* Cupones activos - resumen rápido */}
            {coupons.active?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🎟️ Mis Cupones</Text>
                  <TouchableOpacity onPress={() => setActiveTab('coupons')}>
                    <Text style={styles.seeAllText}>Ver todos</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {coupons.active.slice(0, 3).map(coupon => (
                    <View key={coupon.id} style={styles.quickCoupon}>
                      <View style={[styles.quickCouponIcon, { backgroundColor: coupon.color || '#34C759' }]}>
                        <Ionicons name={coupon.icon || 'ticket'} size={20} color="#FFFFFF" />
                      </View>
                      <Text style={styles.quickCouponName} numberOfLines={1}>{coupon.name}</Text>
                      <Text style={styles.quickCouponValue}>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : 
                         coupon.type === '2x1' ? '2x1' : `$${coupon.value}`}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* Insignias recientes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Insignias Recientes</Text>
                <TouchableOpacity onPress={() => setActiveTab('badges')}>
                  <Text style={styles.seeAllText}>Ver todas</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {allBadges.filter(b => b.isUnlocked).slice(0, 5).map(badge => (
                  <View key={badge.id} style={styles.recentBadge}>
                    <View style={[styles.recentBadgeIcon, { backgroundColor: BADGE_TIERS[badge.tier].bgColor }]}>
                      <Ionicons name={badge.icon} size={24} color={BADGE_TIERS[badge.tier].color} />
                    </View>
                    <Text style={styles.recentBadgeName} numberOfLines={1}>{badge.name}</Text>
                  </View>
                ))}
                {allBadges.filter(b => b.isUnlocked).length === 0 && (
                  <Text style={styles.emptyText}>¡Completa acciones para ganar insignias!</Text>
                )}
              </ScrollView>
            </View>

            {/* Próximas metas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Próximas Metas</Text>
              {allBadges
                .filter(b => !b.isUnlocked && b.progress > 0)
                .sort((a, b) => b.progress - a.progress)
                .slice(0, 3)
                .map(badge => (
                  <View key={badge.id} style={styles.goalRow}>
                    <View style={[styles.goalIcon, { backgroundColor: BADGE_CATEGORIES[badge.category].color + '20' }]}>
                      <Ionicons name={badge.icon} size={20} color={BADGE_CATEGORIES[badge.category].color} />
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{badge.name}</Text>
                      <View style={styles.goalProgressBar}>
                        <View 
                          style={[
                            styles.goalProgressFill,
                            { width: `${badge.progress}%`, backgroundColor: BADGE_CATEGORIES[badge.category].color },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.goalPercent}>{badge.progress}%</Text>
                  </View>
                ))}
            </View>
          </>
        );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando recompensas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Recompensas</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <LevelHeader />
        <TabBar />
        {renderContent()}
        <View style={{ height: 30 }} />
      </ScrollView>
      <CouponModal
        coupon={selectedLevelCoupon}
        visible={couponModalVisible}
        onClose={closeCouponModal}
        onUse={handleUseLevelCoupon}
        locked={currentLevel?.level < selectedLevelRequired}
        levelRequired={selectedLevelRequired}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },
  
  // Header
  header: { 
    paddingHorizontal: SPACING.md, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: SPACING.sm,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  
  scrollView: { flex: 1 },
  
  // Level Card
  levelCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: 20,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  levelIconContainer: { position: 'relative', marginRight: SPACING.md },
  levelIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  levelBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  xpText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 2 },
  progressContainer: { marginTop: SPACING.sm },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, color: COLORS.textTertiary, marginTop: 4 },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: 10,
  },
  statCard: {
    width: (width - SPACING.md * 2 - 10) / 2 - 5,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 16,
    padding: 4,
    ...SHADOWS.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    minHeight: 44,
  },
  tabActive: { backgroundColor: COLORS.primarySoft },
  tabText: { 
    fontSize: 11, 
    fontWeight: '600', 
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  tabTextActive: { color: COLORS.primary },
  
  // Section
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  seeAllText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  
  // Recent Badge
  recentBadge: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  recentBadgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentBadgeName: { fontSize: 11, color: COLORS.text, marginTop: 6, textAlign: 'center' },
  emptyText: { fontSize: 14, color: COLORS.textTertiary, fontStyle: 'italic' },
  
  // Goal Row
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: 8,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalInfo: { flex: 1, marginHorizontal: SPACING.sm },
  goalName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  goalProgressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  goalProgressFill: { height: '100%', borderRadius: 3 },
  goalPercent: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  
  // Badges
  badgesContainer: { paddingTop: SPACING.md },
  categoryScroll: { marginBottom: SPACING.sm },
  categoryContainer: { paddingHorizontal: SPACING.md },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: { backgroundColor: COLORS.primary },
  categoryText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  categoryTextActive: { color: '#FFFFFF' },
  badgeCount: { fontSize: 14, color: COLORS.textSecondary, marginHorizontal: SPACING.md, marginBottom: SPACING.sm },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: 10,
  },
  badgeCard: {
    width: (width - SPACING.md * 2 - 20) / 3,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  badgeCardLocked: { opacity: 0.7 },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 2,
  },
  badgeName: { fontSize: 11, fontWeight: '600', color: COLORS.text, marginTop: 6, textAlign: 'center' },
  badgeNameLocked: { color: COLORS.textTertiary },
  tierPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  tierPillText: { fontSize: 9, fontWeight: '700' },
  badgeProgress: { width: '100%', marginTop: 6 },
  badgeProgressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  badgeProgressFill: { height: '100%', borderRadius: 2 },
  badgeProgressText: { fontSize: 9, color: COLORS.textTertiary, textAlign: 'center', marginTop: 2 },
  
  // Levels
  levelsContainer: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: 8,
  },
  levelRowCurrent: { borderWidth: 2, borderColor: COLORS.primary },
  levelRowLocked: { opacity: 0.5 },
  levelRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelRowInfo: { flex: 1, marginLeft: SPACING.sm },
  levelRowTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  levelRowTitleLocked: { color: COLORS.textTertiary },
  levelRowXP: { fontSize: 12, color: COLORS.textSecondary },
  currentBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  currentBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  
  // Leaderboard
  leaderboardContainer: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  leaderboardTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  leaderboardSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: 8,
  },
  leaderboardRowTop: { borderWidth: 1, borderColor: '#FFD700' },
  leaderboardRank: { width: 36, alignItems: 'center' },
  medalEmoji: { fontSize: 24 },
  rankNumber: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  leaderboardInfo: { flex: 1, marginLeft: SPACING.sm },
  leaderboardNickname: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  leaderboardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leaderboardLevel: { fontSize: 12, fontWeight: '600' },
  leaderboardXP: { fontSize: 12, color: COLORS.textSecondary },
  ascendBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yourPosition: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  yourPositionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  
  // ============================================================
  // ESTILOS DE CUPONES
  // ============================================================
  
  // Badge en el tab
  couponBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    paddingHorizontal: 5,
  },
  couponBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  
  // Quick coupons en overview
  quickCoupon: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
  },
  quickCouponIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickCouponName: { fontSize: 11, color: COLORS.text, marginTop: 6, textAlign: 'center' },
  quickCouponValue: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 2 },

  // Level coupons (mini)
  levelCouponsSection: {
    marginTop: 18,
    marginBottom: 8,
  },
  levelCouponsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 16,
    marginBottom: 8,
  },
  levelCouponMini: {
    width: 120,
    height: 100,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  levelCouponMiniLocked: {
    opacity: 0.6,
    backgroundColor: '#fafafa',
  },
  miniIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  miniLevel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  
  // Contenedor principal
  couponsContainer: { paddingTop: SPACING.md },
  
  // Header stats
  couponsHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: 16,
    padding: SPACING.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  couponsStat: { alignItems: 'center' },
  couponsStatValue: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  couponsStatLabel: { fontSize: 12, color: COLORS.textSecondary },
  couponsDivider: { width: 1, height: 50, backgroundColor: COLORS.border },
  
  // Filtros
  couponsFilters: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: 8,
  },
  couponFilterChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  couponFilterChipActive: { backgroundColor: COLORS.primary },
  couponFilterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  couponFilterTextActive: { color: '#FFFFFF' },
  
  // Lista de cupones
  couponsList: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  
  // Card de cupón
  couponCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  couponCardExpired: { opacity: 0.6 },
  couponCardUsed: { opacity: 0.7 },
  couponLeft: {
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  couponValue: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, marginBottom: 4 },
  couponPerf: {
    width: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  couponPerfDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.background,
  },
  couponRight: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  couponName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  couponNameDisabled: { color: COLORS.textTertiary },
  couponMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  couponCategoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  couponCategoryText: { fontSize: 11, fontWeight: '600' },
  couponMinPurchase: { fontSize: 11, color: COLORS.textSecondary },
  couponStatus: { marginTop: 8 },
  usedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  usedText: { fontSize: 12, color: '#8E8E93' },
  expiredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expiredText: { fontSize: 12, color: '#FF3B30' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeText: { fontSize: 12, color: '#34C759' },
  
  // Empty state
  emptyCoupons: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  emptyCouponsTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.md, textAlign: 'center' },
  emptyCouponsText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  howToEarn: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    width: '100%',
  },
  howToEarnTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  howToEarnItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  howToEarnText: { fontSize: 14, color: COLORS.textSecondary },
  noCouponsText: { fontSize: 14, color: COLORS.textTertiary, textAlign: 'center', paddingVertical: SPACING.lg },
  
  // Próxima recompensa
  nextRewardSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  nextRewardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  nextRewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
  },
  nextRewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextRewardInfo: { flex: 1, marginLeft: SPACING.sm },
  nextRewardName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  nextRewardXP: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
});

export default RewardsScreen;
