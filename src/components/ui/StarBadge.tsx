import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

interface Props {
  count: number;
  size?: number;
}

export function StarBadge({ count, size = 28 }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1.3, { damping: 4, stiffness: 400 }, () => {
      scale.value = withSpring(1.0);
    });
  }, [count]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <Text style={[styles.text, { fontSize: size }]}>⭐ {count}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    fontFamily: 'Nunito-ExtraBold',
    color: '#fff',
  },
});
