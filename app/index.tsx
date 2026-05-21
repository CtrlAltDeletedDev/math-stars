import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { CategoryCard } from '@/components/home/CategoryCard';
import { StarBadge } from '@/components/ui/StarBadge';
import { useProgress } from '@/store/useProgress';
import { CATEGORIES } from '@/data/categories';
import { Category } from '@/types';
import { getCharacterEmoji } from '@/data/characters';
import { getTheme } from '@/data/shop';

export default function HomeScreen() {
  const router = useRouter();
  const { progress, isLoaded } = useProgress();

  useEffect(() => {
    if (isLoaded && !progress.characterId) {
      router.replace('/character-select');
    }
  }, [isLoaded, progress.characterId]);

  const theme = getTheme(progress.activeTheme);
  const characterDisplay = progress.characterId
    ? getCharacterEmoji(progress.characterId, progress.totalStars)
    : '⭐';

  if (!isLoaded || !progress.characterId) return null;

  return (
    <BackgroundGradient colors={theme.colors}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/character-select')} style={styles.charBtn}>
          <Text style={styles.charEmoji}>{characterDisplay}</Text>
        </Pressable>
        <Text style={styles.title}>Math Stars!</Text>
        <StarBadge count={progress.totalStars} />
      </View>

      {progress.currentStreak >= 2 && (
        <Text style={styles.streak}>
          {'🔥'.repeat(Math.min(progress.currentStreak, 7))} {progress.currentStreak} day streak!
        </Text>
      )}

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            progress={progress.categories[item.id]}
            onPress={() => router.push(`/category/${item.id}`)}
          />
        )}
      />

      <View style={styles.footer}>
        <Pressable style={styles.footerBtn} onPress={() => router.push('/badges')}>
          <Text style={styles.footerBtnText}>🏅 Badges</Text>
          <Text style={styles.footerBtnSub}>{progress.earnedBadges.length} earned</Text>
        </Pressable>
        <Pressable style={styles.footerBtn} onPress={() => router.push('/shop')}>
          <Text style={styles.footerBtnText}>🛍️ Shop</Text>
          <Text style={styles.footerBtnSub}>⭐ {progress.spendableStars} to spend</Text>
        </Pressable>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  charBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charEmoji: { fontSize: 36 },
  title: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 28,
    color: '#fff',
  },
  streak: {
    fontFamily: 'Nunito-Bold',
    fontSize: 17,
    color: '#fff',
    textAlign: 'center',
    paddingBottom: 4,
  },
  grid: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 14,
  },
  row: { gap: 14 },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  footerBtnText: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 18,
    color: '#fff',
  },
  footerBtnSub: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
});
