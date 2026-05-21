import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';

interface Props {
  visible: boolean;
  correct: boolean;
  onDismiss: () => void;
  characterEmoji?: string;
}

export function FeedbackOverlay({ visible, correct, onDismiss, characterEmoji }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const charScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withSequence(
        withSpring(1.15, { damping: 5, stiffness: 400 }),
        withSpring(1.0, { damping: 12, stiffness: 200 }),
      );
      if (correct && characterEmoji) {
        charScale.value = withSequence(
          withSpring(1.5, { damping: 4, stiffness: 300 }),
          withSpring(1.0, { damping: 10 }),
        );
      }
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const charStyle = useAnimatedStyle(() => ({
    transform: [{ scale: charScale.value }],
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
        {characterEmoji && correct ? (
          <Animated.Text style={[styles.characterEmoji, charStyle]}>{characterEmoji}</Animated.Text>
        ) : null}
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
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  characterEmoji: { fontSize: 52 },
  icon: { fontSize: 56 },
  text: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 32,
    color: '#fff',
  },
});
