import React from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const source = require('../assets/burguer2-login.mp4');

export default function AuthVideoBackground() {
  const { width, height } = useWindowDimensions();
  const player = useVideoPlayer(source, video => {
    video.muted = true;
    video.loop = true;
    video.play();
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit={Platform.OS === 'web' && width > height ? 'contain' : 'cover'}
        nativeControls={false}
        {...(Platform.OS === 'android' ? { surfaceType: 'textureView' } : {})}
      />
      <View style={styles.scrim} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(22, 12, 7, 0.55)' },
});
