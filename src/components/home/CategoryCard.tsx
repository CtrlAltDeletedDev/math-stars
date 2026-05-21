import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Category, CategoryProgress } from '@/types';

interface Props {
  category: Category;
  progress: CategoryProgress | undefined;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CategoryCard({ category, progress, onPress }: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const totalLevels = 0;
  const completedLevels = progress
    ? Object.values(progress.levels).filter((l) => l.status === 'completed').length
    : 0;
  const stars = progress?.totalStarsEarned ?? 0;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1.0); }}
      style={[styles.card, { backgroundColor: category.bgColor }, animStyle]}
    >
      <Text style={styles.emoji}>{category.emoji}</Text>
      <Text style={styles.title}>{category.title}</Text>
      {stars > 0 && (
        <View style={styles.starRow}>
          <Text style={styles.stars}>⭐ {stars}</Text>
        </View>
      )}
      {completedLevels > 0 && (
        <Text style={styles.levels}>{completedLevels} levels done!</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  starRow: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  stars: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: '#fff',
  },
  levels: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
});
