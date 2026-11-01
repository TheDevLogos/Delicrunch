import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { FOOD_ICON_ATLAS, getCanonicalCategory } from '../src/constants/categories';

const resolveArtwork = (category) => {
  const suppliedKey = typeof category === 'object'
    ? category?.foodIcon || category?.iconKey
    : category;
  const categoryRecord = typeof category === 'object'
    ? category
    : getCanonicalCategory(category);
  const key = suppliedKey || categoryRecord?.foodIcon;
  const index = FOOD_ICON_ATLAS.artworkByKey[key];
  return Number.isInteger(index) ? index : -1;
};

const FoodCategoryIcon = ({ category, size = 56, style, backgroundColor = '#FFF0E5' }) => {
  const index = resolveArtwork(category);
  if (index < 0) return null;

  const columns = FOOD_ICON_ATLAS.columns;
  const tileAspectRatio = FOOD_ICON_ATLAS.tileAspectRatio;
  const column = index % columns;
  const row = Math.floor(index / columns);
  const cellHeight = size / tileAspectRatio;
  const imageRows = Math.ceil(Object.keys(FOOD_ICON_ATLAS.artworkByKey).length / columns);

  return (
    <View
      accessible={false}
      style={[
        styles.frame,
        { width: size, height: size, borderRadius: Math.round(size * 0.32), backgroundColor },
        style,
      ]}
    >
      <Image
        source={require('../assets/food-category-atlas.png')}
        resizeMode="stretch"
        style={{
          position: 'absolute',
          width: size * columns,
          height: cellHeight * imageRows,
          left: -column * size,
          top: (size - cellHeight) / 2 - row * cellHeight,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FoodCategoryIcon;
