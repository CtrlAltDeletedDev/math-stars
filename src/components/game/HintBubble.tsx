import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

interface Props {
  hint: string;
  visible: boolean;
}

export function HintBubble({ hint, visible }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      opacity.value = withSpring(1);
    } else {
      scale.value = withSpring(0);
      opacity.value = withSpring(0);
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.bubble, animStyle]}>
      <Text style={styles.label}>💡 Hint</Text>
      <Text style={styles.text}>{hint}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: '#FFF9C4',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 8,
    gap: 4,
    borderWidth: 2,
    borderColor: '#F9CA24',
  },
  label: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 16,
    color: '#E55039',
  },
  text: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: '#2D3436',
  },
});
