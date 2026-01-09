import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import Constants from 'expo-constants';

import {
  MERCHANT_LEVEL_TIERS,
  MERCHANT_LEVELS,
  MERCHANT_REWARDS,
  REWARD_CATEGORIES,
  getMerchantLevelFromXP,
  getNextMerchantLevel,
  getMerchantLevelProgress,
  getAvailableRewards,
  getLevelRewards,
} from '../src/constants/merchantGamification';

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';
const { width } = Dimensions.get('window');

const MerchantRewardsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Merchant data
  const [merchantXP, setMerchantXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(MERCHANT_LEVELS[0]);
  const [nextLevel, setNextLevel] = useState(null);
  const [progress, setProgress] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Animations
  const progressAnim = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchMerchantData = useCallback(async () => {
    let totalXP = 0;
    let claimed = [];
    try {
      // Profile (optional)
      try {
        await api.get('/profiles/me');
      } catch (pErr) {
        const url = pErr.response?.config?.url || '/profiles/me';
        const status = pErr.response?.status;
        if (status === 404) {
          console.warn(`Profile endpoint not found (404): ${url}`);
        } else {
          console.warn('Profile fetch error:', url, status, pErr.message || pErr);
        }
      }

      // Orders for XP calculation (graceful on 404)
      try {
        const ordersRes = await api.get('/orders/mystoreorders');
        if (ordersRes?.data) {
          const orders = ordersRes.data;
          const completedOrders = orders.filter(o => o.estado === 'recogido');
          completedOrders.forEach(order => {
            const orderXP = Math.floor(parseFloat(order.total || 0));
            totalXP += orderXP;
          });
        }
      } catch (oErr) {
        const url = oErr.response?.config?.url || '/orders/mystoreorders';
        const status = oErr.response?.status;
        if (status === 404) {
          console.warn(`Orders endpoint not found (404): ${url}`);
        } else {
          console.warn('Error fetching orders:', url, status, oErr.message || oErr);
        }
      }

      // Reviews for bonus XP (graceful on 404)
      try {
        const reviewsRes = await api.get('/reviews/mystore');
        if (reviewsRes?.data) {
          const reviews = reviewsRes.data;
          reviews.forEach(review => {
            if (review.calificacion === 5) totalXP += 50;
            else if (review.calificacion === 4) totalXP += 25;
          });
        }
      } catch (rErr) {
        const url = rErr.response?.config?.url || '/reviews/mystore';
        const status = rErr.response?.status;
        if (status === 404) {
          console.warn(`Reviews endpoint not found (404): ${url}`);
        } else {
          console.warn('Error fetching reviews:', url, status, rErr.message || rErr);
        }
      }

      // Load claimed rewards from storage
      try {
        const savedClaimed = await AsyncStorage.getItem('merchant_claimed_rewards');
        claimed = savedClaimed ? JSON.parse(savedClaimed) : [];
      } catch (sErr) {
        console.warn('Error reading claimed rewards from storage:', sErr.message || sErr);
      }

      setMerchantXP(totalXP);
      const level = getMerchantLevelFromXP(totalXP);
      setCurrentLevel(level);
      setNextLevel(getNextMerchantLevel(level));
      setProgress(getMerchantLevelProgress(totalXP, level));
      setClaimedRewards(claimed);

      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: getMerchantLevelProgress(totalXP, level) / 100,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

    } catch (err) {
      console.error('Unexpected error fetching merchant rewards:', err);
      if (err.response?.status === 401) {
        setError('Sesión expirada');
      } else {
        setError(err.message || 'Error al cargar datos');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchantData();
  }, [fetchMerchantData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMerchantData();
  }, [fetchMerchantData]);

  const handleClaimReward = async (rewardId) => {
    // In real app, this would call an API
    const newClaimed = [...claimedRewards, rewardId];
    setClaimedRewards(newClaimed);
    await AsyncStorage.setItem('merchant_claimed_rewards', JSON.stringify(newClaimed));
    
    // Show success feedback
    alert('¡Recompensa reclamada! Nos pondremos en contacto contigo para coordinar tu premio.');
  };

  const getTierInfo = (tierKey) => MERCHANT_LEVEL_TIERS[tierKey] || MERCHANT_LEVEL_TIERS.STARTER;

  const renderLevelCard = () => {
    const tierInfo = getTierInfo(currentLevel.tier);
    const nextTierInfo = nextLevel ? getTierInfo(nextLevel.tier) : null;

    return (
      <View style={[styles.levelCard, { borderColor: tierInfo.color }]}>
        <View style={styles.levelHeader}>
          <View style={[styles.tierBadge, { backgroundColor: tierInfo.color }]}>
            <Ionicons name={tierInfo.icon} size={28} color="#fff" />
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>{currentLevel.title}</Text>
            <Text style={styles.levelSubtitle}>Nivel {currentLevel.level}</Text>
          </View>
          <View style={styles.xpContainer}>
            <Text style={styles.xpValue}>{merchantXP.toLocaleString()}</Text>
            <Text style={styles.xpLabel}>XP Total</Text>
          </View>
        </View>

        <Text style={styles.levelDescription}>{currentLevel.description}</Text>

        {nextLevel && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progreso al siguiente nivel</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: nextTierInfo?.color || tierInfo.color,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]} 
              />
            </View>
            <View style={styles.progressFooter}>
              <Text style={styles.progressText}>
                {merchantXP.toLocaleString()} / {nextLevel.xpRequired.toLocaleString()} XP
              </Text>
              <View style={styles.nextLevelBadge}>
                <Ionicons name={nextTierInfo?.icon || 'medal'} size={14} color={nextTierInfo?.color} />
                <Text style={[styles.nextLevelText, { color: nextTierInfo?.color }]}>
                  {nextLevel.title}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderCategoryTabs = () => {
    const categories = [
      { key: 'all', name: 'Todos', icon: 'apps' },
      ...Object.entries(REWARD_CATEGORIES).map(([key, value]) => ({
        key,
        ...value,
      })),
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryTab,
              selectedCategory === cat.key && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Ionicons 
              name={cat.icon} 
              size={18} 
              color={selectedCategory === cat.key ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === cat.key && styles.categoryTextActive,
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderRewardItem = (reward, levelRequired) => {
    const isUnlocked = currentLevel.level >= levelRequired;
    const isClaimed = claimedRewards.includes(reward.id);
    const category = REWARD_CATEGORIES[reward.type];

    return (
      <View 
        key={reward.id} 
        style={[
          styles.rewardItem,
          !isUnlocked && styles.rewardItemLocked,
          isClaimed && styles.rewardItemClaimed,
        ]}
      >
        <View style={[
          styles.rewardIcon,
          { backgroundColor: isUnlocked ? (category?.color || '#007AFF') + '20' : '#f0f0f0' },
        ]}>
          {isUnlocked ? (
            <Ionicons 
              name={reward.icon} 
              size={24} 
              color={category?.color || '#007AFF'} 
            />
          ) : (
            <Ionicons name="lock-closed" size={24} color="#ccc" />
          )}
        </View>
        
        <View style={styles.rewardContent}>
          <View style={styles.rewardHeader}>
            <Text style={[styles.rewardName, !isUnlocked && styles.rewardNameLocked]}>
              {reward.name}
            </Text>
            {isClaimed && (
              <View style={styles.claimedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.claimedText}>Reclamado</Text>
              </View>
            )}
          </View>
          
          {reward.description && (
            <Text style={[styles.rewardDescription, !isUnlocked && styles.rewardDescLocked]}>
              {reward.description}
            </Text>
          )}
          
          <View style={styles.rewardFooter}>
            <View style={[styles.categoryBadge, { backgroundColor: (category?.color || '#007AFF') + '20' }]}>
              <Text style={[styles.categoryBadgeText, { color: category?.color || '#007AFF' }]}>
                {category?.name || 'Premio'}
              </Text>
            </View>
            
            {!isUnlocked && (
              <Text style={styles.levelRequired}>Nivel {levelRequired}</Text>
            )}
          </View>
        </View>
        
        {isUnlocked && !isClaimed && reward.type !== 'badge' && (
          <TouchableOpacity 
            style={styles.claimButton}
            onPress={() => handleClaimReward(reward.id)}
          >
            <Text style={styles.claimButtonText}>Reclamar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRewardsByLevel = () => {
    // Filter rewards by category
    const filteredRewards = MERCHANT_REWARDS.map(levelGroup => ({
      ...levelGroup,
      rewards: selectedCategory === 'all' 
        ? levelGroup.rewards 
        : levelGroup.rewards.filter(r => r.type === selectedCategory),
    })).filter(levelGroup => levelGroup.rewards.length > 0);

    return filteredRewards.map((levelGroup) => {
      const levelInfo = MERCHANT_LEVELS.find(l => l.level === levelGroup.level);
      const tierInfo = levelInfo ? getTierInfo(levelInfo.tier) : getTierInfo('STARTER');
      const isUnlocked = currentLevel.level >= levelGroup.level;

      return (
        <View key={levelGroup.level} style={styles.levelGroup}>
          <View style={styles.levelGroupHeader}>
            <View style={[
              styles.levelGroupBadge, 
              { backgroundColor: isUnlocked ? tierInfo.color : '#ccc' }
            ]}>
              <Ionicons 
                name={isUnlocked ? tierInfo.icon : 'lock-closed'} 
                size={16} 
                color="#fff" 
              />
            </View>
            <Text style={[
              styles.levelGroupTitle,
              !isUnlocked && styles.levelGroupTitleLocked,
            ]}>
              Nivel {levelGroup.level} - {levelInfo?.title || 'Desconocido'}
            </Text>
            {!isUnlocked && (
              <Text style={styles.levelGroupXP}>
                {levelInfo?.xpRequired.toLocaleString() || 0} XP
              </Text>
            )}
          </View>
          
          {levelGroup.rewards.map(reward => renderRewardItem(reward, levelGroup.level))}
        </View>
      );
    });
  };

  const renderHowItWorks = () => (
    <View style={styles.howItWorks}>
      <Text style={styles.howItWorksTitle}>¿Cómo funciona?</Text>
      <View style={styles.howItWorksGrid}>
        <View style={styles.howItWorksItem}>
          <View style={[styles.howItWorksIcon, { backgroundColor: '#34C75920' }]}>
            <Ionicons name="cart" size={24} color="#34C759" />
          </View>
          <Text style={styles.howItWorksLabel}>Vende</Text>
          <Text style={styles.howItWorksDesc}>$10 = 10 XP</Text>
        </View>
        <View style={styles.howItWorksItem}>
          <View style={[styles.howItWorksIcon, { backgroundColor: '#FFD70020' }]}>
            <Ionicons name="star" size={24} color="#FFD700" />
          </View>
          <Text style={styles.howItWorksLabel}>5 Estrellas</Text>
          <Text style={styles.howItWorksDesc}>+50 XP</Text>
        </View>
        <View style={styles.howItWorksItem}>
          <View style={[styles.howItWorksIcon, { backgroundColor: '#007AFF20' }]}>
            <Ionicons name="trophy" size={24} color="#007AFF" />
          </View>
          <Text style={styles.howItWorksLabel}>Sube Nivel</Text>
          <Text style={styles.howItWorksDesc}>Gana Premios</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Cargando recompensas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMerchantData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Recompensas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderLevelCard()}
          {renderHowItWorks()}
          {renderCategoryTabs()}
          
          <View style={styles.rewardsSection}>
            <Text style={styles.rewardsSectionTitle}>Premios por Nivel</Text>
            {renderRewardsByLevel()}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Level Card
  levelCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  levelSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  xpValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F97316',
  },
  xpLabel: {
    fontSize: 12,
    color: '#999',
  },
  levelDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
  },
  nextLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextLevelText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // How it works
  howItWorks: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  howItWorksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  howItWorksItem: {
    alignItems: 'center',
    flex: 1,
  },
  howItWorksIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  howItWorksLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  howItWorksDesc: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },

  // Category tabs
  categoryScroll: {
    marginBottom: 8,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryTabActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  categoryText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Rewards section
  rewardsSection: {
    padding: 16,
  },
  rewardsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  levelGroup: {
    marginBottom: 24,
  },
  levelGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelGroupBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  levelGroupTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  levelGroupTitleLocked: {
    color: '#999',
  },
  levelGroupXP: {
    fontSize: 13,
    color: '#999',
  },

  // Reward item
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  rewardItemLocked: {
    opacity: 0.6,
    backgroundColor: '#fafafa',
  },
  rewardItemClaimed: {
    borderColor: '#34C759',
    backgroundColor: '#34C75908',
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardContent: {
    flex: 1,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  rewardNameLocked: {
    color: '#999',
  },
  rewardDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  rewardDescLocked: {
    color: '#aaa',
  },
  rewardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  levelRequired: {
    fontSize: 11,
    color: '#999',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  claimedText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 4,
    fontWeight: '500',
  },
  claimButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default MerchantRewardsScreen;
