import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReadOnlyStarRating = ({ rating, size = 16, color = "#ffc107" }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? 'star' : 'star-outline'}
        size={size}
        color={color}
      />
    ))}
  </View>
);

export default ReadOnlyStarRating;