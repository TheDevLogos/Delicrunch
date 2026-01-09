/**
 * AvatarIconPicker - Selector de iconos de avatar estilo Neo Brutalism
 * 30 iconos creativos para personalizar el perfil
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { 
  PROFILE_AVATARS, 
  AVATAR_CATEGORIES, 
  getAvatarsByCategory 
} from '../src/constants/profileAvatars';
import { COLORS, SPACING } from '../src/constants/theme';

const { width } = Dimensions.get('window');
const ICON_SIZE = (width - 80) / 5; // 5 iconos por fila

const AvatarIconPicker = ({ 
  visible, 
  onClose, 
  onSelect, 
  currentAvatarId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatarId);

  const avatars = getAvatarsByCategory(selectedCategory);

  const handleSelect = (avatar) => {
    setSelectedAvatar(avatar.id);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
    }
    onClose();
  };

  const renderIcon = (avatar) => {
    const IconComponent = avatar.iconSet === 'material' 
      ? MaterialCommunityIcons 
      : Ionicons;
    
    return (
      <IconComponent 
        name={avatar.icon} 
        size={32} 
        color={avatar.color} 
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Elige tu Avatar</Text>
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={handleConfirm}
            >
              <Text style={styles.confirmText}>Listo</Text>
            </TouchableOpacity>
          </View>

          {/* Categorías */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
          >
            {AVATAR_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryTab,
                  selectedCategory === cat.id && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons 
                  name={cat.icon} 
                  size={18} 
                  color={selectedCategory === cat.id ? '#fff' : '#666'} 
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Grid de iconos */}
          <ScrollView 
            style={styles.iconsScroll}
            contentContainerStyle={styles.iconsContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconsGrid}>
              {avatars.map((avatar) => {
                const isSelected = selectedAvatar === avatar.id;
                
                return (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[
                      styles.avatarItem,
                      { backgroundColor: avatar.backgroundColor },
                      isSelected && styles.avatarItemSelected,
                    ]}
                    onPress={() => handleSelect(avatar)}
                    activeOpacity={0.7}
                  >
                    {renderIcon(avatar)}
                    
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Preview del avatar seleccionado */}
            {selectedAvatar && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Vista previa</Text>
                <View style={styles.previewRow}>
                  {(() => {
                    const avatar = PROFILE_AVATARS.find(a => a.id === selectedAvatar);
                    if (!avatar) return null;
                    const IconComp = avatar.iconSet === 'material' 
                      ? MaterialCommunityIcons 
                      : Ionicons;
                    
                    return (
                      <>
                        <View style={[
                          styles.previewAvatar,
                          { backgroundColor: avatar.backgroundColor },
                        ]}>
                          <IconComp 
                            name={avatar.icon} 
                            size={48} 
                            color={avatar.color} 
                          />
                        </View>
                        <View style={styles.previewInfo}>
                          <Text style={styles.previewName}>{avatar.label}</Text>
                          <Text style={styles.previewCategory}>
                            {AVATAR_CATEGORIES.find(c => c.id === avatar.category)?.label || 'Otro'}
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryScroll: {
    maxHeight: 56,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: '#1a1a1a',
  },
  categoryText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  iconsScroll: {
    flex: 1,
  },
  iconsContainer: {
    padding: 16,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  avatarItem: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    borderWidth: 3,
    borderColor: 'transparent',
    // Neo Brutalism
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 3,
  },
  avatarItemSelected: {
    borderColor: '#1a1a1a',
    transform: [{ scale: 1.05 }],
  },
  selectedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  previewContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  previewLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a1a1a',
    // Neo Brutalism shadow
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  previewInfo: {
    marginLeft: 16,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  previewCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default AvatarIconPicker;
