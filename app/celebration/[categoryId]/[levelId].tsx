import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { BigButton } from '@/components/ui/BigButton';
import { calculateStars, didPassLevel } from '@/engine/scoring';
import { getCategoryById, getLevelById } from '@/data/categories';
import { useProgress } from '@/store/useProgress';

function AnimatedStar({ delay, earned }: { delay: number; earned: boolean }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.4, { damping: 4, stiffness: 300 }),
        withSpring(1.0, { damping: 10, stiffness: 200 }),
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Text style={[styles.star, !earned && styles.starEmpty]}>
        {earned ? '⭐' : '☆'}
      </Text>
    </Animated.View>
  );
}

export default function CelebrationScreen() {
  const { categoryId, levelId, correct, total } = useLocalSearchParams<{
    categoryId: string;
    levelId: string;
    correct: string;
    total: string;
  }>();
  const router = useRouter();
  const { progress } = useProgress();

  const correctCount = Number(correct ?? 0);
  const totalCount = Number(total ?? 10);
  const score = totalCount > 0 ? correctCount / totalCount : 0;
  const stars = calculateStars(score);
  const passed = didPassLevel(score);

  const category = getCategoryById(categoryId);
  const level = getLevelById(levelId);

  const titleScale = useSharedValue(0);
  useEffect(() => {
    titleScale.value = withSequence(
      withSpring(1.2, { damping: 4, stiffness: 300 }),
      withSpring(1.0, { damping: 10 }),
    );
  }, []);
  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  const bgColors: [string, string] = category
    ? [category.bgColor, category.darkColor]
    : ['#FFD700', '#FFA000'];

  const levelProgress = progress.categories[categoryId]?.levels[levelId];
  const nextLevelUnlocked = passed && levelProgress?.status === 'completed';

  function handlePlayAgain() {
    router.replace(`/game/${categoryId}/${levelId}`);
  }

  function handleHome() {
    router.replace('/');
  }

  return (
    <BackgroundGradient colors={bgColors}>
      <View style={styles.container}>
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>
            {passed ? '🎉 Level Complete!' : '💪 Good Try!'}
          </Text>
        </Animated.View>

        <View style={styles.starsRow}>
          <AnimatedStar delay={300} earned={stars >= 1} />
          <AnimatedStar delay={600} earned={stars >= 2} />
          <AnimatedStar delay={900} earned={stars >= 3} />
        </View>

        <Text style={styles.score}>
          {correctCount} / {totalCount} correct!
        </Text>
        <Text style={styles.percent}>{Math.round(score * 100)}%</Text>

        {passed && nextLevelUnlocked && (
          <View style={styles.unlockBadge}>
            <Text style={styles.unlockText}>🔓 Next level unlocked!</Text>
          </View>
        )}

        {!passed && (
          <Text style={styles.encouragement}>
            Get 8 out of 10 to unlock the next level!
          </Text>
        )}

        <View style={styles.buttons}>
          <BigButton
            label="Play Again 🔄"
            onPress={handlePlayAgain}
            color="#fff"
            textColor="#2D3436"
            style={styles.btn}
          />
          <BigButton
            label="Home 🏠"
            onPress={handleHome}
            color="rgba(255,255,255,0.3)"
            textColor="#fff"
            style={styles.btn}
          />
        </View>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 40,
    color: '#fff',
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  star: {
    fontSize: 56,
  },
  starEmpty: {
    opacity: 0.4,
  },
  score: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 36,
    color: '#fff',
  },
  percent: {
    fontFamily: 'Nunito-Bold',
    fontSize: 22,
    color: 'rgba(255,255,255,0.85)',
  },
  unlockBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  unlockText: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 22,
    color: '#fff',
  },
  encouragement: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  btn: {
    width: '80%',
    minHeight: 64,
  },
});
