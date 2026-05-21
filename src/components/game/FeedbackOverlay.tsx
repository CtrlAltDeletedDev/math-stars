import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';

interface Props {
  visible: boolean;
  correct: boolean;
  onDismiss: () => void;
}

export function FeedbackOverlay({ visible, correct, onDismiss }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withSequence(
        withSpring(1.15, { damping: 5, stiffness: 400 }),
        withSpring(1.0, { damping: 12, stiffness: 200 }),
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Pressable style={styles.backdrop} onPress={onDismiss}>
      <Animated.View
        style={[
          styles.bubble,
          { backgroundColor: correct ? COLORS.correct : COLORS.wrong },
          containerStyle,
        ]}
      >
        <Text style={styles.icon}>{correct ? '🌟' : '💪'}</Text>
        <Text style={styles.text}>{correct ? 'Great job!' : 'Try again soon!'}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bubble: {
    borderRadius: 32,
    paddingHorizontal: 40,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  icon: {
    fontSize: 64,
  },
  text: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 32,
    color: '#fff',
  },
});
